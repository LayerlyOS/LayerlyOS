import type { NextRequest } from 'next/server';

const BAMBU_API = 'https://api.bambulab.com';

const BAMBU_LOGIN_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Accept-Encoding': 'gzip, deflate',
  'User-Agent': 'bambu_network_agent/01.09.05.01',
  'X-BBL-Client-Name': 'OrcaSlicer',
  'X-BBL-Client-Type': 'slicer',
  'X-BBL-Client-Version': '01.09.05.51',
  'X-BBL-Language': 'en-US',
  'X-BBL-OS-Type': 'linux',
  'X-BBL-OS-Version': '6.2.0',
  'X-BBL-Agent-Version': '01.09.05.01',
  'X-BBL-Executable-info': '{}',
  'X-BBL-Agent-OS-Type': 'linux',
};

/** Send new verification code to email (Bambu API: sendemail/code). */
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
  const email = body.email?.trim();
  if (!email) {
    return Response.json(
      { success: false, error: 'Missing email' },
      { status: 400 }
    );
  }
  try {
    const res = await fetch(`${BAMBU_API}/v1/user-service/user/sendemail/code`, {
      method: 'POST',
      headers: BAMBU_LOGIN_HEADERS,
      body: JSON.stringify({ email, type: 'codeLogin' }),
    });
    const raw = await res.text();
    if (!res.ok) {
      let msg = `Failed to send code (${res.status})`;
      try {
        const j = JSON.parse(raw) as { message?: string };
        if (j.message) msg = j.message;
      } catch {
        if (raw) msg = raw.slice(0, 200);
      }
      return Response.json({ success: false, error: msg }, { status: 400 });
    }
    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
