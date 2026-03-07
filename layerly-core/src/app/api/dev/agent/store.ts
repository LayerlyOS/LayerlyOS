/** In-memory store for agent data (dev; cleared on server restart). In globalThis so state is shared across workers/revalidation. */
const KEY = '__agent_last_payload';
const KEY_AT = '__agent_last_payload_at';

type Store = { payload: Record<string, unknown> | null; at: Date | null };
function getStore(): Store {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[KEY] || typeof (g[KEY_AT] as number) !== 'number') {
    return { payload: null, at: null };
  }
  return {
    payload: g[KEY] as Record<string, unknown> | null,
    at: g[KEY_AT] != null ? new Date(g[KEY_AT] as number) : null,
  };
}

export function setAgentPayload(payload: Record<string, unknown>): void {
  const g = globalThis as unknown as Record<string, unknown>;
  g[KEY] = payload;
  g[KEY_AT] = Date.now();
}

export function getAgentPayload(): { payload: Record<string, unknown> | null; at: Date | null } {
  return getStore();
}
