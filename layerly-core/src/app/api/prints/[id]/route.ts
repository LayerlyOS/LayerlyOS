import { and, eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { filaments, orders, printEntries, printers } from '@/db/schema';
import {
  badRequest,
  getUserFromRequest,
  notFound,
  serverError,
  unauthorized,
} from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(_req);
    if (!user) return unauthorized();

    const { id } = await params;

    const print = await db.query.printEntries.findFirst({
      where: and(eq(printEntries.id, id), eq(printEntries.userId, user.id)),
      with: {
        printer: true,
        filament: true,
        order: {
          columns: {
            id: true,
            title: true,
            customerName: true,
            status: true,
          },
        },
      },
    });

    if (!print) return notFound('Print not found');
    return NextResponse.json(print);
  } catch (error) {
    console.error('Error fetching print:', error);
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const { id } = await params;

    const print = await db.query.printEntries.findFirst({
      where: and(eq(printEntries.id, id), eq(printEntries.userId, user.id)),
    });

    if (!print) return notFound('Print not found');

    const body = await req.json();
    const {
      printerId,
      filamentId,
      orderId,
      name,
      brand,
      color,
      weight,
      timeH,
      timeM,
      qty,
      price,
      profit,
      totalCost,
      extraCost,
      manualPrice,
      advancedSettings,
      calculatorSnapshot,
      status,
      operatorName,
      notes,
      errorReason,
    } = body;

    // Ensure printer exists if provided
    let actualPrinterId = printerId ? String(printerId) : null;
    if (actualPrinterId) {
      const printerExists = await db.query.printers.findFirst({
        where: and(eq(printers.id, actualPrinterId), eq(printers.userId, user.id)),
      });

      if (!printerExists) {
        return badRequest('Selected printer does not exist');
      }
    }

    const hasOrderId = Object.prototype.hasOwnProperty.call(body, 'orderId');
    let actualOrderId: string | null = null;
    if (hasOrderId) {
      const rawOrderId = orderId === undefined ? null : orderId;
      if (rawOrderId === null) {
        actualOrderId = null;
      } else {
        const normalized = String(rawOrderId).trim();
        actualOrderId = normalized.length > 0 ? normalized : null;
      }

      if (actualOrderId) {
        const order = await db.query.orders.findFirst({
          where: and(eq(orders.id, actualOrderId), eq(orders.userId, user.id)),
          columns: { id: true },
        });
        if (!order) return badRequest('Order not found');
      }
    }

    const safeParseFloat = (val: unknown) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(String(val).replace(',', '.')) || 0;
      return 0;
    };

    const oldFilamentId = print.filamentId;
    const oldConsumption = print.weight * print.qty;

    const newWeight = weight !== undefined ? safeParseFloat(weight) : print.weight;
    const newQty = qty !== undefined ? Math.max(1, Number(qty) || 1) : print.qty;
    const newConsumption = newWeight * newQty;

    let newFilamentId: string | null = oldFilamentId;
    if (Object.prototype.hasOwnProperty.call(body, 'filamentId')) {
      newFilamentId = filamentId ? String(filamentId) : null;
    }

    if (newFilamentId) {
      const exists = await db.query.filaments.findFirst({
        where: and(eq(filaments.id, newFilamentId), eq(filaments.userId, user.id)),
        columns: { id: true, remainingWeight: true, spoolWeight: true },
      });
      if (!exists) return badRequest('Selected filament does not exist in your warehouse');
      if (exists.remainingWeight == null) {
        await db.update(filaments).set({ remainingWeight: exists.spoolWeight }).where(eq(filaments.id, newFilamentId));
      }
    }

    const updatedPrint = await db.transaction(async (tx) => {
      if (oldFilamentId !== newFilamentId) {
        if (oldFilamentId && oldConsumption > 0) {
          await tx
            .update(filaments)
            .set({ remainingWeight: sql`COALESCE(${filaments.remainingWeight}, 0) + ${oldConsumption}` })
            .where(eq(filaments.id, oldFilamentId));
        }
        if (newFilamentId && newConsumption > 0) {
          await tx
            .update(filaments)
            .set({ remainingWeight: sql`COALESCE(${filaments.remainingWeight}, 0) - ${newConsumption}` })
            .where(eq(filaments.id, newFilamentId));
        }
      } else if (newFilamentId && oldConsumption !== newConsumption) {
        if (oldConsumption > 0) {
          await tx
            .update(filaments)
            .set({ remainingWeight: sql`COALESCE(${filaments.remainingWeight}, 0) + ${oldConsumption}` })
            .where(eq(filaments.id, newFilamentId));
        }
        if (newConsumption > 0) {
          await tx
            .update(filaments)
            .set({ remainingWeight: sql`COALESCE(${filaments.remainingWeight}, 0) - ${newConsumption}` })
            .where(eq(filaments.id, newFilamentId));
        }
      }

      const [updated] = await tx
        .update(printEntries)
        .set({
          ...(actualPrinterId != null && { printerId: actualPrinterId }),
          ...(Object.prototype.hasOwnProperty.call(body, 'filamentId') && { filamentId: newFilamentId }),
          ...(hasOrderId && { orderId: actualOrderId }),
          name: name ?? print.name,
          brand: brand !== undefined ? (brand || null) : print.brand,
          color: color !== undefined ? (color || null) : print.color,
          weight: newWeight,
          timeH: timeH !== undefined ? (parseInt(String(timeH), 10) || 0) : print.timeH,
          timeM: timeM !== undefined ? (parseInt(String(timeM), 10) || 0) : print.timeM,
          qty: newQty,
          price: price !== undefined ? safeParseFloat(price) : print.price,
          profit: profit !== undefined ? safeParseFloat(profit) : print.profit,
          totalCost: totalCost !== undefined ? safeParseFloat(totalCost) : print.totalCost,
          extraCost: extraCost !== undefined ? (extraCost ? safeParseFloat(extraCost) : null) : print.extraCost,
          manualPrice: manualPrice !== undefined ? (manualPrice ? safeParseFloat(manualPrice) : null) : print.manualPrice,
          advancedSettings: advancedSettings !== undefined ? advancedSettings : print.advancedSettings,
          ...(calculatorSnapshot !== undefined && { calculatorSnapshot: calculatorSnapshot ?? null }),
          ...(status !== undefined && { status: status === 'failed' || status === 'canceled' ? status : 'success' }),
          ...(operatorName !== undefined && { operatorName: operatorName ?? null }),
          ...(notes !== undefined && { notes: notes ?? null }),
          ...(errorReason !== undefined && { errorReason: errorReason ?? null }),
        })
        .where(eq(printEntries.id, id))
        .returning();

      return updated;
    });

    await logger.update(user, 'PRINT', id, {
      name: updatedPrint.name,
      changes: { name, weight: newWeight, qty: newQty, price, totalCost },
    });

    return NextResponse.json(updatedPrint);
  } catch (error) {
    console.error('Error updating print:', error);
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const { id } = await params;

    const print = await db.query.printEntries.findFirst({
      where: and(eq(printEntries.id, id), eq(printEntries.userId, user.id)),
    });

    if (!print) return notFound('Print not found');

    await db.transaction(async (tx) => {
      if (print.filamentId) {
        const weightToRestore = print.weight * print.qty;
        if (weightToRestore > 0) {
          await tx
            .update(filaments)
            .set({ remainingWeight: sql`COALESCE(${filaments.remainingWeight}, 0) + ${weightToRestore}` })
            .where(eq(filaments.id, print.filamentId));
        }
      }
      await tx.update(printEntries).set({ deletedAt: new Date() }).where(eq(printEntries.id, id));
    });

    await logger.delete(user, 'PRINT', id, {
      name: print.name,
      weight: print.weight,
      qty: print.qty,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting print:', error);
    return serverError();
  }
}
