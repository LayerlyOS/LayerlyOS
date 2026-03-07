import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { globalSettings } from '@/db/schema';

export const EMAIL_CONFIRMATION_KEY = 'auth_email_confirmation';

export interface EmailConfirmationState {
  requireConfirmation: boolean;
}

let cache: {
  value: boolean;
  timestamp: number;
} | null = null;

const CACHE_TTL = 1000;

export async function getEmailConfirmationRequired(): Promise<boolean> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.value;
  }

  try {
    const setting = await db.query.globalSettings.findFirst({
      where: eq(globalSettings.key, EMAIL_CONFIRMATION_KEY),
    });

    const requireConfirmation = !!(setting?.value as EmailConfirmationState)?.requireConfirmation;

    cache = {
      value: requireConfirmation,
      timestamp: Date.now(),
    };

    return requireConfirmation;
  } catch (error) {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PHASE === 'phase-production-build'
    ) {
      return false;
    }

    if (cache) return cache.value;
    return false;
  }
}

export async function setEmailConfirmationRequired(enabled: boolean): Promise<void> {
  const value: EmailConfirmationState = { requireConfirmation: enabled };

  cache = {
    value: enabled,
    timestamp: Date.now(),
  };

  await db
    .insert(globalSettings)
    .values({
      key: EMAIL_CONFIRMATION_KEY,
      value,
    })
    .onConflictDoUpdate({
      target: globalSettings.key,
      set: {
        value,
        updatedAt: new Date(),
      },
    });
}

