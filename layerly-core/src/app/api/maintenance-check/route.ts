import { NextResponse } from 'next/server';
import { getMaintenanceStatus } from '@/lib/maintenance';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const maintenanceEnabled = await getMaintenanceStatus();

    if (!maintenanceEnabled) {
      return NextResponse.json({ allowed: true, maintenance: false });
    }

    // Maintenance is ON, check for Admin
    const user = await getUser();

    // Check both isAdmin and role
    const isAdmin = !!(user?.isAdmin || user?.role === 'ADMIN');

    if (isAdmin) {
      return NextResponse.json({ allowed: true, maintenance: true });
    }

    return NextResponse.json({ allowed: false, maintenance: true });
  } catch (error) {
    console.error('Maintenance check failed:', error);
    // If check fails, fail open or closed?
    // Safe default: Fail open (allow access) to avoid locking everyone out on error
    return NextResponse.json({ allowed: true, maintenance: false, error: true });
  }
}
