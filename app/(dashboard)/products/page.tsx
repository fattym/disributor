'use client';

import { useEffect, useState } from 'react';
import { distributorApi } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string | null;
  unit_price: string;
  min_order_quantity: number;
  available_stock: number;
  tags: string[];
  attributes: Record<string, string | number | boolean>;
  bulk_pricing: Array<{ min_qty: number; price: number }>;
  is_active: boolean;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit_price: '',
    min_order_quantity: '1',
    available_stock: '0',
    tags: '',
    attributes: '{}',
    bulk_pricing: '[]',
    is_active: true,
  });

  const fetchProducts = async () => {
    try {
      const params: Record<string, string> = {};
      if (categoryFilter) params.category = categoryFilter;
      if (tagFilter) params.tags = tagFilter;
      const data = await distributorApi.getProducts(params);
      setProducts(data.results || data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, tagFilter]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      let attributes = {};
      let bulk_pricing = [];
      try {
        attributes = JSON.parse(formData.attributes || '{}');
      } catch {}
      try {
        bulk_pricing = JSON.parse(formData.bulk_pricing || '[]');
      } catch {}

      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        unit_price: formData.unit_price,
        min_order_quantity: parseInt(formData.min_order_quantity, 10) || 1,
        available_stock: parseInt(formData.available_stock, 10) || 0,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        attributes,
        bulk_pricing,
        is_active: formData.is_active,
      };

      if (editingProduct) {
        await distributorApi.updateProduct(editingProduct.id.toString(), payload);
        setMessage('Product updated successfully');
        setMessageType('success');
      } else {
        await distributorApi.createProduct(payload);
        setMessage('Product created successfully');
        setMessageType('success');
      }
      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        unit_price: '',
        min_order_quantity: '1',
        available_stock: '0',
        tags: '',
        attributes: '{}',
        bulk_pricing: '[]',
        is_active: true,
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to save product');
      setMessageType('error');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      unit_price: product.unit_price,
      min_order_quantity: product.min_order_quantity.toString(),
      available_stock: product.available_stock.toString(),
      tags: product.tags.join(', '),
      attributes: JSON.stringify(product.attributes, null, 2),
      bulk_pricing: JSON.stringify(product.bulk_pricing, null, 2),
      is_active: product.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await distributorApi.deleteProduct(id);
      setMessage('Product deleted successfully');
      setMessageType('success');
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to delete product');
      setMessageType('error');
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      await distributorApi.updateProduct(product.id.toString(), { is_active: !product.is_active });
      fetchProducts();
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();

  if (loading) {
    return <div className="text-lg">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md ${messageType === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
          {message}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Products</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage your product catalog ({products.length} items)</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProduct(null);
            setFormData({
              name: '',
              description: '',
              category: '',
              unit_price: '',
              min_order_quantity: '1',
              available_stock: '0',
              tags: '',
              attributes: '{}',
              bulk_pricing: '[]',
              is_active: true,
            });
          }}
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tag</label>
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="Filter by tag..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
            {editingProduct ? 'Edit Product' : 'New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Unit Price (KSh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Min Order Quantity</label>
                <input
                  type="number"
                  value={formData.min_order_quantity}
                  onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Available Stock</label>
                <input
                  type="number"
                  value={formData.available_stock}
                  onChange={(e) => setFormData({ ...formData, available_stock: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="CBC, Grade 4, Mathematics"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Attributes (JSON)</label>
                <textarea
                  value={formData.attributes}
                  onChange={(e) => setFormData({ ...formData, attributes: e.target.value })}
                  rows={3}
                  placeholder='{"subject": "Mathematics", "grade": "Grade 4"}'
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Bulk Pricing (JSON)</label>
                <textarea
                  value={formData.bulk_pricing}
                  onChange={(e) => setFormData({ ...formData, bulk_pricing: e.target.value })}
                  rows={3}
                  placeholder='[{"min_qty": 50, "price": 400}, {"min_qty": 100, "price": 350}]'
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <label htmlFor="is_active" className="text-sm text-zinc-700 dark:text-zinc-300">Active</label>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {products.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Name</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Category</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Price</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Stock</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Min Qty</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Tags</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{product.name}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{product.category || '-'}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">
                      KSh {parseFloat(product.unit_price).toLocaleString()}
                      {product.bulk_pricing && product.bulk_pricing.length > 0 && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {product.bulk_pricing.map((bp, i) => (
                            <div key={i}>{bp.min_qty}+: KSh {bp.price}</div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{product.available_stock}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{product.min_order_quantity}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {tag}
                          </span>
                        ))}
                        {product.tags.length > 3 && (
                          <span className="text-xs text-zinc-500">+{product.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.is_active
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id.toString())}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
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
