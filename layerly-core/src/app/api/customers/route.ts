import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getCustomers } from '@/features/customers/actions';
import { requireAuth, serverError } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    // Require auth - only logged-in users can see their customers
    await requireAuth(req);
    
    // getCustomers() already checks auth internally and filters by userId
    const customers = await getCustomers();
    return NextResponse.json(customers);
  } catch (error) {
    // If error is Response (from requireAuth), return it
    if (error instanceof Response) {
      return error;
    }
    
    console.error('Error fetching customers:', error);
    return serverError();
  }
}
