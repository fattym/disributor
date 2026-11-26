// Home hero carousel: assets/image/carousel/ -> public/carousel/N-WIDTH.{avif,webp,jpg}
// Each slide in lib/heroSlides.json uses N.jpg, or its "file" (a corrected copy; originals stay untouched).
import { mkdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'assets/image/carousel');
const out = path.join(root, 'public/carousel');
const WIDTHS = [480, 960, 1600];
const FORMATS = [['avif', { quality: 55 }], ['webp', { quality: 75 }], ['jpg', { quality: 72, mozjpeg: true }]];
const LIMIT = 150 * 1024;

const slides = JSON.parse(await readFile(path.join(root, 'lib/heroSlides.json'), 'utf8'));
await mkdir(out, { recursive: true });
for (const { n, file = `${n}.jpg` } of slides) {
  for (const width of WIDTHS) {
    for (const [ext, options] of FORMATS) {
      const target = path.join(out, `${n}-${width}.${ext}`);
      await sharp(path.join(src, file)).resize(width).toFormat(ext === 'jpg' ? 'jpeg' : ext, options).toFile(target);
      const { size } = await stat(target);
      if (size > LIMIT) throw new Error(`${target} is ${size} bytes (limit ${LIMIT})`);
    }
  }
}
console.log(`carousel: ${slides.length} slides, ${slides.length * WIDTHS.length * FORMATS.length} images`);
