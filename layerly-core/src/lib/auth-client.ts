import { createClient } from '@/lib/supabase/client';

/**
 * Supabase Auth Client
 * Replaces Better Auth client
 */
export const authClient = createClient();
