'use client';

import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useSession } from '@/hooks/useSession';

const LENGTH = 6;

export default function TwoFactorPage() {
  const router = useRouter();
  const { data: session, refetch, isPending } = useSession();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isPending && session?.user) {
      router.replace('/dashboard');
    }
  }, [isPending, mounted, router, session?.user]);

  const digits = Array.from({ length: LENGTH }, (_, i) => code.replace(/\D/g, '').slice(i, i + 1) || '');

  const setDigit = (index: number, value: string) => {
    const raw = code.replace(/\D/g, '').slice(0, LENGTH);
    const arr = Array.from({ length: LENGTH }, (_, i) => raw[i] ?? '');
    arr[index] = value.slice(-1);
    setCode(arr.join(''));
  };

  const focus = (index: number) => {
    refs.current[index]?.focus();
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(-1);
    setDigit(index, raw);
    if (raw && index < LENGTH - 1) focus(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleVerify();
      return;
    }
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      setDigit(index - 1, '');
      focus(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    setCode(pasted);
    focus(Math.min(pasted.length, LENGTH - 1));
  };

  const handleVerify = async () => {
    const clean = code.replace(/\D/g, '');
    if (clean.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // TODO: Supabase MFA verification when enabled
      console.warn('Supabase MFA verification not implemented yet');
      const res = { error: { message: 'MFA not configured yet' } } as { error?: { message: string } };
      if (res?.error) {
        setError(res.error.message || 'Verification error');
        return;
      }
      setSuccess('✓ Verified. Redirecting...');
      setCode('');
      await refetch();
      router.replace('/dashboard');
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Two-factor verification"
      subtitle="Your account is additionally protected."
    >
      <div className="space-y-6 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            Enter the 6-digit code from your authenticator app (e.g. Google Authenticator).
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm">{success}</div>
        )}

        <form
          className="space-y-8"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            handleVerify();
          }}
        >
          <div className="flex justify-between gap-2 sm:gap-4" onPaste={handlePaste}>
            {Array.from({ length: LENGTH }, (_, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digits[i]}
                onChange={(e) => handleChange(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-14 sm:w-12 sm:h-16 bg-white border-2 border-slate-200 rounded-xl text-center text-2xl font-black text-slate-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="-"
                disabled={loading}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Verifying...' : <>Verify and continue <CheckCircle2 className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <button
            type="button"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Lost access to your authenticator app?
          </button>
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => router.replace('/login')}
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
