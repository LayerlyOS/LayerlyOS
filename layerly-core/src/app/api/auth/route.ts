import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.url;
  return Response.json({ ok: true, message: 'auth index', url });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  return Response.json({ ok: true, message: 'auth index POST', body });
}
