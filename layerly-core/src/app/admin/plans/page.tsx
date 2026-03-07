'use client';

import { Check, Edit2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';

interface Plan {
  id: string;
  name: string;
  maxFilaments: number;
  maxPrinters: number;
  pdfExport: boolean;
  clientManagement: boolean;
  ordersAccess: boolean;
  csvExport: boolean;
  advancedAnalytics: boolean;
  multiUser: boolean;
  prioritySupport: boolean;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { success, error } = useToast();

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      } else {
        error('Failed to fetch plans');
      }
    } catch (_e) {
      error('Connection error');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleUpdate = async (updatedPlan: Plan) => {
    try {
      const res = await fetch(`/api/admin/plans/${updatedPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan),
      });

      if (res.ok) {
        success('Plan updated');
        fetchPlans();
        setEditingPlan(null);
      } else {
        error('Failed to update plan');
      }
    } catch (_e) {
      error('Connection error');
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Plan management</h1>
        <p className="text-slate-500 mt-1">
          Edit limits and features available in each subscription package.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onEdit={() => setEditingPlan(plan)} />
        ))}
      </div>

      {editingPlan && (
        <PlanEditModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}

function PlanCard({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
  const isUnlimited = (val: number) => val === -1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div
        className={`p-6 border-b border-slate-100 ${
          plan.id === 'HOBBY' ? 'bg-slate-50' : plan.id === 'MAKER' ? 'bg-blue-50' : 'bg-indigo-50'
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {plan.id}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
          </div>
          <Button
            onClick={onEdit}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full bg-white/50 hover:bg-white"
          >
            <Edit2 className="w-4 h-4 text-slate-600" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">Limity</h4>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Max filaments</span>
            <span className="font-mono font-bold text-slate-900">
              {isUnlimited(plan.maxFilaments) ? '∞' : plan.maxFilaments}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Max Printers</span>
            <span className="font-mono font-bold text-slate-900">
              {isUnlimited(plan.maxPrinters) ? '∞' : plan.maxPrinters}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-900">Features</h4>
          <FeatureRow label="PDF Export" enabled={plan.pdfExport} />
          <FeatureRow label="Client management" enabled={plan.clientManagement} />
          <FeatureRow label="Orders access" enabled={plan.ordersAccess} />
          <FeatureRow label="CSV Export" enabled={plan.csvExport} />
          <FeatureRow label="PRO Analytics" enabled={plan.advancedAnalytics} />
          <FeatureRow label="Multi-User" enabled={plan.multiUser} />
          <FeatureRow label="Priority support" enabled={plan.prioritySupport} />
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      {enabled ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-slate-300" />
      )}
    </div>
  );
}

function PlanEditModal({
  plan,
  onClose,
  onSave,
}: {
  plan: Plan;
  onClose: () => void;
  onSave: (p: Plan) => Promise<void>;
}) {
  const [formData, setFormData] = useState<any>({ ...plan });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Ensure numbers are saved
    const safeNumber = (val: any) => {
      const num = Number(val);
      return Number.isNaN(num) ? 0 : num;
    };

    const dataToSave = {
      ...formData,
      maxFilaments: safeNumber(formData.maxFilaments),
      maxPrinters: safeNumber(formData.maxPrinters),
    };
    await onSave(dataToSave);
    setSaving(false);
  };

  const setFeature = (key: keyof Plan, val: boolean) => {
    setFormData((prev: any) => ({ ...prev, [key]: val }));
  };

  const handleNumberChange = (field: string, value: string) => {
    // Allow empty, minus, or valid number
    if (value === '' || value === '-' || !Number.isNaN(Number(value))) {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Edit plan: {plan.name}</h3>
            <IconButton
              onClick={onClose}
              variant="ghost"
              icon={X}
              size="sm"
              className="rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            />
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="plan-name"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Display name
                </label>
                <Input
                  id="plan-name"
                  value={formData.name}
                  onChange={(e) => setFormData((p: any) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="plan-max-filaments"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Max filaments
                  </label>
                  <Input
                    id="plan-max-filaments"
                    type="text"
                    value={formData.maxFilaments}
                    onChange={(e) => handleNumberChange('maxFilaments', e.target.value)}
                  />
                  <span className="text-xs text-slate-400">-1 means no limit</span>
                </div>
                <div>
                  <label
                    htmlFor="plan-max-printers"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Max Printers
                  </label>
                  <Input
                    id="plan-max-printers"
                    type="text"
                    value={formData.maxPrinters}
                    onChange={(e) => handleNumberChange('maxPrinters', e.target.value)}
                  />
                  <span className="text-xs text-slate-400">-1 means no limit</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-slate-900">Features</h4>

              <Toggle
                label="PDF Export"
                checked={formData.pdfExport}
                onChange={(c) => setFeature('pdfExport', c)}
              />
              <Toggle
                label="Client management"
                checked={formData.clientManagement}
                onChange={(c) => setFeature('clientManagement', c)}
              />
              <Toggle
                label="Orders access"
                checked={formData.ordersAccess}
                onChange={(c) => setFeature('ordersAccess', c)}
              />
              <Toggle
                label="CSV Export"
                checked={formData.csvExport}
                onChange={(c) => setFeature('csvExport', c)}
              />
              <Toggle
                label="Advanced Analytics"
                checked={formData.advancedAnalytics}
                onChange={(c) => setFeature('advancedAnalytics', c)}
              />
              <Toggle
                label="Multi-user access"
                checked={formData.multiUser}
                onChange={(c) => setFeature('multiUser', c)}
              />
              <Toggle
                label="Priority support"
                checked={formData.prioritySupport}
                onChange={(c) => setFeature('prioritySupport', c)}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </div>
    </label>
  );
}
