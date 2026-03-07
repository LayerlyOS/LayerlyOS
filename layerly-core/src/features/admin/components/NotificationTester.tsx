'use client';

import { AlertTriangle, Bell, CheckCircle, Info, XCircle } from 'lucide-react';
import { useState } from 'react';

  export function NotificationTester() {
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const sendNotification = async (type: string, title: string, message: string) => {
    setLoadingType(type);
    try {
      const res = await fetch('/api/debug/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          message,
          link: '/admin', // Test link
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-slate-500" />
        <h2 className="text-lg font-semibold text-slate-800">Notification test (Dynamic Island)</h2>
      </div>

      <p className="text-sm text-slate-500 mb-6">
        Click the buttons below to generate a test notification and see the &quot;Dynamic
        Island" in action.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() =>
            sendNotification(
              'SUCCESS',
              'Print completed',
              'Your order #123 has been completed successfully.'
            )
          }
          disabled={!!loadingType}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingType === 'SUCCESS' ? (
            <i className="fa-solid fa-spinner fa-spin w-6 h-6 text-emerald-500"></i>
          ) : (
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          )}
          <span className="text-xs font-medium text-emerald-700">Success</span>
        </button>

        <button
          type="button"
          onClick={() =>
            sendNotification(
              'INFO',
              'New Update',
              'A new calculator version v2.0 is available.'
            )
          }
          disabled={!!loadingType}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingType === 'INFO' ? (
            <i className="fa-solid fa-spinner fa-spin w-6 h-6 text-blue-500"></i>
          ) : (
            <Info className="w-6 h-6 text-blue-500" />
          )}
          <span className="text-xs font-medium text-blue-700">Info</span>
        </button>

        <button
          type="button"
          onClick={() =>
            sendNotification(
              'WARNING',
              'Low filament level',
              'PLA Black is running low in main warehouse.'
            )
          }
          disabled={!!loadingType}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingType === 'WARNING' ? (
            <i className="fa-solid fa-spinner fa-spin w-6 h-6 text-amber-500"></i>
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          )}
          <span className="text-xs font-medium text-amber-700">Warning</span>
        </button>

        <button
          type="button"
          onClick={() =>
            sendNotification('ERROR', 'Print error', 'Prusa MK3S+ #2 printer failure detected.')
          }
          disabled={!!loadingType}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingType === 'ERROR' ? (
            <i className="fa-solid fa-spinner fa-spin w-6 h-6 text-rose-500"></i>
          ) : (
            <XCircle className="w-6 h-6 text-rose-500" />
          )}
          <span className="text-xs font-medium text-rose-700">Error</span>
        </button>

        <button
          type="button"
          onClick={() =>
            sendNotification(
              'SYSTEM',
              'Backup',
              'Automatic database backup completed.'
            )
          }
          disabled={!!loadingType}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingType === 'SYSTEM' ? (
            <i className="fa-solid fa-spinner fa-spin w-6 h-6 text-slate-500"></i>
          ) : (
            <Bell className="w-6 h-6 text-slate-500" />
          )}
          <span className="text-xs font-medium text-slate-700">System</span>
        </button>
      </div>
    </div>
  );
}
