'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, UserPlus, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/needs-bootstrap')
      .then((r) => r.json())
      .then((d) => setNeedsBootstrap(d.needsBootstrap))
      .catch(() => setNeedsBootstrap(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); return; }
    setIsLoading(true);
    try {
      const { error } = await authClient.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); setIsLoading(false); return; }
      toast.success('Signed in successfully');
      router.push('/admin');
      router.refresh();
    } catch { toast.error('Something went wrong'); }
    finally   { setIsLoading(false); }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || password.length < 6) {
      toast.error('Email and password (min 6 chars) required'); return;
    }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/admin/bootstrap', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed'); setIsLoading(false); return; }
      toast.success('Admin created! Signing you in...');
      const { error } = await authClient.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error('Created but sign-in failed. Try logging in manually.');
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch { toast.error('Something went wrong'); }
    finally   { setIsLoading(false); }
  };

  if (needsBootstrap === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isBootstrap = needsBootstrap;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav className="bg-white sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Status
          </Link>
          <div style={{ height: 36 }}>
            <Logo variant="dark" className="h-full w-auto" />
          </div>
          <div className="w-24" />
        </div>
      </nav>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Header above card */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isBootstrap ? 'Initial Setup' : 'Admin Panel'}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {isBootstrap
                ? 'Create your first admin account'
                : 'Sign in to manage your status page'}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <form onSubmit={isBootstrap ? handleBootstrap : handleLogin} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder={isBootstrap ? 'Min 6 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                minLength={isBootstrap ? 6 : undefined}
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
                loadingText={isBootstrap ? 'Creating admin...' : 'Signing in...'}
                leftIcon={isBootstrap ? <UserPlus className="w-4 h-4" /> : undefined}
              >
                {isBootstrap ? 'Create Admin & Sign In' : 'Sign In'}
              </Button>
            </form>

            {isBootstrap && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">
                  One-time setup
                </p>
                <p className="text-xs text-amber-700/80 leading-relaxed">
                  This form appears only once. After creating the admin account, you&apos;ll be redirected to the panel.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
