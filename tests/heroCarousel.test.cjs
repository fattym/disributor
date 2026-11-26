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

test('orange hero: small text and controls keep their contrast', () => {
  const lum = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const orange = read('app/globals.css').match(/--orange: (#[0-9a-f]{6})/i)[1];
  const hero = read('components/home-hero.css');
  assert.ok(hero.includes('background: var(--orange)') && !/#fdb813|#ffca45/.test(hero));
  assert.ok(ratio(hero.match(/--hero-ink: (#[0-9a-f]{6})/i)[1], orange) >= 4.5);
  assert.ok(ratio('#ffffff', orange) >= 3); // headline and control fills
  assert.ok(ratio(hero.match(/--hero-navy: (#[0-9a-f]{6})/i)[1], orange) >= 3);
});
