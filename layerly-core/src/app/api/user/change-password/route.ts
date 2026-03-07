import type { NextRequest } from 'next/server';
import { badRequest, getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { sendPasswordChangedEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const body = await req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return badRequest('Missing required fields');
    }

    if (newPassword.length < 8) {
      return badRequest('New password must be at least 8 characters');
    }

    const supabase = await createClient();

    // Verify old password by trying to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      return badRequest('Invalid current password');
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return badRequest(updateError.message || 'Failed to update password');
    }

    await logger.update(user, 'USER', user.id, {
      action: 'CHANGE_PASSWORD',
      method: 'CREDENTIAL',
    });

    try {
      await sendPasswordChangedEmail({ email: user.email });
    } catch (emailError) {
      console.error('Error sending password changed email:', emailError);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return serverError();
  }
}
