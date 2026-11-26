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
