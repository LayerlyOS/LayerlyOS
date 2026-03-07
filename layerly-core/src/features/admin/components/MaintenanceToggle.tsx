'use client';

import { useState, useTransition } from 'react';
import { toggleMaintenanceMode } from '@/features/admin/actions/global-settings';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceToggleProps {
  initialEnabled: boolean;
}

export function MaintenanceToggle({ initialEnabled }: MaintenanceToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newState = !enabled;
    // Optimistic update
    setEnabled(newState);

    startTransition(async () => {
      const result = await toggleMaintenanceMode(newState);
      if (!result.success) {
        // Revert on failure
        setEnabled(!newState);
        toast.error('Failed to change maintenance mode.');
      } else {
        toast.success(
          newState
            ? 'Maintenance mode enabled. Only admins have access.'
            : 'Maintenance mode disabled. App is available to everyone.'
        );
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <ShieldAlert className={`h-5 w-5 ${enabled ? 'text-red-600' : 'text-slate-400'}`} />
             <h3 className="text-lg font-medium text-slate-900">Maintenance mode</h3>
          </div>
          <p className="text-sm text-slate-600 max-w-lg">
            When enabled, all users (except admins) are redirected to the &quot;Coming Soon&quot; page.
            Use this mode during maintenance or before launch.
          </p>
          
          {enabled && (
            <div className="flex items-center gap-2 mt-3 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Your admin session lets you see the app normally. Use incognito to see the &quot;Coming Soon&quot; page.</span>
            </div>
          )}
        </div>

        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`
            relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
            focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white
            ${enabled ? 'bg-red-600' : 'bg-slate-200'}
            ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          role="switch"
          aria-checked={enabled}
        >
          <span className="sr-only">Toggle maintenance mode</span>
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
