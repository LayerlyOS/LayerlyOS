import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, userProfiles } from '@/db/schema';
import { badRequest, getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';
import { type NotifyType, notifier } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !user.isAdmin) return unauthorized();

    const body = await req.json();
    const { target, userId, type, title, message, link } = body;

    if (!type || !title || !message || !target) {
      return badRequest('Missing required fields');
    }

    if (target === 'all') {
      const allUsers = await db.select({ id: userProfiles.id }).from(userProfiles);

      // We can use createMany but we need to map over users.
      // Drizzle insert().values() is efficient.
      const newNotifications = allUsers.map((u) => ({
        userId: u.id,
        type: type as string,
        title,
        message,
        link: link || null,
        isRead: false,
      }));

      await db.insert(notifications).values(newNotifications);
    } else if (target === 'user') {
      if (!userId) return badRequest('User ID is required for targeted notification');

      await notifier.send({
        userId,
        type: type as NotifyType,
        title,
        message,
        link,
      });
    } else {
      return badRequest('Invalid target');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return serverError();
  }
}
