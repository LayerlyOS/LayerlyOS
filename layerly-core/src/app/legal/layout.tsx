import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal – Terms, Privacy & Cookies',
  description:
    'Layerly terms of service, privacy policy (GDPR) and cookie policy. Compliance and data protection information.',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
