/**
 * Colours and materials for a warm, believable bookshop.
 *
 * Rule of thumb: the store is warm and calm (neutrals + navy), and the
 * brand orange only marks things you can interact with: signs, price
 * tags, the trolley handle, buttons.
 */
import * as THREE from "three";

export const STORE_COLORS = {
  // Brand
  brandOrange: "#E8480C", // big signs, shelf price strips, trolley handle
  brandOrangeText: "#C2410C", // darker orange when white text sits on it
  brandNavy: "#14213D",

  // Room
  floor: "#E6E1D8", // warm light grey tile (was pure white)
  floorGrout: "#CFC7BA",
  wall: "#F2EDE5",
  accentWall: "#E8480C", // one wall only, behind the entrance or tills
  ceiling: "#FAF8F4",
  fog: "#EDE7DD", // also used as the background colour

  // Shelving
  shelfFrame: "#1B2A4A", // uprights and edges
  shelfBack: "#33445F", // lighter back panels so products stand out
  shelfBoard: "#D9CDBB", // pale wood-look boards
  priceStrip: "#E8480C",

  // Light
  lightWarm: "#FFF1DC", // ceiling panels and key light (shop lighting is slightly warm)
  skyFill: "#FFF4E6",
  groundFill: "#B8AD9E",

  // Shopper
  shopperShirt: "#1F8A8A", // teal, so the player never blends into orange shelves
  shopperTrousers: "#22304F",
} as const;

/** Product colours that read as "real stationery" instead of one repeated box. */
export const PRODUCT_COLORS = [
  "#2F6FB3", // school blue
  "#C23B3B", // red
  "#2E8B57", // green
  "#F2B705", // yellow
  "#6C4AB6", // purple
  "#F28C6B", // coral
  "#7FB7BE", // pastel teal
  "#E9D8A6", // cream
  "#3D405B", // slate
] as const;

/** Pick a stable colour for a product so it doesn't change every render. */
export function productColor(id: string | number): string {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PRODUCT_COLORS[h % PRODUCT_COLORS.length];
}

/**
 * Procedural floor tiles: slight colour variation per tile plus grout lines.
 * No image download needed. One texture tile = `tilesPerTexture` floor tiles.
 */
export function createFloorTileTexture({
  tilesPerTexture = 4,
  size = 512,
  base = STORE_COLORS.floor,
  grout = STORE_COLORS.floorGrout,
}: { tilesPerTexture?: number; size?: number; base?: string; grout?: string } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const tile = size / tilesPerTexture;
  const baseColor = new THREE.Color(base);

  for (let y = 0; y < tilesPerTexture; y++) {
    for (let x = 0; x < tilesPerTexture; x++) {
      const c = baseColor.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.03);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x * tile, y * tile, tile, tile);

      // faint speckle so tiles don't look like flat plastic
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.035})`;
        ctx.fillRect(x * tile + Math.random() * tile, y * tile + Math.random() * tile, 2, 2);
      }
    }
  }

  ctx.strokeStyle = grout;
  ctx.lineWidth = Math.max(2, size / 256);
  for (let i = 0; i <= tilesPerTexture; i++) {
    const p = i * tile;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Floor material. `floorSizeMeters` and `tileMeters` set the texture repeat.
 * Low roughness gives a faint reflection of lights and shelves.
 */
export function createFloorMaterial(floorSizeMeters: [number, number], tileMeters = 0.6) {
  const tilesPerTexture = 4;
  const map = createFloorTileTexture({ tilesPerTexture });
  map.repeat.set(
    floorSizeMeters[0] / (tileMeters * tilesPerTexture),
    floorSizeMeters[1] / (tileMeters * tilesPerTexture),
  );
  return new THREE.MeshStandardMaterial({ map, roughness: 0.38, metalness: 0 });
}

export function createShelfMaterials() {
  return {
    frame: new THREE.MeshStandardMaterial({ color: STORE_COLORS.shelfFrame, roughness: 0.55, metalness: 0.25 }),
    back: new THREE.MeshStandardMaterial({ color: STORE_COLORS.shelfBack, roughness: 0.85 }),
    board: new THREE.MeshStandardMaterial({ color: STORE_COLORS.shelfBoard, roughness: 0.7 }),
    priceStrip: new THREE.MeshStandardMaterial({ color: STORE_COLORS.priceStrip, roughness: 0.5 }),
  };
}

/** Paper/cardboard products: matte. Book covers: a touch glossier. */
export function createProductMaterial(color: string, kind: "paper" | "cover" | "plastic" = "paper") {
  const roughness = kind === "paper" ? 0.9 : kind === "cover" ? 0.55 : 0.35;
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

/**
 * The scene currently uses MeshLambertMaterial in places. Lambert ignores
 * the environment lighting added in StoreLighting, so convert it to
 * MeshStandardMaterial. Call once after the store is built, e.g. from
 * <UpgradeMaterials /> in StoreLighting.tsx.
 *
 * MeshBasicMaterial is left alone on purpose: it is usually used for
 * labels, screens and glowing signs that should not be lit.
 */
export function upgradeLambertMaterials(root: THREE.Object3D, defaultRoughness = 0.8) {
  const cache = new Map<string, THREE.MeshStandardMaterial>();

  const convert = (m: THREE.Material): THREE.Material => {
    if (!(m as THREE.MeshLambertMaterial).isMeshLambertMaterial) return m;
    const old = m as THREE.MeshLambertMaterial;
    const cached = cache.get(old.uuid);
    if (cached) return cached;

    const next = new THREE.MeshStandardMaterial({
      name: old.name,
      color: old.color,
      map: old.map,
      emissive: old.emissive,
      emissiveMap: old.emissiveMap,
      emissiveIntensity: old.emissiveIntensity,
      alphaMap: old.alphaMap,
      transparent: old.transparent,
      opacity: old.opacity,
      alphaTest: old.alphaTest,
      side: old.side,
      vertexColors: old.vertexColors,
      roughness: defaultRoughness,
      metalness: 0,
    });
    cache.set(old.uuid, next);
    old.dispose();
    return next;
  };

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
  });

  return cache.size; // how many materials were converted
}
