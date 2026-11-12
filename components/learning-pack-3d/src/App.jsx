import {useEffect} from "react";
import Scene from "./world/Scene.jsx";
import TopBar from "./ui/TopBar.jsx";
import CategoryPanel from "./ui/CategoryPanel.jsx";
import ProductCard from "./ui/ProductCard.jsx";
import TrolleyPanel from "./ui/TrolleyPanel.jsx";
import BooklistPanel from "./ui/BooklistPanel.jsx";
import Checkout from "./ui/Checkout.jsx";
import Hud from "./ui/Hud.jsx";
import BottomNav from "./ui/BottomNav.jsx";
import Joystick from "./ui/Joystick.jsx";
import Toast from "./ui/Toast.jsx";
import ShowcaseCarousel from "./ui/ShowcaseCarousel.jsx";
import {useShop} from "./store/useShop.js";

export default function App(){
  const loadBackendProducts = useShop(s => s.loadBackendProducts);
  useEffect(() => {
    loadBackendProducts();
  }, [loadBackendProducts]);

  return (
    <div className="lp3d">
      <Scene/>
      <TopBar/>
      <CategoryPanel/>
      <Hud/>
      <ProductCard/>
      <TrolleyPanel/>
      <BooklistPanel/>
      <Checkout/>
      <BottomNav/>
      <Joystick/>
      <Toast/>
      <ShowcaseCarousel/>
    </div>
  );
}
