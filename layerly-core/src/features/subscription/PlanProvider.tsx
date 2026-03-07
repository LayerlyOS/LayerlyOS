'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { PlanConfig } from '@/config/subscription';
import { SUBSCRIPTION_PLANS } from '@/config/subscription';

type PlanContextValue = PlanConfig;

const PlanContext = createContext<PlanContextValue>(SUBSCRIPTION_PLANS.HOBBY);

export function PlanProvider({
  initial,
  children,
}: {
  initial: PlanConfig;
  children: React.ReactNode;
}) {
  const [plan, setPlan] = useState<PlanConfig>(initial);
  const currentIdRef = useRef(initial.id);
  const lastCheckRef = useRef(0);
  const checkingRef = useRef(false);

  useEffect(() => {
    currentIdRef.current = plan.id;
  }, [plan.id]);

  useEffect(() => {
    let intervalId: number | null = null;
    const CHECK_INTERVAL_MS = 60_000; // 60s
    const MIN_GAP_MS = 10_000; // throttle manual checks

    const checkPlan = async () => {
      if (checkingRef.current) return;
      const now = Date.now();
      if (now - lastCheckRef.current < MIN_GAP_MS) return;
      checkingRef.current = true;
      try {
        const res = await fetch('/api/user/plan', { cache: 'no-store' });
        if (res.ok) {
          const serverPlan = (await res.json()) as PlanConfig;
          const current = currentIdRef.current;
          if (serverPlan?.id && serverPlan.id !== current) {
            currentIdRef.current = serverPlan.id;
            setPlan(serverPlan);
          }
        }
      } catch {
        // swallow silently; background check should never disturb UX
      } finally {
        lastCheckRef.current = Date.now();
        checkingRef.current = false;
      }
    };

    // Periodic check
    intervalId = window.setInterval(checkPlan, CHECK_INTERVAL_MS) as unknown as number;

    // Check on tab focus/visibility return
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkPlan();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', checkPlan);

    const initialTimer = window.setTimeout(checkPlan, 500);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      window.clearTimeout(initialTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', checkPlan);
    };
  }, []);

  return <PlanContext.Provider value={plan}>{children}</PlanContext.Provider>;
}

export function usePlanContext() {
  return useContext(PlanContext);
}
