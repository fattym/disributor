// Home hero carousel: assets/image/carousel/N.jpg -> public/carousel/N-WIDTH.{avif,webp,jpg}
import { mkdir, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'assets/image/carousel');
const out = path.join(root, 'public/carousel');
const WIDTHS = [480, 960, 1600];
const FORMATS = [['avif', { quality: 55 }], ['webp', { quality: 75 }], ['jpg', { quality: 72, mozjpeg: true }]];
const LIMIT = 150 * 1024;

const files = (await readdir(src)).filter((f) => /^\d+\.jpe?g$/i.test(f)).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
await mkdir(out, { recursive: true });
for (const file of files) {
  for (const width of WIDTHS) {
    for (const [ext, options] of FORMATS) {
      const target = path.join(out, `${parseInt(file, 10)}-${width}.${ext}`);
      await sharp(path.join(src, file)).resize(width).toFormat(ext === 'jpg' ? 'jpeg' : ext, options).toFile(target);
      const { size } = await stat(target);
      if (size > LIMIT) throw new Error(`${target} is ${size} bytes (limit ${LIMIT})`);
    }
  }
}
console.log(`carousel: ${files.length} slides, ${files.length * WIDTHS.length * FORMATS.length} images`);
