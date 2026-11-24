const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

/** Load a dependency-free .ts helper without a build step. */
function load(p) {
  const out = ts.transpileModule(read(p), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', out)(mod.exports, mod);
  return mod.exports;
}

test('parseApiError shows DRF field errors, detail, permission and server problems readably', () => {
  const { parseApiError } = load('lib/apiError.ts');
  const e = (status, data) => ({ response: { status, data } });
  const a = parseApiError(e(400, { unit_price: ['A valid number is required.'], name: ['This field may not be blank.'] }));
  assert.equal(a.fields.unit_price, 'A valid number is required.');
  assert.equal(a.fields.name, 'This field may not be blank.');
  assert.match(a.message, /fix the highlighted/i);
  const nested = parseApiError(e(400, { variants: [{}, { stock_quantity: ['Ensure this value is greater than or equal to 0.'] }] }));
  assert.ok(nested.fields['variants.2.stock_quantity']);
  assert.equal(parseApiError(e(400, { detail: 'Stock cannot go below 3.' })).message, 'Stock cannot go below 3.');
  assert.equal(parseApiError(e(403, { detail: 'Only distributors or admins can create products.' })).message, 'Only distributors or admins can create products.');
  assert.match(parseApiError(e(500, '<html>oops</html>')).message, /server had a problem/i);
  assert.match(parseApiError(e(401, {})).message, /sign in again/i);
  assert.match(parseApiError(e(413, '')).message, /too large/i);
  assert.match(parseApiError(new Error('Network Error')).message, /could not reach the server/i);
});

test('shop seller filter: real names, platform fallback, crawlable hrefs that keep other filters', () => {
  const { sellerOf, sellerOptions, sellerHref, PLATFORM_SELLER } = load('lib/shopSeller.ts');
  assert.equal(sellerOf({ distributor_name: null }), PLATFORM_SELLER);
  assert.equal(sellerOf({ distributor_name: ' Kitabu Distributors ' }), 'Kitabu Distributors');
  const opts = sellerOptions([{ distributor_name: 'Kitabu Distributors' }, { distributor_name: null }, { distributor_name: 'Kitabu Distributors' }]);
  assert.deepEqual(opts, [{ name: 'Kitabu Distributors', count: 2 }, { name: 'Learning Pack', count: 1 }]);
  assert.equal(sellerHref('', 'Kitabu Distributors'), '/shop/?seller=Kitabu+Distributors');
  assert.equal(sellerHref('category=reference&page=3&seller=Old', 'Learning Pack'), '/shop/?category=reference&seller=Learning+Pack');
  assert.equal(sellerHref('seller=Old&q=atlas', null), '/shop/?q=atlas');
  assert.equal(sellerHref('seller=Old', null), '/shop/');
  const page = read('app/shop/page.tsx');
  assert.ok(page.includes('sellerHref(query, s.name)') && page.includes('sellerOf(p) === sellerParam'));
  assert.ok(page.includes('href={sellerHref('), 'the seller links are real anchors');
});

test('the product form shows API errors in the form, not in an alert or a banner that vanishes', () => {
  const page = read('app/dashboard/products/page.tsx');
  assert.ok(!/\balert\(/.test(page), 'no alert() in the product form');
  assert.ok(page.includes("parseApiError(error, 'Failed to save product.')"));
  assert.ok(page.includes('role="alert"') && page.includes('formErrorRef'));
  assert.ok(!page.includes("console.warn('Product saved but image upload"), 'an image upload failure is no longer swallowed');
  assert.ok(page.includes('imageWarning'));
});

test('no global CSS rule wipes Tailwind spacing after client-side navigation', () => {
  const login = read('app/login/login.css');
  assert.ok(!/^\*\s*\{/m.test(login), 'login.css must not have a bare * reset');
  assert.ok(login.includes(':where(.login-page-container)'));
  const home = read('app/home.css');
  assert.ok(!/^\.grid\s*\{/m.test(home) && !/^\s+\.grid\s*\{/m.test(home), 'the legacy .grid class clashes with Tailwind grid');
  assert.ok(read('app/product-category/student-boxes/page.tsx').includes('className="product-grid"'));
  assert.ok(home.includes('.lp-app section'));
  assert.ok(read('app/dashboard/DashboardShell.tsx').includes('lp-app'));
  assert.ok(read('app/admin/AdminShell.tsx').includes('lp-app'));
});

test('phone tap targets: the public header, shop cards and seller controls are at least 44px', () => {
  const home = read('app/home.css');
  const block = home.slice(home.lastIndexOf('@media (max-width: 820px)'));
  for (const sel of ['.menu-btn', '.theme-toggle', '.shop-nav__trigger', '.shop-card__btn', '.search input', '.search button']) {
    assert.ok(block.includes(sel), sel);
  }
  assert.match(block, /min-height: 44px/);
  const products = read('app/dashboard/products/page.tsx');
  assert.ok((products.match(/min-h-11/g) || []).length >= 8);
  assert.ok(read('app/dashboard/fulfilments/page.tsx').includes('h-11 min-w-0 flex-1'));
  const dash = read('app/dashboard/page.tsx');
  assert.ok(dash.includes('md:hidden') && dash.includes('hidden overflow-x-auto md:block'), 'orders are cards on phones, a table from md up');
});

test('the product form buttons actually have a colour: bg-coral exists in the theme with enough contrast', () => {
  const css = read('app/globals.css');
  const m = css.match(/--color-coral:\s*(#[0-9a-fA-F]{6})/);
  assert.ok(m, '--color-coral must be defined or bg-coral/text-coral render as nothing');
  const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  assert.ok(ratio(m[1], '#ffffff') >= 4.5, 'white text on bg-coral and text-coral on white need 4.5:1');
  const shop = read('app/shop/shop-page.css');
  const buy = shop.match(/\.shop-card__btn--buy \{[^}]*\}/)[0];
  assert.ok(/color: #0b1f3a/.test(buy) && /background: #fff/.test(buy), 'Buy now must be readable on the light card');
});
