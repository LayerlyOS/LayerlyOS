'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Archive, Bell, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatDate } from '@/lib/format';
import { useNotifications } from './NotificationProvider';

// Hardcoded translations map for notification keys
const notificationTranslations: Record<string, string> = {
  'notifications.print_added.title': 'New print added',
  'notifications.print_added.message': 'Print "{name}" has been added to history.',
  'notifications.profile_updated.title': 'Profile updated',
  'notifications.profile_updated.message': 'Your profile data has been successfully updated.',
  'dashboard.printsDetails.details': 'Details',
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5 z-50 overflow-hidden"
            style={{ transformOrigin: 'top right' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100/50 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-xs text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 opacity-20" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50/50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        group relative p-4 hover:bg-slate-50/80 transition-colors
                        ${!notification.isRead ? 'bg-blue-50/30' : ''}
                      `}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-blue-500' : 'bg-slate-200'}`}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <h4
                              className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}
                            >
                              {getLocalizedContent(notification.title)}
                            </h4>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                              {formatDate(notification.createdAt, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {getLocalizedContent(notification.message)}
                          </p>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              onClick={() => markAsRead(notification.id)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
                            >
                              View details <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100/50 bg-slate-50/50 text-center">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                View archive
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
