import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractUrls, normalizeUrl } from "@/lib/urlNormalize";
import { extractKeywordsFromUrl } from "@/lib/keywordExtract";
import { findBestMatch, shouldTriggerResurface } from "@/lib/resurfaceScore";

export async function GET() {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "asc" },
    include: { sharedItem: true }
  });
  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const text = String(body.text ?? "").trim();
  const user = String(body.user ?? "Anonymous");

  if (!text) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      user,
      text
    }
  });

  const urls = extractUrls(text);
  for (const url of urls) {
    const normalized = normalizeUrl(url);
    const existing = await prisma.sharedItem.findUnique({
      where: { canonicalKey: normalized }
    });

    if (existing) {
      await prisma.sharedItem.update({
        where: { id: existing.id },
        data: {
          shareCount: { increment: 1 },
          lastSharedAt: new Date()
        }
      });
    } else {
      const keywords = extractKeywordsFromUrl(normalized);
      await prisma.sharedItem.create({
        data: {
          type: "link",
          canonicalKey: normalized,
          url: normalized,
          keywords: JSON.stringify(keywords),
          shareCount: 1,
          referenceCount: 0
        }
      });
    }
  }

  const sharedItems = await prisma.sharedItem.findMany();
  const bestMatch = findBestMatch(sharedItems, text);
  const triggerResurface = shouldTriggerResurface(text);
  const shouldResurface = Boolean(bestMatch) && (triggerResurface || bestMatch);
  let botMessage = null;

  if (bestMatch && shouldResurface) {
    const updated = await prisma.sharedItem.update({
      where: { id: bestMatch.id },
      data: { referenceCount: { increment: 1 } }
    });

    botMessage = await prisma.message.create({
      data: {
        user: "LockIn Bot",
        text: `Resurfacing: ${updated.title ?? updated.url ?? "Shared item"}`,
        isBot: true,
        sharedItemId: updated.id
      },
      include: { sharedItem: true }
    });
  }

  const responseMessage = await prisma.message.findUnique({
    where: { id: message.id },
    include: { sharedItem: true }
  });

  return NextResponse.json({ message: responseMessage, botMessage });
}
