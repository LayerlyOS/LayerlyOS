import { createClient } from '@supabase/supabase-js';
import { desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import {
  badRequest,
  requireAuth,
  requireAdmin,
  serverError,
} from '@/lib/api-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireAdmin(user);

    const allUsers = await db.query.userProfiles.findMany({
      orderBy: [desc(userProfiles.createdAt)],
      with: {
        printEntries: {
          columns: {
            deletedAt: true,
          },
        },
        printers: true,
        customers: true,
      },
    });

    const usersWithStats = allUsers.map((user) => {
      const activePrints = user.printEntries.filter((p) => !p.deletedAt).length;
      const totalPrints = user.printEntries.length;
      const deletedPrints = totalPrints - activePrints;

      const {
        printEntries,
        printers: userPrinters,
        customers: userCustomers,
        ...userData
      } = user;

      return {
        ...userData,
        _count: {
          printEntries: activePrints,
          printers: userPrinters.length,
          customers: userCustomers.length,
          deletedPrints,
        },
      };
    });

    return Response.json(usersWithStats);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Error fetching users:', error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireAdmin(user);

    const body = await req.json();
    const { name, email, password, isAdmin } = body;

    if (!name || !email || !password) {
      return badRequest('Required fields: name, email, password');
    }

    if (password.length < 8) {
      return badRequest('Password must be at least 8 characters');
    }

    // Check if user exists
    const existingUser = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.email, email),
    });

    if (existingUser) {
      return badRequest('User with this email already exists');
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        isAdmin: !!isAdmin,
        role: 'USER',
        subscriptionTier: 'HOBBY',
      },
    });

    if (authError || !authUser.user) {
      console.error('Error creating user in Supabase:', authError);
      return serverError();
    }

    // Profile will be created automatically by trigger, but we can verify it exists
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, authUser.user.id),
    });

    if (!profile) {
      // If trigger didn't create profile, create it manually
      await db.insert(userProfiles).values({
        id: authUser.user.id,
        email: authUser.user.email!,
        name,
        isAdmin: !!isAdmin,
        role: 'USER',
        subscriptionTier: 'HOBBY',
      });
    }

    return Response.json(profile || {
      id: authUser.user.id,
      email: authUser.user.email,
      name,
      isAdmin: !!isAdmin,
      role: 'USER',
      subscriptionTier: 'HOBBY',
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Error creating user:', error);
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireAdmin(user);

    const body = await req.json();
    const { userId, isAdmin } = body;

    if (!userId || isAdmin === undefined) {
      return badRequest('Missing data (userId, isAdmin)');
    }

    // Check if user exists
    const existingUser = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, userId),
    });

    if (!existingUser) {
      return badRequest('User does not exist');
    }

    const [updatedUser] = await db
      .update(userProfiles)
      .set({
        isAdmin: !!isAdmin,
        role: 'USER', // Ensure role stays as USER
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, userId))
      .returning();

    return Response.json(updatedUser);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Error updating user role:', error);
    return serverError();
  }
}
