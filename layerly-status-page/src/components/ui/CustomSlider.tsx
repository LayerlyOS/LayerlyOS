'use client';

export interface CustomSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  helperText?: string;
  showValue?: boolean;
  valueSuffix?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  helperText,
  showValue = true,
  valueSuffix = '',
  disabled = false,
  className = '',
}: CustomSliderProps) {
  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-end mb-3">
          {label && (
            <label
              className={`text-[10px] font-bold uppercase tracking-widest ${disabled ? 'text-slate-400' : 'text-slate-500'}`}
            >
              {label}
            </label>
          )}
          {showValue && (
            <span
              className={`text-sm font-bold ${disabled ? 'text-slate-400' : 'text-indigo-600'}`}
            >
              {value}
              {valueSuffix}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center h-6 py-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={`custom-range w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      {helperText && (
        <p className="text-[10px] font-bold uppercase tracking-wider mt-2 text-slate-400">
          {helperText}
        </p>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 9999px;
          outline: none;
        }
        .custom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(79, 70, 229, 0.4);
          transition: transform 0.15s ease, background 0.2s ease;
        }
        .custom-range:not(:disabled)::-webkit-slider-thumb:hover {
          background: #4338ca;
          transform: scale(1.15);
        }
        .custom-range:not(:disabled):active::-webkit-slider-thumb {
          cursor: grabbing;
          transform: scale(0.95);
        }
        .custom-range::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border: none;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(79, 70, 229, 0.4);
          transition: transform 0.15s ease, background 0.2s ease;
        }
        .custom-range:not(:disabled)::-moz-range-thumb:hover {
          background: #4338ca;
          transform: scale(1.15);
        }
        .custom-range:not(:disabled):active::-moz-range-thumb {
          cursor: grabbing;
          transform: scale(0.95);
        }
      `,
        }}
      />
    </div>
  );
}
