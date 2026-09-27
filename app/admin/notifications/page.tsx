'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatDateTime } from '@/lib/utils';
import type { PlatformNotification } from '@/lib/adminApi';
import { mockNotifications } from '@/lib/adminApi';

const typeIcon = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  error: '🚨',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await adminApi.getNotifications();
        setNotifications(data);
      } catch {
        setNotifications(mockNotifications);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return <div className="text-lg">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Notifications</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">{unreadCount} unread alert{s(unreadCount)}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={markAllRead}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Mark All Read
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No notifications.</div>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {notifications.map((note) => (
              <li
                key={note.id}
                className={`p-4 transition-colors ${
                  note.read ? '' : 'bg-orange-50/30 dark:bg-orange-900/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{typeIcon[note.type]}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium ${note.read ? 'text-zinc-700 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {note.title}
                      </p>
                      {!note.read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(note.id)}
                          className="text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${note.read ? 'text-zinc-500 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {note.message}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                      {formatDateTime(note.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    className="text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                    aria-label="Delete notification"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function s(count: number) {
  return count === 1 ? '' : 's';
}
