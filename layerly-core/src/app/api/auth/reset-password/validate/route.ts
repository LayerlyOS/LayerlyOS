import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { and, eq, gt, isNull, lte } from 'drizzle-orm';
import { db } from '@/db';
import { passwordResetTokens } from '@/db/schema';

export async function GET(req: NextRequest) {
  try {
    const token = String(req.nextUrl.searchParams.get('token') || '').trim();

    if (!token) {
      return Response.json({ valid: false }, { status: 400 });
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
      return Response.json({ valid: false }, { status: 400 });
    }

    return Response.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error('Error validating password reset token:', error);
    return Response.json({ valid: false }, { status: 500 });
  }
}
