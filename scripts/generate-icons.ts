import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = join(root, 'public', 'favicon.svg');
const outDir = join(root, 'public', 'icons');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
] as const;

async function main() {
  await mkdir(outDir, { recursive: true });
  const svg = await readFile(svgPath);

  for (const { name, size } of sizes) {
    const png = await sharp(svg).resize(size, size).png().toBuffer();
    await writeFile(join(outDir, name), png);
  }

  console.log(`Generated ${sizes.length} PNG icons in public/icons/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
