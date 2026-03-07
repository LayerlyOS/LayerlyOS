'use client';

import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
  id?: string;
  variant?: 'default' | 'dark';
};

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  autoFocus,
  onEnter,
  id,
  variant = 'default',
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = useMemo(() => {
    const normalized = String(value || '')
      .replace(/\D/g, '')
      .slice(0, length);
    return Array.from({ length }, (_, i) => normalized[i] ?? '');
  }, [length, value]);

  useEffect(() => {
    if (!autoFocus) return;
    const first = refs.current[0];
    first?.focus();
    first?.select();
  }, [autoFocus]);

  const setDigit = (index: number, digit: string) => {
    const current = digits.slice();
    current[index] = digit;
    onChange(current.join(''));
  };

  const focusIndex = (index: number) => {
    const el = refs.current[index];
    el?.focus();
    el?.select();
  };

  const handleChange = (index: number, raw: string) => {
    if (disabled) return;

    const nextDigit = raw.replace(/\D/g, '').slice(-1);
    if (!nextDigit) {
      setDigit(index, '');
      return;
    }

    setDigit(index, nextDigit);

    if (index < length - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Enter') {
      onEnter?.();
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) focusIndex(index - 1);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < length - 1) focusIndex(index + 1);
      return;
    }

    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigit(index, '');
        return;
      }

      if (index > 0) {
        e.preventDefault();
        setDigit(index - 1, '');
        focusIndex(index - 1);
      }
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    const pasted = e.clipboardData.getData('text') || '';
    const incoming = pasted.replace(/\D/g, '');
    if (!incoming) return;

    e.preventDefault();

    const current = digits.slice();
    let writeIndex = index;

    for (const ch of incoming) {
      if (writeIndex >= length) break;
      current[writeIndex] = ch;
      writeIndex += 1;
    }

    onChange(current.join(''));

    const nextFocus = Math.min(writeIndex, length - 1);
    focusIndex(nextFocus);
  };

  const baseStyles =
    'w-11 h-12 text-center text-xl font-bold rounded-xl border outline-none transition-all disabled:opacity-50 focus:ring-4';

  const styles = useMemo(() => {
    const isDark = variant === 'dark';
    return isDark
      ? 'bg-slate-800 border-slate-600 text-white focus:border-indigo-500 focus:ring-indigo-500/20'
      : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/10';
  }, [variant]);

  return (
    <div className="flex items-center justify-center gap-2">
      {digits.map((d, i) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: Order is fixed and inputs are identical
          key={i}
          id={i === 0 ? id : undefined}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          className={`${baseStyles} ${styles}`}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
