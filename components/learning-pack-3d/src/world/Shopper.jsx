import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Character from "./Character.jsx";
import Trolley from "./Trolley.jsx";
import { useKeys } from "./useKeys.js";
import { joy, shopperHeading, shopperPos } from "./state.js";
import { AISLES } from "../data/catalogue.js";
import { FACING_DZ, FACING_Z0, PER_LEVEL, SPAWN, TOUR, UNIT_X, aisleSide, blocked, clampCamera, tileOfSlot } from "../data/layout.js";
import { useShop } from "../store/useShop.js";

const F = new THREE.Vector3();
const R = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const D = new THREE.Vector3();
const WALK_SPEED = 3.8;
const TOUR_SPEED = 3.2;
const LOOK_Y = 1.65; // the camera looks a little above the shopper so signs and shelf tops stay in frame
const REACH = 3.7; // how far from a shelf face the shopper can "reach" a product

/** Which aisle is in front of the shopper, and which eye-level product is nearest to them. */
function lookAround(x, z, heading) {
  if (z > 3.4 || z < -16.8) return { aisle: -1, product: null };
  const fx = -Math.sin(heading);
  let best = -1;
  let bestScore = -1e9;
  for (let a = 0; a < 8; a++) {
    const side = aisleSide(a);
    const shelfX = UNIT_X[a >> 1] + side * 0.62;
    const out = (x - UNIT_X[a >> 1]) * side; // positive when standing on this aisle's walkway side
    if (out <= 0.5) continue;
    const lateral = Math.abs(shelfX - x);
    if (lateral > REACH) continue;
    const facing = (fx * (shelfX - x)) / Math.max(lateral, 0.01); // 1 when looking straight at the shelf
    const score = facing * 2 - lateral * 0.15;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  if (best < 0) return { aisle: -1, product: null };
  const list = useShop.getState().stock[best];
  const k = Math.min(PER_LEVEL - 1, Math.max(0, Math.round((z - FACING_Z0) / FACING_DZ)));
  return { aisle: best, product: list.length ? list[tileOfSlot(k, list.length)] : null };
}

export default function Shopper() {
  const g = useRef();
  const ctl = useRef();
  const keys = useKeys();
  const { camera } = useThree();
  const [moving, setMoving] = useState(false);
  const was = useRef(false);
  const tourState = useRef({ i: 0, pause: 0 });
  const scan = useRef(0);
  const teleport = useShop((s) => s.teleport);
  const resetToken = useShop((s) => s.resetToken);
  const tour = useShop((s) => s.tour);

  /** Put the camera behind the shopper at a comfortable distance, looking at them. */
  const frameShopper = (dist = 5.8, height = 3.3, az = 0.42) => {
    // slightly off to the shopper's right so the trolley stays visible in front of them
    const h = g.current.rotation.y + az;
    camera.position.set(shopperPos.x + Math.sin(h) * dist, height, shopperPos.z + Math.cos(h) * dist);
    ctl.current.target.set(shopperPos.x, LOOK_Y, shopperPos.z);
    clampCamera(camera.position, shopperPos.x);
    ctl.current.update();
  };

  useLayoutEffect(() => {
    shopperPos.set(SPAWN.x, 0, SPAWN.z);
    g.current.rotation.y = SPAWN.heading;
    frameShopper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!teleport) return;
    shopperPos.set(teleport.x, 0, teleport.z);
    g.current.rotation.y = teleport.heading;
    frameShopper(3.4, 2.3, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teleport]);

  useEffect(() => {
    if (resetToken) {
      frameShopper();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  useEffect(() => {
    if (tour) tourState.current = { i: 0, pause: 0 };
  }, [tour]);

  // E opens the product the shopper is standing in front of.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() !== "e" || /INPUT|SELECT|TEXTAREA/.test(e.target?.tagName || "")) return;
      const { nearby, select } = useShop.getState();
      if (nearby) select(nearby);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  useFrame((_, rawDt) => {
    if (!ctl.current) return;
    const dt = Math.min(rawDt, 0.05);
    const k = keys.current;
    const store = useShop.getState();
    const fz = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0) - joy.y;
    const sx = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0) + joy.x;
    const manual = Math.hypot(fz, sx) > 0.05;
    if (manual && store.tour) store.stopTour();

    camera.getWorldDirection(F);
    F.y = 0;
    F.normalize();
    R.crossVectors(F, UP);
    D.set(0, 0, 0);
    let speed = WALK_SPEED;

    if (store.tour && !manual) {
      const ts = tourState.current;
      if (ts.pause > 0) ts.pause -= dt;
      else {
        const wp = TOUR[ts.i];
        const dx = wp.x - shopperPos.x;
        const dz = wp.z - shopperPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.3) {
          if (wp.say !== undefined) {
            store.say(wp.say === "checkout" ? "Checkout · order via the one Learning Pack checkout" : `Aisle ${wp.say + 1} · ${AISLES[wp.say].long}`);
            ts.pause = 1.6;
          }
          if (++ts.i >= TOUR.length) store.stopTour();
        } else {
          D.set(dx / dist, 0, dz / dist);
          speed = TOUR_SPEED;
        }
      }
    } else if (manual) {
      D.addScaledVector(F, fz).addScaledVector(R, sx);
    }

    const mv = D.lengthSq() > 0.0025;
    if (mv) {
      if (D.length() > 1) D.normalize();
      const s = speed * dt;
      const p = shopperPos;
      if (!blocked(p.x + D.x * s, p.z)) p.x += D.x * s;
      if (!blocked(p.x, p.z + D.z * s)) p.z += D.z * s;
      let df = Math.atan2(-D.x, -D.z) - g.current.rotation.y;
      df = Math.atan2(Math.sin(df), Math.cos(df));
      g.current.rotation.y += df * Math.min(1, dt * 10);
    }
    if (mv !== was.current) {
      was.current = mv;
      setMoving(mv);
    }
    shopperHeading.value = g.current.rotation.y;
    g.current.position.set(shopperPos.x, 0, shopperPos.z);

    // camera follows the shopper; the user's orbit offset is preserved
    D.set(shopperPos.x, LOOK_Y, shopperPos.z).sub(ctl.current.target);
    camera.position.add(D);
    ctl.current.target.add(D);
    ctl.current.update();
    clampCamera(camera.position, shopperPos.x);

    scan.current += dt;
    if (scan.current > 0.15) {
      scan.current = 0;
      const { aisle, product } = lookAround(shopperPos.x, shopperPos.z, g.current.rotation.y);
      if (aisle !== store.aisleHere) store.setAisleHere(aisle);
      if ((product?.id ?? null) !== (store.nearby?.id ?? null)) store.setNearby(product);
    }
  });

  return (
    <>
      <OrbitControls ref={ctl} enablePan={false} minDistance={2.2} maxDistance={9} minPolarAngle={0.25} maxPolarAngle={Math.PI / 2.1} zoomSpeed={0.8} makeDefault />
      <group ref={g}>
        <Character moving={moving} pushing />
        <Trolley />
      </group>
    </>
  );
}
