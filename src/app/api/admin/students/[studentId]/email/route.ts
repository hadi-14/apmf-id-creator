// File: /app/api/admin/students/[studentId]/email/route.ts

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const existingStudent = await prisma.student.findUnique({
      where: { email },
    });

    if (existingStudent && existingStudent.id !== studentId) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { email },
    });

    return NextResponse.json({ 
      message: 'Email updated successfully',
      student: updatedStudent 
    });
  } catch (error) {
    console.error('Error updating student email:', error);
    return NextResponse.json(
      { error: 'Failed to update student email' },
      { status: 500 }
    );
  }
}