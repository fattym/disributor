// Aisle definitions, catalogue classification, shelf stocking, bundles and booklists.
// Everything here is pure (no React / three) so it can be reasoned about and tested on its own.
import { coverUrl, resolveImageUrl } from "../api.js";

export const kes = (n) => "KES " + Math.round(Number(n) || 0).toLocaleString("en-KE");

/** The eight aisles. `shape` picks the product silhouette used on the shelf. */
export const AISLES = [
  { id: 0, name: "Textbooks", long: "Textbooks & curriculum books", icon: "book-open", color: "#2563eb", shape: "book" },
  { id: 1, name: "Exercise & Writing", long: "Exercise books & writing materials", icon: "book", color: "#16a34a", shape: "notebook" },
  { id: 2, name: "Pens & Pencils", long: "Pens, pencils & stationery", icon: "pencil", color: "#ca8a04", shape: "pack" },
  { id: 3, name: "Maths & Geometry", long: "Mathematics & geometry sets", icon: "ruler", color: "#dc2626", shape: "tin" },
  { id: 4, name: "Art & Creative", long: "Art & creative materials", icon: "palette", color: "#9333ea", shape: "box" },
  { id: 5, name: "Bags & Accessories", long: "School bags & accessories", icon: "bag", color: "#0891b2", shape: "bag" },
  { id: 6, name: "Revision Books", long: "Revision & supplementary learning", icon: "file", color: "#ea580c", shape: "book" },
  { id: 7, name: "Bundles & Booklists", long: "School requirements & bundled booklists", icon: "gift", color: "#E63B00", shape: "bundle" },
];

export const SLOTS_PER_AISLE = 128; // 4 shelves x 32 facings
export const TILES_PER_AISLE = 64; // unique covers per aisle (8 x 8 atlas)

// ---------------------------------------------------------------- classification

const STATIONERY_CATS = /^(stationery|art|art, craft papers|cards & gifting)$/i;
const NOT_SHELVED = /e-?book\b|\bcable\b|bulb|speaker|webcam|light strip|flood light|keyboard|\bmouse\b/i;
const NOT_SCHOOL = /tissue paper|key safe|key holder|board cleaner|blackboard|whiteboard|desk tidy|magazine file|filing tray/i;
const RX = {
  bag: /(back ?pack|school bag|cross body bag|\bbags?\b|pencil case|lunch|water bottle|satchel)/i,
  maths: /maths set|math set|geometr|ruler|protractor|compass|calculator|tee square|set square|template|student set/i,
  pens: /\bpens?\b|pencil|eraser|sharpener|marker|highlighter|ballpt|uniball/i,
  art: /paint|acrylic|colou?r|crayon|drawing|sketch|water ?colou?r|pastel|brush|blotting/i,
  // "REVISED" marks a new edition of a normal textbook, so only match revision *material*.
  revision: /revision|\brev\b|kcpe|kcse|kjsea|mock|test papers|past papers|exam pack/i,
};

/** Returns an aisle index (0-6) or -1 when the item should not be shelved. */
export function classify(p) {
  const name = p.name || "";
  const cat = p.categoryName || "";
  if (NOT_SHELVED.test(name) || /^technology$/i.test(cat) || NOT_SCHOOL.test(name)) return -1;
  if (STATIONERY_CATS.test(cat)) {
    if (/exam pack/i.test(name)) return 6;
    if (RX.bag.test(name) && !/baggage/i.test(name)) return 5;
    if (RX.maths.test(name)) return 3;
    if (/paint|acrylic|crayon|drawing|sketch|water ?colou?r|pastel|brush|blotting|spray/i.test(name) || /^art/i.test(cat)) return 4;
    if (/colou?ring pencil|colou?r pencil/i.test(name)) return 4;
    if (RX.pens.test(name)) return 2;
    return 1;
  }
  if (RX.revision.test(name)) return 6;
  return 0;
}

const GRADE_WORDS = /\b(grade|gr|gd|std|standard|form|class|pp)\s?\.?\s?\d+|\b[gf]\s?\d{1,2}\b|\bkc(pe|se)|kjsea|cbc|lvl|level/i;
const SUBJECT_WORDS = /math|english|kiswahili|science|social|agricultur|cre\b|ire\b|history|geograph|biology|chemistry|physics|business|creative/i;

/** Raw API item -> the shape the whole 3D app uses. */
export function normalise(raw) {
  const v = raw.variants?.[0];
  const image = resolveImageUrl(raw.image_url || raw.cover_image || raw.image);
  const p = {
    id: raw.id,
    variantId: v?.id ?? null, // never fall back to the product id: the cart and orders need a real variant id
    unavailable: !v,
    name: raw.name || raw.title || "Product",
    brand: raw.brand || "Learning Pack",
    price: parseFloat(raw.effective_price ?? raw.price) || 0,
    image: image.endsWith("kids.png") ? "" : image,
    stock: v?.stock_quantity ?? 0,
    categoryName: raw.category_name || "",
  };
  p.cover = coverUrl(p.image);
  p.aisle = classify(p);
  p.rank = (GRADE_WORDS.test(p.name) ? 2 : 0) + (SUBJECT_WORDS.test(p.name) ? 1 : 0) + (p.image ? 3 : 0);
  return p;
}

/** "Grade 5", "Form 2", "KCSE" ... pulled from the title, or the category when the title has none. */
export function gradeLabel(p) {
  if (p.isBundle) return "All grades";
  const n = p.name || "";
  let m = /\b(?:grade|gr|gd|g)\s?\.?\s?(\d{1,2})\b/i.exec(n);
  if (m) return `Grade ${m[1]} · CBC`;
  if ((m = /\b(?:std|standard|class)\s?(\d)\b/i.exec(n))) return `Std ${m[1]}`;
  if ((m = /\b(?:form|f)\s?(\d)\b/i.exec(n))) return `Form ${m[1]}`;
  if ((m = /\b(kcpe|kcse|kjsea|igcse|cbc|cambridge)\b/i.exec(n))) return m[1].toUpperCase();
  return p.categoryName && p.categoryName !== "Sample" ? p.categoryName : "All grades";
}

/** Availability wording. The catalogue does not track stock yet (every variant reports 0). */
export function availability(p) {
  if (p.stock > 5) return { text: "In stock", tone: "ok" };
  if (p.stock > 0) return { text: `Low stock · ${p.stock} left`, tone: "low" };
  return { text: "Available to order", tone: "order" };
}

// ---------------------------------------------------------------- bundles & booklists

const first = (list, rx, extra) => list.find((p) => rx.test(p.name) && (!extra || extra(p)));

/** Curated, real-product bundles. Each is only offered when enough components exist. */
export function buildBundles(catalogue) {
  const stationery = catalogue.filter((p) => p.aisle > 0 && p.aisle < 6);
  const pick = (rx, extra) => first(stationery, rx, extra);
  const defs = [
    {
      key: "essentials",
      name: "Stationery Essentials Pack",
      items: [pick(/pencils? 12/i), pick(/eraser/i), pick(/sharpener/i), pick(/ruler/i), pick(/pencil case/i), pick(/notebook|exercise/i)],
    },
    {
      key: "maths",
      name: "Geometry & Maths Kit",
      items: [pick(/maths set|math set/i), pick(/protractor/i), pick(/ruler/i), pick(/calculator/i)],
    },
    {
      key: "art",
      name: "Art Starter Kit",
      items: [pick(/drawing pad/i), pick(/sketch/i), pick(/colou?ring pencil/i), pick(/water ?colou?r/i)],
    },
  ];
  return defs
    .map((d) => ({ ...d, items: d.items.filter(Boolean) }))
    .filter((d) => d.items.length >= 3)
    .map((d) => bundleOf(d.key, d.name, d.items));
}

export function bundleOf(key, name, items) {
  const unique = [...new Map(items.map((p) => [p.id, p])).values()];
  return {
    id: "bundle-" + key,
    isBundle: true,
    key,
    name,
    brand: "Learning Pack",
    items: unique,
    unavailable: unique.some((p) => p.unavailable),
    price: unique.reduce((a, p) => a + p.price, 0),
    image: "",
    cover: "",
    stock: 0,
    aisle: 7,
    rank: 0,
  };
}

const PRIMARY_SUBJECTS = [
  ["Mathematics textbook", /math/i],
  ["English textbook", /english/i],
  ["Kiswahili textbook", /kiswahili/i],
  ["Science textbook", /science/i],
  ["Social Studies textbook", /social/i],
];
const JUNIOR_SUBJECTS = [...PRIMARY_SUBJECTS.slice(0, 4), ["Social Studies textbook", /social/i], ["Agriculture textbook", /agricultur/i]];
const SENIOR_SUBJECTS = [
  ["Mathematics textbook", /math/i],
  ["English textbook", /english/i],
  ["Kiswahili textbook", /kiswahili/i],
  ["Biology textbook", /biology/i],
  ["Chemistry textbook", /chemistry/i],
  ["Physics textbook", /physics/i],
];
const ESSENTIALS = [
  ["Exercise books", /exercise book|notebook|counter book/i],
  ["Pencils", /pencils?\b(?!.*(case|colou?r))/i],
  ["Pens", /\bpens?\b|ballp/i],
  ["Ruler", /ruler/i],
  ["Eraser", /eraser/i],
  ["Pencil case", /pencil case/i],
  ["Colouring pencils", /colou?ring pencil|colour pencil/i],
  ["Maths set", /maths set|math set|geometry/i, (g) => g.n >= 4],
  ["Scientific calculator", /calculator/i, (g) => g.n >= 7],
];

export const CURRICULA = {
  CBC: ["PP1", "PP2", ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)],
  "8-4-4": [...Array.from({ length: 8 }, (_, i) => `Std ${i + 1}`), ...Array.from({ length: 4 }, (_, i) => `Form ${i + 1}`)],
  "IGCSE / Cambridge": Array.from({ length: 6 }, (_, i) => `Year ${i + 7}`),
};

/** Parses "Grade 5" / "Std 6" / "Form 2": `num` is the number as written, `n` a comparable level. */
function gradeInfo(grade) {
  const num = parseInt((/(\d+)/.exec(grade || "") || [])[1], 10) || 0;
  const isForm = /form/i.test(grade);
  const word = isForm ? "form|f" : /std/i.test(grade) ? "std|standard|class|g" : /year/i.test(grade) ? "year|y" : "grade|gr|gd|g";
  return { num, n: isForm ? num + 8 : num, word };
}

/**
 * Derives a booklist for the learner by matching requirements against the live catalogue.
 * Each line is {key, label, product|null}; null means "not in our catalogue yet".
 * A real booklist from the API should replace this once schools publish them.
 */
export function deriveBooklist(catalogue, { grade }) {
  const g = gradeInfo(grade);
  if (!g.num) return [];
  const gradeRx = new RegExp(`\\b(${g.word})\\s?\\.?\\s?${g.num}\\b`, "i");
  const subjects = g.n >= 10 ? SENIOR_SUBJECTS : g.n >= 7 ? JUNIOR_SUBJECTS : PRIMARY_SUBJECTS;
  const books = catalogue.filter((p) => p.aisle === 0);
  const lines = subjects.map(([label, rx]) => {
    const hits = books.filter((p) => gradeRx.test(p.name) && rx.test(p.name));
    hits.sort((a, b) => b.rank - a.rank || a.price - b.price);
    return { key: "bk-" + label, label, product: hits[0] || null };
  });
  const stationery = catalogue.filter((p) => p.aisle > 0 && p.aisle < 6);
  ESSENTIALS.forEach(([label, rx, when]) => {
    if (when && !when(g)) return;
    const hits = stationery.filter((p) => rx.test(p.name)).sort((a, b) => a.price - b.price);
    lines.push({ key: "st-" + label, label, product: hits[0] || null });
  });
  return lines;
}

// ---------------------------------------------------------------- shelf stocking

/** Round-robin by brand so one publisher cannot fill an entire aisle. */
function diverse(list, n) {
  const byBrand = new Map();
  list.forEach((p) => {
    if (!byBrand.has(p.brand)) byBrand.set(p.brand, []);
    byBrand.get(p.brand).push(p);
  });
  const queues = [...byBrand.values()];
  const out = [];
  for (let i = 0; out.length < n && queues.some((q) => q.length); i++) {
    const q = queues[i % queues.length];
    if (q.length) out.push(q.shift());
  }
  return out;
}

/**
 * Decides what stands on each aisle. Priority products (the child's booklist) are placed first
 * so they land on the eye-level shelves; the remainder is a brand-diverse mix of the best-ranked items.
 */
export function stockAisles(catalogue, priorityIds = new Set(), bundles = []) {
  return AISLES.map((a) => {
    if (a.id === 7) return bundles.slice(0, TILES_PER_AISLE);
    const inAisle = catalogue.filter((p) => p.aisle === a.id);
    const prio = inAisle.filter((p) => priorityIds.has(p.id));
    const rest = inAisle
      .filter((p) => !priorityIds.has(p.id))
      .sort((x, y) => y.rank - x.rank || x.id - y.id);
    return [...prio, ...diverse(rest, TILES_PER_AISLE - prio.length)];
  });
}

// ---------------------------------------------------------------- offline fallback

const DEMO = [
  [0, "Mathematics Textbook Gr 5", "KLB", 850], [0, "English Activities Gr 5", "Oxford", 780], [0, "Integrated Science Gr 5", "Longhorn", 820], [0, "Kiswahili Kitabu Gr 5", "Moran", 690],
  [1, "Exercise Books 96pg (5-pack)", "Kenafric", 350], [1, "Exercise Book 200pg", "Croxley", 120], [1, "A4 Counter Book", "Pelican", 260], [1, "Graph Book 48pg", "Kenafric", 90],
  [2, "HB Pencils (12)", "Staedtler", 240], [2, "Blue Ballpoint Pens (10)", "Bic", 200], [2, "Eraser & Sharpener Set", "Maped", 110], [2, "Highlighter Set (4)", "Faber-Castell", 380],
  [3, "Geometry Set", "Helix", 450], [3, "30cm Ruler", "Maped", 80], [3, "Scientific Calculator", "Casio", 1650], [3, "Protractor 180°", "Helix", 70],
  [4, "Crayons 24 colours", "Crayola", 420], [4, "Watercolour Paint Set", "Pelikan", 680], [4, "Colour Pencils (24)", "Faber-Castell", 560], [4, "Drawing Pad A3", "Pelican", 330],
  [5, "School Backpack 25L", "Learning Pack", 1850], [5, "Pencil Case", "Maped", 350], [5, "Water Bottle 500ml", "Aqua", 450], [5, "Lunch Box", "Tupperware", 650],
  [6, "KCPE Revision Maths", "Spotlight", 720], [6, "Mock Exam Pack Gr 5", "Elimu", 550], [6, "English Grammar Drill", "Oxford", 640], [6, "Science Revision Gr 5", "KLB", 600],
];

/** Sample stock used only when the catalogue API cannot be reached. */
export function demoCatalogue() {
  return DEMO.map(([aisle, name, brand, price], i) => ({
    id: -(i + 1), variantId: -(i + 1), name, brand, price, image: "", cover: "", stock: 0, categoryName: "Sample", aisle, rank: 0, demo: true,
  }));
}
