import { Vector3 } from "three";

// Mutable, non-reactive state read every frame (avoids React re-renders).
export const shopperPos = new Vector3(0, 0, 9);
export const shopperHeading = { value: 0 };
export const joy = { x: 0, y: 0 };

/** Phones and low-core devices get cheaper shadows, smaller atlases and a lower pixel ratio. */
export const lowEnd = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 800 || (navigator.hardwareConcurrency || 8) <= 4);
