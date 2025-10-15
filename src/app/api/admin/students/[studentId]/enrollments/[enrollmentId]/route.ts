import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; enrollmentId: string }> }
) {
  try {
    const { studentId, enrollmentId } = await params;

    const enrollment = await prisma.studentCourseEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    if (enrollment.studentId !== studentId) {
      return NextResponse.json(
        { error: 'Enrollment does not belong to this student' },
        { status: 400 }
      );
    }

    await prisma.studentCourseEnrollment.delete({
      where: { id: enrollmentId },
    });

    return NextResponse.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
}