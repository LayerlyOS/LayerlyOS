import { getMaintenanceStatus } from '@/lib/maintenance';
import { getEmailConfirmationRequired } from '@/lib/email-confirmation';
import { MaintenanceToggle } from '@/features/admin/components/MaintenanceToggle';
import { EmailConfirmationToggle } from '@/features/admin/components/EmailConfirmationToggle';

export const dynamic = 'force-dynamic'; // Prevent static generation - requires DB access

export const metadata = {
  title: 'Settings - Admin Panel',
};

export default async function AdminSettingsPage() {
  const isMaintenanceEnabled = await getMaintenanceStatus();
  const isEmailConfirmationRequired = await getEmailConfirmationRequired();

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Global settings</h1>
          <p className="text-slate-600">Manage application-wide configuration.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <MaintenanceToggle initialEnabled={isMaintenanceEnabled} />
        <EmailConfirmationToggle initialEnabled={isEmailConfirmationRequired} />
      </div>
    </div>
  );
}
