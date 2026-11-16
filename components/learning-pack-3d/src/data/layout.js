// Store geometry shared by the world (meshes), the shopper (collision) and the UI (teleports, tour).
// Units are metres. The entrance is on the +z side; the shopper starts at (0, 9) looking toward -z.
import { SLOTS_PER_AISLE } from "./catalogue.js";

export const STORE = { x0: -15, x1: 15, zBack: -18.5, zFront: 14.5, height: 6.2 };

/** Four double-sided gondolas => aisle ids 0..7 (west face then east face of each). */
export const UNIT_X = [-9.75, -3.25, 3.25, 9.75];
export const UNIT_Z = [-15.7, 1.7];
export const UNIT_W = 1.3;

/** Centre line of the walkway that each aisle's products face. */
export const WALK_X = [-12.7, -6.5, 0, 6.5, 12.7];
export const AISLE_WALK = [0, 1, 1, 2, 2, 3, 3, 4];

export const LEVELS = [0.2, 0.76, 1.32, 1.88]; // y of each shelf board
export const PER_LEVEL = 32;
export const FACING_Z0 = -15.2;
export const FACING_DZ = 0.53;
/** Eye level first, so booklist items (stocked first) land where they are easiest to see. */
const LEVEL_ORDER = [2, 1, 3, 0];

export const aisleSide = (aisle) => (aisle % 2 ? 1 : -1);

/** Where facing `slot` (0..127) of `aisle` stands. `x` is the shelf centre line; `side` is the facing direction. */
export function slotPose(aisle, slot) {
  const side = aisleSide(aisle);
  const level = LEVEL_ORDER[Math.floor(slot / PER_LEVEL) % 4];
  const k = slot % PER_LEVEL;
  return { x: UNIT_X[aisle >> 1], y: LEVELS[level], z: FACING_Z0 + k * FACING_DZ, side, level, k };
}

/** Which tile (unique product) occupies each slot when `n` unique products share the aisle. */
export const tileOfSlot = (slot, n) => Math.min(n - 1, Math.floor((slot * n) / SLOTS_PER_AISLE));

/** First slot occupied by tile `t`. */
export const firstSlotOfTile = (t, n) => Math.ceil((t * SLOTS_PER_AISLE) / n);

// Static obstacles as [xMin, xMax, zMin, zMax].
export const COLLIDERS = [
  ...UNIT_X.map((x) => [x - UNIT_W / 2 - 0.1, x + UNIT_W / 2 + 0.1, UNIT_Z[0] - 0.2, UNIT_Z[1] + 0.2]),
  [-13.6, -5.4, 9.4, 11.8], // checkout counters
  [4.2, 8.2, 7.3, 9.7], // featured table A
  [9.6, 13.6, 7.3, 9.7], // featured table B
  [10.2, 12.2, 11.6, 12.4], // info kiosk
];
export const PLAYER_R = 0.45;
export const blocked = (x, z) =>
  x < STORE.x0 + 0.9 || x > STORE.x1 - 0.9 || z < STORE.zBack + 0.9 || z > STORE.zFront - 0.9 ||
  COLLIDERS.some((b) => x > b[0] - PLAYER_R && x < b[1] + PLAYER_R && z > b[2] - PLAYER_R && z < b[3] + PLAYER_R);

/** Inner edges of walkway `i` (between the neighbouring gondolas, or the wall). */
const walkBand = (i) => [i === 0 ? STORE.x0 : UNIT_X[i - 1] + UNIT_W / 2 + 0.1, i === 4 ? STORE.x1 : UNIT_X[i] - UNIT_W / 2 - 0.1];

/**
 * Keeps the camera inside the building and out of the shelving. While the shopper is among the
 * gondolas the camera also stays inside the same walkway, so it never ends up above or behind a shelf.
 */
export function clampCamera(p, shopperX = p.x) {
  p.x = Math.min(STORE.x1 - 0.35, Math.max(STORE.x0 + 0.35, p.x));
  p.z = Math.min(STORE.zFront - 0.35, Math.max(STORE.zBack + 0.35, p.z));
  p.y = Math.min(STORE.height - 0.4, Math.max(0.7, p.y));
  if (p.z > UNIT_Z[0] - 0.3 && p.z < UNIT_Z[1] + 0.3) {
    let walk = 0;
    for (let i = 0; i < 5; i++) {
      const [a, b] = walkBand(i);
      if (shopperX >= a && shopperX <= b) walk = i;
    }
    const [a, b] = walkBand(walk);
    p.x = Math.min(b - 0.35, Math.max(a + 0.35, p.x));
  }
  for (const [x0, x1, z0, z1] of COLLIDERS) {
    if (p.y > 3.0) continue; // above the shelving and signs
    if (p.x > x0 - 0.25 && p.x < x1 + 0.25 && p.z > z0 - 0.25 && p.z < z1 + 0.25) {
      const out = [p.x - (x0 - 0.25), x1 + 0.25 - p.x, p.z - (z0 - 0.25), z1 + 0.25 - p.z];
      const i = out.indexOf(Math.min(...out));
      if (i === 0) p.x = x0 - 0.25;
      else if (i === 1) p.x = x1 + 0.25;
      else if (i === 2) p.z = z0 - 0.25;
      else p.z = z1 + 0.25;
    }
  }
}

/** Where to stand (and which way to face) to look at an aisle's shelf at depth `z`. */
export const aisleStand = (aisle, z = -2) => {
  const side = aisleSide(aisle);
  return { x: WALK_X[AISLE_WALK[aisle]], z, heading: side * (Math.PI / 2) };
};

/** Guided tour: a lap through every walkway. `aisles` are announced on arrival. */
export const TOUR = [
  { x: 0, z: 9 },
  { x: -12.7, z: 3.5 },
  { x: -12.7, z: -5, say: 0 },
  { x: -12.7, z: -14.5 },
  { x: -6.5, z: -17, },
  { x: -6.5, z: -6, say: 1 },
  { x: -6.5, z: 3.5 },
  { x: 0, z: 3.5 },
  { x: 0, z: -6, say: 3 },
  { x: 0, z: -14.5 },
  { x: 6.5, z: -17 },
  { x: 6.5, z: -6, say: 5 },
  { x: 6.5, z: 3.5 },
  { x: 12.7, z: 3.5 },
  { x: 12.7, z: -6, say: 7 },
  { x: 12.7, z: 3.5 },
  { x: -9.5, z: 8.4, say: "checkout" },
  { x: 0, z: 9 },
];

export const SPAWN = { x: 0, z: 9, heading: 0 };
