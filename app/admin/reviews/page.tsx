'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatDateTime } from '@/lib/utils';
import type { AdminReview } from '@/lib/adminApi';

const statusColor = {
  APPROVED: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  HIDDEN: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400',
  PENDING: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
};

const renderRating = (rating: number) => '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await adminApi.getReviews();
        setReviews(data);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleStatus = (review: AdminReview, status: 'APPROVED' | 'HIDDEN' | 'PENDING') => {
    setReviews(reviews.map((r) => (r.id === review.id ? { ...r, status } : r)));
    adminApi.updateReview(review.id.toString(), { status }).catch(() => {});
    setMessage(`Review ${status === 'APPROVED' ? 'approved' : status === 'HIDDEN' ? 'hidden' : 'marked pending'}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = (review: AdminReview) => {
    setReviews(reviews.filter((r) => r.id !== review.id));
    setMessage(`Review deleted`);
    setTimeout(() => setMessage(''), 3000);
  };

  const pendingCount = reviews.filter((r) => r.status === 'PENDING').length;

  if (loading) {
    return <div className="text-lg">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Reviews & Ratings</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Moderate customer reviews ({reviews.length} total)
        </p>
      </div>

      {pendingCount > 0 && (
        <div className="p-3 text-sm text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-md">
          ⚠ {pendingCount} review{pendingCount !== 1 ? 's' : ''} pending moderation.
        </div>
      )}

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No reviews found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Product</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Customer</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Rating</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Comment</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Date</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{review.product}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{review.customer}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{renderRating(review.rating)}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                      {review.comment || <span className="text-zinc-500">No comment</span>}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{formatDateTime(review.date)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor[review.status]}`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {review.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleStatus(review, 'APPROVED')}
                            className="text-xs px-2 py-1 text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {review.status !== 'HIDDEN' && (
                          <button
                            type="button"
                            onClick={() => handleStatus(review, 'HIDDEN')}
                            className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Hide
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(review)}
                          className="text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
