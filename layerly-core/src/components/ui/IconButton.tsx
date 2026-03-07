'use client';

import { Loader2, type LucideIcon } from 'lucide-react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

export type IconButtonVariant =
  | 'default'
  | 'outline'
  | 'ghost'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info'
  | 'indigo';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: IconButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  tooltip?: string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default:
    'bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 shadow-sm',
  outline:
    'bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 shadow-sm',
  ghost:
    'bg-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border-transparent shadow-none',
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-md',
  danger:
    'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-sm',
  warning:
    'bg-amber-500 text-white hover:bg-amber-600 border-transparent shadow-sm',
  info: 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-sm',
  indigo:
    'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-md',
};

const sizeStyles = {
  sm: 'w-7 h-7 rounded-lg',
  md: 'w-8 h-8 rounded-xl',
  lg: 'w-9 h-9 rounded-xl',
};

const iconSizeStyles = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-4 h-4',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      icon: Icon,
      variant = 'default',
      size = 'md',
      isLoading = false,
      tooltip,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantClass = variantStyles[variant] ?? variantStyles.default;

    const button = (
      <button
        ref={ref}
        type="button"
        disabled={isLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed',
          variantClass,
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin', iconSizeStyles[size])} />
        ) : (
          <Icon className={iconSizeStyles[size]} />
        )}
      </button>
    );

    if (tooltip) {
      return <Tooltip content={tooltip}>{button}</Tooltip>;
    }

    return button;
  }
);

IconButton.displayName = 'IconButton';
