import Link from 'next/link';

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-slate-400">
            <p
              className="shrink-0"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: translation contains html
              dangerouslySetInnerHTML={{ __html: `&copy; ${year} Layerly. All rights reserved.` }}
            />
            <span className="hidden sm:inline text-slate-600">·</span>
            <Link href="/legal?doc=terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/legal?doc=privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/legal?doc=cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
          <div className="flex space-x-6">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <span className="sr-only">Facebook</span>
              <i className="fa-brands fa-facebook text-xl"></i>
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <span className="sr-only">Instagram</span>
              <i className="fa-brands fa-instagram text-xl"></i>
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <span className="sr-only">Twitter</span>
              <i className="fa-brands fa-x-twitter text-xl"></i>
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <span className="sr-only">GitHub</span>
              <i className="fa-brands fa-github text-xl"></i>
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <span className="sr-only">YouTube</span>
              <i className="fa-brands fa-youtube text-xl"></i>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
