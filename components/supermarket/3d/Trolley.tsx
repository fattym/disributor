import { forwardRef, Ref } from 'react';
import { Group } from 'three';

const NAVY = '#0B1F3A';

interface Props {
  position: [number, number, number];
  rotation: number;
}

export const Trolley = forwardRef(({ position, rotation }: Props, ref: Ref<Group>) => {
  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]}>
      {/* Handle tube */}
      <mesh position={[0, 42, -20]} rotation={[Math.PI / 6, 0, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 30, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Handle grip */}
      <mesh position={[0, 42, -32]}>
        <boxGeometry args={[26, 4, 4]} />
        <meshStandardMaterial color={NAVY} roughness={0.4} />
      </mesh>
      {/* Main basket frame - vertical supports */}
      {[-16, 16].map((x) => (
        <mesh key={`frame-${x}`} position={[x, 14, 0]} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 32, 10]} />
          <meshStandardMaterial color="#64748B" metalness={0.55} roughness={0.35} />
        </mesh>
      ))}
      {/* Basket rim top */}
      <mesh position={[0, 30, 0]} castShadow>
        <boxGeometry args={[36, 2, 44]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.55} roughness={0.35} />
      </mesh>
      {/* Basket bottom */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[34, 2, 42]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Wire basket sides */}
      {[-17, 17].map((x) => (
        <mesh key={`side-${x}`} position={[x, 15, 0]} castShadow>
          <boxGeometry args={[2, 30, 44]} />
          <meshStandardMaterial color="#CBD5E1" transparent opacity={0.35} metalness={0.6} />
        </mesh>
      ))}
      {[-21, 21].map((z) => (
        <mesh key={`sidez-${z}`} position={[0, 15, z]} castShadow>
          <boxGeometry args={[36, 30, 2]} />
          <meshStandardMaterial color="#CBD5E1" transparent opacity={0.12} metalness={0.6} />
        </mesh>
      ))}
      {/* Woven wire grid makes the basket read as a real supermarket trolley. */}
      {[-12, -6, 0, 6, 12].map((y) => (
        <group key={`wire-y-${y}`}>
          {[-17, 17].map((x) => (
            <mesh key={`end-${x}`} position={[x, 15 + y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 44, 8]} />
              <meshStandardMaterial color="#E2E8F0" metalness={0.75} roughness={0.25} />
            </mesh>
          ))}
          <mesh position={[0, 15 + y, -21]}>
            <cylinderGeometry args={[0.35, 0.35, 36, 8]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.75} roughness={0.25} />
          </mesh>
        </group>
      ))}
      {[-12, -6, 0, 6, 12].map((x) => (
        <group key={`wire-x-${x}`}>
          <mesh position={[x, 15, -21]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 30, 8]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[x, 15, 21]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 30, 8]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.75} roughness={0.25} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 29, 22]} castShadow>
        <boxGeometry args={[12, 4, 1]} />
        <meshStandardMaterial color="#E63B00" roughness={0.4} />
      </mesh>
      {/* Lower storage rack */}
      <mesh position={[0, -6, 0]} castShadow receiveShadow>
        <boxGeometry args={[38, 2, 44]} />
        <meshStandardMaterial color="#475569" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, -10, 0]} castShadow>
        <boxGeometry args={[34, 2, 40]} />
        <meshStandardMaterial color="#374151" roughness={0.5} />
      </mesh>
      {/* Wheels */}
      <group position={[0, 1.5, 0]}>
        {[-16, 16].map((x) => [-22, 22].map((z) => (
          <mesh key={`wheel-${x}-${z}`} position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[3.5, 3.5, 2, 16]} />
            <meshStandardMaterial color="#111827" metalness={0.4} roughness={0.3} />
          </mesh>
        )))}
        {[-16, 16].map((x) => [-22, 22].map((z) => (
          <mesh key={`hub-${x}-${z}`} position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.2, 1.2, 2.4, 12]} />
            <meshStandardMaterial color="#64748B" metalness={0.6} roughness={0.3} />
          </mesh>
        )))}
      </group>
      {/* Child seat flap */}
      <mesh position={[0, 36, -18]} rotation={[-0.2, 0, 0]} castShadow>
        <boxGeometry args={[28, 2, 16]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
});
Trolley.displayName = 'Trolley';
