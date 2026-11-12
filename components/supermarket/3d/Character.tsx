import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { forwardRef, Ref } from 'react';
import { Group, Mesh } from 'three';

const NAVY = '#0B1F3A';
const ORANGE = '#E63B00';

interface Props {
  position: [number, number, number];
  charState: { moving: boolean; direction: number };
}

export const Character = forwardRef(({ position, charState }: Props, ref: Ref<Group>) => {
  const body = useRef<Group>(null!);
  const legL = useRef<Mesh>(null!);
  const legR = useRef<Mesh>(null!);
  const armL = useRef<Mesh>(null!);
  const armR = useRef<Mesh>(null!);

  useFrame((_state) => {
    if (!body.current) return;
    if (charState.moving) {
      body.current.rotation.y = charState.direction;
      const t = _state.clock.elapsedTime;
      const walk = Math.sin(t * 10) * 0.4;
      legL.current.rotation.x = walk;
      legR.current.rotation.x = -walk;
      armL.current.rotation.x = -walk * 0.6;
      armR.current.rotation.x = walk * 0.6;
    } else {
      legL.current.rotation.x = 0;
      legR.current.rotation.x = 0;
      armL.current.rotation.x = 0;
      armR.current.rotation.x = 0;
    }
  });

  return (
    <group ref={ref} position={position}>
      <group ref={body} position={[0, 16, 0]}>
        {/* Head */}
        <mesh castShadow position={[0, 18, 0]}>
          <sphereGeometry args={[5, 16, 16]} />
          <meshStandardMaterial color="#E0AC69" />
        </mesh>
        <mesh position={[0, 20, 4.5]} castShadow>
          <boxGeometry args={[10, 2, 2]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
        {/* Torso */}
        <mesh castShadow position={[0, 8, 0]}>
          <boxGeometry args={[10, 14, 6]} />
          <meshStandardMaterial color={NAVY} roughness={0.5} />
        </mesh>
        <mesh position={[0, 14, 3.1]} castShadow>
          <boxGeometry args={[8, 4, 0.4]} />
          <meshStandardMaterial color={ORANGE} roughness={0.4} />
        </mesh>
        {/* Left arm */}
        <mesh ref={armL} position={[-7, 10, 0]} castShadow>
          <cylinderGeometry args={[1.8, 1.8, 12, 10]} />
          <meshStandardMaterial color="#E0AC69" />
        </mesh>
        <mesh ref={armL} position={[-7, 2, 0]} castShadow>
          <boxGeometry args={[3, 3, 3]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
        {/* Right arm */}
        <mesh ref={armR} position={[7, 10, 0]} castShadow>
          <cylinderGeometry args={[1.8, 1.8, 12, 10]} />
          <meshStandardMaterial color="#E0AC69" />
        </mesh>
        <mesh ref={armR} position={[7, 2, 0]} castShadow>
          <boxGeometry args={[3, 3, 3]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
        {/* Left leg */}
        <mesh ref={legL} position={[-3, -6, 0]} castShadow>
          <cylinderGeometry args={[2.2, 2.2, 14, 10]} />
          <meshStandardMaterial color="#1F2937" roughness={0.5} />
        </mesh>
        <mesh ref={legL} position={[-3, -15, 0]} castShadow>
          <boxGeometry args={[3.5, 2, 4]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        {/* Right leg */}
        <mesh ref={legR} position={[3, -6, 0]} castShadow>
          <cylinderGeometry args={[2.2, 2.2, 14, 10]} />
          <meshStandardMaterial color="#1F2937" roughness={0.5} />
        </mesh>
        <mesh ref={legR} position={[3, -15, 0]} castShadow>
          <boxGeometry args={[3.5, 2, 4]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>
    </group>
  );
});
Character.displayName = 'Character';
