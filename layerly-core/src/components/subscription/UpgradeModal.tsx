'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crown, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function UpgradeModal({ isOpen, onClose, title, description }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header Graphic */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/grid.svg')]"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Crown className="w-8 h-8 text-yellow-300" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {title || 'Upgrade to PRO'}
              </h2>
              <p className="text-blue-100">
                {description || 'Unlock all features to manage your printing business efficiently.'}
              </p>
            </div>

            <IconButton
              onClick={onClose}
              icon={X}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            />
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">
                    Unlimited inventory
                  </h4>
                  <p className="text-sm text-slate-500">
                    Add any number of filaments without limits.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">
                    Professional PDF quotes
                  </h4>
                  <p className="text-sm text-slate-500">
                    Generate client quotes with a single click.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">
                    Client management
                  </h4>
                  <p className="text-sm text-slate-500">
                    Keep track of your customers and their orders.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Maybe later
              </Button>
              <Link href="/pricing" className="flex-1 block">
                <Button variant="primary" fullWidth>
                  Upgrade to PRO
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
