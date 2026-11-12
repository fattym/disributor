import {Component,Suspense,useEffect,useMemo,useRef,useState} from "react";
import {useGLTF,useAnimations} from "@react-three/drei";import {SkeletonUtils} from "three-stdlib";
import {useFrame} from "@react-three/fiber";
import {MathUtils} from "three";
// Drop Mixamo/Blender .glb files in /public/models. If a file is missing, a simple procedural person is shown instead.
useGLTF.setDecoderPath("/draco/");
class Boundary extends Component{state={bad:false};static getDerivedStateFromError(){return{bad:true}}render(){return this.state.bad?this.props.fallback:this.props.children}}
export function Procedural({shirt="#E63B00",skin="#8d5524",pants="#2d3748",hair="#1a1a1a",moving=false,pushing=false}){
 const legL=useRef(),legR=useRef(),armL=useRef(),armR=useRef(),body=useRef(),t=useRef(Math.random()*6);
 useFrame((_,dt)=>{
  if(moving)t.current+=dt*9;
  const s=moving?Math.sin(t.current):0,k=Math.min(1,dt*12),L=MathUtils.lerp;
  legL.current.rotation.x=L(legL.current.rotation.x,s*.7,k);
  legR.current.rotation.x=L(legR.current.rotation.x,-s*.7,k);
  armL.current.rotation.x=L(armL.current.rotation.x,pushing?1.2:-s*.5,k);
  armR.current.rotation.x=L(armR.current.rotation.x,pushing?1.2:s*.5,k);
  body.current.position.y=L(body.current.position.y,moving?Math.abs(Math.sin(t.current))*.05:0,k);
  body.current.rotation.z=L(body.current.rotation.z,moving?Math.sin(t.current)*.04:0,k);
 });
 const m=c=><meshStandardMaterial color={c} roughness={.7}/>;
 return(<group ref={body}>
  {[[-.13,legL],[.13,legR]].map(([x,r])=><group key={x} ref={r} position={[x,.85,0]}>
   <mesh position={[0,-.4,0]} castShadow><capsuleGeometry args={[.09,.62,4,8]}/>{m(pants)}</mesh>
   <mesh position={[0,-.82,-.06]} castShadow><boxGeometry args={[.16,.09,.3]}/>{m("#f2f2f2")}</mesh></group>)}
  <mesh position={[0,1.2,0]} castShadow><capsuleGeometry args={[.22,.45,4,10]}/>{m(shirt)}</mesh>
  {[[-.31,armL],[.31,armR]].map(([x,r])=><group key={x} ref={r} position={[x,1.5,0]}>
   <mesh position={[0,-.28,0]} castShadow><capsuleGeometry args={[.065,.42,4,8]}/>{m(shirt)}</mesh>
   <mesh position={[0,-.6,0]}><sphereGeometry args={[.065,8,6]}/>{m(skin)}</mesh></group>)}
  <group position={[0,1.78,0]}>
   <mesh castShadow><sphereGeometry args={[.2,16,12]}/>{m(skin)}</mesh>
   <mesh position={[0,.02,0]}><sphereGeometry args={[.21,16,8,0,Math.PI*2,0,1.45]}/>{m(hair)}</mesh>
   {[-.07,.07].map(x=><mesh key={x} position={[x,.03,-.18]}><sphereGeometry args={[.03,8,6]}/><meshBasicMaterial color="#111"/></mesh>)}</group>
 </group>)}
function Gltf({url,moving,scale}){const ref=useRef(),{scene,animations}=useGLTF(url),clone=useMemo(()=>SkeletonUtils.clone(scene),[scene]),{actions,names}=useAnimations(animations,ref);
 useEffect(()=>{const f=k=>names.find(n=>n.toLowerCase().includes(k)),a=actions[moving?f("walk"):f("idle")]||actions[names[0]];a?.reset().fadeIn(.25).play();return()=>{a?.fadeOut(.25)}},[moving,actions,names]);
 useEffect(()=>{clone.traverse(o=>{if(o.isMesh)o.castShadow=true})},[clone]);
 return <group ref={ref} scale={scale} rotation={[0,Math.PI,0]}><primitive object={clone}/></group>} // Mixamo models face +Z; our characters face -Z
export default function Character({url,moving=false,scale=1,...look}){const fb=<Procedural {...look} moving={moving}/>;
 const [available,setAvailable]=useState(false);
 useEffect(()=>{if(!url){setAvailable(false);return}let active=true;
  fetch(url,{method:"HEAD"}).then(r=>{if(active)setAvailable(r.ok)}).catch(()=>{if(active)setAvailable(false)});
  return()=>{active=false}},[url]);
 if(!url||!available)return fb;
 return <Boundary fallback={fb}><Suspense fallback={fb}><Gltf url={url} moving={moving} scale={scale}/></Suspense></Boundary>}
