/* eslint-disable react-hooks/immutability -- three.js objects are mutated by design */
/**
 * Game-style third-person camera for the 3D bookshop.
 *
 * Fixes the problems seen in the live store:
 *  - The shopper's head blocked the shelf  -> over-the-shoulder offset
 *  - The camera could tip straight down    -> pitch limited to ~7°–40°
 *  - The camera snapped around             -> smooth damping everywhere
 *  - Shelves came between camera and player -> camera slides in front of them
 *  - Drag-to-look triggered click-to-walk  -> clicks after a drag are swallowed
 *
 * Controls: drag (mouse or one finger) to look around, wheel or pinch to
 * zoom. When the shopper walks and nobody is dragging, the camera eases
 * back behind them.
 *
 * Usage (inside <Canvas>, after the code that moves the target), and REMOVE the old camera/OrbitControls code:
 *   <FollowCamera target={playerRef} />
 *
 * Tag simple shelf collision meshes so the camera avoids them:
 *   <mesh userData={{ cameraBlocker: true }}>
 *     <boxGeometry args={[length, 2.4, 0.9]} />
 *     <meshBasicMaterial visible={false} />   // hidden, but raycasts still hit it
 *   </mesh>
 * (Simple boxes are much cheaper to raycast than thousands of books.)
 *
 * Camera-relative movement for WASD / joystick:
 *   import { followCameraState, cameraRelativeMove } from "./FollowCamera";
 *   const dir = cameraRelativeMove(joystickX, joystickY); // world-space XZ direction
 */
import { RefObject, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gameUi } from "./gameUiStore";

export interface FollowCameraProps {
  target: RefObject<THREE.Object3D | null>;
  /** Default distance behind the shopper (metres). */
  distance?: number;
  minDistance?: number;
  maxDistance?: number;
  /** Height on the shopper the camera looks at (about chest/shoulder). */
  lookHeight?: number;
  /** Sideways offset to the right so the shopper sits left of centre. */
  shoulderOffset?: number;
  /** Starting pitch in radians (0 = level, positive = looking down). */
  pitch?: number;
  minPitch?: number;
  maxPitch?: number;
  /** Bigger = snappier. 6–10 feels like most third-person games. */
  followDamping?: number;
  rotateSpeed?: number;
  /** Ease back behind the shopper while walking. */
  autoFollow?: boolean;
  /** Seconds after the last drag before auto-follow kicks in. */
  autoFollowDelay?: number;
  /** Raycast against userData.cameraBlocker meshes. */
  collision?: boolean;
  /** Widen the FOV slightly while moving, for a sense of speed. */
  baseFov?: number;
  movingFov?: number;
  /** Starting camera yaw in radians. Defaults to directly behind the shopper. */
  initialYaw?: number;
  /** Change this to jump straight behind the shopper (teleport, camera reset). */
  snapKey?: unknown;
  /** Adjusts the camera position in place, e.g. to keep it inside the walkway. */
  constrain?: (position: THREE.Vector3, target: THREE.Vector3) => void;
}

/** Shared state so movement code can be camera-relative. */
export const followCameraState = {
  yaw: 0, // radians; camera sits at target + (sin(yaw), _, cos(yaw)) * distance
  pitch: 0.32,
  distance: 4.2,
  dragging: false,
};

/**
 * Converts joystick/WASD input (x = right, y = forward, each -1..1) to a
 * world-space XZ direction relative to where the camera is looking.
 */
export function cameraRelativeMove(x: number, y: number, out = new THREE.Vector3()) {
  const yaw = followCameraState.yaw;
  // forward = away from camera, right = camera's right
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  out.set(rx * x + fx * y, 0, rz * x + fz * y);
  const len = out.length();
  if (len > 1) out.divideScalar(len);
  return out;
}

const DRAG_THRESHOLD_PX = 6;

// Reused every frame (no garbage while walking)
const targetPos = new THREE.Vector3();
const right = new THREE.Vector3();
const offset = new THREE.Vector3();
const desiredCamPos = new THREE.Vector3();
const rayDir = new THREE.Vector3();

function shortestAngle(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function FollowCamera({
  target,
  distance = 4.2,
  minDistance = 2.2,
  maxDistance = 7.5,
  lookHeight = 1.35,
  shoulderOffset = 0.55,
  pitch = 0.32,
  minPitch = 0.12,
  maxPitch = 0.7,
  followDamping = 8,
  rotateSpeed = 0.005,
  autoFollow = true,
  autoFollowDelay = 1.2,
  collision = true,
  baseFov = 50,
  movingFov = 54,
  initialYaw,
  snapKey,
  constrain,
}: FollowCameraProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  // Desired (input) values and smoothed (rendered) values
  const desired = useRef({ yaw: 0, pitch, distance });
  const smooth = useRef({ yaw: 0, pitch, distance, collisionDistance: distance });
  const lastInputTime = useRef(-Infinity);
  const initialised = useRef(false);

  const pivot = useRef(new THREE.Vector3());
  const smoothPivot = useRef(new THREE.Vector3());
  const lastTargetPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const blockers = useRef<THREE.Object3D[]>([]);
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    initialised.current = false;
  }, [snapKey]);

  /* ---------------- Collect collision meshes ---------------- */
  useEffect(() => {
    if (!collision) return;
    const collect = () => {
      const found: THREE.Object3D[] = [];
      scene.traverse((o) => {
        if (o.userData?.cameraBlocker) found.push(o);
      });
      blockers.current = found;
    };
    collect();
    const t = window.setTimeout(collect, 1500);
    return () => window.clearTimeout(t);
  }, [scene, collision]);

  /* ---------------- Pointer / wheel / pinch input ---------------- */
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let downX = 0;
    let downY = 0;
    let dragged = false;
    let pinchStart = 0;
    let pinchStartDistance = 0;

    const now = () => performance.now() / 1000;

    const onDown = (e: PointerEvent) => {
      if (gameUi.getState().paused) return; // no camera input behind the pause menu
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        downX = e.clientX;
        downY = e.clientY;
        dragged = false;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        pinchStartDistance = desired.current.distance;
      }
    };

    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStart > 0) {
          desired.current.distance = THREE.MathUtils.clamp(
            pinchStartDistance * (pinchStart / d),
            minDistance,
            maxDistance,
          );
        }
        dragged = true;
        lastInputTime.current = now();
        return;
      }

      if (!dragged && Math.hypot(e.clientX - downX, e.clientY - downY) > DRAG_THRESHOLD_PX) {
        dragged = true;
        followCameraState.dragging = true;
        el.setPointerCapture?.(e.pointerId);
      }
      if (!dragged) return;

      const { cameraSensitivity, invertY } = gameUi.getState().settings;
      const speed = rotateSpeed * cameraSensitivity;
      desired.current.yaw -= dx * speed;
      desired.current.pitch = THREE.MathUtils.clamp(
        desired.current.pitch + (invertY ? -dy : dy) * speed,
        minPitch,
        maxPitch,
      );
      lastInputTime.current = now();
    };

    const swallowNextClick = () => {
      const stop = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      // Capture phase on window runs before R3F's click handler.
      window.addEventListener("click", stop, { capture: true, once: true });
      // If no click follows (e.g. touch), remove the trap shortly after.
      window.setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 300);
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        if (dragged) swallowNextClick();
        followCameraState.dragging = false;
        pinchStart = 0;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (gameUi.getState().paused) return;
      e.preventDefault(); // stop the page scrolling while zooming the store
      desired.current.distance = THREE.MathUtils.clamp(
        desired.current.distance * (1 + Math.sign(e.deltaY) * 0.1),
        minDistance,
        maxDistance,
      );
      lastInputTime.current = now();
    };

    el.style.touchAction = "none"; // let us handle one-finger drag and pinch
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, minDistance, maxDistance, minPitch, maxPitch, rotateSpeed]);

  /* ---------------- Per-frame camera update ---------------- */
  useFrame((_, rawDelta) => {
    const t = target.current;
    if (!t) return;
    const dt = Math.min(rawDelta, 0.05); // avoid jumps after a tab switch

    t.getWorldPosition(targetPos);

    // First frame: start right behind the shopper with no easing.
    if (!initialised.current) {
      // Avatars face +Z by default in three.js, so "behind" is rotation + 180°.
      const startYaw = initialYaw ?? t.rotation.y + Math.PI;
      desired.current.yaw = smooth.current.yaw = startYaw;
      smooth.current.pitch = desired.current.pitch;
      lastTargetPos.current.copy(targetPos);
      smoothPivot.current.copy(targetPos).setY(targetPos.y + lookHeight);
      initialised.current = true;
    }

    // Shopper velocity (for auto-follow and FOV)
    velocity.current
      .copy(targetPos)
      .sub(lastTargetPos.current)
      .divideScalar(Math.max(dt, 1e-4));
    lastTargetPos.current.copy(targetPos);
    const speed = Math.hypot(velocity.current.x, velocity.current.z);

    // Ease back behind the shopper while walking
    const sinceInput = performance.now() / 1000 - lastInputTime.current;
    if (autoFollow && !followCameraState.dragging && sinceInput > autoFollowDelay && speed > 0.6) {
      const behindYaw = Math.atan2(-velocity.current.x, -velocity.current.z);
      desired.current.yaw += shortestAngle(desired.current.yaw, behindYaw) * (1 - Math.exp(-1.8 * dt));
    }

    // Smooth the angles and distance
    const k = 1 - Math.exp(-followDamping * dt);
    smooth.current.yaw += shortestAngle(smooth.current.yaw, desired.current.yaw) * k;
    smooth.current.pitch += (desired.current.pitch - smooth.current.pitch) * k;
    smooth.current.distance += (desired.current.distance - smooth.current.distance) * k;

    const { yaw, pitch: p } = smooth.current;
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));

    // Pivot = shoulder point the camera looks at
    pivot.current.copy(targetPos).setY(targetPos.y + lookHeight).addScaledVector(right, shoulderOffset);
    smoothPivot.current.lerp(pivot.current, 1 - Math.exp(-14 * dt));

    offset.set(Math.sin(yaw) * Math.cos(p), Math.sin(p), Math.cos(yaw) * Math.cos(p));

    // Collision: pull the camera in front of shelves between it and the shopper
    let wanted = smooth.current.distance;
    if (collision && blockers.current.length) {
      rayDir.copy(offset).normalize();
      raycaster.current.set(smoothPivot.current, rayDir);
      raycaster.current.far = wanted;
      const hit = raycaster.current.intersectObjects(blockers.current, true)[0];
      if (hit) wanted = Math.max(0.8, hit.distance - 0.3);
    }
    // Move in fast (avoid seeing through shelves), move out slowly (no popping)
    const cd = smooth.current.collisionDistance;
    const lambda = wanted < cd ? 25 : 4;
    smooth.current.collisionDistance = cd + (wanted - cd) * (1 - Math.exp(-lambda * dt));

    desiredCamPos.copy(smoothPivot.current).addScaledVector(offset, smooth.current.collisionDistance);
    camera.position.copy(desiredCamPos);
    constrain?.(camera.position, targetPos);
    camera.lookAt(smoothPivot.current);

    // Slight FOV widening when walking
    const targetFov = speed > 0.5 ? movingFov : baseFov;
    const fov = camera.fov + (targetFov - camera.fov) * (1 - Math.exp(-3 * dt));
    if (Math.abs(fov - camera.fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    followCameraState.yaw = yaw;
    followCameraState.pitch = p;
    followCameraState.distance = smooth.current.collisionDistance;
  });

  return null;
}
