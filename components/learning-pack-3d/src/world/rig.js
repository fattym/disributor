import * as THREE from "three";
import { AISLES, SLOTS_PER_AISLE } from "../data/catalogue.js";
import { UNIT_X, aisleSide, firstSlotOfTile, slotPose, tileOfSlot } from "../data/layout.js";
import { shopperPos } from "./state.js";
import { COLS, createAtlas, disposeAtlas, flushAtlas, paintAtlas, paintCover, paintLabels, pruneCovers, requestCover } from "./atlas.js";

// Physical size of one facing per product shape (metres): w along the shelf, h tall, d deep.
export const SHAPES = {
  book: { w: 0.25, h: 0.37, d: 0.05, lean: 0.1, copies: 2 },
  notebook: { w: 0.23, h: 0.31, d: 0.028, lean: 0.1, copies: 2 },
  pack: { w: 0.22, h: 0.3, d: 0.04, lean: 0.08, copies: 2 },
  tin: { w: 0.3, h: 0.22, d: 0.045, lean: 0.08, copies: 1 },
  box: { w: 0.24, h: 0.27, d: 0.1, lean: 0.04, copies: 2 },
  bag: { w: 0.38, h: 0.46, d: 0.17, lean: 0.03, copies: 1 },
  bundle: { w: 0.42, h: 0.34, d: 0.22, lean: 0, copies: 1 },
};
const TINTS = ["#1e3a8a", "#9a3412", "#065f46", "#6d28d9", "#155e75", "#9f1239", "#854d0e", "#334155"];
const LOAD_RADIUS = 12; // covers closer than this to the shopper are fetched
export const GAP = 0.53;

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
};
const rnd = (a, b) => hash(`${a}:${b}`);

// Imperative three.js plumbing for one aisle. Kept outside React components on purpose:
// the meshes, attributes and atlas textures are mutated in place every restock and every frame.

/** MeshStandardMaterial whose texture coordinates are remapped per instance into an atlas tile. */
function atlasMaterial(map) {
  const m = new THREE.MeshStandardMaterial({ map, roughness: 0.5, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader =
      "attribute vec4 aUv;\n" +
      shader.vertexShader.replace("#include <uv_vertex>", "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv * aUv.zw + aUv.xy;\n#endif");
  };
  m.customProgramCacheKey = () => "lp-atlas-uv";
  return m;
}

const tileUv = (t) => [(t % COLS) / COLS, 1 - (Math.floor(t / COLS) + 1) / COLS, 1 / COLS, 1 / COLS];

/** Builds the three instanced meshes (bodies, cover faces, shelf labels) for one aisle. */
export function makeRig(aisle, small) {
  const def = AISLES[aisle];
  const S = SHAPES[def.shape];
  const side = aisleSide(aisle);
  const ux = UNIT_X[aisle >> 1];
  const nBody = SLOTS_PER_AISLE * S.copies;
  const atlas = createAtlas(small);

  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.7 }), nBody);
  const frontGeo = new THREE.PlaneGeometry(1, 1);
  const uvC = new THREE.InstancedBufferAttribute(new Float32Array(nBody * 4), 4);
  frontGeo.setAttribute("aUv", uvC);
  const front = new THREE.InstancedMesh(frontGeo, atlasMaterial(atlas.coverTex), nBody);
  const labelGeo = new THREE.PlaneGeometry(1, 1);
  const uvL = new THREE.InstancedBufferAttribute(new Float32Array(SLOTS_PER_AISLE * 4), 4);
  labelGeo.setAttribute("aUv", uvL);
  const label = new THREE.InstancedMesh(labelGeo, atlasMaterial(atlas.labelTex), SLOTS_PER_AISLE);
  const color = new THREE.InstancedBufferAttribute(new Float32Array(nBody * 3), 3);
  body.instanceColor = color;

  const d = new THREE.Object3D();
  const qLean = new THREE.Quaternion();
  const qYaw = new THREE.Quaternion();
  const e = new THREE.Euler();
  const n = new THREE.Vector3();
  for (let slot = 0; slot < SLOTS_PER_AISLE; slot++) {
    const pose = slotPose(aisle, slot);
    for (let c = 0; c < S.copies; c++) {
      const i = slot * S.copies + c;
      const jit = (rnd(aisle * 1000 + slot, c) - 0.5) * 0.07;
      const dz = S.copies === 1 ? 0 : (c - 0.5) * (S.w + 0.012) + (rnd(slot, c + 9) - 0.5) * 0.012;
      const thick = def.shape === "book" ? S.d * (0.75 + rnd(slot, c + 3) * 0.9) : S.d;
      qLean.setFromEuler(e.set(0, 0, side * S.lean));
      // body
      d.position.set(ux + side * (0.2 + thick / 2), pose.y + S.h / 2 + 0.004, pose.z + dz);
      d.quaternion.copy(qLean).multiply(qYaw.setFromEuler(e.set(0, jit, 0)));
      d.scale.set(thick, S.h, S.w);
      d.updateMatrix();
      body.setMatrixAt(i, d.matrix);
      // cover face, sitting just proud of the body's outward face
      n.set(side, 0, 0).applyQuaternion(qLean);
      d.position.addScaledVector(n, thick / 2 + 0.003);
      d.quaternion.copy(qLean).multiply(qYaw.setFromEuler(e.set(0, side * Math.PI / 2 + jit, 0)));
      d.scale.set(S.w * 0.97, S.h * 0.97, 1);
      d.updateMatrix();
      front.setMatrixAt(i, d.matrix);
    }
    // shelf-edge label on the navy lip
    d.position.set(ux + side * 0.625, pose.y - 0.036, pose.z);
    d.quaternion.setFromEuler(e.set(0, side * Math.PI / 2, 0));
    d.scale.set(0.34, 0.085, 1);
    d.updateMatrix();
    label.setMatrixAt(slot, d.matrix);
  }
  [body, front, label].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    m.count = 0;
    m.frustumCulled = true;
  });
  body.castShadow = true;
  body.receiveShadow = true;
  return { aisle, shape: def.shape, S, side, ux, copies: S.copies, atlas, body, front, label, uvC, uvL, color, n: 0, wanted: 0 };
}

export function disposeRig(r) {
  [r.body, r.front, r.label].forEach((m) => {
    m.geometry.dispose();
    m.material.dispose();
    m.dispose();
  });
  disposeAtlas(r.atlas);
}

/** Remaps every instance to its tile after the aisle is (re)stocked. */
export function applyStock(rig, aisle, list) {
  const n = list.length;
  rig.n = n;
  rig.body.count = rig.front.count = n ? SLOTS_PER_AISLE * rig.copies : 0;
  rig.label.count = n ? SLOTS_PER_AISLE : 0;
  if (!n) return;
  paintAtlas(rig.atlas, aisle, list);
  const tint = new THREE.Color();
  for (let slot = 0; slot < SLOTS_PER_AISLE; slot++) {
    const t = tileOfSlot(slot, n);
    rig.uvL.set(tileUv(t), slot * 4);
    tint.set(TINTS[Math.floor(hash(list[t].brand || "") * TINTS.length)]);
    for (let c = 0; c < rig.copies; c++) {
      const i = slot * rig.copies + c;
      rig.uvC.set(tileUv(t), i * 4);
      rig.color.set([tint.r, tint.g, tint.b], i * 3);
    }
  }
  rig.uvC.needsUpdate = rig.uvL.needsUpdate = rig.color.needsUpdate = true;
  [rig.body, rig.front, rig.label].forEach((m) => m.computeBoundingSphere());
}

/** Repaints shelf labels: booklist items go navy, items already in the trolley go green. */
export function applyLabels(rig, list, booklist, cartItems) {
  if (!list.length) return;
  const wanted = new Set(booklist.filter((l) => l.product).map((l) => l.product.id));
  const inCart = new Set(cartItems.map((c) => c.variant_id));
  paintLabels(rig.atlas, list, (p) => ({
    booklist: wanted.has(p.id),
    inCart: p.isBundle ? p.items.every((i) => inCart.has(i.variantId)) : inCart.has(p.variantId),
  }));
}

/** Per-frame: upload dirty atlases, and fetch covers for facings near the shopper (nearest first). */
export function tickRig(rig, aisle, list, streaming) {
  flushAtlas(rig.atlas, performance.now());
  if (!streaming || !rig.n) return;
  const keep = new Set();
  const stamp = rig.atlas.version;
  for (let t = 0; t < rig.n; t++) {
    const p = list[t];
    if (!p?.cover || rig.atlas.state[t] !== 0) continue;
    const pose = slotPose(aisle, firstSlotOfTile(t, rig.n));
    const dist = Math.hypot(pose.x + rig.side * 0.6 - shopperPos.x, pose.z - shopperPos.z);
    if (dist > LOAD_RADIUS) continue;
    const key = `${aisle}:${t}:${stamp}`;
    keep.add(key);
    rig.atlas.state[t] = 1;
    requestCover(key, p.cover, dist, (img) => {
      if (rig.atlas.version !== stamp) return;
      if (img) {
        paintCover(rig.atlas, t, img, rig.shape);
        rig.atlas.state[t] = 2;
      } else rig.atlas.state[t] = 3;
    });
  }
  pruneCovers(`${aisle}:`, keep)
    .filter((k) => k.endsWith(":" + stamp))
    .forEach((k) => {
      const t = Number(k.split(":")[1]);
      if (rig.atlas.state[t] === 1) rig.atlas.state[t] = 0;
    });
}
