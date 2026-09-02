import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E76F51"/>
      <stop offset="50%" stop-color="#E07A5F"/>
      <stop offset="100%" stop-color="#D45D3E"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF2D6"/>
      <stop offset="100%" stop-color="#F2CC8F"/>
    </linearGradient>
  </defs>

  <!-- Base Rounded Badge matching GyaanBot web app navbar -->
  <rect x="24" y="24" width="464" height="464" rx="104" fill="url(#coralGrad)" />
  <rect x="24" y="24" width="464" height="464" rx="104" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="8"/>

  <!-- Academic Graduation Cap Icon from GyaanBot Web App -->
  <g transform="translate(80, 80) scale(14.6)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <!-- Cap Diamond -->
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" fill="#FFFFFF" fill-opacity="0.15" />
    <!-- Tassel Side -->
    <path d="M22 10v6" stroke="#F2CC8F" stroke-width="2.4" />
    <circle cx="22" cy="16.5" r="1" fill="#F2CC8F" stroke="none" />
    <!-- Cap Base Arc -->
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" fill="#FFFFFF" fill-opacity="0.1" />
  </g>

  <!-- Sparkle Accent -->
  <circle cx="370" cy="140" r="14" fill="url(#goldGrad)" />
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="coralGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E76F51"/>
      <stop offset="50%" stop-color="#E07A5F"/>
      <stop offset="100%" stop-color="#D45D3E"/>
    </linearGradient>
    <linearGradient id="goldGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF2D6"/>
      <stop offset="100%" stop-color="#F2CC8F"/>
    </linearGradient>
  </defs>

  <!-- Full canvas background for maskable safe-zone -->
  <rect x="0" y="0" width="512" height="512" fill="url(#coralGradMask)" />

  <!-- Academic Graduation Cap Icon safely inside 80% circle (scale 11.5 centered) -->
  <g transform="translate(118, 118) scale(11.5)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <!-- Cap Diamond -->
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" fill="#FFFFFF" fill-opacity="0.18" />
    <!-- Tassel Side -->
    <path d="M22 10v6" stroke="#F2CC8F" stroke-width="2.4" />
    <circle cx="22" cy="16.5" r="1" fill="#F2CC8F" stroke="none" />
    <!-- Cap Base Arc -->
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" fill="#FFFFFF" fill-opacity="0.1" />
  </g>

  <!-- Sparkle Accent -->
  <circle cx="345" cy="165" r="11" fill="url(#goldGradMask)" />
</svg>`;

async function generateAllIcons() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating GyaanBot PWA icons...');

  // 1. icon-192.png
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 2. icon-512.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // 3. icon-maskable-192.png
  await sharp(Buffer.from(maskableSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));

  // 4. icon-maskable-512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));

  // 5. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 6. swami_ai_icon.jpg replacement with GyaanBot branding
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .jpeg({ quality: 95 })
    .toFile(path.join(publicDir, 'swami_ai_icon.jpg'));

  // 7. gyaanbot_icon.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'gyaanbot_icon.png'));

  console.log('Successfully generated all GyaanBot PWA icons!');
}

generateAllIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
