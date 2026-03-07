import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Supabase Auth wrapper
 * Replaces Better Auth
 */
export async function getSession() {
  const supabase = await createClient();
  
  // Use getUser() instead of getSession() for security
  // getUser() verifies token via Supabase Auth server
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get session for access_token (only if needed)
  // Note: getUser() does not return session, so we use getSession() only for tokens
  // But we use getUser() for user verification
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get user profile from database
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (profile.length === 0) {
    return null;
  }

  return {
    user: {
      id: profile[0].id,
      email: profile[0].email,
      name: profile[0].name,
      image: profile[0].image,
      isAdmin: profile[0].isAdmin,
      role: profile[0].role,
      subscriptionTier: profile[0].subscriptionTier,
      twoFactorEnabled: profile[0].twoFactorEnabled,
    },
    session: session ? {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    } : null,
  };
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user profile from database
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  if (profile.length === 0) {
    return null;
  }

  return {
    id: profile[0].id,
    email: profile[0].email,
    name: profile[0].name,
    image: profile[0].image,
    isAdmin: profile[0].isAdmin,
    role: profile[0].role,
    subscriptionTier: profile[0].subscriptionTier,
    twoFactorEnabled: profile[0].twoFactorEnabled,
  };
}

export type Session = Awaited<ReturnType<typeof getSession>>;
