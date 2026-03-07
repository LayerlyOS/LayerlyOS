import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';

const CAMERA_PORT = 6000;
const TIMEOUT_MS = 15_000;
const JPEG_START = Buffer.from([0xff, 0xd8, 0xff]);
const JPEG_END = Buffer.from([0xff, 0xd9]);

function getCaCert(): Buffer {
  const certPath = path.join(process.cwd(), 'content', 'bambu', 'ca_cert.pem');
  if (!fs.existsSync(certPath)) {
    throw new Error('Bambu CA certificate not found at content/bambu/ca_cert.pem');
  }
  return fs.readFileSync(certPath);
}

/**
 * Fetches a single image from printer camera (port 6000 protocol, like ha-bambulab ChamberImageThread).
 * GET ?printerIp=...&accessCode=...&deviceId=... (deviceId optional – used as SNI in TLS, like MQTT).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let printerIp = searchParams.get('printerIp')?.trim() ?? process.env.BAMBU_PRINTER_IP?.trim();
  let accessCode = searchParams.get('accessCode')?.trim() ?? process.env.BAMBU_ACCESS_CODE?.trim();
  const deviceId = searchParams.get('deviceId')?.trim() ?? undefined;

  if (!printerIp || !accessCode) {
    return NextResponse.json(
      { error: 'Missing printerIp or accessCode (query or BAMBU_PRINTER_IP, BAMBU_ACCESS_CODE in .env)' },
      { status: 400 }
    );
  }

  const result = await fetchChamberImage(printerIp, accessCode, deviceId);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 502 }
    );
  }
  const jpeg = result.jpeg;
  if (!jpeg || jpeg.length === 0) {
    return NextResponse.json(
      { error: 'Failed to fetch image (check IP, access code and if Camera options → Video is enabled on printer)' },
      { status: 502 }
    );
  }

  return new NextResponse(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

function connectTlsWithTimeout(host: string, port: number, servername?: string): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const ctx = tls.createSecureContext({ ca: getCaCert() });
    // Printer cert is often issued for Device ID (serial), not IP – same as MQTT LAN
    const sni = servername && servername.length > 0 ? servername : host;
    const sock = tls.connect({
      host,
      port,
      servername: sni,
      secureContext: ctx,
      rejectUnauthorized: true,
    }, () => resolve(sock));
    sock.setTimeout(TIMEOUT_MS);
    sock.on('timeout', () => {
      sock.destroy();
      reject(new Error('Timeout'));
    });
    sock.on('error', reject);
  });
}

function readExactly(socket: tls.TLSSocket, size: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    const onData = (chunk: Buffer) => {
      chunks.push(chunk);
      total += chunk.length;
      if (total >= size) {
        socket.removeListener('data', onData);
        socket.removeListener('error', onError);
        resolve(Buffer.concat(chunks, total).subarray(0, size));
      }
    };
    const onError = (err: Error) => {
      socket.removeListener('data', onData);
      reject(err);
    };
    socket.on('data', onData);
    socket.on('error', onError);
    if (socket.readableEnded) reject(new Error('Socket closed'));
  });
}

/**
 * Protocol like ha-bambulab ChamberImageThread: TLS to IP:6000 (not raw TCP!), 80-byte auth,
 * then 16-byte header (first 3 bytes LE = JPEG size), then JPEG.
 */
async function fetchChamberImage(
  printerIp: string,
  accessCode: string,
  deviceId?: string
): Promise<{ jpeg: Buffer | null; error?: string }> {
  const username = 'bblp';
  const auth = Buffer.alloc(80);
  let off = 0;
  auth.writeUInt32LE(0x40, off); off += 4;
  auth.writeUInt32LE(0x3000, off); off += 4;
  auth.writeUInt32LE(0, off); off += 4;
  auth.writeUInt32LE(0, off); off += 4;
  Buffer.from(username, 'ascii').copy(auth, off); off += 32;
  Buffer.from(accessCode.slice(0, 32), 'ascii').copy(auth, off);

  let socket: tls.TLSSocket | null = null;
  try {
    socket = await connectTlsWithTimeout(printerIp, CAMERA_PORT, deviceId);
    socket.write(auth);

    const header = await readExactly(socket, 16);
    if (header.length < 3) return { jpeg: null, error: 'Header too short' };
    const payloadSize = header.readUInt32LE(0) & 0xffffff;
    if (payloadSize === 0 || payloadSize > 500_000) {
      return { jpeg: null, error: `Invalid payload size: ${payloadSize}` };
    }

    const jpeg = await readExactly(socket, payloadSize);
    if (jpeg.length < 4 || !JPEG_START.equals(jpeg.subarray(0, 3)) || !JPEG_END.equals(jpeg.subarray(jpeg.length - 2))) {
      return { jpeg: null, error: 'Received data does not look like JPEG' };
    }
    return { jpeg };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { jpeg: null, error: msg };
  } finally {
    socket?.destroy();
  }
}
