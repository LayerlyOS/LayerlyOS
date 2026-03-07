/**
 * Helper to safely parse float values, handling commas and defaults.
 */
export const safeParseFloat = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const normalized = val.replace(',', '.').trim();
    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Calculates the remaining weight of a filament spool based on its initial weight and print history.
 *
 * @param spoolWeight - Initial weight of the spool (e.g., in grams)
 * @param printEntries - List of print entries using this filament
 * @returns The calculated remaining weight
 */
export const calculateRemainingWeight = (
  spoolWeight: number,
  printEntries: { weight: number; qty: number }[]
): number => {
  const totalUsed = printEntries.reduce((sum, entry) => {
    return sum + entry.weight * entry.qty;
  }, 0);

  return spoolWeight - totalUsed;
};
