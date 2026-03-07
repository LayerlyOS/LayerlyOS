'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { useCallback, useEffect, useState } from 'react';
import {
  Scale,
  ShieldCheck,
  Cookie,
  Download,
  Printer,
  Mail,
  ChevronRight,
  AlertCircle,
  Clock,
} from 'lucide-react';

export type LegalDoc = 'terms' | 'privacy' | 'cookies';

interface LegalClientProps {
  terms: string;
  privacy: string;
  cookies: string;
  lastUpdated: string;
}

export function LegalClient({ terms, privacy, cookies, lastUpdated }: LegalClientProps) {
  const searchParams = useSearchParams();
  const docFromUrl = (searchParams.get('doc') as LegalDoc) || 'terms';
  const [activeDocument, setActiveDocument] = useState<LegalDoc>(docFromUrl);

  useEffect(() => {
    const doc = (searchParams.get('doc') as LegalDoc) || 'terms';
    if (doc === 'terms' || doc === 'privacy' || doc === 'cookies') {
      setActiveDocument(doc);
    }
  }, [searchParams]);

  const setDoc = useCallback(
    (doc: LegalDoc) => {
      setActiveDocument(doc);
      const url = new URL(window.location.href);
      url.searchParams.set('doc', doc);
      window.history.replaceState({}, '', url.pathname + '?' + url.searchParams.toString());
    },
    []
  );

  const content = activeDocument === 'terms' ? terms : activeDocument === 'privacy' ? privacy : cookies;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24 selection:bg-indigo-500 selection:text-white">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                Layerly<span className="text-indigo-600">.</span>{' '}
                <span className="text-slate-500 font-medium">Legal</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Compliance &amp; GDPR
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start sm:items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm text-amber-800 font-medium leading-relaxed">
            <strong>Important:</strong> These documents are a solid template for B2B SaaS. Before going live commercially, we recommend having them reviewed by your legal counsel to ensure they match your business specifics.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
        <aside className="w-full md:w-72 shrink-0 md:sticky md:top-28 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-3">
              Legal Documents
            </h3>
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setDoc('terms')}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeDocument === 'terms'
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Scale className={`w-4 h-4 ${activeDocument === 'terms' ? 'text-indigo-500' : 'text-slate-400'}`} />
                  Terms of Service
                </span>
                {activeDocument === 'terms' && <ChevronRight className="w-4 h-4 text-indigo-400" />}
              </button>
              <button
                type="button"
                onClick={() => setDoc('privacy')}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeDocument === 'privacy'
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className={`w-4 h-4 ${activeDocument === 'privacy' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  Privacy Policy
                </span>
                {activeDocument === 'privacy' && <ChevronRight className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={() => setDoc('cookies')}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeDocument === 'cookies'
                    ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Cookie className={`w-4 h-4 ${activeDocument === 'cookies' ? 'text-amber-500' : 'text-slate-400'}`} />
                  Cookie Policy
                </span>
                {activeDocument === 'cookies' && <ChevronRight className="w-4 h-4 text-amber-400" />}
              </button>
            </nav>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[50px] opacity-30 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-bold mb-2">Offline version</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium leading-relaxed">
                Need these documents for your finance team or management?
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download as PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full bg-transparent hover:bg-white/5 text-slate-300 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print document
                </button>
              </div>
            </div>
          </div>

          <div className="text-center px-4">
            <p className="text-xs text-slate-500 font-medium">Questions about how we process your data?</p>
            <a
              href="mailto:privacy@layerly.cloud"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors mt-2"
            >
              <Mail className="w-4 h-4" /> Contact us
            </a>
          </div>
        </aside>

        <div className="flex-1 w-full min-w-0 bg-white rounded-3xl p-6 sm:p-10 lg:p-16 shadow-sm border border-slate-200">
          <div className="space-y-8 animate-in fade-in duration-300">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4" /> Last updated: {lastUpdated}
            </p>
            <article className="prose prose-slate max-w-none text-slate-700 space-y-6 leading-relaxed [&_h1]:text-3xl [&_h1]:sm:text-4xl [&_h1]:font-black [&_h1]:text-slate-900 [&_h1]:tracking-tight [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:pb-2 [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:bg-indigo-50 [&_blockquote]:py-4 [&_blockquote]:px-6 [&_blockquote]:rounded-r-2xl [&_blockquote]:my-6 [&_blockquote]:text-indigo-800 [&_blockquote]:text-sm [&_blockquote]:font-medium [&_a]:text-indigo-600 [&_a]:font-bold [&_a]:hover:underline">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
