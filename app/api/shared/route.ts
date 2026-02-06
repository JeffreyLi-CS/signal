import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const sort = searchParams.get("sort") ?? "recent";

  const orderBy =
    sort === "shared"
      ? { shareCount: "desc" }
      : { lastSharedAt: "desc" };

  const items = await prisma.sharedItem.findMany({
    where: type ? { type } : undefined,
    orderBy
  });

  return NextResponse.json(items);
}
