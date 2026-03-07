import { and, eq, isNull } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { filaments, globalFilaments } from '@/db/schema';
import { getUserFromRequest } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !user.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 1. Populate GlobalFilament from existing Filaments
    const existingFilaments = await db.query.filaments.findMany({
      where: isNull(filaments.userId),
      columns: {
        materialName: true,
        brand: true,
        color: true,
        spoolPrice: true,
        spoolWeight: true,
        density: true,
      },
    });

    // Create unique global entries
    const uniqueFilaments = new Map();
    existingFilaments.forEach((f) => {
      const key = `${f.materialName}-${f.brand}-${f.color}`;
      if (!uniqueFilaments.has(key)) {
        uniqueFilaments.set(key, f);
      }
    });

    let globalCreated = 0;
    for (const f of uniqueFilaments.values()) {
      // Check if exists
      const exists = await db.query.globalFilaments.findFirst({
        where: and(
          eq(globalFilaments.materialName, f.materialName),
          eq(globalFilaments.brand, f.brand),
          eq(globalFilaments.color, f.color)
        ),
      });

      if (!exists) {
        await db.insert(globalFilaments).values({
          materialName: f.materialName,
          brand: f.brand,
          color: f.color,
          spoolPrice: f.spoolPrice,
          spoolWeight: f.spoolWeight,
          density: f.density,
        });
        globalCreated++;
      }
    }

    // 2. Assign existing filaments to users
    // Strategy: If a filament is used in a print, assign to that user.
    // If not used, assign to the current admin.

    const unassignedFilaments = await db.query.filaments.findMany({
      where: isNull(filaments.userId),
      with: {
        printEntries: true,
      },
    });

    let assigned = 0;
    for (const f of unassignedFilaments) {
      let targetUserId = user.id; // Default to admin

      if (f.printEntries.length > 0) {
        // Use the user of the most recent print
        // printEntries is an array, we can just pick the first one if we assume they belong to same user or just pick one.
        // The original code used f.printEntries[0].userId.
        targetUserId = f.printEntries[0].userId;
      }

      await db.update(filaments).set({ userId: targetUserId }).where(eq(filaments.id, f.id));
      assigned++;
    }

    return NextResponse.json({
      success: true,
      globalCreated,
      filamentsAssigned: assigned,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
