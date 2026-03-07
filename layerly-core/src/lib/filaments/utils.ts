export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export function isValidHexColor(hex: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
}

export function normalizeColor(hex: string): string {
  if (!hex) return '#000000';
  let cleanHex = hex.trim();
  if (!cleanHex.startsWith('#')) {
    cleanHex = `#${cleanHex}`;
  }
  return isValidHexColor(cleanHex) ? cleanHex.toUpperCase() : '#000000';
}

export function normalizeMaterial(material: string): string {
  if (!material) return 'UNKNOWN';
  return material.toUpperCase().trim();
}
