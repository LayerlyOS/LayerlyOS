import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { getUserFromRequest, notFound, serverError, unauthorized } from '@/lib/api-auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const { id } = await params;

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.userId, user.id)),
    });

    if (!order) return notFound('Order not found');

    // If already has a token, return it
    if (order.shareToken) {
      return Response.json({ shareToken: order.shareToken });
    }

    // Generate new token (16 bytes hex = 32 chars, or use something shorter/friendly?)
    // A secure random string is good.
    const shareToken = randomBytes(16).toString('hex');

    const [updated] = await db
      .update(orders)
      .set({ shareToken })
      .where(eq(orders.id, id))
      .returning();

    return Response.json({ shareToken: updated.shareToken });
  } catch (error) {
    console.error('Error generating share link:', error);
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const { id } = await params;

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.userId, user.id)),
    });

    if (!order) return notFound('Order not found');

    await db.update(orders).set({ shareToken: null }).where(eq(orders.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error removing share link:', error);
    return serverError();
  }
}
