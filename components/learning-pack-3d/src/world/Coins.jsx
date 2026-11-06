import {useRef} from "react";import {useFrame} from "@react-three/fiber";import {COINS} from "../data/layout.js";import {shopperPos} from "./state.js";import {useShop} from "../store/useShop.js";
function Coin({i,x,z}){const g=useRef(),got=useShop(s=>s.got.includes(i));
 useFrame(({clock})=>{if(got)return;const t=clock.elapsedTime;g.current.rotation.y=t*3;g.current.position.y=1.2+Math.sin(t*3+x)*.12;
  if(Math.hypot(x-shopperPos.x,z-shopperPos.z)<1){const s=useShop.getState();if(s.got.includes(i))return;s.collectCoin(i);s.say("🪙 Coin! +15 XP")}});
 return got?null:<group ref={g} position={[x,1.2,z]}><mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.28,.28,.06,20]}/><meshStandardMaterial color="#ffc400" metalness={.8} roughness={.25} emissive="#664400"/></mesh></group>}
export default function Coins(){return <>{COINS.map(([x,z],i)=><Coin key={i} i={i} x={x} z={z}/>)}</>}
