import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, CylinderGeometry, LatheGeometry, MathUtils, MeshStandardMaterial, SphereGeometry, BoxGeometry, TorusGeometry, Vector2 } from "three";

/**
 * Anatomical low-poly people (man / woman / boy / girl), procedurally animated, no model files.
 * Body parts are tapered lathe profiles (muscle/curve shape), clothing is layered over bare skin.
 * Geometry + materials are shared by every instance so many NPCs stay cheap.
 */
const lathe = (pts, seg = 24) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), seg);
const sph = new SphereGeometry(1, 24, 18);
const ball = new SphereGeometry(1, 16, 12);
const box = new BoxGeometry(1, 1, 1);

// every limb's origin is its joint (top), so clothing overlays just scale down from the joint
const G = {
  torsoF: lathe([[0, 0.8], [0.16, 0.81], [0.19, 0.9], [0.165, 1.04], [0.145, 1.12], [0.165, 1.22], [0.19, 1.3], [0.18, 1.4], [0.125, 1.47], [0.05, 1.52], [0, 1.53]]),
  torsoM: lathe([[0, 0.8], [0.17, 0.81], [0.185, 0.9], [0.175, 1.04], [0.18, 1.14], [0.205, 1.28], [0.215, 1.36], [0.19, 1.43], [0.13, 1.48], [0.055, 1.52], [0, 1.53]]),
  torsoK: lathe([[0, 0.8], [0.15, 0.81], [0.165, 0.92], [0.155, 1.1], [0.165, 1.25], [0.17, 1.38], [0.12, 1.46], [0.05, 1.5], [0, 1.51]]),
  hipsF: lathe([[0, 0.78], [0.17, 0.79], [0.195, 0.87], [0.17, 1.0], [0, 1.0]]),
  hipsM: lathe([[0, 0.78], [0.17, 0.79], [0.185, 0.87], [0.18, 1.0], [0, 1.0]]),
  skirt: lathe([[0.17, 0.5], [0.24, 0.5], [0.3, 0.52], [0.2, 0.85], [0.185, 1.02], [0.16, 1.02]]),
  thigh: lathe([[0, -0.4], [0.055, -0.39], [0.066, -0.3], [0.082, -0.14], [0.092, -0.03], [0.085, 0.03], [0, 0.04]], 16),
  shin: lathe([[0, -0.4], [0.034, -0.39], [0.045, -0.34], [0.064, -0.2], [0.066, -0.1], [0.056, 0], [0, 0.01]], 16),
  upperArm: lathe([[0, -0.3], [0.042, -0.29], [0.048, -0.2], [0.056, -0.08], [0.06, 0.0], [0.055, 0.04], [0, 0.05]], 16),
  foreArm: lathe([[0, -0.29], [0.028, -0.28], [0.034, -0.22], [0.045, -0.1], [0.048, -0.02], [0.04, 0.02], [0, 0.03]], 16),
  neck: lathe([[0, 0], [0.042, 0], [0.046, 0.08], [0.05, 0.14], [0, 0.14]], 16),
  hairBack: lathe([[0, -0.28], [0.06, -0.27], [0.15, -0.1], [0.18, 0.05], [0.17, 0.2], [0, 0.22]]),
  braid: lathe([[0, -0.3], [0.025, -0.29], [0.04, -0.1], [0.045, 0.1], [0, 0.12]], 12),
  glasses: new TorusGeometry(0.035, 0.005, 5, 12),
  belt: new CylinderGeometry(0.18, 0.18, 0.035, 14),
  capTop: new SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
};

const mats = new Map();
const M = (c, r = 0.75, side) => {
  const k = `${c}|${r}|${side || 0}`;
  if (!mats.has(k)) mats.set(k, new MeshStandardMaterial({ color: c, roughness: r, side }));
  return mats.get(k);
};

const PRESETS = {
  woman: { s: 1, sx: 1, head: 1, torso: G.torsoF, hips: G.hipsF, hair: "long", bottom: "skirt", sleeve: "short", feminine: true, shoulder: 0.25 },
  man: { s: 1.05, sx: 1.12, head: 1, torso: G.torsoM, hips: G.hipsM, hair: "short", bottom: "trousers", sleeve: "short", feminine: false, shoulder: 0.28 },
  girl: { s: 0.68, sx: 0.95, head: 1.28, torso: G.torsoK, hips: G.hipsF, hair: "pigtails", bottom: "skirt", sleeve: "short", feminine: true, shoulder: 0.2 },
  boy: { s: 0.72, sx: 0.95, head: 1.24, torso: G.torsoK, hips: G.hipsM, hair: "short", bottom: "shorts", sleeve: "short", feminine: false, shoulder: 0.2 },
};

export default function Character({
  kind = "woman",
  top, shirt = "#E63B00",
  bottom, pants = "#0B1F3A",
  skin = "#8d5524",
  hair = "#1a1a1a",
  hairStyle,
  bottomType,
  sleeve,
  beard = false,
  glasses = false,
  hat = false,
  badge,
  shoes = "#f4f4f4",
  moving = false,
  pushing = false,
  phase = 0,
}) {
  const P = PRESETS[kind] || PRESETS.woman;
  const topC = top || shirt;
  const botC = bottom || pants;
  const bt = bottomType || P.bottom;
  const sl = sleeve || P.sleeve;
  const hs = hairStyle || P.hair;
  const dress = bt === "skirt";

  const hips = useRef(), torso = useRef(), head = useRef(), eyes = useRef();
  const legL = useRef(), legR = useRef(), shinL = useRef(), shinR = useRef();
  const armL = useRef(), armR = useRef(), foreL = useRef(), foreR = useRef();
  const t = useRef(phase);
  const clock = useRef(phase * 3);
  const blink = useRef(2 + (phase % 3));

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const L = MathUtils.lerp;
    const k = Math.min(1, dt * 12);
    clock.current += dt;
    if (moving) t.current += dt * 7.5;
    const s = moving ? Math.sin(t.current) : 0;
    const c = clock.current;

    legL.current.rotation.x = L(legL.current.rotation.x, s * 0.65, k);
    legR.current.rotation.x = L(legR.current.rotation.x, -s * 0.65, k);
    shinL.current.rotation.x = L(shinL.current.rotation.x, moving ? -Math.max(0, -s) * 0.9 : 0, k);
    shinR.current.rotation.x = L(shinR.current.rotation.x, moving ? -Math.max(0, s) * 0.9 : 0, k);

    // pushing: forward (+x rot) with elbows bent so the hands land on the trolley handle
    const idle = Math.sin(c * 1.6) * 0.04;
    armL.current.rotation.x = L(armL.current.rotation.x, pushing ? 0.75 : -s * 0.5, k);
    armR.current.rotation.x = L(armR.current.rotation.x, pushing ? 0.75 : s * 0.5, k);
    armL.current.rotation.z = L(armL.current.rotation.z, pushing ? 0 : 0.06 + idle, k);
    armR.current.rotation.z = L(armR.current.rotation.z, pushing ? 0 : -0.06 - idle, k);
    foreL.current.rotation.x = L(foreL.current.rotation.x, pushing ? 0.28 : 0.2 + Math.max(0, s) * 0.5, k);
    foreR.current.rotation.x = L(foreR.current.rotation.x, pushing ? 0.28 : 0.2 + Math.max(0, -s) * 0.5, k);

    hips.current.position.y = L(hips.current.position.y, moving ? Math.abs(Math.sin(t.current)) * 0.035 : 0, k);
    hips.current.rotation.z = L(hips.current.rotation.z, moving ? Math.sin(t.current) * 0.03 : 0, k);
    hips.current.rotation.y = L(hips.current.rotation.y, moving ? Math.sin(t.current) * 0.08 : 0, k);
    torso.current.rotation.y = L(torso.current.rotation.y, moving ? -Math.sin(t.current) * 0.1 : 0, k);
    torso.current.scale.y = 1 + Math.sin(c * 1.8) * 0.012;
    head.current.rotation.y = Math.sin(c * 0.55 + phase) * (moving ? 0.12 : 0.35);
    head.current.rotation.x = L(head.current.rotation.x, moving ? 0.03 : Math.sin(c * 0.4 + phase) * 0.06, k);

    blink.current -= dt;
    if (blink.current < 0) blink.current = 2.5 + ((c * 7) % 3);
    eyes.current.scale.y = blink.current < 0.12 ? 0.1 : 1;
  });

  const hv = P.head;
  const lip = P.feminine ? "#8f514b" : "#75463d";
  const sx = P.sx;
  const legSkin = bt === "trousers";
  const longSleeve = sl === "long";

  const leg = (x, ref, shinRef) => (
    <group key={x} ref={ref} position={[x * sx, 0.85, 0]}>
      <mesh geometry={G.thigh} material={M(skin, 0.82)} castShadow />
      {legSkin && <mesh geometry={G.thigh} material={M(botC)} scale={[1.1, 1, 1.1]} />}
      {bt === "shorts" && <mesh geometry={G.thigh} material={M(botC)} scale={[1.12, 0.6, 1.12]} />}
      <group ref={shinRef} position={[0, -0.4, 0]}>
        <mesh geometry={G.shin} material={M(skin, 0.82)} />
        {legSkin && <mesh geometry={G.shin} material={M(botC)} scale={[1.1, 1, 1.1]} />}
        {/* shoe: sole + upper */}
        <mesh geometry={ball} material={M(shoes, 0.5)} position={[0, -0.4, -0.05]} scale={[0.058, 0.04, 0.12]} castShadow />
        <mesh geometry={box} material={M("#222", 0.9)} position={[0, -0.435, -0.05]} scale={[0.1, 0.02, 0.24]} />
      </group>
    </group>
  );

  const arm = (x, ref, foreRef) => (
    <group key={x} ref={ref} position={[x * P.shoulder * sx, 1.43, 0]}>
      <mesh geometry={G.upperArm} material={M(skin, 0.82)} castShadow />
      {sl !== "none" && <mesh geometry={G.upperArm} material={M(topC)} scale={[1.14, longSleeve ? 1 : 0.62, 1.14]} />}
      <group ref={foreRef} position={[0, -0.3, 0]}>
        <mesh geometry={G.foreArm} material={M(skin, 0.82)} />
        {longSleeve && <mesh geometry={G.foreArm} material={M(topC)} scale={[1.12, 0.85, 1.12]} />}
        {/* hand: palm + fingers + thumb */}
        <group position={[0, -0.33, 0]}>
          <mesh geometry={ball} material={M(skin, 0.82)} scale={[0.036, 0.05, 0.022]} />
          <mesh geometry={ball} material={M(skin, 0.82)} position={[0, -0.05, -0.004]} scale={[0.03, 0.04, 0.015]} />
          <mesh geometry={ball} material={M(skin, 0.82)} position={[x < 0 ? 0.03 : -0.03, 0.0, -0.012]} scale={[0.013, 0.03, 0.013]} />
        </group>
      </group>
    </group>
  );

  return (
    <group scale={P.s}>
      <group ref={hips}>
        {leg(-0.1, legL, shinL)}
        {leg(0.1, legR, shinR)}

        {/* pelvis + lower garment */}
        <mesh geometry={P.hips} material={M(dress ? topC : botC)} scale={[sx, 1, 0.8]} castShadow />
        {dress && <mesh geometry={G.skirt} material={M(botC, 0.8, DoubleSide)} castShadow />}

        <group ref={torso}>
          <mesh geometry={P.torso} material={M(topC)} scale={[sx, 1, 0.72]} castShadow />
          {/* belt / waist band */}
          {!dress && <mesh geometry={G.belt} material={M("#2b2b2b", 0.5)} position={[0, 1.0, 0]} scale={[sx, 1, 0.76]} />}
          {badge && <mesh geometry={box} material={M(badge, 0.4)} position={[0.08 * sx, 1.28, -0.14]} scale={[0.05, 0.03, 0.01]} />}
          {/* collar */}
          {!P.feminine && <mesh geometry={ball} material={M(topC)} position={[0, 1.5, 0]} scale={[0.065, 0.03, 0.06]} />}
          {/* shoulders (deltoids) */}
          {[-1, 1].map((d) => (
            <mesh key={d} geometry={ball} material={M(sl === "none" ? skin : topC)} position={[d * P.shoulder * sx, 1.42, 0]} scale={[0.065, 0.065, 0.06]} />
          ))}
          <mesh geometry={G.neck} material={M(skin, 0.6)} position={[0, 1.5, 0]} />

          {arm(-1, armL, foreL)}
          {arm(1, armR, foreR)}

          <group ref={head} position={[0, 1.62 + 0.04 * (hv - 1), 0]} scale={hv}>
            <mesh geometry={sph} material={M(skin, 0.82)} position={[0, 0.1, 0]} scale={[0.14, 0.17, 0.155]} castShadow />
            <mesh geometry={sph} material={M(skin, 0.82)} position={[0, 0.0, -0.015]} scale={[P.feminine ? 0.105 : 0.12, 0.1, 0.115]} />
            {[-0.14, 0.14].map((x) => (
              <group key={x} position={[x, 0.08, 0.005]}>
                <mesh geometry={ball} material={M(skin, 0.82)} scale={[0.02, 0.04, 0.028]} />
                <mesh geometry={ball} material={M("#75483a", 0.9)} position={[0, 0, -0.018]} scale={[0.006, 0.022, 0.006]} />
              </group>
            ))}
            <group ref={eyes} position={[0, 0.1, 0]}>
              {[-0.06, 0.06].map((x) => (
                <group key={x} position={[x, 0, -0.147]}>
                  <mesh geometry={ball} material={M("#f2e7dc", 0.32)} scale={[0.026, 0.016, 0.008]} />
                  <mesh geometry={ball} material={M("#68452f", 0.5)} position={[0, 0, -0.007]} scale={[0.011, 0.011, 0.005]} />
                  <mesh geometry={ball} material={M("#171411", 0.4)} position={[0, 0, -0.011]} scale={[0.0055, 0.007, 0.003]} />
                  <mesh geometry={ball} material={M("#ffffff", 0.25)} position={[-0.003, 0.003, -0.013]} scale={[0.0025, 0.0025, 0.0015]} />
                </group>
              ))}
            </group>
            {[-0.06, 0.06].map((x) => (
              <mesh key={x} geometry={ball} material={M(hair, 0.85)} position={[x, 0.132, -0.148]} rotation={[0, 0, x * 2]} scale={[0.031, 0.005, 0.006]} />
            ))}
            <mesh geometry={ball} material={M(skin, 0.82)} position={[0, 0.05, -0.157]} scale={[0.022, 0.039, 0.022]} />
            <mesh geometry={ball} material={M(skin, 0.82)} position={[0, 0.022, -0.174]} scale={[0.027, 0.019, 0.023]} />
            <mesh geometry={ball} material={M("#68483d", 0.9)} position={[-0.012, 0.012, -0.189]} scale={[0.004, 0.003, 0.002]} />
            <mesh geometry={ball} material={M("#68483d", 0.9)} position={[0.012, 0.012, -0.189]} scale={[0.004, 0.003, 0.002]} />
            <mesh geometry={ball} material={M(lip, 0.82)} position={[0, -0.022, -0.151]} scale={[0.03, 0.007, 0.008]} />
            {glasses &&
              [-0.06, 0.06].map((x) => (
                <mesh key={x} geometry={G.glasses} material={M("#222", 0.4)} position={[x, 0.1, -0.158]} />
              ))}
            {beard && <mesh geometry={sph} material={M(hair, 0.8)} position={[0, -0.02, -0.04]} scale={[0.115, 0.075, 0.105]} />}

            {hat && (
              <>
                <mesh geometry={G.capTop} material={M(hat === true ? "#0B1F3A" : hat)} position={[0, 0.15, 0.01]} scale={[0.165, 0.14, 0.17]} />
                <mesh geometry={box} material={M(hat === true ? "#0B1F3A" : hat)} position={[0, 0.16, -0.17]} scale={[0.22, 0.01, 0.12]} />
              </>
            )}
            {/* hair */}
            {hs !== "bald" && !hat && (
              <>
                <mesh geometry={sph} material={M(hair, 0.85)} position={[0, 0.13, 0.015]} scale={[0.15, 0.165, 0.162]} />
                <mesh geometry={sph} material={M(hair, 0.85)} position={[0, 0.2, -0.03]} scale={[hs === "afro" ? 0.2 : 0.145, hs === "afro" ? 0.1 : 0.05, hs === "afro" ? 0.19 : 0.13]} />
              </>
            )}
            {hs === "afro" && <mesh geometry={sph} material={M(hair, 0.9)} position={[0, 0.14, 0.01]} scale={[0.22, 0.2, 0.21]} />}
            {hs === "long" && <mesh geometry={G.hairBack} material={M(hair, 0.85)} position={[0, 0.0, 0.05]} scale={[1, 1, 0.75]} />}
            {hs === "bun" && <mesh geometry={sph} material={M(hair, 0.85)} position={[0, 0.27, 0.07]} scale={0.07} />}
            {hs === "pigtails" &&
              [-0.17, 0.17].map((x) => (
                <group key={x} position={[x, 0.08, 0.03]}>
                  <mesh geometry={ball} material={M("#ec4899")} position={[0, 0.01, 0]} scale={0.03} />
                  <mesh geometry={G.braid} material={M(hair, 0.85)} position={[0, -0.01, 0]} />
                </group>
              ))}
          </group>
        </group>
      </group>
    </group>
  );
}
