import {useRef} from "react";import {useFrame} from "@react-three/fiber";
const Plane=({x,w,color,y=-.03})=><mesh rotation={[-Math.PI/2,0,0]} position={[x,y,0]} receiveShadow><planeGeometry args={[w,400]}/><meshStandardMaterial color={color} roughness={.95}/></mesh>;
const CARS=[["#f2c200",-28.5,-80,7,true],["#d1d5db",-28.5,-20,9],["#2563eb",-25.5,40,-6],["#ffffff",28.5,60,8,true],["#E63B00",25.5,-10,-6],["#16a34a",25.5,-60,-10,true]];
function Car({c,x,z,s,van}){const g=useRef();useFrame((_,dt)=>{const p=g.current.position;p.z+=s*dt;if(p.z>100)p.z=-100;if(p.z<-100)p.z=100});
 return <group ref={g} position={[x,0,z]}><mesh position={[0,van?1.15:.75,0]} castShadow><boxGeometry args={van?[2.1,1.5,5.2]:[1.9,.8,4.2]}/><meshStandardMaterial color={c}/></mesh>
  <mesh position={[0,van?1.55:1.45,-.2]}><boxGeometry args={van?[2.14,.5,4.2]:[1.7,.65,2.2]}/><meshStandardMaterial color="#233446"/></mesh></group>}
export default function Outside(){return(<group>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.05,0]}><planeGeometry args={[400,400]}/><meshStandardMaterial color="#7fb069" roughness={1}/></mesh>
 {[-21,21].map(x=><Plane key={x} x={x} w={6} color="#cfd3da" y={-.04}/>)}{[-27,27].map(x=><Plane key={x} x={x} w={8} color="#3a3d44"/>)}
 {Array.from({length:20},(_,i)=>{const h=8+(i*7%13),w=9+(i*5%6),d=10+(i*3%6);return <mesh key={i} position={i<14?[(i%2?1:-1)*(42+(i*11%10)),h/2,-120+i*15]:[-60+(i-14)*24,h/2,-75]} castShadow><boxGeometry args={[w,h,d]}/><meshStandardMaterial color={["#f2d7b6","#d9e4ee","#e8c4c4","#c9dfc9","#f4e3a1"][i%5]}/></mesh>})}
 {Array.from({length:30},(_,i)=><group key={i} position={[(i%2?1:-1)*20.8,0,-100+(i>>1)*13+(i%3)]}><mesh position={[0,1.5,0]} castShadow><cylinderGeometry args={[.18,.28,3,8]}/><meshStandardMaterial color="#6b4a2b"/></mesh><mesh position={[0,3.4,0]} scale={[1.8,.8,1.8]} castShadow><sphereGeometry args={[1,10,6]}/><meshStandardMaterial color="#4f8f3a"/></mesh></group>)}
 {CARS.map(([c,x,z,s,van],i)=><Car key={i} c={c} x={x} z={z} s={s} van={van}/>)}</group>)}
