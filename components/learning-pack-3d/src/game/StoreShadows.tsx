/**
 * Cheap "fake" shadows that work on every phone, even with real
 * shadows switched off:
 *
 *  <BlobShadow>           soft dark patch under the shopper and trolley
 *  <ShelfContactShadows>  darker floor where shelves meet it, like
 *                         ambient occlusion, for almost no cost
 */
import { RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function radialShadowTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(0.5, "rgba(0,0,0,0.25)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/** Soft rectangle that fades out at the edges (for shelf bases). */
function softRectTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const pad = size * 0.22;
  ctx.filter = `blur(${size * 0.08}px)`;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(pad, pad, size - pad * 2, size - pad * 2);
  return new THREE.CanvasTexture(canvas);
}

const tmpPos = new THREE.Vector3();

export function BlobShadow({
  target,
  size = 1.6,
  opacity = 0.7,
}: {
  target: RefObject<THREE.Object3D | null>;
  size?: number;
  opacity?: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => radialShadowTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(() => {
    const t = target.current;
    const m = mesh.current;
    if (!t || !m) return;
    t.getWorldPosition(tmpPos);
    m.position.set(tmpPos.x, 0.015, tmpPos.z);
  });

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} renderOrder={2}>
      <planeGeometry args={[size, size * 1.25]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-4}
      />
    </mesh>
  );
}

/**
 * Finds every object tagged userData.shelf = true and puts a soft dark
 * patch on the floor under it. Tag the shelf unit group (not each book):
 *
 *   <group userData={{ shelf: true }}> ...shelf unit... </group>
 *
 * Shelves are assumed to be axis-aligned (rotated 0° or 90°), which
 * matches the current store layout.
 */
export function ShelfContactShadows({ margin = 0.9, opacity = 0.85 }: { margin?: number; opacity?: number }) {
  const scene = useThree((s) => s.scene);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const texture = useMemo(() => softRectTexture(), []);
  const [boxes, setBoxes] = useState<THREE.Box3[]>([]);

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    const collect = () => {
      const found: THREE.Box3[] = [];
      scene.updateMatrixWorld(true);
      scene.traverse((o) => {
        if (o.userData?.shelf) found.push(new THREE.Box3().setFromObject(o));
      });
      setBoxes(found);
    };
    collect();
    const t = window.setTimeout(collect, 1500); // after products load
    return () => window.clearTimeout(t);
  }, [scene]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const matrix = new THREE.Matrix4();
    const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    boxes.forEach((box, i) => {
      box.getSize(size);
      box.getCenter(center);
      // The texture's dark area covers the middle ~56%, so scale up to fit.
      pos.set(center.x, 0.01, center.z);
      scale.set((size.x + margin) / 0.56, (size.z + margin) / 0.56, 1);
      m.setMatrixAt(i, matrix.compose(pos, rot, scale));
    });
    m.count = boxes.length;
    m.instanceMatrix.needsUpdate = true;
  }, [boxes, margin]);

  if (boxes.length === 0) return null;

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, Math.max(boxes.length, 1)]}
      frustumCulled={false}
      renderOrder={1}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </instancedMesh>
  );
}
