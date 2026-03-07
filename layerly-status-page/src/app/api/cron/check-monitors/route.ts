import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { monitors, monitorChecks, statusPageConfig, maintenanceWindows } from '@/db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { sendMonitorDownAlert, sendMonitorRecoveryAlert } from '@/lib/email';

const TIMEOUT_MS = 15000;

async function checkUrl(url: string): Promise<{ ok: boolean; responseTimeMs: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'StatusPage-Monitor/1.0' },
    });

    clearTimeout(timeout);
    const responseTimeMs = Date.now() - start;

    return {
      ok: res.ok,
      responseTimeMs,
    };
  } catch {
    return {
      ok: false,
      responseTimeMs: Date.now() - start,
    };
  }
}

function verifyCronAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7) === cronSecret;
  }

  if (req.headers.get('x-vercel-cron') === '1') {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const monitorsList = await db.select().from(monitors);

    // Fetch notification email and check for active maintenance in parallel
    let notificationEmail: string | null = null;
    let isMaintenanceActive = false;

    if (monitorsList.length > 0) {
      const now = new Date();
      const [config, [activeMaintenance]] = await Promise.all([
        db.select().from(statusPageConfig).limit(1),
        db
          .select({ id: maintenanceWindows.id })
          .from(maintenanceWindows)
          .where(
            and(
              lte(maintenanceWindows.startsAt, now),
              gte(maintenanceWindows.endsAt, now),
            )
          )
          .limit(1),
      ]);
      notificationEmail = config[0]?.notificationEmail ?? null;
      isMaintenanceActive = !!activeMaintenance;
    }

    for (const monitor of monitorsList) {
      if (monitor.type !== 'HTTP') continue;

      const prevStatus = monitor.status;
      const { ok, responseTimeMs } = await checkUrl(monitor.url);
      const newStatus = ok ? 'operational' : 'down';

      await db.insert(monitorChecks).values({
        monitorId: monitor.id,
        status: newStatus,
        responseTimeMs: ok ? responseTimeMs : null,
      });

      await db
        .update(monitors)
        .set({
          status: newStatus,
          lastCheckedAt: new Date(),
          responseTimeMs: ok ? responseTimeMs : null,
        })
        .where(eq(monitors.id, monitor.id));

      // #C — skip email alerts during active maintenance windows
      if (notificationEmail && !isMaintenanceActive) {
        if (prevStatus !== 'down' && newStatus === 'down') {
          await sendMonitorDownAlert(notificationEmail, monitor.name, monitor.url);
        } else if (prevStatus === 'down' && newStatus === 'operational') {
          await sendMonitorRecoveryAlert(notificationEmail, monitor.name, monitor.url);
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: monitorsList.length,
      maintenanceActive: isMaintenanceActive,
    });
  } catch (err) {
    console.error('[Cron check-monitors]', err);
    return NextResponse.json(
      { error: 'Failed to check monitors' },
      { status: 500 }
    );
  }
}
