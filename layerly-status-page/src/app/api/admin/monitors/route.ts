import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { monitors } from '@/db/schema';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';
import { badRequest } from '@/lib/api-auth';

export async function GET() {
  const list = await db.select().from(monitors);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, url, type = 'HTTP', intervalMinutes = 5 } = body;

    if (!name || !url) {
      return badRequest('Name and URL are required');
    }

    const [inserted] = await db
      .insert(monitors)
      .values({
        name: String(name).trim(),
        url: String(url).trim(),
        type: type === 'PING' ? 'PING' : 'HTTP',
        intervalMinutes: Math.min(60, Math.max(1, Number(intervalMinutes) || 5)),
      })
      .returning();

    return NextResponse.json(inserted);
  } catch (err) {
    console.error('[API monitors POST]', err);
    return NextResponse.json({ error: 'Failed to create monitor' }, { status: 500 });
  }
}
