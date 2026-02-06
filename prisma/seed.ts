import { PrismaClient } from '@prisma/client';
import { normalizeUrl } from '../lib/urlNormalize';
import { keywordsFromUrl } from '../lib/keywordExtract';

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.sharedItem.deleteMany();

  const links = [
    'https://example.com/docs/lockin?utm_source=demo',
    'https://news.ycombinator.com/item?id=1234',
    'https://github.com/vercel/next.js'
  ];

  for (const link of links) {
    const normalized = normalizeUrl(link);
    await prisma.sharedItem.create({
      data: {
        type: 'link',
        canonicalKey: normalized,
        url: normalized,
        title: normalized,
        keywords: JSON.stringify(keywordsFromUrl(normalized)),
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
