import NextImage from 'next/image';
import { Virtuoso } from 'react-virtuoso';
import { DataLoader } from '@/components/ui/DataLoader';
import { IconButton } from '@/components/ui/IconButton';
import { type Filament } from '@/types';
import { Box, Check, Info, Merge, Pencil, Plus, Trash2 } from 'lucide-react';

interface FilamentListProps {
  items: Filament[];
  isLoading: boolean;
  isFetching: boolean;
  page: number;
  loadMore: () => void;
  activeTab: 'warehouse' | 'catalog';
  previewItemId?: string;
  isAdmin: boolean;
  showSelectButton: boolean;
  onPreview: (item: Filament) => void;
  onEdit: (item: Filament) => void;
  onDelete: (id: string) => void;
  onMerge: (item: Filament) => void;
  onCopy: (item: Filament) => void;
  onSelect?: (item: Filament, activeTab: 'warehouse' | 'catalog') => void;
}

export function FilamentList({
  items,
  isLoading,
  isFetching,
  page,
  loadMore,
  activeTab,
  previewItemId,
  isAdmin,
  showSelectButton,
  onPreview,
  onEdit,
  onDelete,
  onMerge,
  onCopy,
  onSelect,
  }: FilamentListProps) {

  if (isLoading && page === 1) {
    return (
      <div className="flex-1 bg-white min-h-[300px]">
        <DataLoader className="min-h-[300px]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 bg-white flex flex-col items-center justify-center text-slate-500 p-8 text-center min-h-[300px]">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200 shadow-sm">
          <Box className="w-10 h-10 text-slate-300" />
        </div>
        <p className="font-bold text-lg text-slate-700">No filaments found</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">Change your filters or add a new material to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col min-w-0 bg-white">
        {/* Table Header - Hidden on Mobile */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
          <div className="col-span-4">Material</div>
          <div className="col-span-3">Properties</div>
          <div className="col-span-2">Stock</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>
        <div className="flex-1 min-h-0">
          <Virtuoso
            style={{ height: '100%' }}
            data={items}
            endReached={loadMore}
          overscan={200}
          itemContent={RowContent}
          components={{
            Footer: () =>
              isFetching && page > 1 ? (
                <div className="py-4 text-center text-slate-500 text-sm border-t border-slate-100">
                  Loading more...
                </div>
              ) : null,
          }}
        />
        </div>
      </div>
    );

  function RowContent(_index: number, item: Filament) {
    return (
      <div className={`flex flex-col md:grid md:grid-cols-12 gap-4 px-4 py-3 md:px-6 border-b border-slate-100 hover:bg-slate-50 transition-colors items-start md:items-center ${
        previewItemId === item.id ? 'bg-blue-50/50' : ''
      }`}>
        {/* Material Info */}
        <div className="w-full md:col-span-4 flex items-center gap-4 min-w-0">
          {item.image ? (
            <div className="w-12 h-12 md:w-10 md:h-10 rounded-lg border border-slate-200 flex-shrink-0 overflow-hidden bg-white relative">
              <NextImage src={item.image.replace(/\)$/, '')} alt={item.brand} fill className="object-cover" />
            </div>
          ) : (
            <div
              className="w-12 h-12 md:w-10 md:h-10 rounded-lg border border-slate-200 flex-shrink-0"
              style={{ backgroundColor: item.colorHex?.split(',')[0] || '#D1D5DB' }}
            ></div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-slate-900 truncate text-base md:text-sm" title={`${item.brand} ${item.materialName}`}>
              {item.brand} <span className="text-slate-500 font-normal">{item.materialName}</span>
            </h4>
            <div className="flex items-center gap-2 mt-1 md:mt-0.5">
               {item.materialType && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {item.materialType}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className="w-2 h-2 rounded-full border border-slate-300"
                  style={{ backgroundColor: item.colorHex?.split(',')[0] || '#D1D5DB' }}
                ></span>
                <span className="truncate max-w-[100px]" title={item.color}>{item.color}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="w-full md:col-span-3 text-sm text-slate-600 grid grid-cols-2 gap-2 md:block md:space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-16">Density:</span>
            <span>{item.density} g/cm³</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs text-slate-400 w-16">Weight:</span>
             <span>{item.spoolWeight}g</span>
          </div>
        </div>

        {/* Stock */}
        <div className="w-full md:col-span-2">
          {activeTab === 'warehouse' ? (
             <div className="flex flex-col">
               <div className="flex justify-between md:block">
                 <span className={`font-mono font-bold ${
                   (item.remainingWeight || 0) < 100 ? 'text-red-600' : 'text-slate-700'
                 }`}>
                   {Math.round(item.remainingWeight || 0)}g
                 </span>
                 <span className="text-xs text-slate-400 md:block">
                   of {item.spoolWeight}g
                 </span>
               </div>
               <div className="w-full bg-slate-100 h-2 md:h-1.5 rounded-full mt-2 md:mt-1.5 overflow-hidden">
                 <div 
                   className={`h-full rounded-full ${
                     (item.remainingWeight || 0) < 100 ? 'bg-red-500' : 'bg-blue-500'
                   }`}
                   style={{ width: `${Math.min(100, Math.max(0, ((item.remainingWeight || 0) / (item.spoolWeight || 1)) * 100))}%` }}
                 ></div>
               </div>
             </div>
          ) : (
            <span className="text-slate-400 text-sm hidden md:inline">-</span>
          )}
        </div>

        {/* Actions */}
        <div className="w-full md:col-span-3 flex flex-wrap items-center justify-end gap-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-50">
            {showSelectButton && onSelect && (
              <IconButton
                onClick={() => onSelect(item, activeTab)}
                tooltip="Select"
                variant="success"
                size="lg"
                className="rounded-2xl"
                icon={Check}
              />
            )}
            <IconButton
              onClick={() => onPreview(item)}
              tooltip="Details"
              variant="default"
              size="lg"
              className="rounded-2xl"
              icon={Info}
            />

            {activeTab === 'warehouse' ? (
              <>
                <IconButton
                  onClick={() => onMerge(item)}
                  tooltip="Merge"
                  variant="info"
                  size="lg"
                  className="rounded-2xl"
                  icon={Merge}
                />
                <IconButton
                  onClick={() => onEdit(item)}
                  tooltip="Edit"
                  variant="default"
                  size="lg"
                  className="rounded-2xl"
                  icon={Pencil}
                />
                <IconButton
                  onClick={() => onCopy(item)}
                  tooltip="Copy"
                  variant="default"
                  size="lg"
                  className="rounded-2xl"
                  icon={Plus}
                />
                <IconButton
                  onClick={() => onDelete(item.id)}
                  tooltip="Delete"
                  variant="danger"
                  size="lg"
                  className="rounded-2xl"
                  icon={Trash2}
                />
              </>
            ) : (
              <>
                <IconButton
                  onClick={() => onCopy(item)}
                  tooltip="Add to Warehouse"
                  variant="default"
                  size="lg"
                  className="rounded-2xl"
                  icon={Plus}
                />
                {isAdmin && (
                  <>
                    <IconButton
                      onClick={() => onEdit(item)}
                      tooltip="Edit"
                      variant="default"
                      size="lg"
                      className="rounded-2xl"
                      icon={Pencil}
                    />
                    <IconButton
                      onClick={() => onDelete(item.id)}
                      tooltip="Delete"
                      variant="danger"
                      size="lg"
                      className="rounded-2xl"
                      icon={Trash2}
                    />
                  </>
                )}
              </>
            )}
        </div>
      </div>
    );
  }
}
