import type { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorized } from '@/lib/api-auth';
import { getEffectivePlan } from '@/lib/plans';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  const plan = await getEffectivePlan(user.subscriptionTier);
  return Response.json(plan);
}
