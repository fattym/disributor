import { useEffect, useMemo } from "react";
import { cartSnapshot, useCart, useShop } from "../store/useShop.js";
import { kes } from "../data/catalogue.js";
import { Sign } from "./Store.jsx";
import { BRAND, FONT, makeCanvas, roundRect, textSign, toTexture } from "./textures.js";

const LANES = [-11.6, -7.4];
const Z = 10.6;

function drawPos(canvas, tex, count, subtotal, live) {
  const g = canvas.getContext("2d");
  g.fillStyle = BRAND.navy;
  g.fillRect(0, 0, 512, 320);
  g.fillStyle = BRAND.orange;
  g.fillRect(0, 0, 512, 56);
  g.fillStyle = "#fff";
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.font = `800 28px ${FONT}`;
  g.fillText("Learning Pack", 20, 29);
  g.textAlign = "right";
  g.font = `600 22px ${FONT}`;
  g.fillText(live ? "LANE 1" : "LANE 2", 492, 29);
  g.textAlign = "center";
  if (live) {
    g.font = `600 26px ${FONT}`;
    g.fillStyle = "#ffb089";
    g.fillText(count ? `${count} item${count > 1 ? "s" : ""}` : "Your trolley is empty", 256, 110);
    g.fillStyle = "#fff";
    g.font = `800 64px ${FONT}`;
    g.fillText(kes(subtotal), 256, 186);
    g.fillStyle = BRAND.orange;
    roundRect(g, 96, 232, 320, 54, 12);
    g.fill();
    g.fillStyle = "#fff";
    g.font = `800 26px ${FONT}`;
    g.fillText("Pay with M-Pesa", 256, 260);
  } else {
    g.fillStyle = "#fff";
    g.font = `800 44px ${FONT}`;
    g.fillText("Lane open", 256, 160);
    g.font = `600 24px ${FONT}`;
    g.fillStyle = "#ffb089";
    g.fillText("Please use lane 1", 256, 220);
  }
  tex.needsUpdate = true;
}

/** Customer-facing payment display. Lane 1 mirrors the live trolley total. */
function PosScreen({ live }) {
  const cart = useCart();
  const { canvas, tex } = useMemo(() => {
    const canvas = makeCanvas(512, 320);
    return { canvas, tex: toTexture(canvas, { anisotropy: 4 }) };
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  useEffect(() => {
    drawPos(canvas, tex, cart.count, cart.subtotal, live);
  }, [cart.count, cart.subtotal, live, canvas, tex]);
  return (
    <group position={[0, 1.42, 0]} rotation={[0.25, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.62, 0.42, 0.04]} />
        <meshStandardMaterial color="#111827" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.56, 0.35]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Counter({ x, live, index }) {
  const laneTex = useMemo(() => textSign(String(index + 1), 0.7, 0.7, { bg: BRAND.navy, accent: BRAND.orange }), [index]);
  return (
    <group position={[x, 0, Z]}>
      <mesh position={[0, 0.475, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.95, 1.0]} />
        <meshStandardMaterial color={BRAND.navy} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.98, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.3, 0.05, 1.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.5, -0.505]}>
        <boxGeometry args={[3.2, 0.22, 0.02]} />
        <meshStandardMaterial color={BRAND.orange} roughness={0.5} />
      </mesh>
      {/* conveyor belt */}
      <mesh position={[-0.55, 1.015, 0]}>
        <boxGeometry args={[1.7, 0.03, 0.6]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      {/* barcode scanner with its red scan line */}
      <mesh position={[0.55, 1.05, 0.05]} castShadow>
        <boxGeometry args={[0.34, 0.08, 0.28]} />
        <meshStandardMaterial color="#111827" roughness={0.4} />
      </mesh>
      <mesh position={[0.55, 1.093, 0.05]}>
        <boxGeometry args={[0.26, 0.004, 0.012]} />
        <meshBasicMaterial color="#ff2a1a" toneMapped={false} />
      </mesh>
      <group position={[1.1, 0.98, 0.15]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <PosScreen live={live} />
      </group>
      {/* bagging area: a little table with carrier bags */}
      <group position={[1.95, 0, 0]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[0.75, 0.05, 0.8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.7, 0.7, 0.75]} />
          <meshStandardMaterial color={BRAND.navy} />
        </mesh>
        {[-0.2, 0.05, 0.28].map((dx, i) => (
          <mesh key={dx} position={[dx, 0.9 + (i % 2) * 0.02, 0]} castShadow>
            <boxGeometry args={[0.22, 0.34, 0.16]} />
            <meshStandardMaterial color={i === 1 ? "#ffffff" : BRAND.orange} roughness={0.8} />
          </mesh>
        ))}
      </group>
      <Sign p={[0, 2.55, -0.2]} w={0.7} h={0.7} tex={laneTex} />
      <Sign p={[0, 2.55, -0.21]} w={0.7} h={0.7} tex={laneTex} ry={Math.PI} />
    </group>
  );
}

export default function CheckoutArea() {
  const say = useShop((s) => s.say);
  const tex = useMemo(() => textSign("PROCEED TO CHECKOUT  ▼", 4.6, 1.0, { bg: BRAND.orange, accent: BRAND.navy }), []);
  const open = (e) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    if (!cartSnapshot().count) {
      say("Add something to your trolley first");
      return;
    }
    window.location.assign("/cart/"); // the one checkout
  };
  const pointer = (on) => () => (document.body.style.cursor = on ? "pointer" : "");
  return (
    <group>
      {LANES.map((x, i) => (
        <Counter key={x} x={x} live={i === 0} index={i} />
      ))}
      <group position={[-9.5, 3.7, 8.6]} onClick={open} onPointerOver={pointer(true)} onPointerOut={pointer(false)}>
        {[-2, 2].map((dx) => (
          <mesh key={dx} position={[dx, 1.25, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 2.5, 6]} />
            <meshStandardMaterial color="#9aa3b2" />
          </mesh>
        ))}
        <Sign p={[0, 0, 0.02]} w={4.6} h={1.0} tex={tex} />
        <Sign p={[0, 0, -0.02]} w={4.6} h={1.0} tex={tex} ry={Math.PI} />
      </group>
    </group>
  );
}
