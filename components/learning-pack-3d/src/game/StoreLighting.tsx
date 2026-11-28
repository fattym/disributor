/* eslint-disable react-hooks/immutability -- three.js objects are mutated by design */
/**
 * Lighting for the 3D bookshop: soft indoor environment light, warm fill and
 * one shadow-casting key light that follows the shopper. The store model keeps
 * its own ceiling fixtures, background and fog.
 */
import { RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { STORE_COLORS, upgradeLambertMaterials } from "./storePalette";
import type { QualitySettings } from "./storeQuality";

interface StoreLightingProps {
  /** The shopper (avatar + trolley group). The key light and its shadows follow it. */
  target: RefObject<THREE.Object3D | null>;
  quality: QualitySettings;
  /** Convert MeshLambertMaterial to MeshStandardMaterial so the environment light affects it. */
  upgradeMaterials?: boolean;
}

export function StoreLighting({ target, quality, upgradeMaterials = true }: StoreLightingProps) {
  return (
    <>
      <RoomEnvironmentLight intensity={0.55} />
      <hemisphereLight args={[STORE_COLORS.skyFill, STORE_COLORS.groundFill, 0.55]} />

      <FollowKeyLight target={target} quality={quality} />

      {upgradeMaterials && <UpgradeMaterials />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Environment                                                         */
/* ------------------------------------------------------------------ */

function RoomEnvironmentLight({ intensity = 0.5 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const envMap = pmrem.fromScene(room, 0.04).texture;

    const previous = scene.environment;
    scene.environment = envMap;
    scene.environmentIntensity = intensity;

    return () => {
      scene.environment = previous;
      envMap.dispose();
      pmrem.dispose();
      room.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
        }
      });
    };
  }, [gl, scene, intensity]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Key light that follows the shopper                                  */
/* ------------------------------------------------------------------ */

const KEY_OFFSET = new THREE.Vector3(6, 11, 4); // high and to the side, like a ceiling light row
const tmpTargetPos = new THREE.Vector3();

function FollowKeyLight({ target, quality }: { target: RefObject<THREE.Object3D | null>; quality: QualitySettings }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const scene = useThree((s) => s.scene);

  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    scene.add(l.target);

    const cam = l.shadow.camera;
    const halfSize = 12; // shadow area around the player, in metres
    cam.left = -halfSize;
    cam.right = halfSize;
    cam.top = halfSize;
    cam.bottom = -halfSize;
    cam.near = 1;
    cam.far = 40;
    cam.updateProjectionMatrix();

    l.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.03;
    l.shadow.radius = 4; // softer edges (PCF)
    l.shadow.map?.dispose();
    l.shadow.map = null; // re-create at the new size

    return () => {
      scene.remove(l.target);
    };
  }, [scene, quality.shadowMapSize]);

  useFrame(() => {
    const l = light.current;
    const t = target.current;
    if (!l || !t) return;

    t.getWorldPosition(tmpTargetPos);

    // Snap to shadow-map texels so shadows don't shimmer while walking.
    const texel = 24 / quality.shadowMapSize;
    tmpTargetPos.x = Math.round(tmpTargetPos.x / texel) * texel;
    tmpTargetPos.z = Math.round(tmpTargetPos.z / texel) * texel;

    l.position.copy(tmpTargetPos).add(KEY_OFFSET);
    l.target.position.copy(tmpTargetPos);
    l.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={light}
      color={STORE_COLORS.lightWarm}
      intensity={1.6}
      castShadow={quality.shadows}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Material upgrade                                                    */
/* ------------------------------------------------------------------ */

function UpgradeMaterials() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    upgradeLambertMaterials(scene);
    const t = window.setTimeout(() => upgradeLambertMaterials(scene), 1500);
    return () => window.clearTimeout(t);
  }, [scene]);
  return null;
}
