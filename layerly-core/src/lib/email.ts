import { Resend } from 'resend';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { PasswordResetEmail } from '@/emails/PasswordResetEmail';
import { PasswordChangedEmail } from '@/emails/PasswordChangedEmail';
import { EmailConfirmationEmail } from '@/emails/EmailConfirmationEmail';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactElement;
}) {
  const resend = getResendClient();
  const html = await render(react);

  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email preview (no RESEND_API_KEY set):', { to, subject, html });
    }
    return;
  }

  await resend.emails.send({
    from: 'Layerly.cloud <contact@layerly.cloud>',
    to,
    subject,
    html,
  });
}

export async function sendWelcomeEmail({ email }: { email: string }) {
  const subject = 'Welcome to Layerly.cloud';

  await sendEmail({
    to: email,
    subject,
    react: WelcomeEmail({ email }),
  });
}

export async function sendEmailConfirmationEmail({
  email,
  confirmUrl,
}: {
  email: string;
  confirmUrl: string;
}) {
  const subject = 'Confirm your email for Layerly.cloud';

  await sendEmail({
    to: email,
    subject,
    react: EmailConfirmationEmail({ email, confirmUrl }),
  });
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  const subject = 'Reset your Layerly.cloud password';

  await sendEmail({
    to: email,
    subject,
    react: PasswordResetEmail({ email, resetUrl }),
  });
}

export async function sendPasswordChangedEmail({ email }: { email: string }) {
  const subject = 'Your Layerly.cloud password has been changed';

  await sendEmail({
    to: email,
    subject,
    react: PasswordChangedEmail({ email }),
  });
}
