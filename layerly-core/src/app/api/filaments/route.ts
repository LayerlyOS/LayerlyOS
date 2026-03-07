import { and, asc, count, desc, eq, ilike, isNotNull, isNull, or, type SQL } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { filaments, globalFilaments } from '@/db/schema';
import { getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    // If no user (public/unauth), maybe return empty or unauthorized?
    // Current app seems to require auth.
    // However, if we want to support public calculator mode later, we might need to handle this.
    // For now, assume auth required for warehouse.

    // Allow fetching without user? No, warehouse is private.
    if (!user) {
      // Return empty array or unauthorized
      return unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const brandParam = searchParams.get('brand') || '';
    const sort = searchParams.get('sort') || 'brand';
    const order = searchParams.get('order') || 'asc';

    console.log(
      `[API Warehouse] Request: page=${page}, limit=${limit}, search="${search}", brand="${brandParam}", sort=${sort}, order=${order}`
    );

    const offset = (page - 1) * limit;

    const whereConditions: (SQL | undefined)[] = [
      eq(filaments.userId, user.id),
      isNull(filaments.deletedAt),
    ];

    if (brandParam) {
      whereConditions.push(ilike(filaments.brand, brandParam));
    }

    if (search) {
      whereConditions.push(
        or(
          ilike(filaments.brand, `%${search}%`),
          ilike(filaments.materialName, `%${search}%`),
          ilike(filaments.color, `%${search}%`)
        )
      );
    }

    const orderBy = [];
    if (sort === 'brand') {
      orderBy.push(order === 'asc' ? asc(filaments.brand) : desc(filaments.brand));
      orderBy.push(asc(filaments.materialName));
      orderBy.push(asc(filaments.color));
    } else if (sort === 'material') {
      orderBy.push(order === 'asc' ? asc(filaments.materialName) : desc(filaments.materialName));
      orderBy.push(asc(filaments.brand));
      orderBy.push(asc(filaments.color));
    } else if (sort === 'price') {
      orderBy.push(order === 'asc' ? asc(filaments.spoolPrice) : desc(filaments.spoolPrice));
      orderBy.push(asc(filaments.brand));
    } else if (sort === 'weight') {
      orderBy.push(
        order === 'asc' ? asc(filaments.remainingWeight) : desc(filaments.remainingWeight)
      );
      orderBy.push(asc(filaments.brand));
    } else if (sort === 'date') {
      orderBy.push(order === 'asc' ? asc(filaments.createdAt) : desc(filaments.createdAt));
    } else {
      orderBy.push(asc(filaments.brand));
      orderBy.push(asc(filaments.materialName));
    }

    const [filamentsData, totalResult] = await Promise.all([
      db.query.filaments.findMany({
        where: and(...whereConditions),
        orderBy: orderBy,
        limit: limit,
        offset: offset,
      }),
      db
        .select({ count: count() })
        .from(filaments)
        .where(and(...whereConditions)),
    ]);

    const total = totalResult[0]?.count || 0;

    // Populate missing colorHex from Global Catalog
    const enrichedFilaments = await Promise.all(
      filamentsData.map(async (f) => {
        if (!f.colorHex) {
          // Try to find in global catalog - Exact match first
          let globalMatch = await db.query.globalFilaments.findFirst({
            where: and(
              ilike(globalFilaments.brand, f.brand),
              ilike(globalFilaments.materialName, f.materialName),
              ilike(globalFilaments.color, f.color),
              isNotNull(globalFilaments.colorHex)
            ),
            columns: { colorHex: true },
          });

          // If no exact match, try to match the first color if multiple are listed (e.g. "Black / Red")
          if (!globalMatch?.colorHex) {
            // Split by common separators: , / + &
            const firstColor = f.color.split(/[,/+&]/)[0].trim();

            if (firstColor && firstColor !== f.color) {
              globalMatch = await db.query.globalFilaments.findFirst({
                where: and(
                  ilike(globalFilaments.brand, f.brand),
                  ilike(globalFilaments.materialName, f.materialName),
                  ilike(globalFilaments.color, firstColor),
                  isNotNull(globalFilaments.colorHex)
                ),
                columns: { colorHex: true },
              });
            }
          }

          if (globalMatch?.colorHex) {
            return { ...f, colorHex: globalMatch.colorHex };
          }
        }
        return f;
      })
    );

    console.log(`[API Warehouse] Found ${filamentsData.length} items (total: ${total})`);

    return NextResponse.json({
      data: enrichedFilaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching filaments:', error);
    return serverError();
  }
}

import type { SubscriptionTier } from '@/config/subscription';
import { getEffectivePlan } from '@/lib/plans';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    // Check Subscription Limits
    const userTier = user.subscriptionTier as SubscriptionTier;
    const plan = await getEffectivePlan(userTier);

    if (plan.maxFilaments !== -1) {
      const countResult = await db
        .select({ count: count() })
        .from(filaments)
        .where(and(eq(filaments.userId, user.id), isNull(filaments.deletedAt)));

      const currentCount = countResult[0]?.count || 0;

      if (currentCount >= plan.maxFilaments) {
        return new NextResponse(
          JSON.stringify({
            error: `Filament limit reached for plan ${plan.name}. Upgrade account to add more.`,
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const body = (await req.json()) as {
      materialName: string;
      brand: string;
      color: string;
      colorHex?: string;
      spoolPrice?: string | number;
      spoolWeight?: string | number;
      density?: string;
      notes?: string;
      image?: string;
      materialType?: string;
    };
    const {
      materialName,
      brand,
      color,
      colorHex,
      density,
      notes,
      image,
      materialType,
    } = body;

    const spoolPriceNum =
      typeof body.spoolPrice === 'number'
        ? body.spoolPrice
        : parseFloat(String(body.spoolPrice ?? ''));
    const spoolWeightNum =
      typeof body.spoolWeight === 'number'
        ? body.spoolWeight
        : parseFloat(String(body.spoolWeight ?? ''));
    const spoolPrice = Number.isFinite(spoolPriceNum) && spoolPriceNum >= 0 ? spoolPriceNum : 0;
    const spoolWeight =
      Number.isFinite(spoolWeightNum) && spoolWeightNum > 0 ? spoolWeightNum : 1000;
    const costPerGram = spoolWeight > 0 ? spoolPrice / spoolWeight : 0;

    const [filament] = await db
      .insert(filaments)
      .values({
        userId: user.id,
        materialName,
        brand,
        color,
        colorHex: colorHex || null,
        image: image || null,
        materialType: materialType || null,
        spoolPrice,
        spoolWeight,
        remainingWeight: spoolWeight,
        density: density ? parseFloat(String(density)) : null,
        costPerGram,
        notes: notes || null,
      })
      .returning();

    await logger.create(user, 'FILAMENT', filament.id, { brand, material: materialName, color });

    return NextResponse.json(filament, { status: 201 });
  } catch (error) {
    console.error('Error creating filament:', error);
    return serverError();
  }
}
