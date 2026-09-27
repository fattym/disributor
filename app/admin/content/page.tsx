'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatDateTime } from '@/lib/utils';
import type { ContentItem } from '@/lib/adminApi';

const sections = [
  { key: 'homepage', label: 'Homepage' },
  { key: 'pages', label: 'Pages' },
];

const homepageSections = ['Hero Banner', 'Featured Products', 'Featured Courses', 'Categories', 'Promotions', 'Testimonials'];
const pageList = [
  { key: 'about', label: 'About' },
  { key: 'contact', label: 'Contact' },
  { key: 'terms', label: 'Terms' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'faq', label: 'FAQ' },
];

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('homepage');
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [formValue, setFormValue] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await adminApi.getContent();
        setContent(data);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const findContent = (key: string) => content.find((c) => c.key === key);

  const openEditor = (key: string) => {
    const existing = findContent(key) ?? { id: 0, key, title: key, content: '', type: 'section', updated_at: '' };
    setEditing(existing);
    setFormValue(existing.content);
  };

  const saveContent = async () => {
    if (!editing) return;
    try {
      const payload = { ...editing, content: formValue };
      await adminApi.updateContent(editing.id.toString(), payload);
      setContent(content.map((c) => (c.key === editing.key ? payload : c)));
      setMessage(`"${editing.title}" saved`);
      setTimeout(() => setMessage(''), 3000);
      setEditing(null);
    } catch {
      setMessage('Failed to save content');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return <div className="text-lg">Loading content...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Content Management</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage website content without touching code</p>
      </div>

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setActiveSection(s.key);
              setEditing(null);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeSection === s.key
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl mx-4">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Edit: {editing.title}</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Content (HTML)</label>
              <textarea
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono text-sm"
              />
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveContent}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Key</th>
              <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Title</th>
              <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Type</th>
              <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Last Updated</th>
              <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeSection === 'homepage'
              ? homepageSections.map((key) => {
                  const c = findContent(key);
                  return (
                    <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{key}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{c?.title || key}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">section</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{c ? formatDateTime(c.updated_at) : '—'}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openEditor(key)}
                          className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              : pageList.map((page) => {
                  const c = findContent(page.key);
                  return (
                    <tr key={page.key} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{page.label}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{c?.title || page.label}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">page</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{c ? formatDateTime(c.updated_at) : '—'}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openEditor(page.key)}
                          className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
