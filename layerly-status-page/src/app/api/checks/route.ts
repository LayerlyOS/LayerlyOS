import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { monitorChecks, statusPageConfig } from '@/db/schema';
import { desc, gte } from 'drizzle-orm';
import { subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

const VALID: string[] = ['minute', 'hourly', '6h', 'daily'];

export async function GET(req: NextRequest) {
  try {
    // Default interval from DB config
    const [config] = await db.select({ barInterval: statusPageConfig.barInterval }).from(statusPageConfig).limit(1);
    const defaultInterval = config?.barInterval ?? 'hourly';

    // Allow override via ?interval= query param (for client-side switching)
    const qInterval = req.nextUrl.searchParams.get('interval');
    const interval = qInterval && VALID.includes(qInterval) ? qInterval : defaultInterval;

    let startDate: Date;
    if (interval === 'daily') {
      startDate = subDays(new Date(), 90);
    } else if (interval === 'hourly') {
      startDate = subDays(new Date(), 7);
    } else if (interval === '6h') {
      startDate = subDays(new Date(), 14);
    } else {
      // minute — last 3 hours
      startDate = new Date(Date.now() - 3 * 60 * 60 * 1000);
    }

    const allChecks = await db
      .select({
        monitorId: monitorChecks.monitorId,
        status: monitorChecks.status,
        checkedAt: monitorChecks.checkedAt,
      })
      .from(monitorChecks)
      .where(gte(monitorChecks.checkedAt, startDate))
      .orderBy(desc(monitorChecks.checkedAt));

    const grouped: Record<string, { status: string; checkedAt: string }[]> = {};
    for (const c of allChecks) {
      if (!grouped[c.monitorId]) grouped[c.monitorId] = [];
      grouped[c.monitorId].push({ status: c.status, checkedAt: c.checkedAt.toISOString() });
    }

    return NextResponse.json({ checks: grouped, barInterval: interval, defaultInterval });
  } catch (err) {
    console.error('[API checks]', err);
    return NextResponse.json({ checks: {}, barInterval: 'hourly', defaultInterval: 'hourly' }, { status: 500 });
  }
}
