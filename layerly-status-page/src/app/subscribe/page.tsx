'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Bell, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
// REWRITTEN — light Layerly layout

export default function SubscribePage() {
  const [email, setEmail]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to subscribe'); setIsLoading(false); return; }
      setSubscribed(true);
      toast.success('Subscribed successfully!');
    } catch { toast.error('Something went wrong'); }
    finally   { setIsLoading(false); }
  };

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
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Header above card */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stay in the loop</h1>
            <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">
              Get notified by email when we post status updates,<br className="hidden sm:block" />
              incidents or maintenance windows.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {subscribed ? (
              <div className="flex flex-col items-center gap-5 py-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-xl tracking-tight">You&apos;re subscribed!</p>
                  <p className="text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
                    We&apos;ll notify you when there are incidents or maintenance.
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors mt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to status page
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  loadingText="Subscribing..."
                  leftIcon={<Bell className="w-4 h-4" />}
                >
                  Subscribe to updates
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  No spam. Unsubscribe at any time.
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
