'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Activity, CheckCircle2, AlertTriangle, Clock, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
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
import { format } from 'date-fns';

type Incident = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  startedAt: string;
  resolvedAt: string | null;
};

type IncidentUpdate = {
  id: string;
  incidentId: string;
  message: string;
  status: string;
  createdAt: string;
};

const STATUS_BADGE: Record<string, string> = {
  investigating: 'bg-amber-100 text-amber-700 border-amber-200',
  identified:    'bg-amber-100 text-amber-700 border-amber-200',
  monitoring:    'bg-blue-100 text-blue-700 border-blue-200',
  resolved:      'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STATUS_LABEL: Record<string, string> = {
  investigating: 'Investigating',
  identified:    'Identified',
  monitoring:    'Monitoring',
  resolved:      'Resolved',
};

const SEVERITY_BADGE: Record<string, string> = {
  operational:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  degraded:     'bg-amber-100 text-amber-700 border-amber-200',
  major_outage: 'bg-red-100 text-red-700 border-red-200',
  maintenance:  'bg-slate-100 text-slate-600 border-slate-200',
};

const SEVERITY_LABEL: Record<string, string> = {
  operational:  'Operational',
  degraded:     'Degraded',
  major_outage: 'Major Outage',
  maintenance:  'Maintenance',
};

const UPDATE_DOT: Record<string, string> = {
  investigating: 'bg-amber-400',
  identified:    'bg-amber-400',
  monitoring:    'bg-blue-400',
  resolved:      'bg-emerald-500',
};

// ── Updates panel for a single incident ───────────────────────────────────
function UpdatesPanel({ incidentId }: { incidentId: string }) {
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');
  const [status, setStatus]   = useState('investigating');
  const [saving, setSaving]   = useState(false);

  const fetchUpdates = async () => {
    const res = await fetch(`/api/admin/incidents/${incidentId}/updates`);
    if (res.ok) setUpdates(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchUpdates(); }, [incidentId]);

  const handleAdd = async () => {
    if (!msg.trim()) { toast.error('Message is required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, status }),
      });
      if (!res.ok) throw new Error();
      toast.success('Update added');
      setMsg('');
      fetchUpdates();
    } catch { toast.error('Failed to add update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (updateId: string) => {
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/updates/${updateId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Update deleted');
      fetchUpdates();
    } catch { toast.error('Failed to delete update'); }
  };

  if (loading) return <div className="px-6 py-4 text-sm text-slate-400">Loading updates…</div>;

  return (
    <div className="bg-slate-50/70 border-t border-slate-100 px-6 py-5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
        Timeline updates
      </p>

      {/* Existing updates */}
      {updates.length > 0 ? (
        <ol className="relative border-l border-slate-200 ml-1 mb-5 space-y-0">
          {updates.map((upd, idx) => {
            const dot = UPDATE_DOT[upd.status] ?? 'bg-slate-400';
            const isLast = idx === updates.length - 1;
            return (
              <li key={upd.id} className={`ml-4 ${isLast ? 'pb-0' : 'pb-4'}`}>
                <span className={`absolute -left-[5px] flex items-center justify-center w-2.5 h-2.5 rounded-full ${dot} ring-2 ring-slate-50`} />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${STATUS_BADGE[upd.status] ?? STATUS_BADGE.investigating}`}>
                        {STATUS_LABEL[upd.status] ?? upd.status}
                      </span>
                      <time className="text-xs text-slate-400">
                        {format(new Date(upd.createdAt), 'MMM d · HH:mm')}
                      </time>
                    </div>
                    <p className="text-sm text-slate-700 font-medium mt-1 leading-snug">{upd.message}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(upd.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                    title="Delete update"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-slate-400 font-medium mb-5">No updates yet.</p>
      )}

      {/* Add update form */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Add update</p>
        <Textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="We are investigating the issue…"
          rows={2}
        />
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <CustomSelect
              value={status}
              onChange={setStatus}
              options={[
                { value: 'investigating', label: 'Investigating' },
                { value: 'identified',    label: 'Identified' },
                { value: 'monitoring',    label: 'Monitoring' },
                { value: 'resolved',      label: 'Resolved' },
              ]}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            isLoading={saving}
            loadingText="Adding…"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add update
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Incident | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'investigating',
    severity: 'major_outage',
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchIncidents = async () => {
    const res = await fetch('/api/admin/incidents');
    if (res.ok) {
      const data = await res.json();
      setIncidents(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', description: '', status: 'investigating', severity: 'major_outage' });
    setModalOpen(true);
  };

  const openEdit = (i: Incident) => {
    setEditingId(i.id);
    setForm({
      title: i.title,
      description: i.description ?? '',
      status: i.status,
      severity: i.severity,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setIsSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/incidents/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, description: form.description || null }),
        });
        if (!res.ok) throw new Error('Failed to update');
        toast.success('Incident updated');
      } else {
        const res = await fetch('/api/admin/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, description: form.description || null }),
        });
        if (!res.ok) throw new Error('Failed to create');
        toast.success('Incident created');
      }
      setModalOpen(false);
      fetchIncidents();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolve = async (inc: Incident) => {
    try {
      const res = await fetch(`/api/admin/incidents/${inc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      if (!res.ok) throw new Error('Failed to resolve');
      toast.success('Incident resolved');
      fetchIncidents();
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      const res = await fetch(`/api/admin/incidents/${deleteModal.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Incident deleted');
      setDeleteModal(null);
      if (expandedId === deleteModal.id) setExpandedId(null);
      fetchIncidents();
    } catch {
      toast.error('Something went wrong');
    }
  };

  return (
    <div>
      <PageHeader
        title="Incidents"
        subtitle="Incident management"
        icon={<Activity className="w-6 h-6" />}
        actions={
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            New Incident
          </Button>
        }
      />

      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <DataLoader message="Loading incidents..." />
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-slate-900 tracking-tight">No incidents yet</p>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Create an incident when you need to notify users.
              </p>
            </div>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              New Incident
            </Button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">
                  Title
                </th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">
                  Severity
                </th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">
                  Status
                </th>
                <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">
                  Started
                </th>
                <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => {
                const statusBadge = STATUS_BADGE[i.status] ?? STATUS_BADGE.investigating;
                const statusLabel = STATUS_LABEL[i.status] ?? i.status;
                const sevBadge = SEVERITY_BADGE[i.severity] ?? SEVERITY_BADGE.operational;
                const sevLabel = SEVERITY_LABEL[i.severity] ?? i.severity;
                const isResolved = i.status === 'resolved';
                const isExpanded = expandedId === i.id;
                return (
                  <React.Fragment key={i.id}>
                    <tr
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          {isResolved ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <p className="font-bold text-slate-900 text-sm truncate">{i.title}</p>
                        </div>
                        {i.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1 pl-5">{i.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${sevBadge}`}>
                          {sevLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          {format(new Date(i.startedAt), 'MMM d · HH:mm')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Updates toggle */}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : i.id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors mr-1 ${
                              isExpanded
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            Updates
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {!isResolved && (
                            <button
                              onClick={() => handleResolve(i)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors mr-1"
                            >
                              Resolve
                            </button>
                          )}
                          <IconButton icon={Pencil} variant="ghost" tooltip="Edit" onClick={() => openEdit(i)} />
                          <IconButton icon={Trash2} variant="danger" tooltip="Delete" onClick={() => setDeleteModal(i)} />
                        </div>
                      </td>
                    </tr>
                    {/* Updates panel row */}
                    {isExpanded && (
                      <tr className="border-b border-slate-100">
                        <td colSpan={5} className="p-0">
                          <UpdatesPanel incidentId={i.id} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Incident' : 'New Incident'}
        icon={<Activity className="w-5 h-5" />}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving} loadingText="Saving...">
              {editingId ? 'Save changes' : 'Create incident'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="API experiencing high latency"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional details..."
            rows={3}
          />
          <CustomSelect
            label="Status"
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            options={[
              { value: 'investigating', label: 'Investigating' },
              { value: 'identified',    label: 'Identified' },
              { value: 'monitoring',    label: 'Monitoring' },
              { value: 'resolved',      label: 'Resolved' },
            ]}
          />
          <CustomSelect
            label="Severity"
            value={form.severity}
            onChange={(v) => setForm((f) => ({ ...f, severity: v }))}
            options={[
              { value: 'operational',  label: 'Operational' },
              { value: 'degraded',     label: 'Degraded' },
              { value: 'major_outage', label: 'Major Outage' },
              { value: 'maintenance',  label: 'Maintenance' },
            ]}
          />
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete Incident"
        message={deleteModal ? `Are you sure you want to delete "${deleteModal.title}"?` : ''}
        confirmLabel="Delete"
        isDanger
      />
    </div>
  );
}
