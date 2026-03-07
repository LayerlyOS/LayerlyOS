import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: {
    default: 'Status Page',
    template: '%s | Status Page',
  },
  description: 'Real-time status and uptime monitoring',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
