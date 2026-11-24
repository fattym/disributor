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

test('M-Pesa is shown as Coming soon and cannot be started from the cart page', () => {
  const cart = read('app/cart/page.tsx');
  assert.ok(cart.includes('Coming soon'));
  const m = cart.match(/function PaymentMethods[\s\S]*?\n}\n/);
  assert.ok(m, 'PaymentMethods component');
  assert.ok(!m[0].includes('onClick'));
  assert.equal((m[0].match(/disabled/g) || []).length >= 2, true);
});

test('cart lines keep a display snapshot so the cart renders without the product store', () => {
  const store = read('lib/store/supermarketStore.ts');
  const cart = read('lib/cart.tsx');
  assert.ok(store.includes('export interface CartLine'));
  assert.ok(store.includes('...snapshot'));
  assert.ok(cart.includes('ci.product_name') && cart.includes('ci.unit_price'));
});
