import { and, eq, isNotNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { printEntries } from '@/db/schema';
import { getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    await db
      .delete(printEntries)
      .where(and(eq(printEntries.userId, user.id), isNotNull(printEntries.deletedAt)));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error emptying trash:', error);
    return serverError();
  }
}
