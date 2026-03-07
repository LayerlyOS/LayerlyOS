'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Wifi, Clock, Layers, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CustomSelect } from '@/components/ui/CustomSelect';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { DataLoader } from '@/components/ui/DataLoader';
import { toast } from 'sonner';

type Monitor = {
  id: string;
  name: string;
  url: string;
  type: string;
  intervalMinutes: number;
  status: string;
  lastCheckedAt: string | null;
  responseTimeMs: number | null;
  groupId: string | null;
};

type MonitorGroup = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
};

const STATUS_BADGE: Record<string, string> = {
  operational: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  degraded:    'bg-amber-100 text-amber-700 border-amber-200',
  down:        'bg-red-100 text-red-700 border-red-200',
  maintenance: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_LABEL: Record<string, string> = {
  operational: 'Operational', degraded: 'Degraded', down: 'Down', maintenance: 'Maintenance',
};

const STATUS_DOT: Record<string, string> = {
  operational: 'bg-emerald-500', degraded: 'bg-amber-500',
  down: 'bg-red-500', maintenance: 'bg-slate-400',
};

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [groups, setGroups] = useState<MonitorGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Monitor modal
  const [monitorModalOpen, setMonitorModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteMonitorModal, setDeleteMonitorModal] = useState<Monitor | null>(null);
  const [form, setForm] = useState({ name: '', url: '', type: 'HTTP', intervalMinutes: 5, groupId: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Group modal
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [deleteGroupModal, setDeleteGroupModal] = useState<MonitorGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const fetchAll = async () => {
    const [mRes, gRes] = await Promise.all([
      fetch('/api/admin/monitors'),
      fetch('/api/admin/monitor-groups'),
    ]);
    if (mRes.ok) setMonitors(await mRes.json());
    if (gRes.ok) setGroups(await gRes.json());
    setIsLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Monitor CRUD ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', url: '', type: 'HTTP', intervalMinutes: 5, groupId: '' });
    setMonitorModalOpen(true);
  };

  const openEdit = (m: Monitor) => {
    setEditingId(m.id);
    setForm({ name: m.name, url: m.url, type: m.type, intervalMinutes: m.intervalMinutes, groupId: m.groupId ?? '' });
    setMonitorModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) { toast.error('Name and URL are required'); return; }
    setIsSaving(true);
    try {
      const body = { ...form, groupId: form.groupId || null };
      const res = editingId
        ? await fetch(`/api/admin/monitors/${editingId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          })
        : await fetch('/api/admin/monitors', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error();
      toast.success(editingId ? 'Monitor updated' : 'Monitor created');
      setMonitorModalOpen(false);
      fetchAll();
    } catch { toast.error('Something went wrong'); }
    finally { setIsSaving(false); }
  };

  const handleDeleteMonitor = async () => {
    if (!deleteMonitorModal) return;
    try {
      const res = await fetch(`/api/admin/monitors/${deleteMonitorModal.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Monitor deleted');
      setDeleteMonitorModal(null);
      fetchAll();
    } catch { toast.error('Something went wrong'); }
  };

  // ── Group CRUD ────────────────────────────────────────────────────────────
  const openCreateGroup = () => {
    setEditingGroupId(null);
    setGroupForm({ name: '', description: '' });
    setGroupModalOpen(true);
  };

  const openEditGroup = (g: MonitorGroup) => {
    setEditingGroupId(g.id);
    setGroupForm({ name: g.name, description: g.description ?? '' });
    setGroupModalOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) { toast.error('Group name is required'); return; }
    setIsSavingGroup(true);
    try {
      const body = { name: groupForm.name.trim(), description: groupForm.description.trim() || null };
      const res = editingGroupId
        ? await fetch(`/api/admin/monitor-groups/${editingGroupId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          })
        : await fetch('/api/admin/monitor-groups', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error();
      toast.success(editingGroupId ? 'Group updated' : 'Group created');
      setGroupModalOpen(false);
      fetchAll();
    } catch { toast.error('Something went wrong'); }
    finally { setIsSavingGroup(false); }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupModal) return;
    try {
      const res = await fetch(`/api/admin/monitor-groups/${deleteGroupModal.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Group deleted');
      setDeleteGroupModal(null);
      fetchAll();
    } catch { toast.error('Something went wrong'); }
  };

  const groupOptions = [
    { value: '', label: '— No group —' },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

  const groupById = Object.fromEntries(groups.map((g) => [g.id, g]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitors"
        subtitle="Uptime monitoring"
        icon={<Wifi className="w-6 h-6" />}
        actions={
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Add Monitor
          </Button>
        }
      />

      {/* ── Component Groups panel ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Component Groups</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Group monitors by component
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openCreateGroup}>
            Add group
          </Button>
        </div>
        {isLoading ? (
          <div className="px-6 py-4 text-sm text-slate-400">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="px-6 py-5 text-sm text-slate-400 font-medium">
            No groups yet. Create groups to organize monitors into components like API, Database, CDN.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {groups.map((g) => {
              const count = monitors.filter((m) => m.groupId === g.id).length;
              return (
                <li key={g.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{g.name}</span>
                      {g.description && (
                        <span className="text-slate-400 text-xs ml-2">{g.description}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {count} {count === 1 ? 'monitor' : 'monitors'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton icon={Pencil} variant="ghost" tooltip="Edit group" size="sm" onClick={() => openEditGroup(g)} />
                    <IconButton icon={Trash2} variant="danger" tooltip="Delete group" size="sm" onClick={() => setDeleteGroupModal(g)} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Monitors table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <DataLoader message="Loading monitors..." />
        ) : monitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Wifi className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-slate-900 tracking-tight">No monitors yet</p>
              <p className="text-sm text-slate-500 font-medium mt-1">Add your first monitor to start tracking uptime.</p>
            </div>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>Add Monitor</Button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                {['Name', 'Group', 'URL', 'Status', 'Response', 'Interval', ''].map((h, i) => (
                  <th key={i} className={`text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4 ${i === 6 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monitors.map((m) => {
                const dotClass   = STATUS_DOT[m.status]   ?? STATUS_DOT.operational;
                const badgeClass = STATUS_BADGE[m.status] ?? STATUS_BADGE.operational;
                const label      = STATUS_LABEL[m.status] ?? m.status;
                const group      = m.groupId ? groupById[m.groupId] : null;
                return (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                        <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {group ? (
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {group.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 font-mono max-w-[180px] truncate block">{m.url}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${badgeClass}`}>{label}</span>
                    </td>
                    <td className="px-6 py-4">
                      {m.responseTimeMs != null ? (
                        <span className="text-sm font-bold text-indigo-600">{m.responseTimeMs}ms</span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0" />{m.intervalMinutes}m
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton icon={Pencil} variant="ghost" tooltip="Edit" onClick={() => openEdit(m)} />
                        <IconButton icon={Trash2} variant="danger" tooltip="Delete" onClick={() => setDeleteMonitorModal(m)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Monitor Modal ── */}
      <Modal
        isOpen={monitorModalOpen}
        onClose={() => setMonitorModalOpen(false)}
        title={editingId ? 'Edit Monitor' : 'Add Monitor'}
        icon={<Wifi className="w-5 h-5" />}
        footer={
          <>
            <Button variant="outline" onClick={() => setMonitorModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving} loadingText="Saving...">
              {editingId ? 'Save changes' : 'Create monitor'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="API Server"
          />
          <Input
            label="URL"
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://api.example.com/health"
          />
          <CustomSelect
            label="Component group"
            value={form.groupId}
            onChange={(v) => setForm((f) => ({ ...f, groupId: v }))}
            options={groupOptions}
            helperText="Optionally assign this monitor to a component group"
          />
          <CustomSelect
            label="Type"
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            options={[
              { value: 'HTTP', label: 'HTTP/HTTPS' },
              { value: 'PING', label: 'Ping' },
            ]}
          />
          <CustomSelect
            label="Check interval"
            value={String(form.intervalMinutes)}
            onChange={(v) => setForm((f) => ({ ...f, intervalMinutes: Number(v) }))}
            options={[
              { value: '1', label: '1 minute' }, { value: '5', label: '5 minutes' },
              { value: '10', label: '10 minutes' }, { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' }, { value: '60', label: '60 minutes' },
            ]}
          />
        </div>
      </Modal>

      {/* ── Group Modal ── */}
      <Modal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        title={editingGroupId ? 'Edit Group' : 'New Component Group'}
        icon={<Layers className="w-4 h-4" />}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setGroupModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveGroup} isLoading={isSavingGroup} loadingText="Saving...">
              {editingGroupId ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Group name"
            value={groupForm.name}
            onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="API, Database, CDN..."
          />
          <Textarea
            label="Description (optional)"
            value={groupForm.description}
            onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Short description"
          />
        </div>
      </Modal>

      {/* ── Delete modals ── */}
      <ConfirmationModal
        isOpen={!!deleteMonitorModal}
        onClose={() => setDeleteMonitorModal(null)}
        onConfirm={handleDeleteMonitor}
        title="Delete Monitor"
        message={deleteMonitorModal ? `Delete "${deleteMonitorModal.name}"? This will remove all check history.` : ''}
        confirmLabel="Delete"
        isDanger
      />
      <ConfirmationModal
        isOpen={!!deleteGroupModal}
        onClose={() => setDeleteGroupModal(null)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        message={deleteGroupModal ? `Delete group "${deleteGroupModal.name}"? Monitors in this group will be unassigned.` : ''}
        confirmLabel="Delete"
        isDanger
      />
    </div>
  );
}
