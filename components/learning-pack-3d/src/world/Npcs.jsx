import {useRef,useState} from "react";import {useFrame} from "@react-three/fiber";import Character from "./Character.jsx";import {shopperPos} from "./state.js";import {useShop} from "../store/useShop.js";
const TIPS=["Karibu! Grade 5 booklists start in aisles 1, 2 and 4.","Collect the gold coins for bonus XP.","Backpacks and lunch boxes are in aisle 6.","Open the booklist and tap Missing only.","Bundles in aisle 8 save time.","Pick up a book to see its price."];
const PATHS=[[-9,0],[0,9],[9,16.2],[-16.2,-9],[0,-9],[9,0]],COLORS=["#2563eb","#16a34a","#9333ea","#eab308","#dc2626","#0891b2"];
function Npc({a,b,i}){const g=useRef(),st=useRef({k:1,pause:0,z:6-i*3}),[moving,setMoving]=useState(true),say=useShop(s=>s.say);
 const W=[[a,6],[a,-17.5],[b,-17.5],[b,6]];
 useFrame((_,dt)=>{const s=st.current,w=W[s.k],o=g.current,p=o.position,dx=w[0]-p.x,dz=w[1]-p.z,l=Math.hypot(dx,dz);
  const near=Math.hypot(p.x-shopperPos.x,p.z-shopperPos.z)<1.3;
  if(near!==s.near){s.near=near;setMoving(!near&&s.pause<=0)}
  if(near)return;
  if(s.pause>0){s.pause-=dt;if(s.pause<=0)setMoving(true);return}
  if(l<.15){s.k=(s.k+1)%4;s.pause=1.2;setMoving(false);return}
  let df=Math.atan2(-dx,-dz)-o.rotation.y;df=Math.atan2(Math.sin(df),Math.cos(df));o.rotation.y+=df*Math.min(1,dt*6);
  const sp=Math.abs(df)>.8?.3:1.4;p.x+=dx/l*sp*dt;p.z+=dz/l*sp*dt});
 return <group ref={g} position={[a,0,6-i*3]} onClick={e=>{e.stopPropagation();if(e.delta>6)return;say("💬 "+TIPS[i%TIPS.length])}}><Character url={`/models/npc${i%3}.glb`} moving={moving} shirt={COLORS[i]}/></group>}
export default function Npcs(){return <>{PATHS.map(([a,b],i)=><Npc key={i} a={a} b={b} i={i}/>)}
 <group position={[3,0,11]} rotation={[0,Math.PI,0]} onClick={()=>useShop.getState().say("💬 Karibu Learning Pack! Open the booklist to start.")}><Character url="/models/greeter.glb" shirt="#E63B00"/></group>
 <group position={[-12,0,9.6]} rotation={[0,Math.PI,0]} onClick={()=>useShop.getState().say("💬 Ready to pay? Tap the orange checkout sign.")}><Character url="/models/cashier.glb" shirt="#0B1F3A"/></group></>}
