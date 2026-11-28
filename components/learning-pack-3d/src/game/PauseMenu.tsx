/**
 * Pause menu: everything that is not needed while walking.
 * Opens with the pause button, Esc or P, the trolley icon, or
 * automatically when the tab is hidden / phone is locked.
 *
 * Desktop: panel on the left, store blurred behind it.
 * Phone:   full-screen sheet.
 *
 * Your existing search results, booklist, trolley and account
 * components plug into the render props, so no shop logic is rewritten.
 */
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { GameSettings, PausePanel, gameUi, useGameUi } from "./gameUiStore";
import { Icon } from "./icons";

export interface StoreAisle {
  id: string;
  number: number;
  name: string;
}

export interface PauseMenuProps {
  aisles: StoreAisle[];
  currentAisleId?: string;
  trolleyCount: number;
  booklistProgress?: { found: number; total: number };

  /** Walk or teleport the shopper to an aisle. Menu closes first. */
  onGoToAisle: (aisleId: string) => void;
  /** Your search results for a query (product rows with "Go to shelf" / "Add"). */
  renderSearchResults: (query: string) => ReactNode;
  renderBooklist: () => ReactNode;
  /** Close the menu and open the store's own panel. */
  onBooklist: () => void;
  onTrolley: () => void;
  onFeatured: () => void;
  onTour: () => void;
  /** Leave the 3D store for the classic list/grid shop. */
  onListView: () => void;
  accountHref: string;
  trackOrderHref: string;
  privacyHref: string;
  termsHref: string;
  contact: { phones: string[]; hours?: string; email: string };
}

const TITLES: Record<PausePanel, string> = {
  main: "Paused",
  search: "Search",
  aisles: "Go to an aisle",
  settings: "Settings",
  help: "Help & controls",
};

export function PauseMenu(props: PauseMenuProps) {
  const paused = useGameUi((s) => s.paused);
  const panel = useGameUi((s) => s.panel);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Focus: remember what had focus, move into the menu, restore on close
  useEffect(() => {
    if (paused) {
      if (!returnFocusRef.current) returnFocusRef.current = document.activeElement as HTMLElement;
      // two lookups: one selector list would return the header button, which comes first in the DOM
      const first =
        dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]") ??
        dialogRef.current?.querySelector<HTMLElement>("button, [href], input, select, [tabindex]:not([tabindex='-1'])");
      first?.focus();
    } else if (returnFocusRef.current) {
      returnFocusRef.current.focus?.();
      returnFocusRef.current = null;
    }
  }, [paused, panel]);

  // Keep Tab inside the menu
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const items = dialogRef.current.querySelectorAll<HTMLElement>(
      "button:not([disabled]), [href], input, select, [tabindex]:not([tabindex='-1'])",
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!paused) return null;

  return (
    <div className="lp-pause" onKeyDown={onKeyDown}>
      <div className="lp-pause__backdrop" onClick={() => gameUi.resume()} />

      <div
        ref={dialogRef}
        className="lp-pause__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lp-pause-title"
      >
        <header className="lp-pause__header">
          {panel !== "main" ? (
            <button type="button" className="lp-icon-btn" onClick={() => gameUi.back()} aria-label="Back to menu">
              <Icon name="back" />
            </button>
          ) : (
            <span className="lp-pause__logo" aria-hidden="true">
              <Icon name="book" />
            </span>
          )}
          <h2 id="lp-pause-title" className="lp-pause__title">
            {TITLES[panel]}
          </h2>
          <button type="button" className="lp-icon-btn" onClick={() => gameUi.resume()} aria-label="Close menu and resume">
            <Icon name="close" />
          </button>
        </header>

        <div className="lp-pause__body">
          {panel === "main" && <MainPanel {...props} />}
          {panel === "search" && <SearchPanel render={props.renderSearchResults} />}
          {panel === "aisles" && (
            <AislesPanel aisles={props.aisles} currentId={props.currentAisleId} onGo={props.onGoToAisle} />
          )}
          {panel === "settings" && <SettingsPanel />}
          {panel === "help" && <HelpPanel contact={props.contact} />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main menu: ordered by how often people need each item               */
/* ------------------------------------------------------------------ */

/** Close the pause menu, then run a store action. */
function leave(action: () => void) {
  gameUi.resume();
  action();
}

function MainPanel(p: PauseMenuProps) {
  const progress = p.booklistProgress;
  return (
    <>
      <button
        type="button"
        className="lp-btn lp-btn--primary lp-btn--block lp-btn--lg"
        onClick={() => gameUi.resume()}
        data-autofocus
      >
        <Icon name="play" size={18} /> Resume
      </button>

      <MenuGroup label="Shop">
        <MenuItem icon="search" label="Search products" onClick={() => gameUi.openPanel("search")} />
        <MenuItem
          icon="aisles"
          label="Go to an aisle"
          detail={`${p.aisles.length} aisles`}
          onClick={() => gameUi.openPanel("aisles")}
        />
        <MenuItem
          icon="booklist"
          label="My booklist"
          detail={progress?.total ? `${progress.found} of ${progress.total} in trolley` : undefined}
          onClick={() => leave(p.onBooklist)}
        />
        <MenuItem
          icon="trolley"
          label="Trolley & checkout"
          badge={p.trolleyCount || undefined}
          onClick={() => leave(p.onTrolley)}
        />
        <MenuItem icon="list" label="Featured products" onClick={() => leave(p.onFeatured)} />
        <MenuItem icon="aisles" label="Guided tour" detail="Move any time to take over" onClick={() => leave(p.onTour)} />
      </MenuGroup>

      <MenuGroup label="You">
        <MenuItem icon="user" label="Account" href={p.accountHref} />
        <MenuItem icon="truck" label="Track my order" href={p.trackOrderHref} />
      </MenuGroup>

      <MenuGroup label="Game">
        <MenuItem icon="settings" label="Settings" detail="Graphics, camera" onClick={() => gameUi.openPanel("settings")} />
        <MenuItem icon="help" label="Help & controls" onClick={() => gameUi.openPanel("help")} />
        <MenuItem icon="list" label="Switch to list view" detail="Shop without 3D" onClick={p.onListView} />
      </MenuGroup>

      <footer className="lp-pause__footer">
        <span>
          {[p.contact.phones.join(" / "), p.contact.hours].filter(Boolean).join(" · ")}
        </span>
        <span>
          <a href={p.privacyHref}>Privacy</a> · <a href={p.termsHref}>Terms</a>
        </span>
      </footer>
    </>
  );
}

function MenuGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="lp-menu-group" aria-label={label}>
      <h3 className="lp-menu-group__label">{label}</h3>
      <div className="lp-menu-group__items">{children}</div>
    </section>
  );
}

function MenuItem({
  icon,
  label,
  detail,
  badge,
  onClick,
  href,
}: {
  icon: string;
  label: string;
  detail?: string;
  badge?: number;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <span className="lp-menu-item__icon">
        <Icon name={icon} />
      </span>
      <span className="lp-menu-item__text">
        <span className="lp-menu-item__label">{label}</span>
        {detail && <span className="lp-menu-item__detail">{detail}</span>}
      </span>
      {badge ? <span className="lp-badge lp-badge--inline">{badge}</span> : null}
      <span className="lp-menu-item__chevron">
        <Icon name="chevron" size={18} />
      </span>
    </>
  );
  return href ? (
    <a className="lp-menu-item" href={href}>
      {content}
    </a>
  ) : (
    <button type="button" className="lp-menu-item" onClick={onClick}>
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-panels                                                          */
/* ------------------------------------------------------------------ */

function SearchPanel({ render }: { render: (q: string) => ReactNode }) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setQuery(draft.trim());
  };
  return (
    <>
      <form className="lp-psearch" onSubmit={submit} role="search">
        <Icon name="search" size={18} />
        <input
          data-autofocus
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Books, stationery or school supplies"
          aria-label="Search products"
          enterKeyHint="search"
        />
      </form>
      {query ? render(query) : <p className="lp-muted">Type a product name, subject or grade.</p>}
    </>
  );
}

function AislesPanel({
  aisles,
  currentId,
  onGo,
}: {
  aisles: StoreAisle[];
  currentId?: string;
  onGo: (id: string) => void;
}) {
  return (
    <div className="lp-aisles">
      {aisles.map((a) => (
        <button
          key={a.id}
          type="button"
          className={`lp-aisle ${a.id === currentId ? "is-current" : ""}`}
          onClick={() => {
            gameUi.resume();
            onGo(a.id);
          }}
          aria-current={a.id === currentId ? "location" : undefined}
        >
          <span className="lp-aisle__num">{a.number}</span>
          <span className="lp-aisle__name">{a.name}</span>
          {a.id === currentId && <span className="lp-aisle__here">You are here</span>}
        </button>
      ))}
    </div>
  );
}

function SettingsPanel() {
  const settings = useGameUi((s) => s.settings);
  const update = (patch: Partial<GameSettings>) => gameUi.updateSettings(patch);

  return (
    <div className="lp-settings">
      <fieldset className="lp-field">
        <legend>Graphics</legend>
        <div className="lp-segmented" role="radiogroup" aria-label="Graphics quality">
          {(["auto", "low", "medium", "high"] as const).map((q) => (
            <button
              key={q}
              type="button"
              role="radio"
              aria-checked={settings.quality === q}
              className={settings.quality === q ? "is-active" : ""}
              onClick={() => update({ quality: q })}
            >
              {q === "auto" ? "Auto" : q[0].toUpperCase() + q.slice(1)}
            </button>
          ))}
        </div>
        <p className="lp-muted">Choose Low if the store feels slow on your phone.</p>
      </fieldset>

      <label className="lp-field lp-range">
        <span>Camera speed</span>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={settings.cameraSensitivity}
          onChange={(e) => update({ cameraSensitivity: Number(e.target.value) })}
        />
      </label>
      <Toggle label="Invert camera up/down" checked={settings.invertY} onChange={(v) => update({ invertY: v })} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="lp-toggle"
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <span className={`lp-toggle__track ${checked ? "is-on" : ""}`}>
        <span className="lp-toggle__thumb" />
      </span>
    </button>
  );
}

function HelpPanel({ contact }: { contact: PauseMenuProps["contact"] }) {
  return (
    <div className="lp-help">
      <h3 className="lp-menu-group__label">Computer</h3>
      <dl className="lp-controls">
        <dt>W A S D / arrows</dt>
        <dd>Walk</dd>
        <dt>Drag mouse</dt>
        <dd>Look around</dd>
        <dt>Scroll</dt>
        <dd>Zoom</dd>
        <dt>Click a product</dt>
        <dd>View it</dd>
        <dt>Esc or P</dt>
        <dd>Pause menu</dd>
      </dl>

      <h3 className="lp-menu-group__label">Phone</h3>
      <dl className="lp-controls">
        <dt>Joystick</dt>
        <dd>Walk</dd>
        <dt>Drag one finger</dt>
        <dd>Look around</dd>
        <dt>Pinch</dt>
        <dd>Zoom</dd>
        <dt>Tap a product</dt>
        <dd>View it</dd>
        <dt>❚❚ button</dt>
        <dd>Pause menu</dd>
      </dl>

      <h3 className="lp-menu-group__label">Need help?</h3>
      <p>
        {contact.phones.map((ph) => (
          <a key={ph} className="lp-contact" href={`tel:${ph.replace(/\s/g, "")}`}>
            <Icon name="phone" size={16} /> {ph}
          </a>
        ))}
      </p>
      <p className="lp-muted">
        {contact.hours && `${contact.hours} · `}<a href={`mailto:${contact.email}`}>{contact.email}</a>
      </p>
    </div>
  );
}
