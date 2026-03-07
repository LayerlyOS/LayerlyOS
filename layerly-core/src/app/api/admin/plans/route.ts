import { count } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/config/subscription';
import { db } from '@/db';
import { subscriptionPlans } from '@/db/schema';
import { forbidden, getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    if (!user.isAdmin) return forbidden();

    // Check if plans exist, if not seed them
    const [result] = await db.select({ count: count() }).from(subscriptionPlans);
    const planCount = result?.count || 0;

    if (planCount === 0) {
      const plans = Object.values(SUBSCRIPTION_PLANS);
      for (const plan of plans) {
        await db.insert(subscriptionPlans).values({
          id: plan.id,
          name: plan.name,
          maxFilaments: plan.maxFilaments,
          maxPrinters:
            plan.maxPrinters ?? (plan.id === 'HOBBY' ? 3 : plan.id === 'MAKER' ? 10 : -1),
          pdfExport: plan.features.pdfExport,
          clientManagement: plan.features.clientManagement,
          advancedAnalytics: plan.features.advancedAnalytics,
          multiUser: plan.features.multiUser,
          prioritySupport: plan.features.prioritySupport,
        });
      }
    }

    const plansList = await db.query.subscriptionPlans.findMany({
      orderBy: (plans, { asc }) => [asc(plans.createdAt)],
    });

    // Custom sort to ensure HOBBY -> MAKER -> FARM
    const order = ['HOBBY', 'MAKER', 'FARM'];
    const sortedPlans = plansList.sort((a, b) => {
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

    return Response.json(sortedPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return serverError();
  }
}
