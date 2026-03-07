/**
 * Bambu Lab Cloud login (api.bambulab.com + bambulab.com TFA).
 * Shared by /api/dev/bambu-mqtt and /api/dev/bambu-login.
 * TFA endpoint is behind Cloudflare; use node-curl-impersonate (GET sign-in → POST tfa with Cookie).
 * The library returns { response, details } (no headers) – we run curl with -i ourselves to get Set-Cookie.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const execFileAsync = promisify(execFile);

/** Resolve path to chrome binary if one exists; otherwise null (no throw). */
function resolveChromeBinary(binaryPath: string, binaryDir: string): string | null {
  if (fs.existsSync(binaryPath)) return binaryPath;
  try {
    if (!fs.existsSync(binaryDir)) return null;
    const entries = fs.readdirSync(binaryDir);
    const chrome = entries.find(
      (e) =>
        e.startsWith('chrome-') &&
        !e.endsWith('.crt') &&
        fs.existsSync(path.join(binaryDir, e))
    );
    if (chrome) return path.join(binaryDir, chrome);
  } catch {
    /* dir missing or unreadable */
  }
  const fallbacks = ['chrome-x86', 'chrome-arm64', 'chrome-x64'];
  for (const name of fallbacks) {
    const p = path.join(binaryDir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const BAMBU_API = 'https://api.bambulab.com';
export const BAMBU_TFA_LOGIN = 'https://bambulab.com/api/sign-in/tfa';
export const BAMBU_SIGN_IN_PAGE = 'https://bambulab.com/en/sign-in';

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

const BAMBU_TFA_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Origin: 'https://bambulab.com',
  Referer: 'https://bambulab.com/',
  'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
};

const toStr = (v: unknown): string =>
  v == null ? '' : (typeof v === 'string' ? v : String(v)).trim();

function extractLoginToken(data: Record<string, unknown> | null): string {
  if (!data) return '';
  return (
    toStr(data.accessToken) ||
    toStr(data.refreshToken) ||
    toStr(data.access_token) ||
    toStr(data.token)
  );
}

/** Parse curl -i output into statusCode, headers map, and body. Handles HTTP/1.1 and HTTP/2. */
function parseCurlIncludeHeaders(stdout: string): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const sep = stdout.includes('\r\n\r\n') ? '\r\n\r\n' : '\n\n';
  const idx = stdout.indexOf(sep);
  const headersBlock = idx >= 0 ? stdout.slice(0, idx) : stdout;
  const body = idx >= 0 ? stdout.slice(idx + sep.length).trim() : '';
  const statusMatch = headersBlock.match(/^HTTP\/[\d.]+\s+(\d+)/m) ?? headersBlock.match(/^HTTP\/2\s+(\d+)/m);
  const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 0;
  const headers: Record<string, string> = {};
  const lines = headersBlock.split(/\r?\n/).slice(1);
  for (const line of lines) {
    if (/^\s/.test(line)) {
      const prev = Object.keys(headers).pop();
      if (prev && headers[prev]) headers[prev] += ' ' + line.trim();
      continue;
    }
    const colon = line.indexOf(':');
    if (colon > 0) {
      const key = line.slice(0, colon).trim().toLowerCase();
      const value = line.slice(colon + 1).trim();
      if (key === 'set-cookie') {
        headers[key] = headers[key] ? headers[key] + '\n' + value : value;
      } else {
        headers[key] = value;
      }
    }
  }
  return { statusCode, headers, body };
}

/**
 * Run curl-impersonate with -i (include response headers). Uses execFile (no shell).
 * Returns { statusCode, headers, body }. Uses chrome 110 preset.
 */
async function curlImpersonateWithHeaders(
  url: string,
  method: 'GET' | 'POST',
  options: { cookieHeader?: string; body?: Record<string, string> }
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  const browsers = await import(
    '@qnaplus/node-curl-impersonate/dist/browsers.js'
  ).catch(() => null);
  const presets = await import(
    '@qnaplus/node-curl-impersonate/dist/presets.js'
  ).catch(() => null);
  if (!browsers?.BINARY_PATH || !presets?.BrowserPresets?.chrome?.['110']) {
    throw new Error('node-curl-impersonate preset not available');
  }
  const preset = presets.BrowserPresets.chrome['110'];
  const browser = browsers.resolveBrowser('chrome');
  const defaultPath = path.join(browsers.BINARY_PATH, browser.binary);
  const binaryPath = resolveChromeBinary(defaultPath, browsers.BINARY_PATH);
  if (!binaryPath) throw new Error('curl-impersonate binary not available');
  const expandedFlags = preset.flags.flatMap((f: string) =>
    f.split(/\s+/).filter(Boolean)
  );
  const finalArgs: string[] = [
    ...expandedFlags,
    '-X',
    method,
    '-H',
    'Content-Type: application/json',
    '-H',
    'Origin: https://bambulab.com',
    '-H',
    'Referer: https://bambulab.com/en/sign-in',
    '-i',
  ];
  if (options.cookieHeader) {
    finalArgs.push('-H', `Cookie: ${options.cookieHeader}`);
  }
  if (method === 'POST' && options.body) {
    finalArgs.push('-d', JSON.stringify(options.body));
  }
  finalArgs.push(url);
  const { stdout } = await execFileAsync(binaryPath, finalArgs, {
    cwd: browsers.BINARY_PATH,
    maxBuffer: 2 * 1024 * 1024,
    timeout: 25000,
  });
  return parseCurlIncludeHeaders(stdout);
}

/** Login result: token or require 2FA / verification code. */
export type BambuLoginResult =
  | string
  | { requireVerificationCode: true }
  | { require2FA: true };

/** TFA login result: token or require browser (Cloudflare 403). */
export type BambuTfaLoginResult =
  | string
  | { requireTfaFromBrowser: true; tfaKey: string };

/** Cloud: login and return accessToken, or requireVerificationCode / require2FA when second step is needed. */
export async function bambuLogin(
  account: string,
  password: string
): Promise<BambuLoginResult> {
  const res = await fetch(`${BAMBU_API}/v1/user-service/user/login`, {
    method: 'POST',
    headers: BAMBU_LOGIN_HEADERS,
    body: JSON.stringify({ account, password }),
  });
  const raw = await res.text();
  if (!res.ok) {
    let msg = `Login failed (${res.status})`;
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      if (raw) msg = raw.slice(0, 200);
    }
    throw new Error(msg);
  }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JSON in login response');
  }
  const loginType = (data.loginType as string | undefined) ?? '';
  const rawToken =
    data.accessToken != null ? String(data.accessToken).trim() : null;
  const token =
    rawToken ||
    (typeof (data as Record<string, unknown>).access_token === 'string'
      ? ((data as Record<string, unknown>).access_token as string).trim()
      : null) ||
    (typeof data.token === 'string' ? data.token.trim() : null);
  if (!token) {
    if (loginType === 'verifyCode') {
      return { requireVerificationCode: true as const };
    }
    if (loginType === 'tfa') {
      return { require2FA: true as const };
    }
    const keys = Object.keys(data).join(', ') || '(empty)';
    throw new Error(
      `No token in login response. Keys: ${keys}. Try again in a moment or check password.`
    );
  }
  return token;
}

/** Cloud: login with 2FA code (TOTP). Uses GET sign-in then POST tfa with Cookie (node-curl-impersonate) to bypass Cloudflare. */
export async function bambuLoginWithTfa(
  account: string,
  password: string,
  tfaCode: string
): Promise<BambuTfaLoginResult> {
  const res = await fetch(`${BAMBU_API}/v1/user-service/user/login`, {
    method: 'POST',
    headers: BAMBU_LOGIN_HEADERS,
    body: JSON.stringify({ account, password, tfa_code: tfaCode.trim() }),
  });
  const raw = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // fallback below
  }
  if (!res.ok) {
    const msg =
      (data && typeof data.message === 'string' ? data.message : null) ||
      raw.slice(0, 200) ||
      `Login failed (${res.status})`;
    throw new Error(msg);
  }
  const codeErr = data?.code;
  if (codeErr === 1)
    throw new Error(
      '2FA code expired or invalid. Enter current code from the app.'
    );
  if (codeErr === 2)
    throw new Error('Invalid 2FA code. Check the code from your authenticator app.');

  let token = extractLoginToken(data);
  if (token.length > 0) return token;

  const tfaKeyVal = toStr(
    data?.tfaKey ?? (data as Record<string, unknown>).tfa_key
  );
  if (tfaKeyVal.length > 0) {
    const tfaBody = { tfaKey: tfaKeyVal, tfaCode: tfaCode.trim() };
    let raw2 = '';
    let res2Status = 0;
    const res2Headers = new Headers();

    const runTfaFetch = async (): Promise<boolean> => {
      const res2 = await fetch(BAMBU_TFA_LOGIN, {
        method: 'POST',
        headers: BAMBU_TFA_HEADERS,
        body: JSON.stringify(tfaBody),
      });
      raw2 = await res2.text();
      res2Status = res2.status;
      res2.headers.forEach((v, k) => res2Headers.set(k, v));
      return res2.ok;
    };

    let ok = false;
    try {
      const getRes = await curlImpersonateWithHeaders(BAMBU_SIGN_IN_PAGE, 'GET', {}).catch(() => null);
      let cookieHeader = '';
      if (getRes?.statusCode === 200 && getRes.headers['set-cookie']) {
        const setCookie = getRes.headers['set-cookie'];
        const parts = setCookie.split(/\n/).map((s: string) => s.split(';')[0]?.trim()).filter(Boolean);
        cookieHeader = parts.join('; ');
      }
      const postRes = await curlImpersonateWithHeaders(BAMBU_TFA_LOGIN, 'POST', {
        cookieHeader: cookieHeader || undefined,
        body: tfaBody,
      });
      res2Status = postRes.statusCode;
      raw2 = postRes.body;
      const setCookieVal = postRes.headers['set-cookie'];
      if (setCookieVal) {
        const cookieStrings = setCookieVal.split(/\n/).filter(Boolean);
        for (const s of cookieStrings) {
          const match = /token=([^;]+)/.exec(s);
          if (match?.[1]) {
            token = decodeURIComponent(match[1].trim());
            if (token.length > 0) break;
          }
        }
      }
      if (token.length > 0) return token;
      const data2: Record<string, unknown> | null = (() => {
        try {
          return JSON.parse(raw2) as Record<string, unknown>;
        } catch {
          return null;
        }
      })();
      token = extractLoginToken(data2);
      if (token.length > 0) return token;
      ok = res2Status >= 200 && res2Status < 300;
    } catch (curlErr) {
      const msg = curlErr instanceof Error ? curlErr.message : String(curlErr);
      if (!msg.includes('binary not available')) {
        console.error('[bambu-cloud-auth] curl-impersonate TFA failed:', msg);
      }
    }
    if (!ok) {
      ok = await runTfaFetch();
    }

    if (ok) {
      const cookieStrings: string[] =
        typeof res2Headers.getSetCookie === 'function'
          ? res2Headers.getSetCookie()
          : ([
              res2Headers.get('set-cookie') ||
                res2Headers.get('Set-Cookie'),
            ].filter(Boolean) as string[]);
      for (const s of cookieStrings) {
        const match = /token=([^;]+)/.exec(s);
        if (match?.[1]) {
          token = decodeURIComponent(match[1].trim());
          if (token.length > 0) return token;
        }
      }
      const data2b: Record<string, unknown> | null = (() => {
        try {
          return JSON.parse(raw2) as Record<string, unknown>;
        } catch {
          return null;
        }
      })();
      token = extractLoginToken(data2b);
      if (token.length > 0) return token;
    }
    if (res2Status === 403) {
      return { requireTfaFromBrowser: true as const, tfaKey: tfaKeyVal };
    }
    let data2: Record<string, unknown> | null = null;
    try {
      data2 = JSON.parse(raw2) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
    const d2 = data2 as Record<string, unknown>;
    const msg2 = typeof d2?.message === 'string' ? d2.message : null;
    const err2 = typeof d2?.error === 'string' ? d2.error : null;
    const code2 = d2?.code != null ? String(d2.code) : null;
    const part = [res2Status, code2, msg2, err2, raw2.slice(0, 150)]
      .filter(Boolean)
      .join(' ');
    throw new Error(
      `Exchanging tfaKey for token failed: ${part || 'no description'}`
    );
  }

  const keys = data ? Object.keys(data).join(', ') : '(none)';
  throw new Error(
    `No token in response (keys: ${keys}). Enter current 2FA code and try again.`
  );
}

/** Cloud: login with verification code (sent by Bambu to email). */
export async function bambuLoginWithCode(
  account: string,
  code: string
): Promise<string> {
  const res = await fetch(`${BAMBU_API}/v1/user-service/user/login`, {
    method: 'POST',
    headers: BAMBU_LOGIN_HEADERS,
    body: JSON.stringify({ account, code }),
  });
  const raw = await res.text();
  const data = (() => {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();
  if (!res.ok) {
    const msg =
      (data && typeof data.message === 'string' ? data.message : null) ||
      raw.slice(0, 200) ||
      `Login failed (${res.status})`;
    throw new Error(msg);
  }
  const codeErr = data?.code;
  if (codeErr === 1)
    throw new Error(
      'Verification code expired. Log in again with password and enter new code.'
    );
  if (codeErr === 2)
    throw new Error('Invalid code. Check the code from your email.');
  const token =
    data?.accessToken != null ? String(data.accessToken).trim() : null;
  if (!token) throw new Error('No token in response. Try again.');
  return token;
}

/** Cloud: get uid for MQTT username (u_{uid}). */
export async function bambuPreference(accessToken: string): Promise<number> {
  const res = await fetch(
    `${BAMBU_API}/v1/design-user-service/my/preference`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Preference failed (${res.status})`);
  const data = (await res.json()) as { uid?: number };
  if (data.uid == null) throw new Error('No uid in preference response');
  return data.uid;
}

/** Cloud: list bound devices. */
export async function bambuBind(
  accessToken: string
): Promise<{ dev_id: string; name?: string }[]> {
  const res = await fetch(`${BAMBU_API}/v1/iot-service/api/user/bind`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok)
    throw new Error(`Bind/list devices failed (${res.status})`);
  const data = (await res.json()) as {
    devices?: { dev_id: string; name?: string }[];
  };
  if (!Array.isArray(data.devices))
    throw new Error('No devices in bind response');
  return data.devices;
}
