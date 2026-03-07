import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { maintenanceWindows } from '@/db/schema';
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
    const updates: Record<string, unknown> = {};
    if (body.title != null) updates.title = String(body.title).trim();
    if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() || null : null;
    if (body.startsAt != null) updates.startsAt = new Date(body.startsAt);
    if (body.endsAt != null) updates.endsAt = new Date(body.endsAt);

    const [updated] = await db
      .update(maintenanceWindows)
      .set(updates)
      .where(eq(maintenanceWindows.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API maintenance-windows PATCH]', err);
    return NextResponse.json({ error: 'Failed to update maintenance window' }, { status: 500 });
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
    await db.delete(maintenanceWindows).where(eq(maintenanceWindows.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API maintenance-windows DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
