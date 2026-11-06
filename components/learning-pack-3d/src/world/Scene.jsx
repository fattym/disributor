import {Canvas} from "@react-three/fiber";import Store from "./Store.jsx";import Shelves from "./Shelves.jsx";import Outside from "./Outside.jsx";import Shopper from "./Shopper.jsx";import Npcs from "./Npcs.jsx";import Coins from "./Coins.jsx";
export default function Scene(){return(
 <Canvas key="bookshop-scene" shadows frameloop="always" dpr={[1,2]} camera={{position:[0,2.6,14.2],fov:55,near:.1,far:300}} gl={{antialias:true,preserveDrawingBuffer:true}} resize={{scroll:false,debounce:{scroll:50,resize:0}}} style={{width:"100%",height:"100%"}} onCreated={({camera})=>camera.lookAt(0,1.2,9)}>
  <color attach="background" args={["#9fd3f2"]}/><fog attach="fog" args={["#cfe9f7",45,170]}/>
  <hemisphereLight args={["#fff4e0","#9a9084",.7]}/>
  <directionalLight position={[6,14,8]} intensity={.8} castShadow shadow-mapSize={[2048,2048]} shadow-bias={-.0006} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={26} shadow-camera-bottom={-26} shadow-camera-far={50}/>
  {/* Procedural studio environment: soft ceiling-light reflections on floor and shelves, no network download */}
  <ambientLight intensity={0.55}/>
  <Store/><Shelves/><Outside/><Npcs/><Coins/><Shopper/>
 </Canvas>)}
