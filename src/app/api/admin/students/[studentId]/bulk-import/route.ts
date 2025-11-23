// File: /app/api/admin/students/bulk-import/route.ts

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { students } = await request.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: 'No students provided' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ studentId: string; error: string }> = [];

    for (const student of students) {
      try {
        // Validate required fields
        if (!student.firstName?.trim() || !student.lastName?.trim() || !student.email?.trim() || !student.phoneNo?.trim() || !student.studentId?.trim()) {
          failedCount++;
          errors.push({
            studentId: student.studentId || 'unknown',
            error: 'Missing required student fields'
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(student.email)) {
          failedCount++;
          errors.push({
            studentId: student.studentId,
            error: 'Invalid email format'
          });
          continue;
        }

        // Check if student already exists
        const existingStudent = await prisma.student.findFirst({
          where: {
            OR: [
              { email: student.email },
              { studentId: student.studentId }
            ]
          }
        });

        if (existingStudent) {
          failedCount++;
          errors.push({
            studentId: student.studentId,
            error: 'Student ID or email already exists'
          });
          continue;
        }

        // Create student
        const newStudent = await prisma.student.create({
          data: {
            firstName: student.firstName.trim(),
            lastName: student.lastName.trim(),
            email: student.email.trim(),
            phoneNo: student.phoneNo.trim(),
            studentId: student.studentId.trim(),
          }
        });

        // Add enrollment if course and slot are provided
        if (student.course?.trim() && student.slot?.trim()) {
          try {
            // Find course by name
            const course = await prisma.course.findUnique({
              where: { name: student.course.trim() }
            });

            // Find slot by name
            const slot = await prisma.slot.findUnique({
              where: { name: student.slot.trim() }
            });

            if (course && slot) {
              // Check if enrollment already exists
              const existingEnrollment = await prisma.studentCourseEnrollment.findUnique({
                where: {
                  studentId_courseId_slotId: {
                    studentId: newStudent.id,
                    courseId: course.id,
                    slotId: slot.id
                  }
                }
              });

              if (!existingEnrollment) {
                await prisma.studentCourseEnrollment.create({
                  data: {
                    studentId: newStudent.id,
                    courseId: course.id,
                    slotId: slot.id
                  }
                });
              }
            } else {
              if (!course) {
                errors.push({
                  studentId: student.studentId,
                  error: `Course "${student.course}" not found`
                });
              }
              if (!slot) {
                errors.push({
                  studentId: student.studentId,
                  error: `Slot "${student.slot}" not found`
                });
              }
            }
          } catch (error) {
            errors.push({
              studentId: student.studentId,
              error: `Failed to add enrollment: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
        }

        successCount++;
      } catch (error) {
        failedCount++;
        errors.push({
          studentId: student.studentId || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      successCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${successCount} students. ${failedCount} failed.`
    });
  } catch (error) {
    console.error('Error during bulk import:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}