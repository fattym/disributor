const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const slides = JSON.parse(read('lib/heroSlides.json'));

test('every carousel picture has one slide, in numeric order, with alt text', () => {
  const files = fs.readdirSync(path.join(__dirname, '..', 'assets/image/carousel'))
    .filter((f) => /^\d+\.jpg$/.test(f)).map((f) => parseInt(f, 10)).sort((a, b) => a - b);
  assert.deepStrictEqual(slides.map((s) => s.n), files);
  // A corrected picture is used wherever one exists, and the original stays beside it.
  for (const s of slides) {
    const fixed = fs.existsSync(path.join(__dirname, '..', 'assets/image/carousel', `${s.n}-fixed.jpg`));
    assert.strictEqual(s.file, fixed ? `${s.n}-fixed.jpg` : undefined, `slide ${s.n} file`);
  }
  for (const s of slides) assert.ok(s.alt.length > 30, `slide ${s.n} alt`);
});

test('home hero: one h1 and the three main buttons; the checklist card is gone', () => {
  const page = read('app/page.tsx');
  assert.strictEqual(page.match(/<h1/g).length, 1);
  const inside = page.slice(page.indexOf('<HeroCarousel>'), page.indexOf('</HeroCarousel>'));
  for (const text of ['<h1', 'Shop CBC Books', 'Browse by Grade', 'Find my school list']) assert.ok(inside.includes(text), text);
  assert.ok(!page.includes('Your school list, all in one place'));
});

test('only the first slide is eager and preloaded', () => {
  const c = read('components/HeroCarousel.tsx');
  assert.match(c, /loading=\{i === 0 \? 'eager' : 'lazy'\}/);
  assert.match(c, /rel="preload"/);
});

test('pictures are shown whole: 16:9 sources and frame, no crop, no overlay, text outside the picture', async () => {
  const sharp = require('sharp');
  for (const s of slides) {
    const { width, height } = await sharp(path.join(__dirname, '..', 'assets/image/carousel', s.file ?? `${s.n}.jpg`)).metadata();
    assert.ok(Math.abs(width / height - 16 / 9) < 0.01, `slide ${s.n} is ${width}x${height}`);
  }
  const css = read('app/home.css');
  const rules = css.match(/\.hero-carousel__[^{}]*\{[^}]*\}/g).join('\n');
  assert.match(rules, /aspect-ratio: 16 \/ 9/);
  assert.match(rules, /object-fit: contain/);
  assert.doesNotMatch(rules, /object-fit: cover|::after/);
  const c = read('components/HeroCarousel.tsx');
  assert.ok(c.indexOf('hero-split__content') > c.indexOf('hero-carousel__controls'));
});
