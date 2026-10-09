import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcImagePath = 'C:/Users/renbou/.gemini/antigravity/brain/fdf7e118-d728-4c2a-9b37-ea8666b0effc/.user_uploaded/media_1790174379718.png';

async function processLogo() {
  console.log('Optimizing app logo assets for minimal file size...');
  const image = sharp(srcImagePath);
  
  // Crop the 712x712 core artwork area (removing empty outer margin)
  const croppedBuffer = await image
    .extract({ left: 156, top: 156, width: 712, height: 712 })
    .toBuffer();

  // Create ultra-compact 256x256 PNG for web UI and SVG embedding
  const webLogoPngBuffer = await sharp(croppedBuffer)
    .resize(256, 256)
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toBuffer();

  console.log(`Optimized 256x256 logo PNG size: ${(webLogoPngBuffer.length / 1024).toFixed(1)} KB`);

  // Create lightweight SVG wrapper (under 20 KB)
  const base64Png = webLogoPngBuffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Png}" width="256" height="256" />
</svg>`;

  // 1. Web Public Assets
  const publicDir = path.resolve('public');
  fs.writeFileSync(path.join(publicDir, 'logo.png'), webLogoPngBuffer);
  fs.writeFileSync(path.join(publicDir, 'cashbuddy-logo.png'), webLogoPngBuffer);
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'cashbuddy-logo.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

  const icon192 = await sharp(croppedBuffer)
    .resize(192, 192)
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);

  const icon512 = await sharp(croppedBuffer)
    .resize(512, 512)
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

  const appleTouch = await sharp(croppedBuffer)
    .resize(180, 180)
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

  console.log('Web public assets optimized.');

  // 2. Android Mipmap Icons
  const resDir = path.resolve('android/app/src/main/res');
  const densities = [
    { name: 'mipmap-mdpi', launcher: 48, foreground: 108 },
    { name: 'mipmap-hdpi', launcher: 72, foreground: 162 },
    { name: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
    { name: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
    { name: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
  ];

  for (const d of densities) {
    const dir = path.join(resDir, d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const launcherPng = await sharp(croppedBuffer)
      .resize(d.launcher, d.launcher)
      .png({ quality: 80, compressionLevel: 9, palette: true })
      .toBuffer();

    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), launcherPng);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), launcherPng);

    const fgPng = await sharp(croppedBuffer)
      .resize(d.foreground, d.foreground)
      .png({ quality: 80, compressionLevel: 9, palette: true })
      .toBuffer();
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fgPng);
  }
  console.log('Android launcher mipmap icons optimized.');

  // 3. Android Splash Screens
  async function generateSplash(width, height, iconSize, targetPath) {
    const iconResized = await sharp(croppedBuffer)
      .resize(iconSize, iconSize)
      .png({ quality: 80, compressionLevel: 9, palette: true })
      .toBuffer();

    await sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 12, g: 13, b: 20, alpha: 1 } // #0c0d14 app dark theme
      }
    })
    .composite([{ input: iconResized, gravity: 'center' }])
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toFile(targetPath);
  }

  const drawableDir = path.join(resDir, 'drawable');
  if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });
  await generateSplash(512, 512, 280, path.join(drawableDir, 'splash.png'));

  // Portrait densities
  const portDensities = [
    { name: 'drawable-port-mdpi', w: 320, h: 480, icon: 180 },
    { name: 'drawable-port-hdpi', w: 480, h: 800, icon: 240 },
    { name: 'drawable-port-xhdpi', w: 720, h: 1280, icon: 320 },
    { name: 'drawable-port-xxhdpi', w: 960, h: 1600, icon: 400 },
    { name: 'drawable-port-xxxhdpi', w: 1280, h: 1920, icon: 480 },
  ];
  for (const d of portDensities) {
    const dir = path.join(resDir, d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await generateSplash(d.w, d.h, d.icon, path.join(dir, 'splash.png'));
  }

  // Landscape densities
  const landDensities = [
    { name: 'drawable-land-mdpi', w: 480, h: 320, icon: 180 },
    { name: 'drawable-land-hdpi', w: 800, h: 480, icon: 240 },
    { name: 'drawable-land-xhdpi', w: 1280, h: 720, icon: 320 },
    { name: 'drawable-land-xxhdpi', w: 1600, h: 960, icon: 400 },
    { name: 'drawable-land-xxxhdpi', w: 1920, h: 1280, icon: 480 },
  ];
  for (const d of landDensities) {
    const dir = path.join(resDir, d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await generateSplash(d.w, d.h, d.icon, path.join(dir, 'splash.png'));
  }

  console.log('Android splash screen drawables optimized.');
}

processLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
