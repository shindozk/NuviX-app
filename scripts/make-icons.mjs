import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

/** Green cloud with the Xbox-style X, drawn as SVG so the art stays crisp. */
function artwork(scale, monochrome = false) {
  const size = 1024;
  const cloud = monochrome ? '#FFFFFF' : 'url(#cloud)';
  const x = monochrome ? '#FFFFFF' : 'url(#x)';
  const art = `
    <defs>
      <linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2BE31F"/>
        <stop offset="1" stop-color="#0A6B0A"/>
      </linearGradient>
      <linearGradient id="x" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FFFFFF"/>
        <stop offset="1" stop-color="#DFFFDA"/>
      </linearGradient>
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="16" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g transform="translate(${512 - 512 * scale} ${512 - 512 * scale}) scale(${scale})">
      <g ${monochrome ? '' : 'filter="url(#glow)"'}>
        <path fill="${cloud}" d="
          M 278 690
          a 150 150 0 0 1 6 -298
          a 196 196 0 0 1 358 -78
          a 168 168 0 0 1 130 160
          a 132 132 0 0 1 -24 216
          Z"/>
      </g>
      <g fill="${x}" transform="rotate(45 512 520)">
        <rect x="478" y="342" width="68" height="356" rx="34"/>
      </g>
      <g fill="${x}" transform="rotate(-45 512 520)">
        <rect x="478" y="342" width="68" height="356" rx="34"/>
      </g>
    </g>
  `;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${art}</svg>`;
}

const files = [
  { name: 'icon.png', size: 1024, background: '#070A08', scale: 0.82 },
  { name: 'android-icon-foreground.png', size: 1024, background: null, scale: 0.62 },
  { name: 'android-icon-background.png', size: 1024, background: '#070A08', scale: 0, solid: true },
  { name: 'android-icon-monochrome.png', size: 1024, background: null, scale: 0.62, monochrome: true },
  { name: 'splash-icon.png', size: 512, background: null, scale: 0.92 },
  { name: 'favicon.png', size: 48, background: '#070A08', scale: 0.82 },
];

for (const file of files) {
  const path = resolve(root, 'assets', file.name);
  await mkdir(dirname(path), { recursive: true });

  if (file.solid) {
    const solid = await sharp({
      create: {
        width: file.size,
        height: file.size,
        channels: 4,
        background: file.background,
      },
    })
      .png()
      .toBuffer();
    await writeFile(path, solid);
    console.log(`wrote assets/${file.name}`);
    continue;
  }

  const png = await sharp(Buffer.from(artwork(file.scale, file.monochrome)))
    .resize(file.size, file.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  if (file.background) {
    const composed = await sharp({
      create: {
        width: file.size,
        height: file.size,
        channels: 4,
        background: file.background,
      },
    })
      .composite([{ input: png }])
      .png()
      .toBuffer();
    await writeFile(path, composed);
  } else {
    await writeFile(path, png);
  }
  console.log(`wrote assets/${file.name}`);
}
