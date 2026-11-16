import * as THREE from "three";

export const BRAND = { orange: "#E63B00", navy: "#0B1F3A", white: "#FFFFFF", grey: "#F4F5F7", text: "#202124" };
export const FONT = '"DM Sans","Trebuchet MS","Segoe UI",Arial,sans-serif';

/** Fill a sign background; brand orange is blended into warm amber and navy so large signs aren't a flat orange slab. */
export function fillBg(g, W, H, color) {
  if (color !== BRAND.orange) {
    g.fillStyle = color;
    g.fillRect(0, 0, W, H);
    return;
  }
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, "#F59A4A");
  gr.addColorStop(0.45, BRAND.orange);
  gr.addColorStop(1, "#8a2a14");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}

const cache = new Map();

export function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function toTexture(canvas, { repeat, anisotropy = 8, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Wraps `text` into at most `maxLines` lines no wider than `maxW` at the current font. */
export function wrapText(g, text, maxW, maxLines = 3) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? line + " " + w : w;
    if (g.measureText(next).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last.length > 1 && g.measureText(last + "…").width > maxW) last = last.slice(0, -1);
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}

/**
 * A branded sign. `lines` is [{text, size, color, weight, align}] in canvas pixels;
 * the canvas keeps the physical aspect ratio w:h.
 */
export function signTexture(key, w, h, draw) {
  if (cache.has(key)) return cache.get(key);
  const px = 1024;
  const c = makeCanvas(px, Math.max(64, Math.round(px * (h / w))));
  const g = c.getContext("2d");
  g.textBaseline = "middle";
  draw(g, c.width, c.height);
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

/** Fits a single line of text into maxW by shrinking the font. */
export function fitFont(g, text, maxW, size, weight = 800) {
  let s = size;
  g.font = `${weight} ${s}px ${FONT}`;
  while (g.measureText(text).width > maxW && s > 10) {
    s -= 2;
    g.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

export function textSign(text, w, h, { bg = BRAND.orange, fg = BRAND.white, sub, accent } = {}) {
  return signTexture(`t|${text}|${sub || ""}|${w}|${h}|${bg}|${fg}|${accent || ""}`, w, h, (g, W, H) => {
    fillBg(g, W, H, bg);
    if (accent) {
      g.fillStyle = accent;
      g.fillRect(0, H - H * 0.09, W, H * 0.09);
    }
    g.fillStyle = fg;
    g.textAlign = "center";
    const lines = String(text).split("\n");
    const base = Math.min(H / (lines.length + (sub ? 1.5 : 0.8)), W / 9);
    const size = Math.min(...lines.map((l) => fitFont(g, l, W * 0.9, base)));
    const total = lines.length * size * 1.1 + (sub ? size * 0.7 : 0);
    let y = H / 2 - total / 2 + size * 0.55;
    g.font = `800 ${size}px ${FONT}`;
    lines.forEach((l) => {
      g.fillText(l, W / 2, y);
      y += size * 1.1;
    });
    if (sub) {
      g.font = `600 ${size * 0.5}px ${FONT}`;
      g.globalAlpha = 0.9;
      g.fillText(sub, W / 2, y + size * 0.1);
      g.globalAlpha = 1;
    }
  });
}

export function floorTexture() {
  if (cache.has("floor")) return cache.get("floor");
  const c = makeCanvas(512, 512);
  const g = c.getContext("2d");
  g.fillStyle = "#cfd4dc";
  g.fillRect(0, 0, 512, 512);
  // four large tiles with a slight tonal variation and thin grout
  for (let i = 0; i < 4; i++) {
    const x = (i % 2) * 256;
    const y = Math.floor(i / 2) * 256;
    const v = 205 + ((i * 7) % 9);
    g.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    g.fillRect(x, y, 256, 256);
  }
  g.strokeStyle = "rgba(120,128,140,.55)";
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 509, 509);
  g.beginPath();
  g.moveTo(256, 0);
  g.lineTo(256, 512);
  g.moveTo(0, 256);
  g.lineTo(512, 256);
  g.stroke();
  const t = toTexture(c, { repeat: [12, 13] });
  cache.set("floor", t);
  return t;
}

export function ceilingTexture() {
  if (cache.has("ceiling")) return cache.get("ceiling");
  const c = makeCanvas(256, 256);
  const g = c.getContext("2d");
  g.fillStyle = "#f7f8fa";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#c9ced6";
  g.lineWidth = 4;
  g.strokeRect(2, 2, 252, 252);
  const t = toTexture(c, { repeat: [25, 27] });
  cache.set("ceiling", t);
  return t;
}

export function wallTexture() {
  if (cache.has("wall")) return cache.get("wall");
  const c = makeCanvas(64, 256);
  const g = c.getContext("2d");
  g.fillStyle = "#f6f7f9";
  g.fillRect(0, 0, 64, 256);
  // navy dado with an orange rail: the brand colours running around the store
  g.fillStyle = BRAND.navy;
  g.fillRect(0, 196, 64, 60);
  g.fillStyle = BRAND.orange;
  g.fillRect(0, 190, 64, 8);
  const t = toTexture(c, { anisotropy: 4 });
  cache.set("wall", t);
  return t;
}

/** A soft dark blob used as a fake contact shadow under shelving and counters. */
export function blobTexture() {
  if (cache.has("blob")) return cache.get("blob");
  const c = makeCanvas(128, 128);
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 8, 64, 64, 62);
  grd.addColorStop(0, "rgba(10,20,40,.55)");
  grd.addColorStop(1, "rgba(10,20,40,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = toTexture(c, { srgb: false });
  cache.set("blob", t);
  return t;
}
