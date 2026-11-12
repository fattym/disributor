import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { navigationData } from '@/lib/shopCategories';
import { Text } from '@react-three/drei';
import { ShelfSection } from '@/lib/types/storefront';

const BUILDING_W = 640;
const BUILDING_D = 420;
const WALL_H = 300;
const TILE = 40;

const NAVY = '#0B1F3A';
const ORANGE = '#E63B00';
const FLOOR_LIGHT = '#F4F5F7';

function LearningPackLogo({ position, rotation = [0, 0, 0] }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[-55, 0, 0]}>
        <boxGeometry args={[28, 28, 1.5]} />
        <meshStandardMaterial color={NAVY} roughness={0.35} />
      </mesh>
      <mesh position={[-62, 0, 1]}>
        <boxGeometry args={[3, 28, 1]} />
        <meshStandardMaterial color={ORANGE} roughness={0.35} />
      </mesh>
      <mesh position={[-58, -3, 1.5]} rotation={[0, 0, 0.65]}>
        <boxGeometry args={[3, 13, 1]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-50, 1, 1.5]} rotation={[0, 0, -0.65]}>
        <boxGeometry args={[3, 22, 1]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <Text position={[17, 1, 0]} fontSize={14} color="#FFFFFF" anchorX="center" anchorY="middle">
        LEARNING PACK
      </Text>
    </group>
  );
}

function AisleSign({ text, position, color = NAVY, aisleNumber }: { text: string; position: [number, number, number]; color?: string; aisleNumber: number }) {
  const shortText = text.length > 22 ? `${text.slice(0, 20)}…` : text;
  return (
    <group position={position}>
      <mesh position={[0, -22, 0]} castShadow>
        <boxGeometry args={[2, 44, 2]} />
        <meshStandardMaterial color="#334155" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 10, 0]}>
        <boxGeometry args={[52, 16, 2.5]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <Text position={[0, 16.8, 1.8]} fontSize={2.8} color="#F8FAFC" anchorX="center">
        AISLE {aisleNumber}
      </Text>
      <Text
        position={[0, 10, 1.5]}
        fontSize={3.8}
        maxWidth={48}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {shortText}
      </Text>
    </group>
  );
}

function WindowPane({ x, y, glassColor }: { x: number; y: number; glassColor: string }) {
  const W = 46;
  const H = 34;
  const THK = 2.2;
  return (
    <group position={[x, y, BUILDING_D / 2 - 1.5]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, H, 1.6]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.22} roughness={0} metalness={0.05} />
      </mesh>
      <mesh position={[-W / 2 - THK / 2, 0, 0.8]} castShadow>
        <boxGeometry args={[THK, H, 1]} />
        <meshStandardMaterial color={NAVY} roughness={0.5} />
      </mesh>
      <mesh position={[W / 2 + THK / 2, 0, 0.8]} castShadow>
        <boxGeometry args={[THK, H, 1]} />
        <meshStandardMaterial color={NAVY} roughness={0.5} />
      </mesh>
      <mesh position={[0, H / 2 + THK / 2, 0.8]} castShadow>
        <boxGeometry args={[W, THK, 1]} />
        <meshStandardMaterial color={NAVY} roughness={0.5} />
      </mesh>
      <mesh position={[0, -H / 2 - THK / 2, 0.8]} castShadow>
        <boxGeometry args={[W, THK, 1]} />
        <meshStandardMaterial color={NAVY} roughness={0.5} />
      </mesh>
    </group>
  );
}

function GlassDoor({ x = 0, y = 26 }: { x?: number; y?: number }) {
  const W = 56;
  const H = 156;
  const THK = 3;
  return (
    <group position={[x, y, BUILDING_D / 2 - 1.6]}>
      <mesh castShadow>
        <boxGeometry args={[W, H, 1]} />
        <meshStandardMaterial color="#7C9DBF" transparent opacity={0.18} roughness={0} metalness={0.02} />
      </mesh>
      <mesh position={[-W / 2 - THK / 2, 0, 0.5]} castShadow>
        <boxGeometry args={[THK, H, 1]} />
        <meshStandardMaterial color={NAVY} roughness={0.5} />
      </mesh>
      <mesh position={[W / 2 + THK / 2, 0, 0.5]} castShadow>
        <boxGeometry args={[THK, H, 1]} />
        <meshStandardMaterial color={NAVY} roughness={0.5} />
      </mesh>
      <mesh position={[0, H / 2 + THK / 2, 0.5]} castShadow>
        <boxGeometry args={[W, THK, 1]} />
        <meshStandardMaterial color={NAVY} roughness={0.5} />
      </mesh>
      <mesh position={[0, -H / 2 - THK / 2, 0.5]} castShadow>
        <boxGeometry args={[W, THK, 1]} />
        <meshStandardMaterial color={NAVY} roughness={0.5} />
      </mesh>
    </group>
  );
}

function StoreDirectory() {
  return (
    <group position={[BUILDING_W / 2 - 8, 135, 118]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0, -2]} castShadow>
        <boxGeometry args={[170, 92, 5]} />
        <meshStandardMaterial color={NAVY} roughness={0.38} />
      </mesh>
      <Html
        transform
        distanceFactor={45}
        position={[0, 1, 1]}
        rotation={[0, 0, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="lp-store-directory" aria-label="Complete store directory">
          <div className="lp-store-directory-title">STORE DIRECTORY</div>
          <div className="lp-store-directory-grid">
            {navigationData.map((department) => (
              <section className="lp-store-directory-department" key={department.slug}>
                <h3><span>{department.icon}</span>{department.label}</h3>
                {department.groups.map((group) => (
                  <div className="lp-store-directory-group" key={group.label}>
                    <strong>{group.label}</strong>
                    <ul>
                      {group.items.map((item) => <li key={item.label}>{item.label}</li>)}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </Html>
    </group>
  );
}

export function StoreEnvironment({ sections, onBooklistKiosk }: { sections: ShelfSection[]; onBooklistKiosk?: () => void }) {
  const activeSections = sections.filter((s) => s.id > 0);
  const aisleCount = activeSections.length || sections.length;
  const AISLE_SPACING = aisleCount > 1 ? 340 / (aisleCount - 1) : 0;
  const signs = useMemo(() => {
    return sections
      .slice()
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((s, i) => {
        const centerX = -170 + i * AISLE_SPACING;
        return {
          text: s.name,
          position: [centerX, WALL_H - 70, -BUILDING_D / 2 + 50] as [number, number, number],
          color: s.color || NAVY,
        };
      });
  }, [sections, AISLE_SPACING]);

  return (
    <group>
      <StoreDirectory />
      {/* Floor: continuous light-grey tiles with subtle grout lines */}
      {Array.from({ length: Math.ceil(BUILDING_W / TILE) }, (_, cx) => {
        const x = -BUILDING_W / 2 + cx * TILE + TILE / 2;
        return Array.from({ length: Math.ceil(BUILDING_D / TILE) }, (_, cz) => {
          const z = -BUILDING_D / 2 + cz * TILE + TILE / 2;
          return (
            <mesh
              key={`floor-${cx}-${cz}`}
              position={[x, -0.5, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[TILE - 1.5, TILE - 1.5]} />
              <meshStandardMaterial
                color={FLOOR_LIGHT}
                roughness={0.65}
                metalness={0.05}
              />
            </mesh>
          );
        });
      })}

      {/* Grout lines: thin darker strips between tiles */}
      {Array.from({ length: Math.ceil(BUILDING_W / TILE) + 1 }, (_, cx) => {
        const x = -BUILDING_W / 2 + cx * TILE;
        return (
          <mesh key={`grout-x-${cx}`} position={[x, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[2, BUILDING_D]} />
            <meshStandardMaterial color="#CBD5E1" roughness={0.8} />
          </mesh>
        );
      })}
      {Array.from({ length: Math.ceil(BUILDING_D / TILE) + 1 }, (_, cz) => {
        const z = -BUILDING_D / 2 + cz * TILE;
        return (
          <mesh key={`grout-z-${cz}`} position={[0, -0.4, z]} rotation={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[BUILDING_W, 2]} />
            <meshStandardMaterial color="#CBD5E1" roughness={0.8} />
          </mesh>
        );
      })}

      {/* Walls */}
      {[0, 1, 2, 3].map((side) => {
        const isX = side < 2;
        const sign = side % 2 === 0 ? 1 : -1;
        const len = isX ? BUILDING_W : BUILDING_D;
        const wallColor = ['#FFF8F2', '#EAF2FA', '#FDFBF7', '#FFF4ED'][side];
        return (
          <mesh
            key={`wall-${side}`}
            rotation={[0, isX ? 0 : Math.PI / 2, 0]}
            position={isX ? [0, WALL_H / 2, sign * BUILDING_D / 2] : [sign * BUILDING_W / 2, WALL_H / 2, 0]}
            receiveShadow
          >
            <planeGeometry args={[len, WALL_H]} />
            <meshStandardMaterial color={wallColor} side={2} roughness={0.8} />
          </mesh>
        );
      })}

      {/* Learning Pack navy/orange wall colour bands */}
      <group>
        {[0, 1].map((side) => (
          <mesh key={`front-band-${side}`} position={[0, side === 0 ? 48 : WALL_H - 16, (side === 0 ? 1 : -1) * (BUILDING_D / 2 - 1)]}>
            <boxGeometry args={[BUILDING_W - 24, 18, 2]} />
            <meshStandardMaterial color={side === 0 ? ORANGE : NAVY} roughness={0.55} />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <group key={`side-band-${side}`}>
            <mesh position={[side * (BUILDING_W / 2 - 1), WALL_H - 16, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[BUILDING_D - 24, 18, 2]} />
              <meshStandardMaterial color={side > 0 ? NAVY : ORANGE} roughness={0.55} />
            </mesh>
            <mesh position={[side * (BUILDING_W / 2 - 1), 48, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[BUILDING_D - 24, 18, 2]} />
              <meshStandardMaterial color={side > 0 ? ORANGE : NAVY} roughness={0.55} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Entrance: open glass doors flanking the doorway, replacing the painted arch */}
      <group position={[0, 0, BUILDING_D / 2]}>
        <GlassDoor x={-66} y={WALL_H / 2 - 40} />
        <GlassDoor x={66} y={WALL_H / 2 - 40} />
        <Text position={[0, WALL_H - 50, 2.1]} fontSize={10} color="#FFFFFF" anchorX="center">
          ENTRANCE
        </Text>
      </group>

      {/* Windows on the front wall (kept away from the entrance) */}
      {[-1, 1].map((side) => (
        <WindowPane key={`front-win-${side}`} x={side * (BUILDING_W / 2 - 120)} y={WALL_H - 160} glassColor="#D8F0FF" />
      ))}

      {/* Windows on the two long (east/west) walls */}
      {[-1, 1].map((side) =>
        Array.from({ length: 4 }, (_, i) => {
          const x = side * (BUILDING_W / 2 - 1);
          const y = WALL_H / 2 - 20 + i * 50;
          return (
            <group key={`win-side-${side}-${i}`} position={[x, y, 0]} rotation={[0, side === 1 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.8, 34, 46]} />
                <meshStandardMaterial color={NAVY} roughness={0.5} />
              </mesh>
              <mesh position={[0, 0, 2]} castShadow>
                <planeGeometry args={[32, 30]} />
                <meshStandardMaterial color="#D8F0FF" transparent opacity={0.22} roughness={0} metalness={0.05} side={2} />
              </mesh>
            </group>
          );
        }),
      )}

      {/* Exit arch on back wall */}
      <group position={[0, 0, -BUILDING_D / 2]}>
        <mesh position={[0, WALL_H / 2 - 40, 0]} receiveShadow>
          <boxGeometry args={[100, 2, 4]} />
          <meshStandardMaterial color="#CBD5E1" side={2} />
        </mesh>
        <mesh position={[-45, WALL_H / 2 - 90, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 160, 4]} />
          <meshStandardMaterial color="#94A3B8" />
        </mesh>
        <mesh position={[45, WALL_H / 2 - 90, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 160, 4]} />
          <meshStandardMaterial color="#94A3B8" />
        </mesh>
        <mesh position={[0, WALL_H / 2 - 170, 0]} castShadow receiveShadow>
          <boxGeometry args={[96, 2, 4]} />
          <meshStandardMaterial color="#CBD5E1" side={2} />
        </mesh>
        <Text position={[0, WALL_H / 2 - 140, -1.9]} fontSize={10} color="#FFFFFF" anchorX="center">
          EXIT
        </Text>
      </group>

      {/* Ceiling: panels with recessed LED strips */}
      {[-BUILDING_W / 3, 0, BUILDING_W / 3].map((x) => {
        return (
          <group key={`ceiling-${x}`} position={[x, WALL_H - 2, 0]}>
            <mesh>
              <boxGeometry args={[180, 2, 120]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0, -1.1, 0]}>
              <boxGeometry args={[172, 0.5, 112]} />
              <meshStandardMaterial color="#D7DBE0" roughness={0.6} />
            </mesh>
            <pointLight position={[0, WALL_H - 14, 0]} intensity={40} distance={200} decay={2} color="#FFFFFF" />
          </group>
        );
      })}

      {/* Brand accent strips along ceiling edges */}
      <mesh position={[0, WALL_H - 4, BUILDING_D / 2 - 2]} castShadow>
        <boxGeometry args={[BUILDING_W - 40, 4, 2]} />
        <meshStandardMaterial color={ORANGE} roughness={0.4} />
      </mesh>
      <mesh position={[0, WALL_H - 4, -BUILDING_D / 2 + 2]} castShadow>
        <boxGeometry args={[BUILDING_W - 40, 4, 2]} />
        <meshStandardMaterial color={ORANGE} roughness={0.4} />
      </mesh>
      <mesh position={[BUILDING_W / 2 - 2, WALL_H - 4, 0]} castShadow rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[BUILDING_D - 40, 4, 2]} />
        <meshStandardMaterial color={NAVY} roughness={0.4} />
      </mesh>
      <mesh position={[-BUILDING_W / 2 + 2, WALL_H - 4, 0]} castShadow rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[BUILDING_D - 40, 4, 2]} />
        <meshStandardMaterial color={NAVY} roughness={0.4} />
      </mesh>

      {/* Store name sign above entrance */}
      <mesh position={[0, WALL_H - 40, BUILDING_D / 2 - 2]} castShadow receiveShadow>
        <boxGeometry args={[200, 34, 2]} />
        <meshStandardMaterial color={NAVY} roughness={0.35} />
      </mesh>
      <LearningPackLogo
        position={[0, WALL_H - 32, BUILDING_D / 2 - 0.8]}
      />
      <Text position={[0, WALL_H - 57, BUILDING_D / 2 - 0.8]} fontSize={6.5} color="#FFFFFF" anchorX="center">
        LEARNING PACK BOOKSHOP
      </Text>

      {/* Checkout lanes, order status display and payment options near the exit */}
      <group position={[0, 0, -BUILDING_D / 2 + 60]}>
        <mesh position={[0, 30, 0]} castShadow receiveShadow>
          <boxGeometry args={[160, 60, 60]} />
          <meshStandardMaterial color="#1E293B" roughness={0.5} />
        </mesh>
        <mesh position={[0, 62, 0]} rotation={[-0.15, 0, 0]} castShadow>
          <boxGeometry args={[170, 3, 66]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.25} metalness={0.1} />
        </mesh>
        {[-54, 54].map((x) => (
          <group key={x} position={[x, 53, 31]}>
            <mesh castShadow>
              <boxGeometry args={[3, 12, 16]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 6, 4]} rotation={[-0.35, 0, 0]}>
              <boxGeometry args={[18, 12, 1.5]} />
              <meshStandardMaterial color="#0F172A" roughness={0.25} />
            </mesh>
            <Text position={[0, 7, 5]} fontSize={2.4} color="#4ADE80" anchorX="center">
              ORDER READY
            </Text>
          </group>
        ))}
        <Text position={[0, 74, 0]} fontSize={9} color="#FFFFFF" anchorX="center">
          CHECKOUT
        </Text>
        <Text position={[0, 49, 31]} fontSize={4.5} color="#CBD5E1" anchorX="center">
          M-PESA  ·  CARD  ·  CASH
        </Text>
        <mesh position={[60, 0, 0]} castShadow>
          <boxGeometry args={[8, 100, 8]} />
          <meshStandardMaterial color="#94A3B8" />
        </mesh>
        <mesh position={[-60, 0, 0]} castShadow>
          <boxGeometry args={[8, 100, 8]} />
          <meshStandardMaterial color="#94A3B8" />
        </mesh>
        <Text position={[0, 95, 0]} fontSize={6} color="#0B1F3A" anchorX="center">
          PAY &amp; COLLECT
        </Text>
      </group>

      {/* Welcome kiosk and booklist bundle displays near the entrance */}
      <group
        position={[BUILDING_W / 2 - 100, 0, BUILDING_D / 2 - 72]}
        rotation={[0, Math.PI - 0.3, 0]}
        onClick={(event) => { event.stopPropagation(); onBooklistKiosk?.(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <mesh position={[0, 38, 0]} castShadow receiveShadow>
          <boxGeometry args={[56, 76, 8]} />
          <meshStandardMaterial color={NAVY} roughness={0.42} />
        </mesh>
        <mesh position={[0, 54, 4.2]} castShadow>
          <boxGeometry args={[46, 26, 1.8]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#EEF2FF" emissiveIntensity={0.12} roughness={0.28} />
        </mesh>
        <Text position={[0, 59, 5.2]} fontSize={4.7} color={NAVY} anchorX="center">
          SHOP YOUR BOOKLIST
        </Text>
        <Text position={[0, 52, 5.2]} fontSize={3.1} color="#475569" anchorX="center">
          COMPLETE GRADE BUNDLES
        </Text>
        <Text position={[0, 45, 5.2]} fontSize={2.8} color={ORANGE} anchorX="center">
          TEXTBOOKS · STATIONERY · BAG
        </Text>
        <mesh position={[0, 12, 4]} castShadow>
          <boxGeometry args={[38, 12, 2]} />
          <meshStandardMaterial color={ORANGE} roughness={0.38} />
        </mesh>
        <Text position={[0, 12, 5.2]} fontSize={3.3} color="#FFFFFF" anchorX="center">
          CLICK TO OPEN · INFORMATION KIOSK
        </Text>
      </group>

      {/* Welcome and promotion panels live in the clear right-hand side aisle, away from product shelves. */}
      {[0, 1].map((index) => (
        <group key={`welcome-panel-${index}`} position={[BUILDING_W / 2 - 32, 0, -72 + index * 58]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh position={[0, 42, 0]} castShadow>
            <boxGeometry args={[42, 84, 5]} />
            <meshStandardMaterial color={index === 0 ? ORANGE : '#FFFFFF'} roughness={0.4} />
          </mesh>
          <Text position={[0, 57, 3]} fontSize={4.8} color={index === 0 ? '#FFFFFF' : NAVY} anchorX="center">
            {index === 0 ? 'WELCOME' : 'SCHOOL ESSENTIALS'}
          </Text>
          <Text position={[0, 48, 3]} fontSize={3.1} maxWidth={34} color={index === 0 ? '#FFFFFF' : '#475569'} anchorX="center" textAlign="center">
            {index === 0 ? 'Learning Pack Supermarket' : 'Books · Bags · Stationery'}
          </Text>
          <mesh position={[0, 20, 3]}>
            <boxGeometry args={[34, 14, 1]} />
            <meshStandardMaterial color={index === 0 ? '#FFFFFF' : ORANGE} roughness={0.35} />
          </mesh>
          <Text position={[0, 20, 4]} fontSize={3} color={index === 0 ? ORANGE : '#FFFFFF'} anchorX="center">
            {index === 0 ? 'START SHOPPING' : 'BOOKLIST OFFER'}
          </Text>
        </group>
      ))}

      {/* Wall-mounted category signs */}
      {signs.map((s, i) => (
        <AisleSign key={i} text={s.text} position={s.position} color={s.color} aisleNumber={i + 1} />
      ))}

      {/* Trolley bays near entrance */}
      {[0, 1].map((bay) => (
        <group key={`trolley-${bay}`} position={[-BUILDING_W / 2 + 70 + bay * 40, 0, BUILDING_D / 2 - 40]} rotation={[0, 0.2, 0]}>
          <mesh position={[0, 28, 0]} castShadow>
            <boxGeometry args={[30, 32, 44]} />
            <meshStandardMaterial color="#D1D5DB" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 5, 0]} castShadow>
            <boxGeometry args={[34, 2, 48]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.55} />
          </mesh>
          {[-10, 10].map((x) => [-18, 18].map((z) => (
            <mesh key={`wheel-${x}-${z}-${bay}`} position={[x, 2, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[2.5, 2.5, 1.5, 12]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
          )))}
        </group>
      ))}
    </group>
  );
}

export const STORE_DIMENSIONS = { width: BUILDING_W, depth: BUILDING_D, wallHeight: WALL_H };
