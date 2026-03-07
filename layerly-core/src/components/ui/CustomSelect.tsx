'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CustomSelectOption = {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Optional class for the option row in the dropdown (e.g. hover styles). */
  className?: string;
};

export type CustomSelectSize = 'sm' | 'md' | 'lg';

export interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
  id?: string;
  size?: CustomSelectSize;
}

const selectSizeStyles: Record<CustomSelectSize, string> = {
  sm: 'py-2.5 text-sm px-4',
  md: 'py-3.5 text-sm px-4',
  lg: 'py-4 text-base px-4',
};

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  helperText,
  error,
  disabled = false,
  icon: Icon,
  className = '',
  id,
  size = 'md',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label
          className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${error ? 'text-red-600' : 'text-slate-500'}`}
        >
          {label}
        </label>
      )}

      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between text-left transition-all outline-none rounded-xl font-medium
          ${selectSizeStyles[size]}
          ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'cursor-pointer'}
          ${!disabled && !error && !isOpen ? 'bg-slate-50 border border-slate-200 text-slate-800 hover:bg-white hover:border-indigo-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10' : ''}
          ${isOpen && !error ? 'bg-white border-indigo-500 ring-4 ring-indigo-500/10 text-slate-900' : ''}
          ${error ? 'bg-red-50 border-red-300 text-red-900 focus:ring-4 focus:ring-red-500/20' : ''}
        `}
      >
        <div className="flex items-center gap-3 truncate">
          {Icon && (
            <Icon
              className={`w-5 h-5 shrink-0 ${error ? 'text-red-500' : isOpen ? 'text-indigo-500' : 'text-slate-400'}`}
            />
          )}
          <span
            className={`font-medium truncate ${!selectedOption ? (error ? 'text-red-400' : 'text-slate-400') : ''}`}
          >
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon && (
                  <span className="text-slate-500">{selectedOption.icon}</span>
                )}
                {selectedOption.label}
              </span>
            ) : (
              placeholder
            )}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : error ? 'text-red-400' : 'text-slate-400'}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left
                    ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                    ${option.className ?? ''}
                  `}
                >
                  <span className="flex items-center gap-3">
                    {option.icon && (
                      <span
                        className={isSelected ? 'text-indigo-600' : 'text-slate-400'}
                      >
                        {option.icon}
                      </span>
                    )}
                    <span className={isSelected ? 'font-bold' : 'font-medium'}>
                      {option.label}
                    </span>
                  </span>
                  {isSelected && (
                    <Check
                      className="w-4 h-4 text-indigo-600 shrink-0"
                      strokeWidth={3}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(helperText || error) && (
        <p
          className={`text-[10px] font-bold uppercase tracking-wider mt-2 flex items-center gap-1.5 ${error ? 'text-red-600' : 'text-slate-400'}`}
        >
          {error ? <AlertTriangle className="w-3.5 h-3.5" /> : null}
          {error || helperText}
        </p>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `,
        }}
      />
    </div>
  );
}
