// Run: node --test   (no extra dependencies: TypeScript is already installed for Next)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const SRC = path.join(__dirname, '..', 'lib', 'adminApi.ts');
const source = fs.readFileSync(SRC, 'utf8');

function load(handler) {
  const calls = [];
  const fakeApi = {
    api: {
      get: async (url, cfg) => { calls.push(['get', url]); return handler('get', url, cfg); },
      post: async (url, body) => { calls.push(['post', url]); return handler('post', url, body); },
      patch: async (url, body) => { calls.push(['patch', url]); return handler('patch', url, body); },
      delete: async (url) => { calls.push(['delete', url]); return handler('delete', url); },
    },
  };
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const m = new Module(SRC);
  m.filename = SRC;
  m.paths = Module._nodeModulePaths(path.dirname(SRC));
  m.require = (id) => (id === './api' ? fakeApi : Module.prototype.require.call(m, id));
  m._compile(js, SRC);
  return { mod: m.exports, calls };
}

const down = () => { const e = new Error('Request failed with status code 500'); e.response = { status: 500 }; throw e; };
const empty = () => ({ data: [] });

test('no mock data or safe() fallback remains in the module', () => {
  assert.doesNotMatch(source, /\bsafe\s*\(/);
  assert.doesNotMatch(source, /export const mock[A-Z]/);
  const { mod } = load(empty);
  assert.deepEqual(Object.keys(mod).filter((k) => /^mock/.test(k)), []);
});

test('pages without a backend have no API methods', () => {
  const { mod } = load(empty);
  for (const k of ['getCoupons', 'getWithdrawals', 'getSettings', 'getReviews', 'getNotifications', 'getContent']) {
    assert.equal(mod.adminApi[k], undefined, k);
  }
});

const READS = [
  ['getUsers', []], ['getSellers', []], ['getPendingSellers', []], ['getProducts', []], ['getCourses', []],
  ['getOrders', []], ['getPayments', []], ['getTransactions', []], ['getHeldFunds', []], ['getCategories', []],
  ['getProductCount', []], ['getGrades', []], ['getLearningAreas', []], ['getPathways', []], ['getSalesAnalytics', []],
  ['getRecentOrders', []], ['getDashboardStats', []],
];

for (const [name, args] of READS) {
  test(`${name} rejects when the server fails (no mock rows)`, async () => {
    const { mod } = load(down);
    await assert.rejects(() => mod.adminApi[name](...args), /500/);
  });
}

test('empty server data gives empty lists, not sample rows', async () => {
  const { mod } = load(empty);
  for (const name of ['getUsers', 'getSellers', 'getProducts', 'getCourses', 'getOrders', 'getPayments', 'getCategories', 'getSalesAnalytics', 'getRecentOrders']) {
    assert.deepEqual(await mod.adminApi[name](), [], name);
  }
});

test('dashboard stats are zeros from an empty server, never the old sample figures', async () => {
  const { mod } = load(empty);
  const stats = await mod.adminApi.getDashboardStats();
  assert.equal(stats.length, 8);
  assert.equal(stats.find((s) => s.label === 'Total Orders').value, '0');
  assert.equal(stats.find((s) => s.label === 'Total Revenue').value, 'KSh 0');
});

test('dashboard product tile uses the server count, not a page download', async () => {
  const { mod, calls } = load((m, url) =>
    url.startsWith('/shop/products') ? { data: { count: 3858, results: [], next: 'x' } } : { data: [] });
  const stats = await mod.adminApi.getDashboardStats();
  assert.equal(stats.find((s) => s.label === 'Total Products').value, '3,858');
  assert.equal(calls.filter((c) => c[1].startsWith('/shop/products')).length, 1);
});

test('createProduct rejects on failure instead of inventing a product', async () => {
  const { mod } = load(down);
  await assert.rejects(() => mod.adminApi.createProduct({ name: 'X', category: 1, price: '10' }), /500/);
});

test('createProduct reports a failed image upload', async () => {
  const { mod } = load((method, url) => {
    if (url.endsWith('/upload_images/')) down();
    return { data: { id: 7, name: 'X' } };
  });
  await assert.rejects(
    () => mod.adminApi.createProduct({ name: 'X', category: 1, price: '10', images: [{ name: 'a.png' }] }),
    /images failed to upload/,
  );
});

test('sales analytics sorts months chronologically across years and skips undated orders', async () => {
  const rows = [
    { id: 1, created_at: '2026-02-10T10:00:00Z', total_amount: '100' },
    { id: 2, created_at: '2025-12-05T10:00:00Z', total_amount: '50' },
    { id: 3, created_at: '2026-02-20T10:00:00Z', total_amount: '25' },
    { id: 4, total_amount: '999' },
  ];
  const { mod } = load(() => ({ data: rows }));
  const sales = await mod.adminApi.getSalesAnalytics();
  assert.equal(sales.length, 2);
  assert.match(sales[0].month, /2025/);
  assert.equal(sales[1].orders, 2);
  assert.equal(sales[1].revenue, 125);
});
