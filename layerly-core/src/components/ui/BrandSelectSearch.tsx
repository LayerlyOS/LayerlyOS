'use client';

import { ChevronDown, Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export type SelectOption = {
  value: string | number;
  label: string;
  className?: string;
};

interface BrandSelectSearchProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  portal?: boolean;
}

export function BrandSelectSearch({
  value,
  onChange,
  options,
  label,
  placeholder,
  className = '',
  disabled = false,
  id,
  portal = false,
}: BrandSelectSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const [coords, setCoords] = useState<null | { top: number; left: number; width: number; rectTop: number }>(null);
  const [maxHeight, setMaxHeight] = useState(300);

  const generatedId = useId();
  const selectId = id || generatedId;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    if (!debounced) return options;
    const q = debounced.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, debounced]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Update coordinates for portal
  const updateCoords = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;

      const neededHeight = Math.min(options.length * 36 + 80, 300); // Estimate ~36px per option + header

      let newPosition: 'bottom' | 'top' = 'bottom';
      let availableHeight = spaceBelow;

      // Switch to top if constrained below AND more space above
      if (spaceBelow < neededHeight && spaceAbove > spaceBelow) {
        newPosition = 'top';
        availableHeight = spaceAbove;
      }

      setPosition(newPosition);
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
        rectTop: rect.top,
      });
      // Ensure max height fits within available space
      setMaxHeight(Math.min(availableHeight, 300));
    }
  }, [options.length]);

  // Handle scroll/resize for portal
  useLayoutEffect(() => {
    if (isOpen && portal) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);

      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }
  }, [isOpen, portal, updateCoords]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

      if (portal) {
        if (isOutsideContainer && isOutsideDropdown) {
          setIsOpen(false);
        }
      } else {
        if (isOutsideContainer) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [portal]);

  const handleSelect = (optionValue: string | number) => {
    if (disabled) return;
    onChange(String(optionValue));
    setIsOpen(false);
    setQuery('');
    setDebounced('');
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={
        portal && coords
          ? {
              position: 'fixed',
              left: coords.left,
              width: coords.width,
              zIndex: 9999,
              maxHeight: `${maxHeight}px`,
              ...(position === 'bottom'
                ? {
                    top: coords.top + 4,
                  }
                : {
                    bottom: window.innerHeight - coords.rectTop + 4,
                  }),
            }
          : {}
      }
      className={`
        bg-white shadow-xl rounded-xl border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col
        ${portal ? '' : 'absolute z-50 mt-2 w-full origin-top max-h-60'}
        ${portal && position === 'bottom' ? 'origin-top' : ''}
        ${portal && position === 'top' ? 'origin-bottom' : ''}
      `}
    >
      <div className="px-2 pb-1 border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand..."
            size="sm"
            className="!py-2 pl-9"
          />
        </div>
        <div className="flex items-center justify-between px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>
            Results: {filtered.length}/{options.length}
          </span>
          {query ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching
            </span>
          ) : null}
        </div>
      </div>
      <div className="overflow-auto custom-scrollbar" style={{ maxHeight: portal ? maxHeight - 80 : 176 }}>
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-slate-400 text-center">No options</div>
        ) : (
          filtered.slice(0, 500).map((option) => (
            <div
              key={option.value}
              role="option"
              aria-selected={String(option.value) === String(value)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(option.value);
                }
              }}
              onClick={() => handleSelect(option.value)}
              className={`
                px-4 py-3 text-sm cursor-pointer transition-colors outline-none rounded-lg
                ${
                  String(option.value) === String(value)
                    ? 'bg-indigo-50 text-indigo-700 font-bold focus:bg-indigo-100'
                    : 'text-slate-700 hover:bg-slate-50 focus:bg-slate-50'
                }
                ${option.className || ''}
              `}
            >
              {option.label}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2"
        >
          {label}
        </label>
      )}

      <Button
        id={selectId}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        variant="outline"
        className={`
          w-full !justify-between font-medium
          ${isOpen ? 'ring-4 ring-indigo-500/10 border-indigo-500' : ''}
          ${!selectedOption ? 'text-slate-400' : 'text-slate-800'}
        `}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder || 'Select...'}
        </span>
        <ChevronDown
          className={`w-5 h-5 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`}
        />
      </Button>

      {isOpen && (portal ? createPortal(dropdownContent, document.body) : dropdownContent)}
    </div>
  );
}
