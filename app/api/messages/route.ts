import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { normalizeUrl } from '../../../lib/urlNormalize';
import { keywordsFromUrl } from '../../../lib/keywordExtract';
import { scoreSemanticResurface, scoreFallbackResurface } from '../../../lib/resurfaceScore';
import { embedText, buildEmbedInput, isEmbeddingEnabled } from '../../../lib/embeddings';

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const BOT_NAME = 'LockIn Bot';
const TRIGGER_PHRASES = ['that link', 'send link', 'what was the', 'the screenshot'];
const SEMANTIC_THRESHOLD = 0.75;

function extractUrls(text: string) {
  return text.match(URL_REGEX) ?? [];
}

function shouldTriggerResurface(message: string) {
  const lower = message.toLowerCase();
  return TRIGGER_PHRASES.some((phrase) => lower.includes(phrase));
}

export async function GET() {
  const messages = await prisma.message.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const { user, text } = await request.json();
  const message = await prisma.message.create({
    data: {
      user,
      text
    }
  });

  const urls = extractUrls(text);
  const sharedIds: string[] = [];
  const duplicates: { url: string; sharedBy: string | null; daysAgo: number }[] = [];
  for (const rawUrl of urls) {
    const normalized = normalizeUrl(rawUrl);
    const existing = await prisma.sharedItem.findUnique({
      where: { canonicalKey: normalized }
    });
    if (existing) {
      sharedIds.push(existing.id);
      const daysAgo = Math.round(
        (Date.now() - existing.firstSharedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      duplicates.push({ url: normalized, sharedBy: existing.sharedBy, daysAgo });
      await prisma.sharedItem.update({
        where: { id: existing.id },
        data: {
          shareCount: { increment: 1 },
          lastSharedAt: new Date()
        }
      });
    } else {
      const keywords = keywordsFromUrl(normalized);
      const embeddingInput = buildEmbedInput({
        url: normalized,
        title: normalized,
        keywords,
        messageText: text
      });
      const embedding = await embedText(embeddingInput);

      const created = await prisma.sharedItem.create({
        data: {
          type: 'link',
          canonicalKey: normalized,
          url: normalized,
          title: normalized,
          sharedBy: user,
          keywords: JSON.stringify(keywords),
          embedding: embedding ? JSON.stringify(embedding) : null,
          lastSharedAt: new Date(),
          firstSharedAt: new Date(),
          shareCount: 1
        }
      });
      sharedIds.push(created.id);
    }
  }

  if (sharedIds.length > 0) {
    await prisma.message.update({
      where: { id: message.id },
      data: {
        text: `${text} ${sharedIds.map((id) => `[[shared:${id}]]`).join(' ')}`
      }
    });
  }

  // --- Duplicate detection ---
  for (const dup of duplicates) {
    const who = dup.sharedBy && dup.sharedBy !== user ? dup.sharedBy : 'someone';
    const when = dup.daysAgo === 0 ? 'earlier today' : dup.daysAgo === 1 ? 'yesterday' : `${dup.daysAgo} days ago`;
    await prisma.message.create({
      data: {
        user: BOT_NAME,
        text: `Heads up — ${who} already shared this link ${when}!`,
        isBot: true
      }
    });
  }

  // --- /recap command ---
  if (text.trim().toLowerCase() === '/recap') {
    const allItems = await prisma.sharedItem.findMany({
      orderBy: { lastSharedAt: 'desc' },
      take: 10
    });
    if (allItems.length === 0) {
      await prisma.message.create({
        data: { user: BOT_NAME, text: 'Nothing has been shared yet!', isBot: true }
      });
    } else {
      const lines = allItems.map((item, i) => {
        const label = item.type === 'image'
          ? `Image: ${item.title ?? 'untitled'}`
          : `Link: ${item.url ?? item.title ?? 'untitled'}`;
        const shares = item.shareCount > 1 ? ` (shared ${item.shareCount}x)` : '';
        const by = item.sharedBy ? ` — by ${item.sharedBy}` : '';
        return `${i + 1}. ${label}${shares}${by}`;
      });
      await prisma.message.create({
        data: {
          user: BOT_NAME,
          text: `Here's a recap of recent shared items:\n${lines.join('\n')}`,
          isBot: true
        }
      });
    }
    return NextResponse.json(message);
  }

  // --- Resurfacing logic ---
  const sharedItems = await prisma.sharedItem.findMany({
    orderBy: { lastSharedAt: 'desc' },
    take: 50
  });

  let topMatch: { id: string; score: number } | null = null;

  if (isEmbeddingEnabled()) {
    // Semantic path: embed the query and compare
    const queryEmbedding = await embedText(text);

    for (const item of sharedItems) {
      const score = scoreSemanticResurface(queryEmbedding, item.embedding);
      if (score !== null && (!topMatch || score > topMatch.score)) {
        topMatch = { id: item.id, score };
      }
    }

    // Apply semantic threshold
    if (topMatch && topMatch.score < SEMANTIC_THRESHOLD) {
      topMatch = null;
    }
  } else {
    // Fallback path: keyword + recency heuristic
    const lowerText = text.toLowerCase();
    for (const item of sharedItems) {
      const keywords: string[] = JSON.parse((item.keywords as string) ?? '[]');
      const score = scoreFallbackResurface({
        keywords,
        message: lowerText,
        shareCount: item.shareCount,
        lastSharedAt: item.lastSharedAt
      });
      if (!topMatch || score > topMatch.score) {
        topMatch = { id: item.id, score };
      }
    }

    // Fallback threshold
    if (topMatch && topMatch.score < 4) {
      topMatch = null;
    }
  }

  const shouldResurface = shouldTriggerResurface(text) || topMatch !== null;

  if (shouldResurface && topMatch) {
    await prisma.sharedItem.update({
      where: { id: topMatch.id },
      data: { referenceCount: { increment: 1 } }
    });
    await prisma.message.create({
      data: {
        user: BOT_NAME,
        text: `Here's that item you asked for. [[shared:${topMatch.id}]]`,
        isBot: true
      }
    });
  }

  return NextResponse.json(message);
}
