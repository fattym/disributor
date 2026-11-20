// /admin/users/[type] must await Next 16's Promise `params` (reading it synchronously throws in dev).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const SRC = path.join(__dirname, '..', 'app', 'admin', 'users', '[type]', 'page.tsx');

function loadPage() {
  const js = ts.transpileModule(fs.readFileSync(SRC, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const m = new Module(SRC);
  m.filename = SRC;
  m.paths = Module._nodeModulePaths(path.dirname(SRC));
  const Stub = function UserManagement() { return null; };
  m.require = (id) => (id === '@/components/admin/UserManagement' ? { __esModule: true, default: Stub } : Module.prototype.require.call(m, id));
  m._compile(js, SRC);
  return { page: m.exports, Stub };
}

test('awaits params and passes the known type through', async () => {
  const { page, Stub } = loadPage();
  const el = await page.default({ params: Promise.resolve({ type: 'teachers' }) });
  assert.equal(el.type, Stub);
  assert.equal(el.props.activeType, 'teachers');
});

test('unknown type falls back to all', async () => {
  const { page } = loadPage();
  const el = await page.default({ params: Promise.resolve({ type: 'nope' }) });
  assert.equal(el.props.activeType, 'all');
});

test('every valid type is pre-rendered for the static export', async () => {
  const { page } = loadPage();
  const params = await page.generateStaticParams();
  assert.deepEqual(params.map((p) => p.type).sort(), ['administrators', 'customers', 'school-accounts', 'sellers', 'teachers']);
});
