import { NextRequest, NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { monitorGroups } from '@/db/schema';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';

export async function GET() {
  const groups = await db
    .select()
    .from(monitorGroups)
    .orderBy(asc(monitorGroups.displayOrder), asc(monitorGroups.name));
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const [group] = await db
      .insert(monitorGroups)
      .values({
        name: String(body.name).trim(),
        description: body.description ? String(body.description).trim() || null : null,
        displayOrder: Number(body.displayOrder) || 0,
      })
      .returning();
    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    console.error('[API monitor-groups POST]', err);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
