import { and, asc, count, desc, ilike, or } from 'drizzle-orm';
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const brandParam = searchParams.get('brand') || '';
    const typeParam = searchParams.get('type') || '';
    const sort = searchParams.get('sort') || 'brand';
    const order = searchParams.get('order') || 'asc';

    console.log(
      `[API Global] Request: page=${page}, limit=${limit}, search="${search}", brand="${brandParam}", type="${typeParam}", sort=${sort}, order=${order}`
    );

    const offset = (page - 1) * limit;

    const whereConditions: Parameters<typeof and>[0][] = [];

    if (brandParam) {
      whereConditions.push(ilike(globalFilaments.brand, brandParam));
    }

    if (search) {
      whereConditions.push(
        or(
          ilike(globalFilaments.brand, `%${search}%`),
          ilike(globalFilaments.materialName, `%${search}%`),
          ilike(globalFilaments.color, `%${search}%`)
        )!
      );
    }

    if (typeParam) {
      whereConditions.push(
        or(
          ilike(globalFilaments.materialType, `%${typeParam}%`),
          ilike(globalFilaments.materialName, `%${typeParam}%`)
        )!
      );
    }

    const orderBy = [];
    if (sort === 'brand') {
      orderBy.push(order === 'asc' ? asc(globalFilaments.brand) : desc(globalFilaments.brand));
      orderBy.push(asc(globalFilaments.materialName));
    } else if (sort === 'material') {
      orderBy.push(
        order === 'asc' ? asc(globalFilaments.materialName) : desc(globalFilaments.materialName)
      );
      orderBy.push(asc(globalFilaments.brand));
    } else if (sort === 'color') {
      orderBy.push(order === 'asc' ? asc(globalFilaments.color) : desc(globalFilaments.color));
      orderBy.push(asc(globalFilaments.brand));
    } else {
      orderBy.push(asc(globalFilaments.brand));
      orderBy.push(asc(globalFilaments.materialName));
    }

    const [globalFilamentsData, totalResult] = await Promise.all([
      db.query.globalFilaments.findMany({
        where: and(...whereConditions),
        orderBy: orderBy,
        limit: limit,
        offset: offset,
      }),
      db
        .select({ count: count() })
        .from(globalFilaments)
        .where(and(...whereConditions)),
    ]);

    const total = totalResult[0]?.count || 0;

    console.log(`[API Global] Found ${globalFilamentsData.length} items (total: ${total})`);

    return NextResponse.json({
      data: globalFilamentsData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching global filaments:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !user.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    // Basic validation
    if (!body.brand || !body.materialName || !body.color) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const [filament] = await db
      .insert(globalFilaments)
      .values({
        brand: body.brand,
        materialName: body.materialName,
        materialType: body.materialType,
        color: body.color,
        colorHex: body.colorHex,
        spoolWeight: body.spoolWeight,
        spoolPrice: body.spoolPrice,
        density: body.density,
        diameter: body.diameter,
        printTempMin: body.printTempMin,
        printTempMax: body.printTempMax,
        bedTemp: body.bedTemp,
        printSpeed: body.printSpeed,
        fanSpeed: body.fanSpeed,
        flowRatio: body.flowRatio,
        mechanicalProps: body.mechanicalProps,
        applications: body.applications,
        website: body.website,
        image: body.image,
      })
      .returning();

    return NextResponse.json(filament);
  } catch (error) {
    console.error('Error creating global filament:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
