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
  for (const rawUrl of urls) {
    const normalized = normalizeUrl(rawUrl);
    const existing = await prisma.sharedItem.findUnique({
      where: { canonicalKey: normalized }
    });
    if (existing) {
      sharedIds.push(existing.id);
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
