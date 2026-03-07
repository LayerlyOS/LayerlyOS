import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAgentPayload } from '../store';

export async function GET(_req: NextRequest) {
  const { payload, at } = getAgentPayload();
  // In Cloud mode: if agent did not pass printerIp/accessCode, attach from server env (.env) – for RTSP URL display
  let lastPayload = payload;
  if (payload && payload.mode === 'cloud') {
    const envIp = process.env.BAMBU_PRINTER_IP?.trim();
    const envCode = process.env.BAMBU_ACCESS_CODE?.trim();
    if ((envIp || envCode) && (payload.printerIp == null || payload.accessCode == null)) {
      lastPayload = {
        ...payload,
        ...(envIp && payload.printerIp == null ? { printerIp: envIp } : {}),
        ...(envCode && payload.accessCode == null ? { accessCode: envCode } : {}),
      };
    }
  }
  return NextResponse.json(
    {
      success: true,
      lastPayload,
      lastPayloadAt: at ? at.toISOString() : null,
    },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
  );
}
