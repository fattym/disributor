const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const load = (p) => {
  const out = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', p), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', out)(mod.exports, mod, () => ({}));
  return mod.exports;
};

test('a class button only matches its own class, appears once, and only when it has products', () => {
  const { classesIn, findClass } = load('lib/gradeClasses.ts');
  const products = [{ name: 'Maths Grade 10' }, { name: 'English GRADE-4' }, { name: 'Science grade 4' }, { name: 'PP1 Colours' }, { name: 'Form 2 Atlas' }, { name: 'Stapler' }];
  assert.deepStrictEqual(classesIn(products).map((c) => c.slug), ['pp1', 'grade-4', 'grade-10', 'form-2']);
  assert.ok(!findClass('grade-1').pattern.test('Maths Grade 10'));
  assert.equal(findClass('nonsense'), undefined);
});

test('the school picker lists only schools with a published list, each once', () => {
  const { schoolsWithLists } = load('lib/booklistSchools.ts');
  const list = (school, school_name, status) => ({ school, school_name, status });
  assert.deepStrictEqual(schoolsWithLists([]), []);
  assert.deepStrictEqual(
    schoolsWithLists([list(2, 'B', 'published'), list(1, 'A', 'published'), list(2, 'B', 'published'), list(3, 'C', 'draft')]),
    [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
  );
});

test('the shop price range follows all loaded products until the shopper sets it', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'app/shop/page.tsx'), 'utf8');
  assert.ok(page.includes('minChoice ?? priceBounds.min') && page.includes('maxChoice ?? priceBounds.max'));
  assert.ok(!/setM(in|ax)Price\(Math\./.test(page));
});

const src = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('no unbacked bulk-order claims and no hard-coded school names', () => {
  assert.ok(!/10,000|48 ?hrs|300\+|home-bulk__stats/.test(src('app/page.tsx')));
  const find = src('app/find-my-school-list/page.tsx') + src('app/find-my-school-list/FindList.tsx');
  assert.ok(!/Makini|Kigwa|Crawford|const schools = \[/.test(find));
  assert.ok(find.includes('publicListApi.schools') && find.includes('href="/upload-my-list/"'));
});

test('booklist calls use /booklists/booklists/ and class pages link to all books', () => {
  const api = src('lib/api.ts');
  const block = api.slice(api.indexOf('export const booklistApi'), api.indexOf('export interface PaymentStatus'));
  const urls = block.match(/['`]\/booklists\/[^'`]*['`]/g);
  assert.equal(urls.length, 10);
  for (const u of urls) assert.match(u, /^.\/booklists\/(booklists|academic-years)\//);
  assert.ok(!src('app/school/booklists/page.tsx').includes("status: 'all'"));
  assert.ok(src('app/shop/page.tsx').includes('Browse all books'));
});
