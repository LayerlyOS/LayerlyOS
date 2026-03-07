import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { setWakeRequest } from '../wake-store';

/** Frontend calls when user clicks "Check now" – agent on next tick resets backoff and polls printer. */
export async function POST(req: NextRequest) {
  let body: { deviceId?: string };
  try {
    body = (await req.json()) as { deviceId?: string };
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const deviceId = typeof body?.deviceId === 'string' ? body.deviceId.trim() : null;
  if (!deviceId) {
    return NextResponse.json({ success: false, error: 'Missing deviceId' }, { status: 400 });
  }
  setWakeRequest(deviceId);
  return NextResponse.json({ success: true, message: 'Agent will check printer on next refresh (within ~30 s).' });
}
