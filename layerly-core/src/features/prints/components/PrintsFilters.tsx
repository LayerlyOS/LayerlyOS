import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/SearchInput';
import type { Printer } from '@/types';

interface PrintsFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  priceFrom: string;
  setPriceFrom: (price: string) => void;
  priceTo: string;
  setPriceTo: (price: string) => void;
  selectedPrinterId: string | number | null;
  setSelectedPrinterId: (id: string | number | null) => void;
  printers: Printer[];
  uniqueBrands: string[];
  onClear: () => void;
  totalResults: number;
  filteredResults: number;
}

export function PrintsFilters({
  searchTerm,
  onSearchChange,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  selectedBrand,
  setSelectedBrand,
  priceFrom,
  setPriceFrom,
  priceTo,
  setPriceTo,
  selectedPrinterId,
  setSelectedPrinterId,
  printers,
  uniqueBrands,
  onClear,
  totalResults,
  filteredResults,
}: PrintsFiltersProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Filters</h3>
          <p className="text-slate-500 text-sm mt-1">Refine your search</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Search */}
        <div className="lg:col-span-2">
          <SearchInput
            id="prints-search"
            label="Search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search prints..."
          />
        </div>

        {/* Date Range */}
        <div>
          <label
            htmlFor="prints-date-from"
            className="block text-xs font-semibold mb-2 text-slate-600"
          >
            Date From
          </label>
          <Input
            id="prints-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label
            htmlFor="prints-date-to"
            className="block text-xs font-semibold mb-2 text-slate-600"
          >
            Date To
          </label>
          <Input
            id="prints-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Brand Filter */}
        <div>
          <label
            htmlFor="prints-brand-select"
            className="block text-xs font-semibold mb-2 text-slate-600"
          >
            Brand
          </label>
          <CustomSelect
            id="prints-brand-select"
            value={selectedBrand}
            onChange={(value) => setSelectedBrand(value)}
            options={[
              { value: '', label: 'All Brands' },
              ...uniqueBrands.map((b) => ({ value: b, label: b })),
            ]}
            className="w-full"
          />
        </div>

        {/* Printer Filter */}
        <div>
          <label
            htmlFor="prints-printer-select"
            className="block text-xs font-semibold mb-2 text-slate-600"
          >
            Printer
          </label>
          <CustomSelect
            id="prints-printer-select"
            value={selectedPrinterId != null ? String(selectedPrinterId) : ''}
            onChange={(value) => setSelectedPrinterId(value ? value : null)}
            options={[
              { value: '', label: 'All Printers' },
              ...printers.map((p) => ({ value: String(p.id), label: p.name })),
            ]}
            className="w-full"
          />
        </div>

        {/* Profit Filter */}
        <div>
          <label
            htmlFor="prints-profit-from"
            className="block text-xs font-semibold mb-2 text-slate-600"
          >
            Profit Min
          </label>
          <Input
            id="prints-profit-from"
            type="number"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            placeholder="Min"
            className="w-full"
          />
        </div>
        <div>
          <label
            htmlFor="prints-profit-to"
            className="block text-xs font-semibold mb-2 text-slate-600"
          >
            Profit Max
          </label>
          <Input
            id="prints-profit-to"
            type="number"
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            placeholder="Max"
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center pt-6 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="text-slate-500 hover:text-slate-700"
        >
          <i className="fa-solid fa-times mr-2" />
          Clear Filters
        </Button>
        <span className="text-sm text-slate-600 self-center">
          Showing {filteredResults} of {totalResults} results
        </span>
      </div>
    </div>
  );
}
