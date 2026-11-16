import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";
import Store from "./Store.jsx";
import Shelves from "./Shelves.jsx";
import Plaza from "./Plaza.jsx";
import CheckoutArea from "./CheckoutArea.jsx";
import Outside from "./Outside.jsx";
import Shopper from "./Shopper.jsx";
import Npcs from "./Npcs.jsx";
import { lowEnd } from "./state.js";

/** Soft ceiling-light reflections without downloading an HDRI. */
function Reflections() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={1.4} position={[0, 8, -2]} rotation-x={Math.PI / 2} scale={[34, 34, 1]} />
      {[-12.7, -6.5, 0, 6.5, 12.7].map((x) => (
        <Lightformer key={x} form="rect" intensity={4} position={[x, 6, -2]} rotation-x={Math.PI / 2} scale={[0.5, 30, 1]} />
      ))}
      <Lightformer form="rect" intensity={1.2} position={[0, 3, 20]} scale={[30, 4, 1]} />
    </Environment>
  );
}

export default function Scene() {
  const small = useMemo(() => lowEnd(), []);
  return (
    <Canvas
      key="bookshop-scene"
      shadows={!small}
      dpr={small ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 2.7, 14.6], fov: 55, near: 0.1, far: 260 }}
      gl={{ antialias: !small, powerPreference: "high-performance" }}
      resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
      }}
    >
      <color attach="background" args={["#cfe6f5"]} />
      <fog attach="fog" args={["#d9ecf8", 70, 190]} />
      <hemisphereLight args={["#ffffff", "#aeb5c0", 0.8]} />
      <ambientLight intensity={0.22} />
      {/* the only shadow caster: a soft skylight straight above the shelving */}
      <directionalLight
        position={[5, 22, 9]}
        intensity={0.75}
        castShadow={!small}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-near={5}
        shadow-camera-far={50}
      />
      <Reflections />
      <Store />
      <Shelves />
      <Plaza />
      <CheckoutArea />
      <Outside />
      <Npcs />
      <Shopper />
    </Canvas>
  );
}
