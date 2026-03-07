'use client';

import {
  Database,
  Plus,
  Search,
  AlertTriangle,
  Droplet,
  TrendingDown,
  Archive,
  Globe,
  Thermometer,
  ThermometerSun,
  PackagePlus,
  CheckCircle2,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DataLoader } from '@/components/ui/DataLoader';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/ui/ToastProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { AddToWarehouseModal, type GlobalFilamentForAdd } from './AddToWarehouseModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilamentDetails } from './FilamentDetails';
import type { Filament } from '@/types';

interface WarehouseFilament extends Filament {
  status: 'ok' | 'low' | 'empty';
}

interface GlobalFilamentRow {
  id: string;
  materialName: string;
  brand: string;
  color: string;
  colorHex?: string | null;
  spoolWeight?: number | null;
  spoolPrice?: number | null;
  materialType?: string | null;
  printTempMin?: number | null;
  printTempMax?: number | null;
  bedTemp?: number | null;
  density?: number | null;
  website?: string | null;
  isAdded?: boolean;
  isLiquid?: boolean;
}

const TYPE_FILTERS = ['all', 'PLA', 'PETG', 'ABS', 'TPU', 'PC', 'Resin'];

function getStatus(remaining: number, initial: number): 'ok' | 'low' | 'empty' {
  if (remaining <= 0) return 'empty';
  const percent = (remaining / initial) * 100;
  if (percent < 25 || remaining < 100) return 'low';
  return 'ok';
}

export default function FilamentsView() {
  const { success, error: showError } = useToast();
  const { checkLimit, maxFilaments, isUnlimitedFilaments } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [activeView, setActiveView] = useState<'inventory' | 'catalog'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');

  const [inventory, setInventory] = useState<WarehouseFilament[]>([]);
  const [globalCatalog, setGlobalCatalog] = useState<GlobalFilamentRow[]>([]);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isLoadingMoreCatalog, setIsLoadingMoreCatalog] = useState(false);

  const [addToWarehouseFilament, setAddToWarehouseFilament] = useState<GlobalFilamentForAdd | null>(null);
  const [previewItem, setPreviewItem] = useState<Filament | GlobalFilamentRow | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const loadInventory = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIsLoadingInventory(true);
    try {
      const res = await fetch(
        `/api/filaments?page=1&limit=500&search=${encodeURIComponent(searchQuery)}`,
        { signal: abortRef.current.signal }
      );
      if (res.ok) {
        const json = await res.json();
        const data = (json.data || []) as Filament[];
        setInventory(
          data.map((f) => ({
            ...f,
            status: getStatus(
              f.remainingWeight ?? 0,
              f.spoolWeight ?? 1000
            ),
          }))
        );
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') showError('Failed to load warehouse');
    } finally {
      setIsLoadingInventory(false);
    }
  }, [searchQuery, showError]);

  const CATALOG_PAGE_SIZE = 48;

  const loadCatalogPage1 = useCallback(
    async (search: string, type: string) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setIsLoadingCatalog(true);
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: String(CATALOG_PAGE_SIZE),
          sort: 'brand',
          order: 'asc',
        });
        if (search.trim()) params.set('search', search.trim());
        if (type !== 'all') params.set('type', type);
        const res = await fetch(
          `/api/filaments/global?${params.toString()}`,
          { signal: abortRef.current.signal }
        );
        if (!res.ok) {
          showError('Failed to load catalog');
          return;
        }
        const json = await res.json();
        const data = (json.data || []) as GlobalFilamentRow[];
        setGlobalCatalog(data);
        setCatalogPage(1);
        setCatalogTotalPages(json.pagination?.totalPages ?? 1);
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') showError('Failed to load catalog');
      } finally {
        setIsLoadingCatalog(false);
      }
    },
    [showError]
  );

  const loadMoreCatalog = useCallback(async () => {
    const nextPage = catalogPage + 1;
    if (nextPage > catalogTotalPages) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIsLoadingMoreCatalog(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(CATALOG_PAGE_SIZE),
        sort: 'brand',
        order: 'asc',
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (activeTypeFilter !== 'all') params.set('type', activeTypeFilter);
      const res = await fetch(
        `/api/filaments/global?${params.toString()}`,
        { signal: abortRef.current.signal }
      );
      if (!res.ok) return;
      const json = await res.json();
      const data = (json.data || []) as GlobalFilamentRow[];
      setGlobalCatalog((prev) => [...prev, ...data]);
      setCatalogPage(nextPage);
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') showError('Failed to load catalog');
    } finally {
      setIsLoadingMoreCatalog(false);
    }
  }, [catalogPage, catalogTotalPages, searchQuery, activeTypeFilter, showError]);

  useEffect(() => {
    if (activeView === 'inventory') loadInventory();
  }, [activeView, loadInventory]);

  useEffect(() => {
    if (activeView === 'catalog') loadCatalogPage1(searchQuery, activeTypeFilter);
  }, [activeView, searchQuery, activeTypeFilter, loadCatalogPage1]);

  const warehouseIds = inventory.map((f) => `${f.brand}|${f.materialName}|${f.color}`.toLowerCase());

  const catalogWithAdded = globalCatalog.map((item) => ({
    ...item,
    isAdded: warehouseIds.includes(
      `${item.brand}|${item.materialName}|${item.color}`.toLowerCase()
    ),
    isLiquid: (item.materialType || '').toLowerCase().includes('resin'),
  }));

  const filteredInventory = inventory.filter(
    (item) =>
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasMoreCatalog = catalogPage < catalogTotalPages;

  const totalWeightKg =
    inventory.reduce((sum, i) => sum + (i.remainingWeight ?? 0), 0) / 1000;
  const totalValue = inventory.reduce(
    (sum, i) =>
      sum + ((i.remainingWeight ?? 0) / 1000) * (i.spoolPrice || 0),
    0
  );
  const lowOrEmptyCount = inventory.filter((i) => i.status !== 'ok').length;

  const handleAddToInventory = (item: GlobalFilamentRow) => {
    if (!checkLimit(inventory.length)) {
      setShowUpgradeModal(true);
      return;
    }
    setAddToWarehouseFilament({
      id: item.id,
      materialName: item.materialName,
      brand: item.brand,
      color: item.color,
      colorHex: item.colorHex,
      spoolWeight: item.spoolWeight ?? 1000,
      density: item.density,
      materialType: item.materialType,
      printTempMin: item.printTempMin,
      printTempMax: item.printTempMax,
      bedTemp: item.bedTemp,
    });
  };

  const handleAddedToWarehouse = () => {
    setAddToWarehouseFilament(null);
    loadInventory();
    if (activeView === 'catalog') loadCatalogPage1(searchQuery, activeTypeFilter);
  };

  const handleDelete = (id: string) => setItemToDelete(id);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/filaments/${itemToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        success('Deleted');
        loadInventory();
      } else showError('Delete failed');
    } catch {
      showError('Connection error');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const currency = 'USD';

  const renderInventory = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-0.5">Total in stock</p>
            <h3 className="text-2xl font-black text-slate-900">
              {totalWeightKg.toFixed(2)} <span className="text-sm font-bold text-slate-400">kg</span>
            </h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-0.5">Material value</p>
            <h3 className="text-2xl font-black text-slate-900">
              {formatCurrency(totalValue, currency)}
            </h3>
          </div>
        </div>
        <div className="rounded-2xl p-6 border border-red-200 shadow-sm flex items-center gap-4 bg-red-50/30">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-800 mb-0.5">Low / Empty</p>
            <h3 className="text-2xl font-black text-red-600">
              {lowOrEmptyCount} <span className="text-sm font-bold text-red-400">spools</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:w-72">
            <SearchInput
              placeholder="Search warehouse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
            />
          </div>
          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add from catalog
          </button>
        </div>

        {isLoadingInventory ? (
          <div className="min-h-[400px]">
            <DataLoader className="min-h-[400px]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Brand &amp; Material</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Remaining</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.map((item) => {
                  const percentLeft =
                    ((item.remainingWeight ?? 0) / (item.spoolWeight || 1)) * 100;
                  const isEmpty = item.status === 'empty';
                  const colorHex = item.colorHex?.split(',')[0] || '#94a3b8';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${isEmpty ? 'opacity-60' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner border border-black/10 shrink-0"
                            style={{ backgroundColor: colorHex }}
                          >
                            <div className="w-4 h-4 rounded-full bg-white/20 border-2 border-white/50" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              {item.brand}{' '}
                              <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded">
                                {item.materialName}
                              </span>
                            </p>
                            <p className="text-xs text-slate-500 font-medium">{item.color}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(item.spoolPrice ?? 0, currency)}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">per spool</p>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span
                            className={
                              item.status !== 'ok' ? 'text-red-600' : 'text-slate-700'
                            }
                          >
                            {Math.round(item.remainingWeight ?? 0)} g
                          </span>
                          <span className="text-slate-400">
                            {Math.round(item.spoolWeight ?? 0)} g
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isEmpty
                                ? 'bg-transparent'
                                : item.status === 'low'
                                  ? 'bg-red-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentLeft}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'ok' && (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-emerald-200">
                            OK
                          </span>
                        )}
                        {item.status === 'low' && (
                          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1 w-max">
                            <TrendingDown className="w-3 h-3" /> Low
                          </span>
                        )}
                        {item.status === 'empty' && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-red-200">
                            Empty
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Details"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoadingInventory && filteredInventory.length === 0 && (
          <div className="py-16 text-center text-slate-500">
            <p className="font-medium">No filaments in warehouse</p>
            <p className="text-sm mt-1">Add materials from the Global catalog tab.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCatalog = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-indigo-600 rounded-4xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Global Materials Catalog</h2>
          <p className="text-indigo-100 text-sm sm:text-base leading-relaxed mb-6">
            Find a filament in our database, click &quot;Add to warehouse&quot; and enter your
            purchase price. The system will use the data for the slicer and cost calculations.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4">
        <div className="w-full lg:w-96">
          <SearchInput
            placeholder="Search by brand, name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto pb-2 lg:pb-0 scrollbar-hide gap-2 shrink-0">
          {TYPE_FILTERS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveTypeFilter(type)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                activeTypeFilter === type
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {type === 'all' ? 'All materials' : type}
            </button>
          ))}
        </div>
      </div>

      {isLoadingCatalog ? (
        <div className="min-h-[400px]">
          <DataLoader className="min-h-[400px]" />
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {catalogWithAdded.map((item, index) => {
            const isAlreadyInStock = item.isAdded;
            const hotendStr =
              item.printTempMin != null || item.printTempMax != null
                ? `${item.printTempMin ?? '?'}–${item.printTempMax ?? '?'}°C`
                : '–';
            const bedStr =
              item.bedTemp != null ? `${item.bedTemp}°C` : '–';
            const colorHex = item.colorHex?.split(',')[0] || '#94a3b8';
            const displayName = `${item.materialName}${item.color ? ` ${item.color}` : ''}`;

            return (
              <div
                key={`${item.id}-${index}`}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col group overflow-hidden"
              >
                <div className="h-24 relative p-4 flex items-start justify-between bg-slate-50 border-b border-slate-100">
                  <div
                    className="w-12 h-12 rounded-full border-4 border-white shadow-md relative z-10"
                    style={{ backgroundColor: colorHex }}
                  >
                    {item.isLiquid && (
                      <Droplet className="w-5 h-5 text-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <span className="bg-white text-slate-800 border border-slate-200 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm z-10">
                    {item.materialType || '–'}
                  </span>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: `radial-gradient(circle at right, ${colorHex} 0%, transparent 70%)`,
                    }}
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {item.brand}
                  </p>
                  <h3 className="font-bold text-slate-900 text-base mb-2 leading-tight">
                    {displayName}
                  </h3>
                  {(item.spoolPrice != null && item.spoolPrice > 0) && (
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                      {formatCurrency(item.spoolPrice, currency)}
                      {item.spoolWeight ? ` / ${item.spoolWeight}g` : ''}
                    </p>
                  )}
                  {item.website && (
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 mb-3"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Store / Buy
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-auto text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5" title="Nozzle temperature">
                      <Thermometer className="w-3.5 h-3.5 text-red-400" /> {hotendStr}
                    </div>
                    <div className="flex items-center gap-1.5" title="Bed temperature">
                      <ThermometerSun className="w-3.5 h-3.5 text-amber-500" /> {bedStr}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  {isAlreadyInStock ? (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" /> In warehouse
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddToInventory(item)}
                      className="w-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group-hover:border-indigo-500 group-hover:bg-indigo-600 group-hover:text-white"
                    >
                      <PackagePlus className="w-4 h-4" /> Add to warehouse
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div
            role="button"
            tabIndex={0}
            onClick={() => {}}
            onKeyDown={() => {}}
            className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors min-h-[300px]"
          >
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-4 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-2">Missing a filament?</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Let us know and we can add it to the global database for everyone.
            </p>
            <button
              type="button"
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:text-indigo-600 transition-colors"
            >
              Report missing material
            </button>
          </div>
        </div>
        {hasMoreCatalog && (
          <div className="flex justify-center pt-8 pb-4">
            <button
              type="button"
              onClick={loadMoreCatalog}
              disabled={isLoadingMoreCatalog}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors disabled:opacity-50"
            >
              {isLoadingMoreCatalog ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Materials"
        subtitle="Warehouse & catalog"
        icon={<Database className="w-6 h-6" />}
        actions={
          <div className="flex flex-wrap items-center gap-4">
            <nav
              className="flex rounded-xl bg-slate-100/80 p-1 border border-slate-200/80 w-fit"
              aria-label="Materials sections"
            >
              <button
                type="button"
                onClick={() => setActiveView('inventory')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeView === 'inventory'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-4 h-4 shrink-0" /> Warehouse
              </button>
              <button
                type="button"
                onClick={() => setActiveView('catalog')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeView === 'catalog'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" /> Catalog
              </button>
            </nav>
            {!isUnlimitedFilaments && (
              <span className="text-xs font-medium text-slate-500">
                {inventory.length} / {maxFilaments} spools
              </span>
            )}
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        {activeView === 'inventory' ? renderInventory() : renderCatalog()}
      </div>

      <AddToWarehouseModal
        isOpen={!!addToWarehouseFilament}
        onClose={() => setAddToWarehouseFilament(null)}
        filament={addToWarehouseFilament}
        onAdded={handleAddedToWarehouse}
      />

      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPreviewItem(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex justify-between items-center z-10">
              <h3 className="font-semibold text-slate-700">Details</h3>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ×
              </button>
            </div>
            <FilamentDetails
              filament={previewItem as Filament}
              type="warehouse"
            />
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete filament"
        message="Are you sure you want to remove this filament from your warehouse? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDanger
        isLoading={isDeleting}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
