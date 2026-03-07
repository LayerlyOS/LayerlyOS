import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { printEntries } from '@/db/schema';
import { getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const deletedPrints = await db.query.printEntries.findMany({
      where: and(eq(printEntries.userId, user.id), isNotNull(printEntries.deletedAt)),
      with: {
        printer: true,
        filament: true,
        order: {
          columns: {
            title: true,
          },
        },
      },
      orderBy: [desc(printEntries.deletedAt)],
    });

    return Response.json(deletedPrints);
  } catch (error) {
    console.error('Error fetching trash:', error);
    return serverError();
  }
}
