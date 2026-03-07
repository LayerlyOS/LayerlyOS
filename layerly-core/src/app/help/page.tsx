'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppFooter } from '@/components/layout/AppFooter';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Book,
  Printer,
  Calculator,
  CreditCard,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  ArrowRight,
  FileText,
  MessageSquare,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'How to set up your farm and add your first machine.',
    icon: Book,
    articleCount: 12,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    firstArticleSlug: null as string | null,
  },
  {
    id: 'printers',
    title: 'Fleet management',
    description: 'Adding printers, depreciation and electricity costs.',
    icon: Printer,
    articleCount: 8,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    firstArticleSlug: 'printer-depreciation',
  },
  {
    id: 'quoting',
    title: 'Quotes & orders',
    description: 'How the quoting algorithm works and how to share links.',
    icon: Calculator,
    articleCount: 15,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    firstArticleSlug: null as string | null,
  },
  {
    id: 'billing',
    title: 'Billing & subscription',
    description: 'Invoices, plan changes and Stripe configuration.',
    icon: CreditCard,
    articleCount: 6,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    firstArticleSlug: null as string | null,
  },
];

const FAQS = [
  {
    question: 'How does the algorithm calculate printer electricity consumption cost?',
    answer:
      'The system uses the declared power draw of the machine (in Watts), print duration (estimated by the Slicer), and your defined price per kWh. Formula: (Power / 1000) * Print Time * Price per kWh.',
  },
  {
    question: 'Can I upload my own logo to the quote PDF?',
    answer:
      'Yes, the White-label option is available from the PRO plan. You can upload your company logo and change the main accent colour in Account Settings → Branding.',
  },
  {
    question: 'How does the public payment link for my customer work?',
    answer:
      'After creating a quote, you can generate a unique link. The customer opens it in the browser, sees the cost summary and can pay the order. Funds go directly to your Stripe account; Layerly does not charge a commission on this.',
  },
  {
    question: 'What happens if I exceed the STL file storage limit?',
    answer:
      'You will be notified by email and an in-app message. You will need to remove old archived quotes or upgrade to a higher plan to get more cloud storage.',
  },
  {
    question: 'Can I share the account with my team?',
    answer:
      'Yes. On the PRO plan you can add up to 3 users and assign roles (e.g. Machine Operator with Kanban access only, or Sales with access to quotes).',
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-500 selection:text-white flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                Layerly<span className="text-indigo-600">.</span>{' '}
                <span className="text-slate-500 font-medium">Help Center</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Guides &amp; FAQ
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/contact"
              className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with search */}
      <div className="bg-slate-900 pt-20 pb-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600 rounded-full blur-[120px] opacity-20 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 text-white mb-6 border border-white/20 shadow-lg backdrop-blur-sm">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4">
            How can we help?
          </h2>
          <p className="text-lg text-slate-300 font-medium mb-10">
            Search articles, farm guides and answers to frequently asked questions.
          </p>
          <div className="relative max-w-2xl mx-auto shadow-2xl rounded-2xl overflow-hidden">
            <SearchInput
              size="lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search (e.g. depreciation settings)..."
              className="pr-28 bg-white border-0 shadow-2xl rounded-2xl"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-12 shrink-0">
        {/* Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const cardClass =
              'bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group flex flex-col h-full';
            const content = (
              <>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${cat.bgColor} ${cat.color} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {cat.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium mb-6 flex-1">
                  {cat.description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> {cat.articleCount} articles
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors group-hover:translate-x-1" />
                </div>
              </>
            );
            return cat.firstArticleSlug ? (
              <Link
                key={cat.id}
                href={`/help/${cat.firstArticleSlug}`}
                className={cardClass}
              >
                {content}
              </Link>
            ) : (
              <div key={cat.id} className={cardClass}>
                {content}
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-10 mb-12">
          <h3 className="text-2xl font-black text-slate-900 mb-8 text-center">
            Frequently asked questions (FAQ)
          </h3>
          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`border rounded-2xl transition-colors duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-indigo-200 bg-indigo-50/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset rounded-2xl"
                  >
                    <span
                      className={`font-bold pr-4 ${isOpen ? 'text-indigo-900' : 'text-slate-800'}`}
                    >
                      {faq.question}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1">
                      <div className="h-px w-full bg-indigo-100/50 mb-4" />
                      <p className="text-slate-600 font-medium leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact banner */}
        <div className="max-w-3xl mx-auto bg-indigo-50 rounded-2xl border border-indigo-100 p-8 sm:p-10 flex flex-col sm:flex-row items-center text-center sm:text-left gap-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-indigo-900 mb-2">
              Didn’t find your answer?
            </h3>
            <p className="text-sm font-medium text-indigo-700/80 mb-6 sm:mb-0">
              Our engineers and 3D print specialists are ready to help you set up your farm.
            </p>
          </div>
          <Link
            href="/contact"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            Contact us <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
