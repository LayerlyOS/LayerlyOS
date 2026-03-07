import type { NextRequest } from 'next/server';
import { setAgentPayload } from '../store';

/** Agent key (dev: any or none; production: set in env AGENT_API_KEY). */
const AGENT_KEY = process.env.AGENT_API_KEY ?? '';

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-agent-key') ?? req.headers.get('X-Agent-Key') ?? '';
  if (AGENT_KEY && key !== AGENT_KEY) {
    return Response.json({ success: false, error: 'Invalid or missing X-Agent-Key' }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
  setAgentPayload(body);
  return Response.json({ success: true, received: true });
}
