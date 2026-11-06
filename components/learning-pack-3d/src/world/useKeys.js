import {useEffect,useRef} from "react";
export function useKeys(){const k=useRef({});useEffect(()=>{
 const MOVE=new Set(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"]);
 const d=e=>{if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const key=e.key.toLowerCase();if(!MOVE.has(key))return;e.preventDefault();k.current[key]=true};
 const u=e=>{k.current[e.key.toLowerCase()]=false},b=()=>{k.current={}};
 addEventListener("keydown",d);addEventListener("keyup",u);addEventListener("blur",b);
 return()=>{removeEventListener("keydown",d);removeEventListener("keyup",u);removeEventListener("blur",b)}},[]);return k}
