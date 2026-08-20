import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../..');
const sourceLogoPath = path.join(rootDir, 'public/careerly-logo.png');

async function createCurvedWhiteFavicon() {
  console.log('[Favicon Generator] Reading source logo from:', sourceLogoPath);

  const size = 512;
  const padding = 56;
  const logoSize = size - (padding * 2); // 400x400
  const cornerRadius = 115; // smooth squircle curve

  // 1. Create the rounded white background rectangle mask
  const roundedRectSvg = Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#ffffff" />
    </svg>
  `);

  // 2. Resize source logo
  const resizedLogoBuffer = await sharp(sourceLogoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  // 3. Composite white curved background with resized logo
  const badgeBuffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    { input: roundedRectSvg, top: 0, left: 0 },
    { input: resizedLogoBuffer, top: padding, left: padding }
  ])
  .png()
  .toBuffer();

  // Save to public files
  fs.writeFileSync(path.join(rootDir, 'public/favicon.png'), badgeBuffer);
  fs.writeFileSync(path.join(rootDir, 'public/apple-touch-icon.png'), badgeBuffer);
  fs.writeFileSync(path.join(rootDir, 'public/careerly-badge.png'), badgeBuffer);

  // Also create 32x32 and 192x192 versions for browser tabs
  const icon32 = await sharp(badgeBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(rootDir, 'public/favicon-32x32.png'), icon32);

  const icon192 = await sharp(badgeBuffer).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(rootDir, 'public/favicon-192x192.png'), icon192);

  console.log('[Favicon Generator] ✓ Generated white curved background favicons successfully!');
}

createCurvedWhiteFavicon().catch(err => {
  console.error('[Favicon Generator Error]:', err);
});
