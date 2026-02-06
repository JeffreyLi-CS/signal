import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { hashBuffer } from "@/lib/hashImage";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const user = String(formData.get("user") ?? "Anonymous");

  if (!file) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const hash = hashBuffer(buffer);

  const existing = await prisma.sharedItem.findUnique({
    where: { canonicalKey: hash }
  });

  let sharedItem = existing;

  if (existing) {
    sharedItem = await prisma.sharedItem.update({
      where: { id: existing.id },
      data: {
        shareCount: { increment: 1 },
        lastSharedAt: new Date()
      }
    });
  } else {
    const ext = path.extname(file.name) || ".png";
    const filename = `${hash}-${Date.now()}${ext}`;
    const uploadPath = path.join(process.cwd(), "public", "uploads", filename);
    await fs.writeFile(uploadPath, buffer);

    sharedItem = await prisma.sharedItem.create({
      data: {
        type: "image",
        canonicalKey: hash,
        imagePath: `/uploads/${filename}`,
        keywords: JSON.stringify(["image", "upload"]),
        shareCount: 1,
        referenceCount: 0
      }
    });
  }

  const message = await prisma.message.create({
    data: {
      user,
      text: "shared an image",
      sharedItemId: sharedItem.id
    },
    include: { sharedItem: true }
  });

  return NextResponse.json({ sharedItem, message });
}
