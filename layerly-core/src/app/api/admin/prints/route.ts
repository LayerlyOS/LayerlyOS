import { desc, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { printEntries } from '@/db/schema';
import { forbidden, getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    if (!user.isAdmin) return forbidden('Only administrator has access');

    const prints = await db.query.printEntries.findMany({
      where: isNull(printEntries.deletedAt),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
          with: {
            settings: true,
          },
        },
        printer: true,
        filament: true,
      },
      orderBy: [desc(printEntries.date)],
    });

    return Response.json(prints);
  } catch (error) {
    console.error('Error fetching admin prints:', error);
    return serverError();
  }
}
