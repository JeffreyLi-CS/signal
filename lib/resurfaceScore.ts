export function scoreResurface({
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
