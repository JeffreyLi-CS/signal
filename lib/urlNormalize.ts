const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid"
];

export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.protocol = "https:";
    TRACKING_PARAMS.forEach((param) => url.searchParams.delete(param));
    url.hash = "";
    const normalized = url.toString();
    return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
  } catch (error) {
    return rawUrl.trim();
  }
}

export function extractUrls(text: string): string[] {
  const regex = /https?:\/\/[^\s]+/gi;
  const matches = text.match(regex) ?? [];
  return matches.map((match) => match.replace(/[),.]+$/, ""));
}
