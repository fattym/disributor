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

test('home hero: one h1, words before pictures, no stats or badge', () => {
  const hero = read('components/HomeHero.tsx');
  assert.strictEqual((hero + read('app/page.tsx')).match(/<h1/g).length, 1);
  assert.ok(hero.indexOf('<h1') < hero.indexOf('<HeroCarousel />'));
  for (const text of ['Have a printed list?', 'Select your school', 'Find my school list']) assert.ok(hero.includes(text), text);
  assert.ok(!/14,000|4\.9|250\+|KICD|same-day|badge/i.test(hero));
});

test('the active slide and its neighbours have a picture; only the first is preloaded', () => {
  const c = read('components/HeroCarousel.tsx');
  assert.match(c, /seen\.includes\(i\) \|\| i === index \|\| \(warm && isNear\(i\)\)/);
  assert.match(c, /loading="eager"/);
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
});
