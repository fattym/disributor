// Shelf layout, collision boxes and aisle teleport points (shared by world + UI).
export const UNIT_X=[-13.5,-4.5,4.5,13.5],LEVELS=[.35,1.1,1.85],PER_ROW=16;
export const DIMS=[[.62,.5],[.5,.45],[.4,.3],[.48,.5],[.45,.42],[.62,.55],[.58,.5],[.55,.55]]; // [height,width] per category
export const SHELF_ITEMS=[],COLLIDERS=[[-15.1,-8.9,10.3,11.7]]; // checkout counter
UNIT_X.forEach((ux,u)=>{COLLIDERS.push([ux-.9,ux+.9,-16.2,2.2]);
 [0,1].forEach(s=>{const category=u*2+s,side=s?1:-1,[h,w]=DIMS[category];
  LEVELS.forEach((y,lv)=>{for(let k=0;k<PER_ROW;k++){const z=-15.2+k*1.1;
   SHELF_ITEMS.push({key:`${category}-${lv}-${k}`,productId:category*4+((k+lv)%4),side,position:[ux+side*.4,y+h/2,z],size:[.2,h,w],tag:k%2===0,tagPosition:[ux+side*.66,y-.1,z]})}})})});
export const aisleStand=(category,z=1.5)=>{const side=category%2?1:-1;return{x:UNIT_X[category>>1]+side*2,z,heading:side*Math.PI/2}};
export const blocked=(x,z)=>x<-17.3||x>17.3||z<-19.3||z>15.3||COLLIDERS.some(b=>x>b[0]-.45&&x<b[1]+.45&&z>b[2]-.45&&z<b[3]+.45);
export const COINS=[-9,0,9].flatMap(x=>[-13,-6,1].map(z=>[x,z])).concat([[-16.2,-8],[16.2,-8],[0,3],[0,-2],[0,-4],[0,-8],[0,-10],[0,-15]]);
