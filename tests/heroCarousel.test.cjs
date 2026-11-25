const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const slides = JSON.parse(read('lib/heroSlides.json'));

test('every carousel picture has one slide, in numeric order, with alt text', () => {
  const files = fs.readdirSync(path.join(__dirname, '..', 'assets/image/carousel'))
    .map((f) => parseInt(f, 10)).sort((a, b) => a - b);
  assert.deepStrictEqual(slides.map((s) => s.n), files);
  for (const s of slides) assert.ok(s.alt.length > 30, `slide ${s.n} alt`);
});

test('home hero: one h1 and the main buttons sit on the carousel; the checklist card is gone', () => {
  const page = read('app/page.tsx');
  assert.strictEqual(page.match(/<h1/g).length, 1);
  const inside = page.slice(page.indexOf('<HeroCarousel>'), page.indexOf('</HeroCarousel>'));
  for (const text of ['<h1', 'Shop CBC Books', 'Browse by Grade', 'Find my school list']) assert.ok(inside.includes(text), text);
  assert.ok(!page.includes('Your school list, all in one place'));
});

test('only the first slide is eager and preloaded; the overlay keeps white text above 4.5:1', () => {
  const c = read('components/HeroCarousel.tsx');
  assert.match(c, /loading=\{i === 0 \? 'eager' : 'lazy'\}/);
  assert.match(c, /rel="preload"/);
  const alpha = Number(read('app/home.css').match(/hero-carousel__slides::after[^}]*rgba\(8, 16, 36, ([\d.]+)\)/)[1]);
  // Worst case: the overlay on a pure white picture.
  const lum = [8, 16, 36].map((v) => (v * alpha + 255 * (1 - alpha)) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const ratio = 1.05 / (0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2] + 0.05);
  assert.ok(ratio >= 4.5, `contrast ${ratio}`);
});
