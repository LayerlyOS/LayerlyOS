import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  createSession,
  getSession,
  deleteSession,
  getCookieName,
  getCookieOptions,
  formatSetCookie,
} from './store';

export async function POST(req: NextRequest) {
  let body: { accessToken?: string };
  try {
    body = (await req.json()) as { accessToken?: string };
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const token = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';
  if (!token) {
    return NextResponse.json({ success: false, error: 'accessToken required' }, { status: 400 });
  }
  const sessionId = createSession(token);
  const res = NextResponse.json({ success: true });
  const opts = getCookieOptions();
  res.headers.set('Set-Cookie', formatSetCookie(getCookieName(), sessionId, opts));
  return res;
}

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(getCookieName())?.value ?? null;
  const token = getSession(sessionId);
  return NextResponse.json({ loggedIn: !!token });
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.cookies.get(getCookieName())?.value ?? null;
  deleteSession(sessionId);
  const res = NextResponse.json({ success: true });
  res.headers.set(
    'Set-Cookie',
    `${getCookieName()}=; Path=/; Max-Age=0; SameSite=lax; HttpOnly`
  );
  return res;
}
