// Supabase Auth is handled by Supabase Auth API
// This file is no longer needed - Supabase handles auth via its own endpoints
// Remove this file or keep as placeholder for backward compatibility

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Supabase Auth is handled by Supabase Auth API' },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Supabase Auth is handled by Supabase Auth API' },
    { status: 404 }
  );
}
