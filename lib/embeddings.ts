const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings';
const EMBED_MODEL = 'text-embedding-3-small';

/**
 * Returns true if an OpenAI API key is configured.
 */
export function isEmbeddingEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Generate an embedding vector for the given text using OpenAI.
 * Returns null if the API key is missing or the request fails.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(OPENAI_EMBED_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: text.slice(0, 8000)
      })
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

/**
 * Compute cosine similarity between two vectors.
 * Returns 0 if either vector is empty or they differ in length.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Build a string suitable for embedding from item metadata.
 */
export function buildEmbedInput(parts: {
  url?: string | null;
  title?: string | null;
  keywords?: string[];
  fileName?: string | null;
  messageText?: string | null;
}): string {
  const segments: string[] = [];
  if (parts.messageText) segments.push(parts.messageText);
  if (parts.title) segments.push(parts.title);
  if (parts.url) segments.push(parts.url);
  if (parts.keywords?.length) segments.push(parts.keywords.join(' '));
  if (parts.fileName) segments.push(parts.fileName);
  return segments.join(' ').trim();
}
