/** Classes a shopper can pick, matched against product names: the live catalogue links no product to a grade record. Pure: no imports. */
export type GradeGroup = 'Pre-primary' | 'Grade' | 'Form';
export interface GradeClass { slug: string; label: string; short: string; group: GradeGroup; pattern: RegExp }

const numbered = (group: 'Grade' | 'Form', n: number): GradeClass => ({
  slug: `${group.toLowerCase()}-${n}`, label: `${group} ${n}`, short: String(n), group,
  pattern: new RegExp(`\\b${group}[ .-]*${n}\\b`, 'i'),
});
const early = (label: string, pattern: RegExp): GradeClass => ({ slug: label.toLowerCase(), label, short: label, group: 'Pre-primary', pattern });

export const GRADE_CLASSES: readonly GradeClass[] = [
  early('Playgroup', /\bplay ?group\b/i),
  early('PP1', /\bpp[ -]?1\b/i),
  early('PP2', /\bpp[ -]?2\b/i),
  ...Array.from({ length: 12 }, (_, i) => numbered('Grade', i + 1)),
  ...Array.from({ length: 4 }, (_, i) => numbered('Form', i + 1)),
];

export const findClass = (slug: string | null | undefined) => GRADE_CLASSES.find((c) => c.slug === slug);

/** Only classes that have at least one product, each once, in school order. */
export const classesIn = (products: { name: string }[]) => GRADE_CLASSES.filter((c) => products.some((p) => c.pattern.test(p.name)));
