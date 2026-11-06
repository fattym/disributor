import {useRef} from "react";import {joy} from "../world/state.js";
export default function Joystick(){const knob=useRef(),id=useRef(null);
 const move=e=>{const r=e.currentTarget.getBoundingClientRect();let x=(e.clientX-r.left-60)/50,y=(e.clientY-r.top-60)/50;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}joy.x=x;joy.y=y;knob.current.style.transform=`translate(${x*35}px,${y*35}px)`};
 const end=e=>{if(id.current!==null&&e.pointerId!==id.current)return;id.current=null;joy.x=joy.y=0;if(knob.current)knob.current.style.transform=""};
 return <div className="joy" onPointerDown={e=>{id.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);move(e)}} onPointerMove={e=>{if(e.pointerId===id.current)move(e)}} onPointerUp={end} onPointerCancel={end}><div ref={knob} className="knob"/></div>}
