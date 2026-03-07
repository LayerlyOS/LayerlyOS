import { ArrowDownAZ, ArrowUpAZ, ChevronLeft, Plus } from 'lucide-react';
import type React from 'react';
import { BrandSelectSearch } from '@/components/ui/BrandSelectSearch';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { IconButton } from '@/components/ui/IconButton';

interface FilamentFiltersProps {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  selectedBrand: string;
  setSelectedBrand: (s: string) => void;
  brands: string[];
  sortBy: string;
  setSortBy: (s: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (s: React.SetStateAction<'asc' | 'desc'>) => void;
  activeTab: 'warehouse' | 'catalog';
  isAdmin: boolean;
  isGlobalSidebarOpen: boolean;
  setIsGlobalSidebarOpen: (b: React.SetStateAction<boolean>) => void;
}

export function FilamentFilters({
  searchQuery,
  setSearchQuery,
  selectedBrand,
  setSelectedBrand,
  brands,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  activeTab,
  isAdmin,
  isGlobalSidebarOpen,
  setIsGlobalSidebarOpen,
}: FilamentFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center w-full">
      {/* Search Input - Spans 4 columns */}
      <div className="md:col-span-4 lg:col-span-3">
        <SearchInput
          placeholder="Search filament..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="sm"
        />
      </div>

      {/* Filters Group - Spans remaining columns */}
      <div className="md:col-span-8 lg:col-span-9 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-end">
        
        {/* Brand Select */}
        <div className="w-full sm:w-[180px]">
          {activeTab === 'catalog' ? (
            <BrandSelectSearch
              options={[
                { value: '', label: "All brands" },
                ...brands.map((b) => ({ value: b, label: b })),
              ]}
              value={selectedBrand}
              onChange={setSelectedBrand}
              placeholder="Select brand"
              className="h-9"
            />
          ) : (
            <CustomSelect
              options={[
                { value: '', label: "All brands" },
                ...brands.map((b) => ({ value: b, label: b })),
              ]}
              value={selectedBrand}
              onChange={setSelectedBrand}
              placeholder="Select brand"
              className="h-9"
            />
          )}
        </div>

        {/* Sort Select */}
        <div className="w-full sm:w-[180px]">
          <CustomSelect
            options={[
              { value: 'brand', label: "Sort by: Brand" },
              { value: 'materialName', label: "Sort by: Type" },
              { value: 'color', label: "Sort by: Color" },
            ]}
            value={sortBy}
            onChange={setSortBy}
            className="h-9"
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />

        {/* Sort Order Button */}
        <div className="flex items-center justify-end sm:justify-start">
          <IconButton
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            variant="ghost"
            size="md"
            className="border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"
            tooltip={sortOrder === 'asc' ? "Ascending" : "Descending"}
            icon={sortOrder === 'asc' ? ArrowDownAZ : ArrowUpAZ}
          />
        </div>
        
        {/* Add Button (Admin) */}
        {activeTab === 'catalog' && isAdmin && (
          <div className="sm:ml-2">
            <Button
              onClick={() => setIsGlobalSidebarOpen((prev) => !prev)}
              variant="outline"
              size="md"
              className={`gap-2 w-full sm:w-auto h-9 ${isGlobalSidebarOpen ? 'text-purple-600 border-purple-300 bg-purple-50' : 'bg-white'}`}
              title={isGlobalSidebarOpen ? "Hide Panel" : "Add Filament (Global)"}
              leftIcon={isGlobalSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {isGlobalSidebarOpen ? "Hide Panel" : "Add Filament"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
