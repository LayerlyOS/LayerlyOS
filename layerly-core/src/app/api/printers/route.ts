import { and, count, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { printers } from '@/db/schema';
import { forbidden, getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { getEffectivePlan } from '@/lib/plans';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const rows = await db.query.printers.findMany({
      where: eq(printers.userId, user.id),
      orderBy: [desc(printers.createdAt)],
      with: { currentMaterial: true },
    });

    const result = rows.map((p) => ({
      ...p,
      material: p.currentMaterial
        ? {
            id: p.currentMaterial.id,
            materialName: p.currentMaterial.materialName,
            materialType: p.currentMaterial.materialType,
            color: p.currentMaterial.color,
            colorHex: p.currentMaterial.colorHex,
          }
        : null,
      currentMaterial: undefined,
    }));

    return Response.json(result);
  } catch (error) {
    console.error('Error fetching printers:', error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    // Check limit
    const plan = await getEffectivePlan(user.subscriptionTier);
    if (plan.maxPrinters !== -1) {
      const countResult = await db
        .select({ count: count() })
        .from(printers)
        .where(eq(printers.userId, user.id));

      const currentCount = countResult[0]?.count || 0;

      if (currentCount >= plan.maxPrinters) {
        return forbidden(
          'Printer limit reached for your plan. Upgrade account to add more.'
        );
      }
    }

    const body = await req.json();
    const {
      name,
      model,
      type,
      status,
      location,
      ipAddress,
      lastMaintenance,
      notes,
      currentMaterialId,
      power,
      costPerHour,
      purchaseDate,
      isDefault,
    } = body;

    if (!name?.trim()) {
      return Response.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db
        .update(printers)
        .set({ isDefault: false })
        .where(and(eq(printers.userId, user.id), eq(printers.isDefault, true)));
    }

    const [printer] = await db
      .insert(printers)
      .values({
        userId: user.id,
        name: name.trim(),
        model: model?.trim() || null,
        type: type === 'SLA' || type === 'SLS' ? type : 'FDM',
        status: status === 'in_use' || status === 'maintenance' ? status : 'available',
        location: location?.trim() || null,
        ipAddress: ipAddress?.trim() || null,
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
        notes: notes?.trim() || null,
        currentMaterialId: currentMaterialId || null,
        power: typeof power === 'number' ? power : parseInt(power, 10) || 200,
        costPerHour: costPerHour != null && costPerHour !== '' ? parseFloat(costPerHour) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        isDefault: !!isDefault,
      })
      .returning();

    await logger.create(user, 'PRINTER', printer.id, { name: printer.name, model: printer.model });

    return Response.json(printer, { status: 201 });
  } catch (error) {
    console.error('Error creating printer:', error);
    return serverError();
  }
}
