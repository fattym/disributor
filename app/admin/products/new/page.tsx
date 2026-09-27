'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import { useAuth } from '@/lib/auth';
import type { CategoryNode } from '@/lib/adminApi';
import { formatCurrency } from '@/lib/utils';

interface CategoryOption {
  id: number;
  name: string;
  depth: number;
}

interface CreatedProduct {
  id: number;
  name: string;
  price: string;
  category_name?: string;
}

const flatten = (nodes: CategoryNode[], depth = 0, out: CategoryOption[] = []): CategoryOption[] => {
  nodes.forEach((n) => {
    out.push({ id: n.id, name: n.name, depth });
    if (n.children?.length) flatten(n.children, depth + 1, out);
  });
  return out;
};

export default function NewProductPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useAuth();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<CreatedProduct | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: null as File | null,
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    adminApi
      .getCategories()
      .then((tree) => setCategories(flatten(tree)))
      .catch(() => setCategories([]));
  }, [user, router]);

  if (userLoading || !user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, image: e.target.files?.[0] || null }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) {
      alert('Name, category and price are required.');
      return;
    }
    setSaving(true);
    try {
      const saved = await adminApi.createProduct({
        name: form.name,
        category: Number(form.category),
        price: form.price,
        description: form.description,
        image: form.image,
      });
      setCreated({
        id: saved.id,
        name: saved.name,
        price: saved.price,
        category_name: saved.category,
      });
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Could not create product. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Product created
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            <span className="font-medium">{created.name}</span> —{' '}
            {formatCurrency(created.price)} — {created.category_name}
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/admin/products"
              className="px-4 py-2 text-sm font-medium text-white bg-navy rounded-md hover:opacity-90"
            >
              Back to Products
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setForm({ name: '', category: '', price: '', description: '', image: null });
              }}
              className="px-4 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">New Product</h1>
        <Link
          href="/admin/products"
          className="px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          Cancel
        </Link>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Category *
          </label>
          <select
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {'\u00A0'.repeat(c.depth * 2)} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Price (KSh) *
          </label>
          <input
            type="number"
            inputMode="decimal"
            required
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Image
          </label>
          <input type="file" accept="image/*" onChange={handleImage} />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-navy rounded-md hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
