import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEffectivePlan } from './plans';
import type { SubscriptionTier } from '@/config/subscription';

export async function getUserFromRequest(req: NextRequest) {
  // Create Supabase client with request headers
  const supabase = await createClient();
  
  // Use getUser() instead of getSession() for security
  // getUser() verifies token via Supabase Auth server
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    // If no cookie session, try Bearer token (for mobile)
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify token via Supabase
      const {
        data: { user: tokenUser },
        error: tokenError,
      } = await supabase.auth.getUser(token);

      if (tokenError || !tokenUser) {
        return null;
      }

      // Get user profile
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, tokenUser.id))
        .limit(1);

      return profile[0] || null;
    }

    return null;
  }

  // Get user profile from database
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  return profile[0] || null;
}

/**
 * Requires auth - returns user or throws
 * @throws {Response} 401 Unauthorized if user is not logged in
 */
export async function requireAuth(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw unauthorized();
  }
  return user;
}

/**
 * Requires administrator privileges
 * @throws {Response} 403 Forbidden if user is not administrator
 */
export function requireAdmin(user: typeof userProfiles.$inferSelect) {
  // Check both isAdmin and role === 'ADMIN'
  const isAdmin = !!(user.isAdmin || user.role === 'ADMIN');
  if (!isAdmin) {
    throw forbidden('Only administrator has access to this resource');
  }
  return true;
}

/**
 * Checks if user is resource owner or administrator
 * @param user - User
 * @param resourceUserId - ID of user who owns the resource (may be null)
 * @param resourceId - Optional resource ID (for better error messages)
 * @throws {Response} 403 Forbidden if user is neither owner nor administrator
 */
export function requireOwnership(
  user: typeof userProfiles.$inferSelect,
  resourceUserId: string | null,
  resourceId?: string
) {
  // Administrator has access to everything
  if (user.isAdmin) {
    return true;
  }

  // If resource has no owner, only admin can modify it
  if (!resourceUserId) {
    const message = resourceId
      ? `No access to resource ${resourceId}`
      : 'No access to this resource';
    throw forbidden(message);
  }

  // Check if user is owner
  if (resourceUserId !== user.id) {
    const message = resourceId
      ? `You do not have permission to resource ${resourceId}`
      : 'You do not have permission to this resource';
    throw forbidden(message);
  }

  return true;
}

/**
 * Checks if user's plan has access to feature
 * @param user - User
 * @param feature - Feature name to check
 * @throws {Response} 403 Forbidden if plan does not have access to feature
 */
export async function requireSubscriptionFeature(
  user: typeof userProfiles.$inferSelect,
  feature: keyof Awaited<ReturnType<typeof getEffectivePlan>>['features']
) {
  const plan = await getEffectivePlan(user.subscriptionTier as SubscriptionTier);
  const hasFeature = plan.features[feature];

  if (!hasFeature) {
    throw forbidden('Feature available in higher subscription plan');
  }

  return true;
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return Response.json({ error: message }, { status: 403 });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function notFound(message = 'Not found') {
  return Response.json({ error: message }, { status: 404 });
}

export function serverError(message = 'Internal server error') {
  return Response.json({ error: message }, { status: 500 });
}
