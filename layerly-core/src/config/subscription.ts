export type SubscriptionTier = 'HOBBY' | 'MAKER' | 'FARM';

export interface PlanConfig {
  id: SubscriptionTier;
  name: string;
  maxFilaments: number; // -1 means unlimited
  maxPrinters: number; // -1 means unlimited
  features: {
    pdfExport: boolean;
    clientManagement: boolean;
    ordersAccess: boolean;
    csvExport: boolean;
    advancedAnalytics: boolean;
    multiUser: boolean;
    prioritySupport: boolean;
  };
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, PlanConfig> = {
  HOBBY: {
    id: 'HOBBY',
    name: 'Starter',
    maxFilaments: 3,
    maxPrinters: 1,
    features: {
      pdfExport: false,
      clientManagement: false,
      ordersAccess: false,
      csvExport: false,
      advancedAnalytics: false,
      multiUser: false,
      prioritySupport: false,
    },
  },
  MAKER: {
    id: 'MAKER',
    name: 'Pro Maker',
    maxFilaments: -1, // Unlimited
    maxPrinters: 10,
    features: {
      pdfExport: true,
      clientManagement: true,
      ordersAccess: true,
      csvExport: true,
      advancedAnalytics: false,
      multiUser: false,
      prioritySupport: true,
    },
  },
  FARM: {
    id: 'FARM',
    name: 'Print Farm',
    maxFilaments: -1,
    maxPrinters: -1,
    features: {
      pdfExport: true,
      clientManagement: true,
      ordersAccess: true,
      csvExport: true,
      advancedAnalytics: true,
      multiUser: true,
      prioritySupport: true,
    },
  },
};

export function getPlanConfig(tier: string | undefined | null): PlanConfig {
  const normalizedTier = (tier || 'HOBBY').toUpperCase() as SubscriptionTier;
  return SUBSCRIPTION_PLANS[normalizedTier] || SUBSCRIPTION_PLANS.HOBBY;
}
