import { useEffect, useState } from "react";
import Scene from "./world/Scene.jsx";
import TopBar from "./ui/TopBar.jsx";
import CategoryPanel from "./ui/CategoryPanel.jsx";
import ProductCard from "./ui/ProductCard.jsx";
import TrolleyPanel from "./ui/TrolleyPanel.jsx";
import BooklistPanel from "./ui/BooklistPanel.jsx";
import FeaturedPanel from "./ui/FeaturedPanel.jsx";
import BottomNav from "./ui/BottomNav.jsx";
import Joystick from "./ui/Joystick.jsx";
import Toast from "./ui/Toast.jsx";
import Tooltip from "./ui/Tooltip.jsx";
import { ControlCluster, Hint, NearbyPill, StatusChips } from "./ui/Controls.jsx";
import { useShop } from "./store/useShop.js";

export default function App() {
  const loadCatalogue = useShop((s) => s.loadCatalogue);
  const [full, setFull] = useState(false);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  useEffect(() => {
    document.documentElement.classList.toggle("lp-full", full);
    if (!full) return;
    const onKey = (e) => e.key === "Escape" && !useShop.getState().selected && !useShop.getState().panel && setFull(false);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("lp-full");
    };
  }, [full]);

  return (
    <div className={"lp3d" + (full ? " full" : "")}>
      <Scene />
      <TopBar />
      <CategoryPanel />
      <StatusChips />
      <ControlCluster full={full} onFull={() => setFull((v) => !v)} />
      <Hint />
      <NearbyPill />
      <ProductCard />
      <TrolleyPanel />
      <BooklistPanel />
      <FeaturedPanel />
      <BottomNav />
      <Joystick />
      <Tooltip />
      <Toast />
    </div>
  );
}
