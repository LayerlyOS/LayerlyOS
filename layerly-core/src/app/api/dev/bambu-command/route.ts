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

const COMMAND_TIMEOUT_MS = 12_000;
const SEQ = '0';

type Body = {
  mode?: 'lan' | 'cloud';
  command: 'ledctrl' | 'ipcam_record_set';
  led_mode?: 'on' | 'off';
  control?: 'enable' | 'disable';
  // LAN
  printerIp?: string;
  deviceId?: string;
  accessCode?: string;
  // Cloud
  cloudAccessToken?: string;
  cloudDeviceId?: string;
  email?: string;
  password?: string;
  tfaCode?: string;
  verificationCode?: string;
};

function getCaCert(): Buffer {
  const certPath = path.join(process.cwd(), 'content', 'bambu', 'ca_cert.pem');
  if (!fs.existsSync(certPath)) {
    throw new Error('Bambu CA certificate not found at content/bambu/ca_cert.pem');
  }
  return fs.readFileSync(certPath);
}

function runMqttCommand(
  client: ReturnType<typeof import('mqtt').connect>,
  reportTopic: string,
  requestTopic: string,
  requestPayload: Record<string, unknown>
): Promise<{ success: true } | { success: false; error: string }> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      client.removeAllListeners();
      client.end(true);
      resolve({ success: false, error: 'Timeout: no response from printer' });
    }, COMMAND_TIMEOUT_MS);

    client.on('error', (err) => {
      clearTimeout(timeoutId);
      client.removeAllListeners();
      client.end(true);
      resolve({ success: false, error: err instanceof Error ? err.message : String(err) });
    });

    client.on('connect', () => {
      client.subscribe(reportTopic, (err) => {
        if (err) {
          clearTimeout(timeoutId);
          client.removeAllListeners();
          client.end(true);
          resolve({ success: false, error: err instanceof Error ? err.message : String(err) });
          return;
        }
        client.publish(requestTopic, JSON.stringify(requestPayload));
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
      const sys = payload.system as Record<string, unknown> | undefined;
      const cam = payload.camera as Record<string, unknown> | undefined;
      const result = (sys ?? cam) as Record<string, unknown> | undefined;
      if (!result || String(result.sequence_id) !== SEQ) return;
      const cmd = String(result.command ?? '');
      if (cmd !== 'ledctrl' && cmd !== 'ipcam_record_set') return;
      const ok = String(result.result ?? '').toLowerCase() === 'success';
      clearTimeout(timeoutId);
      client.removeAllListeners();
      client.end(true);
      resolve(ok ? { success: true } : { success: false, error: String(result.reason ?? 'Printer error') });
    });
  });
}

function buildRequestPayload(body: Body): Record<string, unknown> | null {
  if (body.command === 'ledctrl') {
    const mode = body.led_mode === 'off' ? 'off' : 'on';
    return {
      system: {
        sequence_id: SEQ,
        command: 'ledctrl',
        led_node: 'chamber_light',
        led_mode: mode,
        led_on_time: 500,
        led_off_time: 500,
        loop_times: 1,
        interval_time: 1000,
      },
    };
  }
  if (body.command === 'ipcam_record_set') {
    const control = body.control === 'disable' ? 'disable' : 'enable';
    return {
      camera: {
        sequence_id: SEQ,
        command: 'ipcam_record_set',
        control,
      },
    };
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const requestPayload = buildRequestPayload(body);
  if (!requestPayload) {
    return Response.json(
      { success: false, error: 'command must be ledctrl or ipcam_record_set with led_mode or control' },
      { status: 400 }
    );
  }

  const mode = body.mode === 'cloud' ? 'cloud' : 'lan';

  if (mode === 'lan') {
    const { printerIp, deviceId, accessCode } = body;
    if (!printerIp?.trim() || !deviceId?.trim() || !accessCode?.trim()) {
      return Response.json(
        { success: false, error: 'LAN: missing printerIp, deviceId or accessCode' },
        { status: 400 }
      );
    }
    const mqtt = await import('mqtt');
    const device = deviceId!.trim();
    let client: ReturnType<typeof mqtt.connect>;
    try {
      const ca = getCaCert();
      client = mqtt.connect({
        protocol: 'mqtts',
        host: printerIp!.trim(),
        port: 8883,
        connectTimeout: 4000,
        clean: true,
        username: 'bblp',
        password: accessCode!.trim(),
        rejectUnauthorized: true,
        ca,
        servername: device,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json({ success: false, error: msg }, { status: 500 });
    }
    const reportTopic = `device/${device}/report`;
    const requestTopic = `device/${device}/request`;
    const result = await runMqttCommand(client, reportTopic, requestTopic, requestPayload);
    return Response.json(result);
  }

  // Cloud – token from session (httpOnly cookie) or from body
  let accessToken: string;
  let uid: number;
  let devId: string;
  try {
    const sessionToken = getSession(req.cookies.get(getCookieName())?.value ?? null);
    const storedToken = body.cloudAccessToken?.trim();
    if (sessionToken) {
      accessToken = sessionToken;
    } else if (storedToken) {
      accessToken = storedToken;
    } else if (body.email?.trim() && body.password && body.tfaCode?.trim()) {
      const tfaResult = await bambuLoginWithTfa(body.email.trim(), body.password, body.tfaCode.trim());
      accessToken = typeof tfaResult === 'string' ? tfaResult : '';
      if (!accessToken) {
        return Response.json(
          { success: false, error: '2FA login failed' },
          { status: 401 }
        );
      }
    } else if (body.email?.trim() && body.verificationCode?.trim()) {
      accessToken = await bambuLoginWithCode(body.email.trim(), body.verificationCode.trim());
    } else if (body.email?.trim() && body.password) {
      const loginResult = await bambuLogin(body.email.trim(), body.password);
      accessToken = typeof loginResult === 'string' ? loginResult : '';
      if (!accessToken) {
        return Response.json({ success: false, error: '2FA or verification code required' }, { status: 401 });
      }
    } else {
      return Response.json(
        { success: false, error: 'Cloud: sign in on the page (Test connection or agent login) – token will be saved in session' },
        { status: 401 }
      );
    }
    uid = await bambuPreference(accessToken);
    const devices = await bambuBind(accessToken);
    if (devices.length === 0) {
      return Response.json({ success: false, error: 'No printers in account' }, { status: 400 });
    }
    const chosen = body.cloudDeviceId?.trim()
      ? devices.find((d: { dev_id: string }) => d.dev_id === body.cloudDeviceId?.trim())
      : devices[0];
    devId = chosen ? chosen.dev_id : devices[0].dev_id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ success: false, error: msg }, { status: 401 });
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
  const result = await runMqttCommand(client, reportTopic, requestTopic, requestPayload);
  return Response.json(result);
}
