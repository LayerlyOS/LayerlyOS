import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { filaments } from '@/db/schema';
import {
  notFound,
  requireAuth,
  requireOwnership,
  serverError,
} from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);

    const { id } = await params;
    const filament = await db.query.filaments.findFirst({ where: eq(filaments.id, id) });
    if (!filament) return notFound('Filament not found');

    // Check ownership using helper function
    requireOwnership(user, filament.userId, id);

    return NextResponse.json(filament);
  } catch (error) {
    // If error is Response (from requireAuth/requireOwnership), return it
    if (error instanceof Response) {
      return error;
    }
    console.error('Error fetching filament:', error);
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);

    const { id } = await params;
    const filament = await db.query.filaments.findFirst({ where: eq(filaments.id, id) });

    if (!filament) return notFound('Filament not found');
    
    // Check ownership using helper function
    requireOwnership(user, filament.userId, id);

    const body = (await req.json()) as {
      materialName: string;
      brand: string;
      color: string;
      colorHex?: string;
      spoolPrice: string | number;
      spoolWeight: string | number;
      density?: string | number;
      notes?: string;
      remainingWeight?: string | number;
      image?: string;
      materialType?: string;
    };
    const {
      materialName,
      brand,
      color,
      colorHex,
      spoolPrice,
      spoolWeight,
      density,
      notes,
      remainingWeight,
      image,
      materialType,
    } = body;

    const data: Partial<typeof filaments.$inferInsert> = {
      materialName,
      brand,
      color,
      colorHex: colorHex || null,
      image: image || null,
      materialType: materialType || null,
      spoolPrice: parseFloat(Number(spoolPrice).toFixed(2)),
      spoolWeight: parseFloat(Number(spoolWeight).toFixed(2)),
      density: density ? Number(density) : null,
      costPerGram: Number(spoolPrice) / Number(spoolWeight),
      notes: notes || null,
    };

    if (remainingWeight !== undefined) {
      data.remainingWeight = parseFloat(Number(remainingWeight).toFixed(2));
    }

    const updatedResult = await db
      .update(filaments)
      .set(data)
      .where(eq(filaments.id, id))
      .returning();

    const updated = updatedResult[0];

    await logger.update(user, 'FILAMENT', id, {
      name: `${brand} ${materialName}`,
      changes: { materialName, brand, color, spoolPrice, spoolWeight },
    });

    return NextResponse.json(updated);
  } catch (error) {
    // If error is Response (from requireAuth/requireOwnership), return it
    if (error instanceof Response) {
      return error;
    }
    console.error('Error updating filament:', error);
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);

    const { id } = await params;
    const filament = await db.query.filaments.findFirst({ where: eq(filaments.id, id) });

    if (!filament) return notFound('Filament not found');
    
    // Check ownership using helper function
    requireOwnership(user, filament.userId, id);

    // Soft delete
    await db.update(filaments).set({ deletedAt: new Date() }).where(eq(filaments.id, id));

    await logger.delete(user, 'FILAMENT', id, {
      name: `${filament.brand} ${filament.materialName}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // If error is Response (from requireAuth/requireOwnership), return it
    if (error instanceof Response) {
      return error;
    }
    console.error('Error deleting filament:', error);
    return serverError();
  }
}
