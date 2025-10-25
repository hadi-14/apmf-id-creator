import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma'; // Adjust path as needed
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB)
    if (file.size > 5242880) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Process and optimize image
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const optimizedBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${payload.studentId}-${timestamp}.jpg`;

    // Upload to Vercel Blob
    const blob = await put(filename, optimizedBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    // Update student record
    await prisma.student.update({
      where: { id: payload.studentId as string },
      data: { photoUrl: blob.url },
    });

    return NextResponse.json({
      success: true,
      photoUrl: blob.url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}