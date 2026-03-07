'use client';

import { AlertTriangle, Download, FileUp, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';

export function BackupManager({ scope = 'system' }: { scope?: 'system' | 'user' }) {
  const { success, error } = useToast();
  const [restoring, setRestoring] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selection, setSelection] = useState({
    printers: true,
    filaments: true,
    orders: true,
    printEntries: true,
    userSettings: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/backup?scope=${scope}`);
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${scope}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success("Backup downloaded successfully");
    } catch (e) {
      console.error(e);
      error("Failed to download backup");
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For system backup, keep simple confirmation flow
    if (scope === 'system') {
      const message = "DANGER: You are about to restore a SYSTEM backup. This will wipe and replace the entire database, including all users and data. Are you absolutely sure?";
      if (!confirm(message)) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);

        // Validate backup type matches scope
        if (scope === 'system' && data.type !== 'system') {
          throw new Error("Invalid backup file: Expected system backup but got user backup");
        }
        if (scope === 'user' && data.type === 'system') {
          throw new Error("Invalid backup file: Expected user backup but got system backup");
        }

        if (scope === 'system') {
          // Execute immediately for system
          await executeRestore(data);
        } else {
          // Show selection modal for user
          setParsedData(data);
          setSelection({
            printers: !!data.data?.printers?.length,
            filaments: !!data.data?.filaments?.length,
            orders: !!data.data?.orders?.length,
            printEntries: !!data.data?.printEntries?.length,
            userSettings: !!data.data?.userSettings?.length,
          });
          setShowSelectionModal(true);
        }
      } catch (err: any) {
        console.error(err);
        error(err.message || "Failed to process backup file");
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const executeRestore = async (dataToRestore: any) => {
    setRestoring(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToRestore),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Restore failed");
      }

      success("Restore completed successfully. Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      setShowSelectionModal(false);
      setParsedData(null);
    } catch (err: any) {
      console.error(err);
      error(err.message || "Restore failed");
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmSelection = () => {
    if (!parsedData) return;

    // Filter data based on selection
    const filteredData = {
      ...parsedData,
      data: {
        ...parsedData.data,
        printers: selection.printers ? parsedData.data.printers : [],
        filaments: selection.filaments ? parsedData.data.filaments : [],
        orders: selection.orders ? parsedData.data.orders : [],
        printEntries: selection.printEntries ? parsedData.data.printEntries : [],
        userSettings: selection.userSettings ? parsedData.data.userSettings : [],
      },
    };

    executeRestore(filteredData);
  };

  const getCount = (key: string) => parsedData?.data?.[key]?.length || 0;

  return (
    <>
      <div
        className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 ${scope === 'system' ? 'mt-8' : ''}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`p-2 rounded-lg ${scope === 'system' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}
          >
            <FileUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {scope === 'system' ? "System Backup & Restore" : "Your Data Backup"}
            </h2>
            <p className="text-sm text-slate-500">
              {scope === 'system'
                ? "Create full database snapshots or restore system-wide data. This is a dangerous operation."
                : "Export your personal data (printers, filaments, orders) or restore from a previous backup."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
            <h3 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-500" /> Export Backup
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {scope === 'system'
                ? "Download a JSON file containing the entire database state."
                : "Download a JSON file containing all your personal data."}
            </p>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full"
              isLoading={downloading}
            >
              Download Backup
            </Button>
          </div>

          <div className="p-4 border border-rose-200 rounded-xl bg-rose-50/30">
            <h3 className="font-medium text-rose-900 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-rose-600" /> Restore Backup
            </h3>
            <p className="text-xs text-rose-600/80 mb-4">
              Upload a backup file to restore data.{' '}
              <span className="font-bold">Current data might be overwritten.</span>
            </p>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id={`backup-upload-${scope}`}
                disabled={restoring}
              />
              <Button
                isLoading={restoring}
                variant="danger"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                {restoring ? "Restoring..." : "Select Backup File"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showSelectionModal}
        onClose={() => {
          setShowSelectionModal(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        title="Select Data to Restore"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm text-amber-800 flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              You are about to restore data from a backup.
              <br />
              <strong>Existing items with the same ID will be updated. New items will be created.</strong>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sel-printers"
                  checked={selection.printers}
                  onCheckedChange={(c) => setSelection((s) => ({ ...s, printers: !!c }))}
                  disabled={getCount('printers') === 0}
                />
                <label htmlFor="sel-printers" className="cursor-pointer">
                  <div className="font-medium">Printers</div>
                  <div className="text-xs text-slate-500">
                    Found: {getCount('printers')}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sel-filaments"
                  checked={selection.filaments}
                  onCheckedChange={(c) => setSelection((s) => ({ ...s, filaments: !!c }))}
                  disabled={getCount('filaments') === 0}
                />
                <label htmlFor="sel-filaments" className="cursor-pointer">
                  <div className="font-medium">Filaments</div>
                  <div className="text-xs text-slate-500">
                    Found: {getCount('filaments')}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sel-orders"
                  checked={selection.orders}
                  onCheckedChange={(c) => setSelection((s) => ({ ...s, orders: !!c }))}
                  disabled={getCount('orders') === 0}
                />
                <label htmlFor="sel-orders" className="cursor-pointer">
                  <div className="font-medium">Orders</div>
                  <div className="text-xs text-slate-500">
                    Found: {getCount('orders')}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sel-prints"
                  checked={selection.printEntries}
                  onCheckedChange={(c) => setSelection((s) => ({ ...s, printEntries: !!c }))}
                  disabled={getCount('printEntries') === 0}
                />
                <label htmlFor="sel-prints" className="cursor-pointer">
                  <div className="font-medium">Print History</div>
                  <div className="text-xs text-slate-500">
                    Found: {getCount('printEntries')}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sel-settings"
                  checked={selection.userSettings}
                  onCheckedChange={(c) => setSelection((s) => ({ ...s, userSettings: !!c }))}
                  disabled={getCount('userSettings') === 0}
                />
                <label htmlFor="sel-settings" className="cursor-pointer">
                  <div className="font-medium">User Settings</div>
                  <div className="text-xs text-slate-500">
                    Found: {getCount('userSettings')}
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowSelectionModal(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleConfirmSelection}
              isLoading={restoring}
            >
              Restore Selected
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
