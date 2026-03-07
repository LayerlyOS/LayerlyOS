import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'outline'
  | 'soft'
  | 'ghost'
  | 'success'
  | 'amber'
  | 'purple'
  | 'indigo'
  | 'green';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode | string;
  rightIcon?: ReactNode | string;
  fullWidth?: boolean;
}

const VARIANT_MAP: Record<ButtonVariant, ButtonVariant> = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'danger',
  outline: 'outline',
  soft: 'soft',
  ghost: 'ghost',
  success: 'primary',
  amber: 'primary',
  purple: 'primary',
  indigo: 'primary',
  green: 'primary',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const resolvedVariant = VARIANT_MAP[variant] ?? variant;

    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-[0.98]';

    const sizeStyles = {
      sm: 'text-sm px-4 py-2',
      md: 'text-sm px-6 py-3',
      lg: 'text-base px-6 py-3.5',
    };

    const variantStyles: Record<string, string> = {
      primary:
        'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 focus:ring-indigo-500/10',
      secondary:
        'bg-slate-900 text-white hover:bg-slate-800 shadow-md focus:ring-slate-500/20',
      danger:
        'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200 focus:ring-red-500/20',
      outline:
        'bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 shadow-sm focus:ring-indigo-500/10',
      soft:
        'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-none focus:ring-indigo-500/10',
      ghost:
        'bg-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-50 shadow-none focus:ring-indigo-500/10',
    };

    const widthClass = fullWidth ? 'w-full' : '';
    const loadingClass = isLoading ? 'cursor-wait' : '';
    const variantClass = variantStyles[resolvedVariant] ?? variantStyles.primary;

    const renderIcon = (icon: ReactNode | string, position: 'left' | 'right') => {
      if (!icon) return null;
      const marginClass = position === 'left' ? 'mr-2' : 'ml-2';
      if (typeof icon === 'string') {
        return <i className={`${icon} ${marginClass}`} />;
      }
      return <span className={marginClass}>{icon}</span>;
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantClass} ${widthClass} ${loadingClass} ${className}`}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 shrink-0" aria-hidden />
        )}
        {!isLoading && renderIcon(leftIcon, 'left')}
        {isLoading && loadingText ? loadingText : children}
        {!isLoading && renderIcon(rightIcon, 'right')}
      </button>
    );
  }
);

Button.displayName = 'Button';
