import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

const HELP_DIR = join(process.cwd(), 'content', 'help');

export interface HelpArticleMeta {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  description?: string;
  author: string;
  authorInitials: string;
  updated: string;
  readingTimeMin: number;
  toc: { id: string; label: string }[];
  related: { slug: string; title: string; description?: string }[];
}

export interface HelpArticle {
  meta: HelpArticleMeta;
  content: string;
}

function slugFromFilename(name: string): string {
  return name.replace(/\.md$/, '');
}

export async function getHelpArticleSlugs(): Promise<string[]> {
  const dir = await readdir(HELP_DIR).catch(() => []);
  const files = dir.filter((f) => f.endsWith('.md'));
  return files.map(slugFromFilename);
}

export async function getHelpArticle(slug: string): Promise<HelpArticle | null> {
  const path = join(HELP_DIR, `${slug}.md`);
  let raw: string;
  try {
    raw = await readFile(path, 'utf-8');
  } catch {
    return null;
  }
  const { data: front, content } = matter(raw);
  const meta: HelpArticleMeta = {
    slug,
    title: front.title ?? slug,
    category: front.category ?? 'getting-started',
    categoryLabel: front.categoryLabel ?? 'Getting started',
    description: front.description,
    author: front.author ?? 'Layerly Team',
    authorInitials: front.authorInitials ?? 'LY',
    updated: front.updated ?? '',
    readingTimeMin: Number(front.readingTimeMin) || 4,
    toc: Array.isArray(front.toc) ? front.toc : [],
    related: Array.isArray(front.related) ? front.related : [],
  };
  return { meta, content: content.trim() };
}

export async function getHelpArticles(): Promise<HelpArticleMeta[]> {
  const slugs = await getHelpArticleSlugs();
  const articles: HelpArticleMeta[] = [];
  for (const slug of slugs) {
    const article = await getHelpArticle(slug);
    if (article) articles.push(article.meta);
  }
  return articles.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getHelpArticlesByCategory(
  categoryId: string
): Promise<HelpArticleMeta[]> {
  const all = await getHelpArticles();
  return all.filter((a) => a.category === categoryId);
}
