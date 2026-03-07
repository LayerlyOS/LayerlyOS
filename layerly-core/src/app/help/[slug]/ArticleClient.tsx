'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { AppFooter } from '@/components/layout/AppFooter';
import type { HelpArticle } from '@/lib/help-content';
import {
  ChevronLeft,
  Clock,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

function extractTocFromMarkdown(md: string): { id: string; label: string }[] {
  const re = /^## (.+)$/gm;
  const items: { id: string; label: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const label = m[1] ?? '';
    const id = label
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    if (id) items.push({ id, label });
  }
  return items;
}

export function ArticleClient({ article }: { article: HelpArticle }) {
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);
  const { meta, content } = article;
  const toc = extractTocFromMarkdown(content);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top nav breadcrumb */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link
            href="/help"
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Help Center
          </Link>
          <div className="mx-4 h-4 w-px bg-slate-300" />
          <span className="text-sm font-medium text-slate-400 truncate">
            {meta.categoryLabel}
          </span>
        </div>
      </div>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 shrink-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main column */}
          <div className="lg:col-span-8">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 mb-6">
                <BookOpen className="w-4 h-4" />
                {meta.categoryLabel}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                {meta.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-medium text-slate-500 border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs text-slate-600">
                    {meta.authorInitials}
                  </div>
                  <span className="text-slate-700">{meta.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Updated: {meta.updated}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {meta.readingTimeMin} min read
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200 space-y-8 text-base sm:text-lg text-slate-600 leading-relaxed">
              <article className="prose-help">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2
                        id={(children as string)
                          ?.toLowerCase()
                          ?.replace(/\s+/g, '-')
                          ?.replace(/[^a-z0-9-]/g, '')}
                        className="text-2xl font-bold text-slate-900 mt-12 mb-4"
                      >
                        {children}
                      </h2>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 space-y-2 mt-4 marker:text-indigo-500">
                        {children}
                      </ul>
                    ),
                    blockquote: ({ children }) => (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4 my-8">
                        <div className="bg-indigo-100 p-2 rounded-xl shrink-0">
                          <span className="text-indigo-600 font-bold text-sm">
                            !
                          </span>
                        </div>
                        <div className="[&_p]:mb-0 [&_strong]:text-indigo-900 **:text-indigo-800 **:text-sm **:font-medium">
                          {children}
                        </div>
                      </div>
                    ),
                    pre: ({ children }) => (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 my-8">
                        <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-sm font-mono overflow-x-auto shadow-inner [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
                          {children}
                        </pre>
                      </div>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isBlock = className?.includes('language-');
                      if (isBlock)
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      return (
                        <code
                          className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </article>
            </div>

            {/* Feedback widget */}
            <div className="mt-10 bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
              {feedbackGiven ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Thanks for your feedback!
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Your input helps us improve our documentation.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Was this article helpful?
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Let us know what you think.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setFeedbackGiven('yes')}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                    >
                      <ThumbsUp className="w-5 h-5" /> Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackGiven('no')}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                    >
                      <ThumbsDown className="w-5 h-5" /> No
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
            {toc.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  In this article
                </h3>
                <nav className="space-y-3">
                  {toc.map((item, i) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm font-medium border-l-2 pl-3 transition-colors hover:border-slate-300 ${
                        i === 0
                          ? 'font-bold text-indigo-600 border-indigo-600'
                          : 'text-slate-500 hover:text-slate-800 border-transparent'
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {meta.related.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Related topics
                </h3>
                <div className="space-y-4">
                  {meta.related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/help/${r.slug}`}
                      className="group block"
                    >
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {r.title}
                      </h4>
                      {r.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {r.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-30 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-white font-bold mb-2">
                  Still have a problem?
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Our 3D print experts can help you set up your farm quoting.
                </p>
                <Link
                  href="/contact"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Contact us
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
