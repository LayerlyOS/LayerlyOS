'use client';

import { usePathname } from 'next/navigation';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  latestNotification: Notification | null;
  clearLatestNotification: () => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const lastFetchRef = useRef<number>(0);

  // Poll for notifications every 30 seconds
  const fetchNotifications = useCallback(async (silent = false) => {
    // Avoid fetching too often
    const now = Date.now();
    if (silent && now - lastFetchRef.current < 5000) return;

    lastFetchRef.current = now;

    try {
      if (!silent) setIsLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();

        // Check for new notifications to show popup
        if (data.notifications.length > 0) {
          const latest = data.notifications[0];
          // If we have a new notification that is newer than our current latest state
          setNotifications((prev) => {
            if (prev.length > 0 && latest.id !== prev[0].id && !latest.isRead) {
              setLatestNotification(latest);
            } else if (prev.length === 0 && data.notifications.length > 0 && !latest.isRead) {
              // Initial load - don't show popup unless it's very recent (e.g. last 10 seconds)
              const notifTime = new Date(latest.createdAt).getTime();
              if (Date.now() - notifTime < 10000) {
                setLatestNotification(latest);
              }
            }
            return data.notifications;
          });
        } else {
          setNotifications([]);
        }

        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Polling interval
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh when pathname changes (user navigation might trigger updates)
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is used to trigger re-fetch
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications, pathname]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (error) {
      console.error('Error marking as read', error);
      fetchNotifications(true); // Revert on error
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await fetch('/api/notifications', { method: 'POST' });
    } catch (error) {
      console.error('Error marking all as read', error);
      fetchNotifications(true);
    }
  };

  const clearLatestNotification = () => {
    setLatestNotification(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        latestNotification,
        clearLatestNotification,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
