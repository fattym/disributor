/**
 * Tiny shared state for the game UI (no extra libraries).
 * Works inside and outside <Canvas>:
 *
 *   const paused = useGameUi((s) => s.paused);   // in React
 *   if (gameUi.getState().paused) return;        // in useFrame / movement code
 *   gameUi.pause("trolley");                     // open the menu on a panel
 *
 * Note: selectors should return primitives or existing objects
 * (s.paused, s.settings), not new objects, to avoid extra renders.
 */
import { useEffect, useSyncExternalStore } from "react";

export type PausePanel =
  | "main"
  | "search"
  | "aisles"
  | "settings"
  | "help";

export interface GameSettings {
  quality: "auto" | "low" | "medium" | "high";
  /** 0.5 – 2, multiplies camera drag speed */
  cameraSensitivity: number;
  invertY: boolean;
}

export interface GameUiState {
  paused: boolean;
  panel: PausePanel;
  settings: GameSettings;
}

const SETTINGS_KEY = "lp-store-settings";

const DEFAULT_SETTINGS: GameSettings = {
  quality: "auto",
  cameraSensitivity: 1,
  invertY: false,
};

function loadSettings(): GameSettings {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(SETTINGS_KEY) : null;
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let state: GameUiState = {
  paused: false,
  panel: "main",
  settings: DEFAULT_SETTINGS,
};
let settingsLoaded = false;
const listeners = new Set<() => void>();

function setState(partial: Partial<GameUiState>) {
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
}

export const gameUi = {
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Load saved settings in the browser (call once on mount; safe with SSR). */
  hydrate() {
    if (settingsLoaded) return;
    settingsLoaded = true;
    setState({ settings: loadSettings() });
  },
  pause(panel: PausePanel = "main") {
    setState({ paused: true, panel });
  },
  resume() {
    setState({ paused: false, panel: "main" });
  },
  togglePause() {
    if (state.paused) gameUi.resume();
    else gameUi.pause();
  },
  openPanel(panel: PausePanel) {
    setState({ paused: true, panel });
  },
  back() {
    setState({ panel: "main" });
  },
  updateSettings(patch: Partial<GameSettings>) {
    const settings = { ...state.settings, ...patch };
    setState({ settings });
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* private mode etc. — settings just won't persist */
    }
  },
};

export function useGameUi<T>(selector: (s: GameUiState) => T): T {
  return useSyncExternalStore(
    gameUi.subscribe,
    () => selector(state),
    () => selector(state),
  );
}

/**
 * Keyboard + auto-pause behaviour. Use once, in the page component.
 *  - Esc or P: pause / resume (Esc in a sub-panel goes back to the main menu)
 *  - Switching tabs or locking the phone pauses the game
 */
export function usePauseControls(onEscape?: () => boolean) {
  useEffect(() => {
    gameUi.hydrate();

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

      if (e.key === "Escape") {
        e.preventDefault();
        const s = gameUi.getState();
        if (s.paused && s.panel !== "main") gameUi.back();
        else if (!s.paused && onEscape?.()) return; // Esc closed a shop panel instead
        else gameUi.togglePause();
        return;
      }
      if (!typing && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        gameUi.togglePause();
      }
    };

    const onVisibility = () => {
      if (document.hidden && !gameUi.getState().paused) gameUi.pause();
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [onEscape]);
}
