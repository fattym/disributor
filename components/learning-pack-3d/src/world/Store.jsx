import * as THREE from "three";
import {useShop} from "../store/useShop.js";import {CATEGORIES} from "../data/catalogue.js";import {UNIT_X} from "../data/layout.js";
const Box=({a,p,color="#eeeae2",...r})=><mesh position={p} castShadow receiveShadow {...r}><boxGeometry args={a}/><meshStandardMaterial color={color} roughness={.8}/></mesh>;
const signCache=new Map();
function signMap(text,w,h,bg){const key=bg+"|"+w+"|"+h+"|"+text;if(signCache.has(key))return signCache.get(key);
 const pxW=1024,pxH=Math.max(96,Math.round(pxW*(h/w))),c=document.createElement("canvas");c.width=pxW;c.height=pxH;const g=c.getContext("2d");
 g.fillStyle=bg;g.fillRect(0,0,pxW,pxH);g.fillStyle="#fff";g.textAlign="center";g.textBaseline="middle";
 const lines=String(text||"").split("\n");let fontPx=Math.floor(pxH/(lines.length+.7));
 const measure=()=>{g.font=`700 ${fontPx}px "Trebuchet MS",sans-serif`;return Math.max(...lines.map(l=>g.measureText(l).width),1)};
 if(measure()>pxW*.92)fontPx=Math.max(18,Math.floor(fontPx*(pxW*.92)/measure()));measure();
 const lh=fontPx*1.15,start=pxH/2-((lines.length-1)*lh)/2;lines.forEach((line,i)=>g.fillText(line,pxW/2,start+i*lh));
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;signCache.set(key,t);return t}
const Sign=({p,w,h,bg="#E63B00",text,size:_size=.3,ry=0,...r})=><group position={p} rotation={[0,ry,0]} {...r}><mesh><planeGeometry args={[w,h]}/><meshBasicMaterial map={signMap(text,w,h,bg)} toneMapped={false} side={2}/></mesh></group>;
const GAPS=[[-17.5,-12],[-10.5,-5],[-3.5,2]],PIERS=[[-20,-17.5],[-12,-10.5],[-5,-3.5],[2,16]];
function SideWall({x}){return <group><Box a={[.3,1,36]} p={[x,.5,-2]}/><Box a={[.3,1.6,36]} p={[x,4.2,-2]}/>
 {PIERS.map(([a,b])=><Box key={a} a={[.3,2.4,b-a]} p={[x,2.2,(a+b)/2]}/>)}
 {GAPS.map(([a,b])=><mesh key={a} position={[x,2.2,(a+b)/2]} rotation={[0,Math.PI/2,0]}><planeGeometry args={[b-a,2.4]}/><meshPhysicalMaterial transparent opacity={.15} roughness={0} color="#bfe3ff" side={2} depthWrite={false}/></mesh>)}</group>}
export default function Store(){const setPanel=useShop(s=>s.setPanel);return(<group>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,-2]} receiveShadow><planeGeometry args={[36,40]}/><meshStandardMaterial color="#d8cfbf" roughness={.35} metalness={.1}/></mesh>
 <mesh rotation={[Math.PI/2,0,0]} position={[0,5,-2]}><planeGeometry args={[36,40]}/><meshStandardMaterial color="#b9b4aa"/></mesh>
 {[-13.5,-9,-4.5,0,4.5,9,13.5].map(x=><mesh key={x} position={[x,4.95,-2]}><boxGeometry args={[.35,.06,34]}/><meshBasicMaterial color="#fff"/></mesh>)}
 <Box a={[36,5,.3]} p={[0,2.5,-20]}/>
 <Box a={[13,5,.3]} p={[-11.5,2.5,16]}/><Box a={[13,5,.3]} p={[11.5,2.5,16]}/><Box a={[10,1.15,.3]} p={[0,4.42,16]}/>
 <SideWall x={-18}/><SideWall x={18}/>
 <Sign p={[0,3.2,-19.8]} w={9} h={2.2} bg="#0B1F3A" text={"Everything Your Child\nNeeds for School"} size={.5}/>
 <Sign p={[0,3.6,15.8]} w={6} h={1.6} bg="#0B1F3A" text="Learning Pack · Karibu" size={.42}/>
 {UNIT_X.map((x,u)=><Sign key={x} p={[x,3.7,2.4]} w={2.8} h={.9} size={.2} text={`Aisle ${u*2+1}: ${CATEGORIES[u*2].name}\nAisle ${u*2+2}: ${CATEGORIES[u*2+1].name}`}/>)}
 <Box a={[6,1,1.2]} p={[-12,.5,11]} color="#0B1F3A"/><Box a={[6.1,.06,1.3]} p={[-12,1.03,11]} color="#ffffff"/>
 <Sign p={[-12,3,11]} w={4.2} h={.8} size={.3} text="PROCEED TO CHECKOUT" onClick={e=>{e.stopPropagation();if(e.delta>6)return;const s=useShop.getState();if(!Object.keys(s.cart).length){s.say("Add something to your trolley first");return}setPanel("checkout")}} onPointerOver={()=>document.body.style.cursor="pointer"} onPointerOut={()=>document.body.style.cursor=""}/></group>)}
