import { and, count, desc, eq, ne } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { printEntries, printers } from '@/db/schema';
import {
  badRequest,
  getUserFromRequest,
  notFound,
  serverError,
  unauthorized,
} from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const { id } = await params;

    const printer = await db.query.printers.findFirst({
      where: and(eq(printers.id, id), eq(printers.userId, user.id)),
    });

    if (!printer) return notFound('Printer not found');

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
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db
        .update(printers)
        .set({ isDefault: false })
        .where(
          and(eq(printers.userId, user.id), eq(printers.isDefault, true), ne(printers.id, id))
        );
    }

    const [updated] = await db
      .update(printers)
      .set({
        name: name.trim(),
        model: model?.trim() || null,
        type: type === 'SLA' || type === 'SLS' ? type : 'FDM',
        status: status === 'in_use' || status === 'maintenance' ? status : 'available',
        location: location?.trim() || null,
        ipAddress: ipAddress?.trim() || null,
        lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
        notes: notes?.trim() || null,
        currentMaterialId: currentMaterialId || null,
        power: typeof power === 'number' ? power : parseInt(power, 10) ?? printer.power,
        costPerHour: costPerHour != null && costPerHour !== '' ? parseFloat(costPerHour) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        isDefault: !!isDefault,
      })
      .where(eq(printers.id, id))
      .returning();

    await logger.update(user, 'PRINTER', id, {
      name: printer.name,
      changes: { name, model, power, costPerHour, purchaseDate, notes, isDefault },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating printer:', error);
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const { id } = await params;

    const printer = await db.query.printers.findFirst({
      where: and(eq(printers.id, id), eq(printers.userId, user.id)),
    });

    if (!printer) return notFound('Printer not found');

    // Check if there's only one printer
    const [printerCount] = await db
      .select({ value: count() })
      .from(printers)
      .where(eq(printers.userId, user.id));

    if (printerCount.value <= 1) {
      return badRequest('You cannot delete the last printer');
    }

    // Get another printer to reassign prints to
    const otherPrinter = await db.query.printers.findFirst({
      where: and(eq(printers.userId, user.id), ne(printers.id, id)),
      orderBy: [desc(printers.isDefault)], // Prefer default printer
    });

    if (otherPrinter) {
      // Reassign all prints from this printer to another printer
      await db
        .update(printEntries)
        .set({ printerId: otherPrinter.id })
        .where(and(eq(printEntries.printerId, id), eq(printEntries.userId, user.id)));
    }

    await db.delete(printers).where(eq(printers.id, id));

    await logger.delete(user, 'PRINTER', id, { name: printer.name });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting printer:', error);
    return serverError();
  }
}
