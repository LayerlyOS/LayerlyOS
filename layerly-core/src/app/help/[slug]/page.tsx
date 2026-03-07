import { notFound } from 'next/navigation';
import { getHelpArticle, getHelpArticleSlugs } from '@/lib/help-content';
import { ArticleClient } from './ArticleClient';

export async function generateStaticParams() {
  const slugs = await getHelpArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getHelpArticle(slug);
  if (!article) notFound();
  return <ArticleClient article={article} />;
}
