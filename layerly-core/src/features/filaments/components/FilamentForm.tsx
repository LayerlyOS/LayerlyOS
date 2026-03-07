import { useId } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Tag, 
  Layers, 
  Thermometer, 
  Wind, 
  DollarSign, 
  FileText, 
  Globe,
} from 'lucide-react';

interface FilamentFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  activeTab: 'warehouse' | 'catalog';
  isEditing: boolean;
  isCopying: boolean;
}

export function FilamentForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  activeTab,
  isEditing,
  isCopying,
}: FilamentFormProps) {
  // IDs for accessibility
  const typeId = useId();
  const brandId = useId();
  const colorId = useId();
  const colorHexId = useId();
  const weightId = useId();
  const priceId = useId();
  const remainingWeightId = useId();
  const densityId = useId();
  const printTempMinId = useId();
  const printTempMaxId = useId();
  const bedTempId = useId();
  const printSpeedId = useId();
  const fanSpeedId = useId();
  const flowRatioId = useId();
  const diameterId = useId();
  const websiteId = useId();
  const mechanicalPropsId = useId();
  const applicationsId = useId();
  const notesId = useId();

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-100 text-slate-800">
      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
        <Icon className="w-4 h-4" />
      </div>
      <h4 className="font-semibold text-sm uppercase tracking-wide">{title}</h4>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">
          {isEditing
            ? 'Edit Filament'
            : isCopying
              ? 'Add to Warehouse'
              : 'New Filament'}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {isEditing 
            ? 'Update the details of your filament.' 
            : 'Fill in the information to add a new filament to your inventory.'}
        </p>
      </div>

      <div className="space-y-8">
        {/* Section 1: Basic Information */}
        <section>
          <SectionHeader icon={Tag} title="Basic Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor={brandId} className="block text-sm font-medium text-slate-700 mb-1.5">
                  Brand <span className="text-red-500">*</span>
                </label>
                <Input
                  id={brandId}
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="e.g. Prusament"
                  className="h-10"
                />
              </div>
              <div>
                <label htmlFor={typeId} className="block text-sm font-medium text-slate-700 mb-1.5">
                  Material Type <span className="text-red-500">*</span>
                </label>
                <Input
                  id={typeId}
                  value={formData.materialName}
                  onChange={(e) => handleChange('materialName', e.target.value)}
                  placeholder="e.g. PLA, PETG"
                  className="h-10"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor={colorId} className="block text-sm font-medium text-slate-700 mb-1.5">
                Color & Hex
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id={colorId}
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    placeholder="e.g. Galaxy Black"
                    className="h-10"
                  />
                </div>
                <div className="relative group">
                  <div 
                    className="w-10 h-10 rounded-lg border border-slate-200 shadow-sm cursor-pointer overflow-hidden transition-transform group-hover:scale-105 ring-2 ring-transparent group-hover:ring-indigo-100"
                    style={{ backgroundColor: formData.colorHex?.split(',')[0] || '#000000' }}
                  >
                    <input
                      id={colorHexId}
                      type="color"
                      value={formData.colorHex?.split(',')[0] || '#000000'}
                      onChange={(e) => handleChange('colorHex', e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Economics & Inventory */}
        <section>
          <SectionHeader icon={DollarSign} title="Economics & Inventory" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor={priceId} className="block text-sm font-medium text-slate-700 mb-1.5">
                Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <Input
                  id={priceId}
                  type="number"
                  value={formData.spoolPrice}
                  onChange={(e) => handleChange('spoolPrice', e.target.value)}
                  placeholder="0.00"
                  className="pl-7 h-10"
                />
              </div>
            </div>
            <div>
              <label htmlFor={weightId} className="block text-sm font-medium text-slate-700 mb-1.5">
                Spool Weight (g)
              </label>
              <Input
                id={weightId}
                type="number"
                value={formData.spoolWeight}
                onChange={(e) => handleChange('spoolWeight', e.target.value)}
                placeholder="1000"
                className="h-10"
              />
            </div>
            {activeTab === 'warehouse' && (
              <div>
                <label htmlFor={remainingWeightId} className="block text-sm font-medium text-slate-700 mb-1.5">
                  Remaining (g)
                </label>
                <Input
                  id={remainingWeightId}
                  type="number"
                  value={formData.remainingWeight}
                  onChange={(e) => handleChange('remainingWeight', e.target.value)}
                  placeholder="1000"
                  className="h-10 bg-indigo-50/50 border-indigo-200"
                />
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Technical Properties (Warehouse Only) */}
        {activeTab === 'warehouse' && (
          <section>
            <SectionHeader icon={Layers} title="Physical Properties" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor={densityId} className="block text-sm font-medium text-slate-700 mb-1.5">
                  Density (g/cm³)
                </label>
                <Input
                  id={densityId}
                  type="number"
                  step="0.01"
                  value={formData.density}
                  onChange={(e) => handleChange('density', e.target.value)}
                  placeholder="1.24"
                  className="h-10"
                />
              </div>
              <div>
                <label htmlFor={diameterId} className="block text-sm font-medium text-slate-700 mb-1.5">
                  Diameter (mm)
                </label>
                <Input
                  id={diameterId}
                  type="number"
                  step="0.01"
                  value={formData.diameter || '1.75'}
                  onChange={(e) => handleChange('diameter', e.target.value)}
                  placeholder="1.75"
                  className="h-10"
                />
              </div>
            </div>
          </section>
        )}

        {/* Section 4: Advanced Printing Parameters (Catalog Only) */}
        {activeTab === 'catalog' && (
          <section className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <SectionHeader icon={Thermometer} title="Print Settings" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Temperatures */}
              <div className="space-y-4">
                <h5 className="text-xs font-semibold text-slate-500 uppercase">Temperatures</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={printTempMinId} className="block text-xs font-medium text-slate-600 mb-1">
                      Nozzle Min (°C)
                    </label>
                    <Input
                      id={printTempMinId}
                      type="number"
                      value={formData.printTempMin}
                      onChange={(e) => handleChange('printTempMin', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label htmlFor={printTempMaxId} className="block text-xs font-medium text-slate-600 mb-1">
                      Nozzle Max (°C)
                    </label>
                    <Input
                      id={printTempMaxId}
                      type="number"
                      value={formData.printTempMax}
                      onChange={(e) => handleChange('printTempMax', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={bedTempId} className="block text-xs font-medium text-slate-600 mb-1">
                    Bed Temp (°C)
                  </label>
                  <Input
                    id={bedTempId}
                    type="number"
                    value={formData.bedTemp}
                    onChange={(e) => handleChange('bedTemp', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Speed & Flow */}
              <div className="space-y-4">
                <h5 className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                  <Wind className="w-3 h-3" /> Speed & Flow
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={printSpeedId} className="block text-xs font-medium text-slate-600 mb-1">
                      Print Speed
                    </label>
                    <Input
                      id={printSpeedId}
                      type="number"
                      value={formData.printSpeed}
                      onChange={(e) => handleChange('printSpeed', e.target.value)}
                      placeholder="mm/s"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label htmlFor={fanSpeedId} className="block text-xs font-medium text-slate-600 mb-1">
                      Fan Speed (%)
                    </label>
                    <Input
                      id={fanSpeedId}
                      type="number"
                      value={formData.fanSpeed}
                      onChange={(e) => handleChange('fanSpeed', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={flowRatioId} className="block text-xs font-medium text-slate-600 mb-1">
                    Flow Ratio
                  </label>
                  <Input
                    id={flowRatioId}
                    type="number"
                    step="0.01"
                    value={formData.flowRatio}
                    onChange={(e) => handleChange('flowRatio', e.target.value)}
                    placeholder="1.00"
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor={mechanicalPropsId} className="block text-xs font-medium text-slate-600 mb-1">
                  Mechanical Properties
                </label>
                <Textarea
                  id={mechanicalPropsId}
                  value={formData.mechanicalProps}
                  onChange={(e) => handleChange('mechanicalProps', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              <div>
                <label htmlFor={applicationsId} className="block text-xs font-medium text-slate-600 mb-1">
                  Applications
                </label>
                <Textarea
                  id={applicationsId}
                  value={formData.applications}
                  onChange={(e) => handleChange('applications', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor={websiteId} className="block text-xs font-medium text-slate-600 mb-1">
                Manufacturer Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id={websiteId}
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://..."
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </section>
        )}

        {/* Section 5: Notes */}
        <section>
          <SectionHeader icon={FileText} title="Notes" />
          <Textarea
            id={notesId}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional information..."
            className="min-h-[100px]"
          />
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
          {isEditing && (
            <Button 
              onClick={onCancel} 
              variant="ghost" 
              disabled={isLoading}
              className="text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={onSubmit} 
            isLoading={isLoading} 
            className="min-w-[140px]"
          >
            {isEditing
              ? 'Save Changes'
              : isCopying
                ? 'Save to Warehouse'
                : 'Add Filament'}
          </Button>
        </div>
      </div>
    </div>
  );
}