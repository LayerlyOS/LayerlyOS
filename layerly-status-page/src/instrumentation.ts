/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Schedules monitor checks every 60 seconds in development (and production
 * when Vercel Cron is not available).
 *
 * In production on Vercel, Vercel Cron handles scheduling via vercel.json.
 * This file only activates the built-in scheduler when ENABLE_BUILT_IN_CRON=true
 * (set automatically in development via next.config.js env).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.ENABLE_BUILT_IN_CRON !== 'true') return;

  const INTERVAL_MS = 60_000;
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
  const CRON_SECRET = process.env.CRON_SECRET ?? '';

  const runCheck = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/cron/check-monitors`, {
        method: 'GET',
        headers: CRON_SECRET ? { authorization: `Bearer ${CRON_SECRET}` } : {},
        signal: AbortSignal.timeout(30_000),
      });
      const data = await res.json();
      console.log(`[Scheduler] Checked ${data.checked ?? 0} monitors`);
    } catch (err) {
      console.error('[Scheduler] Monitor check failed:', err);
    }
  };

  // Run immediately on startup, then every INTERVAL_MS
  setTimeout(async () => {
    console.log('[Scheduler] Starting built-in monitor scheduler (every 60s)');
    await runCheck();
    setInterval(runCheck, INTERVAL_MS);
  }, 5_000); // wait 5s for the server to fully boot
}
