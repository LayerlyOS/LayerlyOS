'use client';

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, subHours, subDays, startOfHour, subMinutes, startOfMinute } from 'date-fns';

type DayStatus = 'operational' | 'degraded' | 'down' | 'maintenance' | 'unknown';
export type BarInterval = 'minute' | 'hourly' | '6h' | 'daily';

const STATUS_ORDER: DayStatus[] = ['unknown', 'operational', 'maintenance', 'degraded', 'down'];

function worstStatus(a: DayStatus, b: DayStatus): DayStatus {
  const ai = STATUS_ORDER.indexOf(a);
  const bi = STATUS_ORDER.indexOf(b);
  return (ai === -1 ? 0 : ai) >= (bi === -1 ? 0 : bi) ? a : b;
}

const BAR_COLOR: Record<DayStatus, string> = {
  operational: '#34d399',
  degraded:    '#fbbf24',
  down:        '#ef4444',
  maintenance: '#94a3b8',
  unknown:     'transparent',
};
const BAR_HOVER: Record<DayStatus, string> = {
  operational: '#10b981',
  degraded:    '#f59e0b',
  down:        '#dc2626',
  maintenance: '#64748b',
  unknown:     'transparent',
};
const DOT_CLASS: Record<DayStatus, string> = {
  operational: 'bg-emerald-400',
  degraded:    'bg-amber-400',
  down:        'bg-red-500',
  maintenance: 'bg-slate-400',
  unknown:     'bg-slate-400',
};
const STATUS_LABEL: Record<DayStatus, string> = {
  operational: 'Operational',
  degraded:    'Degraded',
  down:        'Outage',
  maintenance: 'Maintenance',
  unknown:     'No data',
};

export interface UptimeBarsProps {
  checks: { status: string; checkedAt: Date }[];
  interval?: BarInterval;
  className?: string;
}

type Bucket = { key: string; label: string; status: DayStatus };
type TooltipState = { index: number; x: number; y: number } | null;

const MAX_BARS = 90;

function buildBuckets(checks: UptimeBarsProps['checks'], interval: BarInterval): Bucket[] {
  const now = new Date();
  const raw: Bucket[] = [];

  if (interval === 'minute') {
    // 120 buckets = last 2 hours, 1 per minute
    const total = 120;
    for (let i = total - 1; i >= 0; i--) {
      const m = startOfMinute(subMinutes(now, i));
      // Use HH:mm:ss-style label so merged buckets don't look identical
      raw.push({ key: format(m, "yyyy-MM-dd'T'HH:mm"), label: format(m, 'HH:mm'), status: 'unknown' });
    }
    for (const c of checks) {
      const m = startOfMinute(new Date(c.checkedAt));
      const key = format(m, "yyyy-MM-dd'T'HH:mm");
      const b = raw.find(b => b.key === key);
      if (b) b.status = worstStatus(b.status, c.status as DayStatus);
    }
  } else if (interval === 'hourly') {
    const total = 7 * 24; // 168h
    for (let i = total - 1; i >= 0; i--) {
      const h = startOfHour(subHours(now, i));
      raw.push({ key: format(h, "yyyy-MM-dd'T'HH:00"), label: format(h, 'MMM d · HH:mm'), status: 'unknown' });
    }
    for (const c of checks) {
      const key = format(startOfHour(new Date(c.checkedAt)), "yyyy-MM-dd'T'HH:00");
      const b = raw.find(b => b.key === key);
      if (b) b.status = worstStatus(b.status, c.status as DayStatus);
    }
  } else if (interval === '6h') {
    const total = 14 * 4; // 56
    for (let i = total - 1; i >= 0; i--) {
      const t = subHours(now, i * 6);
      const bs = new Date(t);
      bs.setMinutes(0, 0, 0);
      bs.setHours(Math.floor(bs.getHours() / 6) * 6);
      const key = format(bs, "yyyy-MM-dd'T'HH:00");
      if (!raw.find(b => b.key === key))
        raw.push({ key, label: format(bs, 'MMM d · HH:mm'), status: 'unknown' });
    }
    for (const c of checks) {
      const t = new Date(c.checkedAt);
      const bs = new Date(t);
      bs.setMinutes(0, 0, 0);
      bs.setHours(Math.floor(t.getHours() / 6) * 6);
      const key = format(bs, "yyyy-MM-dd'T'HH:00");
      const b = raw.find(b => b.key === key);
      if (b) b.status = worstStatus(b.status, c.status as DayStatus);
    }
  } else {
    // daily: 90
    for (let i = 89; i >= 0; i--) {
      const d = subDays(now, i);
      const key = format(d, 'yyyy-MM-dd');
      raw.push({ key, label: format(d, 'MMM d, yyyy'), status: 'unknown' });
    }
    for (const c of checks) {
      const key = format(new Date(c.checkedAt), 'yyyy-MM-dd');
      const b = raw.find(b => b.key === key);
      if (b) b.status = worstStatus(b.status, c.status as DayStatus);
    }
  }

  // Thin to MAX_BARS by merging adjacent buckets (worst-case)
  if (raw.length <= MAX_BARS) return raw;
  const step = raw.length / MAX_BARS;
  return Array.from({ length: MAX_BARS }, (_, i) => {
    const start = Math.floor(i * step);
    const end   = Math.min(Math.floor((i + 1) * step), raw.length);
    const slice = raw.slice(start, end);
    const ms = slice.reduce((acc, s) => worstStatus(acc, s.status), 'unknown' as DayStatus);
    const first = slice[0].label;
    const last  = slice[slice.length - 1].label;
    const label = first === last ? first : `${first} – ${last}`;
    return { key: slice[0].key, label, status: ms };
  });
}

export const INTERVAL_META: Record<BarInterval, { label: string; left: string; right: string }> = {
  minute: { label: '1 min',  left: '2h ago',  right: 'Now'   },
  hourly: { label: '1 hour', left: '7d ago',  right: 'Now'   },
  '6h':   { label: '6 hours',left: '14d ago', right: 'Now'   },
  daily:  { label: '1 day',  left: '90d ago', right: 'Today' },
};

const BAR_H  = 44;
const TICK_H = 14;

export function UptimeBars({ checks, interval = 'hourly', className = '' }: UptimeBarsProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const buckets = useMemo(() => buildBuckets(checks, interval), [checks, interval]);

  const known  = buckets.filter(b => b.status !== 'unknown').length;
  const op     = buckets.filter(b => b.status === 'operational').length;
  const uptime = known > 0 ? ((op / known) * 100).toFixed(2) : null;

  const tooltipBucket = tooltip !== null ? buckets[tooltip.index] : null;
  const meta = INTERVAL_META[interval];

  return (
    <div className={`select-none ${className}`}>
      <div className="flex items-end gap-[3px]" style={{ height: BAR_H }}>
        {buckets.map(({ status }, i) => {
          const isUnknown = status === 'unknown';
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                height: isUnknown ? TICK_H : BAR_H,
                borderRadius: 4,
                backgroundColor: isUnknown ? '#e2e8f0' : (isHovered ? BAR_HOVER[status] : BAR_COLOR[status]),
                opacity: isUnknown ? 0.5 : 1,
                cursor: 'default',
                transition: 'background-color 80ms',
                alignSelf: 'flex-end',
              }}
              onMouseEnter={(e) => {
                setHoveredIndex(i);
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ index: i, x: rect.left + rect.width / 2, y: rect.top });
              }}
              onMouseLeave={() => { setHoveredIndex(null); setTooltip(null); }}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{meta.left}</span>
        <span className="text-[10px] font-bold text-slate-500">
          {uptime !== null ? `${uptime}% uptime` : 'Collecting data…'}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{meta.right}</span>
      </div>

      {mounted && tooltip !== null && tooltipBucket && createPortal(
        <div
          className="fixed z-9999 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 10, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl px-3.5 py-2.5 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_CLASS[tooltipBucket.status]}`} />
              <span className="text-xs font-bold text-white whitespace-nowrap">
                {STATUS_LABEL[tooltipBucket.status]}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 text-center whitespace-nowrap">
              {tooltipBucket.label.includes(' – ')
                ? tooltipBucket.label
                : interval === 'minute'
                  ? `${tooltipBucket.label}:00 – ${tooltipBucket.label}:59`
                  : tooltipBucket.label}
            </p>
          </div>
          <div className="flex justify-center -mt-[5px]">
            <div style={{ width: 10, height: 10, background: '#0f172a', border: '1px solid rgba(51,65,85,0.5)', borderLeft: 'none', borderTop: 'none', transform: 'rotate(45deg)' }} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
