'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CustomSlider } from '@/components/ui/CustomSlider';
import { PricingSection } from '@/components/landing/PricingSection';
import { AppFooter } from '@/components/layout/AppFooter';
import { Logo } from '@/components/layout/Logo';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { formatCurrency } from '@/lib/format';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const twoFactorRequired = !!(session as any)?.twoFactorRequired;
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStartupOffer, setShowStartupOffer] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  // Demo Calculator State
  const [demoPrice, setDemoPrice] = useState(20);
  const [demoWeight, setDemoWeight] = useState(150); // g
  const [demoTime, setDemoTime] = useState(8); // h
  const [demoElectricity, setDemoElectricity] = useState(0.15);
  const demoPower = 150; // W (average printer)

  const demoMaterialCost = (demoWeight / 1000) * demoPrice;
  const demoEnergyCost = ((demoTime * demoPower) / 1000) * demoElectricity;
  const demoTotalCost = demoMaterialCost + demoEnergyCost;
  const demoSuggestedPrice = demoTotalCost * 3; // 200% margin

  // Handle scroll for navbar styling and back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Redirects
  useEffect(() => {
    if (userId) {
      // Check user settings for preferred language before redirecting
      fetch('/api/settings')
        .then((res) => (res.ok ? res.json() : null))
        .then(() => {
           // Always redirect to dashboard, ignoring language settings
           router.replace('/dashboard');
        })
        .catch(() => router.replace('/dashboard'));
    }
  }, [userId, router]);

  useEffect(() => {
    if (!isPending && !userId && twoFactorRequired) router.replace('/two-factor');
  }, [isPending, router, twoFactorRequired, userId]);

  useEffect(() => {
    if (!isPending && !userId) {
      try {
        if (sessionStorage.getItem('postLogoutRedirect') === '1') {
          sessionStorage.removeItem('postLogoutRedirect');
        }
      } catch {}
    }
  }, [userId, isPending]);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('startup_offer_dismissed_v1') === '1';
      if (!dismissed) setShowStartupOffer(true);
    } catch {
      setShowStartupOffer(true);
    }
  }, []);

  useEffect(() => {
    if (!showStartupOffer) {
      setBannerHeight(0);
      return;
    }

    const element = bannerRef.current;
    if (!element) return;

    const updateHeight = () => {
      setBannerHeight(element.offsetHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, [showStartupOffer]);

  // Animation Variants
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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      <AnimatePresence>
        {showStartupOffer && (
          <motion.div
            key="startup-offer"
            ref={bannerRef}
            initial={{ opacity: 0, y: -48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -48 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-x-0 top-0 z-[60] overflow-hidden bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
          >
            {/* Animated Background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 8,
                ease: 'linear',
                repeat: Infinity,
              }}
              style={{ backgroundSize: '200% 200%' }}
            />

            {/* Shine Effect */}
            <motion.div
              className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%]"
              animate={{ backgroundPosition: ['100% 100%', '0% 0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex min-h-[44px] items-center justify-between gap-4 py-2">
                <div className="flex flex-1 items-center gap-3 overflow-hidden">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-lg shadow-inner">
                    🎉
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white sm:text-[15px]">
                      <span className="font-bold text-white/90">Starter offer:</span>{' '}
                      <span className="text-white">Get a PRO account 50% cheaper forever.</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-3">
                  <Link
                    href="/login?mode=register&promo=pro50"
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-4 py-1.5 text-sm font-bold text-indigo-600 shadow-md transition-transform hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10">Claim discount</span>
                    <div className="absolute inset-0 bg-indigo-50 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>

                  <button
                    type="button"
                    aria-label="Close offer"
                    onClick={() => {
                      setShowStartupOffer(false);
                      try {
                        localStorage.setItem('startup_offer_dismissed_v1', '1');
                      } catch {}
                    }}
                    className="group -mr-2 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white"
                  >
                    <i className="fa-solid fa-xmark text-lg transition-transform group-hover:rotate-90"></i>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ top: bannerHeight }}
        className={`fixed inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/50 py-3 shadow-sm'
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 w-40 sm:w-48 hover:opacity-80 transition-opacity"
          >
            <Logo variant="dark" />
          </Link>

          {/* Links (Center) */}
          <div className="hidden md:flex items-center justify-center gap-8 flex-1">
            <a
              href="#features"
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              FAQ
            </a>
          </div>

          {/* Buttons (Right) */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <Link
              href="/login"
              className="px-3 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login?mode=register"
              className="px-5 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 active:scale-95"
            >
              Create account
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-2xl`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-slate-600 hover:text-blue-600 py-2"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-slate-600 hover:text-blue-600 py-2"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-slate-600 hover:text-blue-600 py-2"
                >
                  FAQ
                </a>
                <hr className="border-slate-100" />
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-slate-600 hover:text-slate-900 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/login?mode=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20"
                >
                  Create account
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply animate-blob" />
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />
          <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Column: Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0"
            >
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                New version 2.0 available
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]"
              >
                Stop guessing your prices.
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Start earning on 3D printing
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-slate-600 mb-8 lg:mb-10 leading-relaxed"
              >
                For hobbyists, print farms and service bureaus. Accurately calculate material, energy and time costs in a single app.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href="/login?mode=register"
                    className="w-full block text-center px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                  >
                    Start for free
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <a
                    href="#features"
                    className="w-full block text-center px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all hover:border-slate-300"
                  >
                    Explore features
                  </a>
                </motion.div>
              </motion.div>

              <motion.p
                variants={fadeInUp}
                className="mt-6 text-sm text-slate-500 flex items-center justify-center lg:justify-start gap-2"
              >
                <i className="fa-solid fa-users text-blue-500"></i>
                <span className="font-medium">Join beta testers and shape the product</span>
              </motion.p>
            </motion.div>

            {/* Right Column: Interactive Calculator Demo */}
            <motion.div
              id="demo"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-20 w-full max-w-lg mx-auto lg:max-w-none"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden border border-slate-100 ring-1 ring-slate-900/5">
                {/* Controls */}
                <div className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-calculator text-blue-600"></i>
                    Quick quote
                  </h3>

                  <div className="space-y-6">
                    <CustomSlider
                      label="Filament price"
                      value={demoPrice}
                      onChange={setDemoPrice}
                      min={30}
                      max={200}
                      step={1}
                      valueSuffix=" $/kg"
                    />
                    <CustomSlider
                      label="Print weight"
                      value={demoWeight}
                      onChange={setDemoWeight}
                      min={10}
                      max={1000}
                      step={10}
                      valueSuffix=" g"
                    />
                    <CustomSlider
                      label="Print time"
                      value={demoTime}
                      onChange={setDemoTime}
                      min={1}
                      max={48}
                      step={1}
                      valueSuffix=" h"
                    />
                    <CustomSlider
                      label="Electricity price"
                      value={demoElectricity}
                      onChange={setDemoElectricity}
                      min={0.5}
                      max={2}
                      step={0.01}
                      valueSuffix=" $/kWh"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="p-6 sm:p-8 bg-white relative overflow-hidden">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                        Material
                      </div>
                      <div className="text-lg font-bold text-slate-700">
                        {demoMaterialCost.toFixed(2)} $
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                        Energy
                      </div>
                      <div className="text-lg font-bold text-slate-700">
                        {demoEnergyCost.toFixed(2)} $
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-blue-100 text-sm font-medium">
                        Production cost
                      </span>
                      <span className="text-xl font-bold opacity-80">
                        {demoTotalCost.toFixed(2)} $
                      </span>
                    </div>
                    <div className="h-px bg-white/20 my-3"></div>
                    <div className="flex justify-between items-end">
                      <span className="text-white font-bold">Suggested price</span>
                      <span className="text-3xl font-extrabold text-white">
                        {demoSuggestedPrice.toFixed(2)} $
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-10 border-y border-slate-100 bg-white/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wider">
            We support files and settings from:
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-xl font-bold font-mono text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-cube"></i> Cura
            </span>
            <span className="text-xl font-bold font-sans text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-layer-group"></i> PrusaSlicer
            </span>
            <span className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-box-open"></i> Bambu Studio
            </span>
            <span className="text-xl font-bold font-mono text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-code"></i> Orca Slicer
            </span>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4"
            >
              Everything you need to run your printing
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600">
              Whether you print as a hobby or run a 3D farm – our tools save you time and money.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: 'fa-file-import',
                color: 'text-orange-600',
                bg: 'bg-orange-100',
                title: 'GCODE / 3MF import',
                desc: 'Load files directly from the slicer. We automatically read print time and weight.',
              },
              {
                icon: 'fa-calculator',
                color: 'text-blue-600',
                bg: 'bg-blue-100',
                title: 'Precise calculator',
                desc: 'Takes into account weight, time, power usage (kWh), machine depreciation and post‑processing costs.',
              },
              {
                icon: 'fa-cubes',
                color: 'text-indigo-600',
                bg: 'bg-indigo-100',
                title: 'Filament warehouse',
                desc: 'Track spool usage in real time. The system automatically subtracts weight after each print.',
              },
              {
                icon: 'fa-chart-line',
                color: 'text-green-600',
                bg: 'bg-green-100',
                title: 'Stats and reports',
                desc: 'Analyse which prints are most profitable. Export history to PDF or Excel.',
              },
              {
                icon: 'fa-print',
                color: 'text-purple-600',
                bg: 'bg-purple-100',
                title: 'Multiple printers',
                desc: 'Configure parameters per printer – different power usage and operating costs.',
              },
              {
                icon: 'fa-mobile-screen',
                color: 'text-pink-600',
                bg: 'bg-pink-100',
                title: 'Mobile access',
                desc: 'Responsive interface lets you price jobs from your phone, wherever you are.',
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-6`}
                >
                  <i className={`fa-solid ${feature.icon} ${feature.color} text-xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Interface Preview Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Text Side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 space-y-8"
            >
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Your print farm under full control
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">We designed the interface so that key information is always at hand. Quick access to recent quotes, filament stock and profit stats.</p>

              <div className="space-y-4">
                {[
                  {
                    title: 'Profit control',
                    desc: 'Know exactly how much you earn on every print.',
                  },
                  {
                    title: 'Order history',
                    desc: 'Build a quote database and revisit it with a single click.',
                  },
                  {
                    title: 'Availability',
                    desc: 'Quote from any device, wherever you are.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <i className="fa-solid fa-check text-blue-600 text-xs"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  href="/login?mode=register"
                  className="inline-flex items-center text-blue-600 font-bold hover:text-blue-700 transition-colors"
                >
                  See live demo <i className="fa-solid fa-arrow-right ml-2"></i>
                </Link>
              </div>
            </motion.div>

            {/* Visual Side (CSS Mockup - Dashboard Preview) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 relative"
            >
              <div className="relative rounded-xl bg-slate-900 p-2 shadow-2xl shadow-blue-900/20 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="rounded-lg bg-slate-50 overflow-hidden border border-slate-200">
                  {/* Browser Header */}
                  <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    </div>
                    <div className="ml-4 px-3 py-0.5 bg-white rounded-md text-[10px] text-slate-400 font-medium flex-1 text-center border border-slate-200 truncate">
                      app.3dprintmaster.com/dashboard
                    </div>
                  </div>

                  {/* Fake App Content */}
                  <div className="flex h-[400px]">
                    {/* Fake Sidebar */}
                    <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-6 hidden sm:flex">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        3D
                      </div>
                      <div className="space-y-4 w-full px-4">
                        <div className="w-full aspect-square rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <i className="fa-solid fa-house text-sm"></i>
                        </div>
                        <div className="w-full aspect-square rounded-lg text-slate-400 hover:bg-slate-50 flex items-center justify-center">
                          <i className="fa-solid fa-calculator text-sm"></i>
                        </div>
                        <div className="w-full aspect-square rounded-lg text-slate-400 hover:bg-slate-50 flex items-center justify-center">
                          <i className="fa-solid fa-cubes text-sm"></i>
                        </div>
                        <div className="w-full aspect-square rounded-lg text-slate-400 hover:bg-slate-50 flex items-center justify-center">
                          <i className="fa-solid fa-chart-pie text-sm"></i>
                        </div>
                      </div>
                      <div className="mt-auto w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div>
                    </div>

                    {/* Fake Main Area */}
                    <div className="flex-1 bg-slate-50/50 p-6 overflow-hidden flex flex-col">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">
                            Dashboard
                          </h3>
                          <p className="text-xs text-slate-500">Welcome back, Erwin!</p>
                        </div>
                        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm">
                          <i className="fa-solid fa-calendar mr-2 text-slate-400"></i>
                          Last 30 days
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                            Revenue
                          </div>
                          <div className="text-lg font-bold text-slate-800">
                            {formatCurrency(2450)}
                          </div>
                          <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                            <i className="fa-solid fa-arrow-trend-up"></i> +12%
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                            Prints
                          </div>
                          <div className="text-lg font-bold text-slate-800">142</div>
                          <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                            <i className="fa-solid fa-arrow-trend-up"></i> +5%
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                            Filament
                          </div>
                          <div className="text-lg font-bold text-slate-800">-4.2 kg</div>
                          <div className="text-[10px] text-slate-400 font-bold">
                            Usage
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity Mockup */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                          <h4 className="font-bold text-slate-700 text-xs">
                            Recent quotes
                          </h4>
                          <div className="text-blue-600 text-[10px] font-bold">
                            View all
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          {[
                            {
                              name: 'Monitor mount v2',
                              cost: 45.2,
                              status: 'completed',
                              color: 'bg-green-100 text-green-700',
                            },
                            {
                              name: 'Raspberry Pi case',
                              cost: 12.5,
                              status: 'pending',
                              color: 'bg-amber-100 text-amber-700',
                            },
                            {
                              name: 'Dragon figurine',
                              cost: 89.0,
                              status: 'draft',
                              color: 'bg-slate-100 text-slate-600',
                            },
                          ].map((item) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}
                                >
                                  <i className="fa-solid fa-cube text-xs"></i>
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-700">
                                    {item.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    PLA • 2h 15m
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-slate-900">
                                  {formatCurrency(item.cost)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl shadow-blue-900/10 animate-bounce">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <i className="fa-solid fa-arrow-trend-up"></i>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-semibold uppercase">
                      Profit
                    </div>
                    <div className="text-lg font-bold text-slate-900">+127%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4"
            >
              From quote to profit in 3 steps
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600">
              We simplified quoting so you can focus on printing.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 relative"
          >
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 z-0"></div>

            {[
              {
                step: '01',
                title: 'Add materials',
                desc: 'Define your filaments and purchase costs. The system remembers them for later.',
                icon: 'fa-box-open',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                step: '02',
                title: 'Upload a file',
                desc: 'Drag & drop G‑code or enter parameters manually. The calculator estimates usage.',
                icon: 'fa-file-arrow-up',
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
              },
              {
                step: '03',
                title: 'Professional offer',
                desc: 'Generate a PDF offer for your client and save the quote to order history.',
                icon: 'fa-sack-dollar',
                color: 'text-purple-600',
                bg: 'bg-purple-50',
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeInUp}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div
                  className={`w-24 h-24 ${item.bg} rounded-3xl rotate-3 group-hover:rotate-6 transition-transform duration-300 flex items-center justify-center mb-8 shadow-sm border border-slate-100`}
                >
                  <i className={`fa-solid ${item.icon} ${item.color} text-3xl`}></i>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed max-w-xs">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">
              Frequently asked questions
            </h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-4"
          >
            {[
              {
                q: 'Is the app free?',
                a: 'Yes! The basic hobby plan is completely free and allows unlimited quotes. We plan to introduce a PRO plan for businesses with advanced reports in the future.',
              },
              {
                q: 'Are my data and projects safe?',
                a: 'Yes, your G‑code files are analysed on the fly (locally in the browser) and are never shared. Your intellectual property (IP) is fully protected.',
              },
              {
                q: 'Can I use it on my phone?',
                a: 'Of course. The panel is fully responsive (PWA), so you can quote jobs right next to the printer.',
              },
              {
                q: 'Which printers are supported?',
                a: 'All of them! You can define parameters for any FDM printer (Bambu Lab, Prusa, Creality, Voron etc.) by specifying its power usage and depreciation cost.',
              },
            ].map((faq) => (
              <motion.div
                key={faq.q}
                variants={fadeInUp}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 transition-colors cursor-default"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    ?
                  </span>
                  {faq.q}
                </h3>
                <p className="text-slate-600 pl-9 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 z-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600 blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-purple-600 blur-3xl opacity-20"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-4 relative z-10 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Start pricing like a pro
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Join users who keep full control over their print costs. Signing up takes less than a minute.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xs sm:max-w-none mx-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/login?mode=register"
                className="w-full px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 flex items-center justify-center"
              >
                Create a free account
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/login"
                className="w-full px-8 py-3 sm:py-4 bg-transparent border border-slate-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-slate-800 transition hover:border-slate-500 flex items-center justify-center"
              >
                Log in
              </Link>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-slate-400 text-sm flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-users text-blue-400"></i>
            <span>Join beta testers and shape the product</span>
          </motion.p>
        </motion.div>
      </section>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <i className="fa-solid fa-arrow-up"></i>
          </motion.button>
        )}
      </AnimatePresence>

      <AppFooter />
    </div>
  );
}