import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { STORE } from "../data/layout.js";

// Cars driving along the road in front of the shop, visible through the glazing and the entrance.
const CARS = [
  ["#f2c200", 34, -40, 7, true],
  ["#d1d5db", 31, 20, 9],
  ["#2563eb", 34, 60, -6],
  ["#ffffff", 31, -10, -8, true],
  ["#d98b62", 34, 5, 6],
];

function Car({ c, z, x, s, van }) {
  const g = useRef();
  useFrame((_, dt) => {
    const p = g.current.position;
    p.x += s * dt;
    if (p.x > 90) p.x = -90;
    if (p.x < -90) p.x = 90;
  });
  return (
    <group ref={g} position={[x - 30, 0, z]} rotation={[0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh position={[0, van ? 1.15 : 0.75, 0]}>
        <boxGeometry args={van ? [2.1, 1.5, 5.2] : [1.9, 0.8, 4.2]} />
        <meshStandardMaterial color={c} />
      </mesh>
      <mesh position={[0, van ? 1.6 : 1.45, -0.2]}>
        <boxGeometry args={van ? [2.14, 0.5, 4.2] : [1.7, 0.65, 2.2]} />
        <meshStandardMaterial color="#233446" />
      </mesh>
    </group>
  );
}

export default function Outside() {
  const z0 = STORE.zFront;
  return (
    <group>
      {/* grass, pavement, car park, road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#8fbf78" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, z0 + 3]}>
        <planeGeometry args={[400, 6]} />
        <meshStandardMaterial color="#d4d7dd" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, z0 + 12]}>
        <planeGeometry args={[400, 12]} />
        <meshStandardMaterial color="#4b4f58" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, z0 + 26]}>
        <planeGeometry args={[400, 9]} />
        <meshStandardMaterial color="#2f333a" roughness={0.95} />
      </mesh>
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-87 + i * 6, -0.02, z0 + 26]}>
          <planeGeometry args={[3, 0.2]} />
          <meshBasicMaterial color="#f2f2f2" />
        </mesh>
      ))}
      {/* opposite buildings */}
      {Array.from({ length: 12 }, (_, i) => {
        const h = 9 + ((i * 7) % 13);
        return (
          <mesh key={i} position={[-66 + i * 12, h / 2, z0 + 50]}>
            <boxGeometry args={[10, h, 12]} />
            <meshStandardMaterial color={["#f2d7b6", "#d9e4ee", "#e8c4c4", "#c9dfc9", "#f4e3a1"][i % 5]} />
          </mesh>
        );
      })}
      {Array.from({ length: 14 }, (_, i) => (
        <group key={i} position={[-42 + i * 7 + (i % 3), 0, z0 + 7.5]}>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.16, 0.26, 2.8, 8]} />
            <meshStandardMaterial color="#6b4a2b" />
          </mesh>
          <mesh position={[0, 3.2, 0]} scale={[1.8, 0.9, 1.8]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#4f8f3a" />
          </mesh>
        </group>
      ))}
      {CARS.map(([c, , x, s, van], i) => (
        <Car key={i} c={c} z={z0 + 24 + (i % 2) * 4.2 - 1} x={x} s={s} van={van} />
      ))}
    </group>
  );
}
