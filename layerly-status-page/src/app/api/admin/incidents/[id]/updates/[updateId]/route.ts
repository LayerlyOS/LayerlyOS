import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { incidentUpdates } from '@/db/schema';
import { getStatusPageAdminFromRequest } from '@/lib/api-auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  const admin = await getStatusPageAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { updateId } = await params;
  try {
    await db.delete(incidentUpdates).where(eq(incidentUpdates.id, updateId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API incident update DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 });
  }
}
