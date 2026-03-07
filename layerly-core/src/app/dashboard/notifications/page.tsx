'use client';

import { DataLoader } from '@/components/ui/DataLoader';
import { PageHeader } from '@/components/ui/PageHeader';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  type Notification,
  useNotifications,
} from '@/components/notifications/NotificationProvider';
import { formatDate } from '@/lib/format';

// Hardcoded translations map
const notificationTranslations: Record<string, string> = {
  'notifications.print_added.title': 'New print added',
  'notifications.print_added.message': 'Print "{name}" has been added to history.',
  'notifications.profile_updated.title': 'Profile updated',
  'notifications.profile_updated.message': 'Your profile data has been successfully updated.',
  'dashboard.printsDetails.details': 'Details',
  'notifications.markRead': 'Mark as read',
};

// --- Components ---

const NotificationIcon = ({ type }: { type: string }) => {
  const baseClasses = 'w-6 h-6';

  switch (type) {
    case 'SUCCESS':
      return (
        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
          <CheckCircle2 className={`${baseClasses} text-emerald-500`} />
        </div>
      );
    case 'WARNING':
      return (
        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
          <AlertTriangle className={`${baseClasses} text-amber-500`} />
        </div>
      );
    case 'ERROR':
      return (
        <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
          <XCircle className={`${baseClasses} text-rose-500`} />
        </div>
      );
    case 'SYSTEM':
      return (
        <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
          <Sparkles className={`${baseClasses} text-indigo-500`} />
        </div>
      );
    default:
      return (
        <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
          <Bell className={`${baseClasses} text-indigo-500`} />
        </div>
      );
  }
};

const BentoCard = ({
  notification,
  markAsRead,
  getLocalizedContent,
}: {
  notification: Notification;
  markAsRead: (id: string) => void;
  getLocalizedContent: (text: string) => string;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02, translateY: -2, transition: { duration: 0.2 } }}
      className="relative group bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[200px]"
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-5">
          <NotificationIcon type={notification.type} />
          <span className="text-xs font-bold tracking-wide text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {formatDate(notification.createdAt, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <h3 className="font-bold text-xl text-slate-900 leading-snug mb-3">
          {getLocalizedContent(notification.title)}
        </h3>

        <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
          {getLocalizedContent(notification.message)}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between mt-8 pt-4 border-t border-slate-50">
        {notification.link ? (
          <Link
            href={notification.link}
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors group/link"
            onClick={() => markAsRead(notification.id)}
          >
            Details
            <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
          </Link>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            markAsRead(notification.id);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-600 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
        >
          <Check className="w-3.5 h-3.5" />
          Mark as read
        </button>
      </div>
    </motion.div>
  );
};

const HistoryRow = ({
  notification,
  getLocalizedContent,
}: {
  notification: Notification;
  getLocalizedContent: (text: string) => string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-5 p-5 rounded-2xl bg-white hover:bg-slate-50 transition-all group border border-slate-100 shadow-sm"
    >
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-9">
          <p className="text-base font-bold text-slate-900 truncate mb-0.5">
            {getLocalizedContent(notification.title)}
          </p>
          <p className="text-sm text-slate-500 truncate">
            {getLocalizedContent(notification.message)}
          </p>
        </div>
        <div className="md:col-span-3 text-right md:text-right text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
          {formatDate(notification.createdAt, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead, markAsRead, isLoading } = useNotifications();

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

  const { unread, read } = useMemo(() => {
    return {
      unread: notifications.filter((n) => !n.isRead),
      read: notifications.filter((n) => n.isRead),
    };
  }, [notifications]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <DataLoader message="Loading data..." minHeight="full" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Alerts and history"
        icon={<Bell className="w-6 h-6" />}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark all as read
            </button>
          ) : undefined
        }
      />
      <div className="flex items-center gap-6 text-sm font-bold text-slate-500 mt-4 mb-16">
        <span
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${unreadCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
        >
          <Zap className={`w-4 h-4 ${unreadCount > 0 ? 'fill-current' : ''}`} />
          {unreadCount} Needs Attention
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        <span className="flex items-center gap-2 text-slate-500">
          <Archive className="w-4 h-4" />
          {read.length} History Log
        </span>
      </div>

      {/* Bento Grid - Unread */}
      <div className="mb-20">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
            Needs Attention
          </h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        {unread.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {unread.map((notification) => (
                <BentoCard
                  key={notification.id}
                  notification={notification}
                  markAsRead={markAsRead}
                  getLocalizedContent={getLocalizedContent}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center"
          >
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
              <Sparkles className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              All caught up! No new notifications.
            </h3>
            <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
              You have no new notifications. Enjoy the silence.
            </p>
          </motion.div>
        )}
      </div>

      {/* History List */}
      <div>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
            History Log
          </h2>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        <div className="space-y-3">
          {read.length > 0 ? (
            read.map((notification) => (
              <HistoryRow
                key={notification.id}
                notification={notification}
                getLocalizedContent={getLocalizedContent}
              />
            ))
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No notifications</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
