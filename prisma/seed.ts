import { PrismaClient } from "@prisma/client";
import { normalizeUrl } from "../lib/urlNormalize.ts";

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.sharedItem.deleteMany();

  const normalizedLink = normalizeUrl("https://example.com/product");
  const linkItem = await prisma.sharedItem.create({
    data: {
      type: "link",
      canonicalKey: normalizedLink,
      url: normalizedLink,
      title: "Example Product",
      keywords: JSON.stringify(["example", "product"]),
      shareCount: 2,
      referenceCount: 1,
      firstSharedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      lastSharedAt: new Date(Date.now() - 1000 * 60 * 20)
    }
  });

  const imageItem = await prisma.sharedItem.create({
    data: {
      type: "image",
      canonicalKey: "seed-image-1",
      imagePath: "/uploads/sample.png",
      keywords: JSON.stringify(["screenshot", "seed"]),
      shareCount: 1,
      referenceCount: 0,
      firstSharedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      lastSharedAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
    }
  });

  await prisma.message.createMany({
    data: [
      {
        user: "Ava",
        text: "Kicking off the LockIn demo. Here is the product link: https://example.com/product",
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        user: "Milo",
        text: "Nice! That link is solid.",
        createdAt: new Date(Date.now() - 1000 * 60 * 25)
      },
      {
        user: "Ava",
        text: "Screenshot drop coming next.",
        createdAt: new Date(Date.now() - 1000 * 60 * 10)
      },
      {
        user: "LockIn Bot",
        text: "Resurfacing: Example Product",
        isBot: true,
        sharedItemId: linkItem.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 5)
      },
      {
        user: "LockIn Bot",
        text: "Resurfacing: Screenshot",
        isBot: true,
        sharedItemId: imageItem.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 2)
      }
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
