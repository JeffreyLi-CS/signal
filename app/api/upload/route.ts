import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '../../../lib/prisma';
import { hashBuffer } from '../../../lib/hashImage';
import { embedText, buildEmbedInput } from '../../../lib/embeddings';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const user = formData.get('user') as string | null;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const hash = hashBuffer(buffer);

  const existing = await prisma.sharedItem.findUnique({
    where: { canonicalKey: hash }
  });

  let sharedItemId = existing?.id;

  if (existing) {
    await prisma.sharedItem.update({
      where: { id: existing.id },
      data: {
        shareCount: { increment: 1 },
        lastSharedAt: new Date()
      }
    });
    if (user) {
      const daysAgo = Math.round(
        (Date.now() - existing.firstSharedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const who = existing.sharedBy && existing.sharedBy !== user ? existing.sharedBy : 'someone';
      const when = daysAgo === 0 ? 'earlier today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;
      await prisma.message.create({
        data: {
          user: 'LockIn Bot',
          text: `Heads up — ${who} already shared this image ${when}!`,
          isBot: true
        }
      });
    }
  } else {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);
    const publicPath = `/uploads/${fileName}`;

    const fileLabel = file.name.toLowerCase().replace(/\W+/g, ' ');
    const embeddingInput = buildEmbedInput({
      fileName: file.name,
      title: file.name,
      keywords: [fileLabel]
    });
    const embedding = await embedText(embeddingInput);

    const created = await prisma.sharedItem.create({
      data: {
        type: 'image',
        canonicalKey: hash,
        imagePath: publicPath,
        title: file.name,
        sharedBy: user,
        keywords: JSON.stringify([fileLabel]),
        embedding: embedding ? JSON.stringify(embedding) : null,
        lastSharedAt: new Date(),
        firstSharedAt: new Date(),
        shareCount: 1
      }
    });
    sharedItemId = created.id;
  }

  if (user) {
    await prisma.message.create({
      data: {
        user,
        text: sharedItemId ? `Shared an image. [[shared:${sharedItemId}]]` : 'Shared an image.',
        sharedItemId: sharedItemId ?? null
      }
    });
  }

  return NextResponse.json({ ok: true });
}
