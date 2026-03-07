'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import type { User } from '@supabase/supabase-js';

interface Session {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  } | null;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    authClient.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession({
          user: session.user,
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          },
        });
      } else {
        setSession(null);
      }
      setIsPending(false);
    });

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession({
          user: session.user,
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          },
        });
      } else {
        setSession(null);
      }
      setIsPending(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    data: session,
    isPending,
  };
}
