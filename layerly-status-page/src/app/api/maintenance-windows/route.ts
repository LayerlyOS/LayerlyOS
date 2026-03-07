import { NextResponse } from 'next/server';
import { and, lte, gte } from 'drizzle-orm';
import { db } from '@/db';
import { maintenanceWindows } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const active = await db
      .select()
      .from(maintenanceWindows)
      .where(
        and(
          lte(maintenanceWindows.startsAt, now),
          gte(maintenanceWindows.endsAt, now)
        )
      );
    return NextResponse.json(active);
  } catch (err) {
    console.error('[API maintenance-windows public]', err);
    return NextResponse.json([], { status: 500 });
  }
}
