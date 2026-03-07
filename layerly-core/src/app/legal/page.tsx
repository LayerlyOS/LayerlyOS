import { Suspense } from 'react';
import { getLegalContent } from '@/lib/legal-content';
import { LegalClient } from './LegalClient';

export default async function LegalPage() {
  const { terms, privacy, cookies, lastUpdated } = await getLegalContent();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <LegalClient
        terms={terms}
        privacy={privacy}
        cookies={cookies}
        lastUpdated={lastUpdated}
      />
    </Suspense>
  );
}
