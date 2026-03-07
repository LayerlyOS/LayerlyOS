import type { NextRequest } from 'next/server';
import { badRequest, getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';
import { type NotifyType, notifier } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !user.isAdmin) return unauthorized();

    const body = await req.json();
    const { type, title, message, link } = body;

    if (!type || !title || !message) {
      return badRequest('Missing required fields');
    }

    await notifier.send({
      userId: user.id, // Send to self
      type: type as NotifyType,
      title,
      message,
      link,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return serverError();
  }
}
