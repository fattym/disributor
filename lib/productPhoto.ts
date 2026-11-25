import badPhotos from './badPhotos.json';

/**
 * Catalogue photos known to be wrong (old seed stock photos, another book's cover) or missing.
 * A wrong picture reads as a wrong product, so these show "No photo yet" instead.
 * Remove an entry once the product has a correct photo (a new upload gets a new file name and is shown).
 */
const BAD = new Set<string>(badPhotos as string[]);

export const cleanPhoto = (url: string | null | undefined): string | null => (url && !BAD.has(url) ? url : null);

export function cleanProduct<T extends object>(product: T): T {
  const p = product as Record<string, unknown>;
  const out: Record<string, unknown> = { ...p };
  for (const key of ['image_url', 'image', 'cover_image']) {
    const v = out[key];
    if (typeof v === 'string' && BAD.has(v)) out[key] = null;
  }
  return out as T;
}
