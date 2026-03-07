import crypto from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { passwordResetTokens, userProfiles } from '@/db/schema';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || '')
      .trim()
      .toLowerCase();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const user = await db.query.userProfiles.findFirst({ where: eq(userProfiles.email, email) });

    if (!user) {
      return Response.json({ success: true });
    }

    const now = new Date();

    await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));

    const rawToken = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    await sendPasswordResetEmail({
      email,
      resetUrl,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
