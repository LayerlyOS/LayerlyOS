import { NextRequest, NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/db';
import { incidentUpdates } from '@/db/schema';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates = await db
    .select()
    .from(incidentUpdates)
    .where(eq(incidentUpdates.incidentId, id))
    .orderBy(asc(incidentUpdates.createdAt));
  return NextResponse.json(updates);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    if (!body.message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    const [update] = await db
      .insert(incidentUpdates)
      .values({
        incidentId: id,
        message: String(body.message).trim(),
        status: body.status ?? 'investigating',
      })
      .returning();
    return NextResponse.json(update, { status: 201 });
  } catch (err) {
    console.error('[API incident updates POST]', err);
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 });
  }
}
