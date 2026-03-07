import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

interface EmailLayoutProps {
  previewText: string;
  title: string;
  headline?: string;
  children: ReactNode;
}

export function EmailLayout({ previewText, title, headline, children }: EmailLayoutProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://layerly.cloud';

  return (
    <Html>
      <Head>
        <title>{title}</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#f3f4f6',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, -system-ui, sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            padding: '32px 16px',
          }}
        >
          <Section
            style={{
              borderRadius: '28px',
              padding: '1px',
              background:
                'linear-gradient(135deg, #e0e7ff, #f5f3ff, #e0f2fe)',
            }}
          >
            <Section
              style={{
                borderRadius: '24px',
                padding: '24px 24px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
              }}
            >
              <Section
                style={{
                  textAlign: 'center',
                  marginBottom: '22px',
                }}
              >
                <Link
                  href={appUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <div
                    style={{
                      width: '220px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- React Email requires img for HTML emails */}
                    <img
                      src={`${appUrl}/api/logo`}
                      alt="Layerly"
                      width={220}
                      height={63}
                      style={{
                        display: 'block',
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  </div>
                </Link>
                <Text
                  style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#6b7280',
                  }}
                >
                  3D print cost calculator and filament inventory manager
                </Text>
              </Section>

              {headline && (
                <Section
                  style={{
                    textAlign: 'center',
                    marginBottom: '18px',
                  }}
                >
                  <Text
                    style={{
                      margin: 0,
                      fontSize: '24px',
                      lineHeight: '1.3',
                      fontWeight: 700,
                      color: '#0f172a',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {headline}
                  </Text>
                </Section>
              )}

              {children}

              <Section
                style={{
                  marginTop: '18px',
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '16px',
                  textAlign: 'center',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- React Email requires img for HTML emails */}
                <img
                  src={`${appUrl}/icon`}
                  alt="Layerly"
                  width={32}
                  height={32}
                  style={{
                    display: 'inline-block',
                  }}
                />
              </Section>
            </Section>
          </Section>

          <Section
            style={{
              textAlign: 'center',
              marginTop: '16px',
            }}
          >
            <Text
              style={{
                fontSize: '11px',
                color: '#9ca3af',
                margin: 0,
              }}
            >
              © {new Date().getFullYear()} Layerly.cloud. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
