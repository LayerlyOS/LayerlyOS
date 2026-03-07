'use client';

import { useState } from 'react';
import {
  Type,
  MousePointerClick,
  TextCursorInput,
  Layers,
  ArrowRight,
  Settings,
  Plus,
  Mail,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  Zap,
  Package,
  Search,
  Bot,
  Copy,
  BellRing,
  ChevronDown,
  Loader2,
  RefreshCw,
  Printer,
  Box,
  User,
  Building2,
  SlidersHorizontal,
  Palette,
  Pencil,
  Trash2,
  Download,
  Eye,
  Star,
  Shield,
  Code2,
  Layout,
  Columns,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomSlider } from '@/components/ui/CustomSlider';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ToggleButton } from '@/components/ui/ToggleButton';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

// ─── Code Block Component ────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = code.trim();
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-amber-500/60" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          <span className="text-xs font-mono text-slate-500 ml-2">tsx</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          {copied ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed whitespace-pre">
        {code.trim()}
      </pre>
    </div>
  );
}

// ─── Component Showcase Wrapper ───────────────────────────────────────────────

function ComponentShowcase({
  title,
  description,
  preview,
  code,
  fullWidthPreview = false,
}: {
  title: string;
  description?: string;
  preview: React.ReactNode;
  code: string;
  fullWidthPreview?: boolean;
}) {
  const [view, setView] = useState<'preview' | 'code'>('preview');

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          {description && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setView('preview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              view === 'preview'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setView('code')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              view === 'code'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3 h-3" /> Code
          </button>
        </div>
      </div>
      {view === 'preview' ? (
        <div
          className={`p-8 bg-slate-50/30 ${fullWidthPreview ? '' : 'flex items-center justify-center min-h-[140px]'}`}
        >
          {preview}
        </div>
      ) : (
        <div className="p-4">
          <CodeBlock code={code} />
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-10 border-b border-slate-200 pb-6">
      <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{title}</h2>
      <p className="text-slate-500 font-medium text-lg">{description}</p>
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

const updatedCursorRules = `# Layerly Design System & UI Kit Rules

You are the Lead Frontend Developer for Layerly (B2B SaaS for 3D print farms).
Your task is to build React components with Tailwind CSS.
ALWAYS follow the design system below (UI Kit). Never invent custom color classes, shadows or padding.

## 1. LAYOUT & SPACING
- **App background:** Always \`bg-slate-50\`.
- **Top Navbar (Global):** Subtle. Search is "Command Palette" (\`bg-slate-100\`). Action buttons use "Outline" or "Ghost" variant.
- **Page Header:** MUST NOT be inside a white card. Title, icon and main buttons sit directly on \`bg-slate-50\`.
- **Data cards:** \`bg-white rounded-2xl border border-slate-200 shadow-sm\`.

## 2. TYPOGRAPHY & COLORS
- **H1/H2 headings:** Always \`font-black text-slate-900 tracking-tight\`.
- **Section labels (Eyebrows):** \`text-[10px] font-bold text-slate-400 uppercase tracking-widest\`.
- **Primary:** \`indigo-600\` (Hover: \`indigo-700\`).
- **Semantics:** \`emerald-600\` (Success), \`amber-500\` (Warning), \`red-600\` (Error).

## 3. BUTTONS — Button component
Import: \`import { Button } from '@/components/ui/Button';\`
Variants: \`primary | secondary | danger | outline | soft | ghost\`
Sizes: \`sm | md | lg\`
Props: \`variant\`, \`size\`, \`isLoading\`, \`loadingText\`, \`leftIcon\`, \`rightIcon\`, \`fullWidth\`

## 4. ICON BUTTONS — IconButton component
Import: \`import { IconButton } from '@/components/ui/IconButton';\`
Variants: \`default | outline | ghost | primary | danger | success | warning | info | indigo\`
Sizes: \`sm | md | lg\`
Props: \`icon\` (LucideIcon), \`variant\`, \`size\`, \`isLoading\`, \`tooltip\`

## 5. FORMS (INPUTS, TEXTAREA, SELECT)
- **Input:** \`import { Input } from '@/components/ui/Input';\`
  Props: \`label\`, \`helperText\`, \`error\`, \`leftIcon\`, \`rightIcon\`, \`size\` (sm|md|lg)
- **Textarea:** \`import { Textarea } from '@/components/ui/Textarea';\`
  Props: \`label\`, \`helperText\`, \`error\`, \`rows\`, \`size\`
- **Checkbox:** \`import { Checkbox } from '@/components/ui/Checkbox';\`
  Props: \`checked\`, \`onCheckedChange\`, \`label\`, \`disabled\`
- **ToggleButton:** \`import { ToggleButton } from '@/components/ui/ToggleButton';\`
  Props: \`checked\`, \`onChange\`, \`label\`, \`disabled\`, \`isLoading\`
- **CustomSelect:** \`import { CustomSelect } from '@/components/ui/CustomSelect';\`
  Props: \`label\`, \`options\` ({ value, label, icon? }), \`value\`, \`onChange\`, \`placeholder\`, \`icon\`, \`helperText\`, \`error\`, \`disabled\`
- **CustomSlider:** \`import { CustomSlider } from '@/components/ui/CustomSlider';\`
  Props: \`value\`, \`onChange\`, \`min\`, \`max\`, \`step\`, \`label\`, \`helperText\`, \`showValue\`, \`valueSuffix\`, \`disabled\`
- **SearchInput:** \`import { SearchInput } from '@/components/ui/SearchInput';\`
  Props: (extends Input) — adds search icon automatically

## 6. MODAL — Modal component
Import: \`import { Modal } from '@/components/ui/Modal';\`
Props: \`isOpen\`, \`onClose\`, \`title\`, \`icon\`, \`footer\`, \`size\` (sm|md|lg|xl|2xl|3xl|4xl|full), \`hideHeader\`, \`maxWidth\`

## 7. TABS
Import: \`import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';\`
Usage: Tabs (value + onValueChange) > TabsList > TabsTrigger (value) + TabsContent (value)

## 8. TOOLTIP
Import: \`import { Tooltip } from '@/components/ui/Tooltip';\`
Props: \`content\`, \`position\` (top|bottom|left|right)
Wraps any child element.

## 9. CALLOUTS & BADGES
- **Callouts:** \`bg-{color}-50 border border-{color}-200 rounded-2xl p-5 flex items-start gap-4\`
- **Pastel badges:** \`bg-{color}-100 text-{color}-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-{color}-200\`
- **Outline badges:** \`bg-white border-2 border-{color}-200 text-{color}-600 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md\`

## 10. LOADING STATES — NO SKELETONS
- **DO NOT** use skeletons (\`animate-pulse\` on empty divs).
- **Overlay:** \`absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10\`. Inside: \`Loader2\` with \`animate-spin text-indigo-600\`.
- **Full screen:** \`DataLoader\` or \`FullPageLoader\` from \`@/components/ui/DataLoader\`.
- **On button:** Use \`isLoading\` and \`loadingText\` on Button.

## 11. TOAST NOTIFICATIONS — Sonner
Import: \`import { toast } from 'sonner';\`
Usage: \`toast.success('Success')\`, \`toast.error('Error')\`, \`toast.info('Info')\`, \`toast.warning('Warning')\`
Do not use custom toasts — use Sonner only.
`;

function CursorRulesSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(updatedCursorRules.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = updatedCursorRules.trim();
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="AI instructions (.cursorrules)"
        description="Copy the text below and create a '.cursorrules' file in the project root. This teaches AI to write in Layerly style."
      />
      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-slate-300 font-mono">.cursorrules</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest ml-2">
              Current — v2
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? 'Copied!' : 'Copy rules'}
          </button>
        </div>
        <div className="p-6 overflow-x-auto max-h-[600px] overflow-y-auto">
          <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap leading-relaxed">
            {updatedCursorRules.trim()}
          </pre>
        </div>
      </div>
    </div>
  );
}

function renderColors() {
  const colors = [
    {
      group: 'Primary',
      swatches: [
        { name: 'indigo-50', bg: 'bg-indigo-50', text: 'text-indigo-900', label: 'indigo-50' },
        { name: 'indigo-100', bg: 'bg-indigo-100', text: 'text-indigo-900', label: 'indigo-100' },
        { name: 'indigo-200', bg: 'bg-indigo-200', text: 'text-indigo-900', label: 'indigo-200' },
        { name: 'indigo-500', bg: 'bg-indigo-500', text: 'text-white', label: 'indigo-500' },
        { name: 'indigo-600', bg: 'bg-indigo-600', text: 'text-white', label: 'indigo-600 ★' },
        { name: 'indigo-700', bg: 'bg-indigo-700', text: 'text-white', label: 'indigo-700' },
      ],
    },
    {
      group: 'Neutrals',
      swatches: [
        { name: 'slate-50', bg: 'bg-slate-50', text: 'text-slate-800', label: 'slate-50 ★' },
        { name: 'slate-100', bg: 'bg-slate-100', text: 'text-slate-800', label: 'slate-100' },
        { name: 'slate-200', bg: 'bg-slate-200', text: 'text-slate-800', label: 'slate-200' },
        { name: 'slate-400', bg: 'bg-slate-400', text: 'text-white', label: 'slate-400' },
        { name: 'slate-700', bg: 'bg-slate-700', text: 'text-white', label: 'slate-700' },
        { name: 'slate-900', bg: 'bg-slate-900', text: 'text-white', label: 'slate-900 ★' },
      ],
    },
    {
      group: 'Semantic',
      swatches: [
        { name: 'emerald-100', bg: 'bg-emerald-100', text: 'text-emerald-900', label: 'Success/bg' },
        { name: 'emerald-600', bg: 'bg-emerald-600', text: 'text-white', label: 'Success ★' },
        { name: 'amber-100', bg: 'bg-amber-100', text: 'text-amber-900', label: 'Warning/bg' },
        { name: 'amber-500', bg: 'bg-amber-500', text: 'text-white', label: 'Warning ★' },
        { name: 'red-100', bg: 'bg-red-100', text: 'text-red-900', label: 'Error/bg' },
        { name: 'red-600', bg: 'bg-red-600', text: 'text-white', label: 'Error ★' },
      ],
    },
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Colors & Design Tokens"
        description="Layerly color palette. Tokens marked ★ are used as primary in components."
      />
      <div className="space-y-8">
        {colors.map((group) => (
          <div key={group.group}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {group.group}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {group.swatches.map((swatch) => (
                <div key={swatch.name} className="space-y-2">
                  <div
                    className={`h-16 rounded-xl border border-black/5 shadow-sm ${swatch.bg} flex items-center justify-center`}
                  >
                    <span className={`text-[10px] font-black ${swatch.text} opacity-60`}></span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                    {swatch.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-8 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Semantic helper classes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-700">App background</p>
              <p className="text-slate-500 mt-1">bg-slate-50</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-700">Card / Panel</p>
              <p className="text-slate-500 mt-1">bg-white border border-slate-200 rounded-2xl shadow-sm</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-700">Focus ring</p>
              <p className="text-slate-500 mt-1">focus:ring-4 focus:ring-indigo-500/10</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderLayout() {
  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Page layout"
        description="Correct way to lay out headers and content in SaaS apps. Avoid nesting cards in cards."
      />

      <div className="space-y-8">
        <ComponentShowcase
          title="Page header + data card pattern"
          description="Header directly on bg-slate-50, data in white card below"
          fullWidthPreview
          preview={
            <div className="bg-slate-100 p-6 rounded-2xl border-2 border-dashed border-slate-300 relative">
              <span className="absolute -top-3 left-5 bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                bg-slate-50
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                      Orders
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Production Management
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      placeholder="Search..."
                      className="w-40 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <button
                    type="button"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Order
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center border-dashed">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                  Data table / content
                </p>
                <p className="text-xs text-slate-400 mt-1">bg-white rounded-2xl border border-slate-200 shadow-sm</p>
              </div>
            </div>
          }
          code={`// Pattern: PageHeader directly on bg-slate-50
// Data in white card below header

<div className="min-h-screen bg-slate-50 p-6 lg:p-8">
  {/* === PAGE HEADER (on gray bg, no white card) === */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
        <Package className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
          Orders
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Production Management
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <SearchInput placeholder="Search orders..." className="w-64" />
      <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
        New Order
      </Button>
    </div>
  </div>

  {/* === DATA CARD (white card) === */}
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
    {/* table, list, grid... */}
  </div>
</div>`}
        />
      </div>
    </div>
  );
}

function renderTypography() {
  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Typography"
        description="Font system based on Inter. High contrast and readable for B2B apps."
      />

      <div className="space-y-4">
        <ComponentShowcase
          title="Heading scale"
          fullWidthPreview
          preview={
            <div className="space-y-6 w-full">
              <div className="flex items-baseline gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 shrink-0">Display H1</span>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">Layerly.cloud</h1>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 shrink-0">Heading H2</span>
                <h2 className="text-3xl font-black text-slate-900">Manage orders</h2>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 shrink-0">Heading H3</span>
                <h3 className="text-xl font-bold text-slate-900">3D print settings</h3>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 shrink-0">Body</span>
                <p className="text-base text-slate-600 font-medium">System automatically calculates power usage and depreciation.</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 shrink-0">Small</span>
                <p className="text-sm text-slate-500 font-medium">Quote link expires in 14 business days.</p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24 shrink-0">Eyebrow</span>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Financial analytics</p>
              </div>
            </div>
          }
          code={`{/* Display H1 */}
<h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
  Layerly.cloud
</h1>

{/* Heading H2 */}
<h2 className="text-3xl font-black text-slate-900">
  Manage orders
</h2>

{/* Heading H3 */}
<h3 className="text-xl font-bold text-slate-900">
  3D print settings
</h3>

{/* Body text */}
<p className="text-base text-slate-600 leading-relaxed font-medium">
  System automatically calculates power usage and depreciation.
</p>

{/* Small / Hint */}
<p className="text-sm text-slate-500 font-medium">
  Quote link expires in 14 business days.
</p>

{/* Eyebrow / section label */}
<p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
  Financial analytics
</p>`}
        />
      </div>
    </div>
  );
}

function renderButtons() {
  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Buttons (Button & IconButton)"
        description="Button and IconButton components — variants, sizes, loading states and icons."
      />

      <div className="space-y-6">
        <ComponentShowcase
          title="Button variants"
          description="Variants: primary, secondary, outline, soft, ghost, danger"
          preview={
            <div className="flex flex-wrap gap-3 items-center">
              <Button type="button" variant="primary">Primary</Button>
              <Button type="button" variant="secondary">Secondary</Button>
              <Button type="button" variant="outline">Outline</Button>
              <Button type="button" variant="soft">Soft</Button>
              <Button type="button" variant="ghost">Ghost</Button>
              <Button type="button" variant="danger">Danger</Button>
            </div>
          }
          code={`import { Button } from '@/components/ui/Button';

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="soft">Soft</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>`}
        />

        <ComponentShowcase
          title="Button sizes"
          description="Sizes: sm, md (default), lg"
          preview={
            <div className="flex flex-wrap gap-3 items-center">
              <Button type="button" variant="primary" size="sm">Small</Button>
              <Button type="button" variant="primary" size="md">Medium</Button>
              <Button type="button" variant="primary" size="lg">Large</Button>
            </div>
          }
          code={`<Button variant="primary" size="sm">Small</Button>
<Button variant="primary" size="md">Medium</Button>
<Button variant="primary" size="lg">Large</Button>`}
        />

        <ComponentShowcase
          title="Button with icons and loading state"
          description="Props: leftIcon, rightIcon, isLoading, loadingText, disabled"
          preview={
            <div className="flex flex-wrap gap-3 items-center">
              <Button type="button" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                New order
              </Button>
              <Button type="button" variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Next
              </Button>
              <Button type="button" variant="primary" isLoading loadingText="Saving...">
                Save
              </Button>
              <Button type="button" variant="outline" disabled>
                Disabled
              </Button>
            </div>
          }
          code={`import { Button } from '@/components/ui/Button';
import { Plus, ArrowRight } from 'lucide-react';

<Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
  New order
</Button>

<Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
  Next
</Button>

<Button variant="primary" isLoading loadingText="Saving...">
  Save
</Button>

<Button variant="outline" disabled>
  Disabled
</Button>`}
        />

        <ComponentShowcase
          title="IconButton — icon buttons"
          description="Variants: default, ghost, primary, danger, success, warning. Supports tooltip."
          preview={
            <div className="flex flex-wrap gap-3 items-center">
              <IconButton icon={Pencil} variant="default" tooltip="Edit" />
              <IconButton icon={Trash2} variant="danger" tooltip="Delete" />
              <IconButton icon={Eye} variant="ghost" tooltip="Preview" />
              <IconButton icon={Download} variant="primary" tooltip="Download" />
              <IconButton icon={CheckCircle2} variant="success" tooltip="Confirm" />
              <IconButton icon={Star} variant="warning" tooltip="Gwiazdka" />
              <IconButton icon={Shield} variant="indigo" tooltip="Zabezpiecz" />
              <IconButton icon={Loader2} variant="default" isLoading />
            </div>
          }
          code={`import { IconButton } from '@/components/ui/IconButton';
import { Pencil, Trash2, Eye, Download } from 'lucide-react';

{/* With tooltip */}
<IconButton icon={Pencil} variant="default" tooltip="Edit" />
<IconButton icon={Trash2} variant="danger" tooltip="Delete" />
<IconButton icon={Eye} variant="ghost" tooltip="Preview" />
<IconButton icon={Download} variant="primary" tooltip="Download" />

{/* Sizes */}
<IconButton icon={Pencil} size="sm" />
<IconButton icon={Pencil} size="md" />
<IconButton icon={Pencil} size="lg" />

{/* Loading state */}
<IconButton icon={Loader2} isLoading />`}
        />
      </div>
    </div>
  );
}

function FormsSection() {
  const [checkboxTerms, setCheckboxTerms] = useState(true);
  const [toggle, setToggle] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Forms (Input, Textarea, Checkbox, Toggle)"
        description="Form controls. All support label, helperText, error and disabled state."
      />

      <div className="space-y-6">
        <ComponentShowcase
          title="Input — variants"
          description="Props: label, helperText, error, leftIcon, rightIcon, size (sm|md|lg), type"
          fullWidthPreview
          preview={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <Input label="Standard input" type="text" placeholder="Enter project name..." />
              <Input
                label="With icon and helper text"
                type="email"
                placeholder="jan@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="We will send the quote to this address."
              />
              <Input
                label="Error state"
                type="text"
                defaultValue="Invalid data"
                error="This field is required."
              />
              <Input label="Disabled" type="text" placeholder="Unavailable" disabled />
            </div>
          }
          code={`import { Input } from '@/components/ui/Input';
import { Mail } from 'lucide-react';

{/* Standard */}
<Input
  label="Project name"
  type="text"
  placeholder="Enter name..."
/>

{/* With icon and helper text */}
<Input
  label="Customer email"
  type="email"
  placeholder="jan@company.com"
  leftIcon={<Mail className="w-4 h-4" />}
  helperText="We will send the quote to this address."
/>

{/* Error state */}
<Input
  label="Required field"
  type="text"
  error="This field is required."
/>

{/* Disabled */}
<Input label="Disabled" disabled />`}
        />

        <ComponentShowcase
          title="Textarea"
          description="Props: label, helperText, error, rows, size"
          fullWidthPreview
          preview={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <Textarea
                label="Order notes"
                rows={4}
                placeholder="Additional notes for production..."
              />
              <Textarea
                label="Error state"
                rows={4}
                placeholder="Required field..."
                error="This field is required."
              />
            </div>
          }
          code={`import { Textarea } from '@/components/ui/Textarea';

<Textarea
  label="Order notes"
  rows={4}
  placeholder="Additional notes for production..."
  helperText="Optional — visible internally only."
/>

{/* Error state */}
<Textarea
  label="Error description"
  rows={4}
  error="This field is required."
/>`}
        />

        <ComponentShowcase
          title="Checkbox and ToggleButton"
          description="Checkbox for acceptance, ToggleButton for toggles"
          preview={
            <div className="flex flex-col gap-6 w-full max-w-xs">
              <Checkbox
                checked={checkboxTerms}
                onCheckedChange={setCheckboxTerms}
                label="I accept the terms and privacy policy"
              />
              <div>
                <ToggleButton
                  checked={toggle}
                  onChange={setToggle}
                  label="Email notifications"
                />
                <p className="text-xs text-slate-500 font-medium mt-1 ml-14">
                  Receive print progress reports.
                </p>
              </div>
              <ToggleButton
                checked={toggleLoading}
                onChange={setToggleLoading}
                isLoading
                label="Sync (loading)"
              />
            </div>
          }
          code={`import { Checkbox } from '@/components/ui/Checkbox';
import { ToggleButton } from '@/components/ui/ToggleButton';

const [checked, setChecked] = useState(false);
const [toggle, setToggle] = useState(true);

{/* Checkbox */}
<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
  label="I accept the terms"
/>

{/* Toggle */}
<ToggleButton
  checked={toggle}
  onChange={setToggle}
  label="Email notifications"
/>

{/* Toggle with loading */}
<ToggleButton
  checked={false}
  onChange={() => {}}
  isLoading
  label="Sync"
/>`}
        />

        <ComponentShowcase
          title="Interactive card (Interactive Card Checkbox)"
          description="Native checkbox hidden (sr-only peer) with styled card"
          fullWidthPreview
          preview={
            <div className="w-full max-w-sm">
              <label className="relative flex cursor-pointer group">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="w-full rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all duration-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50/50 group-hover:border-indigo-300 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">Express delivery</span>
                      <span className="text-xs font-medium text-slate-500">24h priority (+50 PLN)</span>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center ml-4 shrink-0">
                    <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white peer-checked:border-indigo-600 peer-checked:bg-indigo-600 transition-colors" />
                    <Check className="absolute w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                </div>
              </label>
            </div>
          }
          code={`{/* Interactive card with native checkbox */}
<label className="relative flex cursor-pointer group">
  <input type="checkbox" className="peer sr-only" />
  <div className="
    w-full rounded-2xl border-2 border-slate-200 bg-white p-5
    transition-all duration-200
    peer-checked:border-indigo-600 peer-checked:bg-indigo-50/50
    group-hover:border-indigo-300
    flex items-center justify-between
  ">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
        <Zap className="w-5 h-5" />
      </div>
      <div>
        <span className="font-bold text-slate-900 text-sm block">
          Express delivery
        </span>
        <span className="text-xs text-slate-500">24h priority (+50 PLN)</span>
      </div>
    </div>
    {/* Custom checkbox indicator */}
    <div className="relative flex items-center justify-center ml-4">
      <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:border-indigo-600 peer-checked:bg-indigo-600 transition-colors" />
      <Check className="absolute w-3.5 h-3.5 text-white" strokeWidth={3} />
    </div>
  </div>
</label>`}
        />
      </div>
    </div>
  );
}

function SelectSection() {
  const [basicVal, setBasicVal] = useState('');
  const [iconVal, setIconVal] = useState('bambu1');
  const [userVal, setUserVal] = useState('');
  const [errorVal, setErrorVal] = useState('');

  const STATUS_OPTIONS = [
    { label: 'Quote', value: 'quote' },
    { label: 'In production', value: 'production' },
    { label: 'Ready to ship', value: 'ready' },
    { label: 'Shipped', value: 'shipped' },
  ];
  const PRINTER_OPTIONS = [
    { label: 'Bambu Lab X1C #1', value: 'bambu1', icon: <Printer className="w-4 h-4" /> },
    { label: 'Prusa MK4', value: 'prusa1', icon: <Printer className="w-4 h-4" /> },
    { label: 'Elegoo Neptune 3', value: 'elegoo', icon: <Box className="w-4 h-4" /> },
    { label: 'Formlabs Saturn', value: 'formlabs', icon: <Zap className="w-4 h-4" /> },
  ];
  const CLIENT_OPTIONS = [
    { label: 'Jan Kowalski', value: 'jan', icon: <User className="w-4 h-4" /> },
    { label: 'TechCorp Inc.', value: 'tech', icon: <Building2 className="w-4 h-4" /> },
    { label: 'Silesia Plastics', value: 'silesia', icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Select Menu (CustomSelect)"
        description="Styled dropdown replacing native select. Supports icons, errors and disabled."
      />

      <div className="space-y-6">
        <ComponentShowcase
          title="Basic Select"
          description="Basic select with label and placeholder"
          preview={
            <div className="w-full max-w-xs">
              <CustomSelect
                label="Order Status"
                options={STATUS_OPTIONS}
                value={basicVal}
                onChange={setBasicVal}
                placeholder="Select status..."
              />
            </div>
          }
          code={`import { CustomSelect } from '@/components/ui/CustomSelect';

const [status, setStatus] = useState('');

<CustomSelect
  label="Order Status"
  options={[
    { label: 'Quote', value: 'quote' },
    { label: 'In production', value: 'production' },
    { label: 'Ready to ship', value: 'ready' },
    { label: 'Shipped', value: 'shipped' },
  ]}
  value={status}
  onChange={setStatus}
  placeholder="Select status..."
/>`}
        />

        <ComponentShowcase
          title="Select with icons in options (Rich Select)"
          description="Options can include Lucide icons"
          preview={
            <div className="w-full max-w-xs">
              <CustomSelect
                label="Assign Printer"
                options={PRINTER_OPTIONS}
                value={iconVal}
                onChange={setIconVal}
              />
            </div>
          }
          code={`import { Printer, Box, Zap } from 'lucide-react';

<CustomSelect
  label="Assign Printer"
  options={[
    { label: 'Bambu Lab X1C', value: 'bambu1', icon: <Printer className="w-4 h-4" /> },
    { label: 'Prusa MK4', value: 'prusa1', icon: <Printer className="w-4 h-4" /> },
    { label: 'Elegoo Neptune', value: 'elegoo', icon: <Box className="w-4 h-4" /> },
    { label: 'Formlabs Saturn', value: 'formlabs', icon: <Zap className="w-4 h-4" /> },
  ]}
  value={assignedPrinter}
  onChange={setAssignedPrinter}
/>`}
        />

        <ComponentShowcase
title="Select with trigger icon + helper text"
      description="icon prop adds icon on the left of the trigger"
          preview={
            <div className="w-full max-w-xs">
              <CustomSelect
                label="Customer"
                icon={User}
                options={CLIENT_OPTIONS}
                value={userVal}
                onChange={setUserVal}
                placeholder="Select customer..."
                helperText="Customer will receive a notification when status changes."
              />
            </div>
          }
          code={`import { User } from 'lucide-react';

<CustomSelect
  label="Customer"
  icon={User}
  options={clientOptions}
  value={client}
  onChange={setClient}
  placeholder="Select customer..."
  helperText="Customer will receive a notification when status changes."
/>`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ComponentShowcase
            title="Error state"
            preview={
              <div className="w-full">
                <CustomSelect
                  label="Filament"
                  options={STATUS_OPTIONS}
                  value={errorVal}
                  onChange={setErrorVal}
                  error="This field is required."
                />
              </div>
            }
            code={`<CustomSelect
  label="Filament"
  options={options}
  value={val}
  onChange={setVal}
  error="This field is required."
/>`}
          />

          <ComponentShowcase
            title="Disabled"
            preview={
              <div className="w-full">
                <CustomSelect
                  label="Priority (PRO only)"
                  options={[{ label: 'Standard', value: 'std' }]}
                  value="std"
                  onChange={() => {}}
                  disabled
                />
              </div>
            }
            code={`<CustomSelect
  label="Priority (PRO only)"
  options={[{ label: 'Standard', value: 'std' }]}
  value="std"
  onChange={() => {}}
  disabled
/>`}
          />
        </div>
      </div>
    </div>
  );
}

function SlidersSection() {
  const [margin, setMargin] = useState(40);
  const [volume, setVolume] = useState(150);
  const [disabled, setDisabled] = useState(25);

  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Sliders & toggles (CustomSlider)"
        description="Controlled slider with label, value and optional helper. Layerly style (indigo)."
      />

      <div className="space-y-6">
        <ComponentShowcase
          title="Slider with label, value and helper"
          description="Props: label, value, onChange, min, max, step, valueSuffix, helperText"
          fullWidthPreview
          preview={
            <div className="w-full space-y-6">
              <CustomSlider
                label="Target margin"
                value={margin}
                onChange={setMargin}
                min={0}
                max={200}
                step={5}
                valueSuffix="%"
                helperText="Select margin percentage for the order."
              />
              <CustomSlider
                label="Fill volume"
                value={volume}
                onChange={setVolume}
                min={50}
                max={500}
                step={10}
                valueSuffix=" g"
              />
            </div>
          }
          code={`import { CustomSlider } from '@/components/ui/CustomSlider';

const [margin, setMargin] = useState(40);

<CustomSlider
  label="Target margin"
  value={margin}
  onChange={setMargin}
  min={0}
  max={200}
  step={5}
  valueSuffix="%"
  helperText="Select margin percentage for the order."
/>`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ComponentShowcase
            title="Disabled"
            description="Prop: disabled"
            preview={
              <div className="w-full">
                <CustomSlider
                  label="Waste (disabled)"
                  value={disabled}
                  onChange={setDisabled}
                  disabled
                  valueSuffix="%"
                  helperText="Available in PRO plan."
                />
              </div>
            }
            code={`<CustomSlider
  label="Waste"
  value={25}
  onChange={() => {}}
  disabled
  valueSuffix="%"
  helperText="Available in PRO plan."
/>`}
          />

          <ComponentShowcase
            title="Minimal (no value)"
            description="Prop: showValue={false}"
            preview={
              <div className="w-full">
                <CustomSlider value={50} onChange={() => {}} showValue={false} />
              </div>
            }
            code={`{/* No label and no displayed value */}
<CustomSlider
  value={value}
  onChange={setValue}
  showValue={false}
/>`}
          />
        </div>
      </div>
    </div>
  );
}

function renderAlerts() {
  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Alerts and labels (Callouts & badges)"
        description="User communication. Callouts for messages, badges for status in tables."
      />

      <div className="space-y-6">
        <ComponentShowcase
          title="Callouts — 4 semantic variants"
          description="bg-{color}-50 border border-{color}-200 rounded-2xl p-5 flex items-start gap-4"
          fullWidthPreview
          preview={
            <div className="w-full space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="bg-emerald-100 p-1.5 rounded-xl shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Success — Payment received</h4>
                  <p className="text-xs text-emerald-800 font-medium mt-0.5">Order QT-8472 moved to &quot;In progress&quot;.</p>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="bg-indigo-100 p-1.5 rounded-xl shrink-0">
                  <Info className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-900">Info — System update</h4>
                  <p className="text-xs text-indigo-800 font-medium mt-0.5">Check new machine calibration features in settings.</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="bg-amber-100 p-1.5 rounded-xl shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Warning — Machine failure</h4>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">Filament sensor reported error. Operation paused.</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="bg-red-100 p-1.5 rounded-xl shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-900">Error — Failed to delete file</h4>
                  <p className="text-xs text-red-800 font-medium mt-0.5">Insufficient permissions. Only admins can delete archived quotes.</p>
                </div>
              </div>
            </div>
          }
          code={`{/* Success */}
<div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
  <div className="bg-emerald-100 p-2 rounded-xl shrink-0">
    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
  </div>
  <div>
    <h4 className="text-sm font-bold text-emerald-900">Payment received</h4>
    <p className="text-sm text-emerald-800 font-medium">Order moved to "In progress".</p>
  </div>
</div>

{/* Info */}
<div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4">
  <div className="bg-indigo-100 p-2 rounded-xl shrink-0">
    <Info className="w-5 h-5 text-indigo-600" />
  </div>
  <div>
    <h4 className="text-sm font-bold text-indigo-900">System update</h4>
    <p className="text-sm text-indigo-800 font-medium">Check new features in settings.</p>
  </div>
</div>

{/* Warning */}
<div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
  <div className="bg-amber-100 p-2 rounded-xl shrink-0">
    <AlertTriangle className="w-5 h-5 text-amber-600" />
  </div>
  ...
</div>

{/* Error */}
<div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
  <div className="bg-red-100 p-2 rounded-xl shrink-0">
    <AlertCircle className="w-5 h-5 text-red-600" />
  </div>
  ...
</div>`}
        />

        <ComponentShowcase
          title="Badges — statuses and labels"
          description="Pastel, outline and live indicators"
          fullWidthPreview
          preview={
            <div className="space-y-6 w-full">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Pastel (tables, lists)</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200">Completed</span>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-200">Pending</span>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200">In print</span>
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">Quoted</span>
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200">Error</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Outline (types, formats, plans)</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white border-2 border-slate-200 text-slate-600 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md">Format .STL</span>
                  <span className="bg-white border-2 border-indigo-200 text-indigo-600 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md">PRO Plan</span>
                  <span className="bg-slate-900 border-2 border-slate-900 text-white text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md">B2B</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Live indicators (machine status)</p>
                <div className="flex flex-wrap gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    Machine Online
                  </span>
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    Printing
                  </span>
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                    Print error
                  </span>
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    Offline
                  </span>
                </div>
              </div>
            </div>
          }
          code={`{/* Pastel — for tables and lists */}
<span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200">
  Completed
</span>
<span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-200">
  Pending
</span>
<span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200">
  Error
</span>

{/* Outline — for types, formats, plans */}
<span className="bg-white border-2 border-slate-200 text-slate-600 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md">
  Format .STL
</span>
<span className="bg-white border-2 border-indigo-200 text-indigo-600 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md">
  PRO Plan
</span>

{/* Live indicator — machine status */}
<span className="flex items-center gap-2 text-xs font-bold text-slate-700">
  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
  Machine Online
</span>
<span className="flex items-center gap-2 text-xs font-bold text-slate-700">
  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
  Print error
</span>`}
        />
      </div>
    </div>
  );
}

function TabsSection() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Tabs"
        description="Tabs components: TabsList, TabsTrigger, TabsContent — built on Context API."
      />

      <div className="space-y-6">
        <ComponentShowcase
          title="Segment control (no icons)"
          description="Base style — white active button in gray pill container. Pattern from /dashboard/filaments."
          fullWidthPreview
          preview={
            <div className="w-full space-y-4">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="prints">Prints</TabsTrigger>
                  <TabsTrigger value="costs">Costs</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">📊 Overview content — farm summary, overall stats.</p>
                  </div>
                </TabsContent>
                <TabsContent value="prints">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">🖨️ Prints content — print history and reports.</p>
                  </div>
                </TabsContent>
                <TabsContent value="costs">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">💰 Costs content — cost analysis and depreciation.</p>
                  </div>
                </TabsContent>
                <TabsContent value="settings">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">⚙️ Settings content — farm and machine configuration.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          }
          code={`import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

const [tab, setTab] = useState('overview');

<Tabs value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="prints">Prints</TabsTrigger>
    <TabsTrigger value="costs">Costs</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      {/* tab content */}
    </div>
  </TabsContent>
  <TabsContent value="prints">...</TabsContent>
  <TabsContent value="costs">...</TabsContent>
  <TabsContent value="settings">...</TabsContent>
</Tabs>`}
        />

        <ComponentShowcase
          title="Segment control with icons"
          description="TabsTrigger supports Lucide icons via children — like Warehouse / Catalog in /dashboard/filaments."
          preview={
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="overview">
                  <Package className="w-4 h-4 shrink-0" /> Warehouse
                </TabsTrigger>
                <TabsTrigger value="prints">
                  <Search className="w-4 h-4 shrink-0" /> Catalog
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
          code={`import { Database, Globe } from 'lucide-react';

{/* Add icons directly as TabsTrigger children */}
<Tabs value={view} onValueChange={setView}>
  <TabsList>
    <TabsTrigger value="inventory">
      <Database className="w-4 h-4 shrink-0" /> Warehouse
    </TabsTrigger>
    <TabsTrigger value="catalog">
      <Globe className="w-4 h-4 shrink-0" /> Catalog
    </TabsTrigger>
  </TabsList>

  <TabsContent value="inventory">
    {/* warehouse view */}
  </TabsContent>
  <TabsContent value="catalog">
    {/* catalog view */}
  </TabsContent>
</Tabs>`}
        />
      </div>
    </div>
  );
}

function ModalSection() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Modal (dialog)"
        description="Portal-based modal with escape key, backdrop blur, header with icon and optional footer."
      />

      <div className="space-y-6">
        <ComponentShowcase
          title="Modal variants"
          description="Basic, with icon in header, confirmation modal (with footer)"
          preview={
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setBasicOpen(true)}>
                Basic Modal
              </Button>
              <Button type="button" variant="outline" leftIcon={<Settings className="w-4 h-4" />} onClick={() => setIconOpen(true)}>
                Modal with icon
              </Button>
              <Button type="button" variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setConfirmOpen(true)}>
                Confirmation modal
              </Button>

              <Modal isOpen={basicOpen} onClose={() => setBasicOpen(false)} title="Order details">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 font-medium">Modal content. You can put any content here — form, table or description.</p>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-mono text-slate-500">order_id: QT-8472</p>
                    <p className="text-xs font-mono text-slate-500">status: in_production</p>
                    <p className="text-xs font-mono text-slate-500">printer: Bambu Lab X1C</p>
                  </div>
                </div>
              </Modal>

              <Modal
                isOpen={iconOpen}
                onClose={() => setIconOpen(false)}
                title="Machine settings"
                icon={<Settings className="w-4 h-4" />}
                footer={
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIconOpen(false)}>Cancel</Button>
                    <Button type="button" variant="primary" size="sm">Save changes</Button>
                  </>
                }
              >
                <div className="space-y-4">
                  <Input label="Machine name" defaultValue="Bambu Lab X1C #1" />
                  <Input label="Moc (W)" type="number" defaultValue="350" />
                  <CustomSelect
                    label="Type"
                    options={[{ label: 'FDM', value: 'fdm' }, { label: 'Resin', value: 'resin' }]}
                    value="fdm"
                    onChange={() => {}}
                  />
                </div>
              </Modal>

              <Modal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title="Delete order?"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                footer={
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                    <Button type="button" variant="danger" size="sm">Yes, delete</Button>
                  </>
                }
              >
                <p className="text-sm text-slate-600 font-medium">
                  Are you sure you want to delete order <strong className="text-slate-900">QT-8472</strong>? This cannot be undone.
                </p>
              </Modal>
            </div>
          }
          code={`import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const [open, setOpen] = useState(false);

{/* Trigger */}
<Button onClick={() => setOpen(true)}>Open modal</Button>

{/* Basic Modal */}
<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Modal title"
>
  <p>Modal content...</p>
</Modal>

{/* Modal with icon and footer */}
<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Machine settings"
  icon={<Settings className="w-4 h-4" />}
  size="lg"
  footer={
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" size="sm">
        Save
      </Button>
    </>
  }
>
  <div className="space-y-4">
    {/* form content */}
  </div>
</Modal>

{/* Available sizes: sm | md | lg | xl | 2xl | 3xl | 4xl | full */}`}
        />
      </div>
    </div>
  );
}

function renderLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      <SectionHeader
        title="Loading states"
        description="No skeletons. Use loaders and overlays. They don't jump or shift layout."
      />

      <div className="space-y-6">
        <ComponentShowcase
          title="Data refresh overlay"
          description="On tables and cards — keeps old content underneath"
          preview={
            <div className="relative h-40 w-full bg-white rounded-2xl border border-slate-200 p-4 overflow-hidden">
              <div className="space-y-3 opacity-40 select-none">
                <div className="h-5 w-3/4 bg-slate-100 rounded-lg" />
                <div className="h-5 w-full bg-slate-100 rounded-lg" />
                <div className="h-5 w-5/6 bg-slate-100 rounded-lg" />
                <div className="h-5 w-2/3 bg-slate-100 rounded-lg" />
              </div>
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span className="text-sm font-bold text-slate-700 pr-2">Refreshing table...</span>
                </div>
              </div>
            </div>
          }
          code={`{/* Overlay on table / card during refresh */}
<div className="relative">
  {/* Old content */}
  <table>...</table>

  {/* Overlay */}
  {isRefreshing && (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
      <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
        <span className="text-sm font-bold text-slate-700 pr-2">
          Refreshing table...
        </span>
      </div>
    </div>
  )}
</div>`}
        />

        <ComponentShowcase
          title="Full view loader (DataLoader)"
          description="Central loader instead of blank screen on first data load"
          preview={
            <div className="h-40 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-200">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-bold text-slate-600">Loading data...</p>
              <p className="text-xs text-slate-400 mt-1">Preparing your farm</p>
            </div>
          }
          code={`import { DataLoader } from '@/components/ui/DataLoader';

{/* DataLoader component */}
{isLoading ? (
  <DataLoader message="Loading data..." subtitle="Preparing your farm" />
) : (
  <YourContent />
)}

{/* Alternatively — manual implementation */}
{isLoading && (
  <div className="flex flex-col items-center justify-center h-[400px]">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
    <p className="text-sm font-bold text-slate-600">Loading data...</p>
  </div>
)}`}
        />

        <ComponentShowcase
          title="Loading built into button (Button isLoading)"
          description="Button is disabled and shows spinner — use isLoading prop on Button"
          preview={
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="primary" isLoading loadingText="Saving...">
                Save
              </Button>
              <Button type="button" variant="outline" isLoading loadingText="Processing">
                Submit
              </Button>
              <Button type="button" variant="danger" isLoading loadingText="Deleting...">
                Delete
              </Button>
            </div>
          }
          code={`import { Button } from '@/components/ui/Button';

const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  await saveData();
  setIsSaving(false);
};

<Button
  variant="primary"
  isLoading={isSaving}
  loadingText="Saving..."
  onClick={handleSave}
>
  Save order
</Button>`}
        />

        <ComponentShowcase
          title="Toast Notifications — Sonner"
          description="Use sonner instead of custom toasts. Direct import from 'sonner'."
          preview={
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="soft"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => {
                  // Demo — sonner toast.success would need provider
                  const div = document.createElement('div');
                  div.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#10b981;color:white;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:700;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
                  div.textContent = '✓ Order saved successfully';
                  document.body.appendChild(div);
                  setTimeout(() => div.remove(), 2500);
                }}
              >
                Success toast
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<AlertCircle className="w-4 h-4" />}
                onClick={() => {
                  const div = document.createElement('div');
                  div.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#ef4444;color:white;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:700;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
                  div.textContent = '✕ Error: Failed to save';
                  document.body.appendChild(div);
                  setTimeout(() => div.remove(), 2500);
                }}
              >
                Error toast
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<AlertTriangle className="w-4 h-4" />}
                onClick={() => {
                  const div = document.createElement('div');
                  div.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#f59e0b;color:white;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:700;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
                  div.textContent = '⚠ Warning: filament almost empty';
                  document.body.appendChild(div);
                  setTimeout(() => div.remove(), 2500);
                }}
              >
                Warning toast
              </Button>
            </div>
          }
          code={`// Installation: already in project (sonner)
import { toast } from 'sonner';

// Usage in event handlers:
const handleSave = async () => {
  try {
    await saveOrder();
    toast.success('Order saved successfully');
  } catch (error) {
    toast.error('Error: Failed to save order');
  }
};

// Types:
toast.success('Success message');
toast.error('Error message');
toast.warning('Warning');
toast.info('Information');
toast('Default message');

// With options:
toast.success('Order saved', {
  description: 'QT-8472 moved to production',
  duration: 4000,
});`}
        />
      </div>
    </div>
  );
}

// ─── Sections Config ──────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'rules', label: 'AI Rules (.cursorrules)', icon: <Bot className="w-4 h-4" /> },
  { id: 'colors', label: 'Colors & Tokens', icon: <Palette className="w-4 h-4" /> },
  { id: 'layout', label: 'Layout', icon: <Layout className="w-4 h-4" /> },
  { id: 'typography', label: 'Typography', icon: <Type className="w-4 h-4" /> },
  { id: 'buttons', label: 'Button & IconButton', icon: <MousePointerClick className="w-4 h-4" /> },
  { id: 'forms', label: 'Forms & checkboxes', icon: <TextCursorInput className="w-4 h-4" /> },
  { id: 'select', label: 'Select Menu', icon: <ChevronDown className="w-4 h-4" /> },
  { id: 'sliders', label: 'Sliders & toggles', icon: <SlidersHorizontal className="w-4 h-4" /> },
  { id: 'alerts', label: 'Alerts & badges', icon: <BellRing className="w-4 h-4" /> },
  { id: 'tabs', label: 'Tabs', icon: <Columns className="w-4 h-4" /> },
  { id: 'modal', label: 'Modal', icon: <Maximize2 className="w-4 h-4" /> },
  { id: 'loading', label: 'Loading states & toast', icon: <Loader2 className="w-4 h-4" /> },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UIKitPage() {
  const [activeSection, setActiveSection] = useState('rules');

  const renderSection = () => {
    switch (activeSection) {
      case 'rules': return <CursorRulesSection />;
      case 'colors': return renderColors();
      case 'layout': return renderLayout();
      case 'typography': return renderTypography();
      case 'buttons': return renderButtons();
      case 'forms': return <FormsSection />;
      case 'select': return <SelectSection />;
      case 'sliders': return <SlidersSection />;
      case 'alerts': return renderAlerts();
      case 'tabs': return <TabsSection />;
      case 'modal': return <ModalSection />;
      case 'loading': return renderLoading();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800 selection:bg-indigo-500 selection:text-white">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-900 text-white shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-black tracking-tight leading-none text-base">UI Kit</h1>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-0.5">
              Layerly Core
            </p>
          </div>
        </div>

        {/* Component count badge */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {SECTIONS.length} sections · 18 components
          </p>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
            >
              <span className="shrink-0">{sec.icon}</span>
              <span className="text-left">{sec.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <p className="text-[10px] text-slate-400 font-medium text-center">
            Layerly Design System v2.0
          </p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-x-hidden min-w-0">
        {/* Mobile nav */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-50 shadow-sm">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            {SECTIONS.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.label}
              </option>
            ))}
          </select>
        </div>

        <div className="max-w-5xl mx-auto p-6 sm:p-10 lg:p-14">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
