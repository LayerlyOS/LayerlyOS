import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const result = await db.select().from(userSettings).where(eq(userSettings.userId, user.id));

    let settings = result[0];

    // Create default settings if they don't exist
    if (!settings) {
      const inserted = await db
        .insert(userSettings)
        .values({
          userId: user.id,
          energyRate: 1.15,
          useGravatar: true,
          language: 'en',
          lowStockAlertPercent: 20,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      settings = inserted[0];
    }

    return Response.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const body = await req.json();
    const { energyRate, defaultPrinterId, useGravatar, language, lowStockAlertPercent } = body;

    const updateData: Partial<typeof userSettings.$inferInsert> = {
      energyRate: energyRate ? parseFloat(energyRate) : undefined,
      defaultPrinterId: defaultPrinterId || null,
      useGravatar: useGravatar !== undefined ? !!useGravatar : undefined,
      language: language || undefined,
      lowStockAlertPercent:
        lowStockAlertPercent !== undefined
          ? Math.min(100, Math.max(0, parseInt(String(lowStockAlertPercent), 10) || 20))
          : undefined,
      updatedAt: new Date(),
    };

    // Clean undefined values
    for (const key of Object.keys(updateData)) {
      const k = key as keyof typeof updateData;
      if (updateData[k] === undefined) {
        delete updateData[k];
      }
    }

    const lowStockVal =
      lowStockAlertPercent !== undefined
        ? Math.min(100, Math.max(0, parseInt(String(lowStockAlertPercent), 10) || 20))
        : 20;
    const inserted = await db
      .insert(userSettings)
      .values({
        userId: user.id,
        energyRate: energyRate ? parseFloat(energyRate) : 1.15,
        defaultPrinterId: defaultPrinterId || null,
        useGravatar: useGravatar !== undefined ? !!useGravatar : true,
        language: language || 'en',
        lowStockAlertPercent: lowStockVal,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: updateData,
      })
      .returning();

    return Response.json(inserted[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    return serverError();
  }
}
