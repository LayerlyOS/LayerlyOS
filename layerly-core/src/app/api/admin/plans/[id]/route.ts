import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { subscriptionPlans } from '@/db/schema';
import { forbidden, getUserFromRequest, notFound, serverError, unauthorized } from '@/lib/api-auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    if (!user.isAdmin) return forbidden();

    const { id } = await params;
    const body = await req.json();

    // Validate if plan exists
    const existingPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, id),
    });

    if (!existingPlan) return notFound('Plan not found');

    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set({
        name: body.name,
        maxFilaments: body.maxFilaments,
        maxPrinters: body.maxPrinters,
        pdfExport: body.pdfExport,
        clientManagement: body.clientManagement,
        ordersAccess: body.ordersAccess,
        csvExport: body.csvExport,
        advancedAnalytics: body.advancedAnalytics,
        multiUser: body.multiUser,
        prioritySupport: body.prioritySupport,
      })
      .where(eq(subscriptionPlans.id, id))
      .returning();

    return Response.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return serverError();
  }
}
