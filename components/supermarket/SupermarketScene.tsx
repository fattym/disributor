'use client';

import { Suspense, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { Box3, DirectionalLight } from 'three';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment } from '@react-three/drei';
import { Shelves } from './Shelves';
import { CharacterController } from './3d/CharacterController';
import { StoreEnvironment } from './3d/StoreEnvironment';
import { computeLayout } from './3d/ShelfUnit';
import { ProductMapping, ShelfSection, StorefrontProduct } from '@/lib/types/storefront';
import { useSupermarketStore } from '@/lib/store/supermarketStore';
import { storefrontApi } from '@/lib/storefrontApi';
import { synthesizeMappings, normalizeMappings } from '@/lib/supermarketMappings';
import { PlacedProduct } from './3d/ShelfUnit';
import { MobileControls } from './MobileControls';
import { getFlatTaxonomy, navigationData } from '@/lib/shopCategories';

function HoverHighlight() {
  const hoveredProduct = useSupermarketStore((s) => s.hoveredProduct);
  if (!hoveredProduct) return null;
  return (
    <group position={hoveredProduct.worldPosition}>
      {/* Horizontal halo around the product base */}
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8.5, 12, 32]} />
        <meshBasicMaterial color="#FBBF24" transparent opacity={0.95} side={2} />
      </mesh>
    </group>
  );
}

function DirectionalLightWithShadow() {
  const light = useRef<DirectionalLight>(null!);
  useLayoutEffect(() => {
    if (light.current) {
      light.current.shadow.mapSize.width = 1024;
      light.current.shadow.mapSize.height = 1024;
      light.current.shadow.camera.top = 200;
      light.current.shadow.camera.bottom = -200;
      light.current.shadow.camera.left = -200;
      light.current.shadow.camera.right = 200;
    }
  }, []);
  return <directionalLight ref={light} castShadow position={[120, 260, 100]} intensity={0.9} />;
}

// Keep only one mapping per product; real backend mappings win over synthesized.
function mergeMappings(mappings: ProductMapping[]): ProductMapping[] {
  const byProduct = new Map<number, ProductMapping>();
  for (const m of mappings) {
    if (!byProduct.has(m.product)) byProduct.set(m.product, m);
  }
  return Array.from(byProduct.values());
}

export interface SupermarketSceneProps {
  targetAisle: string | null;
  onArrive: () => void;
}

export function SupermarketScene({ targetAisle, onArrive }: SupermarketSceneProps) {
  const setMappings = useSupermarketStore((s) => s.setMappings);
  const setProducts = useSupermarketStore((s) => s.setProducts);
  const setSelectedProduct = useSupermarketStore((s) => s.setSelectedProduct);
  const setHoveredProduct = useSupermarketStore((s) => s.setHoveredProduct);
  const setBooklistKioskOpen = useSupermarketStore((s) => s.setBooklistKioskOpen);
  const { searchQuery, categoryFilter } = useSupermarketStore((s) => ({
    searchQuery: s.searchQuery,
    categoryFilter: s.categoryFilter,
  }));
  const [sections, setSections] = useState<ShelfSection[]>([]);
  const [mappings, setMappingsLocal] = useState<ProductMapping[]>([]);
  const [productsMap, setProductsMap] = useState<Record<number, StorefrontProduct>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileInput, setMobileInput] = useState({ forward: false, backward: false, left: false, right: false, rotateLeft: false, rotateRight: false, interact: false });
  const [resetToken, setResetToken] = useState(0);
  const [tourToken, setTourToken] = useState(0);
  const [tourStopToken, setTourStopToken] = useState(0);
  // When a department is selected in the panel, jump the camera there.

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mapList, prodList] = await Promise.all([
          storefrontApi.getModelMappings().catch(() => []),
          storefrontApi.getPublicProducts().catch(() => []),
        ]);
        const shopDepartments = navigationData.map((category, index) => ({
          id: -(index + 1),
          name: category.label,
          slug: category.slug,
          display_order: index + 1,
          color: ['#EA580C', '#2563EB', '#7C3AED', '#059669', '#DB2777', '#CA8A04', '#0F766E'][index % 7],
        }));
        // Supermarket departments are the navigation data — the backend's own
        // shelf-sections are only used to resolve products, never rendered as
        // separate aisles, so the CategoryPanel's department navigation always
        // has a matching aisle to jump to.
        const mergedSections = shopDepartments;
        setSections(mergedSections);
        // Re-bucket the real backend mappings onto supermarket departments,
        // then merge with synthesized mappings (backend wins per product).
        const normalizedBackend = normalizeMappings(mapList, mergedSections, prodList);
        const synthesized = synthesizeMappings(prodList, mergedSections, normalizedBackend);
        const allMappings = [...normalizedBackend, ...synthesized];
        const deduped = mergeMappings(allMappings);
        setMappingsLocal(deduped);
        setMappings(deduped);
        setProducts(prodList);
        const prodMap: Record<number, StorefrontProduct> = {};
        prodList.forEach((p) => { prodMap[p.id] = p; });
        setProductsMap(prodMap);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load store');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setMappings, setProducts]);

  const layout = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const visibleMappings = mappings.filter((mapping) => {
      const searchable = `${mapping.product_name} ${mapping.category_name} ${mapping.shelf_section_name}`.toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (categoryFilter === 'All departments') return true;

      const leaf = getFlatTaxonomy().find((item) => item.fullPath === categoryFilter);
      if (!leaf) return mapping.shelf_section_name === categoryFilter;
      const product = productsMap[mapping.product];
      const productText = [
        product?.name,
        product?.category_name,
        ...(product?.tags || []).map((tag) => tag.name),
      ].join(' ').toLowerCase();
      const filterTerms = [leaf.itemLabel, leaf.groupLabel, leaf.categoryLabel, ...(leaf.tags || [])];
      return filterTerms.some((term) => term && productText.includes(term.toLowerCase()));
    });
    if (!visibleMappings.length) return { shelfUnits: [], obstacles: [] as Box3[], placedProducts: [] as PlacedProduct[] };
    return computeLayout(visibleMappings, sections);
  }, [mappings, sections, searchQuery, categoryFilter, productsMap]);

  // Map each department slug to the aisle center (x, z) of its shelf section so
  // the CategoryPanel can jump the camera straight to that aisle.
  const aisleTargets = useMemo(() => {
    const targets: Record<string, { x: number; z: number }> = {};
    for (const unit of layout.shelfUnits) {
      const section = sections.find((s) => s.name === unit.departmentName);
      if (section) targets[section.slug] = { x: unit.centerX, z: 0 };
    }
    return targets;
  }, [layout.shelfUnits, sections]);

  const jumpTarget = targetAisle ? aisleTargets[targetAisle] ?? null : null;

  const handleArriveAtAisle = () => {
    setTourStopToken((v) => v + 1);
    onArrive();
  };

  const handleInteract = (product: PlacedProduct | null) => {
    if (product && productsMap[product.mapping.product]) {
      setSelectedProduct({
        mapping: product.mapping,
        product: productsMap[product.mapping.product],
        worldPosition: product.position,
      });
    } else {
      setSelectedProduct(null);
    }
  };

  const handleHover = (product: PlacedProduct | null) => {
    if (product && productsMap[product.mapping.product]) {
      setHoveredProduct({
        mapping: product.mapping,
        product: productsMap[product.mapping.product],
        worldPosition: product.position,
      });
    } else {
      setHoveredProduct(null);
    }
  };

  if (loading) {
    return (
      <div className="supermarket-loading">
        <div className="spinner" />
        <p>Loading supermarket…</p>
      </div>
    );
  }
  if (error) {
    return <div className="supermarket-error">Failed to load store: {error}</div>;
  }

  return (
    <>
<div className="lp-navigation-controls">
        <div className="lp-movement-help">Drive: W/S forward/reverse · A/D steer · Drag to orbit camera · Scroll to zoom · E to inspect</div>
        <button type="button" className="lp-cam-btn" onClick={() => setResetToken((v) => v + 1)} aria-label="Reset camera" title="Reset camera">↺</button>
        <button type="button" className="lp-cam-btn lp-cam-btn--tour" onClick={() => setTourToken((v) => v + 1)} aria-label="Start guided tour" title="Start guided tour">▶</button>
        <button type="button" className="lp-cam-btn" onClick={() => setTourStopToken((v) => v + 1)} aria-label="Stop guided tour" title="Stop guided tour">■</button>
      </div>
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [-140, typeof window !== 'undefined' && window.innerWidth < 900 ? 118 : 92, -50], fov: typeof window !== 'undefined' && window.innerWidth < 900 ? 62 : 55 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#F4F5F7']} />
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#dbe4ef', 1.15]} />
      <DirectionalLightWithShadow />
      <Environment preset="warehouse" environmentIntensity={0.35} />
      <ContactShadows position={[0, -0.35, 0]} opacity={0.4} scale={520} blur={2.5} far={30} resolution={512} />
      <Suspense fallback={null}>
        <StoreEnvironment
          sections={sections}
          onBooklistKiosk={() => setBooklistKioskOpen(true)}
        />
      </Suspense>
      <Shelves shelfUnits={layout.shelfUnits} />
      <HoverHighlight />
       <CharacterController
         obstacles={layout.obstacles}
         products={layout.placedProducts}
         onInteract={handleInteract}
         onInteractHold={handleHover}
         mobileInput={mobileInput}
         resetToken={resetToken}
         tourToken={tourToken}
         tourStopToken={tourStopToken}
         jumpTarget={jumpTarget}
         onArrive={handleArriveAtAisle}
       />
    </Canvas>
    <MobileControls onChange={setMobileInput} />
    </>
  );
}
