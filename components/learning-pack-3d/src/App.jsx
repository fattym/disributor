import { SHOP_HOURS, WHATSAPP_NUMBERS } from '@/lib/shopText';
import { useCallback, useEffect } from "react";
import Scene from "./world/Scene.jsx";
import ProductCard from "./ui/ProductCard.jsx";
import TrolleyPanel from "./ui/TrolleyPanel.jsx";
import BooklistPanel from "./ui/BooklistPanel.jsx";
import FeaturedPanel from "./ui/FeaturedPanel.jsx";
import Joystick from "./ui/Joystick.jsx";
import SearchResults from "./ui/SearchResults.jsx";
import Toast from "./ui/Toast.jsx";
import Tooltip from "./ui/Tooltip.jsx";
import { GameHUD } from "./game/GameHUD";
import { PauseMenu } from "./game/PauseMenu";
import { usePauseControls } from "./game/gameUiStore";
import { AISLES, kes } from "./data/catalogue.js";
import { useCart, useInCart, useShop } from "./store/useShop.js";
import "./game/gameUi.css";

const MENU_AISLES = AISLES.map((a) => ({ id: String(a.id), number: a.id + 1, name: a.name }));
const CONTACT = { phones: WHATSAPP_NUMBERS.map((n) => n.label), hours: SHOP_HOURS, email: "codingclubsorders@proton.me" };

/** Esc closes an open shop panel or product card before it pauses the game. */
const closeShopOverlay = () => {
  const { selected, panel, closeAll } = useShop.getState();
  if (!selected && !panel) return false;
  closeAll();
  return true;
};

export default function App() {
  const loadCatalogue = useShop((s) => s.loadCatalogue);
  const nearby = useShop((s) => s.nearby);
  const selected = useShop((s) => s.selected);
  const panel = useShop((s) => s.panel);
  const here = useShop((s) => s.aisleHere);
  const booklist = useShop((s) => s.booklist);
  const select = useShop((s) => s.select);
  const add = useShop((s) => s.add);
  const say = useShop((s) => s.say);
  const setPanel = useShop((s) => s.setPanel);
  const cart = useCart();
  const have = useInCart();
  usePauseControls(closeShopOverlay);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  const openPanel = useCallback((p) => useShop.getState().panel !== p && setPanel(p), [setPanel]);
  const required = booklist.filter((l) => l.product);
  const facing = nearby && !selected && !panel ? nearby : null;

  return (
    <div className="lp3d">
      <Scene />
      <GameHUD
        trolleyCount={cart.count}
        onTrolley={() => openPanel("cart")}
        aisleLabel={here >= 0 ? `Aisle ${here + 1} · ${AISLES[here].long}` : undefined}
        facingProduct={
          facing && {
            name: facing.name,
            price: kes(facing.price),
            imageUrl: facing.image || undefined,
            onView: () => select(facing),
            // unavailable items and part-available bundles open the card, which says why
            onAdd: () => (facing.unavailable || add(facing, 1) === false ? select(facing) : say(`Added ${facing.name}`)),
          }
        }
        joystick={<Joystick />}
      />
      <ProductCard />
      <TrolleyPanel />
      <BooklistPanel />
      <FeaturedPanel />
      <Tooltip />
      <Toast />
      <PauseMenu
        aisles={MENU_AISLES}
        currentAisleId={here >= 0 ? String(here) : undefined}
        trolleyCount={cart.count}
        booklistProgress={{ found: required.filter((l) => have.has(l.product.variantId)).length, total: required.length }}
        onGoToAisle={(id) => useShop.getState().goToAisle(Number(id))}
        renderSearchResults={(q) => <SearchResults query={q} />}
        onBooklist={() => openPanel("booklist")}
        onTrolley={() => openPanel("cart")}
        onFeatured={() => openPanel("featured")}
        onTour={() => useShop.getState().startTour()}
        onListView={() => window.location.assign("/shop/")}
        accountHref="/login"
        trackOrderHref="/track-your-order/"
        privacyHref="/privacy-policy/"
        termsHref="/terms-conditions/"
        contact={CONTACT}
      />
    </div>
  );
}
