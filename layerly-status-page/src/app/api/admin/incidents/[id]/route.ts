import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { incidents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(incident);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [existing] = await db.select().from(incidents).where(eq(incidents.id, id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const body = await req.json();
    const updates: Partial<typeof incidents.$inferInsert> = {};
    if (body.title != null) updates.title = String(body.title).trim();
    if (body.description != null) updates.description = String(body.description).trim() || null;
    if (body.status != null)
      updates.status = ['investigating', 'identified', 'monitoring', 'resolved'].includes(
        body.status
      )
        ? body.status
        : existing.status;
    if (body.severity != null)
      updates.severity = ['operational', 'degraded', 'major_outage', 'maintenance'].includes(
        body.severity
      )
        ? body.severity
        : existing.severity;
    if (body.status === 'resolved') {
      updates.resolvedAt = new Date();
    }

    const [updated] = await db
      .update(incidents)
      .set(updates)
      .where(eq(incidents.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API incidents PATCH]', err);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(incidents).where(eq(incidents.id, id));
  return NextResponse.json({ success: true });
}
