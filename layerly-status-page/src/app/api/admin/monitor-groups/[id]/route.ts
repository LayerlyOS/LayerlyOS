import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { monitorGroups } from '@/db/schema';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const updates: Partial<typeof monitorGroups.$inferInsert> = {};
    if (body.name != null) updates.name = String(body.name).trim() || undefined;
    if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() || null : null;
    if (body.displayOrder != null) updates.displayOrder = Number(body.displayOrder) || 0;

    const [updated] = await db
      .update(monitorGroups)
      .set(updates)
      .where(eq(monitorGroups.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API monitor-groups PATCH]', err);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await db.delete(monitorGroups).where(eq(monitorGroups.id, id));
    // monitors.groupId will be set to null via ON DELETE SET NULL
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API monitor-groups DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
