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
