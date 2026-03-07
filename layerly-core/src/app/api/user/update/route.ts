import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { badRequest, getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { notifier } from '@/lib/notifications';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return badRequest('Name is required');
    }

    const updatedUserResult = await db
      .update(userProfiles)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, user.id))
      .returning();

    const updatedUser = updatedUserResult[0];

    await logger.update(user, 'USER', user.id, {
      action: 'UPDATE_PROFILE',
      changes: { name: name.trim() },
    });

    // Notify user about profile update
    await notifier.info(
      user.id,
      'Profile updated',
      'Your profile details have been successfully updated.'
    );

    return Response.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return serverError();
  }
}
