import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders, printEntries } from '@/db/schema';
import {
  badRequest,
  forbidden,
  getUserFromRequest,
  serverError,
  unauthorized,
} from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { getEffectivePlan } from '@/lib/plans';

const ORDER_STATUSES = new Set(['QUOTE', 'IN_PRODUCTION', 'READY', 'SHIPPED']);

function normalizeStatus(input: unknown) {
  const raw = String(input || '').trim();
  if (ORDER_STATUSES.has(raw)) return raw as 'QUOTE' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED';

  const lower = raw.toLowerCase();
  if (lower === 'quote') return 'QUOTE';
  if (lower === 'in_production' || lower === 'in production') return 'IN_PRODUCTION';
  if (lower === 'ready') return 'READY';
  if (lower === 'shipped') return 'SHIPPED';

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const ordersList = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: {
        printEntries: {
          where: isNull(printEntries.deletedAt),
          columns: {
            id: true,
            name: true,
            qty: true,
            price: true,
            profit: true,
            totalCost: true,
            date: true,
            orderId: true,
            printerId: true,
            filamentId: true,
            brand: true,
            color: true,
            weight: true,
            timeH: true,
            timeM: true,
            extraCost: true,
            manualPrice: true,
          },
          orderBy: [desc(printEntries.date)],
        },
      },
      orderBy: [desc(orders.updatedAt), desc(orders.createdAt)],
    });

    return Response.json(ordersList);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const config = await getEffectivePlan(user.subscriptionTier);
    if (!config.features.ordersAccess) {
      return forbidden('Feature available in higher plan');
    }

    const body = await req.json().catch(() => null);
    const title = String(body?.title || '').trim();
    const customerName = body?.customerName ? String(body.customerName).trim() : null;
    const notes = body?.notes ? String(body.notes).trim() : null;
    const status = normalizeStatus(body?.status) ?? 'QUOTE';

    if (!title) return badRequest('Missing order title');

    let deadline: Date | null = null;
    if (body?.deadline) {
      const d = new Date(String(body.deadline));
      if (!Number.isNaN(d.getTime())) deadline = d;
    }

    const printEntryIds: string[] = Array.isArray(body?.printEntryIds)
      ? body.printEntryIds.map((x: unknown) => String(x)).filter(Boolean)
      : [];

    const customerId = body?.customerId ? String(body.customerId).trim() : null;

    const created = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          userId: user.id,
          title,
          customerName: customerName || null,
          customerId: customerId || null,
          notes: notes || null,
          status,
          deadline,
        })
        .returning();

      if (printEntryIds.length > 0) {
        await tx
          .update(printEntries)
          .set({ orderId: order.id })
          .where(and(inArray(printEntries.id, printEntryIds), eq(printEntries.userId, user.id)));
      }

      return tx.query.orders.findFirst({
        where: and(eq(orders.id, order.id), eq(orders.userId, user.id)),
        with: {
          printEntries: {
            orderBy: [desc(printEntries.date)],
          },
        },
      });
    });

    if (!created) return serverError();

    await logger.create(user, 'ORDER', created.id, { title, status, customerName });

    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return serverError();
  }
}
