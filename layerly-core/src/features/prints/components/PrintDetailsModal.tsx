'use client';

import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import type { PrintEntry, Printer, Settings } from '@/types';
import { formatMoney, formatNumber, getBreakdown } from '../utils';
import { 
  X, 
  Clock, 
  Weight, 
  Printer as PrinterIcon, 
  Package, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Layers,
  Target,
  CheckCircle2,
  BarChart3,
  Coins,
  Activity,
  FileText,
  DollarSign,
  Settings as SettingsIcon,
  AlertTriangle,
  User,
  Truck,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PrintDetailsModalProps {
  item: PrintEntry | null;
  onClose: () => void;
  settings: Settings;
  printers: Printer[];
  filaments: any[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  gradient: string;
  delay?: number;
  highlight?: boolean;
}

function StatCard({ icon, label, value, gradient, delay = 0, highlight = false }: StatCardProps) {
  // Get shadow color based on gradient
  const getShadowStyle = () => {
    if (gradient.includes('blue')) return { boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.15), 0 10px 10px -5px rgba(59, 130, 246, 0.1)' };
    if (gradient.includes('purple')) return { boxShadow: '0 20px 25px -5px rgba(168, 85, 247, 0.15), 0 10px 10px -5px rgba(168, 85, 247, 0.1)' };
    if (gradient.includes('orange')) return { boxShadow: '0 20px 25px -5px rgba(249, 115, 22, 0.15), 0 10px 10px -5px rgba(249, 115, 22, 0.1)' };
    if (gradient.includes('emerald')) return { boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.15), 0 10px 10px -5px rgba(16, 185, 129, 0.1)' };
    return {};
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.03,
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/40 bg-gradient-to-br from-white via-white to-slate-50/50 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-slate-300/60 ${
        highlight ? 'ring-2 ring-blue-500/20' : ''
      }`}
      style={getShadowStyle()}
    >
      {/* Animated gradient background */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        initial={false}
        animate={{ opacity: 0 }}
        whileHover={{ opacity: 0.1 }}
      />
      
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      {/* Decorative corner accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradient} opacity-5 rounded-bl-full`} />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform duration-300`}
              whileHover={{ rotate: 5, scale: 1.1 }}
            >
              {icon}
            </motion.div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-700 transition-colors">
              {label}
            </div>
          </div>
        </div>
        <motion.div 
          className={`text-2xl font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent transition-transform duration-300`}
          whileHover={{ scale: 1.05 }}
        >
          {value}
        </motion.div>
      </div>
    </motion.div>
  );
}


interface CostRowProps {
  label: string;
  value: string;
  isTotal?: boolean;
  isProfit?: boolean;
  delay?: number;
  icon?: React.ReactNode;
}

function CostRow({ label, value, isTotal = false, isProfit = false, delay = 0, icon }: CostRowProps) {
  const profitColor = isProfit 
    ? (value.includes('—') || parseFloat(value.replace(/[^\d.-]/g, '')) < 0 
        ? 'text-red-600' 
        : 'text-emerald-600')
    : 'text-slate-700';
  
  const isProfitPositive = isProfit && !value.includes('—') && parseFloat(value.replace(/[^\d.-]/g, '')) > 0;
  const profitIcon = isProfit 
    ? (isProfitPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />)
    : icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`flex items-center justify-between py-2.5 ${
        isTotal ? 'border-t-2 border-slate-200 pt-4 mt-2' : ''
      }`}
    >
      <span className={`flex items-center gap-2 text-sm ${isTotal ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
        {profitIcon && <span className="text-slate-400">{profitIcon}</span>}
        {label}
      </span>
      <span className={`font-mono text-sm font-semibold ${isTotal ? 'text-lg' : ''} ${profitColor}`}>
        {value}
      </span>
    </motion.div>
  );
}

function ROIIndicator({ current, target, delay = 0 }: { current: number; target: number; delay?: number }) {
  const percentage = Math.min((current / target) * 100, 100);
  const isAchieved = current >= target;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`relative overflow-hidden rounded-xl border-2 p-4 ${
        isAchieved
          ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-green-50'
          : 'border-blue-500/30 bg-gradient-to-br from-blue-50 to-indigo-50'
      }`}
    >
      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              isAchieved ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
            }`}
          >
            {isAchieved ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900">
              {isAchieved ? 'ROI Achieved!' : 'ROI Insight'}
            </div>
            <div className="text-xs text-slate-600">
              {isAchieved ? (
                <span>This batch covers the entire printer cost!</span>
              ) : (
                <span>
                  Sell <span className="font-bold text-blue-600">{target - current}</span> more units to break even
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Progress: {current} / {target}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: delay + 0.2, ease: 'easeOut' }}
            className={`h-full ${
              isAchieved
                ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function PrintDetailsModal({
  item,
  onClose,
  settings,
  printers,
  filaments,
}: PrintDetailsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (item) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [item]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!item || !mounted) return null;

  const details = getBreakdown(item, settings, printers, filaments);

  const fmtMoney = (val: number | null | undefined) => formatMoney(val);

  const getPrinterName = (id: number | string | null | undefined) => {
    if (!id) return '';
    const printer = printers.find((p) => String(p.id) === String(id));
    return printer ? printer.name : 'Unknown Printer';
  };

  const profitPercentage = details.pricePerItem > 0
    ? ((details.profitPerItem / details.pricePerItem) * 100)
    : 0;

  const isProfitPositive = details.profitPerItem > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-2 flex items-center gap-3"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                      <Layers className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-white truncate">{item.name}</h2>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-300">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(new Date(item.date))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          {details.qty} pcs
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Close details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </motion.div>
              </div>

              {/* Profit Banner */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`mt-4 flex items-center justify-between rounded-xl border-2 p-4 ${
                  isProfitPositive
                    ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-green-500/10'
                    : 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-orange-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      isProfitPositive ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  >
                    {isProfitPositive ? (
                      <TrendingUp className="h-6 w-6 text-white" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Profit {isProfitPositive ? 'per item' : 'negative'}
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        isProfitPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {fmtMoney(details.profitPerItem)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Profit Margin
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      isProfitPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {profitPercentage.toFixed(1)}%
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto custom-scroll max-h-[calc(90vh-200px)] p-8">
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={<Clock className="h-4 w-4" />}
                  label="Time per item"
                  value={`${item.timeH || 0}h ${item.timeM || 0}m`}
                  gradient="from-blue-500 to-cyan-500"
                  delay={0.1}
                />
                <StatCard
                  icon={<Clock className="h-4 w-4" />}
                  label="Total time"
                  value={`${formatNumber(details.totalHours, 2)} h`}
                  gradient="from-purple-500 to-pink-500"
                  delay={0.15}
                />
                <StatCard
                  icon={<Weight className="h-4 w-4" />}
                  label="Weight per item"
                  value={`${formatNumber(item.weight || 0, 2)} g`}
                  gradient="from-orange-500 to-amber-500"
                  delay={0.2}
                />
                <StatCard
                  icon={<Weight className="h-4 w-4" />}
                  label="Total weight"
                  value={`${formatNumber((item.weight || 0) * details.qty, 2)} g`}
                  gradient="from-emerald-500 to-teal-500"
                  delay={0.25}
                />
              </div>

              {/* Equipment & Material Section */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Equipment Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                      <PrinterIcon className="h-5 w-5 text-blue-700" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Equipment & Energy</h3>
                  </div>
                  <div className="space-y-2.5">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="group flex items-center justify-between rounded-xl border border-blue-200/30 bg-gradient-to-r from-white/80 to-blue-50/40 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-200/20"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-slate-700">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/60 text-blue-600 transition-colors group-hover:bg-blue-200/80">
                          <PrinterIcon className="h-3.5 w-3.5" />
                        </div>
                        Printer
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {item.printerId ? getPrinterName(item.printerId) : '—'}
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 }}
                      className="group flex items-center justify-between rounded-xl border border-blue-200/30 bg-gradient-to-r from-white/80 to-blue-50/40 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-200/20"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-slate-700">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/60 text-blue-600 transition-colors group-hover:bg-blue-200/80">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        Order
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {item.orderTitle || item.orderId || '—'}
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="group flex items-center justify-between rounded-xl border border-blue-200/30 bg-gradient-to-r from-white/80 to-blue-50/40 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-200/20"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-slate-700">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-100/60 text-yellow-600 transition-colors group-hover:bg-yellow-200/80">
                          <Zap className="h-3.5 w-3.5" />
                        </div>
                        Power consumption
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {formatNumber(details.powerW, 0)} W
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 }}
                      className="group flex items-center justify-between rounded-xl border border-blue-200/30 bg-gradient-to-r from-white/80 to-blue-50/40 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-200/20"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-slate-700">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/60 text-emerald-600 transition-colors group-hover:bg-emerald-200/80">
                          <DollarSign className="h-3.5 w-3.5" />
                        </div>
                        Energy rate
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {fmtMoney(details.energyRate)} / kWh
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="group flex items-center justify-between rounded-xl border border-blue-200/30 bg-gradient-to-r from-white/80 to-blue-50/40 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-blue-300/50 hover:shadow-md hover:shadow-blue-200/20"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-slate-700">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-100/60 text-yellow-600 transition-colors group-hover:bg-yellow-200/80">
                          <Zap className="h-3.5 w-3.5" />
                        </div>
                        Energy cost / h
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {fmtMoney(details.energyCostPerHour)}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Material Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                      <Layers className="h-5 w-5 text-amber-700" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Material</h3>
                  </div>
                  {details.filament ? (
                    <div className="space-y-2.5">
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="group rounded-xl border border-amber-200/30 bg-gradient-to-r from-white/80 to-amber-50/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-amber-300/50 hover:shadow-md hover:shadow-amber-200/20"
                      >
                        <div className="flex items-center gap-3">
                          {details.filament.colorHex && (
                            <div
                              className="h-10 w-10 rounded-xl border-2 border-amber-200/50 shadow-sm transition-transform group-hover:scale-110"
                              style={{ backgroundColor: details.filament.colorHex }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900">
                              {details.filament.brand} {details.filament.materialName}
                            </div>
                            <div className="text-xs text-slate-500">{details.filament.color}</div>
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 }}
                        className="group flex items-center justify-between rounded-xl border border-amber-200/30 bg-gradient-to-r from-white/80 to-amber-50/40 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-amber-300/50 hover:shadow-md hover:shadow-amber-200/20"
                      >
                        <span className="flex items-center gap-2.5 text-sm text-slate-700">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/60 text-emerald-600 transition-colors group-hover:bg-emerald-200/80">
                            <DollarSign className="h-3.5 w-3.5" />
                          </div>
                          Spool price
                        </span>
                        <span className="font-mono text-sm font-semibold text-slate-900">
                          {fmtMoney(details.filament.spoolPrice)}
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="group flex items-center justify-between rounded-xl border border-amber-200/30 bg-gradient-to-r from-white/80 to-amber-50/40 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-amber-300/50 hover:shadow-md hover:shadow-amber-200/20"
                      >
                        <span className="flex items-center gap-2.5 text-sm text-slate-700">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100/60 text-purple-600 transition-colors group-hover:bg-purple-200/80">
                            <Weight className="h-3.5 w-3.5" />
                          </div>
                          Spool weight
                        </span>
                        <span className="font-mono text-sm font-semibold text-slate-900">
                          {formatNumber(details.filament.spoolWeight, 0)} g
                        </span>
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-xl border border-amber-200/30 bg-gradient-to-r from-white/80 to-amber-50/40 p-4 text-center text-sm text-slate-500 backdrop-blur-sm"
                    >
                      No material information available
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Costs & Profits Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 p-6 shadow-sm"
              >
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                    <BarChart3 className="h-5 w-5 text-emerald-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Costs & Profits</h3>
                </div>

                {details.advancedStats ? (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Per Item */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Coins className="h-4 w-4 text-slate-500" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                          Per Item
                        </h4>
                      </div>
                      <div className="space-y-1">
                        <CostRow label="Material" value={fmtMoney(details.materialCostPerItem)} delay={0.5} icon={<Layers className="h-3.5 w-3.5" />} />
                        <CostRow label="Energy" value={fmtMoney(details.energyCostPerItem)} delay={0.55} icon={<Zap className="h-3.5 w-3.5" />} />
                        <CostRow label="Depreciation" value={fmtMoney(details.advancedStats.depreciation)} delay={0.6} icon={<SettingsIcon className="h-3.5 w-3.5" />} />
                        <CostRow label="Risk" value={fmtMoney(details.advancedStats.risk)} delay={0.65} icon={<AlertTriangle className="h-3.5 w-3.5" />} />
                        <CostRow label="Labor (Amort.)" value={fmtMoney(details.advancedStats.labor)} delay={0.7} icon={<User className="h-3.5 w-3.5" />} />
                        <CostRow label="Logistics (Amort.)" value={fmtMoney(details.advancedStats.logistics)} delay={0.75} icon={<Truck className="h-3.5 w-3.5" />} />
                        <CostRow label="Extra" value={fmtMoney(details.extraCostPerItem)} delay={0.8} icon={<Plus className="h-3.5 w-3.5" />} />
                        <CostRow
                          label="Total Cost"
                          value={fmtMoney(details.totalCostPerItem)}
                          isTotal
                          delay={0.85}
                          icon={<Coins className="h-3.5 w-3.5" />}
                        />
                        <CostRow label="Price" value={fmtMoney(details.pricePerItem)} delay={0.9} icon={<DollarSign className="h-3.5 w-3.5" />} />
                        <CostRow
                          label="Profit"
                          value={fmtMoney(details.profitPerItem)}
                          isProfit
                          delay={0.95}
                        />
                      </div>
                    </div>

                    {/* Total */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-slate-500" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                          Total (x{details.qty})
                        </h4>
                      </div>
                      <div className="space-y-1">
                        <CostRow label="Material" value={fmtMoney(details.materialCostTotal)} delay={1.0} icon={<Layers className="h-3.5 w-3.5" />} />
                        <CostRow label="Energy" value={fmtMoney(details.energyCostTotal)} delay={1.05} icon={<Zap className="h-3.5 w-3.5" />} />
                        <CostRow
                          label="Depreciation"
                          value={fmtMoney(details.advancedStats.depreciation * details.qty)}
                          delay={1.1}
                          icon={<SettingsIcon className="h-3.5 w-3.5" />}
                        />
                        <CostRow
                          label="Risk"
                          value={fmtMoney(details.advancedStats.risk * details.qty)}
                          delay={1.15}
                          icon={<AlertTriangle className="h-3.5 w-3.5" />}
                        />
                        <CostRow
                          label="Labor"
                          value={fmtMoney(details.advancedStats.labor * details.qty)}
                          delay={1.2}
                          icon={<User className="h-3.5 w-3.5" />}
                        />
                        <CostRow
                          label="Logistics"
                          value={fmtMoney(details.advancedStats.logistics * details.qty)}
                          delay={1.25}
                          icon={<Truck className="h-3.5 w-3.5" />}
                        />
                        <CostRow label="Extra" value={fmtMoney(details.extraCostTotal)} delay={1.3} icon={<Plus className="h-3.5 w-3.5" />} />
                        <CostRow
                          label="Total Cost"
                          value={fmtMoney(details.totalCostTotal)}
                          isTotal
                          delay={1.35}
                          icon={<Coins className="h-3.5 w-3.5" />}
                        />
                        <CostRow label="Total Price" value={fmtMoney(details.priceTotal)} delay={1.4} icon={<DollarSign className="h-3.5 w-3.5" />} />
                        <CostRow
                          label="Total Profit"
                          value={fmtMoney(details.profit)}
                          isProfit
                          delay={1.45}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Per Item */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Coins className="h-4 w-4 text-slate-500" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                          Per Item
                        </h4>
                      </div>
                      <div className="space-y-1">
                        <CostRow
                          label="Material Cost"
                          value={
                            details.materialCostPerItem === null
                              ? '—'
                              : fmtMoney(details.materialCostPerItem)
                          }
                          delay={0.5}
                          icon={<Layers className="h-3.5 w-3.5" />}
                        />
                        <CostRow label="Energy Cost" value={fmtMoney(details.energyCostPerItem)} delay={0.55} icon={<Zap className="h-3.5 w-3.5" />} />
                        <CostRow label="Extra Cost" value={fmtMoney(details.extraCostPerItem)} delay={0.6} icon={<Plus className="h-3.5 w-3.5" />} />
                        <CostRow
                          label="Depreciation"
                          value={details.amortCostPerItem === null ? '—' : fmtMoney(details.amortCostPerItem)}
                          delay={0.65}
                          icon={<SettingsIcon className="h-3.5 w-3.5" />}
                        />
                        <CostRow
                          label="Total Cost"
                          value={fmtMoney(details.totalCostPerItem)}
                          isTotal
                          delay={0.7}
                          icon={<Coins className="h-3.5 w-3.5" />}
                        />
                        <CostRow label="Price" value={fmtMoney(details.pricePerItem)} delay={0.75} icon={<DollarSign className="h-3.5 w-3.5" />} />
                        <CostRow
                          label="Profit"
                          value={fmtMoney(details.profitPerItem)}
                          isProfit
                          delay={0.8}
                        />
                      </div>
                    </div>

                    {/* Total */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-slate-500" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                          Total (x{details.qty})
                        </h4>
                      </div>
                      <div className="space-y-1">
                        <CostRow
                          label="Material Cost"
                          value={
                            details.materialCostTotal === null ? '—' : fmtMoney(details.materialCostTotal)
                          }
                          delay={0.85}
                          icon={<Layers className="h-3.5 w-3.5" />}
                        />
                        <CostRow label="Energy Cost" value={fmtMoney(details.energyCostTotal)} delay={0.9} icon={<Zap className="h-3.5 w-3.5" />} />
                        <CostRow label="Extra Cost" value={fmtMoney(details.extraCostTotal)} delay={0.95} icon={<Plus className="h-3.5 w-3.5" />} />
                        <CostRow
                          label="Depreciation Total"
                          value={details.amortCostTotal === null ? '—' : fmtMoney(details.amortCostTotal)}
                          delay={1.0}
                          icon={<SettingsIcon className="h-3.5 w-3.5" />}
                        />
                        <CostRow
                          label="Total Cost"
                          value={fmtMoney(details.totalCostTotal)}
                          isTotal
                          delay={1.05}
                          icon={<Coins className="h-3.5 w-3.5" />}
                        />
                        <CostRow label="Total Price" value={fmtMoney(details.priceTotal)} delay={1.1} icon={<DollarSign className="h-3.5 w-3.5" />} />
                        <CostRow
                          label="Total Profit"
                          value={fmtMoney(details.profit)}
                          isProfit
                          delay={1.15}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ROI Indicator */}
                {details.advancedStats && details.advancedStats.roi > 0 && details.advancedStats.roi !== Infinity && (
                  <div className="mt-6">
                    <ROIIndicator current={details.qty} target={details.advancedStats.roi} delay={1.5} />
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50/50 px-8 py-4">
            <div className="flex justify-end">
              <Button
                onClick={onClose}
                variant="primary"
                className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-semibold shadow-lg"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
