/* eslint-disable react-hooks/refs */
import { useRef, useEffect, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box3, Vector3, Group, MathUtils } from 'three';
import { Trolley } from './Trolley';
import { PlacedProduct } from './ShelfUnit';
import { STORE_DIMENSIONS } from './StoreEnvironment';

const TURN_SPEED = 3.4;
const TURN_ACCEL = 10;
const MAX_SPEED = 90;
const ACCEL = 12;
const CAM_THETA_FOLLOW = 5;
const CAM_THETA_DEFAULT = 0;
const CAM_DIST = 110;
const CAM_HEIGHT = 40;
const CHARACTER_HEIGHT = 68;
const CHARACTER_RADIUS = 4.5;
const HOVER_RADIUS = 24;
const CAM_MIN_DIST = 70;
const CAM_MAX_DIST = 150;

// Reusable vector objects to avoid GC pressure every frame
const TWO_PI = Math.PI * 2;
const _worldMove = new Vector3();
const _nextPos = new Vector3();
const _camOffset = new Vector3();
const _targetCamPos = new Vector3();
const _lookAt = new Vector3();
const _lookAtOffset = new Vector3(0, CHARACTER_HEIGHT / 2, 0);
const _charPos = new Vector3();
const _trolleyTarget = new Vector3();

function rotateTowardsAngle(current: number, target: number, speed: number, dt: number): number {
  let d = target - current;
  d = ((d + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
  const step = speed * dt;
  if (Math.abs(d) <= step) return target;
  return current + Math.sign(d) * step;
}
function wrapAngle(a: number): number {
  return ((a + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
}

interface Props {
  obstacles: Box3[];
  products: PlacedProduct[];
  onInteract: (product: PlacedProduct | null) => void;
  onInteractHold?: (product: PlacedProduct | null) => void;
  mobileInput?: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    rotateLeft: boolean;
    rotateRight: boolean;
    interact: boolean;
  };
  resetToken?: number;
  tourToken?: number;
  tourStopToken?: number;
  jumpTarget?: { x: number; z: number } | null;
  onArrive?: () => void;
}

export function CharacterController({ obstacles, products, onInteract, onInteractHold, mobileInput, resetToken = 0, tourToken = 0, tourStopToken = 0, jumpTarget = null, onArrive }: Props) {
  const { camera, gl } = useThree();
  const jumpTargetRef = useRef<{ x: number; z: number } | null>(null);
  const jumping = useRef(false);
  const trolley = useRef<Group>(null!);
  const nearest = useRef<PlacedProduct | null>(null);
  const interactPressed = useRef(false);
  const lastInteractedId = useRef<number | null>(null);
  const angularVel = useRef(0);
  // Mutable state shared with the Character model so its walk cycle stays live
  // without forcing a React re-render each frame.
  const charState = useRef({ moving: false, direction: 0 });
  const pos = useRef(new Vector3(0, 0, 0));
  const targetPos = useRef(new Vector3(0, 0, 0));
  const yaw = useRef(0);
  const camTheta = useRef(CAM_THETA_DEFAULT);
  const camThetaOffset = useRef(CAM_THETA_DEFAULT);
  const camPhi = useRef(0.5);
  const camDist = useRef(CAM_DIST);
  const moveDir = useRef({ forward: false, backward: false, left: false, right: false, rotateLeft: false, rotateRight: false });
  const speed = useRef(0);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const moving = useRef(false);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touring = useRef(false);
  const tourStep = useRef(0);
  const tourStopRef = useRef(0);
  const halfW = STORE_DIMENSIONS.width / 2 - 20;
  const halfD = STORE_DIMENSIONS.depth / 2 - 20;

  const tourWaypoints = useRef<Vector3[]>([
    new Vector3(-140, 0, -40),
    new Vector3(-80, 0, -40),
    new Vector3(-20, 0, 0),
    new Vector3(40, 0, 40),
    new Vector3(100, 0, 40),
    new Vector3(140, 0, 0),
    new Vector3(100, 0, -40),
    new Vector3(40, 0, -40),
    new Vector3(0, 0, 0),
    new Vector3(-60, 0, 40),
    new Vector3(-140, 0, 20),
    new Vector3(-100, 0, -20),
  ]);

  const obsBox = useRef(new Box3());

  useLayoutEffect(() => {
    const canvas = gl.domElement;
    // Place the camera at its natural follow position on mount to avoid a
    // visible jump from the static camera prop on the first rendered frame.
    _camOffset.set(
      Math.sin(camTheta.current) * camDist.current * Math.cos(camPhi.current),
      CAM_HEIGHT + camDist.current * Math.sin(camPhi.current),
      Math.cos(camTheta.current) * camDist.current * Math.cos(camPhi.current),
    );
    _targetCamPos.copy(pos.current).add(_camOffset);
    camera.position.lerp(_targetCamPos, 0.2);
    _lookAt.copy(pos.current).add(_lookAtOffset);
    camera.lookAt(_lookAt);
    const down = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    };
    const move = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      camTheta.current -= dx * 0.005;
      camPhi.current = Math.min(1.35, Math.max(0.15, camPhi.current - dy * 0.005));
      camThetaOffset.current = wrapAngle(camTheta.current - yaw.current);
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      isDragging.current = false;
      canvas.style.cursor = 'grab';
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      camDist.current = Math.min(CAM_MAX_DIST, Math.max(CAM_MIN_DIST, camDist.current + e.deltaY * 0.08));
    };
    canvas.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => {
      canvas.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      canvas.removeEventListener('wheel', wheel);
    };
  }, [gl, camera]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.code;
      if (['KeyW', 'ArrowUp'].includes(k)) moveDir.current.forward = true;
      if (['KeyS', 'ArrowDown'].includes(k)) moveDir.current.backward = true;
      if (['KeyA', 'ArrowLeft'].includes(k)) moveDir.current.left = true;
      if (['KeyD', 'ArrowRight'].includes(k)) moveDir.current.right = true;
      if (k === 'KeyE') {
        e.preventDefault();
        interactPressed.current = true;
      }
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.code;
      if (['KeyW', 'ArrowUp'].includes(k)) moveDir.current.forward = false;
      if (['KeyS', 'ArrowDown'].includes(k)) moveDir.current.backward = false;
      if (['KeyA', 'ArrowLeft'].includes(k)) moveDir.current.left = false;
      if (['KeyD', 'ArrowRight'].includes(k)) moveDir.current.right = false;
      if (k === 'KeyE') interactPressed.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const canMoveTo = (p: Vector3): boolean => {
    if (p.x < -halfW || p.x > halfW || p.z < -halfD || p.z > halfD) return false;
    const box = obsBox.current;
    box.min.set(p.x - CHARACTER_RADIUS, p.y, p.z - CHARACTER_RADIUS);
    box.max.set(p.x + CHARACTER_RADIUS, p.y + CHARACTER_HEIGHT, p.z + CHARACTER_RADIUS);
    for (const obs of obstacles) {
      if (box.intersectsBox(obs)) return false;
    }
    return true;
  };

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.05);
    let turn = 0, accel = 0;
    if (moveDir.current.forward) accel -= 1;
    if (moveDir.current.backward) accel += 1;
    if (moveDir.current.left) turn -= 1;
    if (moveDir.current.right) turn += 1;
    if (mobileInput) {
      if (mobileInput.forward) accel -= 1;
      if (mobileInput.backward) accel += 1;
      if (mobileInput.left) turn -= 1;
      if (mobileInput.right) turn += 1;
      if (mobileInput.rotateLeft) {
        camTheta.current -= 0.03;
        camThetaOffset.current = wrapAngle(camTheta.current - yaw.current);
      }
      if (mobileInput.rotateRight) {
        camTheta.current += 0.03;
        camThetaOffset.current = wrapAngle(camTheta.current - yaw.current);
      }
    }

    // Re-arm the tour whenever the user moves or steers.
    if (touring.current && (isDragging.current || moveDir.current.forward || moveDir.current.backward || moveDir.current.left || moveDir.current.right || mobileInput?.rotateLeft || mobileInput?.rotateRight)) {
      touring.current = false;
    }

    // Steering: A/D / left-right turn the character's heading (car-style).
    // Use angular acceleration so the turn ramps up smoothly instead of snapping.
    const targetAngVel = turn * TURN_SPEED;
    angularVel.current = MathUtils.damp(angularVel.current, targetAngVel, TURN_ACCEL, dt);
    yaw.current += angularVel.current * dt;

    // Smooth acceleration/deceleration for a car-like feel.
    const targetSpeed = accel * MAX_SPEED;
    const s = speed.current = MathUtils.damp(speed.current, targetSpeed, ACCEL, dt);
    moving.current = Math.abs(s) > 0.4;
    charState.current.moving = moving.current;
    charState.current.direction = yaw.current;

    if (Math.abs(s) > 0.4) {
      // Forward vector on the XZ plane from the current heading.
      const fx = -Math.sin(yaw.current);
      const fz = -Math.cos(yaw.current);
      _worldMove.set(fx * s * dt, 0, fz * s * dt);
      _nextPos.copy(pos.current).add(_worldMove);
      if (canMoveTo(_nextPos)) {
        pos.current.copy(_nextPos);
      } else {
        // Slide along shelf edges instead of stopping completely on diagonal collisions.
        _nextPos.set(pos.current.x + _worldMove.x, pos.current.y, pos.current.z);
        if (canMoveTo(_nextPos)) pos.current.copy(_nextPos);
        else {
          _nextPos.set(pos.current.x, pos.current.y, pos.current.z + _worldMove.z);
          if (canMoveTo(_nextPos)) pos.current.copy(_nextPos);
        }
      }
    }
     targetPos.current.copy(pos.current).y = 0;

    // Camera jump to a department aisle: smooth the character's world position
    // straight toward the target, then hand back control on arrival.
    if (jumping.current && jumpTargetRef.current) {
      const jt = jumpTargetRef.current;
      const dist = Math.hypot(pos.current.x - jt.x, pos.current.z - jt.z);
      if (dist < 6) {
        pos.current.set(jt.x, 0, jt.z);
        targetPos.current.copy(pos.current);
        jumping.current = false;
        jumpTargetRef.current = null;
        moving.current = false;
        speed.current = 0;
        angularVel.current = 0;
        charState.current.moving = false;
        onArrive?.();
      } else {
        pos.current.x += (jt.x - pos.current.x) * 0.15;
        pos.current.z += (jt.z - pos.current.z) * 0.15;
        targetPos.current.copy(pos.current).y = 0;
        moving.current = true;
        charState.current.moving = true;
        charState.current.direction = yaw.current;
      }
    }

    if (touring.current) {
      const target = tourWaypoints.current[tourStep.current];
      pos.current.lerp(target, 0.04);
      if (pos.current.distanceTo(target) < 6) {
        tourStep.current = (tourStep.current + 1) % tourWaypoints.current.length;
      }
      camTheta.current = Math.atan2(pos.current.x, pos.current.z) + Math.PI;
      camDist.current = 100;
      camPhi.current = 0.55;
      targetPos.current.copy(pos.current);
    }

    const followSpeed = reducedMotion ? 1 : 0.14;
    const cameraLerp = reducedMotion ? 1 : 0.1;
    // Attach the trolley behind the character in its local rear direction, and
    // yaw it with the heading so the whole vehicle turns like a car.
    _trolleyTarget.set(
      pos.current.x - Math.sin(yaw.current) * 20,
      pos.current.y + 2,
      pos.current.z - Math.cos(yaw.current) * 20,
    );
    trolley.current.position.lerp(_trolleyTarget, followSpeed * 0.85);
    trolley.current.rotation.y = yaw.current;

    // Game-style chase camera: smoothly swing the camera to stay behind the car
    // as it turns. Manual drag/rotate buttons push camTheta directly (the
    // offset is synced there so the camera holds its angle while dragging and
    // resumes the smooth swing once released).
    if (touring.current) {
      // Tour owns the camera angle explicitly.
    } else if (reducedMotion) {
      camTheta.current = wrapAngle(yaw.current + camThetaOffset.current);
    } else {
      camTheta.current = rotateTowardsAngle(
        camTheta.current,
        yaw.current + camThetaOffset.current,
        CAM_THETA_FOLLOW,
        dt,
      );
    }

    _camOffset.set(
      Math.sin(camTheta.current) * camDist.current * Math.cos(camPhi.current),
      CAM_HEIGHT + camDist.current * Math.sin(camPhi.current),
      Math.cos(camTheta.current) * camDist.current * Math.cos(camPhi.current),
    );
    _targetCamPos.copy(pos.current).add(_camOffset);
    camera.position.lerp(_targetCamPos, cameraLerp);
    _lookAt.copy(pos.current).add(_lookAtOffset);
    camera.lookAt(_lookAt);

    _charPos.copy(pos.current);
    let closest: PlacedProduct | null = null;
    let best = HOVER_RADIUS * HOVER_RADIUS;
    for (const p of products) {
      const dx = p.position[0] - _charPos.x;
      const dy = p.position[1] - _charPos.y;
      const dz = p.position[2] - _charPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < best) {
        best = distSq;
        closest = p;
      }
    }
    // Hover highlight: only fire on enter/exit so the panel doesn't re-fire every frame.
    if (closest && best < HOVER_RADIUS * HOVER_RADIUS) {
      if (nearest.current?.mapping.id !== closest.mapping.id) {
        nearest.current = closest;
        onInteractHold?.(closest);
      }
    } else if (nearest.current) {
      nearest.current = null;
      onInteractHold?.(null);
    }

    // Press-to-interact (E / mobile): confirm the hovered product into the
    // interaction panel, only re-firing when the hovered product changes.
    if ((interactPressed.current || mobileInput?.interact) && nearest.current && nearest.current.mapping.id !== lastInteractedId.current) {
      lastInteractedId.current = nearest.current.mapping.id;
      onInteract(nearest.current);
    }
    if (!interactPressed.current && !mobileInput?.interact) lastInteractedId.current = null;
  });

  const handleResetCamera = () => {
    touring.current = false;
    tourStep.current = 0;
    tourStopRef.current = 0;
    pos.current.set(0, 0, 0);
    targetPos.current.copy(pos.current);
    yaw.current = 0;
    speed.current = 0;
    angularVel.current = 0;
    camTheta.current = CAM_THETA_DEFAULT;
    camThetaOffset.current = CAM_THETA_DEFAULT;
    camPhi.current = 0.5;
    camDist.current = CAM_DIST;
    moving.current = false;
    moveDir.current = { forward: false, backward: false, left: false, right: false, rotateLeft: false, rotateRight: false };
  };

  const handleStartTour = () => {
    if (reducedMotion) return;
    touring.current = true;
    tourStep.current = 0;
    speed.current = 0;
    angularVel.current = 0;
    moveDir.current = { forward: false, backward: false, left: false, right: false, rotateLeft: false, rotateRight: false };
    moving.current = false;
  };

  const handleStopTour = () => {
    touring.current = false;
    tourStopRef.current += 1;
    camThetaOffset.current = wrapAngle(camTheta.current - yaw.current);
  };

  useEffect(() => {
    if (resetToken > 0) handleResetCamera();
    // resetToken is an intentional external control signal.
  }, [resetToken]);

  useEffect(() => {
    if (tourToken > 0) handleStartTour();
    // tourToken is an intentional external control signal.
  }, [tourToken]);

  useEffect(() => {
    if (tourStopToken > 0) handleStopTour();
    // tourStopToken is an intentional external control signal.
  }, [tourStopToken]);

  useEffect(() => {
    // Start/redirect a camera jump whenever the prop changes to a new aisle.
    if (jumpTarget) {
      jumpTargetRef.current = jumpTarget;
      jumping.current = true;
      // Face the aisle and stop any active tour during travel.
      yaw.current = Math.atan2(jumpTarget.x - pos.current.x, jumpTarget.z - pos.current.z);
      camThetaOffset.current = wrapAngle(camTheta.current - yaw.current);
      touring.current = false;
      speed.current = 0;
      angularVel.current = 0;
    }
  }, [jumpTarget]);

  return (
    <>
      <group ref={trolley} position={[pos.current.x, pos.current.y, pos.current.z - 20]}>
        <Trolley position={[0, 0, 0]} rotation={0} />
      </group>
    </>
  );
}
