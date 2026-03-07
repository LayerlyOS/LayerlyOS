import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { filaments } from '@/db/schema';
import { forbidden, getUserFromRequest, notFound, serverError, unauthorized } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const { sourceId, targetId } = await req.json();

    if (!sourceId || !targetId) {
      return new NextResponse('Missing sourceId or targetId', { status: 400 });
    }

    if (sourceId === targetId) {
      return new NextResponse('Cannot merge filament with itself', { status: 400 });
    }

    const [source, target] = await Promise.all([
      db.query.filaments.findFirst({ where: eq(filaments.id, sourceId) }),
      db.query.filaments.findFirst({ where: eq(filaments.id, targetId) }),
    ]);

    if (!source || !target) return notFound('Filament not found');

    // Check ownership
    if (source.userId !== user.id || target.userId !== user.id) {
      return forbidden('Access denied');
    }

    // Merge logic:
    // 1. Add source remaining weight to target
    // 2. Soft delete source
    // 3. Update target

    const newWeight = (Number(target.remainingWeight) || 0) + (Number(source.remainingWeight) || 0);

    // Transaction to ensure consistency
    const result = await db.transaction(async (tx) => {
      const [updatedTarget] = await tx
        .update(filaments)
        .set({ remainingWeight: newWeight })
        .where(eq(filaments.id, targetId))
        .returning();

      await tx
        .update(filaments)
        .set({
          remainingWeight: 0,
          deletedAt: new Date(),
          notes: `${source.notes || ''} [Merged into ${target.materialName} ${target.color}]`,
        })
        .where(eq(filaments.id, sourceId));

      return updatedTarget;
    });

    return NextResponse.json({ success: true, target: result });
  } catch (error) {
    console.error('Merge error:', error);
    return serverError();
  }
}
