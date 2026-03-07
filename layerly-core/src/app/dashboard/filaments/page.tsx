'use client';

import dynamic from 'next/dynamic';

const FilamentsView = dynamic(
  () => import('@/features/filaments/components/FilamentsView'),
  { ssr: false }
);

export default function FilamentsPage() {
  return <FilamentsView />;
}
