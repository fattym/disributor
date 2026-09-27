'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { AdminCourse } from '@/lib/adminApi';

const filterTabs = [
  { key: 'all', label: 'All Courses' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'published', label: 'Published' },
  { key: 'drafts', label: 'Drafts' },
];

const statusColor: Record<AdminCourse['status'], string> = {
  PUBLISHED: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  PENDING_APPROVAL: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  DRAFT: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
  DELETED: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400',
};

const Rating = ({ value }: { value: number }) => (
  <span>{'⭐'.repeat(value)}
    {'☆'.repeat(5 - value)}
  </span>
);

export default function CoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await adminApi.getCourses();
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filtered = courses.filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return c.status === 'PENDING_APPROVAL';
    if (activeTab === 'published') return c.status === 'PUBLISHED';
    if (activeTab === 'drafts') return c.status === 'DRAFT';
    return true;
  });

  const handleApprove = (course: AdminCourse) => {
    setCourses(courses.map((c) => (c.id === course.id ? { ...c, status: 'PUBLISHED' } : c)));
    adminApi.updateCourse(course.id.toString(), { status: 'PUBLISHED' }).catch(() => {});
    setMessage(`"${course.title}" has been approved and published`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleReject = (course: AdminCourse) => {
    setCourses(courses.map((c) => (c.id === course.id ? { ...c, status: 'DELETED' } : c)));
    adminApi.updateCourse(course.id.toString(), { status: 'DELETED' }).catch(() => {});
    setMessage(`"${course.title}" has been rejected`);
    setTimeout(() => setMessage(''), 3000);
  };

  const pendingCount = courses.filter((c) => c.status === 'PENDING_APPROVAL').length;

  if (loading) {
    return <div className="text-lg">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Courses</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage and moderate learning courses ({courses.length} total)
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Add Course
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="p-3 text-sm text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-md">
          ⚠ {pendingCount} course{pendingCount !== 1 ? 's' : ''} waiting for approval.
        </div>
      )}

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No courses match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Course</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Instructor</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Students</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Price</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Rating</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Category</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course) => (
                  <tr key={course.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{course.title}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{course.instructor}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{course.students}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">
                      {parseFloat(course.price) === 0 ? 'Free' : formatCurrency(course.price)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Rating value={course.rating} />
                        <span className="text-xs text-zinc-500 dark:text-zinc-500">({course.rating_count})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{course.category}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor[course.status]}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {course.status === 'PENDING_APPROVAL' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(course)}
                              className="text-xs px-2 py-1 text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(course)}
                              className="text-xs px-2 py-1 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedCourse(course)}
                              className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{selectedCourse.title}</h2>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Instructor</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedCourse.instructor}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">{selectedCourse.instructor_email}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Students Enrolled</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedCourse.students} students</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Price</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {parseFloat(selectedCourse.price) === 0 ? 'Free' : formatCurrency(selectedCourse.price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Rating</p>
                  <Rating value={selectedCourse.rating} />
                  <span className="text-xs text-zinc-500 dark:text-zinc-500"> ({selectedCourse.rating_count} ratings)</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Category</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedCourse.category}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Created</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDateTime(selectedCourse.created_at)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => handleReject(selectedCourse)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleApprove(selectedCourse)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
