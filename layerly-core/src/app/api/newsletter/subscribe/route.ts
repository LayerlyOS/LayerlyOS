
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { z } from 'zod';
import { sendWelcomeEmail } from '@/lib/email';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    const existing = await db.query.newsletterSubscribers.findFirst({
      where: (table, { eq }) => eq(table.email, email),
    });

    if (existing) {
      return NextResponse.json({ 
        message: 'You are already subscribed!' 
      });
    }

    await db.insert(newsletterSubscribers).values({
      email,
      isVerified: false,
    });

    try {
      await sendWelcomeEmail({ email });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({ 
      message: 'Successfully subscribed!' 
    });
  } catch (error) {
    console.error('Newsletter subscription failed:', error);
    return NextResponse.json(
      { error: 'Subscription failed. Please try again.' },
      { status: 500 }
    );
  }
}
