export function extractKeywords(input: string): string[] {
  const cleaned = input
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9\s/.-]/g, ' ')
    .replace(/[./-]/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  return Array.from(new Set(words.filter((word) => word.length > 2)));
}

export function keywordsFromUrl(url: string): string[] {
  try {
    const parsed = new URL(url);
    const domainParts = parsed.hostname.split('.').filter(Boolean);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    return extractKeywords([...domainParts, ...pathParts].join(' '));
  } catch {
    return extractKeywords(url);
  }
}
