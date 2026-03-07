import { db } from '@/db';
import { globalSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const MAINTENANCE_MODE_KEY = 'maintenance_mode';

export interface MaintenanceState {
  enabled: boolean;
}

// Simple in-memory cache
let cache: {
  value: boolean;
  timestamp: number;
} | null = null;

const CACHE_TTL = 1000; // 1 second - short cache for quick reaction to changes

export async function getMaintenanceStatus(): Promise<boolean> {
  // Return cached value if valid
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.value;
  }

  try {
    const setting = await db.query.globalSettings.findFirst({
      where: eq(globalSettings.key, MAINTENANCE_MODE_KEY),
    });

    const isEnabled = !!(setting?.value as MaintenanceState)?.enabled;
    
    // Update cache
    cache = {
      value: isEnabled,
      timestamp: Date.now(),
    };

    return isEnabled;
  } catch (error: any) {
    // During build time, database may not be available - fail gracefully
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('Maintenance status check skipped during build');
      return false; // Default to maintenance off during build
    }
    
    // If error is ENOTFOUND (host not found), connection string is likely invalid
    if (error?.code === 'ENOTFOUND' || error?.cause?.code === 'ENOTFOUND') {
      console.error('⚠️  Cannot connect to database - check DATABASE_URL');
      console.error('💡 Make sure you use a valid Supabase connection string');
    } else {
      console.error('Failed to fetch maintenance status:', error);
    }
    
    // If we have a stale cache, return it instead of failing
    if (cache) return cache.value;
    return false; // Fail open (allow access) if DB fails and no cache
  }
}

export async function setMaintenanceStatus(enabled: boolean): Promise<void> {
  const value: MaintenanceState = { enabled };
  
  // Invalidate cache immediately AND update it with new value
  // This ensures immediate consistency without waiting for next query
  cache = {
    value: enabled,
    timestamp: Date.now(),
  };
  
  await db
    .insert(globalSettings)
    .values({
      key: MAINTENANCE_MODE_KEY,
      value,
    })
    .onConflictDoUpdate({
      target: globalSettings.key,
      set: { 
        value, 
        updatedAt: new Date() 
      },
    });
}
