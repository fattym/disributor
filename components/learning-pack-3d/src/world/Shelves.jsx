import {useMemo,useState} from "react";
import {Edges} from "@react-three/drei";
import * as THREE from "three";
import {SHELF_ITEMS,UNIT_X} from "../data/layout.js";
import {PRODUCTS} from "../data/catalogue.js";
import {useShop} from "../store/useShop.js";

const BOX=new THREE.BoxGeometry(1,1,1),PLANE=new THREE.PlaneGeometry(.42,.13),cache=new Map(),textureCache=new Map();
const canvasTex=(w,h,draw)=>{
 const c=document.createElement("canvas");
 c.width=w;c.height=h;
 draw(c.getContext("2d"),w,h);
 const t=new THREE.CanvasTexture(c);
 t.colorSpace=THREE.SRGBColorSpace;
 t.anisotropy=4;
 return t;
};

function getFrontTexture(p,fallbackTex){
 const imgUrl=p.cover_image||p.image_url||(p.image&&!p.image.endsWith("kids.png")?p.image:null);
 if(!imgUrl)return fallbackTex;
 if(textureCache.has(imgUrl))return textureCache.get(imgUrl);

 const loader=new THREE.TextureLoader();
 loader.setCrossOrigin("anonymous");
 const tex=loader.load(
  imgUrl,
  loadedTex=>{
   loadedTex.colorSpace=THREE.SRGBColorSpace;
   loadedTex.anisotropy=4;
   loadedTex.needsUpdate=true;
  },
  undefined,
  ()=>{console.warn("Failed to load book texture:",imgUrl)}
 );
 tex.colorSpace=THREE.SRGBColorSpace;
 textureCache.set(imgUrl,tex);
 return tex;
}

function covers(p){
 if(!p)return null;
 const key=`${p.id}_${p.cover_image||p.image_url||p.image||p.name}`;
 if(cache.has(key))return cache.get(key);

 const fallbackTex=canvasTex(200,260,(g,W,H)=>{
  g.fillStyle=p.color||"#2563eb";
  g.fillRect(0,0,W,H);
  g.fillStyle="rgba(255,255,255,.93)";
  g.fillRect(12,12,W-24,H*.56);
  g.fillStyle="#0B1F3A";
  g.font="bold 20px sans-serif";
  g.textAlign="center";
  const name=p.title||p.name||"Book";
  const ln=[""];
  name.split(" ").forEach(w=>{
   const j=(ln.at(-1)+" "+w).trim();
   j.length>14?ln.push(w):ln[ln.length-1]=j;
  });
  ln.slice(0,3).forEach((l,i)=>g.fillText(l,W/2,48+i*26));

  if(p.icon){
   g.font="52px serif";
   g.fillText(p.icon,W/2,H*.82);
  }
  g.fillStyle="#E63B00";
  g.fillRect(0,H-28,W,28);
  g.fillStyle="#fff";
  g.font="bold 15px sans-serif";
  g.fillText(p.publisher||p.brand||"Learning Pack",W/2,H-8);
 });

 const frontMap=(p.cover_image||p.image_url)?getFrontTexture(p,fallbackTex):fallbackTex;
 const edgeColor=[0,1,6].includes(p.category)?"#f1e8d0":(p.color||"#334155");
 const edge=new THREE.MeshStandardMaterial({color:edgeColor,roughness:.7});
 const front=new THREE.MeshStandardMaterial({map:frontMap,roughness:.6});

 const priceStr=typeof p.price==='number'?p.price.toLocaleString():String(p.price||'');
 const tag=new THREE.MeshBasicMaterial({
  map:canvasTex(128,40,(g,W,H)=>{
   g.fillStyle="#E63B00";
   g.fillRect(0,0,W,H);
   g.fillStyle="#fff";
   g.font="bold 24px sans-serif";
   g.textAlign="center";
   g.textBaseline="middle";
   g.fillText(priceStr,W/2,H/2);
  })
 });

 const r={
  m:[-1,1].map(sd=>{
   const a=Array(6).fill(edge);
   a[sd>0?0:1]=front;
   return a;
  }),
  tag
 };
 cache.set(key,r);
 return r;
}

function Book({it,product}){
 const p=product||PRODUCTS[it.productId]||PRODUCTS[0];
 const {m,tag}=useMemo(()=>covers(p),[p]);
 const [hover,setHover]=useState(false);
 const sel=useShop(s=>s.selectedKey===it.key);
 const select=useShop(s=>s.select);
 const lift=sel?it.side*.35:0;

 return(
  <>
   <mesh
    geometry={BOX}
    material={m[it.side>0?1:0]}
    position={[it.position[0]+lift,it.position[1],it.position[2]]}
    rotation={[0,sel?it.side*.5:0,0]}
    scale={it.size}
    castShadow
    receiveShadow
    onClick={e=>{e.stopPropagation();if(e.delta>6)return;select(p,it.key)}}
    onPointerOver={e=>{e.stopPropagation();setHover(true);document.body.style.cursor="pointer"}}
    onPointerOut={()=>{setHover(false);document.body.style.cursor=""}}
   >
    {(hover||sel)&&<Edges color={sel?"#E63B00":"#ffd23f"}/>}
   </mesh>
   {it.tag&&(
    <mesh geometry={PLANE} material={tag} position={it.tagPosition} rotation={[0,it.side*Math.PI/2,0]}/>
   )}
  </>
 );
}

export default function Shelves(){
 const products=useShop(s=>s.products);
 return(
  <group>
   {UNIT_X.map(x=>(
    <group key={x}>
     <mesh position={[x,1.25,-7]} castShadow receiveShadow>
      <boxGeometry args={[1.2,2.5,18]}/>
      <meshStandardMaterial color="#bfc4cc" metalness={.5} roughness={.4}/>
     </mesh>
     {[.31,1.06,1.81].map(y=>
      [-1,1].map(s=>(
       <mesh key={y+"_"+s} position={[x+s*.62,y,-7]}>
        <boxGeometry args={[.08,.05,18]}/>
        <meshStandardMaterial color="#E63B00"/>
       </mesh>
      ))
     )}
    </group>
   ))}
   {SHELF_ITEMS.map(it=>(
    <Book key={it.key} it={it} product={products[it.productId]||PRODUCTS[it.productId]}/>
   ))}
  </group>
 );
}
