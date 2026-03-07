import { NotificationManager } from '@/features/admin/components/NotificationManager';

export default function AdminNotificationsPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notification management</h1>
        <p className="text-slate-600">Send messages to system users.</p>
      </div>

      <NotificationManager />
    </div>
  );
}
