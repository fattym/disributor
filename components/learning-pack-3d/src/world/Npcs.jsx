import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import Character from "./Character.jsx";
import { shopperPos } from "./state.js";
import { WALK_X } from "../data/layout.js";
import { useShop } from "../store/useShop.js";

const TIPS = [
  "Karibu! Open the booklist to see what your child needs.",
  "Textbooks are in Aisle 1. Revision books are in Aisle 7.",
  "Pens, pencils and geometry sets are in Aisles 3 and 4.",
  "Tap any product on a shelf to see its price and add it to your trolley.",
  "Bundles in Aisle 8 save you walking the whole store.",
  "Ready to pay? Head to the checkout counters on the left.",
];
// Each NPC is dressed differently: kind, skin, clothes, hair and accessories.
const PEOPLE = [
  { kind: "woman", skin: "#8d5524", top: "#2563eb", bottom: "#1f2937", bottomType: "trousers", hairStyle: "bun", hair: "#1a1a1a", sleeve: "long" },
  { kind: "man", skin: "#c68642", top: "#16a34a", bottom: "#374151", hair: "#2b1a10", beard: true },
  { kind: "woman", skin: "#6b3e1f", top: "#ca8a04", bottom: "#7c2d12", hairStyle: "afro", hair: "#111", glasses: true },
  { kind: "man", skin: "#4a2c12", top: "#e5e7eb", bottom: "#1e3a8a", hairStyle: "bald", sleeve: "long", glasses: true },
  { kind: "woman", skin: "#d9a066", top: "#9333ea", bottom: "#0B1F3A", hairStyle: "long", hair: "#3b2314" },
  { kind: "man", skin: "#a0673a", top: "#dc2626", bottom: "#78716c", hair: "#111", bottomType: "shorts" },
  { kind: "boy", skin: "#7a4a26", top: "#f97316", bottom: "#1f3a5f", hair: "#111" },
  { kind: "girl", skin: "#9a6236", top: "#ec4899", bottom: "#4c1d95", hair: "#1a1a1a" },
  { kind: "woman", skin: "#c68642", top: "#0891b2", bottom: "#065f46", hairStyle: "long", hair: "#1a1a1a", sleeve: "none" },
  { kind: "man", skin: "#8d5524", top: "#7c3aed", bottom: "#1f2937", hair: "#1a1a1a", sleeve: "long" },
];
const KIDS = { boy: "Mum, can we get the geometry set too?", girl: "I want the pink notebook!" };
// Each shopper loops a pair of neighbouring walkways, up one and down the other.
const LOOPS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 2], [2, 4], [3, 4], [0, 1], [1, 3], [0, 4]];

function Shopper({ i }) {
  const [wa, wb] = LOOPS[i];
  const a = WALK_X[wa];
  const b = WALK_X[wb];
  const route = [[a, 4], [a, -16.5], [b, -16.5], [b, 4]];
  const g = useRef();
  const st = useRef({ k: 1, pause: 0 });
  const [moving, setMoving] = useState(true);
  const say = useShop((s) => s.say);

  useFrame((_, dt) => {
    const s = st.current;
    const o = g.current;
    const p = o.position;
    const gap = Math.hypot(p.x - shopperPos.x, p.z - shopperPos.z);
    const near = gap < 1.6;
    if (s.pause > 0) {
      s.pause -= dt;
      if (s.pause <= 0) setMoving(true);
      return;
    }
    const w = route[s.k];
    // step aside (rather than freeze) when the shopper is right there
    const aside = near ? Math.sign(p.x - shopperPos.x || 1) * 0.9 : 0;
    const dx = w[0] + aside - p.x;
    const dz = w[1] - p.z;
    const l = Math.hypot(dx, dz);
    if (l < 0.2) {
      s.k = (s.k + 1) % 4;
      s.pause = 1 + (i % 3) * 0.6;
      setMoving(false);
      return;
    }
    let df = Math.atan2(-dx, -dz) - o.rotation.y;
    df = Math.atan2(Math.sin(df), Math.cos(df));
    o.rotation.y += df * Math.min(1, dt * 6);
    const sp = (Math.abs(df) > 0.8 ? 0.3 : 1.3) * (near ? 0.6 : 1);
    p.x += (dx / l) * sp * dt;
    p.z += (dz / l) * sp * dt;
  });

  return (
    <group
      ref={g}
      position={[a, 0, 2 - i * 3.2]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta <= 6) say("💬 " + (KIDS[PEOPLE[i].kind] || TIPS[i % TIPS.length]));
      }}
    >
      <Character {...PEOPLE[i]} phase={i * 1.3} moving={moving} />
    </group>
  );
}

export default function Npcs() {
  const say = useShop((s) => s.say);
  return (
    <>
      {LOOPS.map((_, i) => (
        <Shopper key={i} i={i} />
      ))}
      {/* greeter by the door and cashier at lane 1 */}
      <group position={[-3.4, 0, 12.6]} onClick={() => say("💬 Karibu Learning Pack! Open the booklist to start.")}>
        <Character kind="woman" top="#E63B00" bottom="#0B1F3A" skin="#6b3e1f" hairStyle="bun" />
      </group>
      <group position={[-11.6, 0, 12.2]} onClick={() => say("💬 Ready to pay? Click the orange checkout sign.")}>
        <Character kind="man" top="#0B1F3A" bottom="#1f2937" skin="#8d5524" glasses />
      </group>
      {/* security guard at the entrance */}
      <group position={[3.4, 0, 12.6]} rotation={[0, 0.3, 0]} onClick={() => say("💬 Welcome! Trolleys are at the entrance.")}>
        <Character kind="man" top="#e5e7eb" bottom="#111827" skin="#4a2c12" hat badge="#E63B00" shoes="#111" sleeve="short" />
      </group>
      {/* shelf stocker */}
      <group position={[6.5, 0, -6]} rotation={[0, Math.PI / 2, 0]} onClick={() => say("💬 New stock just arrived in this aisle.")}>
        <Character kind="man" top="#f59e0b" bottom="#1f2937" skin="#a0673a" hat="#f59e0b" badge="#0B1F3A" shoes="#444" />
      </group>
      {/* mother and daughter browsing */}
      <group position={[-6.5, 0, -3]} rotation={[0, -1.2, 0]} onClick={() => say("💬 Which notebook do you like?")}>
        <Character kind="woman" top="#be185d" bottom="#1f2937" bottomType="trousers" skin="#c68642" hairStyle="long" phase={2} />
      </group>
      <group position={[-5.8, 0, -2.6]} rotation={[0, -1.2, 0]} onClick={() => say("💬 Mum, I want this one!")}>
        <Character kind="girl" top="#facc15" bottom="#0ea5e9" skin="#c68642" phase={4} />
      </group>
    </>
  );
}
