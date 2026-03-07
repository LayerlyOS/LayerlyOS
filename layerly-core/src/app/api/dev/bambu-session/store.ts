import crypto from 'node:crypto';

const BAMBU_SESSION_COOKIE = 'bambu_dev_session';
const SESSION_MAX_AGE_S = 7 * 24 * 60 * 60; // 7 dni
const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

function getKey(): Buffer {
  const secret = process.env.BAMBU_SESSION_SECRET ?? 'layerly-bambu-dev-session';
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

/** Encrypts token – result in cookie (no server-side state). */
function encrypt(token: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return Buffer.concat([iv, enc]).toString('base64url');
}

/** Decrypts value from cookie; returns token or null. */
function decrypt(cookieValue: string): string | null {
  try {
    const raw = Buffer.from(cookieValue, 'base64url');
    if (raw.length < IV_LEN + AUTH_TAG_LEN + 1) return null;
    const key = getKey();
    const iv = raw.subarray(0, IV_LEN);
    const authTag = raw.subarray(-AUTH_TAG_LEN);
    const ciphertext = raw.subarray(IV_LEN, -AUTH_TAG_LEN);
    const decipher = crypto.createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
  } catch {
    return null;
  }
}

/** Returns encrypted token to save in cookie. Session survives server restart. */
export function createSession(token: string): string {
  return encrypt(token);
}

/** Reads token from cookie value (decryption). */
export function getSession(cookieValue: string | null): string | null {
  if (!cookieValue) return null;
  return decrypt(cookieValue);
}

export function deleteSession(_cookieValue: string | null): void {
  // No state – logout = setting Max-Age=0 in route
}

export function getCookieName(): string {
  return BAMBU_SESSION_COOKIE;
}

export function getCookieOptions(): { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string; maxAge: number } {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_S,
  };
}

export function formatSetCookie(name: string, value: string, options: ReturnType<typeof getCookieOptions>): string {
  const parts = [`${name}=${value}`, `Path=${options.path}`, `Max-Age=${options.maxAge}`, `SameSite=${options.sameSite}`, `HttpOnly`];
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}
