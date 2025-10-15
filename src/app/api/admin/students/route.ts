import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        enrollments: {
          include: {
            course: true,
            slot: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, phoneNo, studentId } = await request.json();

    // Validate all fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phoneNo?.trim() || !studentId?.trim()) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.student.findUnique({
      where: { email: email.trim() },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if student ID already exists
    const existingStudentId = await prisma.student.findFirst({
      where: { studentId: studentId.trim() },
    });

    if (existingStudentId) {
      return NextResponse.json(
        { error: 'Student ID already exists' },
        { status: 409 }
      );
    }

    const student = await prisma.student.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNo: phoneNo.trim(),
        studentId: studentId.trim(),
        isVerified: true, // Admin-added students are pre-verified
      },
      include: {
        enrollments: {
          include: {
            course: true,
            slot: true,
          },
        },
      },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}