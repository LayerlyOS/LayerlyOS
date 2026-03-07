import type { NextRequest } from 'next/server';
import {
  bambuLogin,
  bambuLoginWithTfa,
} from '@/lib/bambu-cloud-auth';

/** Body for agent / dev login-only endpoint. */
type BambuLoginBody = {
  email?: string;
  password?: string;
  tfaCode?: string;
};

/**
 * POST /api/dev/bambu-login
 * Login to Bambu Cloud (email + password, optional tfaCode).
 * Used by the Go agent when BAMBU_EMAIL + BAMBU_PASSWORD (+ BAMBU_TFA_CODE) are set.
 * Returns { accessToken } or { require2FA } | { requireVerificationCode } | { requireTfaFromBrowser, tfaKey }.
 */
export async function POST(req: NextRequest) {
  let body: BambuLoginBody;
  try {
    body = (await req.json()) as BambuLoginBody;
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const email = body.email?.trim();
  const password = body.password;
  const tfaCode = body.tfaCode?.trim();

  if (!email || !password) {
    return Response.json(
      { success: false, error: 'Missing required fields: email, password' },
      { status: 400 }
    );
  }

  try {
    if (tfaCode) {
      const result = await bambuLoginWithTfa(email, password, tfaCode);
      if (typeof result === 'object' && result.requireTfaFromBrowser) {
        return Response.json({
          success: false,
          requireTfaFromBrowser: true,
          tfaKey: result.tfaKey,
        });
      }
      return Response.json({
        success: true,
        accessToken: result as string,
      });
    }

    const result = await bambuLogin(email, password);
    if (typeof result === 'object') {
      if ('require2FA' in result) {
        return Response.json({ success: false, require2FA: true });
      }
      return Response.json({
        success: false,
        requireVerificationCode: true,
      });
    }
    return Response.json({ success: true, accessToken: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ success: false, error: message }, { status: 401 });
  }
}
