const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.resolve('public/cashbuddy-logo.svg');
const svgBuffer = fs.readFileSync(svgPath);
const resDir = path.resolve('android/app/src/main/res');

// Money bag SVG centered on lavender #D4BFFF background
function createSplashSvg(width, height, iconSize) {
  const scale = iconSize / 512;
  const tx = (width - 512 * scale) / 2;
  const ty = (height - 512 * scale) / 2;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#6D28D9" />
      <g transform="translate(${tx}, ${ty}) scale(${scale})">
        <!-- Cinched Top Opening & Rim (#d8b4fe) -->
        <path d="M256,40 C190,40 160,78 160,122 C160,160 195,185 256,185 C317,185 352,160 352,122 C352,78 322,40 256,40 Z" fill="#d8b4fe" />
        <path d="M188,110 C210,88 302,88 324,110 C302,128 210,128 188,110 Z" fill="#f5f0eb" />
        <path d="M200,180 C222,194 290,194 312,180" stroke="#f5f0eb" stroke-width="16" stroke-linecap="round" fill="none" />
        <circle cx="335" cy="235" r="16" fill="#f5f0eb" />
        <path d="M298,185 Q330,210 335,235" stroke="#f5f0eb" stroke-width="11" fill="none" />
        <circle cx="365" cy="270" r="16" fill="#f5f0eb" />
        <path d="M304,185 Q350,225 365,270" stroke="#f5f0eb" stroke-width="11" fill="none" />
        <path d="M256,190 C138,190 60,275 60,392 C60,466 138,498 256,498 C374,498 452,466 452,392 C452,275 374,190 256,190 Z" fill="#c084fc" />
        <ellipse cx="225" cy="360" rx="72" ry="82" fill="#f5f0eb" />
        <text x="225" y="394" font-family="system-ui, -apple-system, sans-serif" font-size="105" font-weight="900" fill="#5b21b6" text-anchor="middle">₹</text>
      </g>
    </svg>
  `;
}

// Icon only (transparent background) for Android 12+ SplashScreen animated icon
function createSplashIconSvg(size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
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
        <text x="225" y="394" font-family="system-ui, -apple-system, sans-serif" font-size="105" font-weight="900" fill="#5b21b6" text-anchor="middle">₹</text>
      </g>
    </svg>
  `;
}

async function generate() {
  const drawableDir = path.join(resDir, 'drawable');
  if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });

  // 2. Overwrite drawable/splash.png (Default splash fallback)
  await sharp(Buffer.from(createSplashSvg(512, 512, 240)))
    .resize(512, 512)
    .png()
    .toFile(path.join(drawableDir, 'splash.png'));

  // 3. Overwrite portrait drawables (drawable-port-*)
  const portDensities = [
    { name: 'drawable-port-mdpi', w: 320, h: 480, icon: 160 },
    { name: 'drawable-port-hdpi', w: 480, h: 800, icon: 220 },
    { name: 'drawable-port-xhdpi', w: 720, h: 1280, icon: 320 },
    { name: 'drawable-port-xxhdpi', w: 960, h: 1600, icon: 400 },
    { name: 'drawable-port-xxxhdpi', w: 1280, h: 1920, icon: 480 },
  ];

  for (const d of portDensities) {
    const dir = path.join(resDir, d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await sharp(Buffer.from(createSplashSvg(d.w, d.h, d.icon)))
      .resize(d.w, d.h)
      .png()
      .toFile(path.join(dir, 'splash.png'));
  }

  // 4. Overwrite landscape drawables (drawable-land-*)
  const landDensities = [
    { name: 'drawable-land-mdpi', w: 480, h: 320, icon: 160 },
    { name: 'drawable-land-hdpi', w: 800, h: 480, icon: 220 },
    { name: 'drawable-land-xhdpi', w: 1280, h: 720, icon: 320 },
    { name: 'drawable-land-xxhdpi', w: 1600, h: 960, icon: 400 },
    { name: 'drawable-land-xxxhdpi', w: 1920, h: 1280, icon: 480 },
  ];

  for (const d of landDensities) {
    const dir = path.join(resDir, d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await sharp(Buffer.from(createSplashSvg(d.w, d.h, d.icon)))
      .resize(d.w, d.h)
      .png()
      .toFile(path.join(dir, 'splash.png'));
  }

  console.log('SUCCESS: All splash screen drawables generated cleanly!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
