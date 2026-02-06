const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid'
]);

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) ?? [];
}

export function normalizeUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    [...parsed.searchParams.keys()].forEach((key) => {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    });
    parsed.hash = '';
    const normalized = parsed.toString();
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  } catch {
    return url;
  }
}
