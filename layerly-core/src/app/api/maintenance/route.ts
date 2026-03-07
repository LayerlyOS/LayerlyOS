import { NextResponse } from 'next/server';
import { getMaintenanceStatus } from '@/lib/maintenance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const enabled = await getMaintenanceStatus();
    return NextResponse.json({ enabled }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/maintenance:', error);
    // Fail open - return maintenance disabled on error
    return NextResponse.json({ enabled: false, error: true }, { status: 200 });
  }
}
