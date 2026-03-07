import { NextResponse } from 'next/server';
import { db } from '@/db';
import { monitors, monitorChecks, incidents, statusPageConfig } from '@/db/schema';
import { desc, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [configRows, monitorsList, recentIncidents, checksRaw] = await Promise.all([
      db.select().from(statusPageConfig).limit(1),
      db.select().from(monitors),
      db.select().from(incidents).orderBy(desc(incidents.startedAt)).limit(10),
      db
        .select({ monitorId: monitorChecks.monitorId, status: monitorChecks.status })
        .from(monitorChecks)
        .where(gte(monitorChecks.checkedAt, thirtyDaysAgo)),
    ]);

    // Build uptime % map (last 30 days) per monitor
    const grouped: Record<string, { total: number; operational: number }> = {};
    for (const c of checksRaw) {
      if (!grouped[c.monitorId]) grouped[c.monitorId] = { total: 0, operational: 0 };
      grouped[c.monitorId].total++;
      if (c.status === 'operational') grouped[c.monitorId].operational++;
    }
    const uptimeMap: Record<string, number> = {};
    for (const [id, { total, operational }] of Object.entries(grouped)) {
      uptimeMap[id] = total > 0 ? Math.round((operational / total) * 1000) / 10 : 100;
    }

    const config = configRows[0] ?? null;

    const hasDown = monitorsList.some((m) => m.status === 'down');
    const hasDegraded = monitorsList.some((m) => m.status === 'degraded');
    const hasMaintenance = monitorsList.some((m) => m.status === 'maintenance');

    let overallStatus: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance' =
      'operational';
    if (hasMaintenance && !hasDown && !hasDegraded) {
      overallStatus = 'maintenance';
    } else if (hasDown) {
      overallStatus = hasDegraded || monitorsList.some((m) => m.status === 'operational')
        ? 'partial_outage'
        : 'major_outage';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }

    return NextResponse.json({
      config: config
        ? {
            name: config.name,
            description: config.description,
            logoUrl: config.logoUrl,
          }
        : null,
      overallStatus,
      monitors: monitorsList.map((m) => ({
        id: m.id,
        name: m.name,
        status: m.status,
        lastCheckedAt: m.lastCheckedAt,
        responseTimeMs: m.responseTimeMs,
        uptimePct30d: uptimeMap[m.id] ?? null,
        groupId: m.groupId ?? null,
      })),
      recentIncidents: recentIncidents.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        severity: i.severity,
        startedAt: i.startedAt,
        resolvedAt: i.resolvedAt,
      })),
    });
  } catch (err) {
    console.error('[API status]', err);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
