'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { NewsletterForm } from './NewsletterForm';
import { Sparkles, Calculator, Boxes, TrendingUp, Timer } from 'lucide-react';

export function ComingSoon() {
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div id="top" className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/50 py-3 shadow-sm'
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0 w-40 sm:w-48">
            <Logo variant="dark" />
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex flex-col items-center">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply animate-blob transform-gpu" />
          <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-100/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000 transform-gpu" />
          <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-purple-100/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000 transform-gpu" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center gap-16 lg:gap-24">
          {/* Top: Text Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-4xl mx-auto flex flex-col items-center"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Coming Soon
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]"
            >
              Professional 3D Printing
              <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600">
                Cost Estimation
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-slate-600 mb-8 lg:mb-10 leading-relaxed max-w-2xl"
            >
              The ultimate OS for print farms and makers. Manage filaments, quote orders, and optimize profits in one place.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="w-full max-w-md mx-auto"
            >
              <div id="waitlist">
                <NewsletterForm />
              </div>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="mt-8 text-sm text-slate-500 flex items-center justify-center gap-2 font-medium"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                Created by{' '}
                <a
                  className="group relative inline-flex items-center gap-2 text-slate-800 hover:text-slate-950 font-semibold transition-colors"
                  href="https://erwinowak.dev"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="pb-0.5 bg-[linear-gradient(90deg,rgba(37,99,235,0.85),rgba(79,70,229,0.85),rgba(147,51,234,0.85))] bg-no-repeat bg-bottom-left bg-size-[200%_2px] group-hover:bg-bottom-right transition-[background-position] duration-500">
                    erwinowak.dev
                  </span>
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400/0 group-hover:bg-indigo-400/70 group-hover:animate-ping transition-colors" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400/40 group-hover:bg-indigo-500" />
                  </span>
                </a>
              </span>
            </motion.p>
          </motion.div>

          {/* Bottom: Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative z-20 w-full max-w-7xl mx-auto"
          >
            <div className="relative">
              <div className="absolute inset-0 -z-10 bg-linear-to-b from-blue-100/60 via-indigo-100/40 to-transparent blur-3xl rounded-4xl" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Value props */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shrink-0">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Quote jobs in seconds</h3>
                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                          Material, power, and labor — in one repeatable workflow you can trust.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Stay on top of filament</h3>
                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                          Inventory, consumption, and forecasting — without spreadsheets or manual math.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Protect your margin</h3>
                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                          Consistent pricing rules and cost visibility help you keep profits predictable.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shrink-0">
                        <Timer className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Less order chaos</h3>
                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                          Fast quoting plus simple reporting — built for farms and makers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats / mini CTA */}
                <div className="lg:col-span-4">
                  <div className="h-full rounded-2xl border border-slate-200/70 bg-linear-to-b from-slate-900 to-slate-950 text-white p-6 shadow-sm overflow-hidden relative">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/25 blur-3xl rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />

                    <div className="relative">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Early access
                      </div>

                      <h3 className="mt-4 text-xl font-extrabold tracking-tight">
                        Join the waitlist for early access
                      </h3>
                      <p className="mt-2 text-sm text-white/70 leading-relaxed">
                        No spam. One email when we launch, plus a few key updates.
                      </p>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                          <div className="text-2xl font-extrabold">~1 min</div>
                          <div className="text-xs text-white/70 mt-1">typical quote</div>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                          <div className="text-2xl font-extrabold">24/7</div>
                          <div className="text-xs text-white/70 mt-1">cloud access</div>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                          <div className="text-2xl font-extrabold">+%</div>
                          <div className="text-xs text-white/70 mt-1">margin control</div>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                          <div className="text-2xl font-extrabold">EN</div>
                          <div className="text-xs text-white/70 mt-1">language</div>
                        </div>
                      </div>

                      <div className="mt-6 text-xs text-white/60">
                        Tip: scroll up and join the waitlist.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10">
        <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
        <div className="bg-white/70 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div className="max-w-md">
                <div className="w-44 sm:w-48 text-slate-900">
                  <Logo variant="dark" />
                </div>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Professional tools for print farms and makers — estimate costs, manage inventory, and grow margins.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                <div className="space-y-3">
                  <div className="text-xs font-semibold tracking-wide uppercase text-slate-500">Product</div>
                  <ul className="space-y-2 text-sm">
                    <li><a className="text-slate-600 hover:text-slate-900 transition-colors" href="#top">Overview</a></li>
                    <li><a className="text-slate-600 hover:text-slate-900 transition-colors" href="#waitlist">Waitlist</a></li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="text-xs font-semibold tracking-wide uppercase text-slate-500">Company</div>
                  <ul className="space-y-2 text-sm">
                    <li><Link className="text-slate-600 hover:text-slate-900 transition-colors" href="/">Home</Link></li>
                    <li><a className="text-slate-600 hover:text-slate-900 transition-colors" href="/login">Login</a></li>
                  </ul>
                </div>
                <div className="space-y-3 col-span-2 sm:col-span-1">
                  <div className="text-xs font-semibold tracking-wide uppercase text-slate-500">Status</div>
                  <p className="text-sm text-slate-600">
                    Coming soon. Join the waitlist to get early access.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} Layerly.cloud. All rights reserved.
              </p>
              <p className="text-xs text-slate-500">
                Created by{' '}
                <a
                  className="group relative inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
                  href="https://erwinowak.dev"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="pb-0.5 bg-[linear-gradient(90deg,rgba(37,99,235,0.8),rgba(79,70,229,0.8),rgba(147,51,234,0.8))] bg-no-repeat bg-bottom-left bg-size-[200%_2px] group-hover:bg-bottom-right transition-[background-position] duration-500">
                    erwinowak.dev
                  </span>
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400/0 group-hover:bg-indigo-400/60 group-hover:animate-ping transition-colors" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400/35 group-hover:bg-indigo-500" />
                  </span>
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
