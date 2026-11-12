import { Component, ReactNode, Suspense, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { Texture, TextureLoader, MeshStandardMaterial, Color, SRGBColorSpace } from 'three';
import { Text } from '@react-three/drei';

const NAVY = '#0B1F3A';
const ORANGE = '#E63B00';

const PAGE_OFFWHITE = '#F5F5F0';

const TEXTURE_COLORS: Record<string, string> = {
  textbook: '#4F46E5',
  exercise_book: '#F59E0B',
  stationery: '#EF4444',
  school_bag: '#1F2937',
  calculator: '#6B7280',
  pencil_case: '#8B5CF6',
  uniform: '#1E3A8A',
  generic_box: '#9CA3AF',
  water_bottle: '#0EA5E9',
  ruler: '#F59E0B',
  pencil: '#D97706',
  geometry_set: '#6B7280',
};

const SECTION_COLOR: Record<string, string> = {
  Textbooks: NAVY,
  'Exercise Books': '#1E40AF',
  Stationery: '#7C3AED',
  'School Bags': ORANGE,
  'Learning Pack': ORANGE,
  'Art, Craft & Practical Learning': '#DB2777',
  'Mathematics & Geometry': '#059669',
  'Revision Books': '#0F766E',
  'School Bundles': '#CA8A04',
};

// Shared module-level materials (created once for performance)
const PAGE_MAT = new MeshStandardMaterial({ color: PAGE_OFFWHITE, roughness: 0.85, metalness: 0 });

// Module-level material cache — dedupes materials across every product instance
// so we don't allocate a fresh MeshStandardMaterial per product per frame.
const materialCache = new Map<string, MeshStandardMaterial>();
function cachedMaterial(key: string, color: string, roughness = 0.5, metalness = 0) {
  const fullKey = `${key}|${color}|${roughness}|${metalness}`;
  let m = materialCache.get(fullKey);
  if (!m) {
    m = new MeshStandardMaterial({ color, roughness, metalness });
    materialCache.set(fullKey, m);
  }
  return m;
}
function cachedFabric(color: string) {
  return cachedMaterial('fabric', color, 0.8, 0.05);
}

interface Props {
  modelType: string;
  name: string;
  section?: string;
  scale?: number;
  imageUrl?: string | null;
}

function BookModel({ width, height, depth, coverColor, texture }: {
  width: number; height: number; depth: number; coverColor: string; texture?: Texture;
}) {
  const frontCoverMat = useMemo(() => {
    if (texture) {
      const tex = texture.clone();
      tex.colorSpace = SRGBColorSpace;
      tex.needsUpdate = true;
      return new MeshStandardMaterial({ map: tex, roughness: 0.38, metalness: 0 });
    }
    return cachedMaterial('book-cover-fallback', coverColor, 0.45, 0);
  }, [texture, coverColor]);

  const backCoverMat = cachedMaterial('book-back', '#374151', 0.5, 0);
  const spineMat = cachedMaterial('book-spine', coverColor, 0.5, 0);

  return (
    <group>
      {/* Front cover (with texture when available) */}
      <mesh castShadow receiveShadow position={[0, 0, depth / 2 + 0.12]}>
        <boxGeometry args={[width * 0.96, height * 0.98, 0.25]} />
        <meshStandardMaterial {...frontCoverMat} />
      </mesh>
      {/* Back cover */}
      <mesh castShadow receiveShadow position={[0, 0, -depth / 2 - 0.12]}>
        <boxGeometry args={[width * 0.96, height * 0.98, 0.25]} />
        <meshStandardMaterial color={backCoverMat.color} roughness={0.5} />
      </mesh>
      {/* Spine */}
      <mesh castShadow receiveShadow position={[width / 2 + 0.14, 0, 0]}>
        <boxGeometry args={[0.3, height * 0.96, depth * 0.9]} />
        <meshStandardMaterial color={spineMat.color} roughness={0.5} />
      </mesh>
      {/* Visible page block: slightly off-white, set behind the covers */}
      <mesh position={[-width * 0.46, 0, 0]}>
        <boxGeometry args={[0.06, height * 0.92, depth * 0.88]} />
        <meshStandardMaterial color={PAGE_MAT.color} roughness={0.85} />
      </mesh>
      <mesh position={[0, height / 2 - 0.14, 0]}>
        <boxGeometry args={[width * 0.92, 0.04, depth * 0.88]} />
        <meshStandardMaterial color={PAGE_MAT.color} roughness={0.85} />
      </mesh>
      <mesh position={[0, -height / 2 + 0.14, 0]}>
        <boxGeometry args={[width * 0.92, 0.04, depth * 0.88]} />
        <meshStandardMaterial color={PAGE_MAT.color} roughness={0.85} />
      </mesh>
    </group>
  );
}

function PenModel({ length = 14, color }: { length?: number; color: string }) {
  const capMat = cachedMaterial('pen-cap', '#111827', 0.3, 0.2);
  const tipMat = cachedMaterial('pen-tip', '#6B7280', 0.2, 0.7);
  const clipMat = cachedMaterial('pen-clip', '#111827', 0.25, 0.6);

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* Barrel */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, length - 4, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Grip section */}
      <mesh castShadow position={[-(length - 4) / 2 - 1.5, 0, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 3, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* Cap */}
      <mesh castShadow position={[-(length - 4) / 2 - 3.5, 0, 0]}>
        <cylinderGeometry args={[1.45, 1.45, 5, 16]} />
        <meshStandardMaterial color={capMat.color} metalness={capMat.metalness} roughness={capMat.roughness} />
      </mesh>
      {/* Tip */}
      <mesh castShadow position={[(length - 4) / 2 + 1, 0, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 2.5, 10]} />
        <meshStandardMaterial color={tipMat.color} metalness={tipMat.metalness} roughness={tipMat.roughness} />
      </mesh>
      {/* Clip */}
      <mesh position={[0, 1.7, -(length - 4) / 2 - 1]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.45, 0.45, 3.5]} />
        <meshStandardMaterial color={clipMat.color} metalness={clipMat.metalness} roughness={clipMat.roughness} />
      </mesh>
    </group>
  );
}

function PencilModel({ length = 15, color }: { length?: number; color: string }) {
  const woodMat = cachedMaterial('pencil-wood', color, 0.6, 0);
  const graphiteMat = cachedMaterial('pencil-graphite', '#1F2937', 0.9, 0.1);
  const eraserMat = cachedMaterial('pencil-eraser', '#F472B6', 0.8, 0);
  const ferruleMat = cachedMaterial('pencil-ferrule', '#9CA3AF', 0.3, 0.6);

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* Wooden body */}
      <mesh castShadow position={[-(length - 6) / 2, 0, 0]}>
        <cylinderGeometry args={[1.4, 1.4, length - 6, 12]} />
        <meshStandardMaterial color={woodMat.color} roughness={woodMat.roughness} />
      </mesh>
      {/* Graphite tip */}
      <mesh castShadow position={[length / 2 - 0.8, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 2.5, 8]} />
        <meshStandardMaterial color={graphiteMat.color} metalness={graphiteMat.metalness} roughness={graphiteMat.roughness} />
      </mesh>
      {/* Ferrule */}
      <mesh castShadow position={[-length / 2 + 2, 0, 0]}>
        <cylinderGeometry args={[1.55, 1.55, 2, 12]} />
        <meshStandardMaterial color={ferruleMat.color} metalness={ferruleMat.metalness} roughness={ferruleMat.roughness} />
      </mesh>
      {/* Eraser */}
      <mesh castShadow position={[-length / 2 + 3.5, 0, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 3, 12]} />
        <meshStandardMaterial color={eraserMat.color} roughness={eraserMat.roughness} />
      </mesh>
    </group>
  );
}

function RulerModel({ width = 16, color }: { width?: number; color: string }) {
  const rulerMat = cachedMaterial('ruler', color, 0.4, 0.1);
  const markMat = cachedMaterial('ruler-mark', '#111827', 0.5, 0.1);

  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[width, 0.5, 2]} />
        <meshStandardMaterial color={rulerMat.color} roughness={rulerMat.roughness} />
      </mesh>
      {/* Measurement marks along the edge */}
      {[-width / 2 + 2, -width / 4, 0, width / 4, width / 2 - 2].map((x, i) => (
        <mesh key={i} position={[x, 0.26, 0.5]} castShadow>
          <boxGeometry args={[0.5, 0.1, 1]} />
          <meshStandardMaterial color={markMat.color} metalness={markMat.metalness} roughness={markMat.roughness} />
        </mesh>
      ))}
    </group>
  );
}

function GeometrySetModel({ color }: { color: string }) {
  const toolMat = cachedMaterial('geom-tool', color, 0.4, 0.1);

  return (
    <group>
      {/* Ruler */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[16, 0.5, 1.5]} />
        <meshStandardMaterial color={toolMat.color} roughness={0.4} />
      </mesh>
      {/* Set square */}
      <mesh castShadow position={[-6, -5, 1.6]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[7, 7, 0.5]} />
        <meshStandardMaterial color={toolMat.color} roughness={0.4} />
      </mesh>
      {/* Protractor */}
      <mesh castShadow position={[6, -5, 1.6]}>
        <boxGeometry args={[5, 0.5, 5]} />
        <meshStandardMaterial color={toolMat.color} roughness={0.4} />
      </mesh>
    </group>
  );
}

function CalculatorModel({ width = 8, depth = 5, color }: { width?: number; depth?: number; color: string }) {
  const bodyMat = cachedMaterial('calc-body', color, 0.4, 0.1);
  const btnMat = cachedMaterial('calc-btn', '#E5E7EB', 0.5, 0);
  const screenMat = cachedMaterial('calc-screen', '#D1D5DB', 0.3, 0);
  const keyMat = cachedMaterial('calc-key', '#374151', 0.5, 0);

  return (
    <group rotation={[0, Math.PI, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.8, depth]} />
        <meshStandardMaterial color={bodyMat.color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.51, 0]}>
        <boxGeometry args={[width * 0.7, 0.1, depth * 0.6]} />
        <meshStandardMaterial color={screenMat.color} roughness={screenMat.roughness} />
      </mesh>
      {[-1, 0, 1].map((row) => [-1, 0, 1].map((col) => (
        <mesh key={`${row}-${col}`} position={[col * 1.6, 0.42, row * 1.2]} castShadow>
          <boxGeometry args={[0.8, 0.15, 0.8]} />
          <meshStandardMaterial color={btnMat.color} roughness={0.5} />
        </mesh>
      )))}
      <mesh position={[0, 0.52, depth / 2 - 0.6]} castShadow>
        <boxGeometry args={[2, 0.1, 2]} />
        <meshStandardMaterial color={keyMat.color} roughness={0.5} />
      </mesh>
    </group>
  );
}

function BackpackModel({ width = 14, height = 24, depth = 8, color }: { width?: number; height?: number; depth?: number; color: string }) {
  const bagMat = cachedFabric(color);
  const strapMat = cachedFabric('#111827');
  const pocketMat = cachedFabric('#374151');
  const zipMat = cachedMaterial('zip', '#EF4444', 0.2, 0.6);

  return (
    <group>
      {/* Main body */}
      <mesh castShadow receiveShadow position={[0, height / 2 - 4, 0]}>
        <boxGeometry args={[width, height - 8, depth]} />
        <meshStandardMaterial color={bagMat.color} roughness={bagMat.roughness} metalness={bagMat.metalness} />
      </mesh>
      {/* Top flap */}
      <mesh castShadow receiveShadow position={[0, height / 2 + 2, depth / 2 - 1]}>
        <boxGeometry args={[width * 0.95, 4, 2]} />
        <meshStandardMaterial color={bagMat.color} roughness={bagMat.roughness} metalness={bagMat.metalness} />
      </mesh>
      {/* Front pocket */}
      <mesh castShadow receiveShadow position={[0, height / 2 - 10, depth / 2 + 0.6]}>
        <boxGeometry args={[width * 0.85, 10, 0.4]} />
        <meshStandardMaterial color={pocketMat.color} roughness={0.6} />
      </mesh>
      {/* Zipper line on pocket */}
      <mesh position={[0, height / 2 - 10, depth / 2 + 0.61]}>
        <boxGeometry args={[width * 0.84, 0.3, 0.05]} />
        <meshStandardMaterial color={zipMat.color} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Straps */}
      <mesh position={[-width / 3 + 2, height / 2 - 2, -depth / 2 - 1]} rotation={[0.3, 0, 0.1]}>
        <cylinderGeometry args={[0.9, 0.9, 12, 10]} />
        <meshStandardMaterial color={strapMat.color} roughness={0.5} />
      </mesh>
      <mesh position={[width / 3 - 2, height / 2 - 2, -depth / 2 - 1]} rotation={[0.3, 0, -0.1]}>
        <cylinderGeometry args={[0.9, 0.9, 12, 10]} />
        <meshStandardMaterial color={strapMat.color} roughness={0.5} />
      </mesh>
      {/* Top handle */}
      <mesh position={[0, height / 2 + 5, -depth / 2 - 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, width * 0.5, 8]} />
        <meshStandardMaterial color={strapMat.color} roughness={0.5} />
      </mesh>
    </group>
  );
}

function PencilCaseModel({ width = 7, height = 14, depth = 3, color }: { width?: number; height?: number; depth?: number; color: string }) {
  const zipMat = cachedMaterial('zip', '#EF4444', 0.2, 0.6);
  const pullerMat = cachedMaterial('zip-puller', '#FBBF24', 0.2, 0.7);
  const caseMat = cachedFabric(color);

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={caseMat.color} roughness={0.55} metalness={caseMat.metalness} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2 + 0.15]}>
        <boxGeometry args={[width * 0.9, 0.4, 0.3]} />
        <meshStandardMaterial color={zipMat.color} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[width / 2 - 0.5, height / 2, depth / 2 + 0.16]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color={pullerMat.color} metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

function WaterBottleModel({ color }: { color: string }) {
  const capMat = cachedMaterial('bottle-cap', '#EF4444', 0.4, 0.1);

  return (
    <group>
      {/* Bottle body */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 24, 16]} />
        <meshStandardMaterial color={color} roughness={0.2} />
      </mesh>
      {/* Cap */}
      <mesh castShadow position={[0, 13.5, 0]}>
        <cylinderGeometry args={[2.9, 2.9, 3, 16]} />
        <meshStandardMaterial color={capMat.color} roughness={0.4} />
      </mesh>
    </group>
  );
}

function UniformModel({ width = 16, height = 22, depth = 6, color }: { width?: number; height?: number; depth?: number; color: string }) {
  const fabric = cachedFabric(color);
  const collarMat = cachedFabric('#FFFFFF');
  const studMat = cachedMaterial('uniform-stud', '#9CA3AF', 0.7, 0.6);
  return (
    <group>
      {/* Folded body laid flat */}
      <mesh castShadow receiveShadow position={[0, height / 2 - height / 4, 0]}>
        <boxGeometry args={[width, height / 2, depth]} />
        <meshStandardMaterial color={fabric.color} roughness={0.8} metalness={fabric.metalness} />
      </mesh>
      {/* Collar band */}
      <mesh castShadow receiveShadow position={[0, height - 2, depth / 2 + 0.1]}>
        <boxGeometry args={[width * 0.3, 2, 1]} />
        <meshStandardMaterial color={collarMat.color} roughness={0.7} metalness={collarMat.metalness} />
      </mesh>
      {/* Shirt placket studs */}
      {[-1, 0, 1].map((sx) => (
        <mesh key={sx} position={[sx * 5, height / 2 - height / 4, depth / 2 + 0.4]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.6, 8]} />
          <meshStandardMaterial color={studMat.color} metalness={studMat.metalness} roughness={studMat.roughness} />
        </mesh>
      ))}
    </group>
  );
}

function TexturedProduct({ imageUrl, ...props }: { imageUrl: string } & Parameters<typeof BookModel>[0]) {
  const textureUrl = imageUrl.startsWith('//') || imageUrl.startsWith('/') || imageUrl.startsWith('http')
    ? imageUrl
    : `/${imageUrl}`;
  const texture = useLoader(TextureLoader, textureUrl);
  return <BookModel {...props} texture={texture} />;
}

class TextureFallbackBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function ProductModel({ modelType, name, section, scale = 1, imageUrl = null }: Props) {
  const color = useMemo(() => TEXTURE_COLORS[modelType] || '#9CA3AF', [modelType]);
  const tint = useMemo(() => {
    const base = SECTION_COLOR[section || ''] || NAVY;
    return new Color(base);
  }, [section]);
  const finalColor = useMemo(() => tint.clone().multiply(new Color(color)), [color, tint]);

  const colorStr = useMemo(() => '#' + finalColor.getHexString().padStart(6, '0'), [finalColor]);

  const dims = useMemo(() => {
    switch (modelType) {
      case 'textbook':
        return { kind: 'book' as const, w: 13, h: 20, d: 3, length: 0 };
      case 'exercise_book':
        return { kind: 'book' as const, w: 14, h: 18, d: 2, length: 0 };
      case 'stationery':
        return { kind: 'pen' as const, w: 0, h: 0, d: 0, length: 13 };
      case 'pencil':
        return { kind: 'pencil' as const, w: 0, h: 0, d: 0, length: 15 };
      case 'ruler':
        return { kind: 'ruler' as const, w: 16, h: 0, d: 0, length: 0 };
      case 'geometry_set':
        return { kind: 'geometry' as const, w: 0, h: 0, d: 0, length: 0 };
      case 'calculator':
        return { kind: 'calc' as const, w: 8, h: 1, d: 5, length: 0 };
      case 'pencil_case':
        return { kind: 'case' as const, w: 7, h: 14, d: 3, length: 0 };
      case 'water_bottle':
        return { kind: 'bottle' as const, w: 0, h: 0, d: 0, length: 0 };
      case 'school_bag':
        return { kind: 'bag' as const, w: 14, h: 24, d: 8, length: 0 };
      case 'uniform':
        return { kind: 'uniform' as const, w: 16, h: 22, d: 6, length: 0 };
      case 'generic_box':
        return { kind: 'box' as const, w: 7, h: 7, d: 7, length: 0 };
      default:
        return { kind: 'book' as const, w: 3.2, h: 20, d: 13, length: 0 };
    }
  }, [modelType]);

  const labelY = dims.kind === 'book' ? dims.h / 2 + 1.5 : dims.kind === 'pen' ? 0 : dims.kind === 'bag' ? dims.h / 2 + 4 : dims.kind === 'bottle' ? 0 : dims.kind === 'uniform' ? dims.h / 2 + 2 : dims.h / 2 + 1;
  const labelZ = dims.kind === 'book' ? dims.d / 2 + 1.5 : dims.kind === 'pen' ? 0 : dims.kind === 'bag' ? dims.d / 2 + 3 : dims.kind === 'bottle' ? 3 : dims.kind === 'uniform' ? dims.d / 2 + 2 : dims.h / 2 + 1;

  return (
    <group scale={scale}>
      {dims.kind === 'book' && (
        imageUrl ? (
          <TextureFallbackBoundary fallback={<BookModel width={dims.w} height={dims.h} depth={dims.d} coverColor={colorStr} />}>
            <Suspense fallback={<BookModel width={dims.w} height={dims.h} depth={dims.d} coverColor={colorStr} />}>
              <TexturedProduct
                imageUrl={imageUrl}
                width={dims.w}
                height={dims.h}
                depth={dims.d}
                coverColor={colorStr}
              />
            </Suspense>
          </TextureFallbackBoundary>
        ) : (
          <BookModel width={dims.w} height={dims.h} depth={dims.d} coverColor={colorStr} />
        )
      )}
      {dims.kind === 'pen' && <PenModel length={dims.length} color={colorStr} />}
      {dims.kind === 'pencil' && <PencilModel length={dims.length} color={colorStr} />}
      {dims.kind === 'ruler' && <RulerModel width={dims.w} color={colorStr} />}
      {dims.kind === 'geometry' && <GeometrySetModel color={colorStr} />}
      {dims.kind === 'case' && <PencilCaseModel width={dims.w} height={dims.h} depth={dims.d} color={colorStr} />}
      {dims.kind === 'calc' && <CalculatorModel width={dims.w} depth={dims.d} color={colorStr} />}
      {dims.kind === 'bag' && <BackpackModel width={dims.w} height={dims.h} depth={dims.d} color={colorStr} />}
      {dims.kind === 'uniform' && <UniformModel width={dims.w} height={dims.h} depth={dims.d} color={colorStr} />}
      {dims.kind === 'bottle' && <WaterBottleModel color={colorStr} />}
      {dims.kind === 'box' && (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[dims.w, dims.h, dims.d]} />
          <meshStandardMaterial color={colorStr} roughness={0.5} />
        </mesh>
      )}
      {!imageUrl && (
        <Text
          position={[0, labelY, labelZ]}
          rotation={dims.kind === 'book' ? [0, Math.PI, 0] : [0, 0, 0]}
          fontSize={dims.kind === 'book' ? 1.45 : 1}
          maxWidth={dims.kind === 'book' ? dims.w * 0.82 : dims.kind === 'bag' ? dims.w * 1.4 : 12}
          color="#FFFFFF"
          outlineWidth={0.14}
          outlineColor="#0B1F3A"
          anchorX="center"
          anchorY="middle"
          renderOrder={10}
        >
          {name.length > 24 ? name.slice(0, 23) + '…' : name}
        </Text>
      )}
    </group>
  );
}
