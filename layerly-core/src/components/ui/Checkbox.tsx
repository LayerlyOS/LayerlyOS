import * as React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** Optional label text (rendered next to the checkbox) */
  label?: React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, id, label, ...props }, ref) => {
    return (
      <label
        className={`relative flex items-center gap-3 cursor-pointer group w-fit ${disabled ? 'cursor-not-allowed' : ''} ${className ?? ''}`}
      >
        <div className="relative flex items-center justify-center shrink-0">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            disabled={disabled}
            id={id}
            ref={ref}
            {...props}
          />
          <div
            className={`w-5 h-5 rounded border-2 border-slate-300 bg-white shadow-sm transition-colors duration-200 group-hover:border-indigo-400 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-500/10 peer-focus:ring-offset-0 ${
              disabled ? 'opacity-50 bg-slate-100' : ''
            }`}
            aria-hidden
          >
            <Check
              className={`w-3.5 h-3.5 text-white transition-opacity duration-200 ${
                checked ? 'opacity-100' : 'opacity-0'
              }`}
              strokeWidth={3}
            />
          </div>
        </div>
        {label != null && (
          <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors select-none">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
