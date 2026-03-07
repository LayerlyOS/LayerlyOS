import { NextResponse } from 'next/server';
import { db } from '@/db';
import { statusPageAdmins } from '@/db/schema';

export async function GET() {
  try {
    const admins = await db.select().from(statusPageAdmins).limit(1);
    return NextResponse.json({ needsBootstrap: admins.length === 0 });
  } catch {
    return NextResponse.json({ needsBootstrap: true });
  }
}
