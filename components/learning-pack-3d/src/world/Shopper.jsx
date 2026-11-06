import {useEffect,useLayoutEffect,useRef,useState} from "react";import {useFrame,useThree} from "@react-three/fiber";import {OrbitControls} from "@react-three/drei";import * as THREE from "three";
import Character from "./Character.jsx";import {useKeys} from "./useKeys.js";import {shopperPos,joy} from "./state.js";import {blocked} from "../data/layout.js";import {useShop} from "../store/useShop.js";
const F=new THREE.Vector3(),R=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0),D=new THREE.Vector3();
export default function Shopper(){
 const g=useRef(),ctl=useRef(),keys=useKeys(),{camera}=useThree(),[moving,setMoving]=useState(false),was=useRef(false),teleport=useShop(s=>s.teleport);
 useLayoutEffect(()=>{if(ctl.current)ctl.current.target.set(shopperPos.x,1.2,shopperPos.z)},[]);
 useEffect(()=>{if(!teleport)return;const h=teleport.heading;shopperPos.set(teleport.x,0,teleport.z);g.current.rotation.y=h;
  camera.position.set(teleport.x+Math.sin(h)*6,3,teleport.z+Math.cos(h)*6);ctl.current.target.set(teleport.x,1.2,teleport.z)},[teleport,camera]);
 useFrame((_,dt)=>{if(!ctl.current)return;const k=keys.current,fz=(k.w||k.arrowup?1:0)-(k.s||k.arrowdown?1:0)-joy.y,sx=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0)+joy.x;
  camera.getWorldDirection(F);F.y=0;F.normalize();R.crossVectors(F,UP);D.set(0,0,0).addScaledVector(F,fz).addScaledVector(R,sx);
  const mv=D.length()>.05;if(mv){if(D.length()>1)D.normalize();const s=4.5*dt,p=shopperPos;
   if(!blocked(p.x+D.x*s,p.z))p.x+=D.x*s;if(!blocked(p.x,p.z+D.z*s))p.z+=D.z*s;
   let df=Math.atan2(-D.x,-D.z)-g.current.rotation.y;df=Math.atan2(Math.sin(df),Math.cos(df));g.current.rotation.y+=df*Math.min(1,dt*10)}
  if(mv!==was.current){was.current=mv;setMoving(mv)}
  g.current.position.set(shopperPos.x,0,shopperPos.z);
  D.set(shopperPos.x,1.2,shopperPos.z).sub(ctl.current.target);camera.position.add(D);ctl.current.target.add(D);ctl.current.update()});
 return(<><OrbitControls ref={ctl} enablePan={false} minDistance={2.2} maxDistance={8} maxPolarAngle={Math.PI/2.15} makeDefault/>
  <group ref={g}><Character url="/models/shopper.glb" moving={moving} pushing/>
   <group position={[0,0,-1.1]}><mesh position={[0,.75,0]} castShadow><boxGeometry args={[.8,.4,1]}/><meshStandardMaterial color="#bfc5cf" metalness={.6} roughness={.4}/></mesh>
    <mesh position={[0,1.25,.55]}><boxGeometry args={[.85,.05,.05]}/><meshStandardMaterial color="#E63B00"/></mesh></group></group></>)}
