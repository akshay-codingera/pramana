/**
 * PRAMANA — Procedural High-Fidelity PBR Texture Generator
 * Generates procedural canvas textures for Indian Teak, Courtroom Marble,
 * Dholpur Sandstone, Official Indian Flag (Tiranga), Flagstone Pavers,
 * Lawn Turf, and Asphalt Driveway with zero external image dependencies.
 */

import * as THREE from 'three';

export function createWoodTexture(baseColor = '#4a2615', grainColor = '#2d1408', width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base stain
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Longitudinal wood grain lines
  ctx.strokeStyle = grainColor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.22;

  for (let i = 0; i < 400; i++) {
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    // Smooth wavy grain
    const cp1x = width * 0.33;
    const cp1y = y + (Math.random() - 0.5) * 8;
    const cp2x = width * 0.66;
    const cp2y = y + (Math.random() - 0.5) * 8;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, width, y + (Math.random() - 0.5) * 6);
    ctx.stroke();
  }

  // Fine wood pores
  ctx.fillStyle = grainColor;
  ctx.globalAlpha = 0.15;
  for (let p = 0; p < 800; p++) {
    const px = Math.random() * width;
    const py = Math.random() * height;
    ctx.fillRect(px, py, 2 + Math.random() * 3, 1);
  }

  ctx.globalAlpha = 1.0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createMarbleTexture(baseColor = '#dcd6cd', veinColor = '#a89f92', width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base stone
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Organic marble veins
  ctx.strokeStyle = veinColor;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1.5;

  for (let v = 0; v < 25; v++) {
    ctx.beginPath();
    let x = Math.random() * width;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < height) {
      x += (Math.random() - 0.5) * 24;
      y += 10 + Math.random() * 20;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Stone grain noise
  ctx.fillStyle = '#948a7b';
  ctx.globalAlpha = 0.08;
  for (let n = 0; n < 1500; n++) {
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
  }

  ctx.globalAlpha = 1.0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createSandstoneTexture(colorHex = '#f3ecda', grainHex = '#c4b8a2', width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, width, height);

  // Fine mineral granular noise
  ctx.fillStyle = grainHex;
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 3500; i++) {
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.2, 1.2);
  }

  // Stone block mortar seams
  ctx.strokeStyle = 'rgba(80, 60, 45, 0.35)';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.3;
  // Horizontal courses
  for (let h = 64; h < height; h += 64) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(width, h);
    ctx.stroke();
  }
  // Vertical staggered joints
  for (let r = 0; r < height / 64; r++) {
    const offset = (r % 2) * 64;
    for (let w = offset; w < width; w += 128) {
      ctx.beginPath();
      ctx.moveTo(w, r * 64);
      ctx.lineTo(w, (r + 1) * 64);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1.0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Official Indian National Flag (Tiranga) Texture Generator
 * Complies with the Flag Code of India: 3:2 ratio, Saffron, White, Green,
 * and navy blue Ashoka Chakra with exactly 24 equally spaced spokes.
 */
export function createIndianFlagTexture(width = 1024, height = 683) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const bandH = height / 3;

  // 1. India Saffron (Kesari)
  ctx.fillStyle = '#ff9933';
  ctx.fillRect(0, 0, width, bandH);

  // 2. White Band
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, bandH, width, bandH);

  // 3. India Green
  ctx.fillStyle = '#128807';
  ctx.fillRect(0, bandH * 2, width, bandH);

  // 4. Navy Blue Ashoka Chakra
  const cx = width / 2;
  const cy = height / 2;
  const chakraRadius = bandH * 0.38; // ~76% of band height

  ctx.strokeStyle = '#000088';
  ctx.fillStyle = '#000088';

  // Outer Ring
  ctx.lineWidth = Math.max(3, chakraRadius * 0.07);
  ctx.beginPath();
  ctx.arc(cx, cy, chakraRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Central Hub
  const hubRadius = chakraRadius * 0.16;
  ctx.beginPath();
  ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
  ctx.fill();

  // White inner core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, hubRadius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Exactly 24 Equally Spaced Spokes (15 degrees each)
  ctx.strokeStyle = '#000088';
  ctx.lineWidth = Math.max(2, chakraRadius * 0.035);
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

    // Small decorative gopura dots along outer rim between spokes
    const dotAngle = angle + (15 / 2) * (Math.PI / 180);
    const dotX = cx + Math.cos(dotAngle) * (chakraRadius * 0.96);
    const dotY = cy + Math.sin(dotAngle) * (chakraRadius * 0.96);
    ctx.fillStyle = '#000088';
    ctx.beginPath();
    ctx.arc(dotX, dotY, chakraRadius * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fabric micro-weave noise
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let w = 0; w < width; w += 4) {
    ctx.fillRect(w, 0, 1, height);
  }
  for (let h = 0; h < height; h += 4) {
    ctx.fillRect(0, h, width, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Flagstone Paving Texture for Pathways and Plazas
 */
export function createPaverTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base stone tone
  ctx.fillStyle = '#9c9488';
  ctx.fillRect(0, 0, width, height);

  // Staggered paving slabs
  const paverW = 64;
  const paverH = 32;

  ctx.strokeStyle = '#5a544b';
  ctx.lineWidth = 2.5;

  for (let y = 0; y < height; y += paverH) {
    const row = Math.floor(y / paverH);
    const offsetX = (row % 2) * (paverW / 2);
    for (let x = -offsetX; x < width; x += paverW) {
      // Subtle color variation per paver
      const shade = 140 + Math.floor((Math.random() - 0.5) * 20);
      ctx.fillStyle = `rgb(${shade + 10}, ${shade + 4}, ${shade - 5})`;
      ctx.fillRect(x + 1.5, y + 1.5, paverW - 3, paverH - 3);

      // Paver border joint
      ctx.strokeRect(x, y, paverW, paverH);
    }
  }

  // Mineral noise
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let i = 0; i < 2000; i++) {
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Procedural Lawn Grass Texture with Multi-Tone Blade Distribution
 */
export function createGrassTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base rich turf
  ctx.fillStyle = '#1e4020';
  ctx.fillRect(0, 0, width, height);

  // Multi-tone grass blades
  const greens = ['#28542b', '#1b3b1d', '#356a39', '#46804a', '#18331a'];
  for (let i = 0; i < 15000; i++) {
    ctx.fillStyle = greens[Math.floor(Math.random() * greens.length)];
    ctx.globalAlpha = 0.65;
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillRect(x, y, 1.5, 3.5);
  }
  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Procedural Asphalt Driveway Road Surface with Aggregate Texture
 */
export function createAsphaltTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base asphalt
  ctx.fillStyle = '#2b2e35';
  ctx.fillRect(0, 0, width, height);

  // Mineral aggregate speckles
  for (let i = 0; i < 6000; i++) {
    const v = Math.random() > 0.5 ? 90 : 40;
    ctx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.25)`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.2, 1.2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
