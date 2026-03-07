import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const supabase = await createClient();
    
    // Get user identifiers from Supabase Auth
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !authUser) {
      return Response.json([]);
    }

    // Supabase stores OAuth connections in auth.identities
    // We can return basic user info
    const accounts = [];
    
    // Email/password account
    if (authUser.email) {
      accounts.push({
        id: 'credential',
        providerId: 'credential',
        accountId: authUser.email,
        createdAt: authUser.created_at,
      });
    }

    // OAuth providers are in auth.identities, but we don't have direct access
    // We can return info from user metadata
    if (authUser.app_metadata?.providers) {
      Object.keys(authUser.app_metadata.providers).forEach((provider) => {
        if (provider !== 'email') {
          accounts.push({
            id: provider,
            providerId: provider,
            accountId: authUser.email || authUser.id,
            createdAt: authUser.created_at,
          });
        }
      });
    }

    return Response.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return serverError();
  }
}
