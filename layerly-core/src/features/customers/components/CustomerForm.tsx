'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, User, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/ToastProvider';
import { createCustomerWithOrders, updateCustomer } from '../actions';
import { customerSchema, type CustomerFormData } from '../schemas';

interface OrderSummary {
  id: string;
  title: string;
  customerName: string | null;
  createdAt: Date;
  status: string;
}

interface CustomerFormProps {
  unassignedOrders: OrderSummary[];
  initialData?: CustomerFormData;
  initialAssignedOrders?: OrderSummary[];
  customerId?: string;
  onSuccess?: () => void;
  isModal?: boolean;
}

const defaultValues: CustomerFormData = {
  type: 'B2B',
  firstName: '',
  lastName: '',
  companyName: '',
  contactPerson: '',
  status: 'active',
  tags: [],
  email: '',
  phone: '',
  nip: '',
  street: '',
  city: '',
  zipCode: '',
  country: '',
  notes: '',
  assignedOrderIds: [],
};

export function CustomerForm({
  unassignedOrders: _unassignedOrders,
  initialData,
  initialAssignedOrders: _initialAssignedOrders = [],
  customerId,
  onSuccess,
  isModal: _isModal = false,
}: CustomerFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData
      ? { ...defaultValues, ...initialData, tags: initialData.tags ?? [] }
      : defaultValues,
  });

  // Tags as array; comma / Enter adds tag
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInputValue, setTagInputValue] = useState('');

  useEffect(() => {
    setTags(initialData?.tags ?? []);
    setTagInputValue('');
  }, [initialData?.tags, customerId]);

  const addTagFromInput = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      setTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    }
    setTagInputValue('');
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.includes(',')) {
      const parts = v.split(',');
      const toAdd = parts.slice(0, -1).map((s) => s.trim()).filter(Boolean);
      setTags((prev) => {
        const next = [...prev];
        toAdd.forEach((t) => { if (t && !next.includes(t)) next.push(t); });
        return next;
      });
      setTagInputValue(parts[parts.length - 1]?.trimStart() ?? '');
    } else {
      setTagInputValue(v);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagFromInput(tagInputValue);
    } else if (e.key === 'Backspace' && !tagInputValue && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const type = form.watch('type');
  const isB2B = type === 'B2B';

  const nameValue =
    isB2B
      ? form.watch('companyName') ?? ''
      : [form.watch('firstName'), form.watch('lastName')].filter(Boolean).join(' ').trim();

  const setNameValue = (value: string) => {
    if (isB2B) {
      form.setValue('companyName', value);
      form.setValue('firstName', '');
      form.setValue('lastName', '');
    } else {
      const parts = value.trim().split(/\s+/);
      form.setValue('firstName', parts[0] ?? '');
      form.setValue('lastName', parts.slice(1).join(' ') ?? '');
      form.setValue('companyName', '');
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      const finalTags = [
        ...tags,
        ...(tagInputValue.trim() ? [tagInputValue.trim()] : []),
      ].filter(Boolean);
      const payload: CustomerFormData = {
        ...data,
        tags: finalTags.length > 0 ? finalTags : undefined,
      };
      const result = customerId
        ? await updateCustomer(customerId, payload)
        : await createCustomerWithOrders(payload);
      if (result.success) {
        setIsSuccess(true);
        success(customerId ? 'Customer updated' : 'Customer created');
        setTimeout(() => {
          onSuccess?.();
          router.refresh();
        }, 800);
      } else {
        error('Something went wrong');
      }
    } catch (err) {
      error('Something went wrong');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 font-semibold">Saving...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
        {/* Customer type selection – UI Kit toggle */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Customer type
          </p>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => form.setValue('type', 'B2B')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                isB2B
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" /> Company (B2B)
            </button>
            <button
              type="button"
              onClick={() => form.setValue('type', 'B2C')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                !isB2B
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-4 h-4" /> Private (B2C)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label={isB2B ? 'Company name' : 'First and last name'}
            required
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder={isB2B ? 'e.g. TechGear Inc.' : 'e.g. John Doe'}
            error={
              (form.formState.errors.companyName?.message ??
                form.formState.errors.firstName?.message) as string | undefined
            }
          />

          {isB2B && (
            <Input
              label="Contact person"
              type="text"
              {...form.register('contactPerson')}
              placeholder="Name"
            />
          )}

          <Input
            label="Email"
            required
            type="email"
            {...form.register('email')}
            placeholder="contact@company.com"
            error={form.formState.errors.email?.message}
          />

          <Input
            label="Phone"
            type="tel"
            {...form.register('phone')}
            placeholder="+48 000 000 000"
          />

          <CustomSelect
            label="Cooperation status"
            value={form.watch('status') ?? 'active'}
            onChange={(v) => form.setValue('status', v as 'active' | 'inactive')}
            options={[
              { value: 'active', label: 'Active (places orders)' },
              { value: 'inactive', label: 'Inactive / Lead' },
            ]}
          />

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Categories / Tags
            </label>
            <div className="w-full min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-colors flex flex-wrap items-center gap-2">
              {tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1 rounded-lg border border-indigo-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="p-0.5 rounded hover:bg-indigo-200/80 text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInputValue}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                onBlur={() => tagInputValue.trim() && addTagFromInput(tagInputValue)}
                placeholder={tags.length === 0 ? 'e.g. Prototypes, FDM, Regular' : 'Add tag…'}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none py-0.5 text-sm font-medium text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-2 text-slate-400">
              Type a word and press comma or Enter to add as tag
            </p>
          </div>
        </div>

        <Textarea
          label="Internal notes"
          {...form.register('notes')}
          rows={3}
          placeholder="Additional info, material preferences, etc."
        />
      </div>

      <div className="shrink-0 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess ?? (() => router.back())}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save customer'
          )}
        </Button>
      </div>
    </form>
  );
}
