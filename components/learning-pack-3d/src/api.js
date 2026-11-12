const RAW_API = typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8000/api";
export const API = RAW_API.replace(/\/+$/, "");
export const DEMO = !RAW_API;

export function resolveImageUrl(path) {
  if (!path) return "/assets/profile/kids.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const host = API.replace(/\/api\/?$/, "");
  return `${host}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function fetchProducts() {
  try {
    const pageSize = 200;
    const r = await fetch(`${API}/shop/public/?page_size=${pageSize}&page=1`);
    if (!r.ok) return null;
    const data = await r.json();
    if (Array.isArray(data)) return data;
    const results = [...(data.results || [])];
    const count = data.count || results.length;
    if (count <= results.length) return results;
    const totalPages = Math.ceil(count / pageSize);
    const pageNums = [];
    for (let p = 2; p <= totalPages; p++) pageNums.push(p);
    const batchSize = 6;
    for (let i = 0; i < pageNums.length; i += batchSize) {
      const batch = pageNums.slice(i, i + batchSize);
      const pages = await Promise.all(
        batch.map((p) => fetch(`${API}/shop/public/?page_size=${pageSize}&page=${p}`).then((res) => res.ok ? res.json() : null))
      );
      for (const pg of pages) { if (pg && pg.results) results.push(...pg.results); }
    }
    return results;
  } catch (e) {
    console.warn("Could not fetch products from backend, using fallback:", e);
    return null;
  }
}

export async function fetchHeroItems() {
  try {
    const r = await fetch(`${API}/shop/public/hero_items/`);
    if (!r.ok) return null;
    const data = await r.json();
    return Array.isArray(data) ? data : (data.results || null);
  } catch (e) {
    console.warn("Could not fetch hero items from backend:", e);
    return null;
  }
}

export async function checkout(payload) {
  if (DEMO) return { demo: true, order_id: "LP-DEMO-" + Math.floor(1000 + Math.random() * 9000) };
  const r = await fetch(`${API}/shop/orders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || "Checkout failed");
  return r.json();
}

export async function orderStatus(id) {
  const r = await fetch(`${API}/shop/orders/${id}/`);
  return r.json();
}
