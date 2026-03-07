'use client';

import { Check, Circle } from 'lucide-react';
import { useMemo } from 'react';

/**
 * Password strength indicator – segment bar + vertical requirements list (from gist).
 */
interface PasswordStrengthIndicatorProps {
  password?: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password = '',
  className = '',
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    const checks = [
      { id: 'length', met: password.length >= 8, label: 'Minimum 8 characters' },
      { id: 'uppercase', met: /[A-Z]/.test(password), label: 'At least one uppercase letter' },
      { id: 'number', met: /[0-9]/.test(password), label: 'At least one number' },
      { id: 'special', met: /[^A-Za-z0-9]/.test(password), label: 'Special character (e.g. !@#$%)' },
    ];

    const metCount = checks.filter((c) => c.met).length;
    let score = 0;
    if (password.length > 0) {
      score = metCount;
    }

    return { checks, score, metCount };
  }, [password]);

  const getSegmentColor = (index: number, score: number) => {
    if (score === 0) return 'bg-slate-200';
    if (score === 1 && index === 0) return 'bg-red-500';
    if (score === 2 && index <= 1) return 'bg-amber-400';
    if (score === 3 && index <= 2) return 'bg-blue-500';
    if (score === 4 && index <= 3) return 'bg-emerald-500';
    return 'bg-slate-100';
  };

  const getStatusLabel = (score: number) => {
    if (password.length === 0) return 'Enter password';
    if (score === 1) return 'Very weak';
    if (score === 2) return 'Weak';
    if (score === 3) return 'Good';
    if (score === 4) return 'Strong';
    return '';
  };

  const getStatusColorText = (score: number) => {
    if (password.length === 0) return 'text-slate-500';
    if (score <= 1) return 'text-red-600';
    if (score === 2) return 'text-amber-600';
    if (score === 3) return 'text-blue-600';
    return 'text-emerald-600';
  };

  return (
    <div
      className={`mt-4 space-y-4 bg-slate-50/50 border border-slate-200 p-5 rounded-xl transition-all ${className}`}
    >
      {/* Header and segment bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Security</span>
          <span className={`text-xs font-black ${getStatusColorText(strength.score)}`}>
            {getStatusLabel(strength.score)}
          </span>
        </div>

        <div className="flex gap-1.5 h-2 w-full">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`flex-1 rounded-full transition-colors duration-500 ease-out ${getSegmentColor(index, strength.score)}`}
            />
          ))}
        </div>
      </div>

      {/* Vertical requirements list */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {strength.checks.map((check) => (
          <div key={check.id} className="flex items-center gap-2.5 transition-opacity duration-300">
            <div
              className={`flex items-center justify-center w-4 h-4 rounded-full transition-colors ${
                check.met
                  ? 'bg-emerald-100 text-emerald-600'
                  : password.length > 0
                    ? 'bg-slate-200 text-slate-400'
                    : 'text-slate-300'
              }`}
            >
              {check.met ? (
                <Check className="w-3 h-3" strokeWidth={3} />
              ) : (
                <Circle className="w-2 h-2 fill-current" />
              )}
            </div>
            <span
              className={`text-xs font-medium transition-colors ${
                check.met ? 'text-slate-800' : 'text-slate-500'
              }`}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
