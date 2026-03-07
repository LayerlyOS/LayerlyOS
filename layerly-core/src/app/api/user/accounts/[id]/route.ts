import type { NextRequest } from 'next/server';
// import { createClient } from '@/lib/supabase/server';
import {
  badRequest,
  getUserFromRequest,
  serverError,
  unauthorized,
} from '@/lib/api-auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const { id } = await params;
    // const supabase = await createClient(); // Unused

    // In Supabase you cannot directly delete OAuth connections via API
    // We can only unlink via Admin API, which requires service_role key
    // For security, return error that this feature is not available
    
    if (id === 'credential') {
      // Cannot delete main email/password account
      return badRequest('Cannot delete the primary email/password account');
    }

    // For OAuth providers, user must do this via Supabase Dashboard
    // or use Admin API (requires service_role key)
    return badRequest('OAuth account unlinking is not available through this API. Please use Supabase Dashboard.');
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return serverError();
  }
}
