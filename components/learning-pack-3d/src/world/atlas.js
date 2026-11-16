// Per-aisle texture atlases. One canvas holds every cover on the aisle (and one every shelf label),
// so a whole aisle is drawn with a handful of instanced meshes instead of hundreds of separate ones.
import { BRAND, FONT, fitFont, makeCanvas, roundRect, toTexture, wrapText } from "./textures.js";
import { kes, AISLES } from "../data/catalogue.js";

export const COLS = 8;
export const ROWS = 8;

export function createAtlas(lowRes) {
  const tw = lowRes ? 96 : 128;
  const th = lowRes ? 120 : 160;
  const lw = 256;
  const lh = 64;
  const cover = makeCanvas(COLS * tw, ROWS * th);
  const label = makeCanvas(COLS * lw, ROWS * lh);
  return {
    tw, th, lw, lh, cover, label,
    coverTex: toTexture(cover, { anisotropy: 4 }),
    labelTex: toTexture(label, { anisotropy: 4 }),
    state: new Uint8Array(COLS * ROWS), // 0 placeholder, 1 loading, 2 loaded, 3 failed
    version: 0,
    dirty: false,
    last: 0,
  };
}

export function disposeAtlas(a) {
  a.coverTex.dispose();
  a.labelTex.dispose();
}

/** Uploads changed atlases at most a few times a second (each upload re-sends the whole canvas). */
export function flushAtlas(a, now) {
  if (!a.dirty || now - a.last < 250) return;
  a.coverTex.needsUpdate = true;
  a.labelTex.needsUpdate = true;
  a.dirty = false;
  a.last = now;
}

const tileXY = (a, t, w, h) => [(t % COLS) * w, Math.floor(t / COLS) * h];

// ----------------------------------------------------------------------------- placeholders

function icon(g, shape, cx, cy, s, color) {
  g.save();
  g.translate(cx, cy);
  g.fillStyle = color;
  g.strokeStyle = color;
  g.lineWidth = Math.max(2, s * 0.06);
  g.lineJoin = "round";
  if (shape === "book" || shape === "notebook") {
    g.rotate(-0.12);
    roundRect(g, -s * 0.32, -s * 0.42, s * 0.64, s * 0.84, s * 0.06);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.8)";
    g.fillRect(-s * 0.22, -s * 0.28, s * 0.44, s * 0.06);
    g.fillRect(-s * 0.22, -s * 0.16, s * 0.3, s * 0.05);
    if (shape === "notebook") for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-s * 0.32, -s * 0.3 + i * s * 0.15, s * 0.04, 0, 7); g.fill(); }
  } else if (shape === "pack") {
    ["#E63B00", "#ca8a04", "#2563eb"].forEach((c, i) => {
      g.save();
      g.rotate(-0.5 + i * 0.5);
      g.fillStyle = c;
      g.fillRect(-s * 0.05, -s * 0.4, s * 0.1, s * 0.66);
      g.beginPath();
      g.moveTo(-s * 0.05, s * 0.26);
      g.lineTo(0, s * 0.4);
      g.lineTo(s * 0.05, s * 0.26);
      g.fill();
      g.restore();
    });
  } else if (shape === "tin") {
    g.beginPath();
    g.moveTo(-s * 0.4, s * 0.3);
    g.lineTo(s * 0.4, s * 0.3);
    g.lineTo(-s * 0.4, -s * 0.34);
    g.closePath();
    g.stroke();
    g.fillRect(-s * 0.4, s * 0.34, s * 0.8, s * 0.1);
  } else if (shape === "box") {
    ["#dc2626", "#ca8a04", "#16a34a", "#2563eb", "#9333ea"].forEach((c, i) => {
      g.fillStyle = c;
      g.fillRect(-s * 0.36 + i * s * 0.15, -s * 0.3, s * 0.12, s * 0.62);
      g.beginPath();
      g.moveTo(-s * 0.36 + i * s * 0.15, -s * 0.3);
      g.lineTo(-s * 0.3 + i * s * 0.15, -s * 0.42);
      g.lineTo(-s * 0.24 + i * s * 0.15, -s * 0.3);
      g.fill();
    });
  } else if (shape === "bag") {
    g.beginPath();
    g.arc(0, -s * 0.28, s * 0.2, Math.PI, 0);
    g.stroke();
    roundRect(g, -s * 0.34, -s * 0.28, s * 0.68, s * 0.72, s * 0.12);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.35)";
    roundRect(g, -s * 0.22, s * 0.08, s * 0.44, s * 0.26, s * 0.06);
    g.fill();
  } else {
    // gift / bundle
    g.fillRect(-s * 0.38, -s * 0.12, s * 0.76, s * 0.54);
    g.fillStyle = "rgba(255,255,255,.9)";
    g.fillRect(-s * 0.04, -s * 0.12, s * 0.08, s * 0.54);
    g.fillRect(-s * 0.38, s * 0.1, s * 0.76, s * 0.08);
    g.fillStyle = color;
    g.fillRect(-s * 0.42, -s * 0.3, s * 0.84, s * 0.18);
    g.fillStyle = "rgba(255,255,255,.9)";
    g.fillRect(-s * 0.04, -s * 0.3, s * 0.08, s * 0.18);
  }
  g.restore();
}

function drawPlaceholder(a, t, p, aisle) {
  const g = a.cover.getContext("2d");
  const [x, y] = tileXY(a, t, a.tw, a.th);
  const { tw: w, th: h } = a;
  const def = AISLES[aisle];
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  const grd = g.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, def.color);
  grd.addColorStop(1, "#0B1F3A");
  g.fillStyle = grd;
  g.fillRect(x, y, w, h);
  g.fillStyle = "rgba(255,255,255,.95)";
  roundRect(g, x + 7, y + 7, w - 14, h * 0.4, 6);
  g.fill();
  g.fillStyle = BRAND.navy;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const fs = Math.round(w * 0.105);
  g.font = `800 ${fs}px ${FONT}`;
  const lines = wrapText(g, p.name, w - 26, 4);
  const top = y + 7 + (h * 0.4) / 2 - ((lines.length - 1) * fs * 1.12) / 2;
  lines.forEach((l, i) => g.fillText(l, x + w / 2, top + i * fs * 1.12));
  icon(g, def.shape, x + w / 2, y + h * 0.66, w * 0.5, "rgba(255,255,255,.92)");
  g.fillStyle = BRAND.orange;
  g.fillRect(x, y + h - h * 0.15, w, h * 0.15);
  g.fillStyle = "#fff";
  const bs = fitFont(g, p.brand || "Learning Pack", w - 12, Math.round(w * 0.09), 700);
  g.font = `700 ${bs}px ${FONT}`;
  g.fillText(p.brand || "Learning Pack", x + w / 2, y + h - h * 0.075);
  g.restore();
}

/** status: {booklist, inCart}. Labels double as shopping feedback: booklist items are navy, trolley items green. */
function drawLabel(a, t, p, status) {
  const g = a.label.getContext("2d");
  const [x, y] = tileXY(a, t, a.lw, a.lh);
  const { lw: w, lh: h } = a;
  const tag = status.inCart ? "✓ IN TROLLEY" : status.booklist ? "BOOKLIST" : "";
  g.fillStyle = status.inCart ? "#15803d" : status.booklist ? BRAND.navy : BRAND.orange;
  g.fillRect(x, y, w, h);
  g.fillStyle = "#fff";
  g.textAlign = "left";
  g.textBaseline = "middle";
  const name = p.isBundle ? `${p.name} · ${p.items.length} items` : p.name;
  const nsz = fitFont(g, name, w * 0.94, 19, 700);
  g.font = `700 ${nsz}px ${FONT}`;
  g.fillText(name.length > 44 ? name.slice(0, 43) + "…" : name, x + 8, y + h * 0.27);
  g.font = `800 25px ${FONT}`;
  g.textAlign = "right";
  g.fillStyle = status.booklist && !status.inCart ? "#ffb089" : "#fff";
  g.fillText(kes(p.price), x + w - 8, y + h * 0.7);
  if (tag) {
    g.textAlign = "left";
    g.fillStyle = status.inCart ? "#ffffff" : BRAND.orange;
    roundRect(g, x + 8, y + h * 0.52, status.inCart ? 124 : 92, 22, 5);
    g.fill();
    g.fillStyle = status.inCart ? "#15803d" : "#fff";
    g.font = `800 14px ${FONT}`;
    g.fillText(tag, x + 15, y + h * 0.52 + 12);
  }
}

/** Redraws every cover tile for a new stock list (placeholders only; real covers stream in afterwards). */
export function paintAtlas(a, aisle, list) {
  a.version++;
  a.state.fill(0);
  const cg = a.cover.getContext("2d");
  cg.fillStyle = "#0B1F3A";
  cg.fillRect(0, 0, a.cover.width, a.cover.height);
  list.forEach((p, t) => drawPlaceholder(a, t, p, aisle));
  a.dirty = true;
  a.last = 0;
}

/** Redraws only the shelf labels (cheap), e.g. when the trolley or booklist changes. */
export function paintLabels(a, list, statusOf) {
  const lg = a.label.getContext("2d");
  lg.fillStyle = BRAND.orange;
  lg.fillRect(0, 0, a.label.width, a.label.height);
  list.forEach((p, t) => drawLabel(a, t, p, statusOf(p)));
  a.dirty = true;
}

/** Draws a loaded cover photo into its tile. Books crop to fill; everything else is shown whole on white. */
export function paintCover(a, t, img, shape) {
  const g = a.cover.getContext("2d");
  const [x, y] = tileXY(a, t, a.tw, a.th);
  const { tw: w, th: h } = a;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  const fill = shape === "book" || shape === "notebook";
  if (!fill) {
    g.fillStyle = "#fff";
    g.fillRect(x, y, w, h);
  }
  const pad = fill ? 0 : 6;
  const s = (fill ? Math.max : Math.min)((w - pad * 2) / img.width, (h - pad * 2) / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  g.restore();
  a.dirty = true;
}

// ----------------------------------------------------------------------------- loader

const MAX_CONCURRENT = 6;
const pending = new Map(); // key -> {url, dist, done}
const inflight = new Set();
const dead = new Set();

function pump() {
  while (inflight.size < MAX_CONCURRENT && pending.size) {
    let best = null;
    for (const [key, job] of pending) if (!best || job.dist < best[1].dist) best = [key, job];
    const [key, job] = best;
    pending.delete(key);
    inflight.add(key);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    const finish = (ok) => {
      inflight.delete(key);
      if (!ok) dead.add(job.url);
      job.done(ok ? img : null);
      pump();
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = job.url;
  }
}

/** Queue (or re-prioritise) a cover. `dist` decides what loads first. */
export function requestCover(key, url, dist, done) {
  if (dead.has(url)) return done(null);
  const job = pending.get(key);
  if (job) job.dist = dist;
  else if (!inflight.has(key)) pending.set(key, { url, dist, done });
  pump();
}

/** Forget queued (not yet started) requests whose keys start with `prefix` and are not in `keep`. Returns the dropped keys. */
export function pruneCovers(prefix, keep) {
  const dropped = [];
  for (const key of pending.keys()) {
    if (key.startsWith(prefix) && !keep.has(key)) {
      pending.delete(key);
      dropped.push(key);
    }
  }
  return dropped;
}
