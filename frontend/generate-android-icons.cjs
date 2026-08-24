const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.resolve('public/cashbuddy-logo.svg');
const svgBuffer = fs.readFileSync(svgPath);

const resDir = path.resolve('android/app/src/main/res');

const densities = [
  { name: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { name: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { name: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { name: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { name: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
];

async function generate() {
  for (const d of densities) {
    const dir = path.join(resDir, d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Create SVG with solid dark #0f0f15 background for standard legacy launcher PNGs
    const darkBgSvg = `
      <svg width="${d.launcher}" height="${d.launcher}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" rx="100" fill="#0f0f15" />
        <g transform="translate(15, 10) scale(0.94)">
          <path d="M256,40 C190,40 160,78 160,122 C160,160 195,185 256,185 C317,185 352,160 352,122 C352,78 322,40 256,40 Z" fill="#d8b4fe" />
          <path d="M188,110 C210,88 302,88 324,110 C302,128 210,128 188,110 Z" fill="#f5f0eb" />
          <path d="M200,180 C222,194 290,194 312,180" stroke="#f5f0eb" stroke-width="16" stroke-linecap="round" fill="none" />
          <circle cx="335" cy="235" r="16" fill="#f5f0eb" />
          <path d="M298,185 Q330,210 335,235" stroke="#f5f0eb" stroke-width="11" fill="none" />
          <circle cx="365" cy="270" r="16" fill="#f5f0eb" />
          <path d="M304,185 Q350,225 365,270" stroke="#f5f0eb" stroke-width="11" fill="none" />
          <path d="M256,190 C138,190 60,275 60,392 C60,466 138,498 256,498 C374,498 452,466 452,392 C452,275 374,190 256,190 Z" fill="#c084fc" />
          <ellipse cx="225" cy="360" rx="72" ry="82" fill="#f5f0eb" />
          <path d="M185,310 H265 V324 H202 V336 H265 V350 H218 C238,350 252,360 252,374 C252,388 238,396 210,396 L254,428 H232 L192,396 H185 V382 H208 C224,382 236,377 236,374 C236,370 224,364 202,364 H185 V310 Z" fill="#5b21b6" />
        </g>
      </svg>
    `;

    // Foreground icon for adaptive Android icons (padded inside 108dp canvas)
    const foregroundSvg = `
      <svg width="${d.foreground}" height="${d.foreground}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(122.88, 116.12) scale(0.52)">
          <path d="M256,40 C190,40 160,78 160,122 C160,160 195,185 256,185 C317,185 352,160 352,122 C352,78 322,40 256,40 Z" fill="#d8b4fe" />
          <path d="M188,110 C210,88 302,88 324,110 C302,128 210,128 188,110 Z" fill="#f5f0eb" />
          <path d="M200,180 C222,194 290,194 312,180" stroke="#f5f0eb" stroke-width="16" stroke-linecap="round" fill="none" />
          <circle cx="335" cy="235" r="16" fill="#f5f0eb" />
          <path d="M298,185 Q330,210 335,235" stroke="#f5f0eb" stroke-width="11" fill="none" />
          <circle cx="365" cy="270" r="16" fill="#f5f0eb" />
          <path d="M304,185 Q350,225 365,270" stroke="#f5f0eb" stroke-width="11" fill="none" />
          <path d="M256,190 C138,190 60,275 60,392 C60,466 138,498 256,498 C374,498 452,466 452,392 C452,275 374,190 256,190 Z" fill="#c084fc" />
          <ellipse cx="225" cy="360" rx="72" ry="82" fill="#f5f0eb" />
          <path d="M185,310 H265 V324 H202 V336 H265 V350 H218 C238,350 252,360 252,374 C252,388 238,396 210,396 L254,428 H232 L192,396 H185 V382 H208 C224,382 236,377 236,374 C236,370 224,364 202,364 H185 V310 Z" fill="#5b21b6" />
        </g>
      </svg>
    `;

    // 1. Generate ic_launcher.png
    await sharp(Buffer.from(darkBgSvg))
      .resize(d.launcher, d.launcher)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // 2. Generate ic_launcher_round.png
    await sharp(Buffer.from(darkBgSvg))
      .resize(d.launcher, d.launcher)
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // 3. Generate ic_launcher_foreground.png
    await sharp(Buffer.from(foregroundSvg))
      .resize(d.foreground, d.foreground)
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`Generated PNG icons for ${d.name}`);
  }
  console.log('SUCCESS: All Android launcher PNG icons generated successfully!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
