import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { globalFilaments } from '@/db/schema';
import { getUserFromRequest } from '@/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !user.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const filamentResult = await db
      .update(globalFilaments)
      .set({
        brand: body.brand,
        materialName: body.materialName,
        materialType: body.materialType,
        color: body.color,
        colorHex: body.colorHex,
        spoolWeight: body.spoolWeight,
        spoolPrice: body.spoolPrice,
        density: body.density,
        diameter: body.diameter,
        printTempMin: body.printTempMin,
        printTempMax: body.printTempMax,
        bedTemp: body.bedTemp,
        printSpeed: body.printSpeed,
        fanSpeed: body.fanSpeed,
        flowRatio: body.flowRatio,
        mechanicalProps: body.mechanicalProps,
        applications: body.applications,
        website: body.website,
        image: body.image,
      })
      .where(eq(globalFilaments.id, id))
      .returning();

    const filament = filamentResult[0];

    return NextResponse.json(filament);
  } catch (error) {
    console.error('Error updating global filament:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !user.isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    await db.delete(globalFilaments).where(eq(globalFilaments.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting global filament:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
