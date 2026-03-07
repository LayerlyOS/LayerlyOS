'use client';

import { ArrowLeft, Lock, Loader2, Mail } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';
  const hasTokenParam = !!token;
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!hasTokenParam) {
      setTokenInvalid(false);
      setTokenValidated(false);
      return;
    }
    let cancelled = false;
    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
        if (cancelled) return;
        if (!res.ok) {
          setTokenInvalid(true);
          setTokenValidated(true);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!data?.valid) {
          setTokenInvalid(true);
          setTokenValidated(true);
          return;
        }
        setTokenInvalid(false);
        setTokenValidated(true);
      } catch {
        if (cancelled) return;
        setTokenInvalid(true);
        setTokenValidated(true);
      }
    };
    void validateToken();
    return () => { cancelled = true; };
  }, [hasTokenParam, token]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
        setSuccess('If the account exists, a reset link has been sent to the email provided.');
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!newPassword || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Password reset error');
        if (res.status === 400) setTokenInvalid(true);
        return;
      }
      setSuccess('✓ Password has been set. You can now sign in.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => router.replace('/login'), 1500);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (!hasTokenParam) {
    return (
      <AuthLayout
        title="Reset password"
        subtitle="Don’t worry, it happens to the best of us."
      >
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

          <form className="space-y-5" onSubmit={handleRequest}>
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
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-70"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.replace('/login')}
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!tokenValidated) {
    return (
      <AuthLayout
        title="Checking link"
        subtitle="Verifying your password reset link."
      >
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
            <span>Verifying your password reset link...</span>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.replace('/login')}
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (tokenInvalid) {
    return (
      <AuthLayout
        title="Invalid link"
        subtitle="This password reset link is invalid or has expired. You can request a new one."
      >
        <div className="space-y-6 animate-in slide-in-from-left-8 duration-300">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            The link is invalid or has expired. Use the button below to go back and request a new link.
          </div>
          <button
            type="button"
            onClick={() => router.replace('/reset-password')}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all"
          >
            Request new link
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.replace('/login')}
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Enter a new, secure password for your account."
    >
      <div className="space-y-6 animate-in zoom-in-95 duration-300">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm">{success}</div>
        )}

        <form className="space-y-5" onSubmit={handleReset}>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">New password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-bold mt-2">Min. 8 characters.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Confirm password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold shadow-md transition-all disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Set new password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.replace('/login')}
            disabled={loading}
            className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
