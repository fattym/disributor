import { Box3 } from 'three';
import { Text } from '@react-three/drei';
import { ProductModel } from './ProductModel';
import { ProductMapping, ShelfSection } from '@/lib/types/storefront';
import { useSupermarketStore } from '@/lib/store/supermarketStore';

export interface PlacedProduct {
  mapping: ProductMapping;
  position: [number, number, number];
}

export interface ShelfUnitLayout {
  origin: [number, number, number];
  facingZ: number;
  centerX: number;
  products: PlacedProduct[];
  bounds: Box3[];
  departmentName: string;
  departmentColor: string;
}

export interface LayoutResult {
  shelfUnits: ShelfUnitLayout[];
  obstacles: Box3[];
  placedProducts: PlacedProduct[];
}

const NAVY = '#0B1F3A';
const ORANGE = '#E63B00';
const SHELF_WIDTH = 170;
const SHELF_DEPTH = 32;
const SHELF_HEIGHT = 240;
const POST_W = 5;
const BOARD_T = 2;
const BOARD_SPACING = 50;
const PRICE_LABEL_H = 5;
const BASE_Y = BOARD_T / 2;

const PRODUCTS_PER_SHELF = 6;

function productWidth(m: ProductMapping): number {
  switch (m.model_type) {
    case 'textbook': return 13;
    case 'exercise_book': return 14;
    case 'school_bag': return 14;
    case 'uniform': return 18;
    case 'calculator': return 10;
    case 'pencil_case': return 10;
    case 'stationery': return 13;
    case 'pen': return 13;
    case 'pencil': return 13;
    case 'ruler': return 16;
    case 'geometry_set': return 16;
    case 'water_bottle': return 6;
    default: return 8;
  }
}

function productHeight(modelType: string): number {
  switch (modelType) {
    case 'school_bag': return 24;
    case 'textbook': return 20;
    case 'exercise_book': return 18;
    case 'pencil_case': return 14;
    case 'uniform': return 4;
    case 'calculator': return 5;
    case 'water_bottle': return 24;
    default: return 8;
  }
}

export function computeLayout(mappings: ProductMapping[], sections: ShelfSection[]): LayoutResult {
  const ordered = [...sections].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const bySection: Record<number, ProductMapping[]> = {};
  for (const m of mappings) {
    if (!m.active) continue;
    if (!m.shelf_section) continue;
    bySection[m.shelf_section] = bySection[m.shelf_section] || [];
    bySection[m.shelf_section].push(m);
  }

  const activeSections = ordered.filter((section) => bySection[section.id]?.length);
  const aisleCount = activeSections.length || ordered.length;
  const BUILDING_D = 420;
  const AISLE_SPACING = aisleCount > 1 ? 340 / (aisleCount - 1) : 0;
  const shelfUnits: ShelfUnitLayout[] = [];
  const obstacles: Box3[] = [];
  const placedProducts: PlacedProduct[] = [];

  ordered.forEach((section, i) => {
    const sectionMappings = bySection[section.id] || [];
    const x = -170 + i * AISLE_SPACING;
    if (sectionMappings.length === 0) {
      [-1, 1].forEach((side) => {
        const facingZ = side === 1 ? 1 : -1;
        const wallZ = side === 1 ? -BUILDING_D / 2 + 70 : BUILDING_D / 2 - 70;
        const emptyShelfBounds = new Box3();
        emptyShelfBounds.min.set(x - SHELF_WIDTH / 2 - POST_W, 0, wallZ - SHELF_DEPTH);
        emptyShelfBounds.max.set(x + SHELF_WIDTH / 2 + POST_W, SHELF_HEIGHT, wallZ + SHELF_DEPTH);
        obstacles.push(emptyShelfBounds);
        shelfUnits.push({
          origin: [x, BASE_Y, wallZ] as [number, number, number],
          facingZ,
          centerX: x,
          products: [],
          bounds: [emptyShelfBounds],
          departmentName: section.name,
          departmentColor: section.color || ORANGE,
        });
      });
      return;
    }
    const half = Math.ceil(sectionMappings.length / 2);
    const leftProducts = sectionMappings.slice(0, half);
    const rightProducts = sectionMappings.slice(half);

    [leftProducts, rightProducts].forEach((group, side) => {
      if (group.length === 0) return;
      const facingZ = side === 0 ? 1 : -1;
      const wallZ = side === 0 ? -BUILDING_D / 2 + 70 : BUILDING_D / 2 - 70;
      const inwardDirection = facingZ;
      const productsPerUnit = 18;
      const rowPerShelf = PRODUCTS_PER_SHELF;
      const unitCount = Math.ceil(group.length / productsPerUnit);

      for (let unit = 0; unit < unitCount; unit++) {
        const unitProducts = group.slice(unit * productsPerUnit, (unit + 1) * productsPerUnit);
        const originZ = wallZ + unit * 55 * inwardDirection;
        const placed: PlacedProduct[] = [];
        const shelfCount = Math.ceil(unitProducts.length / rowPerShelf);

         for (let s = 0; s < shelfCount; s++) {
           const row = unitProducts.slice(s * rowPerShelf, (s + 1) * rowPerShelf);
           if (row.length === 0) continue;
           const rowWidth = row.reduce((acc, m) => acc + productWidth(m) + 1.5, 0);
           const startX = -SHELF_WIDTH / 2 + 10 + rowWidth / 2;
           let cursor = startX;
           const levelY = BASE_Y + s * BOARD_SPACING;
           for (const m of row) {
             const w = productWidth(m);
             const px = cursor + w / 2;
             const py = levelY + productHeight(m.model_type) / 2 + 1.5;
             placed.push({ mapping: m, position: [x + px * facingZ, py, originZ] });
             cursor += w + 1.5;
           }
           // Full shelf footprint (full-height) so the character can't walk
           // through a shelf row, but can still stand at the shelf face to
           // reach the products that protrude from it.
           const b = new Box3();
           b.min.set(x - SHELF_WIDTH / 2 - POST_W, 0, originZ - SHELF_DEPTH);
           b.max.set(x + SHELF_WIDTH / 2 + POST_W, SHELF_HEIGHT, originZ + SHELF_DEPTH);
           obstacles.push(b);
           const postZ = facingZ === 1 ? originZ - SHELF_DEPTH / 2 : originZ + SHELF_DEPTH / 2;
           const postB = new Box3();
           postB.min.set(x - SHELF_WIDTH / 2 - POST_W, 0, postZ - POST_W / 2);
           postB.max.set(x - SHELF_WIDTH / 2 + POST_W, SHELF_HEIGHT, postZ + POST_W / 2);
           obstacles.push(postB);
           const postB2 = new Box3();
           postB2.min.set(x + SHELF_WIDTH / 2 - POST_W, 0, postZ - POST_W / 2);
           postB2.max.set(x + SHELF_WIDTH / 2 + POST_W, SHELF_HEIGHT, postZ + POST_W / 2);
           obstacles.push(postB2);
         }
        shelfUnits.push({
          origin: [x, BASE_Y, originZ] as [number, number, number],
          facingZ,
          centerX: x,
          products: placed,
          bounds: [],
          departmentName: section.name,
          departmentColor: section.color || '#E63B00',
        });
        placedProducts.push(...placed);
      }
    });
  });

  return { shelfUnits, obstacles, placedProducts };
}

function ShelfSupports({ x, z, facingZ }: { x: number; z: number; facingZ: number }) {
  const postZ = facingZ === 1 ? z - SHELF_DEPTH / 2 + POST_W / 2 : z + SHELF_DEPTH / 2 - POST_W / 2;
  return (
    <>
      <mesh position={[x - SHELF_WIDTH / 2, SHELF_HEIGHT / 2, postZ]} castShadow>
        <boxGeometry args={[POST_W, SHELF_HEIGHT, POST_W]} />
        <meshStandardMaterial color={NAVY} metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[x + SHELF_WIDTH / 2, SHELF_HEIGHT / 2, postZ]} castShadow>
        <boxGeometry args={[POST_W, SHELF_HEIGHT, POST_W]} />
        <meshStandardMaterial color={NAVY} metalness={0.45} roughness={0.35} />
      </mesh>
    </>
  );
}

function ShelfBoard({ x, z, facingZ, level }: { x: number; z: number; facingZ: number; level: number }) {
  const y = BASE_Y + level * BOARD_SPACING;
  const postZ = facingZ === 1 ? z - SHELF_DEPTH / 2 : z + SHELF_DEPTH / 2;
  return (
    <>
      <mesh position={[x, y, postZ]} castShadow receiveShadow>
        <boxGeometry args={[SHELF_WIDTH, BOARD_T, SHELF_DEPTH]} />
        <meshStandardMaterial color="#D7DBE0" roughness={0.7} />
      </mesh>
      {/* Front price-label strip */}
      <mesh
        position={[x, y + BOARD_T / 2 + PRICE_LABEL_H / 2, facingZ === 1 ? postZ - SHELF_DEPTH / 2 - 0.6 : postZ + SHELF_DEPTH / 2 + 0.6]}
        castShadow
      >
        <boxGeometry args={[SHELF_WIDTH, PRICE_LABEL_H, 1]} />
        <meshStandardMaterial color={ORANGE} roughness={0.5} />
      </mesh>
      {/* White text strip behind price label */}
      <mesh position={[x, y + BOARD_T / 2 + PRICE_LABEL_H / 2, facingZ === 1 ? postZ - SHELF_DEPTH / 2 - 0.55 : postZ + SHELF_DEPTH / 2 + 0.55]}>
        <boxGeometry args={[SHELF_WIDTH - 4, PRICE_LABEL_H - 1, 0.5]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
      </mesh>
    </>
  );
}

export function ShelfUnitRenderer({ products, centerX, z, facingZ, departmentName, departmentColor }: { products: PlacedProduct[]; centerX: number; z: number; facingZ: number; departmentName: string; departmentColor: string }) {
  const maxLevel = products.length > 0
    ? Math.floor(Math.max(...products.map((p) => p.position[1])) / BOARD_SPACING)
    : 3;

  return (
    <group>
      <ShelfSupports x={centerX} z={z} facingZ={facingZ} />
      <group position={[centerX, SHELF_HEIGHT + 12, z]} rotation={[0, facingZ === 1 ? 0 : Math.PI, 0]}>
        <mesh position={[0, 0, facingZ === 1 ? -SHELF_DEPTH / 2 - 1 : SHELF_DEPTH / 2 + 1]}>
          <boxGeometry args={[Math.min(150, 30 + departmentName.length * 5), 22, 2]} />
          <meshStandardMaterial color={departmentColor} roughness={0.45} />
        </mesh>
        <Text
          position={[0, 0, facingZ === 1 ? -SHELF_DEPTH / 2 - 2.2 : SHELF_DEPTH / 2 + 2.2]}
          fontSize={8}
          maxWidth={140}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
        >
          {departmentName.toUpperCase()}
        </Text>
      </group>
      {[...Array(maxLevel + 1)].map((_, level) => (
        <ShelfBoard key={level} x={centerX} z={z} facingZ={facingZ} level={level} />
      ))}
      <ShelfUnitProductRenderer products={products} centerX={centerX} z={z} facingZ={facingZ} />
    </group>
  );
}

function ShelfUnitProductRenderer({ products, centerX, z, facingZ }: { products: PlacedProduct[]; centerX: number; z: number; facingZ: number }) {
  void centerX; void z;
  const productsById = useSupermarketStore((state) => state.products);
  const setSelectedProduct = useSupermarketStore((state) => state.setSelectedProduct);
  const rotation: [number, number, number] = facingZ === 1 ? [0, 0, 0] : [0, Math.PI, 0];
  return (
    <>
      {products.map((p) => (
        <group
          key={p.mapping.id}
          position={p.position}
          rotation={rotation}
          onClick={(event) => {
            event.stopPropagation();
            const product = productsById.find((candidate) => candidate.id === p.mapping.product);
            if (product) setSelectedProduct({ mapping: p.mapping, product, worldPosition: p.position });
          }}
        >
          <ProductModel modelType={p.mapping.model_type} name={p.mapping.product_name} section={p.mapping.shelf_section_name} imageUrl={p.mapping.image_url ?? null} />
        </group>
      ))}
    </>
  );
}
