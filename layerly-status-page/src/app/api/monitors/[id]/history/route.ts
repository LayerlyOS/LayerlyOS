import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { monitorChecks } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200);

  try {
    const checks = await db
      .select()
      .from(monitorChecks)
      .where(eq(monitorChecks.monitorId, id))
      .orderBy(desc(monitorChecks.checkedAt))
      .limit(limit);
    return NextResponse.json(checks);
  } catch (err) {
    console.error('[API monitor history]', err);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
