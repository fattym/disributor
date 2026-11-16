import { AISLES, kes } from "../data/catalogue.js";
import { useShop } from "../store/useShop.js";
import Icon from "./Icon.jsx";
import Thumb from "./Thumb.jsx";

/** Reset camera, guided tour and full screen. */
export function ControlCluster({ full, onFull }) {
  const resetCamera = useShop((s) => s.resetCamera);
  const tour = useShop((s) => s.tour);
  const startTour = useShop((s) => s.startTour);
  const stopTour = useShop((s) => s.stopTour);
  return (
    <div className="ctl" role="group" aria-label="Camera and tour controls">
      <button className="round" onClick={resetCamera} aria-label="Reset camera" title="Reset camera">
        <Icon name="locate" />
      </button>
      <button className={"round" + (tour ? " on" : "")} onClick={tour ? stopTour : startTour} aria-pressed={tour} aria-label={tour ? "Stop guided tour" : "Start guided tour"} title={tour ? "Stop tour" : "Guided tour"}>
        <Icon name={tour ? "stop" : "route"} />
      </button>
      <button className="round" onClick={onFull} aria-pressed={full} aria-label={full ? "Exit full screen" : "Full screen"} title={full ? "Exit full screen (Esc)" : "Full screen"}>
        <Icon name={full ? "compress" : "expand"} />
      </button>
    </div>
  );
}

/** Where the shopper is, plus stock-loading progress. */
export function StatusChips() {
  const here = useShop((s) => s.aisleHere);
  const status = useShop((s) => s.status);
  const progress = useShop((s) => s.progress);
  const offline = useShop((s) => s.offline);
  const tour = useShop((s) => s.tour);
  const pct = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;
  return (
    <div className="status">
      {status === "loading" && (
        <div className="lp-pill load" role="status">
          <span className="spin" aria-hidden="true" />
          Stocking the shelves… {progress.total ? `${pct}%` : ""}
          <i style={{ width: `${pct}%` }} />
        </div>
      )}
      {status === "ready" && offline && <div className="lp-pill warn"><Icon name="warn" /> Showing sample products (catalogue unreachable)</div>}
      <div className="lp-pill here" aria-live="polite">
        <Icon name="pin" />
        {tour ? "Guided tour" : here >= 0 ? <>Aisle {here + 1} · {AISLES[here].long}</> : "Store entrance"}
      </div>
    </div>
  );
}

export function Hint() {
  return (
    <div className="hint hide-m" aria-hidden="true">
      <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move · drag to look · scroll to zoom · <kbd>E</kbd> view product
    </div>
  );
}

/** Shown while the shopper stands in front of a product (E or tap to open). */
export function NearbyPill() {
  const nearby = useShop((s) => s.nearby);
  const selected = useShop((s) => s.selected);
  const panel = useShop((s) => s.panel);
  const select = useShop((s) => s.select);
  if (!nearby || selected || panel) return null;
  return (
    <button className="nearby" onClick={() => select(nearby)} aria-label={`View ${nearby.name}`}>
      <Thumb product={nearby} />
      <span className="n-txt">
        <small>In front of you</small>
        <b>{nearby.name}</b>
      </span>
      <span className="n-price">{kes(nearby.price)}</span>
      <span className="n-act"><Icon name="eye" /> View <kbd className="hide-m">E</kbd></span>
    </button>
  );
}
