import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { monitors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [monitor] = await db.select().from(monitors).where(eq(monitors.id, id));
  if (!monitor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(monitor);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [existing] = await db.select().from(monitors).where(eq(monitors.id, id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const body = await req.json();
    const updates: Partial<typeof monitors.$inferInsert> = {};
    if (body.name != null) updates.name = String(body.name).trim();
    if (body.url != null) updates.url = String(body.url).trim();
    if (body.type != null) updates.type = body.type === 'PING' ? 'PING' : 'HTTP';
    if (body.intervalMinutes != null)
      updates.intervalMinutes = Math.min(60, Math.max(1, Number(body.intervalMinutes) || 5));
    if ('groupId' in body) updates.groupId = body.groupId ?? null;

    const [updated] = await db
      .update(monitors)
      .set(updates)
      .where(eq(monitors.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API monitors PATCH]', err);
    return NextResponse.json({ error: 'Failed to update monitor' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(monitors).where(eq(monitors.id, id));
  return NextResponse.json({ success: true });
}
