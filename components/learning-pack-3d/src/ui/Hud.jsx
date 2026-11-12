import {BOOKLIST} from "../data/catalogue.js";import {useShop} from "../store/useShop.js";import {useSupermarketStore} from "@/lib/store/supermarketStore";
export default function Hud(){const {xp,coins}=useShop(),ci=useSupermarketStore(s=>s.cartItems),products=useShop(s=>s.products),lv=Math.floor(xp/100)+1,n=BOOKLIST.filter(i=>ci.some(c=>c.variant_id===products[i]?.backendId)).length;
 return(<aside className="hud glass hide-m"><h4>Shopper Level {lv}</h4><div className="bar gold"><i style={{width:`${xp%100}%`}}/></div>
  <p>⭐ XP: {xp}/{lv*100}</p><p>🪙 Coins: {coins}</p><p>📖 Booklist: {n}/{BOOKLIST.length} items</p><b>Quests</b>
  <div className="q">Collect 8 coins ({Math.min(coins,8)}/8)</div><div className="q">Complete the booklist ({n}/{BOOKLIST.length})</div></aside>)}
