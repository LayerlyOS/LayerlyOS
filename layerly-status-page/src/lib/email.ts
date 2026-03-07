import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendMonitorDownAlert(
  to: string,
  monitorName: string,
  url: string
): Promise<void> {
  const client = getResend();
  if (!client) return; // silently skip if no API key configured

  try {
    await client.emails.send({
      from: 'Status Page <onboarding@resend.dev>',
      to,
      subject: `🔴 ${monitorName} is down`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px;">
          <h2 style="color: #dc2626;">🔴 Monitor Down Alert</h2>
          <p><strong>${monitorName}</strong> is currently <strong>down</strong>.</p>
          <p style="color: #64748b;">URL: <code>${url}</code></p>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
            This alert was sent by your Status Page monitor.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[email] Failed to send down alert:', err);
  }
}

export async function sendMonitorRecoveryAlert(
  to: string,
  monitorName: string,
  url: string
): Promise<void> {
  const client = getResend();
  if (!client) return;

  try {
    await client.emails.send({
      from: 'Status Page <onboarding@resend.dev>',
      to,
      subject: `✅ ${monitorName} is back up`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px;">
          <h2 style="color: #059669;">✅ Monitor Recovered</h2>
          <p><strong>${monitorName}</strong> is back <strong>operational</strong>.</p>
          <p style="color: #64748b;">URL: <code>${url}</code></p>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
            This alert was sent by your Status Page monitor.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[email] Failed to send recovery alert:', err);
  }
}
