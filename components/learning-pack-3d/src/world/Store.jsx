import { useMemo } from "react";
import * as THREE from "three";
import { AISLES } from "../data/catalogue.js";
import { AISLE_WALK, STORE, WALK_X } from "../data/layout.js";
import { BRAND, FONT, ceilingTexture, fillBg, fitFont, floorTexture, signTexture, textSign, wallTexture } from "./textures.js";

const SIGN_W = 4.8;
const SIGN_H = 1.3;
const W = STORE.x1 - STORE.x0;
const D = STORE.zFront - STORE.zBack;
const H = STORE.height;
const CZ = (STORE.zFront + STORE.zBack) / 2;

function Box({ a, p, color = "#ffffff", rough = 0.7, metal = 0, ...rest }) {
  return (
    <mesh position={p} castShadow receiveShadow {...rest}>
      <boxGeometry args={a} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  );
}

/** Flat, unlit sign so lettering stays crisp under any lighting. */
export function Sign({ p, w, h, tex, ry = 0, double = false, ...rest }) {
  return (
    <group position={p} rotation={[0, ry, 0]} {...rest}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} side={double ? THREE.DoubleSide : THREE.FrontSide} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------------- aisle signs

/** Hanging walkway sign: the aisle on each side of the walkway, with a pointer toward it. */
function walkwayTexture(walk, flip) {
  const aisles = AISLES.filter((a, i) => AISLE_WALK[i] === walk).map((a) => ({ ...a, west: a.id % 2 === 1 }));
  // aisles facing +x (odd ids) have their shelves on the *west* of the walkway
  const west = aisles.find((a) => a.west);
  const east = aisles.find((a) => !a.west);
  const halves = flip ? [east, west] : [west, east];
  return signTexture(`walk|${walk}|${flip}`, SIGN_W, SIGN_H, (g, Wd, Ht) => {
    fillBg(g, Wd, Ht, BRAND.orange);
    g.fillStyle = "rgba(255,255,255,.35)";
    g.fillRect(Wd / 2 - 1.5, Ht * 0.14, 3, Ht * 0.72);
    halves.forEach((a, i) => {
      if (!a) return;
      const cx = i === 0 ? Wd * 0.25 : Wd * 0.75;
      // number badge
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(cx - Wd * 0.17, Ht * 0.5, Ht * 0.28, 0, 7);
      g.fill();
      g.fillStyle = BRAND.orange;
      g.textAlign = "center";
      g.font = `800 ${Ht * 0.38}px ${FONT}`;
      g.fillText(String(a.id + 1), cx - Wd * 0.17, Ht * 0.53);
      // name + arrow toward the shelf
      g.fillStyle = "#fff";
      g.textAlign = "left";
      const label = a.name;
      const s = fitFont(g, label, Wd * 0.3, Ht * 0.36, 800);
      g.font = `800 ${s}px ${FONT}`;
      g.fillText(label, cx - Wd * 0.1, Ht * 0.42);
      g.font = `700 ${Ht * 0.17}px ${FONT}`;
      g.globalAlpha = 0.9;
      g.fillText(i === 0 ? "◀  this side" : "this side  ▶", cx - Wd * 0.1, Ht * 0.7);
      g.globalAlpha = 1;
    });
  });
}

function WalkwaySign({ walk, z }) {
  const x = WALK_X[walk];
  const y = 3.75;
  const front = useMemo(() => walkwayTexture(walk, false), [walk]);
  const back = useMemo(() => walkwayTexture(walk, true), [walk]);
  return (
    <group position={[x, y, z]}>
      {[-2.05, 2.05].map((dx) => (
        <mesh key={dx} position={[dx, (H - y) / 2, 0]}>
          <cylinderGeometry args={[0.012, 0.012, H - y, 6]} />
          <meshStandardMaterial color="#9aa3b2" />
        </mesh>
      ))}
      <Sign p={[0, 0, 0.02]} w={SIGN_W} h={SIGN_H} tex={front} />
      <Sign p={[0, 0, -0.02]} w={SIGN_W} h={SIGN_H} tex={back} ry={Math.PI} />
      <Box a={[SIGN_W + 0.06, 0.08, 0.08]} p={[0, SIGN_H / 2, 0]} color={BRAND.navy} />
      <Box a={[SIGN_W + 0.06, 0.08, 0.08]} p={[0, -SIGN_H / 2, 0]} color={BRAND.navy} />
    </group>
  );
}

// -------------------------------------------------------------------- shell

function Floor() {
  const map = useMemo(() => floorTexture(), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, CZ]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={map} roughness={0.22} metalness={0.04} envMapIntensity={0.55} />
      </mesh>
      {/* welcome mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, STORE.zFront - 1.1]}>
        <planeGeometry args={[6.4, 1.8]} />
        <meshBasicMaterial map={textSign("KARIBU · WELCOME", 6.4, 1.8, { bg: BRAND.navy, accent: BRAND.orange })} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Ceiling() {
  const map = useMemo(() => ceilingTexture(), []);
  const rows = WALK_X;
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, CZ]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={map} roughness={0.95} />
      </mesh>
      {/* LED strip fixtures over every walkway, plus the entrance plaza */}
      {rows.map((x) => (
        <mesh key={x} position={[x, H - 0.05, -3.2]}>
          <boxGeometry args={[0.26, 0.07, 28]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
      {[-9, -2, 5].map((z) => (
        <mesh key={z} position={[0, H - 0.05, z + 12.5]}>
          <boxGeometry args={[26, 0.07, 0.26]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
      {[-12, -3.5, 5, 11].map((z) => (
        <Box key={z} a={[W, 0.34, 0.45]} p={[0, H - 0.2, z]} color={BRAND.navy} rough={0.6} />
      ))}
    </group>
  );
}

function Walls() {
  const wall = useMemo(() => wallTexture(), []);
  const mat = <meshStandardMaterial map={wall} roughness={0.9} />;
  const posters = useMemo(
    () => [
      textSign("BACK TO SCHOOL", 3.6, 1.3, { bg: BRAND.navy, accent: BRAND.orange, sub: "Shop your child's booklist" }),
      textSign("CBC TEXTBOOKS", 3.6, 1.3, { bg: BRAND.orange, sub: "From Kenya's leading publishers" }),
      textSign("FREE PICKUP", 3.6, 1.3, { bg: BRAND.navy, accent: BRAND.orange, sub: "Or delivery in Nairobi, 1–2 days" }),
    ],
    []
  );
  const welcome = useMemo(() => textSign("Everything Your Child\nNeeds for School", 11, 2.5, { bg: BRAND.navy, accent: BRAND.orange }), []);
  return (
    <group>
      {/* back wall */}
      <mesh position={[0, H / 2, STORE.zBack]} receiveShadow>
        <planeGeometry args={[W, H]} />
        {mat}
      </mesh>
      <Sign p={[0, 3.9, STORE.zBack + 0.05]} w={11} h={2.5} tex={welcome} />
      {/* side walls with posters */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * STORE.x1, H / 2, CZ]} rotation={[0, -s * Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[D, H]} />
            {mat}
          </mesh>
          {[-11, -3, 5].map((z, i) => (
            <Sign key={z} p={[s * (STORE.x1 - 0.05), 3.5, z]} w={3.6} h={1.3} ry={-s * Math.PI / 2} tex={posters[(i + (s > 0 ? 1 : 0)) % 3]} />
          ))}
        </group>
      ))}
      <Storefront />
    </group>
  );
}

function Storefront() {
  const z = STORE.zFront;
  const entrance = 4.6;
  const sideW = STORE.x1 - entrance;
  const outside = useMemo(() => textSign("LEARNING PACK", 9, 1.6, { bg: BRAND.navy, accent: BRAND.orange, sub: "School books & supplies · Karibu" }), []);
  const exit = useMemo(() => textSign("EXIT  ➜", 2.2, 0.7, { bg: "#0f7a3d" }), []);
  return (
    <group>
      {[-1, 1].map((s) => {
        const cx = s * (entrance + sideW / 2);
        return (
          <group key={s}>
            <Box a={[sideW, 1.0, 0.3]} p={[cx, 0.5, z]} color="#f6f7f9" />
            <Box a={[sideW, 1.8, 0.3]} p={[cx, 5.3, z]} color="#f6f7f9" />
            <mesh position={[cx, 2.9, z]}>
              <planeGeometry args={[sideW, 3.4]} />
              <meshPhysicalMaterial color="#d6ecff" transparent opacity={0.16} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            {[0.25, 0.5, 0.75].map((f) => (
              <Box key={f} a={[0.1, 3.4, 0.14]} p={[s * (entrance + sideW * f), 2.9, z]} color={BRAND.navy} />
            ))}
          </group>
        );
      })}
      {/* entrance portal */}
      <Box a={[entrance * 2, 1.8, 0.3]} p={[0, 5.3, z]} color={BRAND.navy} />
      <Box a={[0.3, 4.4, 0.4]} p={[-entrance, 2.9, z]} color={BRAND.navy} />
      <Box a={[0.3, 4.4, 0.4]} p={[entrance, 2.9, z]} color={BRAND.navy} />
      <Sign p={[0, 5.3, z + 0.17]} w={9} h={1.6} tex={outside} />
      <Box a={[entrance * 2 - 0.3, 0.12, 0.4]} p={[0, 4.5, z]} color={BRAND.orange} />
      {/* exit over the left glazing */}
      <Sign p={[-9.4, 4.05, z - 0.18]} w={2.2} h={0.7} tex={exit} ry={Math.PI} />
    </group>
  );
}

export default function Store() {
  return (
    <group>
      <Floor />
      <Ceiling />
      <Walls />
      {[0, 1, 2, 3, 4].map((w) => (
        <group key={w}>
          <WalkwaySign walk={w} z={0.4} />
          <WalkwaySign walk={w} z={-9.5} />
        </group>
      ))}
    </group>
  );
}
