import { getFlatTaxonomy, navigationData } from '@/lib/shopCategories';
import { ProductMapping, ShelfSection, StorefrontProduct } from '@/lib/types/storefront';

// First-pass department resolution by catalog category_name, so products land
// in a sensible aisle (mirrors how /shop buckets products) even when tags are
// sparse. The tag pass below then refines anything left over.
const CATEGORY_DEPARTMENT: Array<{ match: RegExp; slug: string }> = [
  { match: /stationery/i, slug: 'school-supplies-stationery' },
  { match: /uniform/i, slug: 'educational-cbc-books' },
  { match: /bag|accessor/i, slug: 'bags-school-gear' },
  { match: /reference|atlas|dictionary|encyclopedia/i, slug: 'reference-books-atlases' },
  { match: /exercise|textbook|coursebook|learner/i, slug: 'educational-cbc-books' },
  { match: /^books$/i, slug: 'educational-cbc-books' },
];

// Tag-based department resolution for learning-materials products that don't
// name a department in their category (e.g. Science/Lab/STEM kits → Practical
// Learning; textbooks → Educational Books).
const TAG_DEPARTMENT: Array<{ match: RegExp; slug: string }> = [
  { match: /science|chemistry|physics|biology|laboratory|lab\b|stem|experiment/i, slug: 'art-craft-practical' },
  { match: /textbook|coursebook|learner/i, slug: 'educational-cbc-books' },
];

export function matchProductDepartment(product: StorefrontProduct): string | null {
  const catLower = (product.category_name || '').toLowerCase();

  for (const { match, slug } of CATEGORY_DEPARTMENT) {
    if (match.test(catLower) && navigationData.some((n) => n.slug === slug)) return slug;
  }

  const tagNames = (product.tags || []).map((t) => (t?.name || '').toLowerCase());
  for (const { match, slug } of TAG_DEPARTMENT) {
    if (tagNames.some((t) => match.test(t)) && navigationData.some((n) => n.slug === slug)) return slug;
  }

  const leaves = getFlatTaxonomy();
  const pTags = (product.tags || []).map((t) => (t?.name || '').toLowerCase());
  const pName = (product.name || '').toLowerCase();
  const pCat = (product.category_name || '').toLowerCase();
  for (const leaf of leaves) {
    const tagsLower = (leaf.tags || []).map((t) => t.toLowerCase());
    if (tagsLower.some((t) => pTags.some((pt) => pt.includes(t) || t.includes(pt)))) {
      return leaf.categorySlug;
    }
    const labelLower = leaf.itemLabel.toLowerCase();
    const groupLower = leaf.groupLabel.toLowerCase();
    const catLower = leaf.categoryLabel.toLowerCase();
    if (pName.includes(labelLower) || pCat.includes(labelLower) || pCat.includes(groupLower) || pCat.includes(catLower)) {
      return leaf.categorySlug;
    }
    const keyWords = tagsLower.filter((w) => w.length >= 4);
    if (keyWords.some((kw) => pName.includes(kw) || pCat.includes(kw))) {
      return leaf.categorySlug;
    }
  }
  return null;
}

export function modelTypeFor(product: StorefrontProduct): string {
  const cat = (product.category_name || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const pTags = (product.tags || []).map((t) => (t?.name || '').toLowerCase());
  const txt = `${cat} ${name} ${pTags.join(' ')}`;
  if (cat.includes('bag') || /backpack/.test(txt)) return 'school_bag';
  if (cat.includes('uniform')) return 'uniform';
  if (cat.includes('calculator')) return 'calculator';
  if (cat.includes('pencil case') || cat.includes('pencil_case')) return 'pencil_case';
  if (cat.includes('pencil') || /pencil/i.test(name)) return 'pencil';
  if (cat.includes('pen') || /ballpoint|\bpen\b/.test(txt)) return 'pen';
  if (cat.includes('ruler')) return 'ruler';
  if (cat.includes('geometry') || cat.includes('mathematical set') || cat.includes('geometrical set')) return 'geometry_set';
  if (cat.includes('water')) return 'water_bottle';
  if (cat.includes('exercise') || cat.includes('learner') || txt.includes('exercise book')) return 'exercise_book';
  if (cat.includes('book') || txt.includes('textbook') || txt.includes('coursebook')) return 'textbook';
  return 'textbook';
}

export function synthesizeMappings(
  products: StorefrontProduct[],
  sections: ShelfSection[],
  backendMappings: ProductMapping[] = [],
): ProductMapping[] {
  const realIds = new Set(backendMappings.map((mapping) => mapping.product));
  const sectionBySlug: Record<string, ShelfSection> = {};
  for (const s of sections) {
    sectionBySlug[s.slug] = s;
    if (typeof s.id === 'number' && s.id < 0) {
      // navigation-derived section already present
    }
  }
  let id = 200000;
  const out: ProductMapping[] = [];
  for (const p of products) {
    if (!p.is_active) continue;
    if (realIds.has(p.id)) continue;
    const slug = matchProductDepartment(p) ?? navigationData[0]?.slug ?? null;
    const sec = slug ? sectionBySlug[slug] : null;
    if (!sec) continue;
    out.push({
      id: id++,
      product: p.id,
      product_name: p.name,
      variant: p.variants?.[0]?.id ?? null,
      model_key: p.sku || `product-${p.id}`,
      model_type: modelTypeFor(p),
      shelf_section: sec.id,
      shelf_section_name: sec.name,
      aisle: '',
      shelf_index: 0,
      position_x: '',
      effective_price: p.effective_price,
      stock_quantity: p.stock_quantity || 0,
      category_name: p.category_name || '',
      image_url: p.image_url || p.image || null,
      active: true,
    });
  }
  return out;
}

// Real backend model-mappings are stored against the backend's own shelf
// sections (e.g. "Textbooks"), which do not match the supermarket's navigation
// departments used by the CategoryPanel. This reassigns every active backend
// mapping onto a real supermarket department by re-resolving the product's
// department, so catalogue items appear on the correct department aisle and
// the side panel can jump to them. Backend mappings keep their richer
// model_type/image/stock data; products without a backend mapping fall back to
// synthesizeMappings (which already targets navigation departments).
export function normalizeMappings(
  mappings: ProductMapping[],
  sections: ShelfSection[],
  products: StorefrontProduct[],
): ProductMapping[] {
  const sectionBySlug = new Map(sections.map((s) => [s.slug, s]));
  const productById = new Map(products.map((p) => [p.id, p]));
  const out: ProductMapping[] = [];
  for (const m of mappings) {
    if (!m.active || m.shelf_section == null) continue;
    const product = productById.get(m.product);
    const slug = product ? matchProductDepartment(product) : null;
    const sec = slug ? sectionBySlug.get(slug) : null;
    if (!sec) continue;
    out.push({
      ...m,
      shelf_section: sec.id,
      shelf_section_name: sec.name,
      category_name: product?.category_name || m.category_name || '',
    });
  }
  return out;
}
