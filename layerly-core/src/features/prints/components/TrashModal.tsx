import { Button } from '@/components/ui/Button';
import { DataLoader } from '@/components/ui/DataLoader';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/format';
import { PrintEntry } from '@/types';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedPrints: PrintEntry[];
  onEmptyTrash: () => void;
  onDeletePermanently: (id: string) => void;
  isLoading: boolean;
}

export function TrashModal({
  isOpen,
  onClose,
  deletedPrints,
  onEmptyTrash,
  onDeletePermanently,
  isLoading,
}: TrashModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trash (Deleted quotes)"
      icon={<Trash2 className="w-5 h-5 text-red-600" />}
      size="4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onEmptyTrash}
            disabled={deletedPrints.length === 0}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md shadow-red-200 transition-all flex items-center gap-2"
          >
            Empty trash permanently
          </button>
        </>
      }
    >
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900 font-medium">
          Items in trash are kept for 30 days, then permanently and irreversibly deleted from servers (including uploaded 3D models).
        </p>
      </div>

      {isLoading ? (
        <div className="h-40 flex flex-col items-center justify-center">
          <DataLoader message="Loading data..." className="min-h-0" />
        </div>
      ) : deletedPrints.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
          <Trash2 className="w-12 h-12 mb-3 opacity-20" />
          <p>Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deletedPrints.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                    {String(item.id)}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm line-through decoration-slate-400">
                    {item.name}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1 flex-wrap">
                  Deleted {(item as any).deletedAt
                    ? formatDate(new Date((item as any).deletedAt))
                    : formatDate(new Date(item.date))}
                  {' • '}
                  <span className="font-mono text-[10px]">{Number(item.weight.toFixed(2))}g</span>
                  {item.orderTitle && (
                    <>
                      {' • '}
                      <span>{item.orderTitle}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeletePermanently(String(item.id))}
                  className="flex items-center gap-1 border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 rounded-lg font-bold shadow-sm"
                  title="Delete permanently"
                >
                  <X className="w-3.5 h-3.5" /> Delete permanently
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
