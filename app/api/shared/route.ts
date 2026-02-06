import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const sort = searchParams.get('sort');

  const orderBy =
    sort === 'shared'
      ? [{ shareCount: 'desc' as const }, { lastSharedAt: 'desc' as const }]
      : [{ lastSharedAt: 'desc' as const }];

  const items = await prisma.sharedItem.findMany({
    where: type ? { type } : undefined,
    orderBy
  });

  return NextResponse.json(items);
}
