const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function buildRubyDragonSvg(width = 1024, height = 1024) {
  const s = 340;
  const cx = width * 0.48;
  const cy = height * 0.7;

  // Colors from the concept art palette
  const rubyMain = '#C83256';
  const rubyDark = '#7B1736';
  const rubyDeep = '#4E0E22';
  const rubyLight = '#E64D6F';
  const rubyHighlight = '#F06D8C';
  const peachBelly = '#FDE2C8';
  const peachLine = '#E09A7A';
  const amberEye = '#FBB03B';
  const amberLight = '#FFD56B';
  const darkPupil = '#1C0B16';

  // 1. Long Whip Tail with dorsal spikes
  const tailPath = `M ${cx - s * 0.35} ${cy - s * 0.28} Q ${cx - s * 1.1} ${cy - s * 0.45} ${cx - s * 1.55} ${cy - s * 0.72} Q ${cx - s * 1.85} ${cy - s * 0.88} ${cx - s * 2.05} ${cy - s * 0.82}`;
  
  // Tail Spikes
  const tailSpikes = [
    `M ${cx - s * 0.65} ${cy - s * 0.42} L ${cx - s * 0.75} ${cy - s * 0.58} L ${cx - s * 0.55} ${cy - s * 0.46} Z`,
    `M ${cx - s * 0.95} ${cy - s * 0.52} L ${cx - s * 1.06} ${cy - s * 0.69} L ${cx - s * 0.86} ${cy - s * 0.57} Z`,
    `M ${cx - s * 1.25} ${cy - s * 0.65} L ${cx - s * 1.36} ${cy - s * 0.82} L ${cx - s * 1.17} ${cy - s * 0.7} Z`,
    `M ${cx - s * 1.55} ${cy - s * 0.76} L ${cx - s * 1.66} ${cy - s * 0.92} L ${cx - s * 1.48} ${cy - s * 0.8} Z`,
    `M ${cx - s * 1.8} ${cy - s * 0.85} L ${cx - s * 1.9} ${cy - s * 0.98} L ${cx - s * 1.74} ${cy - s * 0.88} Z`,
  ];

  // 2. Dorsal Back Spines (Neck to Thigh)
  const backSpines = [
    `M ${cx - s * 0.28} ${cy - s * 0.72} L ${cx - s * 0.42} ${cy - s * 0.96} L ${cx - s * 0.16} ${cy - s * 0.82} Z`,
    `M ${cx - s * 0.1} ${cy - s * 0.85} L ${cx - s * 0.22} ${cy - s * 1.08} L ${cx + s * 0.02} ${cy - s * 0.94} Z`,
    `M ${cx + s * 0.06} ${cy - s * 0.98} L ${cx - s * 0.04} ${cy - s * 1.22} L ${cx + s * 0.16} ${cy - s * 1.08} Z`,
    `M ${cx + s * 0.18} ${cy - s * 1.12} L ${cx + s * 0.1} ${cy - s * 1.35} L ${cx + s * 0.26} ${cy - s * 1.2} Z`,
  ];

  // 3. Multi-tier Head Crest / Horns (Backward Swept Spikes)
  const crest1 = `M ${cx + s * 0.12} ${cy - s * 1.45} Q ${cx - s * 0.25} ${cy - s * 2.05} ${cx - s * 0.55} ${cy - s * 2.22} Q ${cx - s * 0.15} ${cy - s * 1.75} ${cx + s * 0.28} ${cy - s * 1.5} Z`;
  const crest2 = `M ${cx + s * 0.05} ${cy - s * 1.36} Q ${cx - s * 0.45} ${cy - s * 1.82} ${cx - s * 0.75} ${cy - s * 1.92} Q ${cx - s * 0.32} ${cy - s * 1.55} ${cx + s * 0.16} ${cy - s * 1.38} Z`;
  const crest3 = `M ${cx - s * 0.02} ${cy - s * 1.25} Q ${cx - s * 0.55} ${cy - s * 1.55} ${cx - s * 0.85} ${cy - s * 1.6} Q ${cx - s * 0.42} ${cy - s * 1.35} ${cx + s * 0.08} ${cy - s * 1.24} Z`;
  const crest4 = `M ${cx + s * 0.02} ${cy - s * 1.12} Q ${cx - s * 0.45} ${cy - s * 1.32} ${cx - s * 0.72} ${cy - s * 1.32} Q ${cx - s * 0.35} ${cy - s * 1.15} ${cx + s * 0.12} ${cy - s * 1.1} Z`;

  // 4. Scalloped 3-Finger Wings (Front 3/4 Perspective as in Model Sheet)
  // Left / Back Wing
  const wingLeftBone = `M ${cx + s * 0.05} ${cy - s * 0.65} Q ${cx - s * 0.75} ${cy - s * 1.42} ${cx - s * 1.15} ${cy - s * 1.25}`;
  const wingLeft = `M ${cx + s * 0.05} ${cy - s * 0.65} Q ${cx - s * 0.75} ${cy - s * 1.42} ${cx - s * 1.15} ${cy - s * 1.25} Q ${cx - s * 1.02} ${cy - s * 0.88} ${cx - s * 0.85} ${cy - s * 0.72} Q ${cx - s * 0.68} ${cy - s * 0.58} ${cx - s * 0.52} ${cy - s * 0.45} Q ${cx - s * 0.22} ${cy - s * 0.52} ${cx + s * 0.05} ${cy - s * 0.65} Z`;
  
  // Right / Front Wing (Hero Wing with 3 Scallops)
  const wingRight = `M ${cx + s * 0.05} ${cy - s * 0.65} Q ${cx + s * 0.85} ${cy - s * 1.48} ${cx + s * 1.25} ${cy - s * 1.35} Q ${cx + s * 1.08} ${cy - s * 0.98} ${cx + s * 0.92} ${cy - s * 0.78} Q ${cx + s * 0.72} ${cy - s * 0.62} ${cx + s * 0.55} ${cy - s * 0.45} Q ${cx + s * 0.28} ${cy - s * 0.52} ${cx + s * 0.05} ${cy - s * 0.65} Z`;
  const wingRightRib1 = `M ${cx + s * 0.05} ${cy - s * 0.65} Q ${cx + s * 0.62} ${cy - s * 1.08} ${cx + s * 1.25} ${cy - s * 1.35}`;
  const wingRightRib2 = `M ${cx + s * 0.05} ${cy - s * 0.65} Q ${cx + s * 0.55} ${cy - s * 0.85} ${cx + s * 0.92} ${cy - s * 0.78}`;
  const wingRightRib3 = `M ${cx + s * 0.05} ${cy - s * 0.65} Q ${cx + s * 0.38} ${cy - s * 0.62} ${cx + s * 0.55} ${cy - s * 0.45}`;

  // 5. Neck and Head Curves
  const neckBack = `M ${cx - s * 0.05} ${cy - s * 0.75} Q ${cx + s * 0.08} ${cy - s * 1.15} ${cx + s * 0.22} ${cy - s * 1.42} L ${cx + s * 0.42} ${cy - s * 1.32} Q ${cx + s * 0.32} ${cy - s * 0.95} ${cx + s * 0.25} ${cy - s * 0.65} Z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(35,10,22,0.42)" />
      <stop offset="75%" stop-color="rgba(35,10,22,0.18)" />
      <stop offset="100%" stop-color="rgba(35,10,22,0)" />
    </radialGradient>
    <linearGradient id="rubyBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rubyHighlight}" />
      <stop offset="45%" stop-color="${rubyMain}" />
      <stop offset="100%" stop-color="${rubyDark}" />
    </linearGradient>
    <linearGradient id="rubyWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rubyLight}" />
      <stop offset="60%" stop-color="${rubyMain}" />
      <stop offset="100%" stop-color="${rubyDeep}" />
    </linearGradient>
    <linearGradient id="crestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rubyHighlight}" />
      <stop offset="50%" stop-color="${rubyDark}" />
      <stop offset="100%" stop-color="${rubyDeep}" />
    </linearGradient>
  </defs>

  <!-- Dynamic Ground Shadow -->
  <ellipse cx="${cx - s * 0.1}" cy="${cy + s * 0.05}" rx="${s * 0.95}" ry="${s * 0.22}" fill="url(#groundShadow)" />

  <!-- Long Whip Tail -->
  <path d="${tailPath}" fill="none" stroke="url(#rubyBodyGrad)" stroke-width="${Math.max(8, s * 0.22)}" stroke-linecap="round" />
  
  <!-- Tail Spikes -->
  ${tailSpikes.map(d => `<path d="${d}" fill="${rubyDeep}" />`).join('\n  ')}

  <!-- Back Left Wing (Behind Body) -->
  <path d="${wingLeft}" fill="url(#rubyWingGrad)" opacity="0.88" />
  <path d="${wingLeftBone}" fill="none" stroke="${rubyDeep}" stroke-width="${s * 0.035}" stroke-linecap="round" />

  <!-- Back Spines -->
  ${backSpines.map(d => `<path d="${d}" fill="${rubyDark}" />`).join('\n  ')}

  <!-- Hind Leg / Thigh -->
  <ellipse cx="${cx - s * 0.22}" cy="${cy - s * 0.32}" rx="${s * 0.35}" ry="${s * 0.36}" fill="url(#rubyBodyGrad)" />
  <ellipse cx="${cx - s * 0.3}" cy="${cy - s * 0.06}" rx="${s * 0.19}" ry="${s * 0.12}" fill="${rubyDark}" />
  <!-- Claws -->
  <circle cx="${cx - s * 0.45}" cy="${cy - s * 0.04}" r="${s * 0.025}" fill="${darkPupil}" />
  <circle cx="${cx - s * 0.38}" cy="${cy - s * 0.02}" r="${s * 0.025}" fill="${darkPupil}" />
  <circle cx="${cx - s * 0.3}" cy="${cy - s * 0.02}" r="${s * 0.025}" fill="${darkPupil}" />

  <!-- Main Body Core -->
  <ellipse cx="${cx}" cy="${cy - s * 0.42}" rx="${s * 0.52}" ry="${s * 0.45}" fill="url(#rubyBodyGrad)" />

  <!-- Graceful Neck -->
  <path d="${neckBack}" fill="url(#rubyBodyGrad)" />

  <!-- Continuous Segmented Cream/Peach Underbelly & Ventral Scutes -->
  <!-- Base Ventral Band from under chin to abdomen -->
  <path d="M ${cx + s * 0.22} ${cy - s * 1.22} Q ${cx + s * 0.14} ${cy - s * 0.95} ${cx + s * 0.08} ${cy - s * 0.7} Q ${cx - s * 0.02} ${cy - s * 0.45} ${cx + s * 0.02} ${cy - s * 0.15} Q ${cx + s * 0.16} ${cy - s * 0.12} ${cx + s * 0.3} ${cy - s * 0.25} Q ${cx + s * 0.42} ${cy - s * 0.48} ${cx + s * 0.38} ${cy - s * 0.7} Q ${cx + s * 0.35} ${cy - s * 0.95} ${cx + s * 0.42} ${cy - s * 1.18} Z" fill="${peachBelly}" />
  <!-- Center Highlight Strip -->
  <path d="M ${cx + s * 0.2} ${cy - s * 1.15} Q ${cx + s * 0.16} ${cy - s * 0.95} ${cx + s * 0.12} ${cy - s * 0.7} Q ${cx + s * 0.08} ${cy - s * 0.45} ${cx + s * 0.1} ${cy - s * 0.2} Q ${cx + s * 0.2} ${cy - s * 0.2} ${cx + s * 0.26} ${cy - s * 0.45} Q ${cx + s * 0.3} ${cy - s * 0.7} ${cx + s * 0.28} ${cy - s * 0.95} Q ${cx + s * 0.28} ${cy - s * 1.12} ${cx + s * 0.32} ${cy - s * 1.15} Z" fill="#FFF3E8" opacity="0.85" />
  
  <!-- Individual Curved Scute Segmentation Lines -->
  <!-- Throat Scutes -->
  <path d="M ${cx + s * 0.24} ${cy - s * 1.16} Q ${cx + s * 0.32} ${cy - s * 1.14} ${cx + s * 0.38} ${cy - s * 1.18}" fill="none" stroke="${peachLine}" stroke-width="${s * 0.016}" stroke-linecap="round" />
  <path d="M ${cx + s * 0.18} ${cy - s * 1.04} Q ${cx + s * 0.27} ${cy - s * 1.02} ${cx + s * 0.36} ${cy - s * 1.06}" fill="none" stroke="${peachLine}" stroke-width="${s * 0.016}" stroke-linecap="round" />
  <path d="M ${cx + s * 0.14} ${cy - s * 0.92} Q ${cx + s * 0.24} ${cy - s * 0.9} ${cx + s * 0.34} ${cy - s * 0.94}" fill="none" stroke="${peachLine}" stroke-width="${s * 0.016}" stroke-linecap="round" />
  <!-- Neck Scutes -->
  <path d="M ${cx + s * 0.1} ${cy - s * 0.79} Q ${cx + s * 0.22} ${cy - s * 0.76} ${cx + s * 0.34} ${cy - s * 0.81}" fill="none" stroke="${peachLine}" stroke-width="${s * 0.016}" stroke-linecap="round" />
  <!-- Chest Scutes -->
  <path d="M ${cx + s * 0.06} ${cy - s * 0.65} Q ${cx + s * 0.2} ${cy - s * 0.61} ${cx + s * 0.36} ${cy - s * 0.67}" fill="none" stroke="${peachLine}" stroke-width="${s * 0.02}" stroke-linecap="round" />
  <path d="M ${cx + s * 0.02} ${cy - s * 0.51} Q ${cx + s * 0.18} ${cy - s * 0.46} ${cx + s * 0.36} ${cy - s * 0.53}" fill="none" stroke="${peachLine}" stroke-width="${s * 0.02}" stroke-linecap="round" />
  <!-- Abdominal Scutes -->
  <path d="M ${cx - s * 0.01} ${cy - s * 0.37} Q ${cx + s * 0.16} ${cy - s * 0.32} ${cx + s * 0.33} ${cy - s * 0.39}" fill="none" stroke="${peachLine}" stroke-width="${s * 0.02}" stroke-linecap="round" />
  <path d="M ${cx + s * 0.02} ${cy - s * 0.24} Q ${cx + s * 0.14} ${cy - s * 0.2} ${cx + s * 0.28} ${cy - s * 0.26}" fill="none" stroke="${peachLine}" stroke-width="${s * 0.02}" stroke-linecap="round" />

  <!-- Front Leg / Paw -->
  <ellipse cx="${cx + s * 0.26}" cy="${cy - s * 0.22}" rx="${s * 0.16}" ry="${s * 0.24}" fill="url(#rubyBodyGrad)" />
  <ellipse cx="${cx + s * 0.3}" cy="${cy - s * 0.06}" rx="${s * 0.16}" ry="${s * 0.1}" fill="${rubyDark}" />
  <!-- Front Claws -->
  <circle cx="${cx + s * 0.22}" cy="${cy - s * 0.04}" r="${s * 0.022}" fill="${darkPupil}" />
  <circle cx="${cx + s * 0.3}" cy="${cy - s * 0.02}" r="${s * 0.022}" fill="${darkPupil}" />
  <circle cx="${cx + s * 0.38}" cy="${cy - s * 0.02}" r="${s * 0.022}" fill="${darkPupil}" />

  <!-- Multi-tier Head Crest / Horns (Sweeping Backwards) -->
  <path d="${crest4}" fill="url(#crestGrad)" />
  <path d="${crest3}" fill="url(#crestGrad)" />
  <path d="${crest2}" fill="url(#crestGrad)" />
  <path d="${crest1}" fill="url(#crestGrad)" />

  <!-- Dragon Head Core -->
  <ellipse cx="${cx + s * 0.24}" cy="${cy - s * 1.34}" rx="${s * 0.44}" ry="${s * 0.36}" fill="url(#rubyBodyGrad)" />

  <!-- Snout & Smile Contour -->
  <ellipse cx="${cx + s * 0.46}" cy="${cy - s * 1.22}" rx="${s * 0.28}" ry="${s * 0.2}" fill="${rubyHighlight}" />
  <path d="M ${cx + s * 0.32} ${cy - s * 1.12} Q ${cx + s * 0.48} ${cy - s * 1.1} ${cx + s * 0.62} ${cy - s * 1.16}" fill="none" stroke="${rubyDark}" stroke-width="${s * 0.016}" stroke-linecap="round" />
  <!-- Nostril -->
  <circle cx="${cx + s * 0.58}" cy="${cy - s * 1.24}" r="${s * 0.035}" fill="${darkPupil}" />

  <!-- Amber Gold Eye (Faithful to Model Sheet) -->
  <ellipse cx="${cx + s * 0.3}" cy="${cy - s * 1.38}" rx="${s * 0.16}" ry="${s * 0.19}" fill="${rubyDeep}" />
  <ellipse cx="${cx + s * 0.31}" cy="${cy - s * 1.38}" rx="${s * 0.14}" ry="${s * 0.17}" fill="${amberEye}" />
  <!-- Slit/Pupil -->
  <ellipse cx="${cx + s * 0.31}" cy="${cy - s * 1.38}" rx="${s * 0.075}" ry="${s * 0.15}" fill="${darkPupil}" />
  <!-- Specular Sparkles -->
  <circle cx="${cx + s * 0.27}" cy="${cy - s * 1.45}" r="${s * 0.055}" fill="#FFFFFF" />
  <circle cx="${cx + s * 0.36}" cy="${cy - s * 1.32}" r="${s * 0.025}" fill="${amberLight}" />

  <!-- Right / Hero Front Wing -->
  <path d="${wingRight}" fill="url(#rubyWingGrad)" opacity="0.94" />
  <path d="${wingRightRib1}" fill="none" stroke="${rubyDeep}" stroke-width="${s * 0.032}" stroke-linecap="round" />
  <path d="${wingRightRib2}" fill="none" stroke="${rubyDeep}" stroke-width="${s * 0.024}" stroke-linecap="round" />
  <path d="${wingRightRib3}" fill="none" stroke="${rubyDeep}" stroke-width="${s * 0.02}" stroke-linecap="round" />
</svg>`;
}

async function exportRubyDragon() {
  const desktopDir = '/Users/damonsu/Desktop';
  const assetsDir = path.join(__dirname, '..', 'assets', 'dragon');
  const artifactDir = '/Users/damonsu/.gemini/antigravity-ide/brain/a372c335-010d-47c0-97a4-d344c2392c51';

  const svgContent = buildRubyDragonSvg(1024, 1024);
  const pngBuffer = await sharp(Buffer.from(svgContent)).png({ quality: 100 }).toBuffer();

  // Save to desktop
  fs.writeFileSync(path.join(desktopDir, 'ruby-dragon.png'), pngBuffer);
  fs.writeFileSync(path.join(desktopDir, 'ruby-dragon.svg'), svgContent);

  // Save to assets
  fs.writeFileSync(path.join(assetsDir, 'ruby-dragon.png'), pngBuffer);
  fs.writeFileSync(path.join(assetsDir, 'ruby-dragon.svg'), svgContent);

  // Save to artifacts directory
  fs.writeFileSync(path.join(artifactDir, 'ruby-dragon.png'), pngBuffer);

  console.log('✅ Successfully exported high-resolution Ruby Dragon to Desktop & assets!');
}

exportRubyDragon().catch(console.error);
