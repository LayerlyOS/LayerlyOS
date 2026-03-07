import type { Metadata } from 'next';
import React from 'react';
import 'flag-icons/css/flag-icons.min.css';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { getUser } from '@/lib/auth';
import { getEffectivePlan } from '@/lib/plans';
import { getPlanConfig } from '@/config/subscription';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://layerly.cloud'),
  title: {
    default: 'Layerly.cloud – 3D Print Cost Calculator & Inventory Manager',
    template: '%s | Layerly.cloud',
  },
  description:
    'Layerly.cloud is an advanced 3D print cost calculator and filament inventory manager for professionals and print farms.',
  keywords: [
    '3d print calculator',
    '3d print quoting',
    'filament management',
    '3d printing cost calculator',
    'filament inventory',
  ],
  openGraph: {
    title: 'Layerly.cloud – Cloud 3D Print Cost Calculator',
    description:
      'Accurately calculate job costs, manage filament inventory, and increase your margin with Layerly.cloud.',
    url: 'https://layerly.cloud',
    siteName: 'Layerly.cloud',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Layerly.cloud',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Layerly.cloud – 3D Print Cost Calculator',
    description:
      'Professional tool for 3D print quoting and filament management – Layerly.cloud.',
    images: ['/opengraph-image'],
  },
};

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = 'en';
  const user = await getUser();
  const effective = user ? await getEffectivePlan(user.subscriptionTier) : null;
  const initialPlan = (effective || getPlanConfig(undefined)) as unknown as import('@/config/subscription').PlanConfig;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Layerly.cloud',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://layerly.cloud',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${
        process.env.NEXT_PUBLIC_APP_URL || 'https://layerly.cloud'
      }/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang={locale}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <JsonLd data={jsonLdData} />
      </head>
      <body
        className="min-h-screen flex flex-col bg-slate-50 text-slate-800"
        suppressHydrationWarning={true}
      >
        <ToastProvider>
          <AppShell initialPlan={initialPlan}>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
