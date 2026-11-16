import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSupermarketStore } from "@/lib/store/supermarketStore";
import { AISLES } from "../data/catalogue.js";
import { UNIT_W, UNIT_X, UNIT_Z, LEVELS, firstSlotOfTile, slotPose, tileOfSlot } from "../data/layout.js";
import { useShop } from "../store/useShop.js";
import { lowEnd } from "./state.js";
import { GAP, applyLabels, applyStock, disposeRig, makeRig, tickRig } from "./rig.js";
import { BRAND, blobTexture, textSign } from "./textures.js";

/** Outline around one facing, used for hover and selection. */
function Outline({ rig, slot, color, opacity = 0.2 }) {
  const pose = slotPose(rig.aisle, slot);
  const { S, side, ux } = rig;
  const w = GAP * 0.94;
  const h = S.h + 0.07;
  const dep = S.d + 0.1;
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  useEffect(() => () => edges.dispose(), [edges]);
  return (
    <group position={[ux + side * (0.2 + dep / 2 - 0.02), pose.y + h / 2 - 0.02, pose.z]} scale={[dep, h, w]}>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={color} toneMapped={false} />
      </lineSegments>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function AisleStock({ aisle, small }) {
  const list = useShop((s) => s.stock[aisle]);
  const version = useShop((s) => s.stockVersion);
  const booklist = useShop((s) => s.booklist);
  const cartItems = useSupermarketStore((s) => s.cartItems);
  const select = useShop((s) => s.select);
  const setHover = useShop((s) => s.setHover);
  const selectedTile = useShop((s) => (s.selected ? s.stock[aisle].findIndex((p) => p.id === s.selected.id) : -1));
  const rig = useMemo(() => makeRig(aisle, small), [aisle, small]);
  const [hoverSlot, setHoverSlot] = useState(-1);
  const acc = useRef(0);
  const last = useRef(-1);

  useEffect(() => () => disposeRig(rig), [rig]);

  // Restock: repaint placeholders and remap every instance to its tile.
  useLayoutEffect(() => {
    applyStock(rig, aisle, list);
    last.current = -1;
  }, [rig, list, version, aisle]);

  // Labels reflect the booklist and the trolley, so they are repainted whenever either changes.
  useLayoutEffect(() => {
    applyLabels(rig, list, booklist, cartItems);
  }, [rig, list, version, booklist, cartItems]);

  useFrame((_, dt) => {
    acc.current += dt;
    const poll = acc.current > 0.45;
    if (poll) acc.current = 0;
    tickRig(rig, aisle, list, poll);
  });

  const slotOf = (e) => Math.floor(e.instanceId / rig.copies);
  const productAt = (slot) => list[tileOfSlot(slot, rig.n)];

  return (
    <group>
      <primitive object={rig.body} />
      <primitive
        object={rig.front}
        onPointerMove={(e) => {
          e.stopPropagation();
          const slot = slotOf(e);
          if (slot === last.current) return;
          last.current = slot;
          setHoverSlot(slot);
          setHover(productAt(slot) || null);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          last.current = -1;
          setHoverSlot(-1);
          setHover(null);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 6) return;
          const p = productAt(slotOf(e));
          if (p) select(p);
        }}
      />
      <primitive object={rig.label} />
      {hoverSlot >= 0 && <Outline rig={rig} slot={hoverSlot} color="#FFFFFF" opacity={0.12} />}
      {selectedTile >= 0 && <Outline rig={rig} slot={firstSlotOfTile(selectedTile, list.length)} color={BRAND.orange} opacity={0.18} />}
    </group>
  );
}

/** Instanced helper for repeated static boxes (shelf boards, lips, uprights). */
function Boxes({ items, color, rough = 0.6, metal = 0, shadow = true }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    items.forEach(([p, s], i) => {
      d.position.set(...p);
      d.scale.set(...s);
      d.updateMatrix();
      ref.current.setMatrixAt(i, d.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow={shadow} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </instancedMesh>
  );
}

function Gondolas() {
  const zc = (UNIT_Z[0] + UNIT_Z[1]) / 2;
  const len = UNIT_Z[1] - UNIT_Z[0];
  const { boards, lips, posts } = useMemo(() => {
    const boards = [];
    const lips = [];
    const posts = [];
    UNIT_X.forEach((ux) => {
      [-1, 1].forEach((side) => {
        LEVELS.forEach((y) => {
          boards.push([[ux + side * 0.33, y - 0.02, zc], [0.6, 0.04, len - 0.2]]);
          lips.push([[ux + side * 0.625, y - 0.035, zc], [0.03, 0.09, len - 0.2]]);
        });
        for (let z = UNIT_Z[0] + 0.1; z <= UNIT_Z[1]; z += len / 5) posts.push([[ux + side * 0.64, 1.25, z], [0.05, 2.5, 0.06]]);
      });
    });
    return { boards, lips, posts };
  }, [zc, len]);
  const blob = useMemo(() => blobTexture(), []);

  return (
    <group>
      {UNIT_X.map((ux, u) => (
        <group key={ux}>
          <mesh position={[ux, 0.06, zc]} castShadow receiveShadow>
            <boxGeometry args={[UNIT_W, 0.12, len]} />
            <meshStandardMaterial color={BRAND.navy} roughness={0.5} />
          </mesh>
          <mesh position={[ux, 1.25, zc]} castShadow receiveShadow>
            <boxGeometry args={[0.07, 2.5, len]} />
            <meshStandardMaterial color="#d3d9e2" roughness={0.8} />
          </mesh>
          <mesh position={[ux, 2.54, zc]} castShadow>
            <boxGeometry args={[UNIT_W, 0.16, len]} />
            <meshStandardMaterial color={BRAND.navy} roughness={0.5} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[ux + s * 0.665, 2.54, zc]}>
              <boxGeometry args={[0.02, 0.17, len + 0.02]} />
              <meshStandardMaterial color={BRAND.orange} roughness={0.5} />
            </mesh>
          ))}
          {/* end panels; the entrance-side one carries the aisle numbers */}
          <mesh position={[ux, 1.3, UNIT_Z[0]]} castShadow>
            <boxGeometry args={[UNIT_W, 2.6, 0.1]} />
            <meshStandardMaterial color={BRAND.navy} roughness={0.5} />
          </mesh>
          <mesh position={[ux, 1.3, UNIT_Z[1]]} castShadow>
            <boxGeometry args={[UNIT_W, 2.6, 0.1]} />
            <meshStandardMaterial color={BRAND.navy} roughness={0.5} />
          </mesh>
          <mesh position={[ux, 1.72, UNIT_Z[1] + 0.056]}>
            <planeGeometry args={[UNIT_W - 0.14, 1.0]} />
            <meshBasicMaterial map={textSign(`${u * 2 + 1}  ·  ${u * 2 + 2}`, UNIT_W - 0.14, 1.0, { bg: BRAND.orange, sub: `${AISLES[u * 2].name} / ${AISLES[u * 2 + 1].name}` })} toneMapped={false} />
          </mesh>
          <mesh position={[ux, 0.005, zc]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[UNIT_W + 2.4, len + 2.2]} />
            <meshBasicMaterial map={blob} transparent opacity={0.55} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <Boxes items={boards} color="#e6e9ee" rough={0.45} />
      <Boxes items={lips} color={BRAND.navy} rough={0.45} />
      <Boxes items={posts} color={BRAND.navy} rough={0.4} metal={0.3} />
    </group>
  );
}

export default function Shelves() {
  const small = useMemo(() => lowEnd(), []);
  return (
    <group>
      <Gondolas />
      {AISLES.map((a) => (
        <AisleStock key={a.id} aisle={a.id} small={small} />
      ))}
    </group>
  );
}
