'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bell, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useNotifications } from './NotificationProvider';

const icons = {
  INFO: <Info className="w-5 h-5 text-blue-500" />,
  SUCCESS: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  WARNING: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  ERROR: <XCircle className="w-5 h-5 text-rose-500" />,
  SYSTEM: <Bell className="w-5 h-5 text-slate-500" />,
};

const bgColors = {
  INFO: 'bg-blue-50',
  SUCCESS: 'bg-emerald-50',
  WARNING: 'bg-amber-50',
  ERROR: 'bg-rose-50',
  SYSTEM: 'bg-slate-50',
};

// Hardcoded translations map for notification keys
const notificationTranslations: Record<string, string> = {
  'notifications.print_added.title': 'New print added',
  'notifications.print_added.message': 'Print "{name}" has been added to history.',
  'notifications.profile_updated.title': 'Profile updated',
  'notifications.profile_updated.message': 'Your profile data has been successfully updated.',
  'dashboard.printsDetails.details': 'Details',
};

export function NotificationIsland() {
  const { latestNotification, clearLatestNotification, markAsRead } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  const getLocalizedContent = (text: string) => {
    try {
      // Handle JSON format {key: '...', params: {...}}
      if (text.startsWith('{') && text.endsWith('}')) {
        const data = JSON.parse(text);
        if (data.key) {
          let translated = notificationTranslations[data.key] || data.key;
          // Simple param replacement
          if (data.params) {
            Object.entries(data.params).forEach(([paramKey, paramValue]) => {
              translated = translated.replace(`{${paramKey}}`, String(paramValue));
            });
          }
          return translated;
        }
      }
      
      // Handle direct keys
      if (!text.includes(' ') && text.includes('.')) {
        return notificationTranslations[text] || text;
      }
      
      return text;
    } catch (_e) {
      return text;
    }
  };

  useEffect(() => {
    if (latestNotification) {
      setIsVisible(true);

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(clearLatestNotification, 500); // Wait for exit animation
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [latestNotification, clearLatestNotification]);

  const handleClick = () => {
    if (!latestNotification) return;

    markAsRead(latestNotification.id);
    if (latestNotification.link) {
      router.push(latestNotification.link);
    }
    setIsVisible(false);
    setTimeout(clearLatestNotification, 500);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(clearLatestNotification, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && latestNotification && (
        <div className="fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none">
          <motion.div
            initial={{ y: -100, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -20, scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto relative max-w-md w-full mx-4"
          >
            <div
              className={`
                relative flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl 
                backdrop-blur-xl border border-white/20 
                bg-white/90 dark:bg-slate-900/90 w-full
                ring-1 ring-black/5 hover:scale-[1.02] active:scale-[0.98] transition-transform text-left
                overflow-hidden
              `}
            >
              {/* Main Action Button - covers entire card */}
              <button
                type="button"
                onClick={handleClick}
                className="absolute inset-0 w-full h-full cursor-pointer z-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-2xl"
                aria-label={getLocalizedContent(latestNotification.title)}
              />

              {/* Content - sits above button but allows clicks to pass through (conceptually, but visually we need it visible) */}
              <div className="relative z-10 flex items-center gap-3 w-full pointer-events-none">
                <div
                  className={`p-2 rounded-full flex-shrink-0 ${bgColors[latestNotification.type as keyof typeof bgColors] || 'bg-slate-100'}`}
                >
                  {icons[latestNotification.type as keyof typeof icons] || icons.INFO}
                </div>

                <div className="flex-1 min-w-0 mr-6">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {getLocalizedContent(latestNotification.title)}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {getLocalizedContent(latestNotification.message)}
                  </p>
                </div>
              </div>

              {/* Close Button - highest z-index */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer pointer-events-auto"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
