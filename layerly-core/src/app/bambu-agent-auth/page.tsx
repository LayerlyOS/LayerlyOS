'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Printer, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type ApiResult =
  | { success: true; cloudAccessToken?: string }
  | { success: false; error: string }
  | { success: false; require2FA: true }
  | { success: false; requireVerificationCode: true }
  | { success: false; requireTfaFromBrowser: true; tfaKey: string };

export default function BambuAgentAuthPage() {
  const searchParams = useSearchParams();
  const port = searchParams.get('port') || '38473';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [requireTfaFromBrowser, setRequireTfaFromBrowser] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const redirectToAgent = useCallback(
    (t: string) => {
      setRedirecting(true);
      const url = `http://127.0.0.1:${port}/callback?token=${encodeURIComponent(t.trim())}`;
      window.location.href = url;
    },
    [port]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setError('');
    setRequireTfaFromBrowser(false);
    const body: Record<string, string> = { email: email.trim(), password };
    if (tfaCode.trim()) body.tfaCode = tfaCode.trim();

    // 1) First the agent (Python curl_cffi – login with 2FA without SaaS)
    try {
      const agentRes = await fetch(`http://127.0.0.1:${port}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const agentData = (await agentRes.json()) as {
        success?: boolean;
        accessToken?: string;
        require2FA?: boolean;
        error?: string;
      };
      if (agentData.success && agentData.accessToken) {
        await fetch('/api/dev/bambu-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: agentData.accessToken }),
          credentials: 'include',
        });
        redirectToAgent(agentData.accessToken);
        return;
      }
      if (agentData.require2FA) {
        setRequire2FA(true);
        setState('idle');
        return;
      }
      if (agentData.error && agentRes.ok) {
        setError(agentData.error);
        setState('error');
        return;
      }
    } catch {
      setError('Agent not running. In terminal run: cd agent && ./bambu-agent – agent will open this page and receive login.');
      setState('error');
      return;
    }

    // 2) Fallback: SaaS (when agent was not first in queue – usually unused)
    try {
      const res = await fetch('/api/dev/bambu-mqtt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'cloud', ...body, action: 'get_version' }),
      });
      const data = (await res.json()) as ApiResult & { cloudAccessToken?: string };
      if (data.success && data.cloudAccessToken) {
        await fetch('/api/dev/bambu-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: data.cloudAccessToken }),
          credentials: 'include',
        });
        redirectToAgent(data.cloudAccessToken);
        return;
      }
      if ('require2FA' in data && data.require2FA) {
        setRequire2FA(true);
        setState('idle');
        return;
      }
      if ('requireTfaFromBrowser' in data && data.requireTfaFromBrowser) {
        setRequireTfaFromBrowser(true);
        setState('idle');
        return;
      }
      if ('requireVerificationCode' in data && data.requireVerificationCode) {
        setError('This address requires a verification code from email.');
        setState('error');
        return;
      }
      setError((data as { error?: string }).error || 'Login failed');
      setState('error');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
      setState('error');
    }
  }

  return (
    <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <header className="mb-6 text-center">
            <h1 className="font-black text-slate-900 tracking-tight text-xl flex items-center justify-center gap-2">
              <Printer className="h-6 w-6 text-indigo-600" />
              Bambu agent login
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Sign in (email, password and 2FA code from app). Token will be passed to the agent automatically.
            </p>
          </header>

          {redirecting ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium text-emerald-800">
                Logged in. Redirecting to agent… You can close this tab.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    2FA code (if enabled – 6 digits from app)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={tfaCode}
                    onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Optional"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  />
                  {require2FA && (
                    <p className="mt-1.5 text-xs text-slate-500">Enter 2FA code and submit the form again.</p>
                  )}
                  {requireTfaFromBrowser && (
                    <p className="mt-2 text-xs text-amber-700">
                      This server does not bypass Cloudflare. Run agent: <code className="bg-slate-100 px-1 rounded">cd agent && ./bambu-agent</code> – agent will open this page, then enter email, password and 2FA code.
                    </p>
                  )}
                </div>
                {state === 'error' && error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                    <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={state === 'loading'}
                  leftIcon={state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                  className="w-full"
                >
                  {state === 'loading' ? 'Signing in…' : 'Sign in and pass token to agent'}
                </Button>
              </form>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
