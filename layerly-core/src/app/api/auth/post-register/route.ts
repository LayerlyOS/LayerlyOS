import { NextRequest } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { getEmailConfirmationRequired } from '@/lib/email-confirmation';
import { sendEmailConfirmationEmail, sendWelcomeEmail } from '@/lib/email';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user) {
      const existingProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.id, user.id),
      });

      if (!existingProfile) {
        await db.insert(userProfiles).values({
          id: user.id,
          email,
          name: (user.user_metadata as any)?.name ?? null,
          image: (user.user_metadata as any)?.avatar_url ?? null,
          isAdmin: false,
          role: 'USER',
          subscriptionTier: 'HOBBY',
        });
      }
    }

    const requireConfirmation = await getEmailConfirmationRequired();

    if (requireConfirmation) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase configuration for email confirmation');
        return Response.json(
          { error: 'Email confirmation is not available' },
          { status: 500 }
        );
      }

      const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
        /\/$/,
        ''
      );

      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${appUrl}/login?email_confirmed=1`,
        },
      });

      if (error) {
        console.error('Failed to generate confirmation link:', error);
        return Response.json(
          { error: 'Failed to generate confirmation link' },
          { status: 500 }
        );
      }

      const confirmUrl = (data as any)?.properties?.action_link as string | undefined;

      if (!confirmUrl) {
        console.error('No action_link returned from generateLink');
        return Response.json(
          { error: 'Failed to generate confirmation link' },
          { status: 500 }
        );
      }

      await sendEmailConfirmationEmail({ email, confirmUrl });

      return Response.json({ success: true, mode: 'confirmation' });
    }

    await sendWelcomeEmail({ email });

    return Response.json({ success: true, mode: 'welcome' });
  } catch (error) {
    console.error('post-register error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
