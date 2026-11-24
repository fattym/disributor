const RAW_API = typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8000/api";
export const API = RAW_API.replace(/\/+$/, "");

const COVER_HOST = "https://image.codingclubskenya.com/";

export function resolveImageUrl(path) {
  if (!path) return "/assets/profile/kids.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const host = API.replace(/\/api\/?$/, "");
  return `${host}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Same-origin URL for a cover so WebGL may sample it (the image host has no CORS headers). */
export function coverUrl(url) {
  if (!url) return "";
  return url.startsWith(COVER_HOST) ? "/lp-cover/" + url.slice(COVER_HOST.length) : url;
}

/** Fetches every page of the public catalogue. `onProgress(loaded, total)` fires as pages land. */
export async function fetchCatalogue(onProgress) {
  const pageSize = 200;
  const get = (page) =>
    fetch(`${API}/shop/public/?page_size=${pageSize}&page=${page}`).then((r) => {
      if (!r.ok) throw new Error(`Catalogue request failed (${r.status})`);
      return r.json();
    });
  const first = await get(1);
  if (Array.isArray(first)) return first;
  const all = [...(first.results || [])];
  const pages = Math.max(1, Math.ceil((first.count || all.length) / pageSize));
  onProgress?.(1, pages);
  const rest = Array.from({ length: pages - 1 }, (_, i) => i + 2);
  let done = 1;
  const results = new Map();
  const queue = [...rest];
  // Several workers keep the connection busy without flooding a dev server.
  await Promise.all(
    Array.from({ length: Math.min(6, queue.length) }, async () => {
      while (queue.length) {
        const page = queue.shift();
        const data = await get(page);
        results.set(page, data.results || []);
        onProgress?.(++done, pages);
      }
    })
  );
  rest.forEach((p) => all.push(...(results.get(p) || [])));
  return all;
}

export async function fetchHeroItems() {
  try {
    const r = await fetch(`${API}/shop/public/hero_items/`);
    if (!r.ok) return null;
    const data = await r.json();
    return Array.isArray(data) ? data : data.results || null;
  } catch (e) {
    console.warn("Could not fetch hero items from backend:", e);
    return null;
  }
}

export async function fetchSchools() {
  try {
    const r = await fetch(`${API}/storefront/schools/`);
    if (!r.ok) return null;
    const data = await r.json();
    const list = Array.isArray(data) ? data : data.results || [];
    return list.filter((s) => s.is_active !== false).map((s) => ({ id: s.id, name: s.name }));
  } catch {
    return null;
  }
}
