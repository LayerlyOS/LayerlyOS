'use client';

import {
  Database,
  Globe,
  Plus,
  Settings,
  Droplet,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useToast } from '@/components/ui/ToastProvider';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { AddToWarehouseModal, type GlobalFilamentForAdd } from './AddToWarehouseModal';
import { FilamentForm } from './FilamentForm';

interface Filament {
  id: string;
  materialName: string;
  brand: string;
  color: string;
  spoolPrice: number;
  spoolWeight: number;
  remainingWeight?: number;
  costPerGram?: number;
  density?: number;
  notes?: string;
  userId?: string;
  image?: string;
  colorHex?: string;
  materialType?: string;
  website?: string;
}

interface GlobalFilament {
  id: string;
  materialName: string;
  brand: string;
  color: string;
  spoolPrice?: number;
  spoolWeight?: number;
  density?: number;
  materialType?: string;
  colorHex?: string;
  printTempMin?: number;
  printTempMax?: number;
  bedTemp?: number;
  website?: string;
}

interface FilamentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilamentSelected?: (filament: Filament, context?: { fromWarehouse: boolean }) => void;
  showSelectButton?: boolean;
}

function getStatus(
  remaining: number,
  total: number
): 'ok' | 'low' {
  if (remaining <= 0) return 'low';
  const percent = (remaining / total) * 100;
  if (percent < 25 || remaining < 100) return 'low';
  return 'ok';
}

const CATALOG_PAGE_SIZE = 24;
const TYPE_FILTERS = ['all', 'PLA', 'PETG', 'ABS', 'TPU', 'PC', 'Resin'];

export default function FilamentsModal({
  isOpen,
  onClose,
  onFilamentSelected,
  showSelectButton = false,
}: FilamentsModalProps) {
  const { success, error: showError } = useToast();
  const { data: session } = useSession();
  const { checkLimit, maxFilaments } = useSubscription();
  const [, setIsAdmin] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [activeTab, setActiveTab] = useState<'warehouse' | 'catalog'>('warehouse');
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [globalFilaments, setGlobalFilaments] = useState<GlobalFilament[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');

  const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isLoadingMoreCatalog, setIsLoadingMoreCatalog] = useState(false);

  const [addToWarehouseFilament, setAddToWarehouseFilament] = useState<GlobalFilamentForAdd | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    materialName: '',
    brand: '',
    color: '',
    colorHex: '',
    spoolPrice: '',
    spoolWeight: '',
    remainingWeight: '',
    density: '',
    notes: '',
    printTempMin: '',
    printTempMax: '',
    bedTemp: '',
    printSpeed: '',
    fanSpeed: '',
    flowRatio: '',
    diameter: '',
    mechanicalProps: '',
    applications: '',
    website: '',
    image: '',
    materialType: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    if ((session.user as any).isAdmin) {
      setIsAdmin(true);
      return;
    }
    fetch('/api/user/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.isAdmin || data?.role === 'ADMIN') setIsAdmin(true);
      })
      .catch(() => {});
  }, [session]);

  const loadWarehouse = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIsLoadingWarehouse(true);
    try {
      const res = await fetch(
        `/api/filaments?page=1&limit=500&search=${encodeURIComponent(searchQuery)}`,
        { signal: abortRef.current.signal }
      );
      if (res.ok) {
        const json = await res.json();
        setFilaments(json.data || []);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') showError('Failed to load warehouse');
    } finally {
      setIsLoadingWarehouse(false);
    }
  }, [searchQuery, showError]);

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
        const res = await fetch(`/api/filaments/global?${params}`, {
          signal: abortRef.current.signal,
        });
        if (!res.ok) {
          showError('Failed to load catalog');
          return;
        }
        const json = await res.json();
        setGlobalFilaments(json.data || []);
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
      const res = await fetch(`/api/filaments/global?${params}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) return;
      const json = await res.json();
      setGlobalFilaments((prev) => [...prev, ...(json.data || [])]);
      setCatalogPage(nextPage);
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') showError('Failed to load catalog');
    } finally {
      setIsLoadingMoreCatalog(false);
    }
  }, [catalogPage, catalogTotalPages, searchQuery, activeTypeFilter, showError]);

  useEffect(() => {
    if (isOpen && activeTab === 'warehouse') loadWarehouse();
  }, [isOpen, activeTab, loadWarehouse]);

  useEffect(() => {
    if (isOpen && activeTab === 'catalog') loadCatalogPage1(searchQuery, activeTypeFilter);
  }, [isOpen, activeTab, searchQuery, activeTypeFilter, loadCatalogPage1]);

  const warehouseIds = filaments.map(
    (f) => `${f.brand}|${f.materialName}|${f.color}`.toLowerCase()
  );
  const catalogWithAdded = globalFilaments.map((item) => ({
    ...item,
    isAdded: warehouseIds.includes(
      `${item.brand}|${item.materialName}|${item.color}`.toLowerCase()
    ),
    isLiquid: (item.materialType || '').toLowerCase().includes('resin'),
  }));

  const handleTabChange = (tab: 'warehouse' | 'catalog') => {
    setMenuOpenId(null);
    setEditingId(null);
    setActiveTab(tab);
  };

  const handleAddSpool = () => {
    setActiveTab('catalog');
  };

  const handleAddToWarehouse = (item: GlobalFilament) => {
    if (!checkLimit(filaments.length)) {
      setShowUpgradeModal(true);
      return;
    }
    setAddToWarehouseFilament({
      id: item.id,
      materialName: item.materialName,
      brand: item.brand,
      color: item.color,
      colorHex: item.colorHex?.split(',')[0] || null,
      spoolWeight: item.spoolWeight ?? undefined,
      density: item.density ?? undefined,
      materialType: item.materialType ?? undefined,
      printTempMin: item.printTempMin ?? undefined,
      printTempMax: item.printTempMax ?? undefined,
      bedTemp: item.bedTemp ?? undefined,
    });
  };

  const handleAddedToWarehouse = () => {
    setAddToWarehouseFilament(null);
    loadWarehouse();
  };

  const handleEdit = (f: Filament) => {
    setFormData({
      materialName: f.materialName,
      brand: f.brand,
      color: f.color,
      colorHex: f.colorHex || '',
      spoolPrice: (f.spoolPrice ?? 0).toString(),
      spoolWeight: (f.spoolWeight ?? 0).toString(),
      remainingWeight: (f.remainingWeight ?? f.spoolWeight ?? 0).toString(),
      density: f.density?.toString() || '',
      notes: f.notes || '',
      printTempMin: '',
      printTempMax: '',
      bedTemp: '',
      printSpeed: '',
      fanSpeed: '',
      flowRatio: '',
      diameter: '',
      mechanicalProps: '',
      applications: '',
      website: f.website || '',
      image: '',
      materialType: f.materialType || '',
    });
    setEditingId(f.id);
    setMenuOpenId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !formData.materialName || !formData.brand || !formData.color) {
      showError('Fill required fields');
      return;
    }
    const spoolPrice = parseFloat(formData.spoolPrice.replace(',', '.')) || 0;
    const spoolWeight = parseFloat(formData.spoolWeight.replace(',', '.')) || 0;
    const remainingWeight = formData.remainingWeight
      ? parseFloat(formData.remainingWeight.replace(',', '.'))
      : spoolWeight;
    if (spoolWeight <= 0) {
      showError('Spool weight must be greater than 0');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/filaments/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialName: formData.materialName,
          brand: formData.brand,
          color: formData.color,
          colorHex: formData.colorHex || null,
          spoolPrice,
          spoolWeight,
          remainingWeight,
          density: formData.density ? parseFloat(formData.density.replace(',', '.')) : undefined,
          notes: formData.notes || null,
          website: formData.website || null,
          materialType: formData.materialType || null,
        }),
      });
      if (res.ok) {
        success('Updated');
        setEditingId(null);
        loadWarehouse();
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || 'Update failed');
      }
    } catch {
      showError('Connection error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/filaments/${itemToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        success('Deleted');
        setEditingId(null);
        loadWarehouse();
      } else {
        showError('Delete failed');
      }
    } catch {
      showError('Connection error');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  if (!hydrated || !isOpen) return null;

  const title = activeTab === 'warehouse' ? 'Your Warehouse (Stock)' : 'Global Filament Database';
  const icon =
    activeTab === 'warehouse' ? (
      <Database className="w-5 h-5" />
    ) : (
      <Globe className="w-5 h-5" />
    );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        icon={icon}
        size="4xl"
        className="max-w-4xl max-h-[90vh] flex flex-col"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
            {activeTab === 'warehouse' && (
              <button
                type="button"
                onClick={handleAddSpool}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Spool
              </button>
            )}
          </>
        }
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange('warehouse')}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                activeTab === 'warehouse'
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Database className="w-4 h-4 inline-block mr-2 align-middle" />
              Warehouse
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('catalog')}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-4 h-4 inline-block mr-2 align-middle" />
              Catalog
            </button>
          </div>

          {activeTab === 'warehouse' && !editingId && (
            <>
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="w-full max-w-xs mb-4">
                  <SearchInput
                    placeholder="Search on shelf..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="sm"
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                  {isLoadingWarehouse ? (
                    <div className="flex items-center justify-center py-12 text-slate-500">
                      <span className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-indigo-600" />
                      <span className="ml-3">Loading...</span>
                    </div>
                  ) : filaments.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <p className="font-medium">No filaments in warehouse</p>
                      <p className="text-sm mt-1">Use &quot;Add Spool&quot; and pick from Catalog.</p>
                    </div>
                  ) : (
                    filaments.map((item) => {
                      const total = item.spoolWeight ?? 1000;
                      const left = item.remainingWeight ?? 0;
                      const status = getStatus(left, total);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-10 h-10 rounded-full border-4 border-slate-50 shadow-sm shrink-0"
                              style={{
                                backgroundColor:
                                  item.colorHex || '#94a3b8',
                              }}
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">
                                {item.brand} {item.materialName}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">ID: {item.id}</p>
                            </div>
                          </div>
                          <div className="flex-1 max-w-[200px] mx-4 hidden sm:block">
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span
                                className={
                                  status === 'low' ? 'text-red-600' : 'text-slate-600'
                                }
                              >
                                {left}g left
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  status === 'low' ? 'bg-red-500' : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${total ? (left / total) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="relative flex items-center gap-2">
                            {showSelectButton && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  onFilamentSelected?.(item, { fromWarehouse: true });
                                  onClose();
                                }}
                                className="text-indigo-600 hover:bg-indigo-50"
                              >
                                Select
                              </Button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setMenuOpenId(menuOpenId === item.id ? null : item.id)
                              }
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Settings className="w-5 h-5" />
                            </button>
                            {menuOpenId === item.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setMenuOpenId(null)}
                                  aria-hidden
                                />
                                <div className="absolute right-0 top-full mt-1 py-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[140px]">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(item)}
                                    className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(item.id)}
                                    className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'warehouse' && editingId && (
            <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 rounded-2xl bg-slate-50/50 p-4 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">Edit filament</h3>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilamentForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSaveEdit}
                onCancel={() => setEditingId(null)}
                isLoading={isSaving}
                activeTab="warehouse"
                isEditing={true}
                isCopying={false}
              />
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex items-start gap-3">
                <Globe className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-900 font-medium">
                  Search the market database to get density and parameters for quotes automatically.
                  No need to enter them manually.
                </p>
              </div>
              <div className="w-full mb-4">
                <SearchInput
                  placeholder="Enter manufacturer or type (e.g. Prusament PETG)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {TYPE_FILTERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                      activeTypeFilter === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {isLoadingCatalog ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">
                    <span className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-indigo-600" />
                    <span className="ml-3">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catalogWithAdded.map((item, index) => (
                        <div
                          key={`catalog-${index}-${item.id}-${item.brand}-${item.materialName}-${item.color}`}
                          className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between hover:border-indigo-300 transition-colors group"
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <div
                              className="w-12 h-12 rounded-full border-4 border-slate-50 shadow-sm flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor:
                                  item.colorHex?.split(',')[0] || '#94a3b8',
                              }}
                            >
                              {item.isLiquid && (
                                <Droplet className="w-5 h-5 text-white/60" />
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {item.brand}
                              </p>
                              <p className="font-black text-slate-900 text-sm leading-tight">
                                {item.materialName}
                              </p>
                              <span className="inline-block mt-1 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                {item.materialType || '—'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.isAdded ? (
                              <button
                                type="button"
                                disabled
                                className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="w-4 h-4" /> In warehouse
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToWarehouse(item)}
                                className="w-full py-2 bg-white border border-slate-200 text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <Plus className="w-4 h-4" /> Add to your warehouse
                              </button>
                            )}
                            {showSelectButton && item.isAdded && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-indigo-600 hover:bg-indigo-50"
                                onClick={() => {
                                  const wh = filaments.find(
                                    (f) =>
                                      f.brand === item.brand &&
                                      f.materialName === item.materialName &&
                                      f.color === item.color
                                  );
                                  if (wh) {
                                    onFilamentSelected?.(wh, { fromWarehouse: true });
                                    onClose();
                                  }
                                }}
                              >
                                Select
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {catalogPage < catalogTotalPages && (
                      <div className="mt-6 flex justify-center">
                        <Button
                          variant="ghost"
                          onClick={loadMoreCatalog}
                          disabled={isLoadingMoreCatalog}
                          className="font-bold"
                        >
                          {isLoadingMoreCatalog ? 'Loading…' : 'Load more'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <AddToWarehouseModal
        isOpen={addToWarehouseFilament !== null}
        onClose={() => setAddToWarehouseFilament(null)}
        filament={addToWarehouseFilament}
        onAdded={handleAddedToWarehouse}
      />

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
        title="Upgrade Plan"
        description={`You have reached the limit of ${maxFilaments} filaments. Upgrade to add more.`}
      />
    </>
  );
}
