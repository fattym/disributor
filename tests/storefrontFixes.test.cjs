const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
function load(p) {
  const out = ts.transpileModule(read(p), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', out)(mod.exports, mod, (r) => require(path.join(root, path.dirname(p), r)));
  return mod.exports;
}

test('a seller product id is never used as a shop product id (it opened a different product)', () => {
  const page = read('app/dashboard/products/page.tsx');
  assert.ok(!/\/shop\/\$\{/.test(page), 'the dashboard must not build /shop/<seller product id>/ links');
  assert.ok(page.includes('Not in shop yet'));
  assert.ok(!/Published on \/shop|Publish Product to \/shop/.test(page), 'no claim that seller products are on /shop');
});

test('wrong or missing catalogue photos become "No photo yet"; good ones are kept', () => {
  const { cleanPhoto, cleanProduct } = load('lib/productPhoto.ts');
  const bad = require(path.join(root, 'lib/badPhotos.json'));
  assert.ok(bad.includes('https://api.codingclubskenya.com/media/shop/products/2026/p_135.jpg'));
  assert.equal(cleanPhoto(bad[0]), null);
  assert.equal(cleanPhoto(null), null);
  const good = 'https://image.codingclubskenya.com/abrsm-theory-workbook-grade-8.jpg';
  assert.equal(cleanPhoto(good), good);
  const p = cleanProduct({ id: 135, name: 'x', image_url: bad[0], image: bad[0], cover_image: good });
  assert.deepEqual([p.image_url, p.image, p.cover_image], [null, null, good]);
  const api = read('lib/api.ts');
  assert.ok((api.match(/cleanProduct/g) || []).length >= 6, 'every public product response is cleaned');
  for (const f of ['app/shop/page.tsx', 'app/shop/[id]/ProductDetailClient.tsx', 'app/cart/page.tsx']) assert.ok(read(f).includes('No photo yet'), f);
});

test('one main menu, same items and order, on the shared header and the home page', () => {
  const { MAIN_NAV } = load('lib/nav.ts');
  assert.deepEqual(MAIN_NAV.map((i) => i.label), ['Shop', 'Bookshop', 'Discovery', 'Find my school list', 'Upload my list', 'Signature pack', 'Track your order', 'Contact us']);
  for (const i of MAIN_NAV) assert.ok(fs.existsSync(path.join(root, 'app', i.href, 'page.tsx')), `${i.href} is a real page`);
  for (const f of ['components/GlobalHeader.tsx', 'app/page.tsx']) assert.ok(read(f).includes('MAIN_NAV.map'), f);
  assert.ok(!read('components/GlobalHeader.tsx').includes('#signature'));
});

test('checkout uses the real logo, login has a way back, the cart badge is readable', () => {
  const cart = read('app/cart/page.tsx');
  assert.ok(cart.includes('__html: LOGO_SVG') && !cart.includes('>LP</span>'));
  const login = read('app/login/page.tsx');
  assert.ok(login.includes('Back to shop') && login.includes('href="/" className="logo"'));
  const home = read('app/home.css');
  const badge = home.slice(home.lastIndexOf('.header .cart-count-badge,'));
  assert.ok(Number(badge.match(/height: (\d+)px/)[1]) >= 18);
  assert.ok(badge.includes('html.dark-mode .cart-count-badge'));
});

test('shop filters stack full width on phones', () => {
  const css = read('app/shop/shop-page.css');
  const block = css.slice(css.lastIndexOf('@media (max-width: 640px)'));
  assert.match(block, /\.shop-audience \{ grid-template-columns: 1fr/);
  assert.match(block, /\.shop-checklist label \{ min-height: 44px/);
});

test('the home page header shows the cart count too', () => {
  assert.ok(read('app/page.tsx').includes('<CartCount />'));
  assert.ok(read('components/CartCount.tsx').includes('cart-count-badge'));
});
