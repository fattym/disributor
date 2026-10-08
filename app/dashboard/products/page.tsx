'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { distributorApi } from '@/lib/api';

interface ProductVariant {
  id?: number;
  label: string;
  size?: string;
  color?: string;
  stock_quantity: number;
  price_override?: string | null;
}

interface ProductImage {
  id: number;
  image_url: string | null;
  alt?: string;
  is_primary?: boolean;
}

interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  product_count: number;
  course_count: number;
  children: CategoryNode[];
}

interface CategoryOption {
  id: number;
  name: string;
  depth: number;
}

interface BackendGrade {
  id: number;
  name: string;
  stage: 'pre_primary' | 'primary' | 'junior_secondary' | 'senior_secondary';
  order: number;
}

interface BackendLearningArea {
  id: number;
  name: string;
  code?: string;
  grade?: number;
  pathway?: number | null;
  school?: number;
}

interface BackendPathway {
  id: number;
  name: string;
  code?: string;
}

interface VariantRow {
  id: number;
  label: string;
  size: string;
  color: string;
  stock_quantity: string;
  price_override: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  category: number | string;
  category_name?: string;
  image: string | null;
  image_url: string | null;
  images?: ProductImage[];
  unit_price: string;
  min_order_quantity: number;
  available_stock: number;
  tags: string[];
  attributes: Record<string, string | number | boolean>;
  bulk_pricing: Array<{ min_qty: number; price: number }>;
  is_active: boolean;
  created_at: string;
  sku?: string;
  brand?: string;
  product_type?: string;
  cost_price?: string | number | null;
  low_stock_threshold?: number;
  backorders?: boolean;
  shipping_weight?: string | number | null;
  shipping_length?: string | number | null;
  shipping_width?: string | number | null;
  shipping_height?: string | number | null;
  variants?: ProductVariant[];
  applicable_levels?: number[];
  learning_areas?: number[];
  institution_categories?: string[];
}

const INSTITUTION_CATEGORIES: Array<{ label: string; stage: string | null }> = [
  { label: 'Pre-Primary / Kindergarten', stage: 'pre_primary' },
  { label: 'Primary School', stage: 'primary' },
  { label: 'Junior Secondary School', stage: 'junior_secondary' },
  { label: 'Senior Secondary School', stage: 'senior_secondary' },
  { label: 'TVET / Vocational Institution', stage: null },
  { label: 'College', stage: null },
  { label: 'University', stage: null },
  { label: 'Training Centre', stage: null },
  { label: 'Special Needs Institution', stage: null },
  { label: 'International School', stage: null },
  { label: 'Other', stage: null },
];

const flatten = (nodes: CategoryNode[], depth = 0, out: CategoryOption[] = []): CategoryOption[] => {
  nodes.forEach((n) => {
    out.push({ id: n.id, name: n.name, depth });
    if (n.children?.length) flatten(n.children, depth + 1, out);
  });
  return out;
};

const inputCls =
  "w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100";
const labelCls = "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1";
const btnCls =
  "px-4 py-2 text-sm font-medium text-white bg-navy dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:opacity-90 disabled:opacity-60";
const cardCls =
  "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm p-6";

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
    sku: '',
    brand: '',
    product_type: 'physical',
    cost_price: '',
    low_stock_threshold: '0',
    backorders: false,
    shipping_weight: '',
    shipping_length: '',
    shipping_width: '',
    shipping_height: '',
    institution_categories: [] as string[],
    grade_levels: [] as number[],
    curriculum: '' as number | '',
    subjects: [] as number[],
  });
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([
    { id: 0, label: '', size: '', color: '', stock_quantity: '', price_override: '' },
  ]);
  const nextVariantId = useRef(1);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [gradesAll, setGradesAll] = useState<BackendGrade[]>([]);
  const [areasAll, setAreasAll] = useState<BackendLearningArea[]>([]);
  const [pathwaysAll, setPathwaysAll] = useState<BackendPathway[]>([]);

  const fetchProducts = useCallback(async () => {
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
  }, [categoryFilter, tagFilter]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const cats = await distributorApi.getCategories() as CategoryNode[] | { results: CategoryNode[] };
      const catList = Array.isArray(cats) ? cats : cats.results || [];
      setCategories(flatten(catList));
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
    try {
      const grades = await distributorApi.getGrades() as BackendGrade[] | { results: BackendGrade[] };
      setGradesAll(Array.isArray(grades) ? grades : grades.results || []);
    } catch (e) {
      console.error('Failed to fetch grades:', e);
    }
    try {
      const areas = await distributorApi.getLearningAreas() as BackendLearningArea[] | { results: BackendLearningArea[] };
      setAreasAll(Array.isArray(areas) ? areas : areas.results || []);
    } catch (e) {
      console.error('Failed to fetch learning areas:', e);
    }
    try {
      const pathways = await distributorApi.getPathways() as BackendPathway[] | { results: BackendPathway[] };
      setPathwaysAll(Array.isArray(pathways) ? pathways : pathways.results || []);
    } catch (e) {
      console.error('Failed to fetch pathways:', e);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchProducts();
      await fetchReferenceData();
    };
    load();
  }, [fetchProducts, fetchReferenceData]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const instStages = formData.institution_categories
    .map((c) => INSTITUTION_CATEGORIES.find((i) => i.label === c)?.stage)
    .filter((s): s is string => s !== null);

  const filteredGrades = gradesAll.filter(
    (g) => (instStages.length === 0 ? true : instStages.includes(g.stage)),
  );

  const toggleInstitution = (label: string) =>
    setFormData((prev) => ({
      ...prev,
      institution_categories: prev.institution_categories.includes(label)
        ? prev.institution_categories.filter((s) => s !== label)
        : [...prev.institution_categories, label],
    }));

  const filteredSubjects = areasAll.filter((la) => {
    if (formData.grade_levels.length && !formData.grade_levels.includes(la.grade ?? 0)) return false;
    if (formData.curriculum && !(la.pathway === Number(formData.curriculum))) return false;
    return true;
  });

  const addTag = (tag: string) => {
    const t = tag.trim();
    const currentTags = formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    if (t && !currentTags.includes(t)) {
      const newTags = [...currentTags, t];
      setFormData({ ...formData, tags: newTags.join(', ') });
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(formData.tags);
      setFormData((prev) => ({ ...prev, tags: '' }));
    }
  };

  const tagList = formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const addVariant = () => {
    setVariants([...variants, { id: nextVariantId.current++, label: '', size: '', color: '', stock_quantity: '', price_override: '' }]);
  };
  const removeVariant = (id: number) =>
    setVariants(variants.filter((v) => v.id !== id));
  const updateVariant = (id: number, field: keyof VariantRow, value: string) =>
    setVariants(variants.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages(files);
    e.target.value = '';
  };

  const removeExistingImage = (id: number) => {
    setExistingImages(existingImages.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!formData.name || !formData.category || !formData.unit_price) {
      alert('Product name, category and selling price are required.');
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        category: Number(formData.category),
        unit_price: formData.unit_price,
        description: formData.description,
        is_active: formData.is_active,
        sku: formData.sku || undefined,
        brand: formData.brand || undefined,
        product_type: formData.product_type,
        cost_price: formData.cost_price || undefined,
        low_stock_threshold: Number(formData.low_stock_threshold) || 0,
        backorders: formData.backorders,
        min_order_quantity: Number(formData.min_order_quantity) || 1,
        available_stock: Number(formData.available_stock) || 0,
        shipping_weight: formData.shipping_weight || undefined,
        shipping_length: formData.shipping_length || undefined,
        shipping_width: formData.shipping_width || undefined,
        shipping_height: formData.shipping_height || undefined,
        applicable_levels: formData.grade_levels,
        learning_areas: formData.subjects,
        institution_categories: formData.institution_categories.length ? formData.institution_categories : undefined,
        tags: tagList,
        attributes: JSON.parse(formData.attributes || '{}'),
        bulk_pricing: JSON.parse(formData.bulk_pricing || '[]'),
        variants: variants
          .filter((v) => v.label)
          .map((v) => ({
            id: v.id > 0 ? v.id : undefined,
            label: v.label,
            size: v.size || undefined,
            color: v.color || undefined,
            stock_quantity: v.stock_quantity ? Number(v.stock_quantity) : 0,
            price_override: v.price_override || undefined,
          })),
      };

      let saved: Product;
      if (editingProduct) {
        await distributorApi.updateProduct(editingProduct.id.toString(), payload);
        saved = editingProduct;
      } else {
        saved = await distributorApi.createProduct(payload);
      }

      if (images.length > 0 && saved?.id) {
        try {
          await distributorApi.uploadProductImages(saved.id, images);
        } catch {
          alert('Product saved but image upload failed.');
        }
      }

      setMessage(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setMessageType('success');
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
        sku: '',
        brand: '',
        product_type: 'physical',
        cost_price: '',
        low_stock_threshold: '0',
        backorders: false,
        shipping_weight: '',
        shipping_length: '',
        shipping_width: '',
        shipping_height: '',
        institution_categories: [],
        grade_levels: [],
        curriculum: '',
        subjects: [],
      });
      setImages([]);
      setExistingImages([]);
      setVariants([
        { id: 0, label: '', size: '', color: '', stock_quantity: '', price_override: '' },
      ]);
      nextVariantId.current = 1;
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
      name: product.name || '',
      description: product.description || '',
      category: product.category?.toString() || '',
      unit_price: product.unit_price || '',
      min_order_quantity: product.min_order_quantity?.toString() || '1',
      available_stock: product.available_stock?.toString() || '0',
      tags: product.tags?.join(', ') || '',
      attributes: JSON.stringify(product.attributes || {}, null, 2),
      bulk_pricing: JSON.stringify(product.bulk_pricing || [], null, 2),
      is_active: product.is_active !== undefined ? product.is_active : true,
      sku: product.sku || '',
      brand: product.brand || '',
      product_type: product.product_type || 'physical',
      cost_price: product.cost_price != null ? String(product.cost_price) : '',
      low_stock_threshold: product.low_stock_threshold?.toString() || '0',
      backorders: product.backorders || false,
      shipping_weight: product.shipping_weight != null ? String(product.shipping_weight) : '',
      shipping_length: product.shipping_length != null ? String(product.shipping_length) : '',
      shipping_width: product.shipping_width != null ? String(product.shipping_width) : '',
      shipping_height: product.shipping_height != null ? String(product.shipping_height) : '',
      institution_categories: product.institution_categories || [],
      grade_levels: product.applicable_levels || [],
      curriculum: '' as number | '',
      subjects: product.learning_areas || [],
    });
    if (product.variants && product.variants.length > 0) {
      setVariants(
        product.variants.map((v, i) => ({
          id: v.id ?? i,
          label: v.label || '',
          size: v.size || '',
          color: v.color || '',
          stock_quantity: v.stock_quantity?.toString() || '',
          price_override: v.price_override || '',
        })),
      );
      nextVariantId.current = Math.max(0, ...product.variants.map((v) => v.id ?? 0)) + 1;
    } else {
      setVariants([
        { id: 0, label: '', size: '', color: '', stock_quantity: '', price_override: '' },
      ]);
      nextVariantId.current = 1;
    }
    setImages([]);
    setExistingImages(product.images || []);
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

  const categoriesList = Array.from(new Set(products.map((p) => p.category_name).filter(Boolean))).sort() as string[];

  if (loading) {
    return <div className="text-lg">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md ${messageType === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-500'}`}>
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
              sku: '',
              brand: '',
              product_type: 'physical',
              cost_price: '',
              low_stock_threshold: '0',
              backorders: false,
              shipping_weight: '',
              shipping_length: '',
              shipping_width: '',
              shipping_height: '',
              institution_categories: [],
              grade_levels: [],
              curriculum: '',
              subjects: [],
            });
            setImages([]);
            setExistingImages([]);
            setVariants([
              { id: 0, label: '', size: '', color: '', stock_quantity: '', price_override: '' },
            ]);
            nextVariantId.current = 1;
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
              {categoriesList.map((cat) => (
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className={cardCls}>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Product name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. LP-CSK-001"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Product type *</label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    className={inputCls}
                  >
                    <option value="physical">Physical</option>
                    <option value="digital">Digital</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className={inputCls}
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {'\u00A0'.repeat(c.depth * 2)} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className={inputCls}
                    placeholder="Detailed product description..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Tags</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {tagList.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              tags: tagList.filter((x) => x !== t).join(', '),
                            })
                          }
                          className="hover:text-red-500"
                          aria-label={`Remove tag ${t}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <input
                      className="flex-1 min-w-[160px] px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      placeholder="Type and press Enter"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      onKeyDown={handleTagInput}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Press Enter or comma to add a tag.</p>
                </div>
              </div>
            </section>

            <section className={cardCls}>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Education Information</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                Pick an institution category to narrow the grade levels, then choose grades and subjects. The grade levels and
                subjects you select are used to power customer filtering on the marketplace.
              </p>

              <div className="mb-4">
                <label className={labelCls}>Category of Institution</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {INSTITUTION_CATEGORIES.map((c) => {
                    const checked = formData.institution_categories.includes(c.label);
                    return (
                      <label key={c.label} className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleInstitution(c.label)}
                          className="rounded border-zinc-400 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800"
                        />
                        {c.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Grade / Level</label>
                  <select
                    multiple
                    size={Math.min(Math.max(filteredGrades.length, 4), 8)}
                    value={formData.grade_levels.map(String)}
                    onChange={(e) => {
                      const ids = Array.from(e.target.selectedOptions as unknown as HTMLOptionElement[], (o) => Number(o.value));
                      setFormData({ ...formData, grade_levels: ids });
                    }}
                    className={inputCls}
                  >
                    {filteredGrades.length === 0 ? (
                      <option disabled>Select an institution category to load grades</option>
                    ) : (
                      filteredGrades.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({INSTITUTION_CATEGORIES.find((c) => c.stage === g.stage)?.label || g.stage})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {instStages.length ? 'Filtered by your institution selection.' : 'All grade levels are shown.'}
                  </p>
                </div>

                <div>
                  <label className={labelCls}>Curriculum</label>
                  <select
                    value={formData.curriculum}
                    onChange={(e) => setFormData({ ...formData, curriculum: e.target.value ? Number(e.target.value) : '' })}
                    className={inputCls}
                  >
                    <option value="">Any curriculum</option>
                    {pathwaysAll.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className={labelCls}>Subject / Learning Area</label>
                <select
                  multiple
                  size={Math.min(Math.max(filteredSubjects.length, 4), 8)}
                  value={formData.subjects.map(String)}
                  onChange={(e) => {
                    const ids = Array.from(e.target.selectedOptions as unknown as HTMLOptionElement[], (o) => Number(o.value));
                    setFormData({ ...formData, subjects: ids });
                  }}
                  className={inputCls}
                >
                  {filteredSubjects.length === 0 ? (
                    <option disabled>No subjects match your grade / curriculum selection.</option>
                  ) : (
                    filteredSubjects.map((la) => (
                      <option key={la.id} value={la.id}>
                        {la.name}{la.code ? ` (${la.code})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </section>

            <section className={cardCls}>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Cost Price (KSh)</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="What you pay"
                  />
                </div>
                <div>
                  <label className={labelCls}>Selling Price (KSh) *</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="What customers pay"
                    required
                  />
                </div>
              </div>
            </section>

            <section className={cardCls}>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Inventory</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Low Stock Threshold</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={formData.backorders}
                      onChange={(e) => setFormData({ ...formData, backorders: e.target.checked })}
                      className="rounded border-zinc-400 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800"
                    />
                    Allow backorders
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Min Order Quantity</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="1"
                    value={formData.min_order_quantity}
                    onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Available Stock</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    value={formData.available_stock}
                    onChange={(e) => setFormData({ ...formData, available_stock: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className={cardCls}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Variants</h2>
                <button type="button" onClick={addVariant} className="text-sm text-navy dark:text-zinc-100 hover:opacity-80">
                  + Add variant
                </button>
              </div>
              {variants.length === 0 ? (
                <button type="button" onClick={addVariant} className="text-sm text-navy hover:opacity-80">
                  Add your first variant
                </button>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr>
                        <th className="text-left pb-2 text-zinc-500 dark:text-zinc-400 font-medium">Label</th>
                        <th className="text-left pb-2 text-zinc-500 dark:text-zinc-400 font-medium">Size</th>
                        <th className="text-left pb-2 text-zinc-500 dark:text-zinc-400 font-medium">Color</th>
                        <th className="text-left pb-2 text-zinc-500 dark:text-zinc-400 font-medium w-20">Stock</th>
                        <th className="text-left pb-2 text-zinc-500 dark:text-zinc-400 font-medium">Price override</th>
                        <th className="w-12" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {variants.map((v) => (
                        <tr key={v.id} className="align-top">
                          <td className="py-2 pr-2">
                            <input
                              className={inputCls}
                              value={v.label}
                              onChange={(e) => updateVariant(v.id, 'label', e.target.value)}
                              placeholder="e.g. Default"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              className={inputCls}
                              value={v.size}
                              onChange={(e) => updateVariant(v.id, 'size', e.target.value)}
                              placeholder="e.g. One Size"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              className={inputCls}
                              value={v.color}
                              onChange={(e) => updateVariant(v.id, 'color', e.target.value)}
                              placeholder="e.g. Clear"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              className={inputCls}
                              type="number"
                              min="0"
                              value={v.stock_quantity}
                              onChange={(e) => updateVariant(v.id, 'stock_quantity', e.target.value)}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              className={inputCls}
                              type="number"
                              min="0"
                              step="0.01"
                              value={v.price_override}
                              onChange={(e) => updateVariant(v.id, 'price_override', e.target.value)}
                              placeholder="Blank = product price"
                            />
                          </td>
                          <td className="py-2 pl-2">
                            <button
                              type="button"
                              onClick={() => removeVariant(v.id)}
                              className="pb-2 text-red-500 hover:text-red-700"
                              aria-label="Remove variant"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Stock is managed per variant. This product has {variants.filter((v) => v.label).length} labeled variant(s).
              </p>
            </section>

            <section className={cardCls}>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Shipping</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Weight (kg)</label>
                  <input className={inputCls} type="number" min="0" step="0.01" value={formData.shipping_weight} onChange={(e) => setFormData({ ...formData, shipping_weight: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Length (cm)</label>
                  <input className={inputCls} type="number" min="0" step="0.01" value={formData.shipping_length} onChange={(e) => setFormData({ ...formData, shipping_length: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Width (cm)</label>
                  <input className={inputCls} type="number" min="0" step="0.01" value={formData.shipping_width} onChange={(e) => setFormData({ ...formData, shipping_width: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Height (cm)</label>
                  <input className={inputCls} type="number" min="0" step="0.01" value={formData.shipping_height} onChange={(e) => setFormData({ ...formData, shipping_height: e.target.value })} />
                </div>
              </div>
            </section>

            <section className={cardCls}>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Images</h2>
              <div>
                <label className={labelCls}>Main Image &amp; Additional Images</label>
                <input type="file" accept="image/*" multiple onChange={handleImages} />
                {existingImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative aspect-square rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.image_url || '/placeholder.png'}
                          alt={img.alt || 'product image'}
                          className="object-cover w-full h-full"
                        />
                        {img.is_primary && (
                          <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-white">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-red-800 text-white hover:bg-red-700"
                          aria-label="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((f, i) => (
                      <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(f)}
                          alt={`preview ${i + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-white">
                          {i === 0 ? 'Main' : 'Additional'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  The first image becomes the main product image. To replace, select new files.
                </p>
              </div>
            </section>

            <section className={cardCls}>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Publishing</h2>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="radio"
                    name="publish"
                    checked={formData.is_active}
                    onChange={() => setFormData({ ...formData, is_active: true })}
                    className="accent-navy"
                  />
                  Publish
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="radio"
                    name="publish"
                    checked={!formData.is_active}
                    onChange={() => setFormData({ ...formData, is_active: false })}
                    className="accent-navy"
                  />
                  Draft
                </label>
              </div>
            </section>

            <section className={cardCls}>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Attributes (JSON)</h2>
              <textarea
                value={formData.attributes}
                onChange={(e) => setFormData({ ...formData, attributes: e.target.value })}
                rows={3}
                placeholder='{"subject": "Mathematics", "grade": "Grade 4"}'
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </section>

            <section className={cardCls}>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Bulk Pricing (JSON)</h2>
              <textarea
                value={formData.bulk_pricing}
                onChange={(e) => setFormData({ ...formData, bulk_pricing: e.target.value })}
                rows={3}
                placeholder='[{"min_qty": 50, "price": 400}, {"min_qty": 100, "price": 350}]'
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </section>

            <div className="sticky bottom-0 mt-6 px-4 py-4 bg-zinc-50 dark:bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className={btnCls}>
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
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
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{product.category_name || product.category || '-'}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">
                      KSh {parseFloat(product.unit_price || '0').toLocaleString()}
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
                        {(product.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {tag}
                          </span>
                        ))}
                        {(product.tags || []).length > 3 && (
                          <span className="text-xs text-zinc-500">+{product.tags!.length - 3}</span>
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
