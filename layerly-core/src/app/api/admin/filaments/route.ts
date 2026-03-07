import { desc, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { filaments } from '@/db/schema';
import { forbidden, getUserFromRequest, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    if (!user.isAdmin) return forbidden('Only administrator has access');

    const filamentsList = await db.query.filaments.findMany({
      where: isNull(filaments.deletedAt),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            name: true,
          },
        },
        printEntries: {
          columns: {
            id: true,
          },
        },
      },
      orderBy: [desc(filaments.createdAt)],
    });

    // Transform to match Prisma structure with _count
    const result = filamentsList.map((f) => ({
      ...f,
      _count: {
        printEntries: f.printEntries.length,
      },
      printEntries: undefined, // Clean up response
    }));

    return Response.json(result);
  } catch (error) {
    console.error('Error fetching admin filaments:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
