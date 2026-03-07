import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { statusPageAdmins } from '@/db/schema';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const admins = await db.select().from(statusPageAdmins).limit(1);
    if (admins.length > 0) {
      return NextResponse.json({ error: 'Bootstrap already completed' }, { status: 400 });
    }

    const body = await req.json();
    const email = body?.email?.trim();
    const password = body?.password;

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Email and password (min 6 chars) required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!user?.user?.id) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    await db.insert(statusPageAdmins).values({ userId: user.user.id });

    return NextResponse.json({ success: true, message: 'Admin created. You can now sign in.' });
  } catch (err) {
    console.error('[bootstrap]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Bootstrap failed' },
      { status: 500 }
    );
  }
}
