import {useState} from "react";import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";import {faBookOpen,faBook,faPencil,faRulerCombined,faPalette,faBriefcase,faFileLines,faGift} from "@fortawesome/free-solid-svg-icons";import {CATEGORIES,PRODUCTS} from "../data/catalogue.js";import {useShop} from "../store/useShop.js";
const AISLE_ICONS=[faBookOpen,faBook,faPencil,faRulerCombined,faPalette,faBriefcase,faFileLines,faGift];
export default function CategoryPanel(){const [min,setMin]=useState(false),go=useShop(s=>s.goToProduct);
 return(<nav className={"cats glass hide-m"+(min?" min":"")} aria-label="Aisles"><div className="cats-h"><b>Aisles</b><button onClick={()=>setMin(!min)} aria-label="Collapse">⇔</button></div>
  {CATEGORIES.map((c,i)=><button key={c.name} onClick={()=>go(PRODUCTS[i*4])} title={c.name}><FontAwesomeIcon icon={AISLE_ICONS[i]} fixedWidth/><span>{i+1}. {c.name}</span></button>)}</nav>)}
