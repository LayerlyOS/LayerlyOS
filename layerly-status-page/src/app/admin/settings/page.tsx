'use client';

import { useEffect, useState } from 'react';
import { Settings, BarChart2, Globe, Info, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataLoader } from '@/components/ui/DataLoader';
import { toast } from 'sonner';

type BarInterval = 'minute' | 'hourly' | '6h' | 'daily';

type Config = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  barInterval: BarInterval;
  notificationEmail: string | null;
} | null;

const BAR_INTERVAL_OPTIONS = [
  { value: 'minute', label: 'Every minute — last 2 hours (120 bars)', icon: <BarChart2 className="w-4 h-4" /> },
  { value: 'hourly', label: 'Hourly — last 7 days (168 bars)',        icon: <BarChart2 className="w-4 h-4" /> },
  { value: '6h',     label: 'Every 6 hours — last 14 days (56 bars)', icon: <BarChart2 className="w-4 h-4" /> },
  { value: 'daily',  label: 'Daily — last 90 days (90 bars)',         icon: <BarChart2 className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const [, setConfig] = useState<Config>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    name:              '',
    description:       '',
    logoUrl:           '',
    barInterval:       'hourly' as BarInterval,
    notificationEmail: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/config')
      .then((res) => res.json())
      .then((data: Config) => {
        setConfig(data);
        setForm({
          name:              data?.name ?? 'Status Page',
          description:       data?.description ?? '',
          logoUrl:           data?.logoUrl ?? '',
          barInterval:       (data?.barInterval as BarInterval) ?? 'hourly',
          notificationEmail: data?.notificationEmail ?? '',
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:              form.name.trim() || 'Status Page',
          description:       form.description.trim() || null,
          logoUrl:           form.logoUrl.trim() || null,
          barInterval:       form.barInterval,
          notificationEmail: form.notificationEmail.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Settings saved');
      const data = await res.json();
      setConfig(data);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Status page configuration"
        icon={<Settings className="w-6 h-6" />}
        actions={
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
          >
            Save changes
          </Button>
        }
      />

      {isLoading ? (
        <div className="mt-8"><DataLoader message="Loading settings..." /></div>
      ) : (
        <div className="mt-8 space-y-5">

          {/* ── General ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">General</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Page name and description
                </p>
              </div>
            </div>
            <div className="p-6">
              <div className="max-w-xl space-y-5">
                <Input
                  label="Page name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Status Page"
                />
                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description shown on the public page"
                  rows={2}
                />
                <Input
                  label="Logo URL"
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  helperText="Custom logo for the public status page (optional)"
                />
                <Input
                  label="Notification email"
                  type="email"
                  value={form.notificationEmail}
                  onChange={(e) => setForm((f) => ({ ...f, notificationEmail: e.target.value }))}
                  placeholder="alerts@yourdomain.com"
                  helperText="Receive email alert when a monitor goes down (requires RESEND_API_KEY)"
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          {/* ── Uptime chart ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Uptime chart</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  How history bars are grouped on the status page
                </p>
              </div>
            </div>
            <div className="p-6">
              <div className="max-w-xl space-y-5">
                <CustomSelect
                  label="Default bar interval"
                  icon={BarChart2}
                  options={BAR_INTERVAL_OPTIONS}
                  value={form.barInterval}
                  onChange={(v) => setForm((f) => ({ ...f, barInterval: v as BarInterval }))}
                  helperText={
                    form.barInterval === 'minute'
                      ? 'Shows last 2 hours, 1 bar per minute (120 bars) — highest resolution for live monitoring'
                      : form.barInterval === 'hourly'
                      ? 'Shows last 7 days, 1 bar per hour — best for catching short outages'
                      : form.barInterval === '6h'
                      ? 'Shows last 14 days, 1 bar per 6 hours — good balance'
                      : 'Shows last 90 days, 1 bar per day — best for long-term trends'
                  }
                />

                {/* Preview */}
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Preview</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    {(() => {
                      const barCount    = form.barInterval === 'minute' ? 120 : 90;
                      const recentCount = form.barInterval === 'minute' ? 10 : form.barInterval === 'hourly' ? 6 : form.barInterval === '6h' ? 4 : 3;
                      const leftLabel   = form.barInterval === 'minute' ? '2h ago' : form.barInterval === 'hourly' ? '7d ago' : form.barInterval === '6h' ? '14d ago' : '90d ago';
                      return (
                        <>
                          <div className="flex items-end gap-[3px]" style={{ height: 44 }}>
                            {Array.from({ length: barCount }).map((_, i, arr) => {
                              const isLast   = i === arr.length - 1;
                              const isRecent = i >= arr.length - recentCount;
                              return (
                                <div
                                  key={i}
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                    height: isRecent ? 44 : 14,
                                    borderRadius: 4,
                                    backgroundColor: isLast ? '#34d399' : isRecent ? '#34d39988' : '#e2e8f0',
                                    opacity: isRecent ? 1 : 0.5,
                                    alignSelf: 'flex-end',
                                  }}
                                />
                              );
                            })}
                          </div>
                          <div className="flex justify-between mt-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{leftLabel}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Now</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Admin access ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Admin access</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Managing admin users
                </p>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-xl">
                <p className="text-sm text-amber-800 font-medium leading-relaxed">
                  To add an admin, insert a row into the{' '}
                  <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                    status_page_admins
                  </code>{' '}
                  table with the Supabase user ID.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
