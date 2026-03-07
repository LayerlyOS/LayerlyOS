'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Wrench, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { DataLoader } from '@/components/ui/DataLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';

type MaintenanceWindow = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
};

function windowStatus(w: MaintenanceWindow): 'active' | 'upcoming' | 'past' {
  const now = Date.now();
  const start = new Date(w.startsAt).getTime();
  const end = new Date(w.endsAt).getTime();
  if (now >= start && now <= end) return 'active';
  if (now < start) return 'upcoming';
  return 'past';
}

const STATUS_STYLES = {
  active:   { badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Active' },
  upcoming: { badge: 'bg-amber-100 text-amber-700 border-amber-200',   label: 'Upcoming' },
  past:     { badge: 'bg-slate-100 text-slate-500 border-slate-200',   label: 'Past' },
};

function toLocalDatetimeValue(isoString: string) {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MaintenancePage() {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<MaintenanceWindow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
  });

  const fetchWindows = async () => {
    const res = await fetch('/api/admin/maintenance-windows');
    if (res.ok) setWindows(await res.json());
    setIsLoading(false);
  };

  useEffect(() => { fetchWindows(); }, []);

  const openCreate = () => {
    setEditingId(null);
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    setForm({
      title: '',
      description: '',
      startsAt: toLocalDatetimeValue(now.toISOString()),
      endsAt: toLocalDatetimeValue(later.toISOString()),
    });
    setModalOpen(true);
  };

  const openEdit = (w: MaintenanceWindow) => {
    setEditingId(w.id);
    setForm({
      title: w.title,
      description: w.description ?? '',
      startsAt: toLocalDatetimeValue(w.startsAt),
      endsAt: toLocalDatetimeValue(w.endsAt),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.startsAt || !form.endsAt) { toast.error('Start and end times are required'); return; }
    if (new Date(form.startsAt) >= new Date(form.endsAt)) {
      toast.error('End time must be after start time');
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      };
      const res = editingId
        ? await fetch(`/api/admin/maintenance-windows/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/admin/maintenance-windows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error();
      toast.success(editingId ? 'Window updated' : 'Window scheduled');
      setModalOpen(false);
      fetchWindows();
    } catch { toast.error('Something went wrong'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      const res = await fetch(`/api/admin/maintenance-windows/${deleteModal.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Window deleted');
      setDeleteModal(null);
      fetchWindows();
    } catch { toast.error('Something went wrong'); }
  };

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Scheduled maintenance windows"
        icon={<Wrench className="w-6 h-6" />}
        actions={
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Schedule window
          </Button>
        }
      />

      {/* Info callout */}
      <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="bg-indigo-100 p-2 rounded-xl shrink-0">
          <Wrench className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-indigo-900">How maintenance windows work</p>
          <p className="text-sm text-indigo-800 font-medium mt-0.5">
            During an active window a banner is shown on the public status page. Email alerts are also suppressed during active windows.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <DataLoader message="Loading maintenance windows..." />
        ) : windows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <Wrench className="w-7 h-7 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-slate-900 tracking-tight">No maintenance windows</p>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Schedule a maintenance window to notify users of planned downtime.
              </p>
            </div>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Schedule window
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                {['Title', 'Starts', 'Ends', 'Status', ''].map((h) => (
                  <th key={h} className={`text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4 ${h === '' ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {windows.map((w) => {
                const st = windowStatus(w);
                const { badge, label } = STATUS_STYLES[st];
                return (
                  <tr key={w.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        {st === 'active' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        ) : st === 'past' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{w.title}</p>
                          {w.description && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{w.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 font-medium">
                        {format(new Date(w.startsAt), 'MMM d, yyyy · HH:mm')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 font-medium">
                        {format(new Date(w.endsAt), 'MMM d, yyyy · HH:mm')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${badge}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton icon={Pencil} variant="ghost" tooltip="Edit" onClick={() => openEdit(w)} />
                        <IconButton icon={Trash2} variant="danger" tooltip="Delete" onClick={() => setDeleteModal(w)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Maintenance Window' : 'Schedule Maintenance Window'}
        icon={<Wrench className="w-4 h-4" />}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving} loadingText="Saving...">
              {editingId ? 'Save changes' : 'Schedule'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Database maintenance"
          />
          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of what will be done..."
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starts at"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
            <Input
              label="Ends at"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete Maintenance Window"
        message={deleteModal ? `Delete "${deleteModal.title}"?` : ''}
        confirmLabel="Delete"
        isDanger
      />
    </div>
  );
}
