import { asc, ne } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { globalFilaments } from '@/db/schema';
import { getUserFromRequest } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const brands = await db
      .selectDistinct({ brand: globalFilaments.brand })
      .from(globalFilaments)
      .where(ne(globalFilaments.brand, ''))
      .orderBy(asc(globalFilaments.brand));

    const uniqueBrands = brands.map((b) => b.brand).filter((b) => b && b.trim().length > 0);

    return NextResponse.json(uniqueBrands);
  } catch (error) {
    console.error('Error fetching global filament brands:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
