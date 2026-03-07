'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppFooter } from '@/components/layout/AppFooter';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  LifeBuoy,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'Technical support',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        topic: 'Technical support',
        message: '',
      });
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-500 selection:text-white flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                Layerly<span className="text-indigo-600">.</span>{' '}
                <span className="text-slate-500 font-medium">Contact</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Support &amp; help
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
              href="/login"
              className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none mb-2">
                Contact us
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Questions about the platform or your 3D print farm? We’re here to help.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200">
              <h3 className="text-xl font-black text-slate-900 mb-6">
                Send a message
              </h3>

              {isSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 mb-8">
                  <div className="bg-emerald-100 p-2 rounded-xl shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 mb-1">
                      Message sent successfully!
                    </h4>
                    <p className="text-sm text-emerald-800 font-medium">
                      Thank you for getting in touch. Our team will respond as soon
                      as possible (usually within 24 hours).
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Full name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. John Smith"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="john@company.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Subject
                  </label>
                  <div className="relative">
                    <select
                      value={formData.topic}
                      onChange={(e) =>
                        setFormData({ ...formData, topic: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Technical support">
                        Technical support (Issues / Problems)
                      </option>
                      <option value="Partnership">
                        Partnership inquiry (B2B)
                      </option>
                      <option value="Billing and plans">
                        Billing and plans (Invoices / Upgrade)
                      </option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Describe your issue or question in detail..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                Contact information
              </h3>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-indigo-600 flex items-center justify-center shrink-0 border border-slate-100">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Support email</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      support@layerly.cloud
                    </p>
                    <a
                      href="mailto:support@layerly.cloud"
                      className="text-xs font-bold text-indigo-600 hover:underline mt-2 inline-block"
                    >
                      Email us
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-indigo-600 flex items-center justify-center shrink-0 border border-slate-100">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Phone</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      +48 500 600 700
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Enterprise plan customers only.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-indigo-600 flex items-center justify-center shrink-0 border border-slate-100">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Headquarters</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      12 Technologiczna St.
                      <br />
                      00-001 Warsaw, Poland
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-40 pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-indigo-400" />
                <h3 className="font-bold text-lg">Support hours</h3>
              </div>
              <p className="text-sm text-slate-300 font-medium mb-6">
                Our team responds to inquiries during the following hours:
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Monday – Friday</span>
                  <span className="font-bold">08:00 – 18:00</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Saturday</span>
                  <span className="font-bold text-slate-300">10:00 – 14:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sunday</span>
                  <span className="font-bold text-indigo-400">Closed</span>
                </div>
              </div>
            </div>

            <Link
              href="/help"
              className="block bg-indigo-50 border border-indigo-100 rounded-2xl p-6 sm:p-8 hover:border-indigo-200 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900 mb-1">Help center</h3>
                  <p className="text-sm text-indigo-700/80 font-medium mb-2">
                    Find answers in our knowledge base before reaching out.
                  </p>
                  <span className="text-xs font-black text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Go to FAQ <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
