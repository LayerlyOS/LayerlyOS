import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { incidents } from '@/db/schema';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';
import { badRequest } from '@/lib/api-auth';

export async function GET() {
  const list = await db.select().from(incidents);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, status = 'investigating', severity = 'major_outage' } = body;

    if (!title) return badRequest('Title is required');

    const [inserted] = await db
      .insert(incidents)
      .values({
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        status: ['investigating', 'identified', 'monitoring', 'resolved'].includes(status)
          ? status
          : 'investigating',
        severity: ['operational', 'degraded', 'major_outage', 'maintenance'].includes(severity)
          ? severity
          : 'major_outage',
      })
      .returning();

    return NextResponse.json(inserted);
  } catch (err) {
    console.error('[API incidents POST]', err);
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}
