import { PrismaClient } from '@prisma/client';
import { normalizeUrl } from '../lib/urlNormalize';
import { keywordsFromUrl } from '../lib/keywordExtract';
import { embedText, buildEmbedInput } from '../lib/embeddings';

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.sharedItem.deleteMany();

  const links: { url: string; user: string }[] = [
    { url: 'https://example.com/docs/lockin?utm_source=demo', user: 'Avery' },
    { url: 'https://news.ycombinator.com/item?id=1234', user: 'Jordan' },
    { url: 'https://github.com/vercel/next.js', user: 'Maya' }
  ];

  for (const link of links) {
    const normalized = normalizeUrl(link.url);
    const keywords = keywordsFromUrl(normalized);
    const embeddingInput = buildEmbedInput({
      url: normalized,
      title: normalized,
      keywords
    });
    const embedding = await embedText(embeddingInput);

    await prisma.sharedItem.create({
      data: {
        type: 'link',
        canonicalKey: normalized,
        url: normalized,
        title: normalized,
        sharedBy: link.user,
        keywords: JSON.stringify(keywords),
        embedding: embedding ? JSON.stringify(embedding) : null,
        lastSharedAt: new Date(),
        firstSharedAt: new Date(),
        shareCount: 1
      }
    });
  }

  await prisma.message.createMany({
    data: [
      { user: 'Avery', text: 'Just dropped the roadmap link: https://example.com/docs/lockin' },
      { user: 'Jordan', text: 'Found this thread on HN https://news.ycombinator.com/item?id=1234' },
      { user: 'Maya', text: 'Next.js repo is here https://github.com/vercel/next.js' }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
