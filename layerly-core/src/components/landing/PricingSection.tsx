'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Crown, Minus, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function PricingSection() {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <section className="py-24 bg-white relative overflow-hidden" id="pricing">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-slate-50 to-transparent opacity-50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-600">Start for free, upgrade as you grow.</p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16 items-start">
          {/* Plan: Starter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                Free Starter
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Perfect for starting your 3D printing journey
              </p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  0
                </span>
                <span className="text-xl font-bold text-slate-900">
                  $
                </span>
                <span className="text-slate-500">/month</span>
              </div>
            </div>

            <Link href="/login?mode=register" className="block mb-8">
              <Button variant="outline" fullWidth className="py-6">
                Create free account
              </Button>
            </Link>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 text-sm">
                  Basic cost calculator
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 text-sm">
                  Warehouse up to 5 spools
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 text-sm">
                  History of last 10 orders
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <Minus className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-sm">PDF report export</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <Minus className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-sm">Client management</span>
              </li>
            </ul>
          </div>

          {/* Plan: Pro Maker (Featured) */}
          <div className="bg-white rounded-2xl border-2 border-blue-600 p-8 shadow-xl relative scale-105 z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
              <Zap className="w-4 h-4" fill="currentColor" />
              Recommended
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Pro Maker</h3>
              <p className="text-sm text-slate-500 mt-2">For freelancers and small businesses</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  9
                </span>
                <span className="text-xl font-bold text-slate-900">
                  $
                </span>
                <span className="text-slate-500">/month</span>
              </div>
            </div>

            <Link href="/login?mode=register" className="block mb-8">
              <Button
                variant="primary"
                fullWidth
                className="py-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
              >
                Choose Pro
              </Button>
            </Link>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm font-medium">
                  Everything from Free plan
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">
                  Unlimited filament warehouse
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">
                  Full order history
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">
                  PDF export and client quotes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">
                  Priority support
                </span>
              </li>
            </ul>
          </div>

          {/* Plan: Print Farm */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Print Farm</h3>
              <p className="text-sm text-slate-500 mt-2">For large scale operations</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  49
                </span>
                <span className="text-xl font-bold text-slate-900">
                  $
                </span>
                <span className="text-slate-500">/month</span>
              </div>
            </div>

            <Link href="/contact" className="block mb-8">
              <Button variant="outline" fullWidth className="py-6">
                Contact Sales
              </Button>
            </Link>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 text-sm">
                  Everything in Pro
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 text-sm">
                  Advanced Analytics
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 text-sm">
                  API Access
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 text-sm">
                  Multi-user access
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 text-sm">
                  Dedicated Support
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Comparison Toggle Button */}
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            <span>
              {showComparison
                ? 'Hide comparison'
                : 'Compare plans'}
            </span>
            <motion.div
              animate={{ rotate: showComparison ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </button>
        </div>

        {/* Comparison Table */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="max-w-4xl mx-auto overflow-x-auto rounded-xl border border-slate-200 shadow-lg bg-white mb-16">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="py-4 px-6 font-semibold w-1/3">
                        Feature
                      </th>
                      <th className="py-4 px-4 text-center w-1/5">
                        Starter
                      </th>
                      <th className="py-4 px-4 text-center w-1/5 text-blue-700 bg-blue-50/50 border-b-2 border-blue-600">
                        Pro
                      </th>
                      <th className="py-4 px-4 text-center w-1/5">
                        Farm
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Main features */}
                    <tr className="bg-slate-50/50">
                      <td
                        colSpan={4}
                        className="py-3 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider"
                      >
                        Main Features
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-4 px-6 text-slate-700">
                        Cost Calculator
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600">
                        Basic
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-blue-600 bg-blue-50/10">
                        Advanced
                      </td>
                      <td className="py-4 px-4 text-center font-medium">
                        Advanced
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-4 px-6 text-slate-700">
                        PDF Export
                      </td>
                      <td className="py-4 px-4 text-center text-slate-300">
                        <Minus className="w-4 h-4 mx-auto" />
                      </td>
                      <td className="py-4 px-4 text-center text-blue-600 bg-blue-50/10">
                        <Check className="w-5 h-5 mx-auto" />
                      </td>
                      <td className="py-4 px-4 text-center text-green-600">
                        <Check className="w-5 h-5 mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
