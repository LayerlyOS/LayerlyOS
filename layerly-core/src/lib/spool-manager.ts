import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { filaments } from '@/db/schema';

/**
 * Helper to find the "active" spool for a given user and material attributes.
 * Implements "Smart Distribution" logic:
 * 1. Find all matching spools sorted by creation date (FIFO).
 * 2. Find the first spool with remainingWeight > 0.
 * 3. If all are exhausted, return the last one (so we can continue decrementing into negative).
 */
export async function findActiveSpool(userId: string, brand: string | null, color: string | null) {
  if (!brand && !color) return null;

  const normalize = (s: string) => (s ? s.trim().toLowerCase().replace(/\s+/g, '') : '');
  const targetBrand = normalize(brand || '');
  const targetColor = normalize(color || '');

  // Fetch all user filaments
  const userFilaments = await db.query.filaments.findMany({
    where: eq(filaments.userId, userId),
    orderBy: [asc(filaments.createdAt)],
  });

  // Filter matches
  const matches = userFilaments.filter((f) => {
    const fBrand = f.brand;
    const fMaterial = f.materialName;
    const fullName = `${fBrand}${fMaterial}`;

    // Fuzzy match brand/material
    const brandMatch =
      normalize(fullName) === targetBrand ||
      normalize(fBrand) === targetBrand ||
      normalize(fMaterial) === targetBrand;

    // Fuzzy match color
    const fColor = f.color;
    const colorMatch = normalize(fColor) === targetColor || (!fColor && !targetColor);

    return brandMatch && colorMatch;
  });

  if (matches.length === 0) return null;

  // Find first with remaining > 0
  const active = matches.find((f) => (f.remainingWeight ?? f.spoolWeight) > 0);

  return active || matches[matches.length - 1];
}

export type DistributionResult = {
  primaryFilamentId: string | null;
  deductions: { id: string; amount: number }[];
};

/**
 * Calculates how to distribute a weight consumption across multiple spools (FIFO).
 * @param userId Owner ID
 * @param weight Total weight to consume
 * @param brand Brand name (for matching chain)
 * @param color Color (for matching chain)
 * @param startFilamentId Optional: specific filament ID to start from
 * @param bonusWeight Optional: extra weight to pretend the start filament has (e.g. from refund)
 */
export async function distributeWeight(
  userId: string,
  weight: number,
  brand: string | null,
  color: string | null,
  startFilamentId?: string | null,
  bonusWeight: number = 0
): Promise<DistributionResult> {
  // If no identifiers, we can't do anything
  if (!brand && !color && !startFilamentId) {
    return { primaryFilamentId: null, deductions: [] };
  }

  // 1. Fetch Candidate Spools
  // We need the chain to handle overflow.
  // If startFilamentId is given, we fetch it + others of same type.
  // If not, we fetch by brand/color.

  let candidates: any[] = [];

  if (startFilamentId) {
    const start = await db.query.filaments.findFirst({ where: eq(filaments.id, startFilamentId) });
    if (!start) return { primaryFilamentId: null, deductions: [] }; // Invalid ID

    // We use the start filament's attributes to find the rest of the chain
    // But maybe the user provided mismatching brand/color in the print?
    // We should trust the Filament's attributes for the chain.
    const normalize = (s: string) => (s ? s.trim().toLowerCase().replace(/\s+/g, '') : '');
    const targetBrand = normalize(start.brand);
    const targetColor = normalize(start.color);
    const targetMaterial = normalize(start.materialName);

    const all = await db.query.filaments.findMany({
      where: eq(filaments.userId, userId),
      orderBy: [asc(filaments.createdAt)],
    });

    candidates = all.filter((f) => {
      const fBrand = normalize(f.brand);
      const fColor = normalize(f.color);
      const fMaterial = normalize(f.materialName);

      // Exact-ish match to form a group
      // We match if Brand+Material is same, or just Brand is same
      // Let's use the same logic as findActiveSpool but strictly matching the 'start' filament
      const brandMatch = fBrand === targetBrand && fMaterial === targetMaterial;
      const colorMatch = fColor === targetColor;

      return brandMatch && colorMatch;
    });
  } else {
    // Logic similar to findActiveSpool
    const normalize = (s: string) => (s ? s.trim().toLowerCase().replace(/\s+/g, '') : '');
    const targetBrand = normalize(brand || '');
    const targetColor = normalize(color || '');

    const all = await db.query.filaments.findMany({
      where: eq(filaments.userId, userId),
      orderBy: [asc(filaments.createdAt)],
    });

    candidates = all.filter((f) => {
      const fBrand = f.brand;
      const fMaterial = f.materialName;
      const fullName = `${fBrand}${fMaterial}`;
      const fColor = f.color;

      const brandMatch =
        normalize(fullName) === targetBrand ||
        normalize(fBrand) === targetBrand ||
        normalize(fMaterial) === targetBrand;

      const colorMatch = normalize(fColor) === targetColor || (!fColor && !targetColor);

      return brandMatch && colorMatch;
    });
  }

  if (candidates.length === 0) {
    return { primaryFilamentId: null, deductions: [] };
  }

  // 2. Determine Start Index
  let startIndex = 0;
  if (startFilamentId) {
    startIndex = candidates.findIndex((f) => f.id === startFilamentId);
    if (startIndex === -1) startIndex = 0; // Should not happen if filtered correctly, but safety
  } else {
    // Find first with remaining > 0
    startIndex = candidates.findIndex((f) => (f.remainingWeight ?? f.spoolWeight) > 0);
    if (startIndex === -1) startIndex = candidates.length - 1; // All empty, start at last
  }

  // 3. Distribute
  const deductions: { id: string; amount: number }[] = [];
  let remainingToDeduct = weight;
  let currentIndex = startIndex;

  // Primary is where we start

  while (remainingToDeduct > 0 && currentIndex < candidates.length) {
    const spool = candidates[currentIndex];
    let available = spool.remainingWeight ?? spool.spoolWeight;

    // Apply bonus if this is the start filament
    if (startFilamentId && spool.id === startFilamentId) {
      available += bonusWeight;
    }

    // If we are at the last spool, we dump everything here (even if negative)
    if (currentIndex === candidates.length - 1) {
      deductions.push({ id: spool.id, amount: remainingToDeduct });
      remainingToDeduct = 0;
    } else {
      // Take what we can, move to next
      // If available <= 0, we take 0 and move on (unless we started here? No, loop handles it)
      let take = 0;
      if (available > 0) {
        take = Math.min(available, remainingToDeduct);
      }

      if (take > 0) {
        deductions.push({ id: spool.id, amount: take });
        remainingToDeduct -= take;
      }

      if (remainingToDeduct > 0) {
        currentIndex++;
      }
    }
  }

  return {
    primaryFilamentId:
      startFilamentId || (candidates[startIndex] ? candidates[startIndex].id : null),
    deductions,
  };
}

/**
 * Calculates how to refund weight to spools (LIFO - Last In First Out).
 * This ensures that when a print is deleted, we fill up the newest spools first,
 * maintaining the logic that older spools are consumed first.
 */
export async function calculateRefund(
  userId: string,
  weightToRefund: number,
  filamentId: string // The filament ID the print was attached to
): Promise<{ id: string; amount: number }[]> {
  if (weightToRefund <= 0) return [];

  // 1. Get the starting filament to identify the group
  const filament = await db.query.filaments.findFirst({
    where: and(eq(filaments.id, filamentId), eq(filaments.userId, userId)),
  });

  if (!filament) {
    // Filament doesn't exist? Just ignore or return empty?
    return [];
  }

  // 2. Find all spools in the group
  const normalize = (s: string) => (s ? s.trim().toLowerCase().replace(/\s+/g, '') : '');
  const targetBrand = normalize(filament.brand);
  const targetColor = normalize(filament.color);
  const targetMaterial = normalize(filament.materialName);

  const group = await db.query.filaments.findMany({
    where: eq(filaments.userId, userId),
    orderBy: [desc(filaments.createdAt)], // LIFO: Newest first
  });

  const candidates = group.filter((f) => {
    const fBrand = normalize(f.brand);
    const fColor = normalize(f.color);
    const fMaterial = normalize(f.materialName);

    return fBrand === targetBrand && fColor === targetColor && fMaterial === targetMaterial;
  });

  if (candidates.length === 0) return [];

  // 3. Distribute refund
  let remainingRefund = weightToRefund;
  const refunds: { id: string; amount: number }[] = [];

  for (const spool of candidates) {
    if (remainingRefund <= 0) break;

    const currentWeight = spool.remainingWeight ?? spool.spoolWeight;
    const capacity = spool.spoolWeight;
    const missing = capacity - currentWeight;

    if (missing > 0) {
      const amount = Math.min(remainingRefund, missing);
      refunds.push({ id: spool.id, amount });
      remainingRefund -= amount;
    }
  }

  // If there's still refund left (e.g. all spools are full), dump it into the newest one (first one)
  // This handles cases where user might have reduced spool weight or other anomalies
  if (remainingRefund > 0 && candidates.length > 0) {
    const first = candidates[0];
    // Check if we already added a refund for this spool
    const existing = refunds.find((r) => r.id === first.id);
    if (existing) {
      existing.amount += remainingRefund;
    } else {
      refunds.push({ id: first.id, amount: remainingRefund });
    }
  }

  return refunds;
}
