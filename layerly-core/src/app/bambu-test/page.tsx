'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Printer,
  CheckCircle2,
  XCircle,
  Info,
  Cloud,
  Wifi,
  LogOut,
  ThermometerSun,
  Activity,
  Layers,
  Wifi as WifiIcon,
  Plus,
  Trash2,
  ListChecks,
  ShieldCheck,
  Lightbulb,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const BAMBU_MY_PRINTERS_KEY = 'bambu_test_my_printers';

type ResultState = 'idle' | 'loading' | 'success' | 'error';
type Mode = 'lan' | 'cloud';

export type BambuDevice = {
  dev_id: string;
  name: string;
  dev_product_name: string;
  dev_model_name: string;
  online?: boolean;
};

export type MyPrinter = {
  dev_id: string;
  name: string;
  dev_product_name: string;
};

type ApiResult =
  | { success: true; data: unknown; cloudAccessToken?: string; devices?: BambuDevice[] }
  | { success: false; error: string }
  | { success: false; requireVerificationCode: true }
  | { success: false; require2FA: true }
  | { success: false; requireTfaFromBrowser: true; tfaKey: string };

export default function BambuTestPage() {
  const [mode, setMode] = useState<Mode>('cloud');
  const [printerIp, setPrinterIp] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [requireVerificationCode, setRequireVerificationCode] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [tfaCode, setTfaCode] = useState('');
  const [cloudSessionLoggedIn, setCloudSessionLoggedIn] = useState(false);
  const [state, setState] = useState<ResultState>('idle');
  const [result, setResult] = useState<ApiResult | null>(null);
  const [codeRequestState, setCodeRequestState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [codeRequestError, setCodeRequestError] = useState('');
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [statusState, setStatusState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);
  const [statusError, setStatusError] = useState('');
  const [cloudDevices, setCloudDevices] = useState<BambuDevice[]>([]);
  const [myPrinters, setMyPrinters] = useState<MyPrinter[]>([]);
  const [agentPayload, setAgentPayload] = useState<Record<string, unknown> | null>(null);
  const [agentPayloadAt, setAgentPayloadAt] = useState<string | null>(null);
  const [commandState, setCommandState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [commandError, setCommandError] = useState('');
  const [streamUrlCopied, setStreamUrlCopied] = useState(false);
  const [cameraSnapshotKey, setCameraSnapshotKey] = useState(0);
  const [showCameraImage, setShowCameraImage] = useState(false);
  const [wakeRequestState, setWakeRequestState] = useState<'idle' | 'loading' | 'sent'>('idle');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetch('/api/dev/bambu-session', { credentials: 'include' })
        .then((r) => r.json())
        .then((j: { loggedIn?: boolean }) => setCloudSessionLoggedIn(!!j.loggedIn))
        .catch(() => setCloudSessionLoggedIn(false));
      try {
        const raw = localStorage.getItem(BAMBU_MY_PRINTERS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as MyPrinter[];
          if (Array.isArray(parsed)) setMyPrinters(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/dev/agent/status');
        if (cancelled) return;
        const j = (await res.json()) as { success?: boolean; lastPayload?: Record<string, unknown>; lastPayloadAt?: string | null };
        if (j.success && j.lastPayload != null) {
          setAgentPayload(j.lastPayload);
          setAgentPayloadAt(j.lastPayloadAt ?? null);
          if (j.lastPayload.status !== 'printer_off') setWakeRequestState('idle');
        }
        // On error or lastPayload === null we do not clear state – data stays (e.g. temporary network error or server restart)
      } catch {
        // We do not set setAgentPayload(null) – we keep the last data
      }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  function saveMyPrinters(list: MyPrinter[]) {
    setMyPrinters(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem(BAMBU_MY_PRINTERS_KEY, JSON.stringify(list));
    }
  }

  function addToMyList(device: BambuDevice) {
    if (myPrinters.some((p) => p.dev_id === device.dev_id)) return;
    saveMyPrinters([
      ...myPrinters,
      {
        dev_id: device.dev_id,
        name: device.name || device.dev_product_name || device.dev_id,
        dev_product_name: device.dev_product_name || '',
      },
    ]);
  }

  function removeFromMyList(devId: string) {
    saveMyPrinters(myPrinters.filter((p) => p.dev_id !== devId));
  }

  async function clearSavedLogin() {
    await fetch('/api/dev/bambu-session', { method: 'DELETE', credentials: 'include' });
    setCloudSessionLoggedIn(false);
  }

  async function handleRequestNewCode() {
    const addr = email.trim();
    if (!addr || codeCooldown > 0) return;
    setCodeRequestState('loading');
    setCodeRequestError('');
    try {
      const res = await fetch('/api/dev/bambu-mqtt/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addr }),
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (data.success) {
        setCodeRequestState('sent');
        setCodeCooldown(60);
        const interval = setInterval(() => {
          setCodeCooldown((c) => {
            if (c <= 1) {
              clearInterval(interval);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } else {
        setCodeRequestState('error');
        setCodeRequestError(data.error || 'Failed to send code');
      }
    } catch {
      setCodeRequestState('error');
      setCodeRequestError('Connection error');
    }
  }

  function buildCloudBody(): Record<string, string> | null {
    if (cloudSessionLoggedIn) return { mode: 'cloud' };
    if (!email.trim()) return null;
    if (require2FA && tfaCode.trim() && password)
      return { mode: 'cloud', email: email.trim(), password, tfaCode: tfaCode.trim() };
    if (requireVerificationCode && verificationCode.trim())
      return { mode: 'cloud', email: email.trim(), verificationCode: verificationCode.trim() };
    if (password) return { mode: 'cloud', email: email.trim(), password };
    return null;
  }

  function canFetchStatus(): boolean {
    if (mode === 'lan') return !!(printerIp.trim() && deviceId.trim() && accessCode.trim());
    return !!buildCloudBody();
  }

  async function handleFetchStatus() {
    const baseBody =
      mode === 'lan'
        ? {
            mode: 'lan' as const,
            printerIp: printerIp.trim(),
            deviceId: deviceId.trim(),
            accessCode: accessCode.trim(),
          }
        : buildCloudBody();
    if (!baseBody) return;
    setStatusState('loading');
    setStatusError('');
    setStatusData(null);
    try {
      const res = await fetch('/api/dev/bambu-mqtt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...baseBody, action: 'get_status' }),
        credentials: 'include',
      });
      const data = (await res.json()) as ApiResult & { data?: unknown; error?: string };
      if (data.success && data.data != null) {
        setStatusData(data.data as Record<string, unknown>);
        setStatusState('success');
        const devices = 'devices' in data ? (data as { devices?: BambuDevice[] }).devices : undefined;
        if (devices?.length) setCloudDevices(devices);
      } else {
        setStatusState('error');
        setStatusError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setStatusState('error');
      setStatusError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleUseSavedLogin() {
    if (!cloudSessionLoggedIn) return;
    setState('loading');
    setResult(null);
    try {
      const res = await fetch('/api/dev/bambu-mqtt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'cloud' }),
        credentials: 'include',
      });
      const data = (await res.json()) as ApiResult;
      if (!data.success && res.status === 401) clearSavedLogin();
      if (data.success && 'devices' in data && data.devices?.length) setCloudDevices(data.devices);
      setResult(data);
      setState(data.success ? 'success' : 'error');
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
      setState('error');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setResult(null);
    try {
      const body: Record<string, string> =
        mode === 'lan'
          ? {
              mode: 'lan',
              printerIp: printerIp.trim(),
              deviceId: deviceId.trim(),
              accessCode: accessCode.trim(),
            }
          : require2FA && tfaCode.trim()
              ? {
                  mode: 'cloud',
                  email: email.trim(),
                  password,
                  tfaCode: tfaCode.trim(),
                }
              : requireVerificationCode
                  ? {
                      mode: 'cloud',
                      email: email.trim(),
                      verificationCode: verificationCode.trim(),
                    }
                  : {
                      mode: 'cloud',
                      email: email.trim(),
                      password,
                    };
      const res = await fetch('/api/dev/bambu-mqtt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const data = (await res.json()) as ApiResult;
      if ('require2FA' in data && data.require2FA) {
        setRequire2FA(true);
        setResult(null);
        setState('idle');
        return;
      }
      if ('requireTfaFromBrowser' in data && data.requireTfaFromBrowser && data.tfaKey) {
        setState('loading');
        setResult(null);
        try {
          const tfaRes = await fetch('https://bambulab.com/api/sign-in/tfa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tfaKey: data.tfaKey, tfaCode: tfaCode.trim() }),
            credentials: 'include',
          });
          const tfaRaw = await tfaRes.text();
          if (tfaRes.ok) {
            let token = '';
            try {
              const tfaJson = JSON.parse(tfaRaw) as Record<string, unknown>;
              token =
                String(tfaJson?.accessToken ?? '').trim() ||
                String(tfaJson?.refreshToken ?? '').trim() ||
                String(tfaJson?.token ?? '').trim();
            } catch {
              /* body is not JSON */
            }
            if (token) {
              await fetch('/api/dev/bambu-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: token }),
                credentials: 'include',
              });
              setCloudSessionLoggedIn(true);
              setRequire2FA(false);
              setTfaCode('');
              setResult({ success: true, data: null, cloudAccessToken: token });
              setState('success');
              return;
            }
          }
          setResult({
            success: false,
            error:
              'Browser 2FA login did not return a token (CORS or other response). Try LAN mode or disable 2FA in Bambu settings.',
          });
          setState('error');
        } catch (e) {
          setResult({
            success: false,
            error: e instanceof Error ? e.message : 'Browser TFA request failed.',
          });
          setState('error');
        }
        return;
      }
      if ('requireVerificationCode' in data && data.requireVerificationCode) {
        setRequireVerificationCode(true);
        setResult(null);
        setState('idle');
        setCodeRequestState('idle');
        setCodeRequestError('');
        setCodeCooldown(0);
        return;
      }
      if (data.success && 'cloudAccessToken' in data && data.cloudAccessToken) {
        await fetch('/api/dev/bambu-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: data.cloudAccessToken }),
          credentials: 'include',
        });
        setCloudSessionLoggedIn(true);
        setRequire2FA(false);
        setTfaCode('');
      }
      if (data.success && 'devices' in data && data.devices?.length) setCloudDevices(data.devices);
      if (!data.success && res.status === 401) {
        clearSavedLogin();
      }
      setResult(data);
      setState(data.success ? 'success' : 'error');
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
      setState('error');
    }
  }

  return (
    <div className="min-h-[60vh] bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="font-black text-slate-900 tracking-tight text-3xl flex items-center gap-3">
            <Printer className="h-8 w-8 text-indigo-600" />
            Bambu Lab connection test (MQTT)
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Test printer connection via local network (LAN) or Bambu Cloud.
            Cloud: sign in with your Bambu Lab account.
          </p>
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('cloud')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                mode === 'cloud'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Cloud className="h-4 w-4" />
              Cloud
            </button>
            <button
              type="button"
              onClick={() => setMode('lan')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                mode === 'lan'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Wifi className="h-4 w-4" />
              LAN
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'cloud' ? (
              <>
                {cloudSessionLoggedIn ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-bold text-emerald-800 mb-2">
                      Saved login (token valid ~3 months)
                    </p>
                    <p className="text-xs text-emerald-700 mb-4">
                      You can test the connection right away without entering password or code.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={handleUseSavedLogin}
                        disabled={state === 'loading'}
                        leftIcon={
                          state === 'loading' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : undefined
                        }
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 px-6 py-3 rounded-xl font-bold"
                      >
                        {state === 'loading' ? 'Loading…' : 'Test with saved login'}
                      </Button>
                      <button
                        type="button"
                        onClick={clearSavedLogin}
                        className="px-4 py-2.5 rounded-xl font-bold text-sm border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-all flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={clearSavedLogin}
                      className="mt-4 text-xs font-bold text-slate-500 hover:text-slate-700 underline"
                    >
                      Sign in with another account
                    </button>
                  </div>
                ) : (
                  <>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                  >
                    Email (Bambu Lab account)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    required
                    readOnly={requireVerificationCode || require2FA}
                  />
                </div>
                {require2FA ? (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Enter 2FA code from authenticator app
                    </p>
                    <label
                      htmlFor="tfaCode"
                      className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                    >
                      2FA code (6 digits)
                    </label>
                    <input
                      id="tfaCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={tfaCode}
                      onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 tracking-widest focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                      maxLength={6}
                      required={require2FA}
                      autoFocus
                    />
                    <p className="mt-1.5 text-xs text-indigo-700">
                      Open the app (Google Authenticator, Duo, etc.) and enter the current 6-digit code.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setRequire2FA(false); setTfaCode(''); }}
                      className="mt-3 text-xs font-bold text-indigo-700 hover:text-indigo-900 underline"
                    >
                      Back to password login
                    </button>
                  </div>
                ) : requireVerificationCode ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-bold text-amber-800 mb-3">
                      Enter verification code from email
                    </p>
                    <label
                      htmlFor="verificationCode"
                      className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                    >
                      Verification code
                    </label>
                    <input
                      id="verificationCode"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                      required
                      autoFocus
                    />
                    <p className="mt-1.5 text-xs text-amber-700">
                      Code was sent to {email}. Enter it above and
                      click “Test connection”. <strong>Delivery may take up to a few minutes.</strong>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRequestNewCode}
                        disabled={codeCooldown > 0 || codeRequestState === 'loading'}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                      >
                        {codeRequestState === 'loading' && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        {codeCooldown > 0
                          ? `Send new code in ${codeCooldown} s`
                          : 'Send new code to email'}
                      </button>
                      {codeRequestState === 'sent' && (
                        <span className="text-xs text-emerald-700 font-medium">
                          Code sent. Check your inbox (may arrive with delay).
                        </span>
                      )}
                      {codeRequestState === 'error' && codeRequestError && (
                        <span className="text-xs text-red-600 font-medium">
                          {codeRequestError}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRequireVerificationCode(false);
                        setVerificationCode('');
                        setCodeRequestState('idle');
                        setCodeRequestError('');
                        setCodeCooldown(0);
                      }}
                      className="mt-3 text-xs font-bold text-amber-700 hover:text-amber-900 underline"
                    >
                      Back to password login
                    </button>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Bambu Lab account password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                      required
                    />
                    <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      The first device linked to the account is used.
                      Printer does not need to be in LAN mode. If Bambu sends
                      a code to email, a code field will appear. With 2FA enabled
                      a field for the authenticator app code will appear.
                    </p>
                  </div>
                )}
                  </>
                )}
              </>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="printerIp"
                    className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                  >
                    Printer IP
                  </label>
                  <input
                    id="printerIp"
                    type="text"
                    value={printerIp}
                    onChange={(e) => setPrinterIp(e.target.value)}
                    placeholder="e.g. 192.168.1.100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="deviceId"
                    className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                  >
                    Device ID (Printer SN)
                  </label>
                  <input
                    id="deviceId"
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="e.g. from printer screen or Bambu Studio"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    required
                  />
                  <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Device ID is the printer serial number (SN) – in settings
                    on the screen or in Bambu Studio.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="accessCode"
                    className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                  >
                    LAN access code
                  </label>
                  <input
                    id="accessCode"
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Printer network access code (LAN mode must be enabled)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    required
                  />
                </div>
              </>
            )}
            {!(mode === 'cloud' && cloudSessionLoggedIn) && (
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={state === 'loading'}
                  leftIcon={
                    state === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : undefined
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 px-6 py-3 rounded-xl font-bold"
                >
                  {state === 'loading' ? 'Loading…' : 'Test connection'}
                </Button>
              </div>
            )}
          </form>

          {(state === 'loading' || state === 'success' || state === 'error') && (
            <div
              className={`mt-8 rounded-2xl border p-5 flex items-start gap-4 ${
                state === 'loading'
                  ? 'bg-slate-50 border-slate-200'
                  : state === 'success'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
              }`}
            >
              {state === 'loading' && (
                <>
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin text-indigo-600" />
                  <p className="font-medium text-slate-700">
                    Connecting to printer and sending get_version command…
                  </p>
                </>
              )}
              {state === 'success' && result?.success && (
                <>
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-emerald-800">
                      Connection OK
                    </p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Printer responded with get_version command.
                    </p>
                    <pre className="mt-3 p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs text-slate-800 overflow-auto max-h-64">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </>
              )}
              {state === 'error' && result && !result.success && 'error' in result && (
                <>
                  <XCircle className="h-6 w-6 shrink-0 text-red-600" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-red-800">Connection error</p>
                    <p className="text-sm text-red-700 mt-1">{result.error}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {(myPrinters.length > 0 || cloudDevices.length > 0) && (
            <section className="mt-10 pt-8 border-t border-slate-200">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                My printer list
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Printers saved locally (localStorage). You can add from Bambu list and remove.
              </p>
              {myPrinters.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No printers in list. Sign in via Cloud and add a printer from the list below.</p>
              ) : (
                <ul className="space-y-2">
                  {myPrinters.map((p) => (
                    <li
                      key={p.dev_id}
                      className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900">{p.name || p.dev_id}</span>
                        {p.dev_product_name && (
                          <span className="ml-2 text-sm text-slate-500">{p.dev_product_name}</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromMyList(p.dev_id)}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        className="border-red-200 text-red-700 hover:border-red-400 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {cloudDevices.length > 0 && (
            <section className="mt-10 pt-8 border-t border-slate-200">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Your Bambu printers
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Devices from Bambu Lab account. Add selected to “My printer list”.
              </p>
              <ul className="space-y-2">
                {cloudDevices.map((d) => {
                  const inMyList = myPrinters.some((p) => p.dev_id === d.dev_id);
                  return (
                    <li
                      key={d.dev_id}
                      className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <Printer className="h-5 w-5 shrink-0 text-slate-400" />
                        <div>
                          <span className="font-bold text-slate-900">{d.name || d.dev_id}</span>
                          {(d.dev_product_name || d.dev_model_name) && (
                            <span className="ml-2 text-sm text-slate-500">
                              {[d.dev_product_name, d.dev_model_name].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          {d.online != null && (
                            <span
                              className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-lg border ${
                                d.online ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {d.online ? 'Online' : 'Offline'}
                            </span>
                          )}
                        </div>
                      </div>
                      {inMyList ? (
                        <span className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                          <ListChecks className="h-4 w-4" /> In my list
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addToMyList(d)}
                          leftIcon={<Plus className="h-4 w-4" />}
                          className="border-indigo-200 text-indigo-700 hover:border-indigo-500 hover:text-indigo-800"
                        >
                          Add to list
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="mt-10 pt-8 border-t border-slate-200">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Data from printer
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Fetch current status (temperatures, print state, progress). Use same credentials as for connection test (Cloud: saved login or email/password; LAN: IP, Device ID, code).
            </p>
            <Button
              type="button"
              onClick={handleFetchStatus}
              disabled={!canFetchStatus() || statusState === 'loading'}
              leftIcon={
                statusState === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : undefined
              }
              variant="outline"
              className="border-2 border-slate-200"
            >
              {statusState === 'loading' ? 'Fetching…' : 'Fetch printer status'}
            </Button>

            {statusState === 'success' && statusData && (
              <PrinterStatusCard data={statusData} />
            )}
            {statusState === 'error' && statusError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm font-medium text-red-800">{statusError}</p>
              </div>
            )}
          </section>

          <section className="mt-10 pt-8 border-t border-slate-200">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Data from agent (Go)
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Latest payload sent by agent (refresh every 2 s). Run agent from <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">agent/</code> with env vars set. After dev server restart only the cached payload is cleared; Cloud login stays in cookie.
            </p>
            {agentPayload ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                {agentPayload.status === 'printer_off' ? (
                  <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
                      <Activity className="h-6 w-6" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-amber-900">Printer off</p>
                      <p className="mt-1 text-sm text-amber-800">
                        Agent detected no response from printer (timeout). Turn on the printer and ensure it is connected to Bambu cloud (not “LAN only” mode). Agent retries with increasing delay (90 s to 15 min) to avoid load – after turning on the printer, data will appear on the next try.
                      </p>
                      {agentPayload.deviceId != null ? (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={wakeRequestState === 'loading'}
                            onClick={async () => {
                              setWakeRequestState('loading');
                              try {
                                const res = await fetch('/api/dev/agent/wake-request', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ deviceId: String(agentPayload.deviceId) }),
                                });
                                const data = (await res.json()) as { success?: boolean };
                                if (data.success) {
                                  setWakeRequestState('sent');
                                  setTimeout(() => setWakeRequestState('idle'), 8000);
                                } else {
                                  setWakeRequestState('idle');
                                }
                              } catch {
                                setWakeRequestState('idle');
                              }
                            }}
                          >
                            {wakeRequestState === 'loading' ? 'Sending…' : wakeRequestState === 'sent' ? 'Sent' : 'Check now'}
                          </Button>
                          {wakeRequestState === 'sent' ? (
                            <span className="text-sm text-amber-800">Agent will check printer on next refresh (within ~30 s).</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Source: {String(agentPayload.source ?? '—')} · mode: {String(agentPayload.mode ?? '—')}
                    {agentPayload.status != null ? ` · status: ${String(agentPayload.status)}` : null}
                    {agentPayload.deviceId != null ? ` · ${String(agentPayload.deviceId)}` : null}
                    {agentPayload.name != null ? ` · ${String(agentPayload.name)}` : null}
                  </span>
                  {agentPayloadAt ? (
                    <span className="text-xs text-slate-400">{new Date(agentPayloadAt).toLocaleString()}</span>
                  ) : null}
                </div>
                {agentPayload.report && typeof agentPayload.report === 'object' ? (
                  <PrinterStatusCard data={agentPayload.report as Record<string, unknown>} />
                ) : agentPayload.status === 'printer_off' ? (
                  <p className="text-sm text-slate-500 italic">No report – printer not responding. Turn on printer and wait for agent’s next try (90 s–15 min interval).</p>
                ) : (
                  <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-auto max-h-64">
                    {JSON.stringify(agentPayload, null, 2)}
                  </pre>
                )}
                {(agentPayload?.deviceId != null || (mode === 'lan' && printerIp.trim() && deviceId.trim() && accessCode.trim())) ? (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Control (light, recording)
                    </p>
                    {mode === 'cloud' && !cloudSessionLoggedIn ? (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <strong>Data above</strong> comes from the agent (its token). To use <strong>“Fetch printer status”</strong> and <strong>light / recording</strong> buttons in Cloud mode, sign in on this page: enter email and password in “Bambu Cloud connection” and click <strong>“Test connection”</strong>. Session (cookie) will be saved and buttons will be active.
                      </p>
                    ) : mode === 'lan' && !(printerIp.trim() && deviceId.trim() && accessCode.trim()) ? (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        Fill in LAN details above (printer IP, Device ID, access code) and switch to LAN mode – then control buttons will appear.
                      </p>
                    ) : (
                    <>
                      {(() => {
                        const report = agentPayload?.report && typeof agentPayload.report === 'object' ? (agentPayload.report as Record<string, unknown>) : undefined;
                        const print = report && typeof report.print === 'object' ? report.print as Record<string, unknown> : undefined;
                        const lightsFromPrint = Array.isArray(print?.lights_report) ? print.lights_report as { node?: string; mode?: string }[] : [];
                        const lightsFromReport = Array.isArray(report?.lights_report) ? report.lights_report as { node?: string; mode?: string }[] : [];
                        const lightsReport = lightsFromPrint.length > 0 ? lightsFromPrint : lightsFromReport;
                        const chamberLight = lightsReport.find((r) => r?.node === 'chamber_light');
                        const rawMode = chamberLight?.mode != null ? String(chamberLight.mode) : null;
                        const modeLower = rawMode?.toLowerCase();
                        const lightLabel = modeLower === 'on' ? 'on' : modeLower === 'off' ? 'off' : modeLower === 'flashing' ? 'flashing' : rawMode != null ? `? (${rawMode})` : '—';
                        const isOn = modeLower === 'on';
                        return (
                          <div className="mb-2">
                            <p className="text-sm text-slate-700 flex items-center gap-2">
                              <Lightbulb className={`h-4 w-4 ${isOn ? 'text-amber-500' : 'text-slate-400'}`} />
                              <span>Light: <strong>{lightLabel}</strong></span>
                              {lightsReport.length === 0 ? <span className="text-xs text-slate-400">(no lights_report in report)</span> : null}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Status from latest agent report (refresh ~30 s). After turning light on, wait for next push.</p>
                          </div>
                        );
                      })()}
                      <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={commandState === 'loading'}
                        leftIcon={commandState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                        onClick={async () => {
                          setCommandError('');
                          setCommandState('loading');
                          const body = mode === 'cloud' && cloudSessionLoggedIn && agentPayload?.deviceId != null
                            ? { mode: 'cloud' as const, cloudDeviceId: String(agentPayload.deviceId), command: 'ledctrl' as const, led_mode: 'on' as const }
                            : { mode: 'lan' as const, printerIp: printerIp.trim(), deviceId: deviceId.trim(), accessCode: accessCode.trim(), command: 'ledctrl' as const, led_mode: 'on' as const };
                          try {
                            const res = await fetch('/api/dev/bambu-command', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(body),
                              credentials: 'include',
                            });
                            const j = (await res.json()) as { success?: boolean; error?: string };
                            if (j.success) { setCommandState('success'); setTimeout(() => setCommandState('idle'), 2000); } else { setCommandError(j.error ?? 'Error'); setCommandState('error'); }
                          } catch (e) {
                            setCommandError(e instanceof Error ? e.message : 'Error'); setCommandState('error');
                          }
                        }}
                      >
                        Light on
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={commandState === 'loading'}
                        onClick={async () => {
                          setCommandError('');
                          setCommandState('loading');
                          const body = mode === 'cloud' && cloudSessionLoggedIn && agentPayload?.deviceId != null
                            ? { mode: 'cloud' as const, cloudDeviceId: String(agentPayload.deviceId), command: 'ledctrl' as const, led_mode: 'off' as const }
                            : { mode: 'lan' as const, printerIp: printerIp.trim(), deviceId: deviceId.trim(), accessCode: accessCode.trim(), command: 'ledctrl' as const, led_mode: 'off' as const };
                          try {
                            const res = await fetch('/api/dev/bambu-command', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(body),
                              credentials: 'include',
                            });
                            const j = (await res.json()) as { success?: boolean; error?: string };
                            if (j.success) { setCommandState('success'); setTimeout(() => setCommandState('idle'), 2000); } else { setCommandError(j.error ?? 'Error'); setCommandState('error'); }
                          } catch (e) {
                            setCommandError(e instanceof Error ? e.message : 'Error'); setCommandState('error');
                          }
                        }}
                      >
                        Light off
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={commandState === 'loading'}
                        leftIcon={<Video className="h-4 w-4" />}
                        onClick={async () => {
                          setCommandError('');
                          setCommandState('loading');
                          const body = mode === 'cloud' && cloudSessionLoggedIn && agentPayload?.deviceId != null
                            ? { mode: 'cloud' as const, cloudDeviceId: String(agentPayload.deviceId), command: 'ipcam_record_set' as const, control: 'enable' as const }
                            : { mode: 'lan' as const, printerIp: printerIp.trim(), deviceId: deviceId.trim(), accessCode: accessCode.trim(), command: 'ipcam_record_set' as const, control: 'enable' as const };
                          try {
                            const res = await fetch('/api/dev/bambu-command', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(body),
                              credentials: 'include',
                            });
                            const j = (await res.json()) as { success?: boolean; error?: string };
                            if (j.success) { setCommandState('success'); setTimeout(() => setCommandState('idle'), 2000); } else { setCommandError(j.error ?? 'Error'); setCommandState('error'); }
                          } catch (e) {
                            setCommandError(e instanceof Error ? e.message : 'Error'); setCommandState('error');
                          }
                        }}
                      >
                        Recording on
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={commandState === 'loading'}
                        onClick={async () => {
                          setCommandError('');
                          setCommandState('loading');
                          const body = mode === 'cloud' && cloudSessionLoggedIn && agentPayload?.deviceId != null
                            ? { mode: 'cloud' as const, cloudDeviceId: String(agentPayload.deviceId), command: 'ipcam_record_set' as const, control: 'disable' as const }
                            : { mode: 'lan' as const, printerIp: printerIp.trim(), deviceId: deviceId.trim(), accessCode: accessCode.trim(), command: 'ipcam_record_set' as const, control: 'disable' as const };
                          try {
                            const res = await fetch('/api/dev/bambu-command', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(body),
                              credentials: 'include',
                            });
                            const j = (await res.json()) as { success?: boolean; error?: string };
                            if (j.success) { setCommandState('success'); setTimeout(() => setCommandState('idle'), 2000); } else { setCommandError(j.error ?? 'Error'); setCommandState('error'); }
                          } catch (e) {
                            setCommandError(e instanceof Error ? e.message : 'Error'); setCommandState('error');
                          }
                        }}
                      >
                        Recording off
                      </Button>
                      </div>
                      {commandError ? <p className="mt-2 text-xs text-red-600">{commandError}</p> : null}
                      {(() => {
                        const streamFromLan = mode === 'lan' && printerIp.trim() && accessCode.trim();
                        const streamFromCloud = mode === 'cloud' && agentPayload?.printerIp != null && agentPayload?.accessCode != null;
                        const streamIp = streamFromLan ? printerIp.trim() : (streamFromCloud ? String(agentPayload.printerIp) : '');
                        const streamCode = streamFromLan ? accessCode.trim() : (streamFromCloud ? String(agentPayload.accessCode) : '');
                        if (streamIp && streamCode) {
                          const streamUrl322 = `rtsps://bblp:${streamCode}@${streamIp}:322/streaming/live/1`;
                          const streamUrlNoPort = `rtsps://bblp:${streamCode}@${streamIp}/streaming/live/1`;
                          return (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                Built-in printer camera (A1 / X1 – live view in LAN)
                                {streamFromCloud ? ' — data from agent (BAMBU_PRINTER_IP, BAMBU_ACCESS_CODE)' : null}
                              </p>
                              <p className="text-xs text-slate-600 mb-2">
                                On printer enable: <strong>Settings → Camera options → Video</strong> (A1) or <strong>LAN Mode Liveview</strong> (X1).
                              </p>
                              <div className="mb-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                  Camera snapshot (port 6000 – like ha-bambulab)
                                </p>
                                {!showCameraImage ? (
                                  <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="sm" leftIcon={<Video className="h-4 w-4" />} onClick={() => setShowCameraImage(true)}>
                                      Show image
                                    </Button>
                                    <span className="text-[11px] text-slate-500">Image loading off by default. Click to enable.</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-start gap-3">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- dynamic API snapshot URL with cache-busting */}
                                    <img
                                      key={cameraSnapshotKey}
                                      src={`/api/dev/bambu-camera-snapshot?printerIp=${encodeURIComponent(streamIp)}&accessCode=${encodeURIComponent(streamCode)}${agentPayload?.deviceId != null ? `&deviceId=${encodeURIComponent(String(agentPayload.deviceId))}` : ''}&_=${cameraSnapshotKey}`}
                                      alt="Printer camera snapshot"
                                      className="max-w-full w-80 h-48 object-contain bg-slate-100 border border-slate-200 rounded-xl"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <div>
                                      <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => setCameraSnapshotKey((k) => k + 1)}>
                                          Refresh image
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setShowCameraImage(false)}>
                                          Hide image
                                        </Button>
                                      </div>
                                      <p className="text-[11px] text-slate-500 mt-2 max-w-xs">Fetches one image from printer (TCP port 6000). Works for A1/P1 when Video is enabled in camera settings.</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mb-2">
                                RTSP stream (VLC / Bambu Studio): try the addresses below.
                              </p>
                              <div className="space-y-2 mb-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <code className="flex-1 min-w-0 text-xs bg-slate-100 border border-slate-200 rounded-xl p-3 break-all">
                                    {streamUrl322}
                                  </code>
                                  <Button type="button" variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(streamUrl322); setStreamUrlCopied(true); setTimeout(() => setStreamUrlCopied(false), 1500); }}>
                                    {streamUrlCopied ? 'Copied!' : 'Copy (port 322)'}
                                  </Button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <code className="flex-1 min-w-0 text-xs bg-slate-100 border border-slate-200 rounded-xl p-3 break-all">
                                    {streamUrlNoPort}
                                  </code>
                                  <Button type="button" variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(streamUrlNoPort); setStreamUrlCopied(true); setTimeout(() => setStreamUrlCopied(false), 1500); }}>
                                    {streamUrlCopied ? 'Copied!' : 'Copy (no port)'}
                                  </Button>
                                </div>
                              </div>
                              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                                <strong>Note (source: <a href="https://github.com/greghesp/ha-bambulab" target="_blank" rel="noreferrer" className="underline">ha-bambulab</a>):</strong> In Home Assistant <strong>RTSP stream</strong> is supported only for <strong>X1, P2S, H2</strong>. <strong>A1 / A1 Mini</strong> have snapshot-only camera there, no RTSP. So on <strong>A1</strong> live view works only in <strong>Bambu Studio</strong> (after connecting printer) or <strong>Bambu Lab</strong> app. You can try the addresses above on X1/P2S/H2; for A1 they are not officially supported.
                              </div>
                            </div>
                          );
                        }
                        if (mode === 'cloud' && agentPayload?.deviceId != null) {
                          return (
                            <p className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                              Live stream in Cloud mode: use Bambu Lab app or Bambu Studio (cloud view). To see RTSP URL here, run agent with <code className="bg-slate-100 px-1 rounded">BAMBU_PRINTER_IP</code> and <code className="bg-slate-100 px-1 rounded">BAMBU_ACCESS_CODE</code> set (IP and code from printer screen).
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No data from agent. Run agent (e.g. <code className="bg-slate-100 px-1 rounded">./bambu-agent</code>) with BAMBU_EMAIL, BAMBU_PASSWORD and optionally BAMBU_TFA_CODE set.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function PrinterStatusCard({ data }: { data: Record<string, unknown> }) {
  const print = (data.print ?? {}) as Record<string, unknown>;
  const gcodeState = String(print.gcode_state ?? '—');
  const bedTemper = print.bed_temper != null ? Math.round(Number(print.bed_temper)) : null;
  const bedTarget = print.bed_target_temper != null ? Math.round(Number(print.bed_target_temper)) : null;
  const nozzleTemper = print.nozzle_temper != null ? Math.round(Number(print.nozzle_temper)) : null;
  const nozzleTarget = print.nozzle_target_temper != null ? Math.round(Number(print.nozzle_target_temper)) : null;
  const mcPercent = print.mc_percent != null ? Number(print.mc_percent) : null;
  const layerNum = print.layer_num != null ? Number(print.layer_num) : null;
  const totalLayers = print.total_layer_num != null ? Number(print.total_layer_num) : null;
  const subtaskName = print.subtask_name ? String(print.subtask_name) : null;
  const wifiSignal = print.wifi_signal != null ? String(print.wifi_signal) : null;
  const lightsFromPrint = Array.isArray(print.lights_report) ? print.lights_report as { node?: string; mode?: string }[] : [];
  const lightsFromData = Array.isArray(data.lights_report) ? data.lights_report as { node?: string; mode?: string }[] : [];
  const lightsReport = lightsFromPrint.length > 0 ? lightsFromPrint : lightsFromData;
  const chamberLight = lightsReport.find((r) => r?.node === 'chamber_light');
  const rawLightMode = chamberLight?.mode != null ? String(chamberLight.mode).toLowerCase() : null;
  const lightStatusLabel = rawLightMode === 'on' ? 'On' : rawLightMode === 'off' ? 'Off' : rawLightMode === 'flashing' ? 'Flashing' : rawLightMode != null ? `? (${chamberLight?.mode})` : null;
  const lightIsOn = rawLightMode === 'on';
  // mc_remaining_time is in minutes (not seconds)
  const remainingMin = print.mc_remaining_time != null ? Math.round(Number(print.mc_remaining_time)) : null;
  const remainingLabel =
    remainingMin != null && remainingMin > 0
      ? remainingMin >= 60
        ? `${Math.floor(remainingMin / 60)} h ${remainingMin % 60} min`
        : `~${remainingMin} min`
      : null;

  const rows: { label: string; value: React.ReactNode; icon?: React.ReactNode }[] = [
    { label: 'State', value: gcodeState, icon: <Activity className="h-4 w-4" /> },
    ...(lightStatusLabel ? [{ label: 'Light', value: lightStatusLabel, icon: <Lightbulb className={`h-4 w-4 ${lightIsOn ? 'text-amber-500' : 'text-slate-400'}`} /> }] : []),
    ...(bedTemper != null
      ? [{ label: 'Bed', value: `${bedTemper}°C${bedTarget != null ? ` / ${bedTarget}°C` : ''}`, icon: <ThermometerSun className="h-4 w-4" /> }]
      : []),
    ...(nozzleTemper != null
      ? [{ label: 'Nozzle', value: `${nozzleTemper}°C${nozzleTarget != null ? ` / ${nozzleTarget}°C` : ''}`, icon: <ThermometerSun className="h-4 w-4" /> }]
      : []),
    ...(mcPercent != null ? [{ label: 'Progress', value: `${mcPercent}%`, icon: <Layers className="h-4 w-4" /> }] : []),
    ...(layerNum != null && totalLayers != null && totalLayers > 0
      ? [{ label: 'Layer', value: `${layerNum} / ${totalLayers}` }]
      : []),
    ...(remainingLabel ? [{ label: 'Remaining', value: remainingLabel }] : []),
    ...(subtaskName ? [{ label: 'Task', value: subtaskName }] : []),
    ...(wifiSignal ? [{ label: 'Wi‑Fi', value: wifiSignal, icon: <WifiIcon className="h-4 w-4" /> }] : []),
  ];

  return (
    <div className="mt-4 bg-slate-50 rounded-2xl border border-slate-200 p-5">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        Printer status
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ label, value, icon }) => (
          <div key={label} className="flex items-center gap-2">
            {icon && <span className="text-slate-400">{icon}</span>}
            <dt className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {label}
            </dt>
            <dd className="font-semibold text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
      <details className="mt-4">
        <summary className="text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-700">
          Full response (JSON)
        </summary>
        <pre className="mt-2 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 overflow-auto max-h-64">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
