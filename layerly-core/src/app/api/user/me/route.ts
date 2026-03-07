import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(req);
    if (!sessionUser) return unauthorized();

    const full = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, sessionUser.id),
      columns: {
        id: true,
        email: true,
        name: true,
        image: true,
        isAdmin: true,
        role: true,
        subscriptionTier: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!full) return unauthorized();

    return Response.json(full);
  } catch (error) {
    console.error('Error fetching user:', error);
    return serverError();
  }
}
