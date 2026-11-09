/**
 * PRAMANA — Procedural High-Fidelity PBR Texture Generator
 * Generates procedural canvas textures for Indian Teak, Courtroom Marble,
 * Dholpur Sandstone, and Earth Night Lights with zero external image dependencies.
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
