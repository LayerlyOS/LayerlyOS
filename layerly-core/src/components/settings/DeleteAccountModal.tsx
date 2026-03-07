'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/ToastProvider';
import { X } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const { success, error } = useToast();

  const CONTROL_WORD = 'DELETE';

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setInputValue('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(CONTROL_WORD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (inputValue !== CONTROL_WORD) return;

    setLoading(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      success('Account deleted successfully');
      onClose();
      // Force reload/redirect to ensure session is cleared
      window.location.href = '/';
    } catch (_err) {
      error('Failed to delete account');
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-red-100"
          >
            <div className="absolute top-4 right-4 z-20">
              <IconButton
                onClick={onClose}
                variant="ghost"
                icon={X}
                size="sm"
                className="rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              />
            </div>

            {/* Header with WOW effect - pulsing warning */}
            <div className="bg-red-50 p-6 flex flex-col items-center justify-center border-b border-red-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5" />
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 relative z-10 shadow-inner">
                <motion.i
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 10, scale: 1.1 }}
                  transition={{
                    repeat: Infinity,
                    repeatType: 'reverse',
                    duration: 1.5,
                  }}
                  className="fa-solid fa-triangle-exclamation text-3xl text-red-600"
                />
              </div>
              <h3 className="text-xl font-bold text-red-900 text-center relative z-10">
                Are you sure you want to delete your account?
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                <i className="fa-solid fa-circle-info mr-2" />
                This action cannot be undone. This will permanently delete your account and all associated data (projects, quotes, settings).
              </div>

              <div className="space-y-3">
                <label
                  htmlFor="delete-confirm-input"
                  className="block text-sm font-medium text-slate-700"
                >
                  To confirm, type the word below:
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-mono text-sm">
                        <i className="fa-solid fa-keyboard" />
                      </span>
                    </div>
                    <input
                      id="delete-confirm-input"
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className={`
                        block w-full pl-10 pr-3 py-2.5 sm:text-sm border rounded-lg focus:ring-2 focus:outline-none transition-all
                        ${
                          inputValue === CONTROL_WORD
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-200 bg-green-50/30'
                            : 'border-slate-300 focus:border-red-500 focus:ring-red-200'
                        }
                      `}
                      placeholder="Type DELETE"
                    />
                    {inputValue === CONTROL_WORD && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-600"
                      >
                        <i className="fa-solid fa-check-circle" />
                      </motion.div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0 w-[120px] overflow-hidden relative"
                    title="Copy DELETE"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copied ? (
                        <motion.span
                          key="copied"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.2 }}
                          className="text-green-600 flex items-center justify-center gap-2 absolute inset-0 w-full h-full"
                        >
                          <i className="fa-solid fa-check" /> Copied!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ opacity: 0, y: -15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-center gap-2 absolute inset-0 w-full h-full"
                        >
                          <i className="fa-regular fa-copy" /> Copy
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={inputValue !== CONTROL_WORD || loading}
                isLoading={loading}
                className={`
                  transition-all duration-300
                  ${inputValue === CONTROL_WORD ? 'shadow-lg shadow-red-500/30 scale-105' : 'opacity-50 grayscale'}
                `}
              >
                Permanently delete account
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
