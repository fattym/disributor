'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  adminApi,
  type BackendGrade,
  type BackendLearningArea,
  type BackendPathway,
  type BackendProduct,
  type CreateProductData,
} from '@/lib/adminApi';
import type { CategoryNode } from '@/lib/adminApi';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';

interface CategoryOption {
  id: number;
  name: string;
  depth: number;
}

interface VariantRow {
  id: number;
  label: string;
  size: string;
  color: string;
  stock_quantity: string;
  price_override: string;
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
  "w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100";
const labelCls = "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1";
const btnCls =
  "px-4 py-2 text-sm font-medium text-white bg-navy dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:opacity-90 disabled:opacity-60";
const cardCls =
  "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm p-6";

export default function NewProductPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useAuth();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [gradesAll, setGradesAll] = useState<BackendGrade[]>([]);
  const [areasAll, setAreasAll] = useState<BackendLearningArea[]>([]);
  const [pathwaysAll, setPathwaysAll] = useState<BackendPathway[]>([]);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<BackendProduct | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [productType, setProductType] = useState<'physical' | 'digital' | 'service'>('physical');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Education (connected)
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [gradeLevels, setGradeLevels] = useState<number[]>([]);
  const [curriculum, setCurriculum] = useState<number | ''>('');
  const [subjects, setSubjects] = useState<number[]>([]);

  // Pricing
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  // Inventory
  const [lowStock, setLowStock] = useState('0');
  const [backorders, setBackorders] = useState(false);

  // Shipping
  const [shipWeight, setShipWeight] = useState('');
  const [shipLength, setShipLength] = useState('');
  const [shipWidth, setShipWidth] = useState('');
  const [shipHeight, setShipHeight] = useState('');

  // Images
  const [images, setImages] = useState<File[]>([]);

  // Bulk import
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; failed: number; errors?: unknown[] } | null>(null);

  // Variants
  const [variants, setVariants] = useState<VariantRow[]>([
    { id: 0, label: '', size: '', color: '', stock_quantity: '', price_override: '' },
  ]);
  const nextVariantId = useRef(1);

  // Publishing (defaults to Draft: products only appear on /shop once an admin publishes them)
  const [publish, setPublish] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    adminApi.getCategories().then((tree) => setCategories(flatten(tree)));
    adminApi.getGrades().then(setGradesAll);
    adminApi.getLearningAreas().then(setAreasAll);
    adminApi.getPathways().then(setPathwaysAll);
  }, [user, router]);

  if (userLoading || !user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  const instStages = selectedInstitutions
    .map((c) => INSTITUTION_CATEGORIES.find((i) => i.label === c)?.stage)
    .filter((s): s is string => s !== null);

  const filteredGrades = gradesAll.filter(
    (g) => (instStages.length === 0 ? true : instStages.includes(g.stage)),
  );

  const toggleInstitution = (label: string) =>
    setSelectedInstitutions((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label],
    );

  const filteredSubjects = areasAll.filter((la) => {
    if (gradeLevels.length && !gradeLevels.includes(la.grade ?? 0)) return false;
    if (curriculum && !(la.pathway === Number(curriculum))) return false;
    return true;
  });

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
  };
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagsInput);
      setTagsInput('');
    }
  };

  const addVariant = () => {
    setVariants([...variants, { id: nextVariantId.current++, label: '', size: '', color: '', stock_quantity: '', price_override: '' }]);
  };
  const removeVariant = (id: number) =>
    setVariants(variants.filter((v) => v.id !== id));
  const updateVariant = (id: number, field: keyof VariantRow, value: string) =>
    setVariants(variants.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  const discountPct =
    costPrice && sellingPrice && parseFloat(costPrice) > 0
      ? (((parseFloat(sellingPrice) - parseFloat(costPrice)) / parseFloat(costPrice)) * 100).toFixed(0)
      : null;

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImages(Array.from(e.target.files ?? []));
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Choose a CSV or Excel (.xlsx) file first.');
      return;
    }
    setImporting(true);
    try {
      const res = await adminApi.importProducts(importFile);
      setImportResult(res);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. See console for details.');
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !sellingPrice) {
      alert('Product name, category and selling price are required.');
      return;
    }
    setSaving(true);
    try {
      const payload: CreateProductData = {
        name,
        category: Number(category),
        price: sellingPrice,
        description,
        is_active: publish,
        sku: sku || undefined,
        brand: brand || undefined,
        product_type: productType,
        cost_price: costPrice || undefined,
        low_stock_threshold: Number(lowStock) || 0,
        backorders,
        shipping_weight: shipWeight || undefined,
        shipping_length: shipLength || undefined,
        shipping_width: shipWidth || undefined,
        shipping_height: shipHeight || undefined,
        applicable_levels: gradeLevels,
        learning_areas: subjects,
        institution_categories: selectedInstitutions.length ? selectedInstitutions : undefined,
        tags,
        images: images.length ? images : undefined,
        variants: variants
          .filter((v) => v.label)
          .map((v) => ({
            label: v.label,
            size: v.size || undefined,
            color: v.color || undefined,
            stock_quantity: v.stock_quantity ? Number(v.stock_quantity) : 0,
            price_override: v.price_override || undefined,
          })),
      };
      const saved = await adminApi.createProduct(payload);
      setCreated(saved);
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
        <div className={cardCls + ' text-center'}>
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Product created</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            <span className="font-medium">{created.name}</span> — SKU: {created.sku || '—'} —{' '}
            {formatCurrency(created.price ?? 0)} — Category: {created.category_name || '—'}
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/admin/products" className={btnCls}>
              Back to Products
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                router.replace('/admin/products/new');
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
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">New Product</h1>
        <Link
          href="/admin/products"
          className="px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className={cardCls}>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Bulk Import (CSV / Excel)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            Upload a spreadsheet and the system will create products automatically, including university / TVET / college
            items. Required columns: <code className="font-mono">name</code>, <code>category</code>, <code>price</code>.
            Multi-value columns (institution_categories, grade_levels, learning_areas, tags) may use commas or
            semicolons. A <code>variants</code> column uses <code>label,size,color,stock</code> (separate rows with
            <code>;</code>).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <label className="flex-1 flex flex-col justify-center px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Chosen file</span>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <span className="mt-1 truncate text-sm">{importFile?.name || 'No file chosen'}</span>
            </label>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !importFile}
              className={btnCls}
            >
              {importing ? 'Importing…' : 'Import Products'}
            </button>
          </div>
          {importResult && (
            <div className="mt-4 text-sm text-zinc-800 dark:text-zinc-200">
              Created: <span className="font-medium">{importResult.created}</span> · Failed:{' '}
              <span className="font-medium">{importResult.failed}</span>
              {importResult.failed ? (
                <details className="mt-2 text-xs text-red-600 dark:text-red-400">
                  <summary>Show errors</summary>
                  <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(importResult.errors, null, 2)}
                  </pre>
                </details>
              ) : null}
              <Link href="/admin/products" className="ml-3 underline text-navy dark:text-zinc-100">
                View products →
              </Link>
            </div>
          )}
        </section>

        <section className={cardCls}>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Product name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>SKU</label>
              <input className={inputCls} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. LP-CSK-001" />
            </div>
            <div>
              <label className={labelCls}>Product type *</label>
              <select className={inputCls} value={productType} onChange={(e) => setProductType(e.target.value as typeof productType)}>
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Category *</label>
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} required>
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={inputCls}
                placeholder="Detailed product description..."
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap gap-2 items-center">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
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
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
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
                const checked = selectedInstitutions.includes(c.label);
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
                className={inputCls}
                multiple
                size={Math.min(Math.max(filteredGrades.length, 4), 8)}
                value={gradeLevels.map(String)}
                onChange={(e) => {
                  const ids = Array.from(e.target.selectedOptions as unknown as HTMLOptionElement[], (o) => Number(o.value));
                  setGradeLevels(ids);
                }}
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
              <select className={inputCls} value={curriculum} onChange={(e) => setCurriculum(e.target.value ? Number(e.target.value) : '')}>
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
                className={inputCls}
                multiple
                size={Math.min(Math.max(filteredSubjects.length, 4), 8)}
                value={subjects.map(String)}
                onChange={(e) => {
                  const ids = Array.from(e.target.selectedOptions as unknown as HTMLOptionElement[], (o) => Number(o.value));
                  setSubjects(ids);
                }}
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
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
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
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="What customers pay"
                required
              />
              {discountPct !== null && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Margin: +{discountPct}% over cost.</p>
              )}
            </div>
          </div>
        </section>

        <section className={cardCls}>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelCls}>Low Stock Threshold</label>
              <input
                className={inputCls}
                type="number"
                min="0"
                value={lowStock}
                onChange={(e) => setLowStock(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={backorders}
                  onChange={(e) => setBackorders(e.target.checked)}
                  className="rounded border-zinc-400 dark:border-zinc-600"
                />
                Allow backorders
              </label>
            </div>
            <div className="md:col-span-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Stock quantity is managed per variant below. This product has{' '}
                {variants.filter((v) => v.label).length} variant(s).
              </p>
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
            <div className="overflow-x-auto -mx-6 sm:mx-0">
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
              <input className={inputCls} type="number" min="0" step="0.01" value={shipWeight} onChange={(e) => setShipWeight(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Length (cm)</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={shipLength} onChange={(e) => setShipLength(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Width (cm)</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={shipWidth} onChange={(e) => setShipWidth(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Height (cm)</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={shipHeight} onChange={(e) => setShipHeight(e.target.value)} />
            </div>
          </div>
        </section>

        <section className={cardCls}>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Images</h2>
          <div>
            <label className={labelCls}>Main Image &amp; Additional Images</label>
            <input type="file" accept="image/*" multiple onChange={handleImages} />
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
              The first image becomes the main product image. You can reorder by re-selecting files.
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
                checked={publish}
                onChange={() => setPublish(true)}
                className="accent-navy"
              />
              Publish
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
              <input
                type="radio"
                name="publish"
                checked={!publish}
                onChange={() => setPublish(false)}
                className="accent-navy"
              />
              Draft
            </label>
          </div>
        </section>

        <div className="sticky bottom-0 mt-6 px-4 py-4 bg-zinc-50 dark:bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancel
          </Link>
          <button type="submit" disabled={saving} className={btnCls}>
            {saving ? 'Saving…' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
