import { and, asc, eq, isNull, ne } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { filaments } from '@/db/schema';
import { getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorized();
    }

    const brands = await db
      .selectDistinct({ brand: filaments.brand })
      .from(filaments)
      .where(
        and(eq(filaments.userId, user.id), isNull(filaments.deletedAt), ne(filaments.brand, ''))
      )
      .orderBy(asc(filaments.brand));

    // Filter out nulls explicitly if needed, though type says string
    const uniqueBrands = brands.map((b) => b.brand).filter((b) => b && b.trim().length > 0);

    return NextResponse.json(uniqueBrands);
  } catch (error) {
    console.error('Error fetching filament brands:', error);
    return serverError();
  }
}
