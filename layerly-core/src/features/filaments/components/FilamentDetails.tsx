import NextImage from 'next/image';
import { formatCurrency } from '@/lib/format';
import { type Filament } from '@/types';

interface FilamentDetailsProps {
  filament: Filament;
  type: 'warehouse' | 'catalog';
}

export function FilamentDetails({ filament, type }: FilamentDetailsProps) {
  if (!filament) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="p-6 border-b border-slate-100 bg-white">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-xl shadow-sm border border-slate-200 flex-shrink-0 overflow-hidden bg-white relative"
            style={{
              backgroundColor: filament.image
                ? 'white'
                : filament.colorHex?.split(',')[0] || '#D1D5DB',
            }}
          >
            {filament.image ? (
              <NextImage
                src={filament.image}
                alt={filament.brand}
                fill
                className="object-cover"
              />
            ) : null}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              {filament.materialName}
            </h3>
            <p className="text-slate-500 font-medium">{filament.brand}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <span
                  className="w-2 h-2 rounded-full border border-slate-300"
                  style={{ backgroundColor: filament.colorHex?.split(',')[0] || '#D1D5DB' }}
                ></span>
                {filament.color}
              </span>
              {filament.materialType && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {filament.materialType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-slate-400 text-sm"></i>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Basic Information
              </h4>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <InfoItem
                label="Spool Weight"
                value={`${filament.spoolWeight || 0}g`}
              />
              <InfoItem
                label="Diameter"
                value={filament.diameter ? `${filament.diameter}mm` : '-'}
              />
              <InfoItem
                label="Density"
                value={filament.density ? `${filament.density} g/cm³` : '-'}
              />
              {type === 'warehouse' ? (
                <InfoItem
                  label="Remaining"
                  value={`${Number(filament.remainingWeight || 0).toFixed(2)}g`}
                  highlight={(filament.remainingWeight || 0) < 100}
                />
              ) : (
                <InfoItem
                  label="Suggested Price"
                  value={
                    filament.spoolPrice
                      ? formatCurrency(filament.spoolPrice)
                      : '-'
                  }
                />
              )}
            </div>
          </div>

          {/* Technical Data - Only if available (mostly GlobalFilament) */}
          {(filament.printTempMin || filament.bedTemp || filament.printSpeed) && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                <i className="fa-solid fa-gauge-high text-slate-400 text-sm"></i>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Print Parameters
                </h4>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <InfoItem
                  label="Nozzle Temp"
                  value={
                    filament.printTempMin
                      ? `${filament.printTempMin}°C - ${filament.printTempMax}°C`
                      : '-'
                  }
                />
                <InfoItem
                  label="Bed Temp"
                  value={filament.bedTemp ? `${filament.bedTemp}°C` : '-'}
                />
                <InfoItem
                  label="Print Speed"
                  value={filament.printSpeed ? `${filament.printSpeed} mm/s` : '-'}
                />
                <InfoItem
                  label="Cooling"
                  value={filament.fanSpeed ? `${filament.fanSpeed}%` : '-'}
                />
                <InfoItem
                  label="Flow Ratio"
                  value={filament.flowRatio ? `${filament.flowRatio}` : '-'}
                />
              </div>
            </div>
          )}

          {/* Extended Properties */}
          {(filament.mechanicalProps || filament.applications) && (
            <div className="space-y-4">
              {filament.mechanicalProps && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                    <i className="fa-solid fa-dumbbell text-slate-400 text-sm"></i>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Mechanical Properties
                    </h4>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {filament.mechanicalProps}
                    </p>
                  </div>
                </div>
              )}
              {filament.applications && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                    <i className="fa-solid fa-lightbulb text-slate-400 text-sm"></i>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Applications
                    </h4>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {filament.applications}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes for Warehouse items */}
          {filament.notes && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
                <i className="fa-solid fa-sticky-note text-amber-400 text-sm"></i>
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Notes
                </h4>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-700 leading-relaxed">{filament.notes}</p>
              </div>
            </div>
          )}

          {/* External Links */}
          {filament.website && (
            <div className="pt-2 text-center">
              <a
                href={filament.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                <i className="fa-solid fa-external-link-alt"></i>
                Open Manufacturer Website
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="">
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`font-semibold text-sm ${highlight ? 'text-red-600' : 'text-slate-700'}`}>
        {value}
      </div>
    </div>
  );
}
