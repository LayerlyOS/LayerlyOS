import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const LEGAL_DIR = join(process.cwd(), 'content', 'legal');

export async function getLegalContent() {
  const [terms, privacy, cookies, configBuf] = await Promise.all([
    readFile(join(LEGAL_DIR, 'terms.md'), 'utf-8'),
    readFile(join(LEGAL_DIR, 'privacy.md'), 'utf-8'),
    readFile(join(LEGAL_DIR, 'cookies.md'), 'utf-8'),
    readFile(join(LEGAL_DIR, 'config.json'), 'utf-8'),
  ]);

  let lastUpdated = '21 February 2026';
  try {
    const config = JSON.parse(configBuf) as { lastUpdated?: string };
    if (config.lastUpdated) lastUpdated = config.lastUpdated;
  } catch {
    // use default
  }

  return { terms, privacy, cookies, lastUpdated };
}
