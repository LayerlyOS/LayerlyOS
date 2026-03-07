'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Zap,
  Shield,
  KeyRound,
  Smartphone,
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Link,
  Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { authClient } from '@/lib/auth-client';
import { OtpInput } from '@/components/ui/OtpInput';
import { generateBackupCodesPDF } from '@/features/settings/utils/pdf-generator';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { FullPageLoader } from '@/components/ui/DataLoader';
import { PageHeader } from '@/components/ui/PageHeader';

interface Account {
  id: string;
  providerId: string;
  createdAt?: unknown;
  [key: string]: unknown;
}

interface ExtendedUser {
  id: string;
  email: string;
  twoFactorEnabled?: boolean;
  [key: string]: unknown;
}

const dateLocale = 'en-US';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const extendedSession = session as unknown as { user: ExtendedUser; twoFactorRequired?: boolean } | null;
  const twoFactorRequired = !!extendedSession?.twoFactorRequired;
  const [authGrace, setAuthGrace] = useState(true);

  // --- TOAST (exactly as in your code) ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });

  // Preferences
  const [kwhRate, setKwhRate] = useState(1.15);
  const [lowStockAlertPercent, setLowStockAlertPercent] = useState(20);
  const [isSavingKwh, setIsSavingKwh] = useState(false);

  // Security
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [setPassword, setSetPassword] = useState('');
  const [setPasswordConfirm, setSetPasswordConfirm] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // 2FA
  const [twoFactorSetupUri, setTwoFactorSetupUri] = useState('');
  const [twoFactorQrDataUrl, setTwoFactorQrDataUrl] = useState('');
  const [twoFactorSetupBackupCodes, setTwoFactorSetupBackupCodes] = useState<string[]>([]);
  const [twoFactorVerifyCode, setTwoFactorVerifyCode] = useState('');
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorIssuer] = useState('Layerly.cloud');
  const twoFactorPasswordId = useId();

  // OAuth disconnect
  const [accountToDisconnect, setAccountToDisconnect] = useState<string | null>(null);

  // Delete modal (exactly as in your code)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Backup file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  const formatConnectedAt = (value: unknown) => {
    if (!value) return 'No data';
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return 'No data';
    return d.toLocaleDateString(dateLocale, { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  useEffect(() => {
    if (userId) setAuthGrace(false);
    else {
      const t = setTimeout(() => setAuthGrace(false), 900);
      return () => clearTimeout(t);
    }
  }, [userId]);

  useEffect(() => {
    if (isPending || authGrace) return;
    if (userId) return;
    if (twoFactorRequired) {
      router.replace('/two-factor');
      return;
    }
    router.replace('/');
  }, [authGrace, isPending, router, twoFactorRequired, userId]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setKwhRate(Number(data.energyRate) || 1.15);
        setLowStockAlertPercent(
          data.lowStockAlertPercent != null ? Number(data.lowStockAlertPercent) : 20
        );
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/user/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (e) {
      console.error('Error fetching accounts:', e);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchSettings();
      fetchAccounts();
    }
  }, [session, fetchSettings, fetchAccounts]);

  useEffect(() => {
    let cancelled = false;
    async function generateQr() {
      if (!twoFactorSetupUri) {
        setTwoFactorQrDataUrl('');
        return;
      }
      try {
        const QRCode = await import('qrcode');
        const url = await QRCode.toDataURL(twoFactorSetupUri, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 220,
        });
        if (!cancelled) setTwoFactorQrDataUrl(url);
      } catch {
        if (!cancelled) setTwoFactorQrDataUrl('');
      }
    }
    generateQr();
    return () => {
      cancelled = true;
    };
  }, [twoFactorSetupUri]);

  const downloadBackupCodesPdf = async (codes: string[]) => {
    if (!codes.length) return;
    try {
      const email = extendedSession?.user?.email ?? '';
      await generateBackupCodesPDF(codes, email);
      showToast('Backup codes PDF saved.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to generate PDF', 'error');
    }
  };

  // --- HANDLERS (wired to real API, same behaviour as your code) ---

  const handleSaveKwh = async () => {
    setIsSavingKwh(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          energyRate: kwhRate,
          lowStockAlertPercent: Math.min(100, Math.max(0, lowStockAlertPercent)),
        }),
      });
      if (res.ok) {
        showToast('Energy rate has been updated.');
        fetchSettings();
      } else {
        showToast('Failed to save.', 'error');
      }
    } catch (_e) {
      showToast('Network error.', 'error');
    } finally {
      setIsSavingKwh(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    if (passwords.new.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    setLoadingAction('changePassword');
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: passwords.current, newPassword: passwords.new }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password has been changed successfully.');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        showToast(data.error ?? 'Failed to change password', 'error');
      }
    } catch (_e) {
      showToast('Network error.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setPassword !== setPasswordConfirm) {
      showToast('Passwords do not match!', 'error');
      return;
    }
    if (setPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    setLoadingAction('setPassword');
    try {
      const res = await fetch('/api/user/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: setPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('Password set successfully.');
        setSetPassword('');
        setSetPasswordConfirm('');
        fetchAccounts();
      } else {
        showToast((data as { error?: string }).error ?? 'Failed to set password', 'error');
      }
    } catch (_e) {
      showToast('Network error.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartEnableTwoFactor = async () => {
    if (!twoFactorPassword) {
      showToast('Password is required to enable 2FA.', 'error');
      return;
    }
    setLoadingAction('startEnable2FA');
    try {
      const res = await (authClient as any).twoFactor.enable({
        password: twoFactorPassword,
        issuer: twoFactorIssuer?.trim() || undefined,
      });
      if (res?.error) {
        showToast(res.error.message ?? 'Failed to enable 2FA', 'error');
      } else {
        setTwoFactorSetupUri(res?.data?.totpURI ?? '');
        setTwoFactorSetupBackupCodes(res?.data?.backupCodes ?? []);
        showToast('2FA setup started. Scan the QR code and enter the code.');
      }
    } catch (e: unknown) {
      showToast((e as { message?: string })?.message ?? 'Failed to enable 2FA', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConfirmEnableTwoFactor = async () => {
    if (!twoFactorVerifyCode.trim()) {
      showToast('Verification code is required.', 'error');
      return;
    }
    setLoadingAction('confirmEnable2FA');
    try {
      const res = await (authClient as any).twoFactor.verifyTotp({
        code: twoFactorVerifyCode.trim(),
      });
      if (res?.data) {
        showToast('Two-factor authentication has been enabled.');
        setTwoFactorSetupUri('');
        setTwoFactorPassword('');
        setTwoFactorVerifyCode('');
        router.refresh();
      } else {
        showToast('Invalid verification code.', 'error');
      }
    } catch (e: unknown) {
      showToast((e as { message?: string })?.message ?? 'Failed to verify code', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!twoFactorPassword) {
      showToast('Password is required to disable 2FA.', 'error');
      return;
    }
    setLoadingAction('disable2FA');
    try {
      const res = await (authClient as any).twoFactor.disable({ password: twoFactorPassword });
      if (res?.error) {
        showToast(res.error.message ?? 'Failed to disable 2FA', 'error');
      } else {
        showToast('Two-factor authentication has been disabled.', 'warning');
        setTwoFactorPassword('');
        router.refresh();
      }
    } catch (e: unknown) {
      showToast((e as { message?: string })?.message ?? 'Failed to disable 2FA', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleOauth = (provider: 'google' | 'github') => {
    const googleAccount = accounts.find((a) => a.providerId === 'google');
    const githubAccount = accounts.find((a) => a.providerId === 'github');
    const hasPasswordAccount = accounts.some((a) => a.providerId === 'credential');
    const isConnected = provider === 'google' ? !!googleAccount : !!githubAccount;
    const account = provider === 'google' ? googleAccount : githubAccount;

    if (isConnected && account) {
      const cannotDisconnect = !hasPasswordAccount && (
        (provider === 'google' && !githubAccount) || (provider === 'github' && !googleAccount)
      );
      if (cannotDisconnect) {
        showToast('Cannot disconnect the only login method.', 'error');
        return;
      }
      setAccountToDisconnect(account.id);
      return;
    }
    handleConnectOAuth(provider);
  };

  const handleConnectOAuth = async (provider: 'google' | 'github') => {
    setLoadingAction(`connectOAuth-${provider}`);
    try {
      const callbackURL = `${window.location.origin}/dashboard/settings`;
      const { data, error } = await authClient.auth.signInWithOAuth({
        provider: provider === 'google' ? 'google' : 'github',
        options: { redirectTo: callbackURL },
      });
      if (error) {
        showToast(error.message ?? 'OAuth error', 'error');
      } else if (data?.url) {
        window.location.href = data.url;
        return;
      } else {
        showToast('Failed to start OAuth', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('OAuth connection failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const confirmDisconnect = async () => {
    if (!accountToDisconnect) return;
    setLoadingAction(`disconnectOAuth-${accountToDisconnect}`);
    try {
      const res = await fetch(`/api/user/accounts/${accountToDisconnect}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Account disconnected.', 'warning');
        fetchAccounts();
      } else {
        showToast('Failed to disconnect account', 'error');
      }
    } catch (_e) {
      showToast('Network error.', 'error');
    } finally {
      setLoadingAction(null);
      setAccountToDisconnect(null);
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/backup?scope=user');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-user-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Backup file has been downloaded.');
    } catch (e) {
      console.error(e);
      showToast('Failed to download backup.', 'error');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        if (data.type === 'system') {
          showToast('Invalid file: use a user backup, not a system backup.', 'error');
          e.target.value = '';
          return;
        }
        const res = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: json,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Restore failed');
        }
        showToast(`Data restored successfully from ${file.name}. Reloading...`);
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: unknown) {
        console.error(err);
        showToast(err instanceof Error ? err.message : 'Failed to restore backup.', 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Account has been deleted. Logging out...', 'error');
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      window.location.href = '/';
    } catch (_err) {
      showToast('Failed to delete account.', 'error');
    }
  };

  if (isPending || authGrace || !session?.user) {
    return <FullPageLoader />;
  }

  const googleAccount = accounts.find((a) => a.providerId === 'google');
  const githubAccount = accounts.find((a) => a.providerId === 'github');
  const hasPasswordAccount = accounts.some((a) => a.providerId === 'credential');
  const is2FAEnabled = !!(session.user as unknown as ExtendedUser)?.twoFactorEnabled;
  const oauth = { google: !!googleAccount, github: !!githubAccount };

  return (
    <>
      {/* Toast */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
          toast.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <p className="text-sm font-bold">{toast.message}</p>
        </div>
      </div>

      {/* Delete account modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Are you sure you want to delete your account?</h2>
              <p className="text-sm text-slate-500 mb-6">
                This action cannot be undone. All your projects, quotes, machine fleet and customer data will be permanently and irreversibly removed from our servers.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-left">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  Type the word <span className="text-red-600 select-all">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-center uppercase"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-200"
                >
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <PageHeader
          title="Settings and Preferences"
          subtitle="Account, security and data"
          icon={<Settings className="w-6 h-6" />}
        />
        {/* Card 1: Calculator preferences */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Calculator Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">These settings will be loaded by default for each new quote.</p>
            </div>
          </div>
          <div className="p-6">
            <div className="max-w-md space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Default energy price ($ / kWh)</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      value={kwhRate}
                      onChange={(e) => setKwhRate(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-3 text-sm font-bold text-slate-400">$</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveKwh}
                    disabled={isSavingKwh}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 disabled:opacity-70"
                  >
                    {isSavingKwh ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-400" />
                  Directly affects machine depreciation costs.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Low stock alert threshold (%)</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={lowStockAlertPercent}
                    onChange={(e) => setLowStockAlertPercent(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                  <span className="text-sm font-bold text-slate-400 self-center">%</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-400" />
                  Dashboard alerts when filament stock falls below this % of a full spool.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: Account Security – single card, two clear blocks */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Account Security</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage your password and two-factor verification.</p>
            </div>
          </div>

          <div className="p-6 space-y-10">
            {/* Block: Change / Set password */}
            {hasPasswordAccount ? (
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <KeyRound className="w-4 h-4 text-slate-400" /> Change password
                </h4>
                <form onSubmit={handlePasswordUpdate} className="max-w-xl space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Current password</label>
                    <input
                      type="password"
                      required
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">New password</label>
                      <input
                        type="password"
                        required
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Confirm new</label>
                      <input
                        type="password"
                        required
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loadingAction !== null}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 h-11"
                  >
                    {loadingAction === 'changePassword' ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <KeyRound className="w-4 h-4 text-slate-400" /> Set password
                </h4>
                <p className="text-sm text-slate-500 mb-4">Set a password to log in with email.</p>
                <form onSubmit={handleSetPassword} className="max-w-xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">New password</label>
                      <input
                        type="password"
                        required
                        value={setPassword}
                        onChange={(e) => setSetPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 h-11 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Confirm new</label>
                      <input
                        type="password"
                        required
                        value={setPasswordConfirm}
                        onChange={(e) => setSetPasswordConfirm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 h-11 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loadingAction !== null}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 h-11"
                  >
                    {loadingAction === 'setPassword' ? 'Setting...' : 'Set password'}
                  </button>
                </form>
              </div>
            )}

            {/* Block: 2FA – one row: text left, controls right */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Smartphone className="w-4 h-4 text-slate-400" /> Two-factor authentication (2FA)
              </h4>
              {!twoFactorSetupUri ? (
                <>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6 bg-slate-50 border border-slate-200 p-5 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 mb-1">Authenticator app</p>
                      <p className="text-sm text-slate-500">
                        Extra layer of protection. You will be asked for a code from your app (e.g. Google Authenticator) when signing in.
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {!is2FAEnabled ? (
                        hasPasswordAccount ? (
                          <>
                            <input
                              id={twoFactorPasswordId}
                              type="password"
                              placeholder="Your password"
                              value={twoFactorPassword}
                              onChange={(e) => setTwoFactorPassword(e.target.value)}
                              className="sm:w-44 bg-white border border-slate-200 rounded-xl px-4 py-2.5 h-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                            />
                            <button
                              type="button"
                              onClick={handleStartEnableTwoFactor}
                              disabled={!twoFactorPassword || loadingAction !== null}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 h-11 whitespace-nowrap"
                            >
                              {loadingAction === 'startEnable2FA' ? 'Starting...' : 'Enable 2FA'}
                            </button>
                          </>
                        ) : (
                          <p className="text-sm text-amber-600">Set a password first to enable 2FA.</p>
                        )
                      ) : (
                        <>
                          <input
                            type="password"
                            placeholder="Your password"
                            value={twoFactorPassword}
                            onChange={(e) => setTwoFactorPassword(e.target.value)}
                            className="sm:w-44 bg-white border border-slate-200 rounded-xl px-4 py-2.5 h-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={handleDisableTwoFactor}
                            disabled={!twoFactorPassword || loadingAction !== null}
                            className="bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 h-11 whitespace-nowrap"
                          >
                            {loadingAction === 'disable2FA' ? 'Disabling...' : 'Disable 2FA'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {is2FAEnabled && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Two-factor authentication is active. Your account is secure.
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6 bg-slate-50 border border-slate-200 p-5 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="font-semibold text-slate-800 mb-2">1. Scan QR code</p>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block">
                        {twoFactorQrDataUrl ? (
                          <Image src={twoFactorQrDataUrl} alt="QR Code" width={180} height={180} />
                        ) : (
                          <div className="w-[180px] h-[180px] bg-slate-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 mb-2">2. Enter verification code</p>
                      <OtpInput
                        value={twoFactorVerifyCode}
                        onChange={setTwoFactorVerifyCode}
                        length={6}
                        variant="default"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmEnableTwoFactor}
                        disabled={twoFactorVerifyCode.length !== 6 || loadingAction !== null}
                        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50"
                      >
                        {loadingAction === 'confirmEnable2FA' ? 'Verifying...' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                  {twoFactorSetupBackupCodes.length > 0 && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="font-medium text-slate-700 mb-2">Backup codes</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {twoFactorSetupBackupCodes.map((code) => (
                          <span key={code} className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200">
                            {code}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadBackupCodesPdf(twoFactorSetupBackupCodes)}
                        className="text-sm text-indigo-600 hover:underline font-medium"
                      >
                        Download PDF
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Card 3: Connected accounts */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Connected Accounts</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage faster sign-in via external providers.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <GoogleIcon />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Google account</p>
                  <p className="text-xs text-slate-500">
                    {oauth.google ? `Connected on ${formatConnectedAt(googleAccount?.createdAt)}` : 'Sign in quickly with Google'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleOauth('google')}
                disabled={loadingAction !== null}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  oauth.google
                    ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200'
                    : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-700 shadow-sm'
                }`}
              >
                {oauth.google ? 'Disconnect' : 'Connect with Google'}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center shrink-0 text-slate-800">
                  <GithubIcon />
                </div>
                <div>
                  <p className="font-bold text-slate-800">GitHub account</p>
                  <p className="text-xs text-slate-500">
                    {oauth.github ? `Connected on ${formatConnectedAt(githubAccount?.createdAt)}` : 'Sign in and integrate with GitHub'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleOauth('github')}
                disabled={loadingAction !== null}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  oauth.github
                    ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200'
                    : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-700 shadow-sm'
                }`}
              >
                {oauth.github ? 'Disconnect' : 'Connect with GitHub'}
              </button>
            </div>
          </div>
        </section>

        {/* Card 4: Data management */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Data Management</h3>
              <p className="text-xs text-slate-500 mt-0.5">Export your quotes, machines and settings to a file.</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all group">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 mb-1">Download backup</h4>
              <p className="text-xs text-slate-500 mb-6">Downloads a .json file containing all your projects and fleet settings.</p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                Create and download
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all group">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 mb-1">Restore data from file</h4>
              <p className="text-xs text-slate-500 mb-6">Upload a previously downloaded .json file to overwrite your current account data.</p>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImportBackup}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                Select file from disk
              </button>
            </div>
          </div>
        </section>

        {/* Card 5: Danger zone */}
        <section className="bg-red-50 rounded-2xl border border-red-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 rounded-full blur-[80px] opacity-20 pointer-events-none" />
          <div className="p-6 border-b border-red-100 flex items-center gap-3 relative z-10">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-red-800 text-lg">Danger Zone</h3>
              <p className="text-xs text-red-600 mt-0.5">Actions in this section are irreversible.</p>
            </div>
          </div>
          <div className="p-6 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Delete Layerly account</h4>
              <p className="text-sm text-slate-600 max-w-md">
                All your quotes, settings and customer data will be permanently removed from our database. This operation cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="shrink-0 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
            >
              Delete account
            </button>
          </div>
        </section>
      </div>

      <ConfirmationModal
        isOpen={!!accountToDisconnect}
        onClose={() => setAccountToDisconnect(null)}
        onConfirm={confirmDisconnect}
        title="Disconnect account"
        message="Are you sure you want to disconnect this account? You will lose access via this provider."
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        isDanger
        isLoading={loadingAction === `disconnectOAuth-${accountToDisconnect}`}
      />
    </>
  );
}
