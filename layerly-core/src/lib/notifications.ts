import { db } from '@/db';
import { notifications } from '@/db/schema';

export type NotifyType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM';

interface SendNotificationParams {
  userId: string;
  type: NotifyType;
  title: string;
  message: string;
  link?: string;
}

export const notifier = {
  /**
   * Sends a notification to a specific user.
   */
  send: async ({ userId, type, title, message, link }: SendNotificationParams) => {
    try {
      await db.insert(notifications).values({
        userId,
        type,
        title,
        message,
        link,
        isRead: false,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't throw, notifications shouldn't break the main flow
    }
  },

  info: async (userId: string, title: string, message: string, link?: string) => {
    return notifier.send({ userId, type: 'INFO', title, message, link });
  },

  success: async (userId: string, title: string, message: string, link?: string) => {
    return notifier.send({ userId, type: 'SUCCESS', title, message, link });
  },

  warning: async (userId: string, title: string, message: string, link?: string) => {
    return notifier.send({ userId, type: 'WARNING', title, message, link });
  },

  error: async (userId: string, title: string, message: string, link?: string) => {
    return notifier.send({ userId, type: 'ERROR', title, message, link });
  },

  system: async (userId: string, title: string, message: string, link?: string) => {
    return notifier.send({ userId, type: 'SYSTEM', title, message, link });
  },
};
