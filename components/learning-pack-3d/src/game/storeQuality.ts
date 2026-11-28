/**
 * Quality tiers for the 3D bookshop.
 *
 * Many parents will open the shop on low-end Android phones, so every
 * expensive effect (real shadows, antialiasing, high pixel ratio, extra
 * light pools) is switched by tier. Force a tier while testing with
 * ?quality=low | medium | high in the URL.
 */
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export type QualityTier = "low" | "medium" | "high";

export interface QualitySettings {
  /** [min, max] device pixel ratio passed to <Canvas dpr> */
  dpr: [number, number];
  /** Real shadow maps from the key light */
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  /** Soft glowing pools on the floor under each ceiling panel */
  lightPools: boolean;
  /** Dark soft patches where shelves meet the floor */
  shelfContactShadows: boolean;
  /** Camera collision against shelves (raycast each frame) */
  cameraCollision: boolean;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  low: {
    dpr: [1, 1],
    shadows: false,
    shadowMapSize: 512,
    antialias: false,
    lightPools: false,
    shelfContactShadows: true, // very cheap, keeps a lot of depth
    cameraCollision: true,
  },
  medium: {
    dpr: [1, 1.5],
    shadows: true,
    shadowMapSize: 1024,
    antialias: false,
    lightPools: true,
    shelfContactShadows: true,
    cameraCollision: true,
  },
  high: {
    dpr: [1, 2],
    shadows: true,
    shadowMapSize: 2048,
    antialias: true,
    lightPools: true,
    shelfContactShadows: true,
    cameraCollision: true,
  },
};

export function detectQualityTier(): QualityTier {
  if (typeof window === "undefined") return "medium";

  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "low" || forced === "medium" || forced === "high") return forced;

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memoryGb = nav.deviceMemory ?? 4; // Chrome/Android only; others assume 4
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 600;

  if (memoryGb <= 2 || (touch && cores <= 4)) return "low";
  if (touch || smallScreen || memoryGb <= 4) return "medium";
  return "high";
}

/**
 * Watches the real frame rate and lowers the pixel ratio if the device
 * struggles (and raises it again when there is headroom). Put it once
 * inside <Canvas>.
 */
export function AdaptivePixelRatio({ min = 0.75, max = 2 }: { min?: number; max?: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const viewportDpr = useThree((s) => s.viewport.dpr);
  const frames = useRef(0);
  const elapsed = useRef(0);
  const current = useRef(viewportDpr);

  useFrame((_, delta) => {
    frames.current += 1;
    elapsed.current += delta;
    if (elapsed.current < 2) return; // sample every 2 seconds

    const fps = frames.current / elapsed.current;
    frames.current = 0;
    elapsed.current = 0;

    let next = current.current;
    if (fps < 40) next = Math.max(min, current.current - 0.25);
    else if (fps > 57) next = Math.min(max, current.current + 0.125);

    if (next !== current.current) {
      current.current = next;
      setDpr(next);
    }
  });

  return null;
}
