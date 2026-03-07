'use client';

import { Users, Printer, DollarSign, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/format';

interface AdminStatsProps {
  stats: {
    usersCount: number;
    printsCount: number;
    filamentsCount: number;
    revenueByCurrency: Record<string, number>;
    totalWeightInStock: number;
  };
}

export function AdminStats({ stats }: AdminStatsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {/* Users Card */}
      <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform rotate-12">
          <Users size={120} className="text-blue-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shadow-sm shadow-blue-100">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Users</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900">{stats.usersCount}</h3>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Aktywni</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
      </motion.div>

      {/* Prints Card */}
      <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform rotate-12">
          <Printer size={120} className="text-indigo-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm shadow-indigo-100">
              <Printer size={20} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Prints</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900">{stats.printsCount}</h3>
            <span className="text-xs font-medium text-slate-400">Utworzone</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-indigo-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
      </motion.div>

      {/* Revenue Card - FIXED LAYOUT */}
      <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform rotate-12">
          <DollarSign size={120} className="text-emerald-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm shadow-emerald-100">
              <DollarSign size={20} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Revenue</span>
          </div>
          <div className="flex flex-col gap-3">
             {Object.keys(stats.revenueByCurrency).length > 0 ? (
                Object.entries(stats.revenueByCurrency).map(([curr, val]) => (
                  <div key={curr} className="flex items-center justify-between group/row">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${curr === 'USD' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{curr}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover/row:text-emerald-700 transition-colors">
                      {formatCurrency(val, curr)}
                    </h3>
                  </div>
                ))
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formatCurrency(0, 'USD')}
                </h3>
              )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
      </motion.div>

      {/* Warehouse Card */}
      <motion.div variants={item} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform rotate-12">
          <Package size={120} className="text-amber-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shadow-sm shadow-amber-100">
              <Package size={20} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Warehouse</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900">{stats.filamentsCount}</h3>
            <span className="text-sm text-slate-500 font-medium">spools</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Total: <span className="text-slate-700">{(stats.totalWeightInStock / 1000).toFixed(1)} kg</span>
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
      </motion.div>
    </motion.div>
  );
}
