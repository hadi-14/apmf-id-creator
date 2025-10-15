import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const { courseId, slotId } = await request.json();

    if (!courseId || !slotId) {
      return NextResponse.json(
        { error: 'Course and slot are required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify slot exists
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.studentCourseEnrollment.findUnique({
      where: {
        studentId_courseId_slotId: {
          studentId,
          courseId,
          slotId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Student already enrolled in this course-slot combination' },
        { status: 409 }
      );
    }

    const enrollment = await prisma.studentCourseEnrollment.create({
      data: {
        studentId,
        courseId,
        slotId,
      },
      include: {
        course: true,
        slot: true,
      },
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    );
  }
}
