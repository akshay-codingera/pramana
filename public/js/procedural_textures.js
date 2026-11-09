/**
 * PRAMANA — High-Fidelity Procedural PBR Texture Generator
 * Generates rich PBR texture suites (Diffuse, Tangent-Space Normal Map, Roughness Map)
 * using HTML5 2D Canvas and Sobel gradient filtering with zero external image dependencies.
 *
 * Supported Materials:
 * - Dholpur Red Sandstone (Ashlar blocks, chiseled bevels, sedimentary grain)
 * - Jodhpur / Delhi Buff Sandstone (Smooth masonry, subtle banding, fine stone grain)
 * - Carved Burma Teak Wood (Directional grain, annual growth rings, satin oil sheen)
 * - Cast Architectural Brass / Gold (Brushed surface, micro-scratches, metallic luster)
 * - Interlocking Flagstone Pavers (Chamfered slabs, mortar joints, aggregate)
 * - Manicured Turf Lawn (Multi-tone blades, organic surface variation)
 * - Municipal Asphalt Road (Aggregate tarmac, bitumen speckles)
 * - Official Indian National Flag (Tiranga: 3:2 ratio, 24-spoke Ashoka Chakra, micro-weave)
 */

import * as THREE from 'three';

/**
 * Utility: Generate a Tangent-Space Normal Map from a Grayscale Heightmap Canvas
 * Computes surface gradients using a 3x3 Sobel kernel and outputs standard tangent normal RGB.
 */
function createNormalMapFromHeight(heightCanvas, strength = 2.5) {
  const width = heightCanvas.width;
  const height = heightCanvas.height;
  const srcCtx = heightCanvas.getContext('2d');
  const srcData = srcCtx.getImageData(0, 0, width, height).data;

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const normalCtx = normalCanvas.getContext('2d');
  const normalImgData = normalCtx.createImageData(width, height);
  const dst = normalImgData.data;

  // Helper to sample height at (x, y) with wrapping
  function getHeight(x, y) {
    const wx = (x + width) % width;
    const wy = (y + height) % height;
    const idx = (wy * width + wx) * 4;
    // Standard luminance from R channel
    return srcData[idx] / 255.0;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 3x3 Sobel operator for dx and dy
      const tl = getHeight(x - 1, y - 1);
      const t  = getHeight(x,     y - 1);
      const tr = getHeight(x + 1, y - 1);
      const l  = getHeight(x - 1, y);
      const r  = getHeight(x + 1, y);
      const bl = getHeight(x - 1, y + 1);
      const b  = getHeight(x,     y + 1);
      const br = getHeight(x + 1, y + 1);

      const dx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
      const dy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

      // Normal vector in tangent space: (-dx * strength, -dy * strength, 1.0)
      const nx = -dx * strength;
      const ny = -dy * strength;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      const dstIdx = (y * width + x) * 4;
      // Map [-1, 1] -> [0, 255]
      dst[dstIdx]     = Math.floor(((nx / len) * 0.5 + 0.5) * 255);
      dst[dstIdx + 1] = Math.floor(((ny / len) * 0.5 + 0.5) * 255);
      dst[dstIdx + 2] = Math.floor(((nz / len) * 0.5 + 0.5) * 255);
      dst[dstIdx + 3] = 255;
    }
  }

  normalCtx.putImageData(normalImgData, 0, 0);
  const texture = new THREE.CanvasTexture(normalCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates High-Resolution Sandstone PBR Texture Suite (Diffuse, Normal, Roughness)
 */
export function createSandstonePBR(options = {}) {
  const {
    baseColor = '#8c331c',
    veinColor = '#5e1e0d',
    mortarColor = '#3a1308',
    blockW = 128,
    blockH = 64,
    width = 512,
    height = 512,
    hasBlocks = true,
    normalStrength = 2.8
  } = options;

  // 1. Diffuse Canvas
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  // Base stone wash
  dCtx.fillStyle = baseColor;
  dCtx.fillRect(0, 0, width, height);

  // 2. Heightmap Canvas for Normal Map computation
  const hCanvas = document.createElement('canvas');
  hCanvas.width = width;
  hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, width, height);

  // 3. Roughness Canvas
  const rCanvas = document.createElement('canvas');
  rCanvas.width = width;
  rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d');
  rCtx.fillStyle = '#d0d0d0'; // Base roughness ~0.82
  rCtx.fillRect(0, 0, width, height);

  // Sedimentary stratification layers (wavy natural horizontal bedding)
  for (let s = 0; s < 18; s++) {
    const y = (s / 18) * height + (Math.random() - 0.5) * 20;
    dCtx.strokeStyle = veinColor;
    dCtx.lineWidth = 4 + Math.random() * 8;
    dCtx.globalAlpha = 0.18 + Math.random() * 0.15;
    dCtx.beginPath();
    dCtx.moveTo(0, y);
    dCtx.bezierCurveTo(width * 0.33, y + Math.random() * 12, width * 0.66, y - Math.random() * 12, width, y);
    dCtx.stroke();

    // Height offset for stratification
    hCtx.strokeStyle = Math.random() > 0.5 ? '#909090' : '#707070';
    hCtx.lineWidth = dCtx.lineWidth;
    hCtx.globalAlpha = 0.15;
    hCtx.beginPath();
    hCtx.moveTo(0, y);
    hCtx.bezierCurveTo(width * 0.33, y + Math.random() * 12, width * 0.66, y - Math.random() * 12, width, y);
    hCtx.stroke();
  }

  // Fine mineral granular noise
  const dImgData = dCtx.getImageData(0, 0, width, height);
  const hImgData = hCtx.getImageData(0, 0, width, height);
  const rImgData = rCtx.getImageData(0, 0, width, height);

  for (let i = 0; i < width * height * 4; i += 4) {
    const noise = (Math.random() - 0.5) * 28;
    dImgData.data[i]     = Math.min(255, Math.max(0, dImgData.data[i] + noise));
    dImgData.data[i + 1] = Math.min(255, Math.max(0, dImgData.data[i + 1] + noise * 0.8));
    dImgData.data[i + 2] = Math.min(255, Math.max(0, dImgData.data[i + 2] + noise * 0.6));

    // Fine surface roughness variation
    hImgData.data[i] = Math.min(255, Math.max(0, hImgData.data[i] + noise * 0.7));
    rImgData.data[i] = Math.min(255, Math.max(0, rImgData.data[i] + noise * 0.5));
  }
  dCtx.putImageData(dImgData, 0, 0);
  hCtx.putImageData(hImgData, 0, 0);
  rCtx.putImageData(rImgData, 0, 0);

  // Chiseled Ashlar Masonry Blocks & Mortar Joints (if enabled)
  if (hasBlocks) {
    const rows = Math.ceil(height / blockH);
    for (let r = 0; r <= rows; r++) {
      const y = r * blockH;

      // Horizontal Mortar Seam
      dCtx.strokeStyle = mortarColor;
      dCtx.lineWidth = 2.5;
      dCtx.globalAlpha = 0.85;
      dCtx.beginPath();
      dCtx.moveTo(0, y);
      dCtx.lineTo(width, y);
      dCtx.stroke();

      // Deep groove in heightmap
      hCtx.strokeStyle = '#202020';
      hCtx.lineWidth = 3.5;
      hCtx.globalAlpha = 0.9;
      hCtx.beginPath();
      hCtx.moveTo(0, y);
      hCtx.lineTo(width, y);
      hCtx.stroke();

      // Rough mortar in roughness map
      rCtx.strokeStyle = '#f5f5f5'; // Mortar is very rough
      rCtx.lineWidth = 3.0;
      rCtx.globalAlpha = 0.9;
      rCtx.beginPath();
      rCtx.moveTo(0, y);
      rCtx.lineTo(width, y);
      rCtx.stroke();

      // Vertical Staggered Joint
      const offset = (r % 2) * (blockW / 2);
      for (let x = -offset; x <= width + blockW; x += blockW) {
        dCtx.strokeStyle = mortarColor;
        dCtx.lineWidth = 2.0;
        dCtx.globalAlpha = 0.8;
        dCtx.beginPath();
        dCtx.moveTo(x, y);
        dCtx.lineTo(x, y + blockH);
        dCtx.stroke();

        hCtx.strokeStyle = '#202020';
        hCtx.lineWidth = 3.0;
        hCtx.globalAlpha = 0.85;
        hCtx.beginPath();
        hCtx.moveTo(x, y);
        hCtx.lineTo(x, y + blockH);
        hCtx.stroke();

        rCtx.strokeStyle = '#f5f5f5';
        rCtx.lineWidth = 2.5;
        rCtx.globalAlpha = 0.85;
        rCtx.beginPath();
        rCtx.moveTo(x, y);
        rCtx.lineTo(x, y + blockH);
        rCtx.stroke();

        // Chiseled Block Edge Bevel (inner shadow & highlight)
        hCtx.strokeStyle = '#a0a0a0'; // Top/left bevel highlight
        hCtx.lineWidth = 1.5;
        hCtx.globalAlpha = 0.4;
        hCtx.strokeRect(x + 2, y + 2, blockW - 4, blockH - 4);
      }
    }
  }

  // Create Three.js Textures
  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, normalStrength);

  const roughnessTex = new THREE.CanvasTexture(rCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.RepeatWrapping;

  return { map: diffuseTex, normalMap: normalTex, roughnessMap: roughnessTex };
}

/**
 * Creates Carved Burma Teak Wood PBR Suite (Diffuse, Normal, Roughness)
 */
export function createWoodPBR(baseColor = '#3a1f10', grainColor = '#1f0d04', width = 512, height = 512) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width;
  hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, width, height);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = width;
  rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d');
  rCtx.fillStyle = '#909090'; // Satin sheen ~0.55
  rCtx.fillRect(0, 0, width, height);

  // Base wood stain
  dCtx.fillStyle = baseColor;
  dCtx.fillRect(0, 0, width, height);

  // Longitudinal wood grain lines
  for (let i = 0; i < 450; i++) {
    const y = Math.random() * height;
    dCtx.strokeStyle = grainColor;
    dCtx.lineWidth = 0.8 + Math.random() * 1.6;
    dCtx.globalAlpha = 0.25;

    hCtx.strokeStyle = Math.random() > 0.5 ? '#606060' : '#a0a0a0';
    hCtx.lineWidth = dCtx.lineWidth;
    hCtx.globalAlpha = 0.3;

    dCtx.beginPath();
    dCtx.moveTo(0, y);
    const cp1x = width * 0.33;
    const cp1y = y + (Math.random() - 0.5) * 12;
    const cp2x = width * 0.66;
    const cp2y = y + (Math.random() - 0.5) * 12;
    dCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, width, y + (Math.random() - 0.5) * 8);
    dCtx.stroke();

    hCtx.beginPath();
    hCtx.moveTo(0, y);
    hCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, width, y + (Math.random() - 0.5) * 8);
    hCtx.stroke();
  }

  // Wood Pores
  dCtx.fillStyle = grainColor;
  dCtx.globalAlpha = 0.2;
  hCtx.fillStyle = '#404040';
  hCtx.globalAlpha = 0.4;
  for (let p = 0; p < 1200; p++) {
    const px = Math.random() * width;
    const py = Math.random() * height;
    const pw = 2 + Math.random() * 4;
    dCtx.fillRect(px, py, pw, 1.2);
    hCtx.fillRect(px, py, pw, 1.2);
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 2.0);

  const roughnessTex = new THREE.CanvasTexture(rCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.RepeatWrapping;

  return { map: diffuseTex, normalMap: normalTex, roughnessMap: roughnessTex };
}

/**
 * Creates Cast Architectural Brass / Gold PBR Suite
 */
export function createBrassPBR(width = 256, height = 256) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  // Base golden brass
  dCtx.fillStyle = '#d4af37';
  dCtx.fillRect(0, 0, width, height);

  // Brushed metal micro-scratches
  dCtx.strokeStyle = '#b89225';
  dCtx.lineWidth = 1;
  dCtx.globalAlpha = 0.2;
  for (let i = 0; i < 200; i++) {
    const y = Math.random() * height;
    dCtx.beginPath();
    dCtx.moveTo(0, y);
    dCtx.lineTo(width, y + (Math.random() - 0.5) * 4);
    dCtx.stroke();
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  return { map: diffuseTex };
}

/**
 * Creates Interlocking Flagstone Pavers PBR Suite (Diffuse, Normal, Roughness)
 */
export function createPaverPBR(width = 512, height = 512) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width;
  hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, width, height);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = width;
  rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d');
  rCtx.fillStyle = '#b8b8b8'; // ~0.72 roughness
  rCtx.fillRect(0, 0, width, height);

  dCtx.fillStyle = '#9e968a';
  dCtx.fillRect(0, 0, width, height);

  const paverW = 64;
  const paverH = 32;

  for (let y = 0; y < height; y += paverH) {
    const row = Math.floor(y / paverH);
    const offsetX = (row % 2) * (paverW / 2);

    for (let x = -offsetX; x < width + paverW; x += paverW) {
      // Natural slab tonal variation
      const shade = 145 + Math.floor((Math.random() - 0.5) * 32);
      dCtx.fillStyle = `rgb(${shade + 12}, ${shade + 6}, ${shade - 6})`;
      dCtx.fillRect(x + 1.5, y + 1.5, paverW - 3, paverH - 3);

      // Chamfered stone bevel in heightmap
      hCtx.fillStyle = '#909090';
      hCtx.fillRect(x + 2, y + 2, paverW - 4, paverH - 4);

      // Deep mortar groove
      hCtx.strokeStyle = '#181818';
      hCtx.lineWidth = 3.0;
      hCtx.strokeRect(x, y, paverW, paverH);

      dCtx.strokeStyle = '#4e483e';
      dCtx.lineWidth = 2.0;
      dCtx.strokeRect(x, y, paverW, paverH);
    }
  }

  // Mineral speckled aggregate
  for (let i = 0; i < 4000; i++) {
    const px = Math.random() * width;
    const py = Math.random() * height;
    dCtx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.12)';
    dCtx.fillRect(px, py, 1.4, 1.4);
    hCtx.fillStyle = Math.random() > 0.5 ? '#606060' : '#a0a0a0';
    hCtx.fillRect(px, py, 1.2, 1.2);
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 3.2);

  const roughnessTex = new THREE.CanvasTexture(rCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.RepeatWrapping;

  return { map: diffuseTex, normalMap: normalTex, roughnessMap: roughnessTex };
}

/**
 * Creates Manicured Lawn Grass PBR Suite
 */
export function createGrassPBR(width = 512, height = 512) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width;
  hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, width, height);

  // Deep rich green turf base
  dCtx.fillStyle = '#224a1e';
  dCtx.fillRect(0, 0, width, height);

  // Multi-tone blade distribution
  const tones = ['#2c5a24', '#1e3d17', '#3a6e30', '#48853e', '#173113'];
  for (let i = 0; i < 20000; i++) {
    dCtx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
    dCtx.globalAlpha = 0.7;
    const x = Math.random() * width;
    const y = Math.random() * height;
    dCtx.fillRect(x, y, 1.5, 3.5);

    hCtx.fillStyle = Math.random() > 0.5 ? '#a0a0a0' : '#606060';
    hCtx.globalAlpha = 0.4;
    hCtx.fillRect(x, y, 1.5, 3.5);
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 2.2);

  return { map: diffuseTex, normalMap: normalTex };
}

/**
 * Creates Municipal Asphalt Driveway PBR Suite
 */
export function createAsphaltPBR(width = 512, height = 512) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width;
  hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, width, height);

  dCtx.fillStyle = '#262930';
  dCtx.fillRect(0, 0, width, height);

  // Aggregate bitumen stones & speckles
  for (let i = 0; i < 8000; i++) {
    const val = Math.random() > 0.5 ? 90 : 35;
    dCtx.fillStyle = `rgba(${val}, ${val}, ${val}, 0.3)`;
    const x = Math.random() * width;
    const y = Math.random() * height;
    dCtx.fillRect(x, y, 1.2, 1.2);

    hCtx.fillStyle = val > 60 ? '#b0b0b0' : '#505050';
    hCtx.fillRect(x, y, 1.2, 1.2);
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 2.6);

  return { map: diffuseTex, normalMap: normalTex };
}

/**
 * Official Indian National Flag (Tiranga) High-Resolution Texture & Weave Normal Map
 * Strictly complies with the Flag Code of India:
 * - 3:2 Proportions
 * - Saffron (#ff9933), White (#ffffff), Green (#128807)
 * - Navy Blue (#000088) Ashoka Chakra with EXACTLY 24 equally spaced spokes (15° apart)
 * - Central hub with inner core, and 24 outer gopura dots along the inner rim
 * - Micro-weave cloth normal map for authentic khadi fabric texture
 */
export function createIndianFlagPBR(width = 1024, height = 683) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const ctx = diffCanvas.getContext('2d');

  const bandH = height / 3;

  // 1. India Saffron (Kesari)
  ctx.fillStyle = '#ff9933';
  ctx.fillRect(0, 0, width, bandH);

  // 2. Pure White Band
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, bandH, width, bandH);

  // 3. India Green
  ctx.fillStyle = '#128807';
  ctx.fillRect(0, bandH * 2, width, bandH);

  // 4. Navy Blue Ashoka Chakra
  const cx = width / 2;
  const cy = height / 2;
  const chakraRadius = bandH * 0.38; // ~76% of white band height

  ctx.strokeStyle = '#000088';
  ctx.fillStyle = '#000088';

  // Outer Ring
  ctx.lineWidth = Math.max(3.5, chakraRadius * 0.075);
  ctx.beginPath();
  ctx.arc(cx, cy, chakraRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Central Hub
  const hubRadius = chakraRadius * 0.17;
  ctx.beginPath();
  ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
  ctx.fill();

  // White inner core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, hubRadius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // EXACTLY 24 Equally Spaced Spokes (15 degrees each)
  ctx.strokeStyle = '#000088';
  ctx.lineWidth = Math.max(2.2, chakraRadius * 0.038);
  for (let i = 0; i < 24; i++) {
    const angle = (i * 360 / 24) * (Math.PI / 180);
    const startX = cx + Math.cos(angle) * (hubRadius * 0.9);
    const startY = cy + Math.sin(angle) * (hubRadius * 0.9);
    const endX = cx + Math.cos(angle) * (chakraRadius * 0.93);
    const endY = cy + Math.sin(angle) * (chakraRadius * 0.93);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 24 decorative gopura dots along outer rim between spokes
    const dotAngle = angle + (15 / 2) * (Math.PI / 180);
    const dotX = cx + Math.cos(dotAngle) * (chakraRadius * 0.96);
    const dotY = cy + Math.sin(dotAngle) * (chakraRadius * 0.96);
    ctx.fillStyle = '#000088';
    ctx.beginPath();
    ctx.arc(dotX, dotY, chakraRadius * 0.026, 0, Math.PI * 2);
    ctx.fill();
  }

  // Micro-weave cloth heightmap
  const hCanvas = document.createElement('canvas');
  hCanvas.width = width;
  hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, width, height);

  hCtx.fillStyle = '#a0a0a0';
  for (let w = 0; w < width; w += 4) {
    hCtx.fillRect(w, 0, 1.5, height);
  }
  for (let h = 0; h < height; h += 4) {
    hCtx.fillRect(0, h, width, 1.5);
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 1.5);

  return { map: diffuseTex, normalMap: normalTex };
}

/**
 * Creates Realistic Organic Tree Bark PBR Suite (Neem / Peepal)
 */
export function createBarkPBR(width = 512, height = 512) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width;
  hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, width, height);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = width;
  rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d');
  rCtx.fillStyle = '#d8d8d8'; // Rough bark ~0.88
  rCtx.fillRect(0, 0, width, height);

  // Dark weathered bark base
  dCtx.fillStyle = '#3e3229';
  dCtx.fillRect(0, 0, width, height);

  // Longitudinal fibrous furrowed ridges
  for (let f = 0; f < 350; f++) {
    const x = Math.random() * width;
    dCtx.strokeStyle = Math.random() > 0.4 ? '#281f18' : '#5a493c';
    dCtx.lineWidth = 1.5 + Math.random() * 4.0;
    dCtx.globalAlpha = 0.35;

    hCtx.strokeStyle = Math.random() > 0.5 ? '#b8b8b8' : '#404040';
    hCtx.lineWidth = dCtx.lineWidth;
    hCtx.globalAlpha = 0.45;

    dCtx.beginPath();
    dCtx.moveTo(x, 0);
    const cp1x = x + (Math.random() - 0.5) * 16;
    const cp1y = height * 0.33;
    const cp2x = x + (Math.random() - 0.5) * 16;
    const cp2y = height * 0.66;
    dCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x + (Math.random() - 0.5) * 12, height);
    dCtx.stroke();

    hCtx.beginPath();
    hCtx.moveTo(x, 0);
    hCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x + (Math.random() - 0.5) * 12, height);
    hCtx.stroke();
  }

  // Lichen & moss micro-speckles
  for (let m = 0; m < 3000; m++) {
    const mx = Math.random() * width;
    const my = Math.random() * height;
    dCtx.fillStyle = Math.random() > 0.7 ? '#425433' : '#221914';
    dCtx.globalAlpha = 0.25;
    dCtx.fillRect(mx, my, 2.0, 2.0);
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 3.2);

  const roughnessTex = new THREE.CanvasTexture(rCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.RepeatWrapping;

  return { map: diffuseTex, normalMap: normalTex, roughnessMap: roughnessTex };
}

/**
 * Creates Royal Palm Trunk Ringed Texture PBR Suite
 */
export function createPalmBarkPBR(width = 256, height = 512) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width;
  hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, width, height);

  // Natural weathered grey-buff palm trunk base
  dCtx.fillStyle = '#786e63';
  dCtx.fillRect(0, 0, width, height);

  // Horizontal ringed leaf-scar bands
  const ringSpacing = 28;
  for (let y = 0; y < height; y += ringSpacing) {
    // Deep groove scar
    dCtx.strokeStyle = '#423c34';
    dCtx.lineWidth = 3.0;
    dCtx.globalAlpha = 0.8;
    dCtx.beginPath();
    dCtx.moveTo(0, y);
    dCtx.lineTo(width, y);
    dCtx.stroke();

    hCtx.strokeStyle = '#282828';
    hCtx.lineWidth = 4.0;
    hCtx.beginPath();
    hCtx.moveTo(0, y);
    hCtx.lineTo(width, y);
    hCtx.stroke();

    // Convex band swelling between rings
    hCtx.fillStyle = '#a8a8a8';
    hCtx.fillRect(0, y + 4, width, ringSpacing - 8);

    // Subtle tonal variation
    dCtx.fillStyle = (y / ringSpacing) % 2 === 0 ? '#6e6459' : '#82786d';
    dCtx.globalAlpha = 0.4;
    dCtx.fillRect(0, y + 2, width, ringSpacing - 4);
  }

  // Vertical fiber pores
  for (let p = 0; p < 1500; p++) {
    dCtx.fillStyle = 'rgba(40, 35, 30, 0.2)';
    dCtx.fillRect(Math.random() * width, Math.random() * height, 1.2, 4.0);
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 2.8);

  return { map: diffuseTex, normalMap: normalTex };
}

/**
 * Creates Authentic High-Fidelity Evergreen Pine Needle Foliage Spray Alpha Texture
 */
/**
 * Creates Authentic High-Fidelity Evergreen Pine Needle Foliage Spray Alpha Texture
 * Generates a dense, plush evergreen needle bough pad with rich multi-toned needles,
 * deep shaded interior foliage mass, and soft feathery outer needle tufts.
 */
export function createPineNeedleTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Fully transparent background
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const baseY = height * 0.95;

  // 1. Spreading woody branchlet framework
  const branchConfigs = [
    { startX: cx, startY: baseY, endX: cx, endY: height * 0.18, width: 8.0 },
    { startX: cx, startY: height * 0.75, endX: cx - width * 0.32, endY: height * 0.38, width: 5.5 },
    { startX: cx, startY: height * 0.75, endX: cx + width * 0.32, endY: height * 0.38, width: 5.5 },
    { startX: cx, startY: height * 0.52, endX: cx - width * 0.26, endY: height * 0.22, width: 4.0 },
    { startX: cx, startY: height * 0.52, endX: cx + width * 0.26, endY: height * 0.22, width: 4.0 },
    { startX: cx, startY: height * 0.34, endX: cx - width * 0.16, endY: height * 0.12, width: 3.0 },
    { startX: cx, startY: height * 0.34, endX: cx + width * 0.16, endY: height * 0.12, width: 3.0 }
  ];

  // 2. Underlying dense soft evergreen bough mass (eliminates thin wireframe / bare look)
  branchConfigs.forEach(b => {
    const steps = 32;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = b.startX + (b.endX - b.startX) * t + (Math.random() - 0.5) * 8;
      const y = b.startY + (b.endY - b.startY) * t + (Math.random() - 0.5) * 8;
      const padRadius = 32 * (1.15 - t * 0.45);

      const grad = ctx.createRadialGradient(x, y, 4, x, y, padRadius);
      grad.addColorStop(0, '#0d2614');
      grad.addColorStop(0.45, '#15391e');
      grad.addColorStop(0.80, '#1c4827');
      grad.addColorStop(1, 'rgba(28, 72, 39, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, padRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 3. Central woody branchlet strokes
  branchConfigs.forEach(b => {
    ctx.strokeStyle = '#321c10';
    ctx.lineWidth = b.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.startX, b.startY);
    ctx.lineTo(b.endX, b.endY);
    ctx.stroke();

    ctx.strokeStyle = '#482a17';
    ctx.lineWidth = b.width * 0.45;
    ctx.beginPath();
    ctx.moveTo(b.startX - 1, b.startY);
    ctx.lineTo(b.endX - 1, b.endY);
    ctx.stroke();
  });

  // Rich evergreen pine needle color tones (authentic institutional forest spruce & deodar green)
  const needleTones = {
    shadow: ['#07190c', '#0b2413', '#10301a', '#163c21'],
    mid: ['#1b4626', '#225630', '#2a673a', '#347844', '#3e8a50'],
    highlight: ['#4a995d', '#58aa6c', '#68b87a', '#7ac48b']
  };

  // Helper to paint curved needle fascicles radiating outward
  function paintNeedleBundle(ox, oy, baseAngle, spread, length, toneArray, count, minW, maxW) {
    for (let n = 0; n < count; n++) {
      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const nLen = length * (0.8 + Math.random() * 0.4);
      const curvature = (Math.random() - 0.5) * 10;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(angle);

      ctx.strokeStyle = toneArray[Math.floor(Math.random() * toneArray.length)];
      ctx.lineWidth = minW + Math.random() * (maxW - minW);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(curvature, -nLen * 0.5, curvature * 1.4, -nLen);
      ctx.stroke();

      ctx.restore();
    }
  }

  // 4. Layer 1: Dense interior shadow needles (creates deep internal volume)
  branchConfigs.forEach(b => {
    const steps = 36;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = b.startX + (b.endX - b.startX) * t + (Math.random() - 0.5) * 16;
      const y = b.startY + (b.endY - b.startY) * t + (Math.random() - 0.5) * 16;
      const baseAngle = Math.atan2(b.endY - b.startY, b.endX - b.startX) + Math.PI / 2;

      paintNeedleBundle(x, y, baseAngle - Math.PI / 2, 1.4, 46, needleTones.shadow, 8, 2.2, 3.4);
    }
  });

  // 5. Layer 2: Main body evergreen pine needles (vibrant foliage mass)
  branchConfigs.forEach(b => {
    const steps = 42;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = b.startX + (b.endX - b.startX) * t + (Math.random() - 0.5) * 14;
      const y = b.startY + (b.endY - b.startY) * t + (Math.random() - 0.5) * 14;
      const baseAngle = Math.atan2(b.endY - b.startY, b.endX - b.startX) + Math.PI / 2;

      paintNeedleBundle(x, y, baseAngle - Math.PI / 2 - 0.45, 1.1, 40, needleTones.mid, 7, 1.8, 2.8);
      paintNeedleBundle(x, y, baseAngle - Math.PI / 2 + 0.45, 1.1, 40, needleTones.mid, 7, 1.8, 2.8);
    }
  });

  // 6. Layer 3: Sunlit needle tip highlights (feathery, soft outer plumage)
  branchConfigs.forEach(b => {
    const steps = 30;
    for (let s = 4; s <= steps; s++) {
      const t = s / steps;
      const x = b.startX + (b.endX - b.startX) * t + (Math.random() - 0.5) * 10;
      const y = b.startY + (b.endY - b.startY) * t + (Math.random() - 0.5) * 10;
      const baseAngle = Math.atan2(b.endY - b.startY, b.endX - b.startX) + Math.PI / 2;

      paintNeedleBundle(x, y, baseAngle - Math.PI / 2, 1.5, 36, needleTones.highlight, 6, 1.4, 2.2);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates Rich Furrowed Reddish-Brown Pine Bark PBR Suite
 */
export function createPineBarkPBR(width = 256, height = 512) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width;
  hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');

  const rCanvas = document.createElement('canvas');
  rCanvas.width = width;
  rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d');

  // Base reddish-brown pine tone
  dCtx.fillStyle = '#422416';
  dCtx.fillRect(0, 0, width, height);

  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, width, height);

  rCtx.fillStyle = '#e8e8e8';
  rCtx.fillRect(0, 0, width, height);

  // Vertical furrowed scales and bark plates
  const numFurrows = 24;
  for (let f = 0; f < numFurrows; f++) {
    const x = (f / numFurrows) * width + (Math.random() - 0.5) * 6;
    const furrowWidth = 4.0 + Math.random() * 5.0;

    // Deep shadowed fissure
    dCtx.strokeStyle = '#180d09';
    dCtx.lineWidth = furrowWidth;
    dCtx.beginPath();
    dCtx.moveTo(x, 0);
    dCtx.bezierCurveTo(x + 10, height * 0.33, x - 10, height * 0.66, x + 4, height);
    dCtx.stroke();

    hCtx.strokeStyle = '#1a1a1a';
    hCtx.lineWidth = furrowWidth * 1.2;
    hCtx.beginPath();
    hCtx.moveTo(x, 0);
    hCtx.bezierCurveTo(x + 10, height * 0.33, x - 10, height * 0.66, x + 4, height);
    hCtx.stroke();

    // Raised scale plates (warm terracotta/cinnamon highlights)
    dCtx.fillStyle = f % 2 === 0 ? '#5a311d' : '#6b3a24';
    dCtx.fillRect(x + furrowWidth, 0, (width / numFurrows) - furrowWidth, height);

    hCtx.fillStyle = '#b0b0b0';
    hCtx.fillRect(x + furrowWidth, 0, (width / numFurrows) - furrowWidth, height);
  }

  // Horizontal fissure rings
  for (let y = 0; y < height; y += 28) {
    const yy = y + (Math.random() - 0.5) * 12;
    dCtx.strokeStyle = '#20110a';
    dCtx.lineWidth = 2.5;
    dCtx.beginPath();
    dCtx.moveTo(0, yy);
    dCtx.lineTo(width, yy);
    dCtx.stroke();

    hCtx.strokeStyle = '#282828';
    hCtx.lineWidth = 3.0;
    hCtx.beginPath();
    hCtx.moveTo(0, yy);
    hCtx.lineTo(width, yy);
    hCtx.stroke();
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 2.5);

  const roughnessTex = new THREE.CanvasTexture(rCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.RepeatWrapping;

  return { map: diffuseTex, normalMap: normalTex, roughnessMap: roughnessTex };
}

/**
 * Creates Authentic Royal Palm Feather Frond (Pinnate) Alpha Texture
 */
export function createPalmFrondTexture(width = 256, height = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Fully transparent background
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;

  // Central thick rachis (stem) running bottom to top
  ctx.strokeStyle = '#6a8d3b';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(cx, height);
  ctx.quadraticCurveTo(cx, height * 0.4, cx, 20);
  ctx.stroke();

  // Highlight along rachis
  ctx.strokeStyle = '#a4c661';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(cx, height);
  ctx.quadraticCurveTo(cx, height * 0.4, cx, 20);
  ctx.stroke();

  const leafletTones = ['#1e4a1a', '#295f24', '#377931', '#4b9543', '#5ea855', '#245220'];

  // Paint hundreds of dense, narrow, arching pinnate leaflets extending out from both sides
  const step = 2.8;
  for (let y = height - 30; y > 30; y -= step) {
    const progress = 1.0 - (y / height); // 0 at base, 1 at tip
    // Width profile: swells in middle, tapers to point at tip
    const maxLen = (width * 0.46) * Math.sin(Math.pow(progress, 0.6) * Math.PI);

    for (let side of [-1, 1]) {
      const len = maxLen * (0.85 + Math.random() * 0.3);
      if (len < 3) continue;

      // Leaflet angle arches from 45 deg near base to 20 deg near tip
      const angle = (0.75 - progress * 0.35) * side;

      ctx.save();
      ctx.translate(cx, y);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.5 * side, -len * 0.2, len * side, 0);
      ctx.quadraticCurveTo(len * 0.5 * side, len * 0.08, 0, 1.2);
      ctx.closePath();

      ctx.fillStyle = leafletTones[Math.floor(Math.random() * leafletTones.length)];
      ctx.globalAlpha = 0.92;
      ctx.fill();

      // Midrib on individual leaflet
      ctx.strokeStyle = 'rgba(210, 245, 170, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len * side * 0.85, 0);
      ctx.stroke();

      ctx.restore();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates Organic Leaf Cluster Canopy Alpha & Normal Texture
 */
export function createFoliageTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Fully transparent background
  ctx.clearRect(0, 0, width, height);

  const leafTones = ['#1d3d19', '#275222', '#366e30', '#4a8742', '#21471d', '#55944d'];

  // Paint 800 overlapping organic leaves
  for (let i = 0; i < 900; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const len = 14 + Math.random() * 22;
    const wid = 7 + Math.random() * 10;
    const rot = Math.random() * Math.PI * 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // Leaf blade path
    ctx.beginPath();
    ctx.moveTo(0, -len / 2);
    ctx.bezierCurveTo(wid, -len / 4, wid, len / 4, 0, len / 2);
    ctx.bezierCurveTo(-wid, len / 4, -wid, -len / 4, 0, -len / 2);
    ctx.closePath();

    ctx.fillStyle = leafTones[Math.floor(Math.random() * leafTones.length)];
    ctx.globalAlpha = 0.88;
    ctx.fill();

    // Leaf central vein
    ctx.strokeStyle = 'rgba(180, 230, 150, 0.35)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -len / 2 + 2);
    ctx.lineTo(0, len / 2 - 2);
    ctx.stroke();

    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates Authentic High-Fidelity Indian Teak Wood PBR Suite
 * Rich warm amber-brown tones, interlocking grain, growth ring ridges, and satin polish.
 */
export function createTeakWoodPBR(width = 512, height = 512) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width; diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width; hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080'; hCtx.fillRect(0, 0, width, height);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = width; rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d');
  rCtx.fillStyle = '#808080'; rCtx.fillRect(0, 0, width, height);

  // Warm deep Indian teak base
  dCtx.fillStyle = '#4e2a16';
  dCtx.fillRect(0, 0, width, height);

  // Growth rings & undulating grain waves
  const numRings = 40;
  for (let r = 0; r < numRings; r++) {
    const y = (r / numRings) * height + (Math.random() - 0.5) * 8;
    const bandHeight = 6 + Math.random() * 8;

    const tone = r % 2 === 0 ? '#5b321c' : '#3d1f0f';
    dCtx.fillStyle = tone;
    dCtx.globalAlpha = 0.65;
    dCtx.beginPath();
    dCtx.moveTo(0, y);
    dCtx.bezierCurveTo(width * 0.33, y + (Math.random() - 0.5) * 14, width * 0.66, y + (Math.random() - 0.5) * 14, width, y);
    dCtx.lineTo(width, y + bandHeight);
    dCtx.bezierCurveTo(width * 0.66, y + bandHeight + 4, width * 0.33, y + bandHeight - 4, 0, y + bandHeight);
    dCtx.closePath();
    dCtx.fill();
    dCtx.globalAlpha = 1.0;
  }

  // Fine longitudinal fibers
  for (let i = 0; i < 600; i++) {
    const y = Math.random() * height;
    dCtx.strokeStyle = Math.random() > 0.4 ? '#2a1207' : '#68371d';
    dCtx.lineWidth = 0.7 + Math.random() * 1.5;
    dCtx.globalAlpha = 0.35;

    hCtx.strokeStyle = Math.random() > 0.5 ? '#707070' : '#989898';
    hCtx.lineWidth = dCtx.lineWidth;
    hCtx.globalAlpha = 0.20;

    dCtx.beginPath();
    dCtx.moveTo(0, y);
    dCtx.bezierCurveTo(width * 0.33, y + (Math.random() - 0.5) * 10, width * 0.66, y + (Math.random() - 0.5) * 10, width, y + (Math.random() - 0.5) * 6);
    dCtx.stroke();

    hCtx.beginPath();
    hCtx.moveTo(0, y);
    hCtx.bezierCurveTo(width * 0.33, y + (Math.random() - 0.5) * 10, width * 0.66, y + (Math.random() - 0.5) * 10, width, y + (Math.random() - 0.5) * 6);
    hCtx.stroke();
  }
  dCtx.globalAlpha = 1.0;
  hCtx.globalAlpha = 1.0;

  // Wood pore specks
  dCtx.fillStyle = '#1c0b04';
  dCtx.globalAlpha = 0.25;
  hCtx.fillStyle = '#404040';
  hCtx.globalAlpha = 0.5;
  for (let p = 0; p < 1800; p++) {
    const px = Math.random() * width;
    const py = Math.random() * height;
    const pw = 2.5 + Math.random() * 4.0;
    dCtx.fillRect(px, py, pw, 1.2);
    hCtx.fillRect(px, py, pw, 1.2);
  }
  dCtx.globalAlpha = 1.0;
  hCtx.globalAlpha = 1.0;

  // Satin lacquer roughness map (varying between 0.42 and 0.68)
  for (let y = 0; y < height; y += 4) {
    const rVal = Math.floor(100 + Math.random() * 50);
    rCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
    rCtx.fillRect(0, y, width, 4);
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping; diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 2.2);
  normalTex.wrapS = THREE.RepeatWrapping; normalTex.wrapT = THREE.RepeatWrapping;

  const roughnessTex = new THREE.CanvasTexture(rCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping; roughnessTex.wrapT = THREE.RepeatWrapping;

  return { map: diffuseTex, normalMap: normalTex, roughnessMap: roughnessTex };
}

/**
 * Creates Authentic Courtroom Herringbone Timber Parquet Floor PBR Suite
 * Interlocking diagonal teak/oak slats with micro-bevel seams, individual grain angles, and satin judicial polish.
 */
export function createCourtroomParquetPBR(width = 1024, height = 1024) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width; diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width; hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#909090'; hCtx.fillRect(0, 0, width, height);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = width; rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d');
  rCtx.fillStyle = '#656565'; rCtx.fillRect(0, 0, width, height); // ~0.40 polished judicial sheen

  dCtx.fillStyle = '#221108'; dCtx.fillRect(0, 0, width, height);

  // Parquet herringbone grid: 8 columns x 8 rows of alternating angled slats
  const cols = 8;
  const rows = 8;
  const cellW = width / cols;
  const cellH = height / rows;

  const plankTones = ['#422112', '#4a2615', '#381c0d', '#522b18', '#3e2011', '#4d2816', '#34190b'];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const ox = c * cellW;
      const oy = r * cellH;
      const isAlt = (c + r) % 2 === 0;

      // Draw 4 slats inside each cell
      const slats = 4;
      const slatDim = cellW / slats;

      for (let s = 0; s < slats; s++) {
        dCtx.save();
        hCtx.save();

        let sx, sy, sw, sh;
        if (isAlt) {
          sx = ox + s * slatDim; sy = oy; sw = slatDim; sh = cellH;
        } else {
          sx = ox; sy = oy + s * slatDim; sw = cellW; sh = slatDim;
        }

        const baseTone = plankTones[(c * 7 + r * 13 + s * 5) % plankTones.length];
        dCtx.fillStyle = baseTone;
        dCtx.fillRect(sx, sy, sw, sh);

        // Plank surface grain
        dCtx.strokeStyle = '#220f06';
        dCtx.lineWidth = 0.9;
        dCtx.globalAlpha = 0.3;
        for (let g = 0; g < 14; g++) {
          dCtx.beginPath();
          if (isAlt) {
            const gx = sx + Math.random() * sw;
            dCtx.moveTo(gx, sy);
            dCtx.lineTo(gx + (Math.random() - 0.5) * 6, sy + sh);
          } else {
            const gy = sy + Math.random() * sh;
            dCtx.moveTo(sx, gy);
            dCtx.lineTo(sx + sw, gy + (Math.random() - 0.5) * 6);
          }
          dCtx.stroke();
        }
        dCtx.globalAlpha = 1.0;

        // Bevel edge shadow in diffuse & deep groove in height map
        dCtx.strokeStyle = '#180a04';
        dCtx.lineWidth = 2.0;
        dCtx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);

        hCtx.fillStyle = '#b0b0b0'; // Raised plank center
        hCtx.fillRect(sx + 2, sy + 2, sw - 4, sh - 4);

        hCtx.strokeStyle = '#202020'; // Deep recessed bevel joint
        hCtx.lineWidth = 2.5;
        hCtx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);

        dCtx.restore();
        hCtx.restore();
      }
    }
  }

  // Judicial varnish sheen variation across planks
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const rVal = Math.floor(70 + Math.random() * 45); // 0.27 to 0.45 roughness
      rCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      rCtx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
    }
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping; diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 2.8);
  normalTex.wrapS = THREE.RepeatWrapping; normalTex.wrapT = THREE.RepeatWrapping;

  const roughnessTex = new THREE.CanvasTexture(rCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping; roughnessTex.wrapT = THREE.RepeatWrapping;

  return { map: diffuseTex, normalMap: normalTex, roughnessMap: roughnessTex };
}

/**
 * Creates Deep Imperial Burgundy Judicial Leather PBR Suite
 * Rich wine-red upholstery with pebble-grain texture, button-tufted creases, and soft leather luster.
 */
export function createBurgundyLeatherPBR(width = 512, height = 512) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width; diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width; hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080'; hCtx.fillRect(0, 0, width, height);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = width; rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d');
  rCtx.fillStyle = '#909090'; rCtx.fillRect(0, 0, width, height); // ~0.56 satin leather

  // Deep judicial burgundy base
  dCtx.fillStyle = '#3a0c14';
  dCtx.fillRect(0, 0, width, height);

  // Micro pebble-grain noise
  for (let p = 0; p < 8000; p++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const rad = 1.0 + Math.random() * 2.2;

    dCtx.fillStyle = Math.random() > 0.5 ? '#48121c' : '#28070d';
    dCtx.globalAlpha = 0.35;
    dCtx.beginPath();
    dCtx.arc(x, y, rad, 0, Math.PI * 2);
    dCtx.fill();

    hCtx.fillStyle = Math.random() > 0.5 ? '#989898' : '#686868';
    hCtx.globalAlpha = 0.35;
    hCtx.beginPath();
    hCtx.arc(x, y, rad, 0, Math.PI * 2);
    hCtx.fill();
  }
  dCtx.globalAlpha = 1.0;
  hCtx.globalAlpha = 1.0;

  // Diamond button-tufted upholstery creases
  const grid = 64;
  for (let y = 0; y <= height + grid; y += grid) {
    for (let x = 0; x <= width + grid; x += grid) {
      const cx = x;
      const cy = y;

      // Diagonal creasing lines
      dCtx.strokeStyle = '#1a0408';
      dCtx.lineWidth = 2.0;
      dCtx.globalAlpha = 0.45;
      dCtx.beginPath();
      dCtx.moveTo(cx - grid * 0.5, cy);
      dCtx.lineTo(cx, cy - grid * 0.5);
      dCtx.lineTo(cx + grid * 0.5, cy);
      dCtx.lineTo(cx, cy + grid * 0.5);
      dCtx.closePath();
      dCtx.stroke();

      hCtx.strokeStyle = '#383838';
      hCtx.lineWidth = 2.5;
      hCtx.globalAlpha = 0.5;
      hCtx.beginPath();
      hCtx.moveTo(cx - grid * 0.5, cy);
      hCtx.lineTo(cx, cy - grid * 0.5);
      hCtx.lineTo(cx + grid * 0.5, cy);
      hCtx.lineTo(cx, cy + grid * 0.5);
      hCtx.closePath();
      hCtx.stroke();

      // Deep button dimple at intersection
      const buttonGrad = dCtx.createRadialGradient(cx, cy, 1, cx, cy, 7);
      buttonGrad.addColorStop(0, '#100204');
      buttonGrad.addColorStop(0.6, '#26060c');
      buttonGrad.addColorStop(1, 'rgba(58, 12, 20, 0)');
      dCtx.fillStyle = buttonGrad;
      dCtx.beginPath();
      dCtx.arc(cx, cy, 7, 0, Math.PI * 2);
      dCtx.fill();

      const hDimple = hCtx.createRadialGradient(cx, cy, 1, cx, cy, 7);
      hDimple.addColorStop(0, '#181818');
      hDimple.addColorStop(0.7, '#484848');
      hDimple.addColorStop(1, '#808080');
      hCtx.fillStyle = hDimple;
      hCtx.beginPath();
      hCtx.arc(cx, cy, 7, 0, Math.PI * 2);
      hCtx.fill();
    }
  }
  dCtx.globalAlpha = 1.0;
  hCtx.globalAlpha = 1.0;

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping; diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 2.0);
  normalTex.wrapS = THREE.RepeatWrapping; normalTex.wrapT = THREE.RepeatWrapping;

  const roughnessTex = new THREE.CanvasTexture(rCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping; roughnessTex.wrapT = THREE.RepeatWrapping;

  return { map: diffuseTex, normalMap: normalTex, roughnessMap: roughnessTex };
}

/**
 * Creates Authentic Ashoka Lion Capital State Emblem & Judicial Motto PBR Suite
 * Circular carved teak plaque with raised antique gold Lion Capital, Dharma Chakra,
 * and elegant Devanagari typography "सत्यमेव जयते" and "यतो धर्मस्ततो जयः".
 */
export function createAshokaEmblemPBR(width = 1024, height = 1024) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width; diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width; hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#404040'; hCtx.fillRect(0, 0, width, height);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = width; rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d');
  rCtx.fillStyle = '#a0a0a0'; rCtx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.46;

  // 1. Dark Teak Circular Backplate
  const plateGrad = dCtx.createRadialGradient(cx, cy, outerR * 0.2, cx, cy, outerR);
  plateGrad.addColorStop(0, '#2e1408');
  plateGrad.addColorStop(0.85, '#1e0c04');
  plateGrad.addColorStop(1, '#120602');
  dCtx.fillStyle = plateGrad;
  dCtx.beginPath();
  dCtx.arc(cx, cy, outerR, 0, Math.PI * 2);
  dCtx.fill();

  hCtx.fillStyle = '#606060';
  hCtx.beginPath();
  hCtx.arc(cx, cy, outerR, 0, Math.PI * 2);
  hCtx.fill();

  // 2. Concentric Gilded Beaded & Fluted Outer Border
  const goldTone = '#d4af37';
  const goldShadow = '#8c6d1f';
  const goldHighlight = '#ffe885';

  dCtx.strokeStyle = goldTone;
  dCtx.lineWidth = 14;
  dCtx.beginPath();
  dCtx.arc(cx, cy, outerR - 10, 0, Math.PI * 2);
  dCtx.stroke();

  hCtx.strokeStyle = '#d8d8d8';
  hCtx.lineWidth = 14;
  hCtx.beginPath();
  hCtx.arc(cx, cy, outerR - 10, 0, Math.PI * 2);
  hCtx.stroke();

  // Decorative beads around ring
  const numBeads = 48;
  for (let b = 0; b < numBeads; b++) {
    const bAngle = (b * Math.PI * 2) / numBeads;
    const bx = cx + Math.cos(bAngle) * (outerR - 24);
    const by = cy + Math.sin(bAngle) * (outerR - 24);

    dCtx.fillStyle = goldTone;
    dCtx.beginPath(); dCtx.arc(bx, by, 4.5, 0, Math.PI * 2); dCtx.fill();

    hCtx.fillStyle = '#f0f0f0';
    hCtx.beginPath(); hCtx.arc(bx, by, 4.5, 0, Math.PI * 2); hCtx.fill();
  }

  // 3. Central Ashoka Lion Capital Relief (Center & Upper Half)
  const emblemY = cy - 40;

  // A. Inverted Bell Lotus Base
  dCtx.fillStyle = goldTone;
  dCtx.beginPath();
  dCtx.ellipse(cx, emblemY + 120, 85, 24, 0, 0, Math.PI);
  dCtx.fill();

  hCtx.fillStyle = '#c0c0c0';
  hCtx.beginPath();
  hCtx.ellipse(cx, emblemY + 120, 85, 24, 0, 0, Math.PI);
  hCtx.fill();

  // B. Circular Abacus with Central Ashoka Chakra
  dCtx.fillStyle = '#c69c28';
  dCtx.fillRect(cx - 105, emblemY + 68, 210, 36);

  hCtx.fillStyle = '#d0d0d0';
  hCtx.fillRect(cx - 105, emblemY + 68, 210, 36);

  // Ashoka Chakra (Wheel of Law with 24 spokes)
  const chakraX = cx;
  const chakraY = emblemY + 86;
  const chakraR = 15;

  dCtx.strokeStyle = '#ffffff';
  dCtx.lineWidth = 2.5;
  dCtx.beginPath();
  dCtx.arc(chakraX, chakraY, chakraR, 0, Math.PI * 2);
  dCtx.stroke();

  hCtx.strokeStyle = '#ffffff';
  hCtx.lineWidth = 3.0;
  hCtx.beginPath();
  hCtx.arc(chakraX, chakraY, chakraR, 0, Math.PI * 2);
  hCtx.stroke();

  // 24 Spokes
  for (let sp = 0; sp < 24; sp++) {
    const sAng = (sp * Math.PI * 2) / 24;
    dCtx.beginPath();
    dCtx.moveTo(chakraX, chakraY);
    dCtx.lineTo(chakraX + Math.cos(sAng) * chakraR, chakraY + Math.sin(sAng) * chakraR);
    dCtx.stroke();

    hCtx.beginPath();
    hCtx.moveTo(chakraX, chakraY);
    hCtx.lineTo(chakraX + Math.cos(sAng) * chakraR, chakraY + Math.sin(sAng) * chakraR);
    hCtx.stroke();
  }

  // C. Sculpted Lions (Center Frontal Lion + Flanking Profile Lions)
  // Frontal Lion Torso & Majestic Mane
  dCtx.fillStyle = goldHighlight;
  dCtx.beginPath();
  dCtx.moveTo(cx - 45, emblemY + 68);
  dCtx.quadraticCurveTo(cx - 65, emblemY - 20, cx - 40, emblemY - 90); // Left shoulder/mane
  dCtx.quadraticCurveTo(cx, emblemY - 125, cx + 40, emblemY - 90);     // Head dome
  dCtx.quadraticCurveTo(cx + 65, emblemY - 20, cx + 45, emblemY + 68); // Right shoulder
  dCtx.closePath();
  dCtx.fill();

  hCtx.fillStyle = '#f8f8f8';
  hCtx.beginPath();
  hCtx.moveTo(cx - 45, emblemY + 68);
  hCtx.quadraticCurveTo(cx - 65, emblemY - 20, cx - 40, emblemY - 90);
  hCtx.quadraticCurveTo(cx, emblemY - 125, cx + 40, emblemY - 90);
  hCtx.quadraticCurveTo(cx + 65, emblemY - 20, cx + 45, emblemY + 68);
  hCtx.closePath();
  hCtx.fill();

  // Left & Right Flanking Lions
  [-1, 1].forEach(side => {
    dCtx.fillStyle = goldTone;
    dCtx.beginPath();
    dCtx.moveTo(cx + side * 40, emblemY + 68);
    dCtx.quadraticCurveTo(cx + side * 115, emblemY + 10, cx + side * 90, emblemY - 75);
    dCtx.quadraticCurveTo(cx + side * 70, emblemY - 105, cx + side * 35, emblemY - 80);
    dCtx.closePath();
    dCtx.fill();

    hCtx.fillStyle = '#e0e0e0';
    hCtx.beginPath();
    hCtx.moveTo(cx + side * 40, emblemY + 68);
    hCtx.quadraticCurveTo(cx + side * 115, emblemY + 10, cx + side * 90, emblemY - 75);
    hCtx.quadraticCurveTo(cx + side * 70, emblemY - 105, cx + side * 35, emblemY - 80);
    hCtx.closePath();
    hCtx.fill();
  });

  // Mane locks detailing
  dCtx.strokeStyle = goldShadow;
  dCtx.lineWidth = 2.2;
  for (let m = -35; m <= 35; m += 9) {
    dCtx.beginPath();
    dCtx.moveTo(cx + m, emblemY - 40);
    dCtx.quadraticCurveTo(cx + m * 1.2, emblemY + 10, cx + m * 0.9, emblemY + 55);
    dCtx.stroke();
  }

  // 4. Pristine Devanagari National Motto: "सत्यमेव जयते" (Center-aligned below emblem)
  dCtx.font = 'bold 40px "Nirmala UI", "Mangal", "Noto Sans Devanagari", sans-serif';
  dCtx.textAlign = 'center';
  dCtx.textBaseline = 'middle';

  // Gold drop shadow
  dCtx.fillStyle = '#4a3406';
  dCtx.fillText('सत्यमेव जयते', cx + 2, emblemY + 192);

  dCtx.fillStyle = goldHighlight;
  dCtx.fillText('सत्यमेव जयते', cx, emblemY + 190);

  hCtx.font = 'bold 40px "Nirmala UI", "Mangal", "Noto Sans Devanagari", sans-serif';
  hCtx.textAlign = 'center';
  hCtx.textBaseline = 'middle';
  hCtx.fillStyle = '#ffffff';
  hCtx.fillText('सत्यमेव जयते', cx, emblemY + 190);

  // 5. Supreme Court Historic Judicial Motto: "यतो धर्मस्ततो जयः" (Arched Across Top)
  dCtx.font = 'bold 34px "Nirmala UI", "Mangal", "Noto Sans Devanagari", sans-serif';
  dCtx.fillStyle = goldHighlight;
  dCtx.fillText('यतो धर्मस्ततो जयः', cx, cy - outerR + 68);

  hCtx.font = 'bold 34px "Nirmala UI", "Mangal", "Noto Sans Devanagari", sans-serif';
  hCtx.fillStyle = '#ffffff';
  hCtx.fillText('यतो धर्मस्ततो जयः', cx, cy - outerR + 68);

  // English translation subline in fine roman caps
  dCtx.font = '600 16px "Cinzel", Georgia, serif';
  dCtx.fillStyle = '#e8c978';
  dCtx.letterSpacing = '3px';
  dCtx.fillText('WHERE THERE IS DHARMA, THERE IS VICTORY', cx, cy - outerR + 100);

  // Roughness Map: Gold details are smooth & reflective (0.24), Wood plate is matte (0.82)
  rCtx.fillStyle = '#404040'; // Gold specular sheen
  rCtx.beginPath(); rCtx.arc(cx, cy, outerR * 0.78, 0, Math.PI * 2); rCtx.fill();

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 3.2);

  const roughnessTex = new THREE.CanvasTexture(rCanvas);

  return { map: diffuseTex, normalMap: normalTex, roughnessMap: roughnessTex };
}

/**
 * Creates Authentic Bound Law Report Bookshelf Spine Texture
 * Distinct embossed calfskin, moroccan leather, and dark buckram volumes with gold foil lettering.
 */
export function createLawBookSpineTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, width, height);

  const numBooks = 12;
  const bookW = width / numBooks;

  const bindings = [
    { base: '#5c141d', label: '#1c080b', text: 'SCR\n1978' },
    { base: '#152b48', label: '#091526', text: 'AIR\n1984' },
    { base: '#123820', label: '#06170d', text: 'SCC\n2002' },
    { base: '#6e451e', label: '#2b1908', text: 'CONST\nINDIA' },
    { base: '#1d1e22', label: '#0c0c0e', text: 'IPC\nACT' },
    { base: '#521219', label: '#1a0407', text: 'CR.PC\nVOL 1' },
    { base: '#1e304f', label: '#0b1424', text: 'SCR\n1995' },
    { base: '#613e1c', label: '#241407', text: 'SCC\n2016' },
    { base: '#183b24', label: '#08170c', text: 'AIR\n2020' },
    { base: '#56161f', label: '#1c0609', text: 'SCR\n2024' },
    { base: '#1f2026', label: '#0d0e12', text: 'EVID\nACT' },
    { base: '#6b421a', label: '#261606', text: 'CIVIL\nPROC' }
  ];

  bindings.forEach((b, idx) => {
    const bx = idx * bookW;

    // Spine body
    ctx.fillStyle = b.base;
    ctx.fillRect(bx + 1, 0, bookW - 2, height);

    // Book spine side shadow/groove
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(bx, 0, 1.5, height);
    ctx.fillRect(bx + bookW - 1.5, 0, 1.5, height);

    // 5 Raised horizontal gold ribs
    for (let r = 1; r <= 5; r++) {
      const ry = (r / 6) * height;
      ctx.fillStyle = '#cca038';
      ctx.fillRect(bx + 2, ry - 2, bookW - 4, 4);

      ctx.fillStyle = '#ffe27a';
      ctx.fillRect(bx + 2, ry - 1, bookW - 4, 1.5);

      ctx.fillStyle = '#3a2408';
      ctx.fillRect(bx + 2, ry + 2, bookW - 4, 1.5);
    }

    // Gold-embossed dark leather label plaque
    const labelY = height * 0.28;
    const labelH = height * 0.22;
    ctx.fillStyle = b.label;
    ctx.fillRect(bx + 3, labelY, bookW - 6, labelH);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(bx + 4, labelY + 1, bookW - 8, labelH - 2);

    // Gold title text
    ctx.font = 'bold 9px "Cinzel", serif';
    ctx.fillStyle = '#ffdf78';
    ctx.textAlign = 'center';
    const lines = b.text.split('\n');
    lines.forEach((line, lIdx) => {
      ctx.fillText(line, bx + bookW / 2, labelY + 16 + lIdx * 14);
    });

    // Volume number at bottom
    ctx.font = 'bold 8px "Cinzel", serif';
    ctx.fillStyle = '#cca038';
    ctx.fillText(`VOL ${idx + 1}`, bx + bookW / 2, height * 0.78);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates Monumental Coffered Ceiling PBR Suite
 * Multi-tiered stepped architectural mouldings with acoustic plaster center and gilded rosette.
 */
export function createCofferedCeilingPBR(width = 1024, height = 1024) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width; diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d');

  const hCanvas = document.createElement('canvas');
  hCanvas.width = width; hCanvas.height = height;
  const hCtx = hCanvas.getContext('2d');
  hCtx.fillStyle = '#808080'; hCtx.fillRect(0, 0, width, height);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = width; rCanvas.height = height;
  const rCtx = rCanvas.getContext('2d');
  rCtx.fillStyle = '#a0a0a0'; rCtx.fillRect(0, 0, width, height);

  // Off-white acoustic plaster base
  dCtx.fillStyle = '#e8e2d4';
  dCtx.fillRect(0, 0, width, height);

  // 2x2 grid of deep sunken coffers
  const size = width / 2;
  for (let gx = 0; gx < 2; gx++) {
    for (let gy = 0; gy < 2; gy++) {
      const ox = gx * size;
      const oy = gy * size;
      const pad = 18;

      // Outer Teak Beam Border
      dCtx.fillStyle = '#3d2011';
      dCtx.fillRect(ox, oy, size, size);

      // Stepped Mouldings
      const steps = [
        { inset: 16, color: '#4a2815', hVal: '#606060' },
        { inset: 28, color: '#d4af37', hVal: '#d0d0d0' }, // Gold dentil line
        { inset: 34, color: '#33170a', hVal: '#484848' },
        { inset: 46, color: '#ece6d8', hVal: '#282828' }  // Deep sunken acoustic center
      ];

      steps.forEach(st => {
        dCtx.fillStyle = st.color;
        dCtx.fillRect(ox + st.inset, oy + st.inset, size - st.inset * 2, size - st.inset * 2);

        hCtx.fillStyle = st.hVal;
        hCtx.fillRect(ox + st.inset, oy + st.inset, size - st.inset * 2, size - st.inset * 2);
      });

      // Central Gilded Floral Rosette
      const rcx = ox + size / 2;
      const rcy = oy + size / 2;
      dCtx.fillStyle = '#cca038';
      dCtx.beginPath(); dCtx.arc(rcx, rcy, 22, 0, Math.PI * 2); dCtx.fill();

      hCtx.fillStyle = '#f0f0f0';
      hCtx.beginPath(); hCtx.arc(rcx, rcy, 22, 0, Math.PI * 2); hCtx.fill();

      // Petals
      for (let p = 0; p < 8; p++) {
        const pAng = (p * Math.PI * 2) / 8;
        const px = rcx + Math.cos(pAng) * 16;
        const py = rcy + Math.sin(pAng) * 16;
        dCtx.fillStyle = '#ffe27a';
        dCtx.beginPath(); dCtx.arc(px, py, 7, 0, Math.PI * 2); dCtx.fill();

        hCtx.fillStyle = '#ffffff';
        hCtx.beginPath(); hCtx.arc(px, py, 7, 0, Math.PI * 2); hCtx.fill();
      }
    }
  }

  const diffuseTex = new THREE.CanvasTexture(diffCanvas);
  diffuseTex.wrapS = THREE.RepeatWrapping; diffuseTex.wrapT = THREE.RepeatWrapping;
  diffuseTex.colorSpace = THREE.SRGBColorSpace;

  const normalTex = createNormalMapFromHeight(hCanvas, 3.0);
  normalTex.wrapS = THREE.RepeatWrapping; normalTex.wrapT = THREE.RepeatWrapping;

  const roughnessTex = new THREE.CanvasTexture(rCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping; roughnessTex.wrapT = THREE.RepeatWrapping;

  return { map: diffuseTex, normalMap: normalTex, roughnessMap: roughnessTex };
}

// Backward-compatible exports for existing callers
export function createWoodTexture(baseColor = '#4a2615', grainColor = '#2d1408', width = 512, height = 512) {
  return createWoodPBR(baseColor, grainColor, width, height).map;
}
export function createMarbleTexture(baseColor = '#dcd6cd', veinColor = '#a89f92', width = 512, height = 512) {
  return createSandstonePBR({ baseColor, veinColor, hasBlocks: false, width, height }).map;
}
export function createSandstoneTexture(colorHex = '#f3ecda', grainHex = '#c4b8a2', width = 512, height = 512) {
  return createSandstonePBR({ baseColor: colorHex, veinColor: grainHex, hasBlocks: true, width, height }).map;
}
export function createIndianFlagTexture(width = 1024, height = 683) {
  return createIndianFlagPBR(width, height).map;
}
export function createPaverTexture(width = 512, height = 512) {
  return createPaverPBR(width, height).map;
}
export function createGrassTexture(width = 512, height = 512) {
  return createGrassPBR(width, height).map;
}
export function createAsphaltTexture(width = 512, height = 512) {
  return createAsphaltPBR(width, height).map;
}
