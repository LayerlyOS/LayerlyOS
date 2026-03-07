import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import {
  badRequest,
  forbidden,
  getUserFromRequest,
  notFound,
  serverError,
  unauthorized,
} from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    if (!user.isAdmin) return forbidden('Only administrator has access');

    const { id } = await params;
    const body = await req.json();
    const { name, email, isAdmin, subscriptionTier } = body;

    // Basic validation
    if (!name || !email) {
      return badRequest('Required fields: name, email');
    }

    // Check if user exists
    const existingUser = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, id),
    });

    if (!existingUser) return notFound('User does not exist');

    // Update user profile
    const [updatedUser] = await db
      .update(userProfiles)
      .set({
        name,
        email,
        role: 'USER', // Always ensure role is USER
        isAdmin: !!isAdmin,
        subscriptionTier: subscriptionTier || 'HOBBY',
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, id))
      .returning();

    await logger.update(user, 'USER', id, {
      targetUser: existingUser.email,
      changes: { isAdmin: isAdmin, subscriptionTier: subscriptionTier || undefined },
    });

    return Response.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    if (!user.isAdmin) return forbidden('Only administrator has access');

    const { id } = await params;

    const existingUser = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, id),
    });

    if (!existingUser) return notFound('User does not exist');

    // Prevent deleting yourself
    if (id === user.id) {
      return forbidden('You cannot delete your own account');
    }

    // Prevent deleting admin users directly
    if (existingUser.role === 'ADMIN' || existingUser.isAdmin) {
      return forbidden(
        'You cannot delete a user with administrator privileges. Change their role to User first.'
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return serverError('Missing Supabase config to delete user');
    }

    const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteAuthError) {
      console.error('Error deleting user from Supabase Auth:', deleteAuthError);
      return serverError('Failed to delete user from auth service');
    }

    await db.delete(userProfiles).where(eq(userProfiles.id, id));

    await logger.delete(user, 'USER', id, { targetUser: existingUser.email });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return serverError();
  }
}
