import { Link, Section, Text } from '@react-email/components';
import { EmailLayout } from '@/emails/EmailLayout';

interface EmailConfirmationEmailProps {
  email: string;
  confirmUrl: string;
}

export function EmailConfirmationEmail({ email, confirmUrl }: EmailConfirmationEmailProps) {
  const title = 'Confirm your email for Layerly.cloud';

  return (
    <EmailLayout previewText={title} title={title} headline="Confirm your email">
      <Section
        style={{
          borderRadius: '20px',
          padding: '22px 22px 18px',
          background: 'linear-gradient(135deg, #ecfeff, #eff6ff)',
          border: '1px solid #e0f2fe',
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
            margin: '0 0 8px',
            fontSize: '14px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          Thanks for creating a Layerly.cloud account. Please confirm your email address to
          activate your account and start calculating your 3D printing costs.
        </Text>
      </Section>

      <Section
        style={{
          textAlign: 'center',
          marginTop: '22px',
          marginBottom: '10px',
        }}
      >
        <Link
          href={confirmUrl}
          style={{
            display: 'inline-block',
            padding: '12px 26px',
            borderRadius: '999px',
            backgroundColor: '#0f766e',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(15,118,110,0.35)',
            letterSpacing: '0.02em',
          }}
        >
          Confirm email and continue
        </Link>
      </Section>

      <Section
        style={{
          marginTop: '16px',
        }}
      >
        <Text
          style={{
            margin: '0 0 4px',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          After confirming, you will be able to:
        </Text>
        <Text
          style={{
            margin: '0 0 4px',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          • Create precise 3D print cost estimates in minutes.
        </Text>
        <Text
          style={{
            margin: '0 0 4px',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          • Manage your filaments, printers and customers in one place.
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#4b5563',
          }}
        >
          • Share professional quotes with your clients.
        </Text>
      </Section>

      <Section
        style={{
          marginTop: '18px',
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          If you did not create this account, you can safely ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}

