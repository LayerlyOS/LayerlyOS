import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { statusPageConfig } from '@/db/schema';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';

const VALID_INTERVALS = ['minute', 'hourly', '6h', 'daily'] as const;

export async function GET() {
  const [config] = await db.select().from(statusPageConfig).limit(1);
  return NextResponse.json(config ?? null);
}

export async function PUT(req: NextRequest) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const [existing] = await db.select().from(statusPageConfig).limit(1);

    const barInterval = VALID_INTERVALS.includes(body.barInterval)
      ? body.barInterval
      : 'hourly';

    const updates = {
      name:              body.name != null ? String(body.name).trim() || 'Status Page' : 'Status Page',
      description:       body.description != null ? String(body.description).trim() || null : null,
      logoUrl:           body.logoUrl != null ? String(body.logoUrl).trim() || null : null,
      barInterval,
      notificationEmail: body.notificationEmail != null ? String(body.notificationEmail).trim() || null : null,
    };

    if (existing) {
      const [updated] = await db
        .update(statusPageConfig)
        .set(updates)
        .where(eq(statusPageConfig.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    const [inserted] = await db.insert(statusPageConfig).values(updates).returning();
    return NextResponse.json(inserted);
  } catch (err) {
    console.error('[API config PUT]', err);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
