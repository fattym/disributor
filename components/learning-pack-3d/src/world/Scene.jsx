import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import Store from "./Store.jsx";
import Shelves from "./Shelves.jsx";
import Plaza from "./Plaza.jsx";
import CheckoutArea from "./CheckoutArea.jsx";
import Outside from "./Outside.jsx";
import Shopper from "./Shopper.jsx";
import Npcs from "./Npcs.jsx";
import { UNIT_W, UNIT_X, UNIT_Z } from "../data/layout.js";
import { StoreLighting } from "../game/StoreLighting";
import { BlobShadow, ShelfContactShadows } from "../game/StoreShadows";
import { AdaptivePixelRatio, QUALITY, detectQualityTier } from "../game/storeQuality";
import { useGameUi } from "../game/gameUiStore";

export default function Scene() {
  const player = useRef(null);
  const detected = useMemo(() => detectQualityTier(), []);
  const chosen = useGameUi((s) => s.settings.quality);
  const paused = useGameUi((s) => s.paused);
  const q = QUALITY[chosen === "auto" ? detected : chosen];
  return (
    <Canvas
      key="bookshop-scene"
      frameloop={paused ? "demand" : "always"}
      shadows={q.shadows ? "percentage" : false}
      dpr={q.dpr}
      camera={{ position: [0, 2.7, 14.6], fov: 50, near: 0.1, far: 260 }}
      gl={{ antialias: q.antialias, powerPreference: "high-performance" }}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.AgXToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <color attach="background" args={["#cfe6f5"]} />
      <fog attach="fog" args={["#d9ecf8", 70, 190]} />
      <StoreLighting target={player} quality={q} />
      <BlobShadow target={player} opacity={q.shadows ? 0.4 : 0.7} />
      {q.shelfContactShadows && <ShelfContactShadows />}
      {/* invisible footprints of the shelving, for the contact shadows */}
      {UNIT_X.map((x) => (
        <group key={x} userData={{ shelf: true }}>
          <mesh visible={false} position={[x, 1.2, (UNIT_Z[0] + UNIT_Z[1]) / 2]}>
            <boxGeometry args={[UNIT_W, 2.4, UNIT_Z[1] - UNIT_Z[0]]} />
          </mesh>
        </group>
      ))}
      <AdaptivePixelRatio min={0.75} max={q.dpr[1]} />
      <Store />
      <Shelves />
      <Plaza />
      <CheckoutArea />
      <Outside />
      <Npcs />
      <Shopper playerRef={player} />
    </Canvas>
  );
}
