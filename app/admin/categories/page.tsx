'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import type { CategoryNode } from '@/lib/adminApi';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await adminApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const toggle = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: CategoryNode, depth = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded[node.id] ?? (depth === 0 ? true : false);
    const paddingLeft = depth * 1.5 + 0.75;
    return (
      <div key={node.id}>
        <div
          className={`flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 ${depth === 0 ? 'font-medium' : ''}`}
          style={{ paddingLeft: `${paddingLeft}rem` }}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggle(node.id)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            <span className="text-zinc-900 dark:text-zinc-100">{node.name}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">({node.slug})</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <span>{node.product_count} products</span>
            <span>{node.course_count} courses</span>
            <button
              type="button"
              onClick={() => {
                adminApi.updateCategory(node.id.toString(), { name: node.name + ' (renamed)' }).catch(() => {});
                setMessage(`"${node.name}" updated`);
                setTimeout(() => setMessage(''), 3000);
              }}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 py-0.5 rounded"
            >
              Edit
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-lg">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Categories</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage educational categories and sub-categories
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Add Category
        </button>
      </div>

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Category Tree</th>
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Products</th>
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Courses</th>
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>{categories.map((node) => renderNode(node))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
