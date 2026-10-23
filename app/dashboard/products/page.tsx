'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { distributorApi } from '@/lib/api';
import {
  navigationData,
  getFlatTaxonomy,
  type NavCategory,
  type NavGroup,
  type NavLeaf,
} from '@/lib/shopCategories';

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
  attributes: Record<string, unknown>;
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

// ---- Constants matching /shop filter categories ----
export const CBC_SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Integrated Science',
  'Agriculture',
  'Creative Arts',
  'Social Studies',
  'CRE/IRE',
  'Computer (ICT)',
  'Home Science',
];

export const KENYAN_PUBLISHERS = [
  'KLB',
  'Longhorn',
  'Oxford',
  'Moran',
  'Storymoja',
  'Spotlight',
];

export const SHOP_TAG_BADGES = [
  { id: 'kicd', label: 'KICD Approved', icon: '🏅', desc: 'Approved by Kenya Institute of Curriculum Development' },
  { id: 'bestseller', label: 'Bestseller', icon: '🔥', desc: 'Popular high-demand item' },
  { id: 'new', label: 'New Syllabus', icon: '📘', desc: 'Compliant with latest CBC syllabus' },
  { id: 'set', label: 'Set Books', icon: '📚', desc: 'Official literature & fasihi set book' },
  { id: 'stem', label: 'STEM / Science', icon: '🔬', desc: 'Science, Technology, Engineering & Math' },
  { id: 'lab', label: 'Lab / Laboratory', icon: '🧪', desc: 'Chemistry, Physics, Biology lab materials' },
];

export const AUDIENCE_OPTIONS = [
  { id: 'school', label: 'School / Club', icon: '🏫', desc: 'Bulk institution orders' },
  { id: 'parent', label: 'Parent', icon: '👨‍👩‍👧', desc: 'Home learning & personal study' },
  { id: 'student', label: 'Student', icon: '🎓', desc: 'Individual learner packs' },
];

export const DEFAULT_CBC_GRADES: BackendGrade[] = [
  { id: 1, name: 'Playgroup', stage: 'pre_primary', order: 1 },
  { id: 2, name: 'PP1', stage: 'pre_primary', order: 2 },
  { id: 3, name: 'PP2', stage: 'pre_primary', order: 3 },
  { id: 4, name: 'Grade 1', stage: 'primary', order: 4 },
  { id: 5, name: 'Grade 2', stage: 'primary', order: 5 },
  { id: 6, name: 'Grade 3', stage: 'primary', order: 6 },
  { id: 7, name: 'Grade 4', stage: 'primary', order: 7 },
  { id: 8, name: 'Grade 5', stage: 'primary', order: 8 },
  { id: 9, name: 'Grade 6', stage: 'primary', order: 9 },
  { id: 10, name: 'Grade 7', stage: 'junior_secondary', order: 10 },
  { id: 11, name: 'Grade 8', stage: 'junior_secondary', order: 11 },
  { id: 12, name: 'Grade 9', stage: 'junior_secondary', order: 12 },
  { id: 13, name: 'Grade 10', stage: 'senior_secondary', order: 13 },
  { id: 14, name: 'Grade 11', stage: 'senior_secondary', order: 14 },
  { id: 15, name: 'Grade 12', stage: 'senior_secondary', order: 15 },
  { id: 16, name: 'Form 1', stage: 'senior_secondary', order: 16 },
  { id: 17, name: 'Form 2', stage: 'senior_secondary', order: 17 },
  { id: 18, name: 'Form 3', stage: 'senior_secondary', order: 18 },
  { id: 19, name: 'Form 4', stage: 'senior_secondary', order: 19 },
];

export const GRADE_STAGES = [
  { key: 'pre_primary', label: 'Pre-Primary & ECDE' },
  { key: 'primary', label: 'Primary (Grade 1–6)' },
  { key: 'junior_secondary', label: 'Junior Secondary (Grade 7–9)' },
  { key: 'senior_secondary', label: 'Senior Secondary (Grade 10–12 / Form 1–4)' },
];

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 1, name: 'Educational & CBC Books', depth: 0 },
  { id: 2, name: 'School Supplies & Stationery', depth: 0 },
  { id: 3, name: 'Art, Craft & Practical Learning', depth: 0 },
  { id: 4, name: 'Toys, Board Games & ECDE Aids', depth: 0 },
  { id: 5, name: 'Reference Books & Atlases', depth: 0 },
  { id: 6, name: 'Bags & School Gear', depth: 0 },
];

const inputCls =
  'w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-coral dark:focus:ring-coral text-sm';
const labelCls = 'block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide mb-1.5';
const cardCls =
  'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-5 space-y-4';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'draft'>('all');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Educational & CBC Books',
    taxonomy_category: 'educational-cbc-books',
    taxonomy_group: 'CBC Junior Secondary',
    taxonomy_item: 'Grade 8 coursebooks',
    unit_price: '',
    min_order_quantity: '1',
    available_stock: '10',
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
    institution_categories: ['School', 'Parent', 'Student'] as string[],
    grade_levels: [10, 11] as number[],
    curriculum: '' as number | '',
    subjects: [] as number[],
    selected_subjects: ['Mathematics'] as string[],
    selected_badges: ['new'] as string[],
  });

  const [taxonomySearch, setTaxonomySearch] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([
    { id: 0, label: 'Default', size: 'Standard', color: '', stock_quantity: '10', price_override: '' },
  ]);
  const nextVariantId = useRef(1);

  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [gradesAll, setGradesAll] = useState<BackendGrade[]>(DEFAULT_CBC_GRADES);

  // Fetch products and categories on mount
  const fetchProducts = useCallback(async () => {
    try {
      const data = await distributorApi.getProducts();
      const list = Array.isArray(data) ? data : data.results || [];
      setProducts(list);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [prodRes, gradesRes, catRes] = await Promise.all([
          distributorApi.getProducts().catch(() => []),
          distributorApi.getGrades().catch(() => []),
          distributorApi.getCategories().catch(() => []),
        ]);
        if (!active) return;
        const list = Array.isArray(prodRes) ? prodRes : prodRes.results || [];
        setProducts(list);
        const gradeList = Array.isArray(gradesRes) ? gradesRes : gradesRes.results || [];
        if (gradeList.length > 0) setGradesAll(gradeList);
        const catList = Array.isArray(catRes) ? catRes : (catRes as { results?: CategoryOption[] })?.results || [];
        if (catList.length > 0) setCategories(catList);
      } catch (err) {
        console.error('Failed to load catalog data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const gradeMap = useMemo(() => {
    const map = new Map<number, BackendGrade>();
    gradesAll.forEach((g) => map.set(g.id, g));
    return map;
  }, [gradesAll]);

  const allTaxonomyItems = useMemo(() => getFlatTaxonomy(), []);

  const filteredTaxonomyResults = useMemo(() => {
    if (!taxonomySearch.trim()) return [];
    const q = taxonomySearch.toLowerCase();
    return allTaxonomyItems.filter(
      (t) =>
        t.itemLabel.toLowerCase().includes(q) ||
        t.groupLabel.toLowerCase().includes(q) ||
        t.categoryLabel.toLowerCase().includes(q) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }, [taxonomySearch, allTaxonomyItems]);

  const activeNavCategory = useMemo(() => {
    return navigationData.find((c) => c.slug === formData.taxonomy_category) || navigationData[0];
  }, [formData.taxonomy_category]);

  // Taxonomy Item Selection Handler
  const handleSelectTaxonomyItem = (
    cat: NavCategory,
    group: NavGroup,
    item: NavLeaf
  ) => {
    setFormData((prev) => {
      const updatedGrades = item.defaultGrades
        ? Array.from(new Set([...prev.grade_levels, ...item.defaultGrades]))
        : prev.grade_levels;

      const currentTags = prev.tags
        ? prev.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const newTags = Array.from(new Set([...currentTags, ...(item.tags || []), item.label]));

      const updatedAudience = item.audience
        ? Array.from(new Set([...prev.institution_categories, ...item.audience]))
        : prev.institution_categories;

      return {
        ...prev,
        category: cat.label,
        taxonomy_category: cat.slug,
        taxonomy_group: group.label,
        taxonomy_item: item.label,
        grade_levels: updatedGrades,
        tags: newTags.join(', '),
        institution_categories: updatedAudience,
      };
    });
  };

  // Toggle Handlers
  const toggleAudience = (label: string) => {
    setFormData((prev) => {
      const exists = prev.institution_categories.includes(label);
      return {
        ...prev,
        institution_categories: exists
          ? prev.institution_categories.filter((c) => c !== label)
          : [...prev.institution_categories, label],
      };
    });
  };

  const toggleGrade = (id: number) => {
    setFormData((prev) => {
      const exists = prev.grade_levels.includes(id);
      return {
        ...prev,
        grade_levels: exists ? prev.grade_levels.filter((g) => g !== id) : [...prev.grade_levels, id],
      };
    });
  };

  const toggleGradeStage = (stageKey: string) => {
    const stageGrades = gradesAll.filter((g) => g.stage === stageKey).map((g) => g.id);
    setFormData((prev) => {
      const allSelected = stageGrades.every((id) => prev.grade_levels.includes(id));
      return {
        ...prev,
        grade_levels: allSelected
          ? prev.grade_levels.filter((id) => !stageGrades.includes(id))
          : Array.from(new Set([...prev.grade_levels, ...stageGrades])),
      };
    });
  };

  const toggleSubject = (subjectName: string) => {
    setFormData((prev) => {
      const exists = prev.selected_subjects.includes(subjectName);
      return {
        ...prev,
        selected_subjects: exists
          ? prev.selected_subjects.filter((s) => s !== subjectName)
          : [...prev.selected_subjects, subjectName],
      };
    });
  };

  const toggleBadge = (badgeId: string) => {
    setFormData((prev) => {
      const exists = prev.selected_badges.includes(badgeId);
      return {
        ...prev,
        selected_badges: exists
          ? prev.selected_badges.filter((b) => b !== badgeId)
          : [...prev.selected_badges, badgeId],
      };
    });
  };

  const selectPublisher = (pubName: string) => {
    setFormData((prev) => ({
      ...prev,
      brand: prev.brand === pubName ? '' : pubName,
    }));
  };

  const tagList = useMemo(() => {
    return formData.tags
      ? formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
  }, [formData.tags]);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tagList.includes(t)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...tagList, t].join(', '),
      }));
    }
  };

  const removeTag = (t: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: tagList.filter((x) => x !== t).join(', '),
    }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value;
      if (val) {
        addTag(val);
        (e.target as HTMLInputElement).value = '';
      }
    }
  };

  // Variants handlers
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { id: nextVariantId.current++, label: '', size: '', color: '', stock_quantity: '0', price_override: '' },
    ]);
  };
  const removeVariant = (id: number) => {
    setVariants((prev) => (prev.length > 1 ? prev.filter((v) => v.id !== id) : prev));
  };
  const updateVariant = (id: number, field: keyof VariantRow, value: string) => {
    setVariants((prev) => prev.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setImages(files);
      setImagePreviewUrl(URL.createObjectURL(files[0]));
    }
    e.target.value = '';
  };

  const removeExistingImage = (id: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Dynamic status toggle in product list table
  const toggleActive = async (product: Product) => {
    const newActive = !product.is_active;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: newActive } : p))
    );
    try {
      await distributorApi.updateProduct(product.id.toString(), { is_active: newActive });
      setMessage(`"${product.name}" is now ${newActive ? 'Published (Live on /shop)' : 'Draft (Hidden)'}`);
      setMessageType('success');
    } catch (error) {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: product.is_active } : p))
      );
      console.error('Failed to update status:', error);
      setMessage('Failed to update product publish status');
      setMessageType('error');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: 'Educational & CBC Books',
      taxonomy_category: 'educational-cbc-books',
      taxonomy_group: 'CBC Junior Secondary',
      taxonomy_item: 'Grade 8 coursebooks',
      unit_price: '',
      min_order_quantity: '1',
      available_stock: '10',
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
      institution_categories: ['School', 'Parent', 'Student'],
      grade_levels: [10, 11],
      curriculum: '',
      subjects: [],
      selected_subjects: ['Mathematics'],
      selected_badges: ['new'],
    });
    setTaxonomySearch('');
    setImages([]);
    setExistingImages([]);
    setImagePreviewUrl(null);
    setVariants([
      { id: 0, label: 'Default', size: 'Standard', color: '', stock_quantity: '10', price_override: '' },
    ]);
    nextVariantId.current = 1;
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);

    const productTags = product.tags || [];
    const matchedSubjects = CBC_SUBJECTS.filter((s) =>
      productTags.some(
        (t) =>
          t.toLowerCase() === s.toLowerCase() ||
          t.toLowerCase().includes(s.toLowerCase().split(' ')[0])
      )
    );

    const matchedBadges = SHOP_TAG_BADGES.map((b) => b.id).filter((badgeId) =>
      productTags.some((t) => {
        const tl = t.toLowerCase();
        if (badgeId === 'kicd' && (tl === 'kicd' || tl.includes('kicd'))) return true;
        if (badgeId === 'bestseller' && (tl === 'bestseller' || tl.includes('bestseller'))) return true;
        if (badgeId === 'new' && (tl === 'new' || tl.includes('new syllabus'))) return true;
        if (badgeId === 'set' && (tl === 'set' || tl.includes('set book'))) return true;
        if (badgeId === 'stem' && (tl.includes('stem') || tl.includes('science'))) return true;
        if (badgeId === 'lab' && (tl.includes('lab') || tl.includes('laboratory'))) return true;
        return tl === badgeId;
      })
    );

    const attr = (product.attributes || {}) as Record<string, unknown>;

    // Check if category matches one of our taxonomy items
    const catName = String(product.category_name || product.category || '');
    const matchedTaxonomy = allTaxonomyItems.find(
      (t) =>
        t.itemLabel.toLowerCase() === catName.toLowerCase() ||
        productTags.some((tag) => tag.toLowerCase() === t.itemLabel.toLowerCase())
    );

    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: matchedTaxonomy?.categoryLabel || catName || 'Educational & CBC Books',
      taxonomy_category: matchedTaxonomy?.categorySlug || 'educational-cbc-books',
      taxonomy_group: matchedTaxonomy?.groupLabel || '',
      taxonomy_item: matchedTaxonomy?.itemLabel || '',
      unit_price: product.unit_price || '',
      min_order_quantity: product.min_order_quantity?.toString() || '1',
      available_stock: product.available_stock?.toString() || '0',
      tags: product.tags?.join(', ') || '',
      attributes: JSON.stringify(product.attributes || {}, null, 2),
      bulk_pricing: JSON.stringify(product.bulk_pricing || [], null, 2),
      is_active: product.is_active !== false,
      sku: product.sku || (attr.sku as string) || '',
      brand: product.brand || (attr.brand as string) || '',
      product_type: product.product_type || 'physical',
      cost_price: product.cost_price != null ? String(product.cost_price) : '',
      low_stock_threshold: product.low_stock_threshold?.toString() || '0',
      backorders: product.backorders || false,
      shipping_weight: product.shipping_weight != null ? String(product.shipping_weight) : '',
      shipping_length: product.shipping_length != null ? String(product.shipping_length) : '',
      shipping_width: product.shipping_width != null ? String(product.shipping_width) : '',
      shipping_height: product.shipping_height != null ? String(product.shipping_height) : '',
      institution_categories:
        product.institution_categories || (attr.institution_categories as string[]) || [],
      grade_levels:
        product.applicable_levels || (attr.applicable_levels as number[]) || [],
      curriculum: '' as number | '',
      subjects: product.learning_areas || [],
      selected_subjects: matchedSubjects,
      selected_badges: matchedBadges,
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
        }))
      );
      nextVariantId.current = Math.max(0, ...product.variants.map((v) => v.id ?? 0)) + 1;
    } else {
      setVariants([
        { id: 0, label: 'Default', size: 'Standard', color: '', stock_quantity: '10', price_override: '' },
      ]);
      nextVariantId.current = 1;
    }

    setImages([]);
    setExistingImages(product.images || []);
    setImagePreviewUrl(product.image_url || product.image || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!formData.name.trim() || !formData.unit_price) {
      alert('Product name and selling price are required.');
      return;
    }

    setSaving(true);
    try {
      // Consolidate all tags (CBC subjects, tag badges, brand, custom tags, taxonomy items)
      const combinedTags = new Set<string>();
      tagList.forEach((t) => combinedTags.add(t));
      formData.selected_subjects.forEach((s) => combinedTags.add(s));
      formData.selected_badges.forEach((b) => {
        if (b === 'kicd') {
          combinedTags.add('kicd');
          combinedTags.add('KICD Approved');
        } else if (b === 'bestseller') {
          combinedTags.add('bestseller');
          combinedTags.add('Bestseller');
        } else if (b === 'new') {
          combinedTags.add('new');
          combinedTags.add('New Syllabus');
          combinedTags.add('Textbook');
        } else if (b === 'set') {
          combinedTags.add('set');
          combinedTags.add('Set Books');
          combinedTags.add('Textbook');
        } else if (b === 'stem') {
          combinedTags.add('STEM');
          combinedTags.add('Science');
        } else if (b === 'lab') {
          combinedTags.add('Laboratory');
          combinedTags.add('Lab');
        } else {
          combinedTags.add(b);
        }
      });
      if (formData.brand) {
        combinedTags.add(formData.brand);
      }
      if (formData.taxonomy_item) {
        combinedTags.add(formData.taxonomy_item);
      }
      if (formData.taxonomy_group) {
        combinedTags.add(formData.taxonomy_group);
      }

      let parsedAttributes: Record<string, unknown> = {};
      try {
        parsedAttributes = JSON.parse(formData.attributes || '{}');
      } catch {
        parsedAttributes = {};
      }

      let parsedBulkPricing = [];
      try {
        parsedBulkPricing = JSON.parse(formData.bulk_pricing || '[]');
      } catch {
        parsedBulkPricing = [];
      }

      const attributesPayload = {
        ...parsedAttributes,
        brand: formData.brand || undefined,
        sku: formData.sku || undefined,
        taxonomy_category: formData.taxonomy_category,
        taxonomy_group: formData.taxonomy_group,
        taxonomy_item: formData.taxonomy_item,
        taxonomy_path: `${formData.category} › ${formData.taxonomy_group} › ${formData.taxonomy_item}`,
        applicable_levels: formData.grade_levels,
        institution_categories: formData.institution_categories,
        subjects: formData.selected_subjects,
        tag_badges: formData.selected_badges,
        product_type: formData.product_type,
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

      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        category: formData.taxonomy_item || formData.category || 'Educational & CBC Books',
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
        institution_categories: formData.institution_categories,
        tags: Array.from(combinedTags),
        attributes: attributesPayload,
        bulk_pricing: parsedBulkPricing,
        variants: attributesPayload.variants,
      };

      let saved: Product;
      if (editingProduct) {
        await distributorApi.updateProduct(editingProduct.id.toString(), payload);
        saved = { ...editingProduct, ...payload } as unknown as Product;
      } else {
        saved = await distributorApi.createProduct(payload);
      }

      if (images.length > 0 && saved?.id) {
        try {
          await distributorApi.uploadProductImages(saved.id, images);
        } catch {
          console.warn('Product saved but image upload endpoint returned error.');
        }
      }

      setMessage(
        editingProduct
          ? `Product "${formData.name}" updated successfully (${formData.is_active ? 'Published' : 'Draft'})`
          : `Product "${formData.name}" created successfully (${formData.is_active ? 'Published on /shop' : 'Saved as Draft'})`
      );
      setMessageType('success');
      setShowForm(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to save product');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await distributorApi.deleteProduct(id);
      setMessage(`Product "${name}" deleted`);
      setMessageType('success');
      setProducts((prev) => prev.filter((p) => p.id.toString() !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to delete product');
      setMessageType('error');
    }
  };

  // Filter products for the table
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusTab === 'published' && !p.is_active) return false;
      if (statusTab === 'draft' && p.is_active) return false;
      if (categoryFilter && String(p.category) !== categoryFilter && p.category_name !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = (p.brand || '').toLowerCase().includes(q);
        const matchesTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchesSku = (p.sku || '').toLowerCase().includes(q);
        return matchesName || matchesBrand || matchesTags || matchesSku;
      }
      return true;
    });
  }, [products, statusTab, categoryFilter, searchQuery]);

  const publishedCount = useMemo(() => products.filter((p) => p.is_active).length, [products]);
  const draftCount = useMemo(() => products.filter((p) => !p.is_active).length, [products]);

  // Derive preview label for grades
  const previewGradeLabel = useMemo(() => {
    const names = formData.grade_levels.map((id) => gradeMap.get(id)?.name).filter(Boolean);
    if (names.length === 0) return null;
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} +${names.length - 2}`;
  }, [formData.grade_levels, gradeMap]);

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500 text-lg">
        Loading product catalog...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            messageType === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
          }`}
        >
          <span className="font-medium text-sm">{message}</span>
          <button
            onClick={() => setMessage('')}
            className="text-xs opacity-70 hover:opacity-100 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Publish products mapped to Educational &amp; CBC Books, Stationery, Reference &amp; Atlases, Arts, Toys, and School Gear on{' '}
            <Link href="/shop" className="text-coral hover:underline font-semibold" target="_blank">
              /shop ↗
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/shop"
            target="_blank"
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
          >
            Preview /shop ↗
          </Link>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 text-sm font-bold text-white bg-coral hover:bg-orange-600 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setStatusTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusTab === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStatusTab('published')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusTab === 'published'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600'
              }`}
            >
              Published ({publishedCount})
            </button>
            <button
              onClick={() => setStatusTab('draft')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusTab === 'draft'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Drafts ({draftCount})
            </button>
          </div>

          <div className="flex flex-1 md:max-w-md items-center gap-2">
            <input
              type="text"
              placeholder="Search by name, brand, subject, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputCls}
            />
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Product Add / Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border-2 border-coral/40 dark:border-coral/50 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>{editingProduct ? 'Edit Product' : 'Add Product to Store'}</span>
                {formData.is_active ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Will Publish to /shop
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Saved as Draft
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Every field mapped here directly powers customer browsing on /shop (categories, CBC levels, subjects, publishers, and badges).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-lg p-1"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Input Columns (Left 2 cols) */}
              <div className="lg:col-span-2 space-y-6">

                {/* 1. Basic Information */}
                <section className={cardCls}>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">1</span>
                    Basic Product Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Product Title *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Moran Primary Mathematics Learner's Book Grade 8 / Oxford Advanced Learner's Dictionary"
                        required
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>SKU / Catalog No.</label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="e.g. LP-BK-008"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Product Type *</label>
                      <select
                        value={formData.product_type}
                        onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                        className={inputCls}
                      >
                        <option value="physical">Physical Item (Book / Stationery / Gear)</option>
                        <option value="digital">Digital Download / E-Book</option>
                        <option value="service">Educational Service / Workshop</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Product Description</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detailed course description, topics covered, author, ISBN, and learning outcomes..."
                        className={inputCls}
                      />
                    </div>
                  </div>
                </section>

                {/* 2. Store Classification & Taxonomy Hierarchy (Directly reflecting /shop) */}
                <section className={cardCls}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">2</span>
                      Storefront Category &amp; Classification
                    </h3>
                    <span className="text-[11px] text-zinc-400">Directly maps to /shop navigation dropdowns</span>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Select the department and exact classification for your product. Selecting an item automatically sets the category, recommended CBC grades, tags, and audience.
                  </p>

                  {/* Active Selection Banner */}
                  {formData.taxonomy_item ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                        <span className="font-bold text-sm">✓ Selected:</span>
                        <span className="font-semibold bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {navigationData.find((c) => c.slug === formData.taxonomy_category)?.label || formData.category}
                          {formData.taxonomy_group && ` › ${formData.taxonomy_group}`}
                          {` › ${formData.taxonomy_item}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, taxonomy_item: '', taxonomy_group: '' }))}
                        className="text-xs text-emerald-700 dark:text-emerald-300 font-bold hover:underline"
                      >
                        Clear / Change
                      </button>
                    </div>
                  ) : null}

                  {/* Search taxonomy */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 Quick search taxonomy (e.g. dictionaries, atlases, grade 8, pens, math sets, project kits, flashcards)..."
                      value={taxonomySearch}
                      onChange={(e) => setTaxonomySearch(e.target.value)}
                      className={inputCls}
                    />
                    {filteredTaxonomyResults.length > 0 && (
                      <div className="mt-2 p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg max-h-48 overflow-y-auto space-y-1">
                        <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider px-2 py-0.5">Matching Classifications:</div>
                        {filteredTaxonomyResults.map((res) => (
                          <button
                            key={res.fullPath}
                            type="button"
                            onClick={() => {
                              const cat = navigationData.find((c) => c.slug === res.categorySlug);
                              const grp = cat?.groups.find((g) => g.label === res.groupLabel);
                              const itm = grp?.items.find((i) => i.label === res.itemLabel);
                              if (cat && grp && itm) {
                                handleSelectTaxonomyItem(cat, grp, itm);
                                setTaxonomySearch('');
                              }
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-coral/10 hover:text-coral transition flex items-center justify-between"
                          >
                            <span>
                              <span className="opacity-60">{res.categoryLabel} › {res.groupLabel} ›</span>{' '}
                              <strong className="text-zinc-900 dark:text-zinc-100">{res.itemLabel}</strong>
                            </span>
                            <span className="text-[11px] text-coral font-bold">+ Select</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Department Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                    {navigationData.map((cat) => {
                      const isSelectedCat = formData.taxonomy_category === cat.slug;
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              taxonomy_category: cat.slug,
                              category: cat.label,
                            }));
                          }}
                          className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                            isSelectedCat
                              ? 'bg-coral text-white border-coral shadow-sm'
                              : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-coral'
                          }`}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <span className="text-[11px] font-bold leading-tight line-clamp-2">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Department Groups & Items Browser */}
                  {activeNavCategory && (
                    <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          {activeNavCategory.icon} {activeNavCategory.label} Subgroups &amp; Classifications
                        </span>
                      </div>

                      <div className="space-y-3">
                        {activeNavCategory.groups.map((group) => (
                          <div key={group.label} className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <span className="text-xs font-bold text-coral block mb-2">{group.label}</span>
                            <div className="flex flex-wrap gap-2">
                              {group.items.map((item) => {
                                const isSelected = formData.taxonomy_item === item.label;
                                return (
                                  <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => handleSelectTaxonomyItem(activeNavCategory, group, item)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                      isSelected
                                        ? 'bg-coral text-white border-coral shadow-sm'
                                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-coral'
                                    }`}
                                  >
                                    {item.label} {isSelected && '✓'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* 3. Publisher / Brand (Reflecting /shop publisher filter) */}
                <section className={cardCls}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">3</span>
                      Publisher / Brand
                    </h3>
                    <span className="text-[11px] text-zinc-400">Reflects in /shop publisher filter</span>
                  </div>
                  <div>
                    <label className={labelCls}>Quick-select Top Publisher</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {KENYAN_PUBLISHERS.map((pub) => {
                        const active = formData.brand.trim().toLowerCase() === pub.toLowerCase();
                        return (
                          <button
                            key={pub}
                            type="button"
                            onClick={() => selectPublisher(pub)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                              active
                                ? 'bg-coral text-white border-coral shadow-sm'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-coral'
                            }`}
                          >
                            {pub} {active && '✓'}
                          </button>
                        );
                      })}
                    </div>
                    <label className={labelCls}>Custom Brand / Publisher</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. KLB, Oxford, Moran, Longhorn, Storymoja..."
                      className={inputCls}
                    />
                  </div>
                </section>

                {/* 4. Target Audience (Reflecting /shop Target Audience filter) */}
                <section className={cardCls}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">4</span>
                      Target Audience
                    </h3>
                    <span className="text-[11px] text-zinc-400">Reflects in /shop audience selector</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {AUDIENCE_OPTIONS.map((aud) => {
                      const active = formData.institution_categories.some(
                        (c) => c.toLowerCase().includes(aud.id) || c.toLowerCase().includes(aud.label.toLowerCase())
                      );
                      return (
                        <button
                          key={aud.id}
                          type="button"
                          onClick={() => toggleAudience(aud.label)}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                            active
                              ? 'bg-coral/5 border-coral dark:bg-coral/10 text-coral shadow-sm'
                              : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-coral'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-lg">{aud.icon}</span>
                            <span className={`text-xs font-bold ${active ? 'text-coral' : 'text-zinc-400'}`}>
                              {active ? 'Selected ✓' : '+ Add'}
                            </span>
                          </div>
                          <span className="font-bold text-sm block">{aud.label}</span>
                          <span className="text-[11px] opacity-75">{aud.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 5. Grade & Level (Reflecting /shop Grade filter) */}
                <section className={cardCls}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">5</span>
                      Grade &amp; Educational Level
                    </h3>
                    <span className="text-[11px] text-zinc-400">Reflects in /shop grade checklist</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Select all CBC grades this product applies to. Customers filter by these grades on /shop.
                  </p>

                  <div className="space-y-4 pt-1">
                    {GRADE_STAGES.map((stage) => {
                      const stageGrades = gradesAll.filter((g) => g.stage === stage.key);
                      if (stageGrades.length === 0) return null;
                      const allSelected = stageGrades.every((g) => formData.grade_levels.includes(g.id));

                      return (
                        <div key={stage.key} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wide">
                              {stage.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleGradeStage(stage.key)}
                              className="text-[11px] font-semibold text-coral hover:underline"
                            >
                              {allSelected ? 'Deselect stage' : 'Select all stage'}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {stageGrades.map((g) => {
                              const checked = formData.grade_levels.includes(g.id);
                              return (
                                <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => toggleGrade(g.id)}
                                  className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                                    checked
                                      ? 'bg-coral text-white border-coral shadow-sm'
                                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-coral'
                                  }`}
                                >
                                  {g.name} {checked && '✓'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 6. CBC Subjects (Reflecting /shop Subject filter) */}
                <section className={cardCls}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">6</span>
                      CBC Subjects / Learning Areas
                    </h3>
                    <span className="text-[11px] text-zinc-400">Reflects in /shop subject filter</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Click subjects to tag this product. Selecting a subject ensures the product matches CBC subject filters on the storefront.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {CBC_SUBJECTS.map((subj) => {
                      const active = formData.selected_subjects.includes(subj);
                      return (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => toggleSubject(subj)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                            active
                              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm'
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                          }`}
                        >
                          {subj} {active && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 7. Tag Badges (Reflecting /shop badges: KICD, Bestseller, etc.) */}
                <section className={cardCls}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">7</span>
                      Tag Badges &amp; Highlights
                    </h3>
                    <span className="text-[11px] text-zinc-400">Reflects in /shop badge tags</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SHOP_TAG_BADGES.map((b) => {
                      const active = formData.selected_badges.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggleBadge(b.id)}
                          className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition ${
                            active
                              ? 'bg-coral/10 border-coral text-zinc-900 dark:text-zinc-100 shadow-sm'
                              : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-coral'
                          }`}
                        >
                          <span className="text-base flex-none">{b.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs block">{b.label}</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block truncate">{b.desc}</span>
                          </div>
                          <span className={`text-xs font-bold ${active ? 'text-coral' : 'text-zinc-400'}`}>
                            {active ? '✓' : '+'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom manual tags */}
                  <div className="pt-2">
                    <label className={labelCls}>Additional Search Keywords / Custom Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tagList.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => removeTag(t)}
                            className="hover:text-red-500 font-bold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Type a tag and press Enter or comma..."
                      onKeyDown={handleTagInput}
                      className={inputCls}
                    />
                  </div>
                </section>

                {/* 8. Pricing & Stock */}
                <section className={cardCls}>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">8</span>
                    Pricing &amp; Inventory
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Selling Price (KSh) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        placeholder="e.g. 750"
                        className={inputCls}
                      />
                      <span className="text-[11px] text-zinc-500 mt-0.5 block">Customer price on /shop</span>
                    </div>
                    <div>
                      <label className={labelCls}>Cost Price (KSh)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                        placeholder="e.g. 550"
                        className={inputCls}
                      />
                      <span className="text-[11px] text-zinc-500 mt-0.5 block">Your supply cost</span>
                    </div>
                    <div>
                      <label className={labelCls}>Available Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.available_stock}
                        onChange={(e) => setFormData({ ...formData, available_stock: e.target.value })}
                        className={inputCls}
                      />
                      <span className="text-[11px] text-zinc-500 mt-0.5 block">Inventory count</span>
                    </div>
                  </div>
                </section>

                {/* 9. Product Variants */}
                <section className={cardCls}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">9</span>
                      Product Variants
                    </h3>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="text-xs font-bold text-coral hover:underline"
                    >
                      + Add Variant
                    </button>
                  </div>
                  <div className="space-y-2">
                    {variants.map((v) => (
                      <div
                        key={v.id}
                        className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Variant Label (e.g. Paperback, Hardcover)"
                            value={v.label}
                            onChange={(e) => updateVariant(v.id, 'label', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Size / Edition"
                            value={v.size}
                            onChange={(e) => updateVariant(v.id, 'size', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Stock"
                            min="0"
                            value={v.stock_quantity}
                            onChange={(e) => updateVariant(v.id, 'stock_quantity', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="Price override"
                            min="0"
                            value={v.price_override}
                            onChange={(e) => updateVariant(v.id, 'price_override', e.target.value)}
                            className={inputCls}
                          />
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(v.id)}
                              className="text-red-500 hover:text-red-700 text-sm p-1 font-bold"
                              title="Delete variant"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 10. Product Images */}
                <section className={cardCls}>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">10</span>
                    Product Images
                  </h3>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImages}
                      className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-coral file:text-white hover:file:bg-orange-600 cursor-pointer"
                    />
                    {imagePreviewUrl && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-none bg-white">
                          <img
                            src={imagePreviewUrl}
                            alt="Preview"
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <span className="text-xs text-zinc-500">Main image preview</span>
                      </div>
                    )}
                    {existingImages.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {existingImages.map((img) => (
                          <div
                            key={img.id}
                            className="relative aspect-square rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700"
                          >
                            <img
                              src={img.image_url || '/placeholder.png'}
                              alt={img.alt || 'product image'}
                              className="object-contain w-full h-full p-1"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(img.id)}
                              className="absolute top-1 right-1 text-[10px] px-1 py-0.5 rounded bg-red-800 text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* 11. Publishing Status Toggle */}
                <section className={cardCls}>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold">11</span>
                    Storefront Visibility
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label
                      className={`flex-1 p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                        formData.is_active
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200'
                          : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="publish_status"
                        checked={formData.is_active}
                        onChange={() => setFormData({ ...formData, is_active: true })}
                        className="accent-coral"
                      />
                      <div>
                        <span className="font-bold text-sm block">🟢 Published (Live on /shop)</span>
                        <span className="text-xs opacity-75">Immediately searchable &amp; purchasable by customers</span>
                      </div>
                    </label>

                    <label
                      className={`flex-1 p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                        !formData.is_active
                          ? 'bg-zinc-100 border-zinc-400 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200'
                          : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="publish_status"
                        checked={!formData.is_active}
                        onChange={() => setFormData({ ...formData, is_active: false })}
                        className="accent-coral"
                      />
                      <div>
                        <span className="font-bold text-sm block">⚪ Draft (Hidden from /shop)</span>
                        <span className="text-xs opacity-75">Saved to distributor dashboard but hidden from public store</span>
                      </div>
                    </label>
                  </div>
                </section>
              </div>

              {/* Right Column: Live /shop Card Preview */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-4">
                  <div className="bg-zinc-100 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide block">
                        Live /shop Card Preview
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Dynamic view as rendered on the storefront
                      </span>
                    </div>
                    {formData.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live on /shop
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        Draft (Hidden)
                      </span>
                    )}
                  </div>

                  {/* Mock /shop Product Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-md flex flex-col">
                    {/* Image Area */}
                    <div className="relative aspect-square bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-center p-4">
                      {formData.selected_badges.includes('new') && (
                        <span className="absolute top-2.5 left-2.5 z-10 bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow">
                          New Syllabus
                        </span>
                      )}
                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-zinc-400 text-xs flex flex-col items-center gap-1">
                          <span className="text-2xl">📖</span>
                          <span>Product Image</span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 space-y-2 flex-1 flex flex-col">
                      <div className="text-[11px] font-bold text-coral uppercase tracking-wider">
                        {formData.taxonomy_item || formData.category || 'Educational Books'}
                      </div>
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                        {formData.name || 'Sample Product Title'}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        {previewGradeLabel && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-coral/10 text-coral text-[11px] font-semibold border border-coral/20">
                            {previewGradeLabel}
                          </span>
                        )}
                        {formData.brand && (
                          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                            {formData.brand}
                          </span>
                        )}
                      </div>
                      <div className="text-base font-extrabold text-coral pt-1">
                        KSh {parseFloat(formData.unit_price || '0').toLocaleString()}
                      </div>

                      <div className="space-y-1.5 pt-2 mt-auto">
                        <button
                          type="button"
                          className="w-full py-1.5 rounded-md bg-coral text-white text-xs font-bold shadow-sm"
                        >
                          Add to Cart
                        </button>
                        <button
                          type="button"
                          className="w-full py-1.5 rounded-md bg-[#25d366] text-white text-xs font-bold shadow-sm"
                        >
                          Buy via WhatsApp
                        </button>
                      </div>
                    </div>

                    {/* Tags at bottom */}
                    <div className="px-3.5 pb-3 flex flex-wrap gap-1">
                      {formData.selected_badges.includes('set') && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Set Books
                        </span>
                      )}
                      {formData.selected_badges.includes('kicd') && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                          KICD Approved
                        </span>
                      )}
                      {formData.selected_badges.includes('bestseller') && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          Bestseller
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary Checklist */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wide block mb-1">
                      /shop Filter Visibility Check
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Classification:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                        {formData.taxonomy_item || formData.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Audience:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formData.institution_categories.length ? formData.institution_categories.join(', ') : 'All'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Grades Selected:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formData.grade_levels.length} grade(s)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Subjects Selected:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formData.selected_subjects.length ? formData.selected_subjects.join(', ') : 'None'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Publisher:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formData.brand || 'Unspecified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Badges Active:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formData.selected_badges.length ? formData.selected_badges.join(', ') : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-sm font-bold text-white bg-coral hover:bg-orange-600 disabled:opacity-50 rounded-lg shadow transition flex items-center gap-2"
              >
                {saving && <span className="animate-spin">⏳</span>}
                <span>
                  {editingProduct
                    ? formData.is_active
                      ? 'Update & Publish to /shop'
                      : 'Update Draft'
                    : formData.is_active
                    ? 'Publish Product to /shop'
                    : 'Save as Draft'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-3">
            <span className="text-3xl block">📦</span>
            <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">No products found</p>
            <p className="text-xs text-zinc-400">
              {searchQuery || categoryFilter || statusTab !== 'all'
                ? 'Try clearing your search or filter criteria.'
                : 'Get started by creating your first product to publish to /shop.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-left text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category / Classification</th>
                  <th className="py-3 px-4">Publisher / Brand</th>
                  <th className="py-3 px-4">Grades / Levels</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-center">Store Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredProducts.map((product) => {
                  const gradesList = (product.applicable_levels || [])
                    .map((id) => gradeMap.get(id)?.name)
                    .filter(Boolean);

                  return (
                    <tr key={product.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition">
                      {/* Product Name & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex-none flex items-center justify-center">
                            {product.image_url || product.image ? (
                              <img
                                src={product.image_url || product.image || ''}
                                alt={product.name}
                                className="w-full h-full object-contain p-0.5"
                              />
                            ) : (
                              <span className="text-xs">📖</span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                              {product.name}
                            </span>
                            {product.sku && (
                              <span className="text-xs text-zinc-400 font-mono">
                                SKU: {product.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {product.category_name || product.category || 'General'}
                      </td>

                      {/* Publisher / Brand */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {product.brand || 'Unbranded'}
                        </span>
                      </td>

                      {/* Grades */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {gradesList.slice(0, 2).map((g) => (
                            <span
                              key={g}
                              className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-semibold bg-coral/10 text-coral border border-coral/20"
                            >
                              {g}
                            </span>
                          ))}
                          {gradesList.length > 2 && (
                            <span className="text-[10px] text-zinc-400 font-medium">
                              +{gradesList.length - 2} more
                            </span>
                          )}
                          {gradesList.length === 0 && <span className="text-xs text-zinc-400">All levels</span>}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-coral">
                          KSh {parseFloat(product.unit_price || '0').toLocaleString()}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold text-xs ${
                            product.available_stock > 5
                              ? 'text-zinc-900 dark:text-zinc-100'
                              : 'text-amber-600'
                          }`}
                        >
                          {product.available_stock} in stock
                        </span>
                      </td>

                      {/* Store Status (Dynamic Toggle) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleActive(product)}
                          title="Click to instantly toggle Published/Draft status on /shop"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-xs cursor-pointer ${
                            product.is_active
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              product.is_active ? 'bg-emerald-500' : 'bg-zinc-400'
                            }`}
                          />
                          <span>{product.is_active ? 'Published ✓' : 'Draft ✕'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/shop/${product.id}`}
                            target="_blank"
                            className="text-xs text-zinc-500 hover:text-coral transition font-medium"
                            title="View on /shop"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="text-xs font-semibold text-navy dark:text-zinc-200 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id.toString(), product.name)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
