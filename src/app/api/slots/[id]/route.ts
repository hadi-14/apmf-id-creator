import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const slot = await prisma.slot.findUnique({
      where: { id },
    });

    if (!slot) {
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    // Check if slot has enrollments
    const enrollments = await prisma.studentCourseEnrollment.findMany({
      where: { slotId: id },
    });

    if (enrollments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete slot with active enrollments' },
        { status: 409 }
      );
    }

    await prisma.slot.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    return NextResponse.json(
      { error: 'Failed to delete slot' },
      { status: 500 }
    );
  }
}
