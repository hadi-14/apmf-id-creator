import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    const student = await prisma.student.findUnique({
      where: { email },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if code matches and hasn't expired
    if (
      student.verificationCode !== code ||
      !student.codeExpiry ||
      student.codeExpiry < new Date()
    ) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 401 }
      );
    }

    // Mark as verified and clear code
    await prisma.student.update({
      where: { id: student.id },
      data: {
        isVerified: true,
        verificationCode: null,
        codeExpiry: null,
      },
    });

    // Create JWT token
    const token = await createToken({
      studentId: student.id,
      email: student.email,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
      },
    });

    // Set cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
