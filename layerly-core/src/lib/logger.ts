import { headers } from 'next/headers';
import { db } from '@/db';
import { activityLogs } from '@/db/schema';

export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'OTHER';

export type ActivityEntity = 'PRINTER' | 'FILAMENT' | 'USER' | 'ORDER' | 'PRINT' | 'SYSTEM';

interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface LogStandardActivityParams {
  user: { id: string };
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Logs an activity to the database.
 * Designed to be fire-and-forget or awaited depending on importance.
 */
export async function logActivity({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
  userAgent,
}: LogActivityParams) {
  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      entity,
      entityId,
      details: details ? details : undefined,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // We don't throw here to avoid breaking the main application flow
  }
}

/**
 * Standard helper for logging activities with automatic context resolution.
 * Automatically extracts IP and User Agent from headers if not provided.
 */
export async function logStandardActivity({
  user,
  action,
  entity,
  entityId,
  details,
  ipAddress,
  userAgent,
}: LogStandardActivityParams) {
  let finalIp = ipAddress;
  let finalUa = userAgent;

  if (!finalIp || !finalUa) {
    try {
      const headersList = await headers();
      if (!finalIp) {
        finalIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');
      }
      if (!finalUa) {
        finalUa = headersList.get('user-agent');
      }
    } catch (_error) {
      // headers() might fail if called outside of request context
      // We ignore this error and just log without these details
    }
  }

  return logActivity({
    userId: user.id,
    action,
    entity,
    entityId,
    details,
    ipAddress: finalIp,
    userAgent: finalUa,
  });
}

export const logger = {
  create: (user: { id: string }, entity: ActivityEntity, entityId: string, details?: any) =>
    logStandardActivity({ user, action: 'CREATE', entity, entityId, details }),

  update: (user: { id: string }, entity: ActivityEntity, entityId: string, details?: any) =>
    logStandardActivity({ user, action: 'UPDATE', entity, entityId, details }),

  delete: (user: { id: string }, entity: ActivityEntity, entityId: string, details?: any) =>
    logStandardActivity({ user, action: 'DELETE', entity, entityId, details }),

  login: (
    user: { id: string },
    details?: any,
    ipAddress?: string | null,
    userAgent?: string | null
  ) =>
    logStandardActivity({
      user,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      details,
      ipAddress,
      userAgent,
    }),
};
