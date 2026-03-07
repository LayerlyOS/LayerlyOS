import type { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import {
  bambuLogin,
  bambuLoginWithTfa,
  bambuLoginWithCode,
  bambuPreference,
  bambuBind,
} from '@/lib/bambu-cloud-auth';
import { getSession, getCookieName } from '@/app/api/dev/bambu-session/store';

const REPORT_TIMEOUT_MS = 10_000;
const STATUS_TIMEOUT_MS = 15_000;
const SEQUENCE_ID = '0';
const PUSHALL_SEQUENCE = '1';

type Body = {
  mode?: 'lan' | 'cloud';
  action?: 'get_version' | 'get_status';
  // LAN
  printerIp?: string;
  deviceId?: string;
  accessCode?: string;
  // Cloud
  email?: string;
  password?: string;
  verificationCode?: string;
  tfaCode?: string; // 2FA code (TOTP from authenticator app)
  cloudAccessToken?: string; // saved token – skips login
  cloudDeviceId?: string;
};

function getCaCert(): Buffer {
  const certPath = path.join(process.cwd(), 'content', 'bambu', 'ca_cert.pem');
  if (!fs.existsSync(certPath)) {
    throw new Error('Bambu CA certificate not found at content/bambu/ca_cert.pem');
  }
  return fs.readFileSync(certPath);
}

function runMqttGetVersion(
  client: ReturnType<typeof import('mqtt').connect>,
  reportTopic: string,
  requestTopic: string
): Promise<{ success: true; data: unknown } | { success: false; error: string }> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      client.removeAllListeners();
      client.end(true);
      resolve({
        success: false,
        error: `Timeout: no response from printer within ${REPORT_TIMEOUT_MS / 1000}s`,
      });
    }, REPORT_TIMEOUT_MS);

    client.on('error', (err) => {
      clearTimeout(timeoutId);
      client.removeAllListeners();
      client.end(true);
      resolve({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    client.on('connect', () => {
      client.subscribe(reportTopic, (err) => {
        if (err) {
          clearTimeout(timeoutId);
          client.removeAllListeners();
          client.end(true);
          resolve({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          });
          return;
        }
        const requestPayload = JSON.stringify({
          info: { sequence_id: SEQUENCE_ID, command: 'get_version' },
        });
        client.publish(requestTopic, requestPayload);
      });
    });

    client.on('message', (topic, rawMessage) => {
      if (topic !== reportTopic) return;
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(rawMessage.toString()) as Record<string, unknown>;
      } catch {
        return;
      }
      const info = payload.info as Record<string, unknown> | undefined;
      if (!info || info.command !== 'get_version') return;
      if (String(info.sequence_id) !== SEQUENCE_ID) return;
      clearTimeout(timeoutId);
      client.removeAllListeners();
      client.end(true);
      resolve({ success: true, data: payload });
    });
  });
}

/** Request full printer status (pushall); returns first report that looks like status. */
function runMqttGetStatus(
  client: ReturnType<typeof import('mqtt').connect>,
  reportTopic: string,
  requestTopic: string
): Promise<{ success: true; data: unknown } | { success: false; error: string }> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      client.removeAllListeners();
      client.end(true);
      resolve({
        success: false,
        error: `Timeout: no status from printer within ${STATUS_TIMEOUT_MS / 1000}s`,
      });
    }, STATUS_TIMEOUT_MS);

    client.on('error', (err) => {
      clearTimeout(timeoutId);
      client.removeAllListeners();
      client.end(true);
      resolve({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    client.on('connect', () => {
      client.subscribe(reportTopic, (err) => {
        if (err) {
          clearTimeout(timeoutId);
          client.removeAllListeners();
          client.end(true);
          resolve({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          });
          return;
        }
        const requestPayload = JSON.stringify({
          pushing: {
            sequence_id: PUSHALL_SEQUENCE,
            command: 'pushall',
            version: 1,
            push_target: 1,
          },
        });
        client.publish(requestTopic, requestPayload);
      });
    });

    client.on('message', (topic, rawMessage) => {
      if (topic !== reportTopic) return;
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(rawMessage.toString()) as Record<string, unknown>;
      } catch {
        return;
      }
      const print = payload.print as Record<string, unknown> | undefined;
      if (!print || typeof print !== 'object') return;
      const hasStatus =
        print.gcode_state != null ||
        print.bed_temper != null ||
        print.nozzle_temper != null;
      if (!hasStatus) return;
      clearTimeout(timeoutId);
      client.removeAllListeners();
      client.end(true);
      resolve({ success: true, data: payload });
    });
  });
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const mode = body.mode === 'cloud' ? 'cloud' : 'lan';

  if (mode === 'lan') {
    const { printerIp, deviceId, accessCode } = body;
    if (!printerIp?.trim() || !deviceId?.trim() || !accessCode?.trim()) {
      return Response.json(
        {
          success: false,
          error: 'Missing required fields: printerIp, deviceId, accessCode',
        },
        { status: 400 }
      );
    }

    const host = printerIp!.trim();
    const device = deviceId!.trim();
    const code = accessCode!.trim();

    const mqtt = await import('mqtt');
    let client: ReturnType<typeof mqtt.connect>;
    try {
      const ca = getCaCert();
      client = mqtt.connect({
        protocol: 'mqtts',
        host,
        port: 8883,
        connectTimeout: 4000,
        clean: true,
        username: 'bblp',
        password: code,
        servername: device,
        ca,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ success: false, error: message }, { status: 500 });
    }

    const reportTopic = `device/${device}/report`;
    const requestTopic = `device/${device}/request`;
    const action = body.action === 'get_status' ? 'get_status' : 'get_version';
    const result =
      action === 'get_status'
        ? await runMqttGetStatus(client, reportTopic, requestTopic)
        : await runMqttGetVersion(client, reportTopic, requestTopic);
    return Response.json(result);
  }

  // --- Cloud --- (token from session httpOnly cookie or from body)
  const email = body.email?.trim();
  const verificationCode = body.verificationCode?.trim();
  const tfaCode = body.tfaCode?.trim();
  const password = body.password;
  const sessionToken = getSession(req.cookies.get(getCookieName())?.value ?? null);
  const storedToken = body.cloudAccessToken?.trim();

  let accessToken: string;
  let uid: number;
  let devId: string;
  let devices: { dev_id: string; name?: string; dev_product_name?: string; dev_model_name?: string; online?: boolean }[];
  let usedStoredToken = false;

  try {
    if (sessionToken) {
      usedStoredToken = true;
      accessToken = sessionToken;
    } else if (storedToken) {
      usedStoredToken = true;
      accessToken = storedToken;
    } else if (!email) {
      return Response.json(
        { success: false, error: 'Missing required field for cloud: email' },
        { status: 400 }
      );
    } else if (tfaCode && password) {
      const tfaResult = await bambuLoginWithTfa(email, password, tfaCode);
      if (typeof tfaResult === 'object' && tfaResult.requireTfaFromBrowser) {
        return Response.json(
          { success: false, requireTfaFromBrowser: true, tfaKey: tfaResult.tfaKey },
          { status: 200 }
        );
      }
      accessToken = tfaResult as string;
    } else if (verificationCode) {
      accessToken = await bambuLoginWithCode(email, verificationCode);
    } else {
      if (!password) {
        return Response.json(
          { success: false, error: 'Provide password or verification code from email' },
          { status: 400 }
        );
      }
      const loginResult = await bambuLogin(email, password);
      if (typeof loginResult === 'object') {
        if ('require2FA' in loginResult) {
          return Response.json(
            { success: false, require2FA: true },
            { status: 200 }
          );
        }
        return Response.json(
          { success: false, requireVerificationCode: true },
          { status: 200 }
        );
      }
      accessToken = loginResult;
    }
    uid = await bambuPreference(accessToken);
    devices = await bambuBind(accessToken);
    if (devices.length === 0) {
      return Response.json(
        { success: false, error: 'No devices bound to this Bambu account' },
        { status: 400 }
      );
    }
    const chosen = body.cloudDeviceId?.trim()
      ? devices.find((d) => d.dev_id === body.cloudDeviceId?.trim())
      : devices[0];
    devId = chosen ? chosen.dev_id : devices[0].dev_id;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ success: false, error: message }, { status: 401 });
  }

  const mqtt = await import('mqtt');
  const client = mqtt.connect({
    protocol: 'mqtts',
    hostname: 'us.mqtt.bambulab.com',
    port: 8883,
    connectTimeout: 4000,
    clean: true,
    username: `u_${uid}`,
    password: accessToken,
  });

  const reportTopic = `device/${devId}/report`;
  const requestTopic = `device/${devId}/request`;
  const action = body.action === 'get_status' ? 'get_status' : 'get_version';
  const result =
    action === 'get_status'
      ? await runMqttGetStatus(client, reportTopic, requestTopic)
      : await runMqttGetVersion(client, reportTopic, requestTopic);
  const payload = {
    ...result,
    devices: devices.map((d: { dev_id: string; name?: string; dev_product_name?: string; dev_model_name?: string; online?: boolean }) => ({
      dev_id: d.dev_id,
      name: d.name ?? '',
      dev_product_name: d.dev_product_name ?? '',
      dev_model_name: d.dev_model_name ?? '',
      online: d.online ?? false,
    })),
  };
  if (result.success && !usedStoredToken && action === 'get_version') {
    return Response.json({ ...payload, cloudAccessToken: accessToken });
  }
  return Response.json(payload);
}
