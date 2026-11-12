// Offline catalogue. In production the same shape comes from GET /api/products/.
export const CATEGORIES=[
{name:"Textbooks",icon:"📘",color:"#2563eb",items:[["Mathematics Textbook Gr 5","KLB","Grade 5 · CBC",850],["English Activities Gr 5","Oxford","Grade 5 · CBC",780],["Integrated Science Gr 5","Longhorn","Grade 5 · CBC",820],["Kiswahili Kitabu Gr 5","Moran","Grade 5 · CBC",690]]},
{name:"Exercise Books",icon:"📓",color:"#16a34a",items:[["Exercise Books 96pg (5-pack)","Kenafric","All grades",350],["Exercise Book 200pg","Croxley","All grades",120],["A4 Counter Book","Pelican","All grades",260],["Graph Book 48pg","Kenafric","Grade 4–8",90]]},
{name:"Pens & Pencils",icon:"✏️",color:"#eab308",items:[["HB Pencils (12)","Staedtler","All grades",240],["Blue Ballpoint Pens (10)","Bic","All grades",200],["Eraser & Sharpener Set","Maped","All grades",110],["Highlighter Set (4)","Faber-Castell","Grade 5+",380]]},
{name:"Maths & Geometry",icon:"📐",color:"#dc2626",items:[["Geometry Set","Helix","Grade 4+",450],["30cm Ruler","Maped","All grades",80],["Scientific Calculator","Casio","Form 1+",1650],["Protractor 180°","Helix","Grade 5+",70]]},
{name:"Art & Creative",icon:"🎨",color:"#9333ea",items:[["Crayons 24 colours","Crayola","All grades",420],["Watercolour Paint Set","Pelikan","Grade 3+",680],["Colour Pencils (24)","Faber-Castell","All grades",560],["Drawing Pad A3","Pelican","All grades",330]]},
{name:"Bags & Accessories",icon:"🎒",color:"#0891b2",items:[["School Backpack 25L","Learning Pack","All grades",1850],["Pencil Case","Maped","All grades",350],["Water Bottle 500ml","Aqua","All grades",450],["Lunch Box","Tupperware","All grades",650]]},
{name:"Revision Books",icon:"📝",color:"#ea580c",items:[["KCPE Revision Maths","Spotlight","Grade 6",720],["Mock Exam Pack Gr 5","Elimu","Grade 5",550],["English Grammar Drill","Oxford","Grade 5+",640],["Science Revision Gr 5","KLB","Grade 5",600]]},
{name:"Bundles",icon:"🎁",color:"#E63B00",items:[["Grade 5 Starter Bundle","Learning Pack","Grade 5 · CBC",3499],["Stationery Essentials Pack","Learning Pack","All grades",1299],["Art Kit Bundle","Learning Pack","Grade 3–6",1499],["Geometry & Maths Kit","Learning Pack","Grade 4+",1199]]}];
export const PRODUCTS=CATEGORIES.flatMap((c,ci)=>c.items.map((p,pi)=>({id:ci*4+pi,category:ci,name:p[0],publisher:p[1],grade:p[2],price:p[3],color:c.color,icon:c.icon,stock:(ci*4+pi)%7===3?"Low stock · 4 left":"In stock"})));
export const BOOKLIST=[0,1,2,4,5,8,12,16,20,21];
export const BUNDLE_ID=28;
export const kes=n=>"KES "+n.toLocaleString("en-KE");
