import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { maintenanceWindows } from '@/db/schema';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const windows = await db
    .select()
    .from(maintenanceWindows)
    .orderBy(desc(maintenanceWindows.startsAt));
  return NextResponse.json(windows);
}

export async function POST(req: NextRequest) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!body.startsAt) return NextResponse.json({ error: 'Start time is required' }, { status: 400 });
    if (!body.endsAt) return NextResponse.json({ error: 'End time is required' }, { status: 400 });

    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }

    const [window] = await db
      .insert(maintenanceWindows)
      .values({
        title: String(body.title).trim(),
        description: body.description ? String(body.description).trim() || null : null,
        startsAt,
        endsAt,
      })
      .returning();
    return NextResponse.json(window, { status: 201 });
  } catch (err) {
    console.error('[API maintenance-windows POST]', err);
    return NextResponse.json({ error: 'Failed to create maintenance window' }, { status: 500 });
  }
}
