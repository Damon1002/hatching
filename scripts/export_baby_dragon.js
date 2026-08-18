const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function shade(hex, k) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const n = parseInt(match[1], 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (k > 0) {
    r = Math.round(r + (255 - r) * k);
    g = Math.round(g + (255 - g) * k);
    b = Math.round(b + (255 - b) * k);
  } else {
    r = Math.round(r * (1 + k));
    g = Math.round(g * (1 + k));
    b = Math.round(b * (1 + k));
  }
  const toH = (v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

function buildDragonSvg(mainColor, scale = 360, width = 1024, height = 1024) {
  const s = scale;
  const cx = width / 2;
  const cy = height * 0.68;
  const darkColor = shade(mainColor, -0.28);
  const lightColor = shade(mainColor, 0.25);
  const bellyColor = '#FFF5DD';
  const hornColor = '#F5C252';
  const hornDark = '#D89E28';

  const tailPath = `M ${cx - s * 0.35} ${cy - s * 0.25} Q ${cx - s * 0.95} ${cy - s * 0.4} ${cx - s * 1.15} ${cy - s * 0.75}`;
  const tailSpade = `M ${cx - s * 1.15} ${cy - s * 0.75} L ${cx - s * 1.35} ${cy - s * 0.9} L ${cx - s * 1.2} ${cy - s * 1.1} L ${cx - s * 1.05} ${cy - s * 0.85} Z`;

  const hornLeft = `M ${cx - s * 0.15} ${cy - s * 1.15} Q ${cx - s * 0.35} ${cy - s * 1.55} ${cx - s * 0.52} ${cy - s * 1.62} Q ${cx - s * 0.22} ${cy - s * 1.35} ${cx - s * 0.02} ${cy - s * 1.12} Z`;
  const hornRight = `M ${cx + s * 0.05} ${cy - s * 1.15} Q ${cx + s * 0.25} ${cy - s * 1.55} ${cx + s * 0.42} ${cy - s * 1.62} Q ${cx + s * 0.15} ${cy - s * 1.35} ${cx + s * 0.18} ${cy - s * 1.12} Z`;

  const spine1 = `M ${cx - s * 0.25} ${cy - s * 0.75} L ${cx - s * 0.42} ${cy - s * 0.95} L ${cx - s * 0.12} ${cy - s * 0.85} Z`;
  const spine2 = `M ${cx - s * 0.05} ${cy - s * 0.92} L ${cx - s * 0.18} ${cy - s * 1.12} L ${cx + s * 0.08} ${cy - s * 1.0} Z`;

  const wingLeft = `M ${cx} ${cy - s * 0.55} Q ${cx - s * 0.8} ${cy - s * 1.25} ${cx - s * 1.15} ${cy - s * 1.05} Q ${cx - s * 0.85} ${cy - s * 0.65} ${cx - s * 0.6} ${cy - s * 0.35} Q ${cx - s * 0.3} ${cy - s * 0.45} ${cx} ${cy - s * 0.55} Z`;
  const wingRight = `M ${cx} ${cy - s * 0.55} Q ${cx + s * 0.8} ${cy - s * 1.25} ${cx + s * 1.15} ${cy - s * 1.05} Q ${cx + s * 0.85} ${cy - s * 0.65} ${cx + s * 0.6} ${cy - s * 0.35} Q ${cx + s * 0.3} ${cy - s * 0.45} ${cx} ${cy - s * 0.55} Z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(15,35,22,0.38)" />
      <stop offset="80%" stop-color="rgba(15,35,22,0.18)" />
      <stop offset="100%" stop-color="rgba(15,35,22,0)" />
    </radialGradient>
  </defs>

  <!-- Ground Shadow -->
  <ellipse cx="${cx}" cy="${cy + s * 0.04}" rx="${s * 0.65}" ry="${s * 0.18}" fill="url(#shadowGrad)" />

  <!-- Dragon Tail -->
  <path d="${tailPath}" fill="none" stroke="${mainColor}" stroke-width="${Math.max(6, s * 0.16)}" stroke-linecap="round" />
  <path d="${tailSpade}" fill="${darkColor}" />

  <!-- Back Spines -->
  <path d="${spine1}" fill="${darkColor}" />
  <path d="${spine2}" fill="${darkColor}" />

  <!-- Dragon Wings (Behind Body) -->
  <path d="${wingLeft}" fill="${darkColor}" opacity="0.92" />
  <path d="${wingRight}" fill="${lightColor}" opacity="0.92" />

  <!-- Dragon Body -->
  <ellipse cx="${cx}" cy="${cy - s * 0.355}" rx="${s * 0.5}" ry="${s * 0.425}" fill="${mainColor}" />

  <!-- Soft Belly Plate -->
  <ellipse cx="${cx + s * 0.15}" cy="${cy - s * 0.325}" rx="${s * 0.3}" ry="${s * 0.325}" fill="${bellyColor}" />

  <!-- Horns -->
  <path d="${hornLeft}" fill="${hornColor}" stroke="${hornDark}" stroke-width="${s * 0.015}" />
  <path d="${hornRight}" fill="${hornColor}" stroke="${hornDark}" stroke-width="${s * 0.015}" />

  <!-- Dragon Head -->
  <ellipse cx="${cx + s * 0.06}" cy="${cy - s * 0.94}" rx="${s * 0.44}" ry="${s * 0.36}" fill="${mainColor}" />

  <!-- Dragon Snout / Cheek -->
  <ellipse cx="${cx + s * 0.305}" cy="${cy - s * 0.84}" rx="${s * 0.225}" ry="${s * 0.18}" fill="${lightColor}" />

  <!-- Cute Nostril -->
  <circle cx="${cx + s * 0.38}" cy="${cy - s * 0.88}" r="${s * 0.035}" fill="${darkColor}" />

  <!-- Eyes (Anime Sparkle) -->
  <ellipse cx="${cx}" cy="${cy - s * 1.03}" rx="${s * 0.12}" ry="${s * 0.15}" fill="#2A101E" />
  <circle cx="${cx - s * 0.05}" cy="${cy - s * 1.12}" r="${s * 0.065}" fill="#FFFFFF" />
  <circle cx="${cx + s * 0.04}" cy="${cy - s * 0.98}" r="${s * 0.025}" fill="#FFFFFF" />

  <ellipse cx="${cx + s * 0.3}" cy="${cy - s * 1.03}" rx="${s * 0.12}" ry="${s * 0.15}" fill="#2A101E" />
  <circle cx="${cx + s * 0.25}" cy="${cy - s * 1.12}" r="${s * 0.065}" fill="#FFFFFF" />
  <circle cx="${cx + s * 0.34}" cy="${cy - s * 0.98}" r="${s * 0.025}" fill="#FFFFFF" />

  <!-- Claws / Feet -->
  <ellipse cx="${cx - s * 0.24}" cy="${cy - s * 0.06}" rx="${s * 0.16}" ry="${s * 0.1}" fill="${darkColor}" />
  <ellipse cx="${cx + s * 0.28}" cy="${cy - s * 0.06}" rx="${s * 0.16}" ry="${s * 0.1}" fill="${darkColor}" />
</svg>`;
}

async function exportAll() {
  const desktopDir = '/Users/damonsu/Desktop';
  const assetsDir = path.join(__dirname, '..', 'assets', 'dragon');
  const artifactDir = '/Users/damonsu/.gemini/antigravity-ide/brain/a372c335-010d-47c0-97a4-d344c2392c51';

  // 1. Current Grove Seed Dragon (Teal: #8bd3e4)
  const svgTeal = buildDragonSvg('#8bd3e4', 380, 1024, 1024);
  const pngTealBuffer = await sharp(Buffer.from(svgTeal)).png({ quality: 100 }).toBuffer();

  // 2. Red Dragon (matching dragon egg: #F26B50)
  const svgRed = buildDragonSvg('#F26B50', 380, 1024, 1024);
  const pngRedBuffer = await sharp(Buffer.from(svgRed)).png({ quality: 100 }).toBuffer();

  // Save directly to Desktop
  fs.writeFileSync(path.join(desktopDir, 'baby-dragon.png'), pngTealBuffer);
  fs.writeFileSync(path.join(desktopDir, 'baby-dragon.svg'), svgTeal);
  fs.writeFileSync(path.join(desktopDir, 'baby-dragon-red.png'), pngRedBuffer);

  // Save to project assets
  fs.writeFileSync(path.join(assetsDir, 'baby-dragon.png'), pngTealBuffer);
  fs.writeFileSync(path.join(assetsDir, 'baby-dragon.svg'), svgTeal);
  fs.writeFileSync(path.join(assetsDir, 'baby-dragon-red.png'), pngRedBuffer);

  // Save to Artifacts directory
  fs.writeFileSync(path.join(artifactDir, 'baby-dragon.png'), pngTealBuffer);
  fs.writeFileSync(path.join(artifactDir, 'baby-dragon-red.png'), pngRedBuffer);

  console.log('✅ Successfully exported high-resolution baby dragon images directly to /Users/damonsu/Desktop/');
}

exportAll().catch(console.error);
