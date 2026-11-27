import { CURRICULA, kes } from "../data/catalogue.js";
import { useCart, useInCart, useShop } from "../store/useShop.js";
import Icon from "./Icon.jsx";
import Thumb from "./Thumb.jsx";

const YEAR = new Date().getFullYear();

export default function BooklistPanel() {
  const open = useShop((s) => s.panel === "booklist");
  const closeAll = useShop((s) => s.closeAll);
  const selection = useShop((s) => s.selection);
  const schools = useShop((s) => s.schools);
  const setSelection = useShop((s) => s.setSelection);
  const booklist = useShop((s) => s.booklist);
  const gradeBundle = useShop((s) => s.gradeBundle);
  const view = useShop((s) => s.view);
  const setView = useShop((s) => s.setView);
  const goTo = useShop((s) => s.goTo);
  const add = useShop((s) => s.add);
  const addMissing = useShop((s) => s.addMissing);
  const say = useShop((s) => s.say);
  const have = useInCart();
  const cart = useCart();

  const lines = booklist.map((l) => ({ ...l, done: !!l.product && have.has(l.product.variantId) }));
  const required = lines.filter((l) => l.product);
  const added = required.filter((l) => l.done).length;
  const missing = required.length - added;
  const shown = view === "missing" ? lines.filter((l) => !l.done) : lines;
  const missingTotal = required.filter((l) => !l.done).reduce((a, l) => a + l.product.price, 0);

  return (
    <aside className={"panel" + (open ? " on" : "")} inert={!open} aria-label="School booklist">
      <header className="p-head">
        <h2><Icon name="list" /> Shop My Child’s Booklist</h2>
        <button className="icon-btn sm" onClick={closeAll} aria-label="Close booklist"><Icon name="x" /></button>
      </header>
      <div className="p-body">
        <div className="selects">
          <label>School
            <select value={selection.school} onChange={(e) => setSelection({ school: e.target.value })}>
              {!selection.school && <option value="">Select your school</option>}
              {schools.map((s) => <option key={s.id}>{s.name}</option>)}
              {selection.school && !schools.some((s) => s.name === selection.school) && <option>{selection.school}</option>}
            </select>
          </label>
          <label>Curriculum
            <select value={selection.curriculum} onChange={(e) => setSelection({ curriculum: e.target.value })}>
              {Object.keys(CURRICULA).map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>Grade / class
            <select value={selection.grade} onChange={(e) => setSelection({ grade: e.target.value })}>
              {CURRICULA[selection.curriculum].map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label>Academic year
            <select value={selection.year} onChange={(e) => setSelection({ year: Number(e.target.value) })}>
              {[YEAR, YEAR + 1].map((y) => <option key={y}>{y}</option>)}
            </select>
          </label>
        </div>

        <div className="progress" role="status">
          <div className="pg-top">
            <b>{added} of {required.length} required items added</b>
            {missing === 0 && required.length > 0 && <span className="tag ok"><Icon name="check" /> Complete</span>}
          </div>
          <div className="bar"><i style={{ width: required.length ? `${(added / required.length) * 100}%` : 0 }} /></div>
          {lines.length > required.length && <small>{lines.length - required.length} item{lines.length - required.length > 1 ? "s" : ""} not in our catalogue yet. Ask us at the counter.</small>}
        </div>

        <button
          className="lp-btn wide"
          disabled={!missing}
          onClick={() => {
            const n = addMissing();
            say(n ? `Added ${n} booklist item${n > 1 ? "s" : ""} to your trolley` : "Everything is already in your trolley");
          }}
        >
          <Icon name="cart" /> {missing ? `Shop My Child’s Booklist · ${kes(missingTotal)}` : "Booklist complete"}
        </button>

        <div className="tabs" role="tablist" aria-label="Booklist view">
          <button role="tab" aria-selected={view === "full"} className={view === "full" ? "on" : ""} onClick={() => setView("full")}>Full booklist</button>
          <button role="tab" aria-selected={view === "browse"} className={view === "browse" ? "on" : ""} onClick={() => { setView("browse"); closeAll(); }}>Browse store</button>
          <button role="tab" aria-selected={view === "missing"} className={view === "missing" ? "on" : ""} onClick={() => setView("missing")}>Missing only</button>
        </div>

        {gradeBundle && (
          <div className="bundle-row">
            <Thumb product={gradeBundle} />
            <div className="l-main">
              <b>{gradeBundle.name}</b>
              <small>{gradeBundle.items.length} items · {kes(gradeBundle.price)}</small>
            </div>
            <button className="lp-btn s" onClick={() => goTo(gradeBundle)}>View</button>
          </div>
        )}

        <ul className="lines">
          {shown.map((l) => (
            <li key={l.key} className={"line bl" + (l.done ? " done" : "") + (!l.product ? " na" : "")}>
              <span className="state" aria-label={l.done ? "In trolley" : l.product ? "Missing" : "Not in catalogue"}>
                <Icon name={l.done ? "check" : l.product ? "plus" : "warn"} />
              </span>
              <div className="l-main">
                <small className="req">{l.label}</small>
                <b>{l.product ? l.product.name : "Not in our catalogue yet"}</b>
                {l.product && <small>{kes(l.product.price)}</small>}
              </div>
              {l.product && (
                <div className="bl-act">
                  <button className="lp-btn s ghost" onClick={() => goTo(l.product)} aria-label={`Find ${l.product.name} on the shelf`}>Find</button>
                  {!l.done && l.product?.unavailable && <button className="lp-btn s" disabled>Unavailable</button>}
                  {!l.done && !l.product?.unavailable && <button className="lp-btn s" onClick={() => { add(l.product, 1); say(`Added ${l.product.name}`); }}>Add</button>}
                </div>
              )}
            </li>
          ))}
          {!shown.length && <li className="lp-empty small"><Icon name="check" /><b>Nothing missing</b><p>Every required item is in your trolley.</p></li>}
        </ul>
        <p className="note">Booklist suggestions are matched from our catalogue for {selection.grade}. Always confirm against your school’s list.</p>
      </div>
      <footer className="p-foot">
        <button className="lp-btn wide" disabled={!cart.count} onClick={() => useShop.getState().setPanel("cart")}>
          <Icon name="cart" /> View trolley ({cart.count})
        </button>
      </footer>
    </aside>
  );
}
