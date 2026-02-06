import { cosineSimilarity } from './embeddings';

/**
 * Score using cosine similarity between query and item embeddings.
 * Returns a value between 0 and 1, or null if embeddings are unavailable.
 */
export function scoreSemanticResurface(
  queryEmbedding: number[] | null,
  itemEmbedding: string | null
): number | null {
  if (!queryEmbedding || !itemEmbedding) return null;
  try {
    const parsed: number[] = JSON.parse(itemEmbedding);
    return cosineSimilarity(queryEmbedding, parsed);
  } catch {
    return null;
  }
}

/**
 * Fallback heuristic score based on keyword overlap, recency, and share count.
 * Used when embeddings are not available.
 */
export function scoreFallbackResurface({
  keywords,
  message,
  shareCount,
  lastSharedAt
}: {
  keywords: string[];
  message: string;
  shareCount: number;
  lastSharedAt: Date;
}) {
  const tokens = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const tokenSet = new Set(tokens);
  const overlap = keywords.filter((keyword) => tokenSet.has(keyword)).length;
  const daysAgo = (Date.now() - lastSharedAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.max(0, 5 - daysAgo);
  const shareBoost = Math.min(shareCount, 5);
  return overlap * 2 + recencyBoost + shareBoost;
}
