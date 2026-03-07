import { and, eq, isNotNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { printEntries } from '@/db/schema';
import { getUserFromRequest, notFound, serverError, unauthorized } from '@/lib/api-auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const { id } = await params;

    const print = await db.query.printEntries.findFirst({
      where: and(
        eq(printEntries.id, id),
        eq(printEntries.userId, user.id),
        isNotNull(printEntries.deletedAt)
      ),
    });

    if (!print) return notFound('Print not found in trash');

    await db.delete(printEntries).where(eq(printEntries.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting print:', error);
    return serverError();
  }
}
