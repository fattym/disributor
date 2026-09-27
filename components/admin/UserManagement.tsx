'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import type { AdminUser, AccountType, UserStatus } from '@/lib/adminApi';

const typeMap: Record<string, { label: string; type: AccountType | null }> = {
  all: { label: 'All Users', type: null },
  customers: { label: 'Customers', type: 'CUSTOMER' },
  sellers: { label: 'Sellers', type: 'SELLER' },
  teachers: { label: 'Teachers', type: 'TEACHER' },
  'school-accounts': { label: 'School Accounts', type: 'SCHOOL_ACCOUNT' },
  administrators: { label: 'Administrators', type: 'ADMINISTRATOR' },
};

const statusColor: Record<UserStatus, string> = {
  ACTIVE: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  SUSPENDED: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  PENDING: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
};

export default function UserManagement({ activeType }: { activeType: keyof typeof typeMap }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminApi.getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = activeType === 'all' ? users : users.filter((u) => u.account_type === typeMap[activeType].type);

  const handleSuspend = (user: AdminUser) => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUsers(users.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
    adminApi.updateUser(user.id.toString(), { status: newStatus }).catch(() => {});
    setMessage(`${user.name} has been ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const accountTypeLabel = (t: AccountType) => {
    const map: Record<AccountType, string> = {
      CUSTOMER: 'Customer',
      SELLER: 'Seller',
      TEACHER: 'Teacher',
      SCHOOL_ACCOUNT: 'School Account',
      ADMINISTRATOR: 'Administrator',
    };
    return map[t] || t;
  };

  if (loading) {
    return <div className="text-lg">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Users</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage everyone using Learning Pack ({users.length} total)</p>
        </div>
        <Link
          href="/admin/users/all"
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Add User
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(typeMap).map((key) => {
          const { label } = typeMap[key as keyof typeof typeMap];
          const isActive = activeType === key;
          return (
            <Link
              key={key}
              href={`/admin/users/${key}`}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Name</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Email</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Phone</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Account Type</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Registration Date</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Last Login</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{user.name}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{user.phone}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{accountTypeLabel(user.account_type)}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{user.registration_date}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSuspend(user)}
                          className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
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
