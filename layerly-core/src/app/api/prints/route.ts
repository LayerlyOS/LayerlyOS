import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { filaments, orders, printEntries, printers } from '@/db/schema';
import { badRequest, getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { notifier } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const prints = await db.query.printEntries.findMany({
      where: and(eq(printEntries.userId, user.id), isNull(printEntries.deletedAt)),
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
      orderBy: [desc(printEntries.date)],
    });

    return NextResponse.json(prints);
  } catch (error) {
    console.error('Error fetching prints:', error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const body = (await req.json()) as {
      printerId?: string;
      filamentId?: string;
      orderId?: string;
      name: string;
      brand?: string;
      color?: string;
      weight: string | number;
      timeH: string | number;
      timeM: string | number;
      qty: string | number;
      price: string | number;
      profit: string | number;
      totalCost: string | number;
      extraCost?: string | number;
      manualPrice?: string | number;
      advancedSettings?: any;
      calculatorSnapshot?: unknown;
      status?: 'success' | 'failed' | 'canceled';
      operatorName?: string | null;
      notes?: string | null;
      errorReason?: string | null;
    };
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

    let actualOrderId: string | null = null;
    if (orderId) {
      const normalized = String(orderId).trim();
      actualOrderId = normalized.length > 0 ? normalized : null;
      if (actualOrderId) {
        const order = await db.query.orders.findFirst({
          where: and(eq(orders.id, actualOrderId), eq(orders.userId, user.id)),
          columns: { id: true },
        });
        if (!order) return badRequest('Order not found');
      }
    }

    // Ensure printer exists - if not provided or invalid, use user's default or first printer
    let actualPrinterId = printerId ? String(printerId) : null;

    if (actualPrinterId) {
      const printerExists = await db.query.printers.findFirst({
        where: and(eq(printers.id, actualPrinterId), eq(printers.userId, user.id)),
      });

      if (!printerExists) {
        return badRequest('Selected printer does not exist');
      }
    } else {
      // No printerId provided - get default or first printer
      let defaultPrinter = await db.query.printers.findFirst({
        where: and(eq(printers.userId, user.id), eq(printers.isDefault, true)),
      });

      if (!defaultPrinter) {
        defaultPrinter = await db.query.printers.findFirst({
          where: eq(printers.userId, user.id),
          orderBy: [asc(printers.createdAt)],
        });
      }

      if (!defaultPrinter) {
        const [newPrinter] = await db
          .insert(printers)
          .values({
            userId: user.id,
            name: 'Prusa MK4',
            model: 'Prusa MK4',
            power: 275,
            costPerHour: 0,
            isDefault: true,
          })
          .returning();
        defaultPrinter = newPrinter;
      }
      actualPrinterId = defaultPrinter.id;
    }

    // Helper to safe parse float with comma support
    const safeParseFloat = (val: unknown) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        return parseFloat(val.replace(',', '.')) || 0;
      }
      return 0;
    };

    const weightVal = safeParseFloat(weight);
    const qtyVal = Math.max(1, parseInt(String(qty), 10) || 1);
    const consumedWeight = weightVal * qtyVal;

    let actualFilamentId: string | null = filamentId ? String(filamentId) : null;
    if (actualFilamentId) {
      const filament = await db.query.filaments.findFirst({
        where: and(eq(filaments.id, actualFilamentId), eq(filaments.userId, user.id)),
        columns: { id: true, remainingWeight: true, spoolWeight: true },
      });
      if (!filament) return badRequest('Selected filament does not exist in your warehouse');
      if (filament.remainingWeight == null) {
        await db.update(filaments).set({ remainingWeight: filament.spoolWeight }).where(eq(filaments.id, actualFilamentId));
      }
    }

    const print = await db.transaction(async (tx) => {
      const [newPrint] = await tx
        .insert(printEntries)
        .values({
          userId: user.id,
          printerId: actualPrinterId || '',
          filamentId: actualFilamentId,
          orderId: actualOrderId || null,
          name,
          brand: brand || null,
          color: color || null,
          weight: weightVal,
          timeH: parseInt(String(timeH), 10) || 0,
          timeM: parseInt(String(timeM), 10) || 0,
          qty: qtyVal,
          price: safeParseFloat(price),
          profit: safeParseFloat(profit),
          totalCost: safeParseFloat(totalCost),
          extraCost: extraCost ? safeParseFloat(extraCost) : null,
          manualPrice: manualPrice ? safeParseFloat(manualPrice) : null,
          advancedSettings: advancedSettings || null,
          calculatorSnapshot: calculatorSnapshot ?? null,
          status: status === 'failed' || status === 'canceled' ? status : 'success',
          operatorName: operatorName ?? null,
          notes: notes ?? null,
          errorReason: errorReason ?? null,
        })
        .returning();

      if (actualFilamentId && consumedWeight > 0) {
        await tx
          .update(filaments)
          .set({ remainingWeight: sql`COALESCE(${filaments.remainingWeight}, 0) - ${consumedWeight}` })
          .where(eq(filaments.id, actualFilamentId));
      }

      const printWithRelations = await tx.query.printEntries.findFirst({
        where: eq(printEntries.id, newPrint.id),
        with: { order: { columns: { title: true, customerName: true } } },
      });
      return printWithRelations;
    });

    if (!print) throw new Error('Failed to create print entry');

    await logger.create(user, 'PRINT', print.id, {
      name: print.name,
      weight: print.weight,
      qty: print.qty,
    });

    // Notify success
    await notifier.success(
      user.id,
      'notifications.print_added.title',
      JSON.stringify({
        key: 'notifications.print_added.message',
        params: { name: print.name },
      })
    );

    return NextResponse.json(print, { status: 201 });
  } catch (error) {
    console.error('Error creating print:', error);
    return serverError();
  }
}
