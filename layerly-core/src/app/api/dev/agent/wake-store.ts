/**
 * In-memory store: user clicked "Check now" for deviceId.
 * Agent on next tick will call wake-check and reset backoff.
 * TTL 2 min – after that the request is cleared (user can click again).
 */
const KEY = '__agent_wake_requests';
const TTL_MS = 2 * 60 * 1000;

type WakeStore = Record<string, number>;

function getStore(): WakeStore {
  const g = globalThis as unknown as Record<string, unknown>;
  const raw = g[KEY];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as WakeStore;
}

function setStore(store: WakeStore): void {
  const g = globalThis as unknown as Record<string, unknown>;
  g[KEY] = store;
}

export function setWakeRequest(deviceId: string): void {
  const s = getStore();
  s[deviceId] = Date.now();
  setStore(s);
}

/** Returns true if there was a request (and it has not expired), and removes it. */
export function consumeWakeRequest(deviceId: string): boolean {
  const s = getStore();
  const at = s[deviceId];
  if (at == null) return false;
  if (Date.now() - at > TTL_MS) {
    delete s[deviceId];
    setStore(s);
    return false;
  }
  delete s[deviceId];
  setStore(s);
  return true;
}
