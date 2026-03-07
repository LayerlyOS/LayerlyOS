import { Link, Section, Text } from '@react-email/components';
import { EmailLayout } from '@/emails/EmailLayout';

interface WelcomeEmailProps {
  email: string;
}

export function WelcomeEmail({ email }: WelcomeEmailProps) {
  const title = 'Welcome to Layerly.cloud';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://layerly.cloud';

  return (
    <EmailLayout previewText={title} title={title} headline="Thanks for joining!">
      <Section
        style={{
          borderRadius: '20px',
          padding: '20px 20px 18px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
        }}
      >
        <Text
          style={{
            margin: '0 0 12px',
            fontSize: '15px',
            lineHeight: '1.6',
            color: '#0f172a',
          }}
        >
          Hi {email},
        </Text>
        <Text
          style={{
            margin: '0 0 10px',
            fontSize: '14px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          Welcome to Layerly.cloud. You now have a dedicated workspace to manage your 3D printing
          business and understand the real cost of every print.
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          Here is what you can do next:
        </Text>
      </Section>

      <Section
        style={{
          marginTop: '16px',
          borderRadius: '20px',
          padding: '18px 20px 16px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
        }}
      >
        <Text
          style={{
            margin: '0 0 6px',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          • Add your printers with their real hourly rates and maintenance settings.
        </Text>
        <Text
          style={{
            margin: '0 0 6px',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          • Configure filament spools with purchase price, weight and remaining material.
        </Text>
        <Text
          style={{
            margin: '0 0 6px',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          • Create orders for your clients and generate transparent cost breakdowns.
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          • Track print history and keep your material inventory always up to date.
        </Text>
      </Section>

      <Section
        style={{
          textAlign: 'center',
          marginTop: '24px',
          marginBottom: '12px',
        }}
      >
        <Link
          href={`${appUrl}/dashboard`}
          style={{
            display: 'inline-block',
            padding: '12px 26px',
            borderRadius: '999px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(37,99,235,0.35)',
            letterSpacing: '0.02em',
          }}
        >
          Go to dashboard
        </Link>
      </Section>

    </EmailLayout>
  );
}
