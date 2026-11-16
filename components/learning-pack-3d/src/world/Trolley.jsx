import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useCart } from "../store/useShop.js";
import { BRAND, makeCanvas, toTexture } from "./textures.js";

const COLORS = ["#2563eb", "#E63B00", "#16a34a", "#9333ea", "#ca8a04", "#0891b2", "#dc2626", "#ffffff"];

function wireTexture() {
  const c = makeCanvas(64, 64);
  const g = c.getContext("2d");
  g.strokeStyle = "#cfd5de";
  g.lineWidth = 4;
  g.strokeRect(0, 0, 64, 64);
  g.beginPath();
  g.moveTo(32, 0);
  g.lineTo(32, 64);
  g.moveTo(0, 32);
  g.lineTo(64, 32);
  g.lineWidth = 2;
  g.stroke();
  const t = toTexture(c, { repeat: [5, 3], anisotropy: 4 });
  return t;
}

/** Wire shopping trolley that visibly fills as the cart grows. Origin is the shopper's hands. */
export default function Trolley() {
  const cart = useCart();
  const items = useRef();
  const wire = useMemo(() => wireTexture(), []);
  const n = Math.min(cart.count, 18);

  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < 18; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3) % 3;
      const layer = Math.floor(i / 9);
      d.position.set(-0.19 + col * 0.19, 0.5 + layer * 0.13 + 0.06, -0.3 + row * 0.26);
      d.rotation.set(0, (i * 37 % 20) * 0.01, 0);
      d.scale.set(0.17, 0.12, 0.22);
      d.updateMatrix();
      items.current.setMatrixAt(i, d.matrix);
      items.current.setColorAt(i, c.set(COLORS[i % COLORS.length]));
    }
    items.current.instanceMatrix.needsUpdate = true;
    items.current.instanceColor.needsUpdate = true;
  }, []);
  useLayoutEffect(() => {
    items.current.count = n;
  }, [n]);

  const panel = (size, pos, rot) => (
    <mesh position={pos} rotation={rot}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={wire} transparent alphaTest={0.3} side={THREE.DoubleSide} metalness={0.5} roughness={0.4} color="#dfe4ec" />
    </mesh>
  );
  return (
    <group position={[0, 0, -1.0]}>
      {panel([0.66, 0.96], [0, 0.46, 0], [-Math.PI / 2, 0, 0])}
      {panel([0.96, 0.4], [-0.33, 0.66, 0], [0, Math.PI / 2, 0])}
      {panel([0.96, 0.4], [0.33, 0.66, 0], [0, Math.PI / 2, 0])}
      {panel([0.66, 0.4], [0, 0.66, -0.48], [0, 0, 0])}
      {panel([0.66, 0.4], [0, 0.66, 0.48], [0, 0, 0])}
      <instancedMesh ref={items} args={[undefined, undefined, 18]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      {/* chassis, handle and wheels */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.03, 0.9]} />
        <meshStandardMaterial color="#9aa3b2" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.02, 0.5]} castShadow>
        <boxGeometry args={[0.7, 0.045, 0.045]} />
        <meshStandardMaterial color={BRAND.orange} roughness={0.5} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.78, 0.49]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.03, 0.5, 0.03]} />
          <meshStandardMaterial color="#9aa3b2" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {[[-0.27, -0.4], [0.27, -0.4], [-0.27, 0.4], [0.27, 0.4]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.08, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 14]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, -0.482]}>
        <planeGeometry args={[0.3, 0.1]} />
        <meshBasicMaterial color={BRAND.orange} />
      </mesh>
    </group>
  );
}
