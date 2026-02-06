export function extractKeywordsFromUrl(urlString?: string, title?: string): string[] {
  const keywords = new Set<string>();
  if (urlString) {
    try {
      const url = new URL(urlString);
      keywords.add(url.hostname.replace("www.", ""));
      url.pathname
        .split("/")
        .filter(Boolean)
        .forEach((segment) => {
          segment
            .split(/[-_]/)
            .filter(Boolean)
            .forEach((word) => keywords.add(word.toLowerCase()));
        });
    } catch (error) {
      // ignore
    }
  }

  if (title) {
    title
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2)
      .forEach((word) => keywords.add(word));
  }

  return Array.from(keywords);
}

export function extractKeywordsFromText(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2);
}
