import { and, desc, eq, inArray, isNull, notInArray } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, printEntries } from '@/db/schema';
import {
  badRequest,
  notFound,
  requireAuth,
  requireOwnership,
  requireSubscriptionFeature,
  serverError,
} from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);

    const { id } = await params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        printEntries: {
          where: isNull(printEntries.deletedAt),
          orderBy: [desc(printEntries.date)],
          with: {
            printer: true,
            filament: true,
          },
        },
      },
    });

    if (!order) return notFound('Order not found');

    // Check ownership using helper function
    requireOwnership(user, order.userId, id);

    return NextResponse.json(order);
  } catch (error) {
    // If error is Response (from requireAuth/requireOwnership), return it
    if (error instanceof Response) {
      return error;
    }
    console.error('Error fetching order:', error);
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);

    // Check orders feature access
    await requireSubscriptionFeature(user, 'ordersAccess');

    const { id } = await params;

    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      columns: { id: true, userId: true },
    });
    if (!existing) return notFound('Order not found');

    // Check ownership using helper function
    requireOwnership(user, existing.userId, id);

    const body = await req.json().catch(() => null);

    const title = body?.title === undefined ? undefined : String(body?.title || '').trim();

    const customerName =
      body?.customerName === undefined ? undefined : String(body?.customerName || '').trim();

    const customerId = body?.customerId === undefined ? undefined : String(body?.customerId || '').trim() || null;

    const notes = body?.notes === undefined ? undefined : String(body?.notes || '').trim() || null;

    const status = body?.status === undefined ? undefined : String(body?.status || '').trim();

    const deadline =
      body?.deadline === undefined
        ? undefined
        : body?.deadline
          ? new Date(String(body.deadline))
          : null;

    if (title !== undefined && title.length === 0) {
      return badRequest('Title cannot be empty');
    }

    if (status !== undefined) {
      const allowed = new Set(['QUOTE', 'IN_PRODUCTION', 'READY', 'SHIPPED']);
      if (!allowed.has(status)) {
        return badRequest('Invalid status');
      }
    }

    const printEntryIdsRaw = body?.printEntryIds;
    const printEntryIds = Array.isArray(printEntryIdsRaw)
      ? printEntryIdsRaw.map((v: unknown) => String(v)).filter(Boolean)
      : null;

    const [updated] = await db
      .update(orders)
      .set({
        ...(title !== undefined && { title }),
        ...(customerName !== undefined && { customerName: customerName || null }),
        ...(customerId !== undefined && { customerId }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status: status as 'QUOTE' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED' }),
        ...(deadline !== undefined && { deadline }),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (printEntryIds) {
      if (printEntryIds.length > 0) {
        await db
          .update(printEntries)
          .set({ orderId: null })
          .where(
            and(
              eq(printEntries.userId, user.id),
              eq(printEntries.orderId, id),
              // biome-ignore lint/suspicious/noExplicitAny: d.ts definition mismatch for notInArray
              notInArray(printEntries.id, printEntryIds as any[])
            )
          );

        await db
          .update(printEntries)
          .set({ orderId: id })
          .where(
            and(
              eq(printEntries.userId, user.id),
              // biome-ignore lint/suspicious/noExplicitAny: d.ts definition mismatch for inArray
              inArray(printEntries.id, printEntryIds as any[])
            )
          );
      } else {
        // Unlink all if empty list provided
        await db
          .update(printEntries)
          .set({ orderId: null })
          .where(and(eq(printEntries.userId, user.id), eq(printEntries.orderId, id)));
      }
    }

    const full = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        printEntries: {
          orderBy: [desc(printEntries.date)],
          with: {
            printer: true,
            filament: true,
          },
        },
      },
    });

    await logger.update(user, 'ORDER', id, {
      title: full?.title || existing.id,
      changes: { title, status, customerName, deadline, notes, printEntryIds },
    });

    return NextResponse.json(full ?? updated);
  } catch (error) {
    // If error is Response (from requireAuth/requireOwnership/requireSubscriptionFeature), return it
    if (error instanceof Response) {
      return error;
    }
    console.error('Error updating order:', error);
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);

    // Check orders feature access
    await requireSubscriptionFeature(user, 'ordersAccess');

    const { id } = await params;

    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      columns: { id: true, userId: true },
    });
    if (!existing) return notFound('Order not found');

    // Check ownership using helper function
    requireOwnership(user, existing.userId, id);

    await db
      .update(printEntries)
      .set({ orderId: null })
      .where(and(eq(printEntries.userId, user.id), eq(printEntries.orderId, id)));

    await db.delete(orders).where(eq(orders.id, id));

    await logger.delete(user, 'ORDER', id, { id });

    return NextResponse.json({ success: true });
  } catch (error) {
    // If error is Response (from requireAuth/requireOwnership/requireSubscriptionFeature), return it
    if (error instanceof Response) {
      return error;
    }
    console.error('Error deleting order:', error);
    return serverError();
  }
}
