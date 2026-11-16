import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSupermarketStore } from "@/lib/store/supermarketStore";
import { fetchCatalogue, fetchSchools } from "../api.js";
import { AISLES, CURRICULA, bundleOf, buildBundles, demoCatalogue, deriveBooklist, normalise, stockAisles } from "../data/catalogue.js";
import { aisleStand, firstSlotOfTile, slotPose } from "../data/layout.js";

let toastTimer;
let rawCache = null; // survives remounts within the session, so re-entering the shop is instant

const DEFAULT_SELECTION = { school: "", curriculum: "CBC", grade: "Grade 5", year: new Date().getFullYear() + 1 };

export const useShop = create(
  persist(
    (set, get) => ({
      // catalogue + shelves
      status: "idle", // idle | loading | ready
      progress: { loaded: 0, total: 0 },
      offline: false,
      catalogue: [],
      index: {}, // variantId -> product
      bundles: [],
      stock: AISLES.map(() => []),
      stockVersion: 0,

      // booklist
      schools: [],
      selection: DEFAULT_SELECTION,
      booklist: [],
      gradeBundle: null,
      view: "full", // full | browse | missing

      // interaction
      selected: null,
      nearby: null,
      hover: null,
      panel: null, // cart | booklist | checkout | featured
      toast: null,
      teleport: null,
      tour: false,
      resetToken: 0,
      aisleHere: -1,

      // ------------------------------------------------------------ catalogue
      loadCatalogue: async () => {
        if (get().status !== "idle") return;
        set({ status: "loading" });
        // schools load alongside the catalogue so the booklist chip is right from the start
        fetchSchools().then((schools) => {
          if (!schools?.length) return;
          const cur = get().selection;
          set({ schools, selection: { ...cur, school: schools.some((x) => x.name === cur.school) ? cur.school : schools[0].name } });
        });
        try {
          rawCache = rawCache || (await fetchCatalogue((loaded, total) => set({ progress: { loaded, total } })));
          get().ingest(rawCache.map(normalise));
        } catch (e) {
          console.warn("Catalogue unavailable, using sample stock:", e);
          get().ingest(demoCatalogue());
          set({ offline: true });
          get().say("Couldn't reach the catalogue. Showing sample products.");
        }
        set({ status: "ready" });
      },

      ingest: (catalogue) => {
        const index = {};
        catalogue.forEach((p) => p.variantId != null && (index[p.variantId] = p));
        set({ catalogue, index, bundles: buildBundles(catalogue) });
        get().refreshBooklist();
      },

      /** Re-derives the booklist for the chosen grade and restocks so its items are on the shelves. */
      refreshBooklist: () => {
        const { catalogue, selection } = get();
        const booklist = deriveBooklist(catalogue, selection);
        const found = booklist.filter((l) => l.product).map((l) => l.product);
        const gradeBundle = found.length >= 3 ? bundleOf("booklist", `${selection.grade} Booklist Bundle`, found) : null;
        set({ booklist, gradeBundle });
        get().restock();
      },

      restock: () => {
        const { catalogue, bundles, booklist, gradeBundle } = get();
        const priority = new Set(booklist.filter((l) => l.product).map((l) => l.product.id));
        set((s) => ({ stock: stockAisles(catalogue, priority, gradeBundle ? [gradeBundle, ...bundles] : bundles), stockVersion: s.stockVersion + 1 }));
      },

      setSelection: (patch) => {
        const cur = get().selection;
        const next = { ...cur, ...patch };
        if (patch.curriculum && patch.curriculum !== cur.curriculum && !CURRICULA[next.curriculum].includes(next.grade)) {
          next.grade = CURRICULA[next.curriculum][Math.min(5, CURRICULA[next.curriculum].length - 1)];
        }
        set({ selection: next });
        get().refreshBooklist();
      },
      setView: (view) => set({ view }),

      // ------------------------------------------------------------ shopping
      add: (product, quantity = 1) => {
        const cart = useSupermarketStore.getState();
        const items = (product.isBundle ? product.items : [product]).filter((p) => !p.unavailable && p.variantId != null);
        if (!items.length || (product.isBundle && items.length !== product.items.length)) return false;
        items.forEach((p) => cart.addToCart(p.variantId, quantity));
      },
      addMissing: () => {
        const have = new Set(useSupermarketStore.getState().cartItems.map((c) => c.variant_id));
        const missing = get().booklist.filter((l) => l.product && !l.product.unavailable && !have.has(l.product.variantId));
        missing.forEach((l) => get().add(l.product, 1));
        return missing.length;
      },
      setQuantity: (variantId, quantity) => useSupermarketStore.getState().updateCartQuantity(variantId, quantity),
      remove: (variantId) => useSupermarketStore.getState().removeFromCart(variantId),
      clear: () => useSupermarketStore.getState().clearCart(),

      // ------------------------------------------------------------ navigation / UI
      select: (selected) => set({ selected, panel: get().panel === "featured" ? null : get().panel }),
      setNearby: (nearby) => set({ nearby }),
      setHover: (hover) => set({ hover }),
      setAisleHere: (aisleHere) => set({ aisleHere }),
      setPanel: (p) => set((s) => ({ panel: s.panel === p ? null : p, selected: p ? null : s.selected })),
      closeAll: () => set({ panel: null, selected: null }),
      say: (m) => {
        set({ toast: m });
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => set({ toast: null }), 2800);
      },

      /** Walk to the shelf holding `product` (or to its aisle if it is not on the shelves) and open its card. */
      goTo: (product) => {
        const aisle = product.isBundle ? 7 : product.aisle;
        if (aisle < 0 || aisle == null) {
          set({ selected: product, panel: null });
          return;
        }
        const list = get().stock[aisle];
        const tile = list.findIndex((p) => p.id === product.id);
        const stand = aisleStand(aisle, tile >= 0 ? slotPose(aisle, firstSlotOfTile(tile, list.length)).z : -4);
        set({ teleport: { ...stand, t: performance.now() }, selected: product, panel: null, tour: false });
        if (tile < 0) get().say(`Not on the shelf right now. Browse Aisle ${aisle + 1} or order it below.`);
      },
      goToAisle: (aisle) => {
        const stand = aisleStand(aisle, -4);
        set({ teleport: { ...stand, t: performance.now() }, selected: null, panel: null, tour: false });
        get().say(`Aisle ${aisle + 1} · ${AISLES[aisle].long}`);
      },
      startTour: () => {
        set({ tour: true, panel: null, selected: null });
        get().say("Guided tour. Move any time to take over.");
      },
      stopTour: () => set({ tour: false }),
      resetCamera: () => set((s) => ({ resetToken: s.resetToken + 1, tour: false })),
    }),
    { name: "lp3d_v3", partialize: (s) => ({ selection: s.selection }) }
  )
);

// ------------------------------------------------------------------ cart views

/** Cart lines resolved against the catalogue. Unknown ids (e.g. added from another page) stay visible. */
export function resolveCart(cartItems, index) {
  const lines = cartItems.map((c) => {
    const product = index[c.variant_id] || { id: c.variant_id, variantId: c.variant_id, name: `Item #${c.variant_id}`, brand: "", price: 0, image: "", unresolved: true };
    return { variantId: c.variant_id, quantity: c.quantity, product, subtotal: product.price * c.quantity };
  });
  return { lines, count: lines.reduce((a, l) => a + l.quantity, 0), subtotal: lines.reduce((a, l) => a + l.subtotal, 0) };
}

export function useCart() {
  const cartItems = useSupermarketStore((s) => s.cartItems);
  const index = useShop((s) => s.index);
  return resolveCart(cartItems, index);
}

export const useInCart = () => {
  const cartItems = useSupermarketStore((s) => s.cartItems);
  return new Set(cartItems.map((c) => c.variant_id));
};

export const cartSnapshot = () => resolveCart(useSupermarketStore.getState().cartItems, useShop.getState().index);
