const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('the fake supermarket checkout is gone and nothing links to it', () => {
  assert.ok(!fs.existsSync(path.join(root, 'app/supermarket/checkout')));
  for (const f of ['components/supermarket/TrolleyPanel.tsx', 'components/supermarket/CheckoutBar.tsx']) {
    assert.ok(!read(f).includes('/supermarket/checkout'), f);
    assert.ok(read(f).includes("'/cart'"), f);
  }
});

test('no order button opens an unrecorded WhatsApp chat', () => {
  assert.ok(!/wa\.me/.test(read('app/cart/page.tsx')));
  assert.ok(!/wa\.me|WHATSAPP_NUMBER|buyViaWhatsApp/.test(read('app/shop/page.tsx')));
  assert.ok(read('app/shop/page.tsx').includes('router.push("/cart")'));
});

test('M-Pesa is shown as Coming soon and cannot be chosen; WhatsApp checkout records the order first', () => {
  const cart = read('app/cart/page.tsx');
  assert.ok(cart.includes('Coming soon'));
  const m = cart.match(/function PaymentMethods[\s\S]*?\n}\n/);
  assert.ok(m, 'PaymentMethods component');
  assert.ok(!m[0].includes('onClick'));
  assert.match(m[0], /<button[^>]*disabled[^>]*>\s*<b>M-Pesa/);
  // the WhatsApp link only exists in the API response, after the order is saved; the cart opens it after the await
  assert.ok(!/wa\.me/.test(cart));
  assert.ok(cart.indexOf('await shopApi.whatsappCheckout') < cart.indexOf('window.open(result.whatsapp_url'));
  assert.ok(cart.indexOf('setDone(') < cart.indexOf('window.open(result.whatsapp_url'));
});

test('guests check out with name and phone only', () => {
  const cart = read('app/cart/page.tsx');
  assert.ok(cart.includes('Enter your name.') && cart.includes('Enter your phone number.'));
  assert.ok(!/login|useAuth/.test(cart));
});

test('tracking asks for the number and the phone and no longer pretends to submit a request', () => {
  const page = read('app/track-your-order/page.tsx');
  assert.ok(page.includes('trackOrder(ref, phone)'));
  assert.ok(!page.includes('submitForm') && !page.includes('"submitted"'));
});

test('cart lines keep a display snapshot so the cart renders without the product store', () => {
  const store = read('lib/store/supermarketStore.ts');
  const cart = read('lib/cart.tsx');
  assert.ok(store.includes('export interface CartLine'));
  assert.ok(store.includes('...snapshot'));
  assert.ok(cart.includes('ci.product_name') && cart.includes('ci.unit_price'));
});

test('the 3D bookshop has no demo checkout: its checkout goes to /cart and the live-checkout switch is gone', () => {
  const base = 'components/learning-pack-3d/src/';
  assert.ok(!fs.existsSync(path.join(root, base + 'ui/Checkout.jsx')));
  const api = read(base + 'api.js');
  assert.ok(!/DEMO|LIVE_CHECKOUT|LP-DEMO|export async function checkout/.test(api));
  assert.ok(!read(base + 'App.jsx').includes('Checkout'));
  assert.ok(read(base + 'ui/TrolleyPanel.jsx').includes('window.location.assign("/cart/")'));
  assert.ok(read(base + 'world/CheckoutArea.jsx').includes('window.location.assign("/cart/")'));
  assert.ok(read(base + 'store/useShop.js').includes('unit_price: p.price'));
});

test('robots.txt keeps cart and checkout private and no longer names the removed route', () => {
  const robots = read('app/robots.ts');
  assert.ok(!robots.includes('/supermarket/checkout'));
  assert.ok(robots.includes("'/cart'") && robots.includes("'/checkout'"));
});
