/* eslint-disable react-hooks/set-state-in-effect -- timed show/hide of the aisle label and first-visit hint */
/**
 * The only UI visible while playing. Everything else lives in the pause menu.
 *
 *   Top-left   Pause button (also Esc / P)
 *   Top-right  Trolley count (tap = open trolley in the pause menu)
 *   Top-centre Aisle name, shown for 3 s when entering an aisle, then fades
 *   Bottom     "In front of you" card, only while facing a product
 *   Bottom-left Joystick (touch devices only, your existing component)
 *   Centre     Short toasts ("Added to trolley")
 *
 * Removed from the play screen on purpose: site header, second search
 * bar, category chips, catalogue warning, recenter/route/fullscreen
 * buttons and the Browse/Booklist/Trolley/Account tab bar.
 */
import { ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import { gameUi, useGameUi } from "./gameUiStore";
import { Icon } from "./icons";

export interface FacingProduct {
  name: string;
  price: string; // already formatted, e.g. "KES 600"
  imageUrl?: string;
  onView: () => void;
  onAdd: () => void;
}

interface GameHUDProps {
  trolleyCount: number;
  onTrolley: () => void;
  aisleLabel?: string;
  facingProduct?: FacingProduct | null;
  /** Your existing on-screen joystick. Only shown on touch screens. */
  joystick?: ReactNode;
}

export function GameHUD({ trolleyCount, onTrolley, aisleLabel, facingProduct, joystick }: GameHUDProps) {
  const paused = useGameUi((s) => s.paused);
  const [showAisle, setShowAisle] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Aisle name pops in when it changes, then fades out
  useEffect(() => {
    if (!aisleLabel) return;
    setShowAisle(true);
    const t = window.setTimeout(() => setShowAisle(false), 3000);
    return () => window.clearTimeout(t);
  }, [aisleLabel]);

  // First visit: short controls hint
  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem("lp-store-hint") === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;
    setShowHint(true);
    const t = window.setTimeout(() => {
      setShowHint(false);
      try {
        window.localStorage.setItem("lp-store-hint", "1");
      } catch {
        /* ignore */
      }
    }, 7000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={`lp-hud ${paused ? "lp-hud--hidden" : ""}`} aria-hidden={paused}>
      <button
        type="button"
        className="lp-hud__btn lp-hud__pause"
        onClick={() => gameUi.pause()}
        aria-label="Pause and open menu"
      >
        <Icon name="pause" />
      </button>

      <button
        type="button"
        className="lp-hud__btn lp-hud__trolley"
        onClick={onTrolley}
        aria-label={`Trolley, ${trolleyCount} item${trolleyCount === 1 ? "" : "s"}`}
      >
        <Icon name="trolley" />
        {trolleyCount > 0 && <span className="lp-badge">{trolleyCount}</span>}
      </button>

      {aisleLabel && (
        <div className={`lp-hud__aisle ${showAisle ? "is-visible" : ""}`} role="status">
          {aisleLabel}
        </div>
      )}

      {showHint && (
        <div className="lp-hud__hint" role="status">
          <span className="lp-only-fine">WASD to walk · drag to look · Esc for menu</span>
          <span className="lp-only-touch">Joystick to walk · drag to look · ❚❚ for menu</span>
        </div>
      )}

      {facingProduct && (
        <div className="lp-hud__product">
          <div className="lp-hud__product-thumb">
            {facingProduct.imageUrl ? <Image src={facingProduct.imageUrl} alt="" width={48} height={48} unoptimized /> : <Icon name="book" />}
          </div>
          <div className="lp-hud__product-info">
            <span className="lp-hud__product-name">{facingProduct.name}</span>
            <span className="lp-hud__product-price">{facingProduct.price}</span>
          </div>
          <button type="button" className="lp-btn lp-btn--ghost" onClick={facingProduct.onView}>
            View
          </button>
          <button
            type="button"
            className="lp-btn lp-btn--primary"
            onClick={facingProduct.onAdd}
          >
            Add
          </button>
        </div>
      )}

      {joystick && <div className="lp-hud__joystick lp-only-touch">{joystick}</div>}
    </div>
  );
}
