import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { consumeWakeRequest } from '../wake-store';

const AGENT_KEY = process.env.AGENT_API_KEY ?? '';

/** Agent calls during backoff – if user clicked "Check now", we return forceCheck: true and agent resets backoff. */
export async function GET(req: NextRequest) {
  if (AGENT_KEY) {
    const key = req.headers.get('x-agent-key') ?? req.headers.get('X-Agent-Key') ?? '';
    if (key !== AGENT_KEY) {
      return NextResponse.json({ forceCheck: false }, { status: 401 });
    }
  }
  const deviceId = req.nextUrl.searchParams.get('deviceId')?.trim();
  if (!deviceId) {
    return NextResponse.json({ forceCheck: false });
  }
  const forceCheck = consumeWakeRequest(deviceId);
  return NextResponse.json({ forceCheck });
}
