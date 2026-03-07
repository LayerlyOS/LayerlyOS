import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { statusPageAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getStatusPageAdminFromRequest(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const {
        data: { user: tokenUser },
        error: tokenError,
      } = await supabase.auth.getUser(token);

      if (tokenError || !tokenUser) return null;

      const admin = await db
        .select()
        .from(statusPageAdmins)
        .where(eq(statusPageAdmins.userId, tokenUser.id))
        .limit(1);

      return admin.length > 0 ? { id: tokenUser.id, email: tokenUser.email } : null;
    }
    return null;
  }

  const admin = await db
    .select()
    .from(statusPageAdmins)
    .where(eq(statusPageAdmins.userId, user.id))
    .limit(1);

  return admin.length > 0 ? { id: user.id, email: user.email } : null;
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
