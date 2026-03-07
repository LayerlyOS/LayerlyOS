import { Loader2 } from 'lucide-react';

export interface ToggleButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  label?: string;
}

export function ToggleButton({
  checked,
  onChange,
  disabled = false,
  isLoading = false,
  className = '',
  label,
}: ToggleButtonProps) {
  const handleClick = () => {
    if (!disabled && !isLoading) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:ring-offset-0
          ${checked ? 'bg-indigo-600' : 'bg-slate-200'}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className="sr-only">{label || 'Toggle'}</span>
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow border border-slate-100
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />}
    </div>
  );
}
