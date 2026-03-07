'use client';

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { authClient } from '@/lib/auth-client';
import { useSession } from '@/hooks/useSession';
import { safeJsonParse } from '@/lib/fetch-json';

// =================================================================
// SOCIAL ICONS (SVG) – from gist
// =================================================================
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { data: session, refetch } = useSession();
  const userId = session?.user?.id;
  const twoFactorRequired = false;
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'forgot' | '2fa'>('login');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registerCompleted, setRegisterCompleted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const checkMaintenance = async () => {
      try {
        const response = await fetch('/api/maintenance');
        if (response.ok) {
          const data = await safeJsonParse(response);
          setMaintenanceMode(data.enabled || false);
        }
      } catch {
        // fail open
      }
    };
    checkMaintenance();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const searchParams = new URLSearchParams(window.location.search);
    const oauthError = searchParams.get('error');
    const emailConfirmed = searchParams.get('email_confirmed');
    const view = searchParams.get('view') as 'login' | 'register' | 'forgot' | '2fa' | null;

    if (view && ['login', 'register', 'forgot', '2fa'].includes(view)) {
      setCurrentView(view);
    }
    if (oauthError) {
      if (oauthError === 'oauth_failed' || oauthError === 'oauth_error') {
        setError('OAuth authentication failed. Please try again.');
      } else if (oauthError === 'maintenance_mode_admin_only') {
        setError('Only administrators can sign in during maintenance mode.');
      } else {
        setError('An error occurred during authentication.');
      }
    }
    if (emailConfirmed === '1' || emailConfirmed === 'true') {
      setSuccess('✓ Email confirmed. You can now sign in.');
    }
    if (oauthError || emailConfirmed || view) {
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('email_confirmed');
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.toString());
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const code = new URLSearchParams(window.location.search).get('code');
    const state = new URLSearchParams(window.location.search).get('state');
    if (code && state) {
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      window.history.replaceState({}, '', url.toString());
      refetch();
    }
  }, [mounted, refetch]);

  useEffect(() => {
    if (!mounted || isRedirecting) return;
    if (twoFactorRequired) {
      setIsRedirecting(true);
      router.replace('/two-factor');
      return;
    }
    if (userId && currentView === 'login') {
      setIsRedirecting(true);
      setTimeout(() => router.replace('/dashboard'), 100);
    }
  }, [mounted, isRedirecting, twoFactorRequired, userId, router, currentView]);

  useEffect(() => {
    if (!registerCompleted) return;
    const t = setTimeout(() => {
      setRegisterCompleted(false);
      setCurrentView('login');
      setSuccess('');
      setError('');
    }, 5000);
    return () => clearTimeout(t);
  }, [registerCompleted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in email and password');
      return;
    }
    setLoadingAction('login');
    setError('');
    setSuccess('');
    try {
      const { error: err } = await authClient.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (err) {
        setError(err.message || 'Sign in error');
      } else {
        setSuccess('✓ Signed in. Redirecting...');
        setEmail('');
        setPassword('');
        await refetch();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign in error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (maintenanceMode) {
      setError('Registration is currently disabled due to maintenance.');
      return;
    }
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!fullName) {
      setError('Please enter your first and last name');
      return;
    }
    if (!email || !password) {
      setError('Please fill in email and password');
      return;
    }
    setLoadingAction('register');
    setError('');
    setSuccess('');
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { error: err } = await authClient.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { name: fullName, company: company.trim() || undefined } },
      });
      if (err) {
        setError(err.message?.includes('already') || err.message?.includes('exists') ? 'This email already exists' : err.message || 'Sign up error');
      } else {
        try {
          const res = await fetch('/api/auth/post-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            setError((data && typeof data.error === 'string' && data.error) || 'Failed to send confirmation email.');
            await authClient.auth.signOut();
            return;
          }
          if (data?.mode === 'confirmation') {
            setSuccess('✓ Account created. Check your inbox to confirm your email.');
            await authClient.auth.signOut();
          } else {
            setSuccess('✓ Account created. You can now sign in.');
          }
          setRegisterCompleted(true);
          setEmail('');
          setPassword('');
          setFirstName('');
          setLastName('');
          setCompany('');
        } catch {
          setError('Failed to send confirmation email.');
          await authClient.auth.signOut();
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign up error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoadingAction('forgot');
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Password reset request error');
      } else {
        setSuccess('If the account exists, a reset link has been sent.');
        setCurrentView('login');
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Server error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    setLoadingAction(provider);
    setError('');
    setSuccess('');
    try {
      const { data, error: err } = await authClient.auth.signInWithOAuth({
        provider: provider === 'google' ? 'google' : 'github',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (err) {
        setError(err.message || 'OAuth error');
        setLoadingAction(null);
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'OAuth error');
      setLoadingAction(null);
    }
  };

  if (!mounted) return null;

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="text-slate-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // ----- VIEW 1: LOGIN -----
  const renderLogin = () => (
    <div className="space-y-6">
      {maintenanceMode && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <strong>Maintenance Mode:</strong> Only administrators can sign in.
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm">{success}</div>
      )}
      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email address</label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. you@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
            <button type="button" onClick={() => { setError(''); setSuccess(''); setCurrentView('forgot'); }} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-600 cursor-pointer">
            Remember me for 30 days
          </label>
        </div>

        <button
          type="submit"
          disabled={!!loadingAction}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loadingAction === 'login' ? 'Signing in...' : <>Sign in <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-slate-400 font-medium">OR CONTINUE WITH</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <button
          type="button"
          onClick={() => handleSocialSignIn('google')}
          disabled={!!loadingAction}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
        >
          <GoogleIcon />
          Google
        </button>
        <button
          type="button"
          onClick={() => handleSocialSignIn('github')}
          disabled={!!loadingAction}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
        >
          <GitHubIcon />
          GitHub
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm font-medium text-slate-600">
          Don’t have an account yet?{' '}
          {!maintenanceMode && (
            <button type="button" onClick={() => { setCurrentView('register'); setError(''); setSuccess(''); }} className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Create a free account
            </button>
          )}
        </p>
      </div>
    </div>
  );

  // ----- VIEW 2: REGISTER -----
  const renderRegister = () => (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
      {maintenanceMode && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <strong>Registration disabled</strong> due to maintenance.
        </div>
      )}
      {registerCompleted ? (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
          <p className="font-medium">{success || 'Account created.'}</p>
          <p className="text-xs text-green-800 mt-1">You’ll be redirected back to login shortly.</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => handleSocialSignIn('google')}
              disabled={!!loadingAction || maintenanceMode}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignIn('github')}
              disabled={!!loadingAction || maintenanceMode}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
            >
              <GitHubIcon />
              GitHub
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-slate-400 font-medium">OR WITH EMAIL</span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">First name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Last name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Company name (optional)</label>
              <div className="relative">
                <Building2 className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme 3D"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-2">Must contain at least 8 characters and a number.</p>
              <PasswordStrengthIndicator password={password} className="mt-2" />
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5 mt-0.5">
                <input id="terms" name="terms" type="checkbox" required className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-slate-600">
                  I accept the <Link href="/legal?doc=terms" className="font-bold text-indigo-600 hover:text-indigo-800">Terms of Service</Link> and <Link href="/legal?doc=privacy" className="font-bold text-indigo-600 hover:text-indigo-800">Privacy Policy</Link>.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!!loadingAction || maintenanceMode}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loadingAction === 'register' ? 'Creating account...' : <>Create free account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm font-medium text-slate-600">
          Already have an account?{' '}
          <button type="button" onClick={() => { setCurrentView('login'); setError(''); setSuccess(''); }} className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );

  // ----- VIEW 3: FORGOT PASSWORD -----
  const renderForgot = () => (
    <div className="space-y-6 animate-in slide-in-from-left-8 duration-300">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center mb-6">
        <p className="text-sm font-medium text-indigo-900">
          Enter the email address associated with your account and we’ll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm">{success}</div>
      )}

      <form className="space-y-5" onSubmit={handleForgot}>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email address</label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!!loadingAction}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-70"
        >
          {loadingAction === 'forgot' ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => { setCurrentView('login'); setError(''); setSuccess(''); }}
          className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </button>
      </div>
    </div>
  );

  // ----- VIEW 4: 2FA (redirect to /two-factor for actual verification) -----
  const render2FA = () => (
    <div className="space-y-6 animate-in zoom-in-95 duration-300">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="text-sm font-medium text-slate-600">
          Two-factor verification. Redirecting to 2FA page...
        </p>
      </div>
      <div className="mt-6 text-center">
        <Link
          href="/two-factor"
          className="inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold shadow-md transition-all"
        >
          Go to 2FA verification <CheckCircle2 className="w-4 h-4" />
        </Link>
        <button
          type="button"
          onClick={() => setCurrentView('login')}
          className="mt-4 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </button>
      </div>
    </div>
  );

  // ----- MAIN RENDER -----
  return (
    <>
      {currentView === 'login' && (
        <AuthLayout title="Sign in to Layerly" subtitle="Welcome back! Manage your 3D print farm.">
          {renderLogin()}
        </AuthLayout>
      )}

      {currentView === 'register' && (
        <AuthLayout title="Create account" subtitle="Start your 14-day trial. No card required.">
          {renderRegister()}
        </AuthLayout>
      )}

      {currentView === 'forgot' && (
        <AuthLayout title="Reset password" subtitle="Don’t worry, it happens to the best of us.">
          {renderForgot()}
        </AuthLayout>
      )}

      {currentView === '2fa' && (
        <AuthLayout title="Two-factor verification" subtitle="Your account is additionally protected.">
          {render2FA()}
        </AuthLayout>
      )}
    </>
  );
}
