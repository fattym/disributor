import { DELIVERY_NOTE, SHOP_HOURS, WHATSAPP_NUMBERS } from '@/lib/shopText';
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useShop } from "../store/useShop.js";
import { Sign } from "./Store.jsx";
import { BRAND, FONT, signTexture, textSign } from "./textures.js";

const PILE_COLORS = ["#2563eb", "#E63B00", "#16a34a", "#9333ea", "#ca8a04", "#0891b2", "#dc2626", "#0B1F3A"];

/** Stacks of books on a display table, drawn as one instanced mesh. */
function Piles({ origin, cols = 4, rows = 2, size = [1, 0.8], seed = 1 }) {
  const ref = useRef();
  const count = cols * rows * 5;
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        const cx = origin[0] + (k - (cols - 1) / 2) * (size[0] / cols) * 1.0;
        const cz = origin[2] + (r - (rows - 1) / 2) * (size[1] / rows) * 1.05;
        const base = ((k + r * cols + seed) * 7) % PILE_COLORS.length;
        for (let h = 0; h < 5; h++, i++) {
          d.position.set(cx + Math.sin(h * 2.1 + k) * 0.015, origin[1] + 0.03 + h * 0.045, cz);
          d.rotation.set(0, Math.sin(i * 1.7) * 0.12, 0);
          d.scale.set(0.5, 0.04, 0.38);
          d.updateMatrix();
          ref.current.setMatrixAt(i, d.matrix);
          ref.current.setColorAt(i, c.set(PILE_COLORS[(base + (h % 2)) % PILE_COLORS.length]));
        }
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, [origin, cols, rows, size, seed]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  );
}

function DisplayTable({ x, z, title, sub, seed, onSign }) {
  const tex = useMemo(() => title && textSign(title, 3.6, 0.9, { bg: BRAND.orange, sub }), [title, sub]);
  const pointer = (on) => () => (document.body.style.cursor = on ? "pointer" : "");
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.8, 2.2]} />
        <meshStandardMaterial color={BRAND.navy} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.83, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.92, 0.06, 2.32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 1.12]}>
        <boxGeometry args={[3.8, 0.12, 0.02]} />
        <meshStandardMaterial color={BRAND.orange} />
      </mesh>
      <Piles origin={[0, 0.86, 0]} size={[3.4, 1.9]} seed={seed} />
      {title && (
        <>
        {/* header board on two poles, clickable to walk to that aisle */}
        {[-1.6, 1.6].map((dx) => (
          <mesh key={dx} position={[dx, 1.5, -0.9]}>
            <cylinderGeometry args={[0.025, 0.025, 1.4, 8]} />
            <meshStandardMaterial color={BRAND.navy} />
          </mesh>
        ))}
        <group
          position={[0, 2.15, -0.9]}
          onClick={(e) => {
            e.stopPropagation();
            if (e.delta <= 6) onSign();
          }}
          onPointerOver={pointer(true)}
          onPointerOut={pointer(false)}
        >
          <Sign p={[0, 0, 0.02]} w={3.6} h={0.9} tex={tex} />
          <Sign p={[0, 0, -0.02]} w={3.6} h={0.9} tex={tex} ry={Math.PI} />
        </group>
        </>
      )}
    </group>
  );
}

/** Splits text into lines of at most `max` characters, on spaces. */
const wrap = (text, max = 34) =>
  text.split(" ").reduce((lines, word) => {
    const last = lines[lines.length - 1];
    if (last && `${last} ${word}`.length <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
    return lines;
  }, []);

function infoTexture() {
  return signTexture("info", 2.2, 1.7, (g, W, H) => {
    g.fillStyle = BRAND.navy;
    g.fillRect(0, 0, W, H);
    g.fillStyle = BRAND.orange;
    g.fillRect(0, 0, W, H * 0.17);
    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.font = `800 ${H * 0.11}px ${FONT}`;
    g.fillText("STORE INFORMATION", W / 2, H * 0.09);
    // [heading, text]: the shared wording, wrapped to the board
    const rows = [
      ...wrap(SHOP_HOURS).map((v, i) => [i ? "" : "Hours", v]),
      ...WHATSAPP_NUMBERS.map((n, i) => [i ? "" : "WhatsApp", n.label]),
      ...wrap(DELIVERY_NOTE).map((v, i) => [i ? "" : "Delivery", v]),
      ...wrap("With M-Pesa after we confirm your order on WhatsApp").map((v, i) => [i ? "" : "Pay", v]),
    ];
    const step = (H * 0.76) / rows.length;
    rows.forEach(([k, v], i) => {
      const y = H * 0.23 + i * step;
      g.textAlign = "left";
      g.fillStyle = "#ffb089";
      g.font = `700 ${step * 0.75}px ${FONT}`;
      g.fillText(k, W * 0.05, y);
      g.fillStyle = "#fff";
      g.font = `600 ${step * 0.8}px ${FONT}`;
      g.fillText(v, W * 0.31, y, W * 0.66);
    });
  });
}

function InfoKiosk() {
  const tex = useMemo(() => infoTexture(), []);
  return (
    <group position={[11.2, 0, 12]}>
      {[-0.95, 0.95].map((dx) => (
        <mesh key={dx} position={[dx, 0.9, 0]} castShadow>
          <boxGeometry args={[0.08, 1.8, 0.1]} />
          <meshStandardMaterial color={BRAND.navy} />
        </mesh>
      ))}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.3, 1.78, 0.08]} />
        <meshStandardMaterial color={BRAND.navy} />
      </mesh>
      <Sign p={[0, 1.6, 0.05]} w={2.2} h={1.7} tex={tex} />
      <Sign p={[0, 1.6, -0.05]} w={2.2} h={1.7} tex={tex} ry={Math.PI} />
    </group>
  );
}

function Baskets() {
  const tex = useMemo(() => textSign("BASKETS", 0.8, 0.3, { bg: BRAND.navy }), []);
  return (
    <group position={[-4.9, 0, 13]}>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[0, 0.12 + i * 0.1, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.16, 0.38]} />
            <meshStandardMaterial color={BRAND.orange} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.085, 0]}>
            <boxGeometry args={[0.58, 0.02, 0.41]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
      <Sign p={[0, 1.15, 0]} w={0.8} h={0.3} tex={tex} />
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.1, 6]} />
        <meshStandardMaterial color={BRAND.navy} />
      </mesh>
    </group>
  );
}

export default function Plaza() {
  const goToAisle = useShop((s) => s.goToAisle);
  return (
    <group>
      <DisplayTable x={6.2} z={8.5} seed={1} />
      <DisplayTable x={11.6} z={8.5} title="BUNDLES & BOOKLISTS" sub="Save time · Aisle 8" seed={3} onSign={() => goToAisle(7)} />
      <InfoKiosk />
      <Baskets />
    </group>
  );
}
