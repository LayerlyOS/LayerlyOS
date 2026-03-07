'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  Crown,
  DollarSign,
  FileText,
  Layers,
  PieChart,
  Printer,
  TrendingUp,
  X,
} from 'lucide-react';
import { CustomSlider } from '@/components/ui/CustomSlider';
import { formatCurrency } from '@/lib/format';
import type { CalculationMetrics } from '../types';

const formatUsd = (val: number) => formatCurrency(val, 'USD');

/** Margin in percent: max 1 decimal place, reasonable range. */
function formatMarginPercent(value: number): string {
  const clamped = Math.min(200, Math.max(0, value));
  const rounded = Math.round(clamped * 10) / 10;
  return String(rounded);
}

/** Generates PDF/print via hidden iframe (no popup – works with popup blocker). */
function printOfferViaIframe(params: {
  projectName: string;
  isBatch: boolean;
  batchSize: number;
  filamentsSummary: string;
  vatRate: number;
  totalPrintHours: number;
  totalMaterialCost: number;
  totalMachineCost: number;
  totalLaborCost: number;
  totalHardwareCost: number;
  totalPackagingCost: number;
  totalCostNetto: number;
  costPerUnit: number;
  customMargin: string;
  customProfit: number;
  customNet: number;
  customGross: number;
  formatUsd: (n: number) => string;
}) {
  const {
    projectName,
    isBatch,
    batchSize,
    filamentsSummary,
    vatRate,
    totalPrintHours,
    totalMaterialCost,
    totalMachineCost,
    totalLaborCost,
    totalHardwareCost,
    totalPackagingCost,
    totalCostNetto,
    costPerUnit,
    customMargin,
    customProfit,
    customNet,
    customGross,
    formatUsd,
  } = params;
  const qty = isBatch ? batchSize : 1;
  const validTo = new Date(Date.now() + 12096e5).toLocaleDateString('en-GB');
  const date = new Date().toLocaleDateString('en-GB');
  const nr = 'QT-' + Math.floor(Math.random() * 10000);
  const hwRow =
    totalHardwareCost > 0
      ? `<tr><td><div class="pos-name">Hardware</div><div class="pos-desc">Total per batch/unit</div></td><td class="td-right">${qty} pcs</td><td class="td-right pos-value">${formatUsd(totalHardwareCost)}</td></tr>`
      : '';
  const pkgRow =
    totalPackagingCost > 0
      ? `<tr><td><div class="pos-name">Packaging</div><div class="pos-desc">Total per batch/unit</div></td><td class="td-right">1 order</td><td class="td-right pos-value">${formatUsd(totalPackagingCost)}</td></tr>`
      : '';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Price quote - Layerly</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 0; margin: 0; color: #1e293b; font-size: 14px; line-height: 1.5; }
    .page { max-width: 210mm; margin: 0 auto; padding: 24px 32px 32px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
    .brand { flex-shrink: 0; }
    .brand-title { font-size: 28px; font-weight: 700; color: #4f46e5; margin: 0 0 4px 0; letter-spacing: -0.02em; }
    .brand-tagline { font-size: 13px; color: #94a3b8; margin: 0; }
    .offer-meta { text-align: right; flex-shrink: 0; }
    .offer-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
    .offer-subtitle { font-size: 12px; color: #64748b; margin: 0 0 12px 0; }
    .meta-line { font-size: 13px; margin: 2px 0; }
    .meta-label { color: #94a3b8; text-transform: uppercase; font-size: 10px; margin-right: 6px; }
    .meta-value { color: #475569; }
    .project-box { display: flex; justify-content: space-between; background: #f8fafc; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; }
    .project-block label { display: block; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
    .project-block .val { font-weight: 600; font-size: 18px; color: #1e293b; }
    .project-block .val-sm { font-weight: 500; font-size: 14px; }
    .section-title { font-size: 12px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 2px solid #e0e7ff; display: inline-block; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
    thead th { text-align: left; padding: 10px 8px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    thead th.td-right { text-align: right; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody td { padding: 12px 8px; vertical-align: top; }
    .pos-name { font-weight: 500; color: #1e293b; font-size: 14px; }
    .pos-desc { font-size: 12px; color: #64748b; margin-top: 2px; }
    .td-right { text-align: right; }
    .pos-value { font-weight: 600; color: #1e293b; }
    .sum-wrap { display: flex; justify-content: flex-end; margin-top: 8px; }
    .sum-box { width: 50%; background: #f8fafc; padding: 20px 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .sum-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .sum-row span:last-child { font-weight: 600; color: #1e293b; }
    .sum-row.muted span { color: #64748b; font-weight: 400; }
    .sum-divider { border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px; }
    .sum-total { font-size: 16px; font-weight: 700; color: #312e81; margin-top: 10px; }
    .sum-vat { font-size: 14px; color: #64748b; margin-bottom: 12px; }
    .sum-final { background: #3730a3; color: #fff; padding: 16px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; font-weight: 600; box-shadow: 0 4px 14px rgba(55,48,163,0.35); margin-bottom: 0; }
    .sum-final span:first-child { font-size: 18px; font-weight: 600; }
    .sum-final span:last-child { font-size: 22px; font-weight: 700; }
    .sum-perunit { font-size: 13px; color: #475569; margin-top: 0; padding-top: 12px; margin-bottom: 0; font-weight: 500; border-top: 1px solid #e2e8f0; }
    .sum-perunit span:last-child { color: #1e293b; font-weight: 600; }
    .sum-box.has-perunit { padding-bottom: 4px; }
    .foot { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; }
  </style></head><body>
  <div class="page">
    <div class="head">
      <div class="brand">
        <h1 class="brand-title">Layerly.</h1>
        <p class="brand-tagline">Professional 3D Printing Service</p>
      </div>
      <div class="offer-meta">
        <h2 class="offer-title">PRICE QUOTE</h2>
        <p class="offer-subtitle">Quote — ${escapeHtml(projectName)}</p>
        <p class="meta-line"><span class="meta-label">Date</span><span class="meta-value">${date}</span></p>
        <p class="meta-line"><span class="meta-label">Valid until</span><span class="meta-value">${validTo}</span></p>
        <p class="meta-line"><span class="meta-label">No.</span><span class="meta-value">${nr}</span></p>
      </div>
    </div>
    <div class="project-box">
      <div class="project-block">
        <label>Project name</label>
        <div class="val">${escapeHtml(projectName)}</div>
      </div>
      <div class="project-block" style="text-align:right">
        <label>Delivery type</label>
        <div class="val-sm">${isBatch ? `Batch production (${batchSize} pcs)` : 'Prototyping (1 pc)'}</div>
      </div>
    </div>
    <span class="section-title">Calculation details</span>
    <table>
      <thead><tr><th>Item</th><th class="td-right">Qty</th><th class="td-right">Amount</th></tr></thead>
      <tbody>
        <tr><td><div class="pos-name">Material (Filament + Waste)</div>${filamentsSummary ? `<div class="pos-desc">${escapeHtml(filamentsSummary)}</div>` : ''}</td><td class="td-right">${qty} pcs</td><td class="td-right pos-value">${formatUsd(totalMaterialCost)}</td></tr>
        <tr><td><div class="pos-name">3D printing service</div><div class="pos-desc">Machine time: ${totalPrintHours.toFixed(1)} h</div></td><td class="td-right">${qty} pcs</td><td class="td-right pos-value">${formatUsd(totalMachineCost)}</td></tr>
        <tr><td><div class="pos-name">Post-processing & labour</div></td><td class="td-right">1 svc</td><td class="td-right pos-value">${formatUsd(totalLaborCost)}</td></tr>
        ${hwRow}
        ${pkgRow}
      </tbody>
    </table>
    <div class="sum-wrap">
      <div class="sum-box${qty > 1 ? ' has-perunit' : ''}">
        <div class="sum-row muted"><span>Production cost (net)</span><span>${formatUsd(totalCostNetto)}</span></div>
        <div class="sum-row muted"><span>Cost per unit</span><span>${formatUsd(costPerUnit)}</span></div>
        <div class="sum-row sum-divider muted"><span>Profit / Margin (${customMargin}%)</span><span>${formatUsd(customProfit)}</span></div>
        <div class="sum-row sum-total"><span>TOTAL NET</span><span>${formatUsd(customNet)}</span></div>
        <div class="sum-row sum-vat"><span>VAT (${vatRate}%)</span><span>${formatUsd(customGross - customNet)}</span></div>
        <div class="sum-final"><span>AMOUNT DUE</span><span>${formatUsd(customGross)}</span></div>
        ${qty > 1 ? `<div class="sum-row sum-perunit"><span>Gross price per unit</span><span>${formatUsd(customGross / qty)}</span></div>` : ''}
      </div>
    </div>
    <p class="foot">Layerly Cloud Services · ${escapeHtml(projectName)}</p>
  </div>
  </body></html>`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('style', 'position:absolute;width:0;height:0;border:0;visibility:hidden');
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } finally {
      document.body.removeChild(iframe);
    }
  }, 200);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


interface CalculatorSectionResultsProps {
  metrics: CalculationMetrics;
  customMargin: number;
  onCustomMarginChange: (value: number) => void;
  customPricePerUnit: number | null;
  onCustomPricePerUnitChange: (value: number | null) => void;
  projectName: string;
  isBatch: boolean;
  batchSize: number;
  vatRate: number;
  filamentsSummary: string;
}

export function CalculatorSectionResults({
  metrics,
  customMargin,
  onCustomMarginChange,
  customPricePerUnit,
  onCustomPricePerUnitChange,
  projectName,
  isBatch,
  batchSize,
  vatRate,
  filamentsSummary,
}: CalculatorSectionResultsProps) {
  const [showPdf, setShowPdf] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const customProfit = metrics.prices.custom.net - metrics.totalCostNetto;

  const chartData = [
    { label: 'Material', value: metrics.totalMaterialCost, color: '#6366f1' },
    { label: 'Machine', value: metrics.totalMachineCost, color: '#3b82f6' },
    { label: 'Labour', value: metrics.totalLaborCost, color: '#f59e0b' },
    {
      label: 'Other',
      value: metrics.totalHardwareCost + metrics.totalPackagingCost,
      color: '#94a3b8',
    },
  ];
  const totalChartValue = chartData.reduce((acc, item) => acc + item.value, 0);

  const priceTiers = [
    {
      key: 'competitive' as const,
      label: 'Competitive',
      margin: 20,
      bg: 'bg-green-50',
      border: 'border-green-100',
      text: 'text-green-800',
      iconBg: 'bg-green-200',
      iconColor: 'text-green-700',
      icon: DollarSign,
      recommended: false,
    },
    {
      key: 'standard' as const,
      label: 'Standard',
      margin: 40,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-800',
      iconBg: 'bg-blue-200',
      iconColor: 'text-blue-700',
      icon: Layers,
      recommended: true,
    },
    {
      key: 'premium' as const,
      label: 'Premium',
      margin: 60,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-800',
      iconBg: 'bg-amber-200',
      iconColor: 'text-amber-700',
      icon: TrendingUp,
      recommended: false,
    },
    {
      key: 'luxury' as const,
      label: 'Luxury',
      margin: 80,
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      text: 'text-purple-800',
      iconBg: 'bg-purple-200',
      iconColor: 'text-purple-700',
      icon: Crown,
      recommended: false,
    },
  ];

  return (
    <section className="space-y-6">
      {/* Calculated metrics */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Machine</p>
        <h3 className="font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          Calculated metrics
        </h3>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-medium">Total investment</span>
            <span className="font-bold text-slate-800">
              {formatUsd(metrics.machineDetails.totalInvestment)}
            </span>
          </div>
          <div className="flex justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-medium">Estimated working time</span>
            <span className="font-bold text-slate-800">
              {Math.round(metrics.machineDetails.workingHoursPerYear)} h/year
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Depreciation</p>
              <p className="font-bold text-slate-800">
                {formatUsd(metrics.machineDetails.amortizationPerHour)}/h
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Energy</p>
              <p className="font-bold text-slate-800">
                {formatUsd(metrics.machineDetails.energyPerHour)}/h
              </p>
            </div>
            <div className="col-span-2 bg-indigo-50 p-3 rounded-xl border border-indigo-200 flex justify-between items-center">
              <p className="text-indigo-600 font-bold">Total machine cost</p>
              <p className="font-bold text-indigo-800">
                {formatUsd(metrics.machineDetails.machineHourlyCost)}/h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested prices */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pricing</p>
            <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Suggested prices
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowPdf(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Preview quote
          </button>
        </div>
        <div className="space-y-4">
          {priceTiers.map((tier) => {
            const price = metrics.prices[tier.key]?.gross ?? 0;
            const Icon = tier.icon;
            return (
              <div
                key={tier.key}
                className={`flex justify-between items-center p-4 rounded-2xl border ${tier.bg} ${tier.border} ${tier.text} ${tier.recommended ? 'relative overflow-hidden ring-2 ring-blue-200 shadow-sm' : ''}`}
              >
                {tier.recommended && (
                  <span className="absolute -top-px right-0 bg-blue-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                    RECOMMENDED
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${tier.iconBg} ${tier.iconColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wide ${tier.text}`}>
                      {tier.label}
                    </p>
                    <p className={`text-[10px] font-medium opacity-70 ${tier.text}`}>
                      {tier.margin}% margin
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">{formatUsd(price)}</p>
                  <p className="text-[10px] text-slate-400">gross</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-6 border-t border-slate-200">
          <CustomSlider
            label="Custom"
            value={Math.min(300, Math.max(0, customMargin))}
            onChange={(v) => onCustomMarginChange(Math.max(0, Math.min(300, v)))}
            min={0}
            max={300}
            step={5}
            valueSuffix="%"
            className="mb-4"
          />
          <div className="flex justify-between items-end mt-2">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Net price</p>
              <p className="text-sm font-bold text-slate-800">
                {formatUsd(metrics.prices.custom.net)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Gross price</p>
              <p className="text-2xl font-black text-indigo-600">
                {formatUsd(metrics.prices.custom.gross)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Custom gross price per unit (optional)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={0}
                step={0.01}
                value={customPricePerUnit ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') onCustomPricePerUnitChange(null);
                  else {
                    const n = Number(v);
                    if (Number.isFinite(n) && n >= 0) onCustomPricePerUnitChange(n);
                  }
                }}
                placeholder="e.g. 4.50"
                className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
              {customPricePerUnit != null && customPricePerUnit > 0 && (
                <button
                  type="button"
                  onClick={() => onCustomPricePerUnitChange(null)}
                  className="bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-all shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            {customPricePerUnit != null && customPricePerUnit > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Margin from price: {formatMarginPercent(metrics.prices.custom.margin)}%
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Breakdown</p>
        <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2 mb-6">
          <PieChart className="w-5 h-5 text-indigo-600" />
          Cost breakdown
        </h3>
        <div className="flex items-center justify-center mb-6 relative">
          <svg
            viewBox="0 0 100 100"
            className="w-48 h-48 shrink-0 transform -rotate-90"
          >
            {totalChartValue > 0 &&
              (() => {
                let acc = 0;
                return chartData.map((item) => {
                  const sliceAngle = (item.value / totalChartValue) * 360;
                  const x1 = 50 + 40 * Math.cos((Math.PI * acc) / 180);
                  const y1 = 50 + 40 * Math.sin((Math.PI * acc) / 180);
                  acc += sliceAngle;
                  const x2 = 50 + 40 * Math.cos((Math.PI * acc) / 180);
                  const y2 = 50 + 40 * Math.sin((Math.PI * acc) / 180);
                  const largeArc = sliceAngle > 180 ? 1 : 0;
                  const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                  return (
                    <path
                      key={item.label}
                      d={path}
                      fill={item.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                });
              })()}
            {totalChartValue > 0 && (
              <circle cx="50" cy="50" r="25" fill="white" />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1">
            <div className="w-20 min-w-0 flex flex-col items-center justify-center text-center">
              <span className="text-[8px] leading-tight text-slate-400 font-bold uppercase tracking-wide">
                Production cost
              </span>
              <span
                className="text-[11px] font-bold text-slate-800 mt-0.5 truncate w-full"
                title={formatUsd(metrics.totalCostNetto)}
              >
                {formatUsd(metrics.totalCostNetto)}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {chartData.map((item) => (
            <div
              key={item.label}
              className="flex justify-between items-center text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600">{item.label}</span>
              </div>
              <span className="font-bold text-slate-700">
                {formatUsd(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cost details */}
      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-4 bg-slate-50 flex justify-between items-center text-slate-700 font-bold hover:bg-slate-100 transition rounded-t-2xl border-b border-slate-200"
        >
          <span className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-indigo-600" />
            Cost details
          </span>
          {showDetails ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        {showDetails && (
          <div className="p-5 border-t border-slate-200 text-sm">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-700">
                <span className="font-medium">Material</span>
                <span className="text-right">
                  {formatUsd(metrics.totalMaterialCost)} (batch) · {formatUsd(metrics.qty > 0 ? metrics.totalMaterialCost / metrics.qty : 0)}/pc
                </span>
                <span className="font-medium">Machine</span>
                <span className="text-right">
                  {formatUsd(metrics.totalMachineCost)} (batch) · {formatUsd(metrics.qty > 0 ? metrics.totalMachineCost / metrics.qty : 0)}/pc
                </span>
                <span className="font-medium">Labour</span>
                <span className="text-right">
                  {formatUsd(metrics.totalLaborCost)} (batch) · {formatUsd(metrics.qty > 0 ? metrics.totalLaborCost / metrics.qty : 0)}/pc
                </span>
              </div>
              {metrics.lineItemsBreakdown.filter((b) => b.type === 'hardware').length > 0 && (
                <div>
                  <p className="font-medium text-slate-700 mb-2">Hardware (HW)</p>
                  <ul className="space-y-1 text-slate-600">
                    {metrics.lineItemsBreakdown
                      .filter((b) => b.type === 'hardware')
                      .map((b) => (
                        <li key={b.id} className="flex justify-between">
                          <span>{b.name || '—'} · {b.qty} pcs ({b.perUnit ? 'per unit' : 'per batch'})</span>
                          <span className="font-medium text-slate-800">{formatUsd(b.value)}</span>
                        </li>
                      ))}
                    <li className="flex justify-between border-t border-slate-100 pt-1 mt-1 font-medium text-slate-800">
                      <span>HW total</span>
                      <span>{formatUsd(metrics.totalHardwareCost)}</span>
                    </li>
                  </ul>
                </div>
              )}
              {metrics.lineItemsBreakdown.filter((b) => b.type === 'packaging').length > 0 && (
                <div>
                  <p className="font-medium text-slate-700 mb-2">Packaging (PKG)</p>
                  <ul className="space-y-1 text-slate-600">
                    {metrics.lineItemsBreakdown
                      .filter((b) => b.type === 'packaging')
                      .map((b) => (
                        <li key={b.id} className="flex justify-between">
                          <span>{b.name || '—'} · {b.qty} pcs ({b.perUnit ? 'per unit' : 'per batch'})</span>
                          <span className="font-medium text-slate-800">{formatUsd(b.value)}</span>
                        </li>
                      ))}
                    <li className="flex justify-between border-t border-slate-100 pt-1 mt-1 font-medium text-slate-800">
                      <span>PKG total</span>
                      <span>{formatUsd(metrics.totalPackagingCost)}</span>
                    </li>
                  </ul>
                </div>
              )}
              <div className="border-t border-slate-200 pt-4 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Amounts summary</p>
                <div className="flex justify-between text-slate-700">
                  <span>Production cost (batch)</span>
                  <span className="font-medium">{formatUsd(metrics.totalCostNetto)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span className="pl-1">→ per unit</span>
                  <span>{formatUsd(metrics.costPerUnit)}</span>
                </div>
                <div className="flex justify-between font-medium text-green-700 pt-2 border-t border-slate-100 mt-2">
                  <span>Profit (batch)</span>
                  <span>{formatUsd(metrics.prices.custom.net - metrics.totalCostNetto)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span className="pl-1">→ profit per unit</span>
                  <span>{formatUsd(metrics.qty > 0 ? (metrics.prices.custom.net - metrics.totalCostNetto) / metrics.qty : 0)}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-800 pt-2 border-t border-slate-100">
                  <span>Net selling price (batch)</span>
                  <span>{formatUsd(metrics.prices.custom.net)}</span>
                </div>
                <div className="flex justify-between font-medium text-indigo-700">
                  <span>Gross amount due (batch)</span>
                  <span>{formatUsd(metrics.prices.custom.gross)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span className="pl-1">→ gross per unit (incl. VAT)</span>
                  <span>{formatUsd(metrics.qty > 0 ? metrics.prices.custom.gross / metrics.qty : 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPdf &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <style
              dangerouslySetInnerHTML={{
                __html: `@media print{body *{visibility:hidden}#invoice-preview,#invoice-preview *{visibility:visible!important}#invoice-preview{position:absolute!important;left:0!important;top:0!important;width:100%!important;margin:0!important;padding:0!important;background:#fff!important;box-shadow:none!important}.no-print{display:none!important}}`,
              }}
            />
            <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 no-print" aria-modal="true" role="dialog">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowPdf(false)}
              aria-hidden
            />
            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal header – UI Kit */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    Quote preview
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">
                    Review the offer below. Use Print to save as PDF.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      printOfferViaIframe({
                        projectName,
                        isBatch,
                        batchSize,
                        filamentsSummary,
                        vatRate,
                        totalPrintHours: metrics.totalPrintHours,
                        totalMaterialCost: metrics.totalMaterialCost,
                        totalMachineCost: metrics.totalMachineCost,
                        totalLaborCost: metrics.totalLaborCost,
                        totalHardwareCost: metrics.totalHardwareCost,
                        totalPackagingCost: metrics.totalPackagingCost,
                        totalCostNetto: metrics.totalCostNetto,
                        costPerUnit: metrics.costPerUnit,
                        customMargin: formatMarginPercent(customMargin),
                        customProfit,
                        customNet: metrics.prices.custom.net,
                        customGross: metrics.prices.custom.gross,
                        formatUsd,
                      });
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    Print / Save PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPdf(false)}
                    className="bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                    Close
                  </button>
                </div>
              </div>
              {/* Scrollable document area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-8 bg-slate-50 flex justify-center">
                <div
                  id="invoice-preview"
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0"
                  style={{ width: '210mm', minHeight: '297mm', padding: '32px 40px 40px' }}
                >
                  {/* Brand & meta */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                    <div>
                      <h1 className="text-3xl font-black text-indigo-600 tracking-tight mb-1">Layerly.</h1>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Professional 3D Printing Service</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Price quote</p>
                      <div className="text-sm font-medium text-slate-700 space-y-0.5">
                        <p><span className="text-slate-400 text-xs font-bold uppercase mr-2">Date</span> {new Date().toLocaleDateString('en-GB')}</p>
                        <p><span className="text-slate-400 text-xs font-bold uppercase mr-2">Valid until</span> {new Date(Date.now() + 12096e5).toLocaleDateString('en-GB')}</p>
                        <p><span className="text-slate-400 text-xs font-bold uppercase mr-2">No.</span> QT-{Math.floor(Math.random() * 10000)}</p>
                      </div>
                    </div>
                  </div>
                  {/* Project summary card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Project name</p>
                        <p className="font-black text-slate-900 text-lg tracking-tight">{projectName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Delivery type</p>
                        <p className="font-bold text-slate-800">
                          {isBatch ? `Batch production (${batchSize} pcs)` : 'Prototyping (1 pc)'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Calculation details table */}
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Calculation details</p>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Item</th>
                        <th className="text-center py-3 text-xs font-bold text-slate-500 uppercase tracking-widest w-24">Qty</th>
                        <th className="text-right py-3 text-xs font-bold text-slate-500 uppercase tracking-widest w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-3">
                          <span className="font-bold text-slate-800">Material (Filament + Waste)</span>
                          {filamentsSummary && <p className="text-xs font-medium text-slate-500 mt-0.5">{filamentsSummary}</p>}
                        </td>
                        <td className="text-center py-3 font-medium text-slate-700">{metrics.qty} pcs</td>
                        <td className="text-right py-3 font-bold text-slate-800">{formatUsd(metrics.totalMaterialCost)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-3">
                          <span className="font-bold text-slate-800">3D printing service</span>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">Machine time: {metrics.totalPrintHours.toFixed(1)} h</p>
                        </td>
                        <td className="text-center py-3 font-medium text-slate-700">{metrics.qty} pcs</td>
                        <td className="text-right py-3 font-bold text-slate-800">{formatUsd(metrics.totalMachineCost)}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-3">
                          <span className="font-bold text-slate-800">Post-processing & labour</span>
                        </td>
                        <td className="text-center py-3 font-medium text-slate-700">1 svc</td>
                        <td className="text-right py-3 font-bold text-slate-800">{formatUsd(metrics.totalLaborCost)}</td>
                      </tr>
                      {metrics.totalHardwareCost > 0 && (
                        <tr className="border-b border-slate-200">
                          <td className="py-3">
                            <span className="font-bold text-slate-800">Hardware</span>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">Total per batch/unit</p>
                          </td>
                          <td className="text-center py-3 font-medium text-slate-700">{metrics.qty} pcs</td>
                          <td className="text-right py-3 font-bold text-slate-800">{formatUsd(metrics.totalHardwareCost)}</td>
                        </tr>
                      )}
                      {metrics.totalPackagingCost > 0 && (
                        <tr className="border-b border-slate-200">
                          <td className="py-3">
                            <span className="font-bold text-slate-800">Packaging</span>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">Total per batch/unit</p>
                          </td>
                          <td className="text-center py-3 font-medium text-slate-700">1 order</td>
                          <td className="text-right py-3 font-bold text-slate-800">{formatUsd(metrics.totalPackagingCost)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {/* Summary box – UI Kit card */}
                  <div className="flex justify-end mt-6">
                    <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                      <div className="flex justify-between mb-2 text-sm">
                        <span className="text-slate-500 font-medium">Production cost (net)</span>
                        <span className="font-bold text-slate-800">{formatUsd(metrics.totalCostNetto)}</span>
                      </div>
                      {metrics.qty > 1 && (
                        <div className="flex justify-between mb-2 text-sm text-slate-500">
                          <span>Net cost per unit</span>
                          <span className="font-medium text-slate-700">{formatUsd(metrics.costPerUnit)}</span>
                        </div>
                      )}
                      <div className="flex justify-between mb-2 text-sm border-b border-slate-200 pb-3">
                        <span className="text-slate-500 font-medium">Margin ({formatMarginPercent(customMargin)}%)</span>
                        <span className="font-bold text-slate-800">{formatUsd(customProfit)}</span>
                      </div>
                      <div className="flex justify-between mt-3 mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total net</span>
                        <span className="font-black text-indigo-600 text-lg">{formatUsd(metrics.prices.custom.net)}</span>
                      </div>
                      <div className="flex justify-between mb-4 text-sm text-slate-500">
                        <span>VAT ({vatRate}%)</span>
                        <span className="font-medium text-slate-700">{formatUsd(metrics.prices.custom.gross - metrics.prices.custom.net)}</span>
                      </div>
                      <div className="bg-indigo-600 text-white rounded-xl p-4 flex justify-between items-center shadow-lg shadow-indigo-200">
                        <span className="font-black text-sm uppercase tracking-tight">Amount due</span>
                        <span className="text-xl font-black tracking-tight">{formatUsd(metrics.prices.custom.gross)}</span>
                      </div>
                      {metrics.qty > 1 && (
                        <div className="flex justify-between mt-3 pt-3 text-sm font-medium text-slate-700 border-t border-slate-200">
                          <span>Gross price per unit</span>
                          <span className="font-bold text-slate-900">{formatUsd(metrics.prices.custom.gross / metrics.qty)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Layerly Cloud Services · {projectName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </section>
  );
}
