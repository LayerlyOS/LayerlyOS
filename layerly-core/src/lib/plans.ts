import { eq } from 'drizzle-orm';
import { getPlanConfig } from '@/config/subscription';
import { db } from '@/db';
import { subscriptionPlans } from '@/db/schema';

export async function getEffectivePlan(tierId: string | null | undefined) {
  const normalizedTier = (tierId || 'HOBBY').toUpperCase();

  try {
    const dbPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, normalizedTier),
    });

    if (dbPlan) {
      return {
        id: dbPlan.id,
        name: dbPlan.name,
        maxFilaments: dbPlan.maxFilaments,
        maxPrinters: dbPlan.maxPrinters,
        features: {
          pdfExport: dbPlan.pdfExport,
          clientManagement: dbPlan.clientManagement,
          ordersAccess: dbPlan.ordersAccess,
          csvExport: dbPlan.csvExport,
          advancedAnalytics: dbPlan.advancedAnalytics,
          multiUser: dbPlan.multiUser,
          prioritySupport: dbPlan.prioritySupport,
        },
      };
    }
  } catch (e) {
    console.warn('Failed to fetch plan from DB, using fallback', e);
  }

  return getPlanConfig(normalizedTier);
}
