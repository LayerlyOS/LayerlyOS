import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { and, eq, gt, isNull, lte } from 'drizzle-orm';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { db } from '@/db';
import { passwordResetTokens, userProfiles } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = String(body?.token || '').trim();
    const newPassword = String(body?.newPassword || '');

    if (!token || !newPassword) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    await db
      .delete(passwordResetTokens)
      .where(lte(passwordResetTokens.expiresAt, now));

    const record = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      ),
    });

    if (!record) {
      return Response.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const user = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, record.userId),
    });

    if (!user) {
      return Response.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(record.userId, {
      password: newPassword,
    });

    if (updateError) {
      return Response.json({ error: updateError.message || 'Failed to update password' }, { status: 400 });
    }

    await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, record.id));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error resetting password:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
