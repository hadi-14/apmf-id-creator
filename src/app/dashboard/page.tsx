'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { Upload, Download, LogOut, Loader2, User } from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  slot: string;
  courseName: string;
  photoUrl: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const idCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
  });

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/student/profile');
      
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      setStudent(data.student);
    } catch (err) {
      console.error('Profile fetch error:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5242880) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      await fetchProfile();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  const handleDownloadID = async () => {
    if (!student) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 1016;
      const height = 641;
      canvas.width = width;
      canvas.height = height;

      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        templateImg.onload = resolve;
        templateImg.onerror = reject;
        templateImg.src = '/id-card-template.png';
      });

      ctx.drawImage(templateImg, 0, 0, width, height);

      if (student.photoUrl) {
        try {
          const photoImg = new Image();
          photoImg.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            photoImg.onload = resolve;
            photoImg.onerror = reject;
            photoImg.src = student.photoUrl!;
          });

          const photoX = width * 0.065;
          const photoY = height * 0.24;
          const photoW = width * 0.29;
          const photoH = height * 0.47;

          ctx.save();
          const radius = 20;
          ctx.beginPath();
          ctx.moveTo(photoX + radius, photoY);
          ctx.lineTo(photoX + photoW - radius, photoY);
          ctx.quadraticCurveTo(photoX + photoW, photoY, photoX + photoW, photoY + radius);
          ctx.lineTo(photoX + photoW, photoY + photoH - radius);
          ctx.quadraticCurveTo(photoX + photoW, photoY + photoH, photoX + photoW - radius, photoY + photoH);
          ctx.lineTo(photoX + radius, photoY + photoH);
          ctx.quadraticCurveTo(photoX, photoY + photoH, photoX, photoY + photoH - radius);
          ctx.lineTo(photoX, photoY + radius);
          ctx.quadraticCurveTo(photoX, photoY, photoX + radius, photoY);
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(photoImg, photoX, photoY, photoW, photoH);
          ctx.restore();
        } catch (photoError) {
          console.error('Photo load error:', photoError);
        }
      }

      ctx.textBaseline = 'top';

      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`${student.firstName} ${student.lastName}`, width * 0.08, height * 0.78);

      ctx.fillStyle = '#4b5563';
      ctx.font = '600 16px Arial';
      ctx.fillText(student.studentId, width * 0.08, height * 0.82);

      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(student.courseName, width * 0.60, height * 0.40);

      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(student.slot, width * 0.60, height * 0.48);

      ctx.fillStyle = '#16a34a';
      ctx.font = '600 14px Arial';
      ctx.fillText(student.email, width * 0.60, height * 0.56);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${student.studentId}_ID_Card.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');

    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download ID card. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return null;
  }

  const issueDate = new Date(student.createdAt);
  const expiryDate = new Date(issueDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                APMF
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-800">
                  ALL PAKISTAN MEMON FEDERATION
                </h1>
                <p className="text-gray-600">I.T. COMMITTEE - Student Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Photo Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Profile Photo</h2>
            
            <div className="flex flex-col items-center">
              <div className="w-64 h-64 bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center border-2 border-gray-300 relative">
                {student.photoUrl ? (
                  <NextImage
                    src={student.photoUrl}
                    alt={`${student.firstName} ${student.lastName}`}
                    fill
                    className="object-cover"
                    priority={false}
                  />
                ) : (
                  <User className="w-32 h-32 text-gray-400" />
                )}
              </div>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      {student.photoUrl ? 'Change Photo' : 'Upload Photo'}
                    </>
                  )}
                </div>
              </label>

              <p className="text-sm text-gray-500 mt-2">Max size: 5MB</p>
            </div>
          </div>

          {/* Student ID Card Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Student ID Card</h2>
              <button
                onClick={handleDownloadID}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            {/* ID Card using template image */}
            <div 
              ref={idCardRef} 
              data-id-card
              className="relative w-full bg-gray-50 mx-auto overflow-hidden" 
              style={{ 
                aspectRatio: '1.586',
                maxWidth: '800px'
              }}
            >
              {/* Base template image */}
              <NextImage 
                src="/id-card-template.png" 
                alt="ID Card Template"
                fill
                className="object-contain"
                priority={false}
              />
              
              {/* Overlay student photo */}
              <div className="absolute" style={{ 
                left: '6.5%', 
                top: '24%', 
                width: '29%', 
                height: '47%' 
              }}>
                {student.photoUrl ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <NextImage
                      src={student.photoUrl}
                      alt={`${student.firstName} ${student.lastName}`}
                      fill
                      className="object-fill"
                      priority={false}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-300 rounded-2xl flex items-center justify-center">
                    <User className="w-20 h-20 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Student Name */}
              <div className="absolute whitespace-nowrap" style={{ 
                left: '8%', 
                bottom: '22%',
              }}>
                <p className="text-gray-800 font-bold" style={{ fontSize: 'clamp(10px, 1.5vw, 18px)' }}>
                  {student.firstName} {student.lastName}
                </p>
              </div>

              {/* Student ID */}
              <div className="absolute whitespace-nowrap" style={{ 
                left: '8%', 
                bottom: '18%',
              }}>
                <p className="text-gray-600 font-semibold" style={{ fontSize: 'clamp(8px, 1vw, 12px)' }}>
                  {student.studentId}
                </p>
              </div>

              {/* Course Name (right side) */}
              <div className="absolute" style={{ 
                left: '60%', 
                top: '40%',
              }}>
                <p className="text-green-600 text-right break-words" style={{ fontSize: 'clamp(9px, 1.1vw, 14px)' }}>
                  {student.courseName}
                </p>
              </div>

              {/* Slot */}
              <div className="absolute whitespace-nowrap" style={{ 
                left: '60%', 
                top: '48%',
              }}>
                <p className="text-green-600 text-right" style={{ fontSize: 'clamp(9px, 1.1vw, 14px)' }}>
                  {student.slot}
                </p>
              </div>

              {/* Email */}
              <div className="absolute" style={{ 
                left: '60%', 
                top: '56%',
              }}>
                <p className="text-green-600 text-left break-all" style={{ fontSize: 'clamp(7px, 0.9vw, 11px)' }}>
                  {student.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}