import { useEffect, useState } from "react";
import { kes } from "../data/catalogue.js";
import { useCart, useShop } from "../store/useShop.js";
import { DEMO, checkout } from "../api.js";
import Icon from "./Icon.jsx";
import Thumb from "./Thumb.jsx";

const PHONE = /^(\+?254|0)(7|1)\d{8}$/;
const DELIVERY_FEE = 300;

export default function Checkout() {
  const open = useShop((s) => s.panel === "checkout");
  const setPanel = useShop((s) => s.setPanel);
  const closeAll = useShop((s) => s.closeAll);
  const selection = useShop((s) => s.selection);
  const cart = useCart();
  // school and grade default to the booklist selection until the parent edits them
  const [f, setF] = useState({ name: "", phone: "", school: null, grade: null, delivery: false, address: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [fail, setFail] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeAll();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, closeAll]);

  if (!open) return null;
  const val = (k) => f[k] ?? selection[k] ?? "";
  const fee = f.delivery ? DELIVERY_FEE : 0;
  const total = cart.subtotal + fee;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = "Enter the parent or guardian’s name";
    if (!PHONE.test(f.phone.replace(/\s/g, ""))) e.phone = "Enter a Kenyan mobile number, e.g. 0712 345 678";
    if (!val("school").trim()) e.school = "Enter your child’s school";
    if (!val("grade").trim()) e.grade = "Enter your child’s grade";
    if (f.delivery && !f.address.trim()) e.address = "Enter a delivery address, or choose collection";
    return e;
  };

  async function pay(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setFail("");
    if (Object.keys(e).length || !cart.lines.length) return;
    setBusy(true);
    try {
      if (DEMO) await new Promise((r) => setTimeout(r, 700));
      const r = await checkout({
        parent_name: f.name.trim(),
        phone: f.phone.replace(/\s/g, ""),
        school: val("school"),
        grade: val("grade"),
        fulfilment: f.delivery ? "delivery" : "collection",
        address: f.address,
        items: cart.lines.map((l) => ({ variant: l.variantId, quantity: l.quantity })),
      });
      setDone({ ...r, total, lines: cart.lines, delivery: f.delivery });
    } catch (err) {
      setFail(err.message || "We couldn’t place the order. Please try again.");
    }
    setBusy(false);
  }

  const field = (k, label, props = {}) => (
    <label className={"fld" + (errors[k] ? " bad" : "")}>
      <span>{label}</span>
      <input value={val(k)} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined} {...props} />
      {errors[k] && <em id={`e-${k}`}>{errors[k]}</em>}
    </label>
  );

  if (done) {
    return (
      <div className="co" role="dialog" aria-label="Order confirmation">
        <div className="co-done">
          <span className="ok-ico"><Icon name="check" /></span>
          <h2>{done.demo ? "Demo order placed" : "Check your phone"}</h2>
          {done.demo ? (
            <p className="demo"><b>This was a demo.</b> No payment was taken and no real order was created. In the live shop you would now receive an M-Pesa prompt and the order is confirmed once Safaricom verifies payment.</p>
          ) : (
            <p>Enter your M-Pesa PIN on the prompt. We confirm your order once Safaricom verifies the payment.</p>
          )}
          <dl>
            <div><dt>Reference</dt><dd>{done.order_id}</dd></div>
            <div><dt>{done.delivery ? "Delivery" : "Collection"}</dt><dd>{done.delivery ? "Nairobi, 1–2 days" : "Free, in store"}</dd></div>
            <div><dt>Total</dt><dd>{kes(done.total)}</dd></div>
          </dl>
          {done.demo && <p className="note">Your trolley has been kept so you can keep exploring.</p>}
          <button className="lp-btn wide" onClick={() => { setDone(null); closeAll(); }}>Back to the store</button>
        </div>
      </div>
    );
  }

  return (
    <div className="co" role="dialog" aria-label="Checkout">
      <header className="co-top">
        <button className="link" onClick={() => setPanel("cart")}><Icon name="left" /> Back to trolley</button>
        <h2>Checkout</h2>
        <button className="icon-btn sm" onClick={closeAll} aria-label="Close checkout"><Icon name="x" /></button>
      </header>
      <form className="co-grid" onSubmit={pay} noValidate>
        <div className="co-main">
          {DEMO && <div className="demo"><Icon name="info" /> <span><b>Demo checkout.</b> Nothing is charged and no payment details are collected.</span></div>}

          <section>
            <h3>1. Parent contact</h3>
            <div className="two">
              {field("name", "Full name", { autoComplete: "name" })}
              {field("phone", "M-Pesa phone number", { inputMode: "tel", placeholder: "07XX XXX XXX", autoComplete: "tel" })}
            </div>
          </section>

          <section>
            <h3>2. Your child</h3>
            <div className="two">
              {field("school", "School")}
              {field("grade", "Grade / class")}
            </div>
          </section>

          <section>
            <h3>3. Delivery or collection</h3>
            <div className="choice" role="radiogroup" aria-label="Delivery or collection">
              <label className={!f.delivery ? "on" : ""}>
                <input type="radio" name="fulfil" checked={!f.delivery} onChange={() => setF({ ...f, delivery: false })} />
                <Icon name="store" /><b>Collect in store</b><small>Free · ready in 1 hour</small>
              </label>
              <label className={f.delivery ? "on" : ""}>
                <input type="radio" name="fulfil" checked={f.delivery} onChange={() => setF({ ...f, delivery: true })} />
                <Icon name="truck" /><b>Deliver to me</b><small>{kes(DELIVERY_FEE)} · Nairobi, 1–2 days</small>
              </label>
            </div>
            {f.delivery && field("address", "Delivery address", { autoComplete: "street-address", placeholder: "Estate, street, landmark" })}
          </section>

          <section>
            <h3>4. Payment</h3>
            <div className="pay-box">
              <span className="mpesa">M-PESA</span>
              <span>You’ll get an STK push on the phone number above to confirm payment.</span>
            </div>
          </section>
        </div>

        <aside className="co-sum" aria-label="Order summary">
          <h3>Order summary</h3>
          <ul>
            {cart.lines.map((l) => (
              <li key={l.variantId}>
                <Thumb product={l.product} />
                <span className="s-name">{l.product.name}<small>Qty {l.quantity}</small></span>
                <b>{kes(l.subtotal)}</b>
              </li>
            ))}
          </ul>
          <div className="sum-row"><span>Subtotal</span><b>{kes(cart.subtotal)}</b></div>
          <div className="sum-row"><span>{f.delivery ? "Delivery" : "Collection"}</span><b>{fee ? kes(fee) : "Free"}</b></div>
          <div className="sum-row big"><span>Total</span><b>{kes(total)}</b></div>
          {fail && <p className="err" role="alert">{fail}</p>}
          <button className="lp-btn wide" disabled={busy || !cart.lines.length}>
            {busy ? "Placing order…" : DEMO ? "Pay with M-Pesa · demo" : "Pay with M-Pesa"}
          </button>
          <p className="note">{DEMO ? "Demo only: no money moves." : "You will confirm payment on your phone."}</p>
        </aside>
      </form>
    </div>
  );
}
