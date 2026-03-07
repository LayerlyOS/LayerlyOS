import { eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { filaments } from '@/db/schema';
import { getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    // Update all filaments where remainingWeight is null
    // Set it to spoolWeight
    const filamentsList = await db.query.filaments.findMany({
      where: isNull(filaments.remainingWeight),
    });

    await db.transaction(async (tx) => {
      for (const f of filamentsList) {
        await tx
          .update(filaments)
          .set({ remainingWeight: f.spoolWeight })
          .where(eq(filaments.id, f.id));
      }
    });

    return Response.json({
      success: true,
      message: `Updated ${filamentsList.length} filaments`,
    });
  } catch (error) {
    console.error('Error fixing weights:', error);
    return serverError();
  }
}
