'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, Eye, EyeOff, LogOut, Users, X, Edit2, Check } from 'lucide-react';

interface Course {
  id: string;
  name: string;
}

interface Slot {
  id: string;
  name: string;
}

interface StudentEnrollment {
  id: string;
  courseId: string;
  slotId: string;
  course: Course;
  slot: Slot;
}

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  photoUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  enrollments: StudentEnrollment[];
}

type Tab = 'courses' | 'slots' | 'students';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('courses');

  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Slots state
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlotName, setNewSlotName] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [editingStudentEmail, setEditingStudentEmail] = useState<string | null>(null);
  const [editedEmail, setEditedEmail] = useState('');
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNo: '',
    studentId: '',
  });
  const [addingStudent, setAddingStudent] = useState(false);
  const [selectedStudentForEnrollment, setSelectedStudentForEnrollment] = useState('');
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState('');
  const [selectedSlotForEnrollment, setSelectedSlotForEnrollment] = useState('');
  const [addingEnrollment, setAddingEnrollment] = useState(false);
  const [studentTab, setStudentTab] = useState<'list' | 'enrollments'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'apmf2025';

  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query)
    );
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
      fetchAllData();
    } else {
      setPasswordError('Invalid password');
      setPassword('');
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchCourses(),
      fetchSlots(),
      fetchStudents(),
    ]);
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      setError('Failed to fetch courses');
      console.error(err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await fetch('/api/slots');
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } catch (err) {
      setError('Failed to fetch slots');
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch('/api/admin/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) {
      setError('Course name cannot be empty');
      return;
    }

    setLoadingCourses(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCourseName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add course');
      }

      setCourses([...courses, data.course]);
      setNewCourseName('');
      setSuccessMessage('Course added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add course');
      }
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    setLoadingCourses(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      setCourses(courses.filter(c => c.id !== id));
      setSuccessMessage('Course deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete course');
      }
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotName.trim()) {
      setError('Slot name cannot be empty');
      return;
    }

    setLoadingSlots(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSlotName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add slot');
      }

      setSlots([...slots, data.slot]);
      setNewSlotName('');
      setSuccessMessage('Slot added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add slot');
      }
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;

    setLoadingSlots(true);
    setError('');

    try {
      const response = await fetch(`/api/slots/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete slot');
      }

      setSlots(slots.filter(s => s.id !== id));
      setSuccessMessage('Slot deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete slot');
      }
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStudent.firstName.trim() || !newStudent.lastName.trim() || !newStudent.email.trim() || !newStudent.phoneNo.trim() || !newStudent.studentId.trim()) {
      setError('All fields are required');
      return;
    }

    setAddingStudent(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add student');
      }

      await fetchStudents();
      setNewStudent({
        firstName: '',
        lastName: '',
        email: '',
        phoneNo: '',
        studentId: '',
      });
      setShowAddStudentForm(false);
      setSuccessMessage('Student added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add student');
      }
    } finally {
      setAddingStudent(false);
    }
  };

  const handleEditEmail = async (studentId: string) => {
    if (!editedEmail.trim()) {
      setError('Email cannot be empty');
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/admin/students/${studentId}/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email');
      }

      // Update only the specific student record instead of fetching all
      setStudents(students.map(s => 
        s.id === studentId ? { ...s, email: editedEmail } : s
      ));
      
      setEditingStudentEmail(null);
      setEditedEmail('');
      setSuccessMessage('Email updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update email');
      }
    }
  };

  const handleAddEnrollment = async () => {
    if (!selectedStudentForEnrollment || !selectedCourseForEnrollment || !selectedSlotForEnrollment) {
      setError('Please select student, course, and slot');
      return;
    }

    setAddingEnrollment(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/admin/students/${selectedStudentForEnrollment}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseForEnrollment,
          slotId: selectedSlotForEnrollment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add enrollment');
      }

      await fetchStudents();
      setSelectedCourseForEnrollment('');
      setSelectedSlotForEnrollment('');
      setSuccessMessage('Enrollment added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add enrollment');
      }
    } finally {
      setAddingEnrollment(false);
    }
  };

  const handleRemoveEnrollment = async (studentId: string, enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this enrollment?')) return;

    setError('');

    try {
      const response = await fetch(`/api/admin/students/${studentId}/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove enrollment');
      }

      await fetchStudents();
      setSuccessMessage('Enrollment removed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to remove enrollment');
      }
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student and all their data?')) return;

    setError('');

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      await fetchStudents();
      setSuccessMessage('Student deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete student');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setPasswordError('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              APMF
            </div>
            <h1 className="text-3xl font-bold text-green-800">Admin Portal</h1>
            <p className="text-gray-600 mt-2">I.T. COMMITTEE</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-600 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                APMF
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-800">Admin Dashboard</h1>
                <p className="text-gray-600">Manage Courses, Slots & Students</p>
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
      </header>

      {/* Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition ${
                activeTab === 'courses'
                  ? 'text-green-600 border-green-600'
                  : 'text-gray-600 border-transparent hover:text-gray-800'
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition ${
                activeTab === 'slots'
                  ? 'text-green-600 border-green-600'
                  : 'text-gray-600 border-transparent hover:text-gray-800'
              }`}
            >
              Slots
            </button>
            <button
              onClick={() => { setActiveTab('students'); fetchStudents(); }}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${
                activeTab === 'students'
                  ? 'text-green-600 border-green-600'
                  : 'text-gray-600 border-transparent hover:text-gray-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Students
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Courses</h2>

            <form onSubmit={handleAddCourse} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Enter course name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
                <button
                  type="submit"
                  disabled={loadingCourses}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center gap-2 font-semibold"
                >
                  {loadingCourses ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingCourses && courses.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                </div>
              ) : courses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No courses added yet</p>
              ) : (
                courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <span className="font-medium text-gray-800">{course.name}</span>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-600 hover:text-red-800 transition p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Slots Tab */}
        {activeTab === 'slots' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Slots</h2>

            <form onSubmit={handleAddSlot} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  placeholder="Enter slot name (e.g., Morning 9AM)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                />
                <button
                  type="submit"
                  disabled={loadingSlots}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center gap-2 font-semibold"
                >
                  {loadingSlots ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingSlots && slots.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No slots added yet</p>
              ) : (
                slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <span className="font-medium text-gray-800">{slot.name}</span>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-red-600 hover:text-red-800 transition p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Add Student Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add Student</h2>
                <button
                  onClick={() => setShowAddStudentForm(!showAddStudentForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  {showAddStudentForm ? 'Cancel' : 'Add New Student'}
                </button>
              </div>

              {showAddStudentForm && (
                <form onSubmit={handleAddStudent} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={newStudent.firstName}
                        onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                        placeholder="First name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={newStudent.lastName}
                        onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                        placeholder="Last name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        placeholder="Email address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={newStudent.phoneNo}
                        onChange={(e) => setNewStudent({ ...newStudent, phoneNo: e.target.value })}
                        placeholder="Phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Student ID</label>
                      <input
                        type="text"
                        value={newStudent.studentId}
                        onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                        placeholder="Student ID (e.g., APMF-2024-001)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={addingStudent}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 font-semibold flex items-center gap-2"
                    >
                      {addingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add Student
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStudentForm(false);
                        setNewStudent({
                          firstName: '',
                          lastName: '',
                          email: '',
                          phoneNo: '',
                          studentId: '',
                        });
                      }}
                      className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Add Enrollment Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Enrollment</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Student</label>
                  <select
                    value={selectedStudentForEnrollment}
                    onChange={(e) => setSelectedStudentForEnrollment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  >
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Course</label>
                  <select
                    value={selectedCourseForEnrollment}
                    onChange={(e) => setSelectedCourseForEnrollment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  >
                    <option value="">Select course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Slot</label>
                  <select
                    value={selectedSlotForEnrollment}
                    onChange={(e) => setSelectedSlotForEnrollment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  >
                    <option value="">Select slot</option>
                    {slots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleAddEnrollment}
                    disabled={addingEnrollment || !selectedStudentForEnrollment || !selectedCourseForEnrollment || !selectedSlotForEnrollment}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2"
                  >
                    {addingEnrollment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Enrollment
                  </button>
                </div>
              </div>
            </div>

            {/* Students Tabs */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="border-b border-gray-200">
                <div className="flex gap-0 px-6">
                  <button
                    onClick={() => setStudentTab('list')}
                    className={`px-6 py-4 font-semibold text-sm border-b-2 transition ${
                      studentTab === 'list'
                        ? 'text-green-600 border-green-600'
                        : 'text-gray-600 border-transparent hover:text-gray-800'
                    }`}
                  >
                    Students List
                  </button>
                  <button
                    onClick={() => setStudentTab('enrollments')}
                    className={`px-6 py-4 font-semibold text-sm border-b-2 transition ${
                      studentTab === 'enrollments'
                        ? 'text-green-600 border-green-600'
                        : 'text-gray-600 border-transparent hover:text-gray-800'
                    }`}
                  >
                    Enrollments
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Students List Tab */}
                {studentTab === 'list' && (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Students List</h2>
                      <div className="flex-1 max-w-md">
                        <input
                          type="text"
                          placeholder="Search by name, email, or student ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                        />
                      </div>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {loadingStudents ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                      </div>
                    ) : students.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No students registered yet</p>
                    ) : filteredStudents.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No students found matching "{searchQuery}"</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-100 border-b border-gray-300">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student ID</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Enrollments</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.map((student) => (
                              <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td className="px-4 py-3 text-sm text-gray-800">{student.studentId}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-800">{student.firstName} {student.lastName}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                  {editingStudentEmail === student.id ? (
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="email"
                                        value={editedEmail}
                                        onChange={(e) => setEditedEmail(e.target.value)}
                                        autoFocus
                                        className="px-2 py-1 border-2 border-green-600 rounded flex-1 text-sm focus:outline-none"
                                      />
                                      <button
                                        onClick={() => handleEditEmail(student.id)}
                                        className="text-green-600 hover:text-green-800 transition p-1 flex-shrink-0"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingStudentEmail(null);
                                          setEditedEmail('');
                                        }}
                                        className="text-gray-600 hover:text-gray-800 transition p-1 flex-shrink-0"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditingStudentEmail(student.id);
                                        setEditedEmail(student.email);
                                      }}
                                      className="flex items-center justify-between w-full hover:bg-blue-50 px-2 py-1 rounded transition"
                                    >
                                      <span className="truncate">{student.email}</span>
                                      <Edit2 className="w-4 h-4 text-blue-600 ml-2 flex-shrink-0" />
                                    </button>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">{student.phoneNo}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                  {student.enrollments.length > 0 ? (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                      {student.enrollments.length}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 text-xs">None</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                  <button
                                    onClick={() => handleDeleteStudent(student.id)}
                                    className="text-red-600 hover:text-red-800 transition p-1 inline-flex"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-4 text-sm text-gray-600 px-4">
                          Showing {filteredStudents.length} of {students.length} students
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Enrollments Tab */}
                {studentTab === 'enrollments' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Enrollments</h2>

                    {loadingStudents ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                      </div>
                    ) : students.filter(s => s.enrollments.length > 0).length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No enrollments yet</p>
                    ) : (
                      <div className="space-y-4">
                        {students.map((student) => (
                          student.enrollments.length > 0 && (
                            <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-green-600">👤</span>
                                {student.firstName} {student.lastName}
                                <span className="text-gray-500 text-sm font-normal">({student.studentId})</span>
                              </h4>
                              <div className="space-y-2">
                                {student.enrollments.map((enrollment) => (
                                  <div
                                    key={enrollment.id}
                                    className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded text-sm border border-gray-200"
                                  >
                                    <div>
                                      <strong className="text-green-700">{enrollment.course.name}</strong>
                                      <span className="text-gray-500 mx-2">•</span>
                                      <span className="text-gray-600">{enrollment.slot.name}</span>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveEnrollment(student.id, enrollment.id)}
                                      className="text-red-600 hover:text-red-800 transition p-1 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}