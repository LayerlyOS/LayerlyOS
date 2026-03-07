import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { statusPageAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getSession() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAdmin = await db
    .select()
    .from(statusPageAdmins)
    .where(eq(statusPageAdmins.userId, user.id))
    .limit(1);

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      name: user.user_metadata?.name ?? null,
      image: user.user_metadata?.avatar_url ?? null,
      isStatusPageAdmin: isAdmin.length > 0,
    },
    session: session
      ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        }
      : null,
  };
}

export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireStatusPageAdmin() {
  const session = await getSession();
  if (!session?.user?.isStatusPageAdmin) {
    return null;
  }
  return session.user;
}
