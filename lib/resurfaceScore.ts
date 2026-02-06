import type { SharedItem } from "@prisma/client";
import { extractKeywordsFromText } from "./keywordExtract";

const TRIGGER_PHRASES = [
  "that link",
  "send link",
  "what was the",
  "the screenshot"
];

export function shouldTriggerResurface(text: string): boolean {
  const lowered = text.toLowerCase();
  return TRIGGER_PHRASES.some((phrase) => lowered.includes(phrase));
}

export function scoreSharedItem(
  item: SharedItem,
  messageText: string
): number {
  const messageKeywords = new Set(extractKeywordsFromText(messageText));
  const itemKeywords: string[] = JSON.parse(item.keywords ?? "[]");

  let overlap = 0;
  itemKeywords.forEach((keyword) => {
    if (messageKeywords.has(String(keyword).toLowerCase())) {
      overlap += 1;
    }
  });

  const hoursSinceShared =
    (Date.now() - new Date(item.lastSharedAt).getTime()) / 3600000;
  const recencyBoost = Math.max(0, 6 - hoursSinceShared) * 0.5;
  const shareBoost = Math.min(item.shareCount, 10) * 0.2;

  return overlap * 2 + recencyBoost + shareBoost;
}

export function findBestMatch(
  items: SharedItem[],
  messageText: string
): SharedItem | null {
  let best: SharedItem | null = null;
  let bestScore = 0;

  items.forEach((item) => {
    const score = scoreSharedItem(item, messageText);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  });

  if (bestScore >= 2) {
    return best;
  }

  return null;
}
