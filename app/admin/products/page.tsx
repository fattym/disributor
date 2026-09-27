'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency } from '@/lib/utils';
import type { AdminProduct } from '@/lib/adminApi';

const filterTabs = [
  { key: 'all', label: 'All Products' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'published', label: 'Published' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'out_of_stock', label: 'Out of Stock' },
  { key: 'deleted', label: 'Deleted' },
];

const statusColor: Record<AdminProduct['status'], string> = {
  PUBLISHED: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  PENDING_APPROVAL: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  DRAFT: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
  OUT_OF_STOCK: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  DELETED: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await adminApi.getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return p.status === 'PENDING_APPROVAL';
    if (activeTab === 'published') return p.status === 'PUBLISHED';
    if (activeTab === 'drafts') return p.status === 'DRAFT';
    if (activeTab === 'out_of_stock') return p.status === 'OUT_OF_STOCK';
    if (activeTab === 'deleted') return p.status === 'DELETED';
    return true;
  });

  const handleApprove = (product: AdminProduct) => {
    setProducts(
      products.map((p) =>
        p.id === product.id ? { ...p, status: 'PUBLISHED' } : p,
      ),
    );
    adminApi.updateProduct(product.id.toString(), { status: 'PUBLISHED' }).catch(() => {});
    setMessage(`"${product.name}" approved and published`);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleFeatured = (product: AdminProduct) => {
    setProducts(
      products.map((p) => (p.id === product.id ? { ...p, featured: !p.featured } : p)),
    );
    adminApi.updateProduct(product.id.toString(), { featured: !product.featured }).catch(() => {});
  };

  const toggleStatus = (product: AdminProduct) => {
    const newStatus = product.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setProducts(
      products.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p)),
    );
    adminApi.updateProduct(product.id.toString(), { status: newStatus }).catch(() => {});
  };

  const pendingCount = products.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const outOfStockCount = products.filter((p) => p.status === 'OUT_OF_STOCK').length;

  if (loading) {
    return <div className="text-lg">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Products</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage and moderate marketplace products ({products.length} total)
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Add Product
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="p-3 text-sm text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-md">
          ⚠ {pendingCount} product{pendingCount !== 1 ? 's' : ''} waiting for approval.
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
          <div className="p-6 text-center text-zinc-500">No products match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Product</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Seller</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Category</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Price</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Stock</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Featured</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{product.name}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{product.seller}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{product.category || '-'}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{formatCurrency(product.price)}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{product.stock}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor[product.status]}`}>
                        {product.status}
                      </span>
                      {product.status === 'PENDING_APPROVAL' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(product)}
                          className="ml-2 text-xs px-2 py-0.5 text-white bg-green-600 rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                      )}
                      {outOfStockCount > 0 && product.status === 'PUBLISHED' && product.stock === 0 && (
                        <span className="ml-2 text-xs text-red-600 dark:text-red-400">(Out of stock)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(product)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          product.featured
                            ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {product.featured ? 'Featured' : 'Feature'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleStatus(product)}
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
