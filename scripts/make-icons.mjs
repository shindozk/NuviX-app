import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

/**
 * NuviX logo source.
 *
 * assets/android-icon_logo.png is the master artwork (Xbox sphere + clouds on a
 * dark rounded square). Every launcher icon, splash image and favicon is
 * derived from it, so replacing that single file updates the whole app.
 */
const SOURCE = resolve(root, 'assets', 'android-icon_logo.png');

// The master artwork is a rounded square on a white page. Scaling it up and
// cropping the centre back to 1024 removes the white corners and leaves the
// dark background bleeding to every edge, which is what adaptive icons need.
const BLEED_SIZE = 1024;
const UPSCALE = 1.15;

async function bleedingArtwork() {
  const scaled = Math.round(BLEED_SIZE * UPSCALE);
  const resized = await sharp(SOURCE)
    .resize(scaled, scaled, { fit: 'cover' })
    .toBuffer();
  const inset = Math.round((scaled - BLEED_SIZE) / 2);
  return sharp(resized)
    .extract({ left: inset, top: inset, width: BLEED_SIZE, height: BLEED_SIZE })
    .toBuffer();
}

/**
 * Themed (monochrome) icon: bright artwork becomes white, dark background and
 * the dark X cut-out become transparent, so the system tint shows through.
 */
async function monochromeArtwork(artwork) {
  const { data, info } = await sharp(artwork)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(BLEED_SIZE * BLEED_SIZE * 4);

  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 4) {
    const luminance =
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const alpha = Math.max(0, Math.min(1, (luminance - 70) / 60));
    out[o] = 255;
    out[o + 1] = 255;
    out[o + 2] = 255;
    out[o + 3] = Math.round(alpha * 255);
  }

  return sharp(out, {
    raw: { width: BLEED_SIZE, height: BLEED_SIZE, channels: 4 },
  })
    .png()
    .toBuffer();
}

// Adaptive icons draw the foreground on a 108dp canvas but only the middle
// 72dp (66.7%) is guaranteed visible, so the artwork is rendered at 70% of the
// canvas and centred with transparent padding. Rendering it at 100% makes the
// launcher icon look zoomed in and the mask clips the corners.
const FOREGROUND_SCALE = 0.7;

/** Average colour of the artwork's four corners: the backdrop the shrunken
 *  artwork fades into, so no square edge is visible in the launcher icon. */
async function cornerColour(source) {
  const { data, info } = await sharp(source)
    .resize(8, 8, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const corners = [0, 7, 56, 63];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const index of corners) {
    r += data[index * channels];
    g += data[index * channels + 1];
    b += data[index * channels + 2];
  }
  return {
    r: Math.round(r / corners.length),
    g: Math.round(g / corners.length),
    b: Math.round(b / corners.length),
    alpha: 1,
  };
}

/**
 * Places the artwork centred on a canvas of `background` at `scale`, with the
 * artwork's own edges feathered into the background. The flat square edge and
 * the artwork's lighter border would otherwise show as a frame.
 */
async function paddedArtwork(source, scale, background) {
  const inner = Math.round(BLEED_SIZE * scale);
  const offset = Math.round((BLEED_SIZE - inner) / 2);
  const feather = Math.max(1, Math.round(inner * 0.12));
  const { data, info } = await sharp(source)
    .resize(inner, inner, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const smooth = (t) => {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  };

  for (let y = 0; y < inner; y += 1) {
    const fy = smooth(Math.min(y, inner - 1 - y) / feather);
    for (let x = 0; x < inner; x += 1) {
      const fx = smooth(Math.min(x, inner - 1 - x) / feather);
      const index = (y * inner + x) * info.channels + 3;
      data[index] = Math.round(data[index] * fx * fy);
    }
  }

  const feathered = await sharp(data, {
    raw: { width: inner, height: inner, channels: info.channels },
  })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: BLEED_SIZE,
      height: BLEED_SIZE,
      channels: 4,
      background,
    },
  })
    .composite([{ input: feathered, top: offset, left: offset }])
    .png()
    .toBuffer();
}

const artwork = await bleedingArtwork();
const backdrop = await cornerColour(artwork);
const foreground = await paddedArtwork(artwork, FOREGROUND_SCALE, backdrop);
const hex = (value) => value.toString(16).padStart(2, '0').toUpperCase();
console.log(
  `   backdrop: #${hex(backdrop.r)}${hex(backdrop.g)}${hex(backdrop.b)} — keep android.adaptiveIcon.backgroundColor in sync`
);
const monochrome = await monochromeArtwork(foreground);

const files = [
  { name: 'icon.png', size: 1024, source: artwork },
  { name: 'android-icon-foreground.png', size: 1024, source: foreground },
  { name: 'android-icon-monochrome.png', size: 1024, source: monochrome },
  { name: 'splash-icon.png', size: 512, source: artwork },
  { name: 'favicon.png', size: 48, source: artwork },
];

console.log('NuviX Icon Generator\n');
console.log('Generating icons from assets/android-icon_logo.png...\n');

for (const file of files) {
  const path = resolve(root, 'assets', file.name);
  await mkdir(dirname(path), { recursive: true });
  const png = await sharp(file.source)
    .resize(file.size, file.size, { fit: 'contain' })
    .png()
    .toBuffer();
  await writeFile(path, png);
  console.log(`✓ wrote assets/${file.name}`);
}

console.log('\n✅ All icons generated successfully!');
console.log('   You can now run: npm start');
