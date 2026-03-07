import type { NextRequest } from 'next/server';
import { badRequest, getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { sendPasswordChangedEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const body = await req.json().catch(() => null);
    const { newPassword } = body || {};

    if (!newPassword || typeof newPassword !== 'string') {
      return badRequest('Missing required fields');
    }

    if (newPassword.length < 8) {
      return badRequest('New password must be at least 8 characters long');
    }

    const supabase = await createClient();

    // Check if user already has a password (Supabase handles this automatically)
    // Just update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return badRequest(updateError.message || 'Failed to set password');
    }

    await logger.update(user, 'USER', user.id, {
      action: 'SET_PASSWORD',
      method: 'CREDENTIAL',
    });

    try {
      await sendPasswordChangedEmail({ email: user.email });
    } catch (emailError) {
      console.error('Error sending password set email:', emailError);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error setting password:', error);
    return serverError();
  }
}
