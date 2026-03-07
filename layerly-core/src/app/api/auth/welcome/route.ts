import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || '').trim().toLowerCase();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const user = await db.query.userProfiles.findFirst({
      where: (table, { eq }) => eq(table.email, email),
    });

    if (!user) {
      return Response.json({ success: true });
    }

    await sendWelcomeEmail({
      email: user.email,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
