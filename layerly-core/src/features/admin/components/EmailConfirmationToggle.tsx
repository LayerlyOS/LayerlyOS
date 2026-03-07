'use client';

import { useState, useTransition } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { toggleEmailConfirmationRequired } from '@/features/admin/actions/global-settings';

interface EmailConfirmationToggleProps {
  initialEnabled: boolean;
}

export function EmailConfirmationToggle({ initialEnabled }: EmailConfirmationToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);

    startTransition(async () => {
      const result = await toggleEmailConfirmationRequired(newState);
      if (!result.success) {
        setEnabled(!newState);
        toast.error('Failed to update email confirmation setting.');
      } else {
        toast.success(
          newState
            ? 'Email confirmation is now required for registration.'
            : 'Email address confirmation is no longer required on registration.'
        );
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-5 w-5 ${enabled ? 'text-blue-600' : 'text-slate-400'}`} />
            <h3 className="text-lg font-medium text-slate-900">
              User email confirmation
            </h3>
          </div>
          <p className="text-sm text-slate-600 max-w-lg">
            Require new users to confirm their email. When enabled, the app
            will send an email with activation link instead of relying on Supabase notifications.
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`
            relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
            focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white
            ${enabled ? 'bg-blue-600' : 'bg-slate-200'}
            ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          role="switch"
          aria-checked={enabled}
        >
          <span className="sr-only">Enable email confirmation</span>
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${enabled ? 'translate-x-5' : 'translate-x-0'}
            `}
          >
            {isPending && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
