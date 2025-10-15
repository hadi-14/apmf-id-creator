import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const slots = await prisma.slot.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Slot name is required' },
        { status: 400 }
      );
    }

    const existingSlot = await prisma.slot.findUnique({
      where: { name: name.trim() },
    });

    if (existingSlot) {
      return NextResponse.json(
        { error: 'Slot already exists' },
        { status: 409 }
      );
    }

    const slot = await prisma.slot.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    console.error('Error creating slot:', error);
    return NextResponse.json(
      { error: 'Failed to create slot' },
      { status: 500 }
    );
  }
}
