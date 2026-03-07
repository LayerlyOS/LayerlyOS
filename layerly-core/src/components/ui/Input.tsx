import * as React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  size?: InputSize;
}

const sizeStyles = {
  sm: 'py-2.5 text-sm',
  md: 'py-3.5 text-sm',
  lg: 'py-4 text-base',
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      leftIcon,
      rightIcon,
      label,
      helperText,
      size = 'md',
      id: idProp,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;

    const isDate = type === 'date' || type === 'datetime-local';
    const hasValue =
      props.value !== '' && props.value !== undefined && props.value !== null;
    const textColorClass = isDate && !hasValue ? 'text-slate-400' : 'text-slate-800';

    const wrapperClass = `relative flex items-center w-full rounded-xl border transition-colors focus-within:ring-4 outline-none ${
      hasError
        ? 'bg-red-50 border-red-300 focus-within:border-red-400 focus-within:ring-red-500/20'
        : 'bg-slate-50 border-slate-200 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-indigo-500/10'
    } ${className ?? ''}`;

    const inputClass = `flex-1 min-w-0 w-full bg-transparent border-none outline-none focus:ring-0 px-4 font-medium placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${textColorClass} ${sizeStyles[size]} ${leftIcon ? 'pl-3' : ''} ${rightIcon ? 'pr-3' : ''}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className={`block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ${hasError ? 'text-red-600' : ''}`}
          >
            {label}
          </label>
        )}
        <div className={wrapperClass}>
          {leftIcon && (
            <div className="pl-4 text-slate-400 flex items-center justify-center pointer-events-none shrink-0">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={id}
            className={inputClass}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="pr-4 text-slate-400 flex items-center justify-center pointer-events-none shrink-0">
              {rightIcon}
            </div>
          )}
        </div>
        {(helperText || errorMessage) && (
          <p
            className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${hasError ? 'text-red-600' : 'text-slate-400'}`}
          >
            {errorMessage ?? helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
