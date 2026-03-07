import { usePlanContext } from '@/features/subscription/PlanProvider';

export function useSubscription() {
  const plan = usePlanContext();

  return {
    tier: plan.id,
    planName: plan.name,
    features: plan.features,
    maxFilaments: plan.maxFilaments,
    maxPrinters: plan.maxPrinters,
    isPending: false,
    isUnlimitedFilaments: plan.maxFilaments === -1,
    isUnlimitedPrinters: plan.maxPrinters === -1,
    checkLimit: (currentCount: number) => {
      if (plan.maxFilaments === -1) return true;
      return currentCount < plan.maxFilaments;
    },
    checkPrinterLimit: (currentCount: number) => {
      if (plan.maxPrinters === -1) return true;
      return currentCount < plan.maxPrinters;
    },
  };
}
