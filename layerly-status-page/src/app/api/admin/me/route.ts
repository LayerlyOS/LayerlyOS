import { NextResponse } from 'next/server';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';

export async function GET(req: Request) {
  const admin = await getStatusPageAdminFromRequest(req as import('next/server').NextRequest);
  if (!admin) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
  return NextResponse.json({ isAdmin: true, id: admin.id, email: admin.email });
}
