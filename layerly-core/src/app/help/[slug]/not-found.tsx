import Link from 'next/link';
import { LifeBuoy, ArrowLeft } from 'lucide-react';

export default function HelpArticleNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mb-6">
        <LifeBuoy className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Article not found</h1>
      <p className="text-slate-500 font-medium mb-8 text-center max-w-md">
        This help article does not exist or has been moved.
      </p>
      <Link
        href="/help"
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Help Center
      </Link>
    </div>
  );
}
