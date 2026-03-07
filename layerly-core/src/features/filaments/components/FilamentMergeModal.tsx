import { useId } from 'react';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Modal } from '@/components/ui/Modal';
import type { Filament } from '@/types';

interface FilamentMergeModalProps {
  mergeSource: Filament | null;
  setMergeSource: (val: Filament | null) => void;
  mergeTargetId: string;
  setMergeTargetId: (val: string) => void;
  filaments: Filament[];
  onMerge: () => void;
  isLoading: boolean;
}

export function FilamentMergeModal({
  mergeSource,
  setMergeSource,
  mergeTargetId,
  setMergeTargetId,
  filaments,
  onMerge,
  isLoading,
}: FilamentMergeModalProps) {
  const selectId = useId();

  return (
    <Modal
      isOpen={!!mergeSource}
      onClose={() => setMergeSource(null)}
      title="Merge with another filament"
      size="md"
    >
      <div className="p-6">
        <p className="text-sm text-slate-600 mb-4">
          Select a filament to receive weight from {mergeSource?.brand} {mergeSource?.materialName}. The source filament will be deleted.
        </p>

        <div className="mb-4">
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-2">
            Select target spool (the one that will remain):
          </label>
          <CustomSelect
            id={selectId}
            value={mergeTargetId}
            onChange={(val) => setMergeTargetId(val)}
            options={[
              { value: '', label: "-- Select --" },
              ...filaments
                .filter(
                  (f) => mergeSource && f.id !== mergeSource.id && f.materialName === mergeSource.materialName
                )
                .map((f) => ({
                  value: f.id,
                  label: `${f.brand} ${f.materialName} (${f.color}) - ${Math.round(f.remainingWeight || 0)}g`,
                })),
            ]}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setMergeSource(null)}>
            Cancel
          </Button>
          <Button onClick={onMerge} disabled={!mergeTargetId || isLoading} isLoading={isLoading}>
            Merge
          </Button>
        </div>
      </div>
    </Modal>
  );
}
