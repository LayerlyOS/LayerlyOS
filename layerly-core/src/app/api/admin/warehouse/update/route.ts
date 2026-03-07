import { asc, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { filaments, printEntries } from '@/db/schema';
import { forbidden, getUserFromRequest, unauthorized } from '@/lib/api-auth';

type Filament = typeof filaments.$inferSelect;
type PrintEntry = typeof printEntries.$inferSelect & { filament?: Filament | null };

type FilamentGroup = {
  key: string;
  spools: Filament[];
  prints: PrintEntry[];
};

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) return unauthorized();
    if (!user.isAdmin) return forbidden('Only administrator has access');

    // 1. Fetch all filaments (all users)
    const allFilaments = await db.query.filaments.findMany({
      orderBy: [asc(filaments.createdAt)],
    });

    // 2. Fetch all active prints (all users)
    const allPrints = await db.query.printEntries.findMany({
      where: isNull(printEntries.deletedAt),
      orderBy: [asc(printEntries.date)], // FIFO
      with: { filament: true },
    });

    // 3. Group by User + Brand + Material + Color
    const groups = new Map<string, FilamentGroup>();

    const normalize = (s: string) => (s ? s.trim().toLowerCase().replace(/\s+/g, '') : '');
    const getKey = (userId: string, brand: string, material: string, color: string) => {
      return `${userId}|${normalize(brand)}|${normalize(material)}|${normalize(color)}`;
    };

    // Initialize groups
    for (const f of allFilaments) {
      if (!f.userId) continue;
      if (f.deletedAt) continue; // Skip deleted spools to prevent ghost inventory
      const key = getKey(f.userId, f.brand, f.materialName, f.color);
      if (!groups.has(key)) {
        groups.set(key, { key, spools: [], prints: [] });
      }
      groups.get(key)?.spools.push(f);
    }

    const cleanColor = (c: string) => normalize(c).replace(/\(.*\)/g, '');

    // Assign prints to groups
    for (const p of allPrints) {
      if (!p.userId) continue;

      let key = '';

      // 1. Try strict match if filament is known and group exists
      if (p.filament) {
        const fUserId = p.filament.userId || p.userId;
        const strictKey = getKey(
          fUserId,
          p.filament.brand,
          p.filament.materialName,
          p.filament.color
        );
        if (groups.has(strictKey)) {
          key = strictKey;
        }
      }

      // 2. If no strict match (unlinked OR linked-but-group-deleted), try fuzzy match
      if (!key) {
        // Use filament props if available (better data), otherwise print props
        // Note: p might not have materialName if unlinked, but brand/color should be there
        const source = p.filament || p;
        const targetBrand = normalize(source.brand || '');
        const targetColorRaw = normalize(source.color || '');
        const targetColorClean = cleanColor(source.color || '');

        // Find a group that matches
        for (const [gKey, group] of groups.entries()) {
          // Ensure we only match groups belonging to the print owner
          if (!gKey.startsWith(`${p.userId}|`)) continue;

          const sample = group.spools[0];
          const sampleBrand = normalize(sample.brand);
          const sampleColorRaw = normalize(sample.color);
          const sampleColorClean = cleanColor(sample.color);

          const matchBrand =
            sampleBrand === targetBrand ||
            normalize(sampleBrand + sample.materialName) === targetBrand;

          // Match color: Exact OR Cleaned (ignoring code in parens) OR Contains (if long enough)
          const matchColor =
            sampleColorRaw === targetColorRaw ||
            sampleColorClean === targetColorClean ||
            (targetColorClean.length > 3 && sampleColorClean.includes(targetColorClean)) ||
            (sampleColorClean.length > 3 && targetColorClean.includes(sampleColorClean));

          if (matchBrand && matchColor) {
            key = gKey;
            break;
          }
        }
      }

      if (key && groups.has(key)) {
        groups.get(key)?.prints.push(p);
      }
    }

    const printUpdates: { id: string; filamentId: string }[] = [];
    const filamentUpdates: { id: string; remainingWeight: number }[] = [];
    let updatedCount = 0;
    let checkedCount = 0;

    // 4. Process each group
    for (const group of groups.values()) {
      const { spools, prints } = group;

      // Sim state
      const spoolStates = spools.map((s) => ({
        id: s.id,
        capacity: s.spoolWeight,
        remaining: s.spoolWeight, // Start fresh full
        originalRemaining: s.remainingWeight,
      }));

      let activeSpoolIdx = 0;

      for (const print of prints) {
        let needed = print.weight * print.qty;
        let allocated = false;

        while (!allocated) {
          if (activeSpoolIdx >= spoolStates.length) {
            activeSpoolIdx = spoolStates.length - 1;
          }

          const currentSpool = spoolStates[activeSpoolIdx];

          // If current spool exhausted and we have next, switch
          if (currentSpool.remaining <= 0 && activeSpoolIdx < spoolStates.length - 1) {
            activeSpoolIdx++;
            continue;
          }

          // Link print to this spool (last one wins if split)
          if (print.filamentId !== currentSpool.id) {
            printUpdates.push({ id: print.id, filamentId: currentSpool.id });
          }

          if (currentSpool.remaining >= needed) {
            currentSpool.remaining -= needed;
            allocated = true;
          } else {
            // Consume remainder
            if (activeSpoolIdx < spoolStates.length - 1) {
              const available = currentSpool.remaining;
              if (available > 0) {
                currentSpool.remaining = 0;
                needed -= available;
              }
              activeSpoolIdx++;
              // Continue loop with rest of needed
            } else {
              // Last spool, go negative
              currentSpool.remaining -= needed;
              allocated = true;
            }
          }
        }
      }

      // Generate filament updates
      for (const s of spoolStates) {
        checkedCount++;
        // Check if different from DB
        const currentDb = s.originalRemaining ?? s.capacity;
        const diff = Math.abs(currentDb - s.remaining);

        // Update if diff > 0.01 OR if it was null
        if (diff > 0.01 || s.originalRemaining === null) {
          filamentUpdates.push({ id: s.id, remainingWeight: s.remaining });
          updatedCount++;
        }
      }
    }

    if (printUpdates.length > 0 || filamentUpdates.length > 0) {
      // Execute in chunks if needed, but simple transaction for now
      await db.transaction(async (tx) => {
        for (const p of printUpdates) {
          await tx
            .update(printEntries)
            .set({ filamentId: p.filamentId })
            .where(eq(printEntries.id, p.id));
        }
        for (const f of filamentUpdates) {
          await tx
            .update(filaments)
            .set({ remainingWeight: f.remainingWeight })
            .where(eq(filaments.id, f.id));
        }
      });
    }

    return Response.json({
      success: true,
      checkedCount,
      updatedCount,
      message: `Updated ${updatedCount} warehouse items (Smart Distribution).`,
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
