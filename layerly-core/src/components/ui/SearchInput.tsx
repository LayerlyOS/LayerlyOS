'use client';

import { Search } from 'lucide-react';
import * as React from 'react';
import { Input, type InputSize } from '@/components/ui/Input';

export interface SearchInputProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof Input>,
    'leftIcon' | 'type'
  > {
  /** Placeholder text (e.g. "Search orders...") */
  placeholder?: string;
  /** Size: sm (nav/compact), md (default), lg (hero) */
  size?: InputSize;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ size = 'md', placeholder = 'Search...', className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        size={size}
        placeholder={placeholder}
        leftIcon={<Search className="w-4 h-4" />}
        className={className}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
