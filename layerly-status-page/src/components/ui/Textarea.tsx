import * as React from 'react';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  label?: string;
  helperText?: string;
  size?: TextareaSize;
}

const sizeStyles = {
  sm: 'py-2.5 text-sm min-h-[72px]',
  md: 'py-3.5 text-sm min-h-[80px]',
  lg: 'py-4 text-base min-h-[96px]',
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
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

    const textareaClass = `w-full rounded-xl border font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 resize-none px-4 ${
      hasError
        ? 'bg-red-50 border-red-300 text-red-900 focus:border-red-400 focus:ring-red-500/20'
        : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/10'
    } ${sizeStyles[size]} ${className ?? ''}`;

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
        <textarea id={id} ref={ref} className={textareaClass} {...props} />
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
Textarea.displayName = 'Textarea';

export { Textarea };
