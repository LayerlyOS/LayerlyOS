import { Section, Text } from '@react-email/components';
import { EmailLayout } from '@/emails/EmailLayout';

interface PasswordChangedEmailProps {
  email: string;
}

export function PasswordChangedEmail({ email }: PasswordChangedEmailProps) {
  const subject = 'Your Layerly.cloud password has been changed';

  return (
    <EmailLayout
      previewText={subject}
      title={subject}
      headline="Your password has been changed"
    >
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
            fontSize: '14px',
            lineHeight: '1.7',
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
          This is a confirmation that the password for your Layerly.cloud account has been
          successfully updated.
        </Text>
        <Text
          style={{
            margin: 0,
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#6b7280',
          }}
        >
          If you did not perform this change, please log in immediately, update your password
          and contact us.
        </Text>
      </Section>
    </EmailLayout>
  );
}
