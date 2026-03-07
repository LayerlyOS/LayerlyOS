import { Link, Section, Text } from '@react-email/components';
import { EmailLayout } from '@/emails/EmailLayout';

interface PasswordResetEmailProps {
  email: string;
  resetUrl: string;
}

export function PasswordResetEmail({ email, resetUrl }: PasswordResetEmailProps) {
  const title = 'Reset your Layerly.cloud password';

  return (
    <EmailLayout previewText={title} title={title} headline="Reset your password">
      <Section
        style={{
          borderRadius: '20px',
          padding: '22px 22px 18px',
          background:
            'linear-gradient(135deg, #eef2ff, #eff6ff)',
          border: '1px solid #e0e7ff',
        }}
      >
        <Text
          style={{
            margin: '0 0 10px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#4f46e5',
          }}
        >
          Security notification
        </Text>
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
          We received a request to reset the password for your Layerly.cloud account.
        </Text>
        <Text
          style={{
            margin: '0 0 12px',
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#6b7280',
          }}
        >
          If you did not request this, you can safely ignore this email.
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
          href={resetUrl}
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
          Set a new password
        </Link>
      </Section>

      <Section
        style={{
          marginTop: '10px',
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
          For security reasons, this link will expire after a short time.
        </Text>
      </Section>

      <Section
        style={{
          marginTop: '20px',
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
          If you did not try to change your password, log in and update your credentials for
          security.
        </Text>
      </Section>
    </EmailLayout>
  );
}
