/**
 * PRAMANA — Scene Earth & Space-to-Ground Sequence (Milestone 3)
 * Procedural Earth with atmospheric scattering glow, cloud layers,
 * deep-space starfield, and descent path to New Delhi, India.
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';

class EarthScene {
  constructor() {
    this.group = threeScene.earthGroup;
    this.earthRadius = 100;
    this.earthMesh = null;
    this.cloudMesh = null;
    this.atmosphereMesh = null;
    this.starsMesh = null;
    this.indiaMarker = null;

    this.isBuilt = false;
  }

  build() {
    if (this.isBuilt) return;

    // 1. Deep Space Starfield
    this.createStarfield();

    // 2. Procedural High-Detail Earth Surface Texture
    const earthTexture = this.generateEarthTexture();
    const earthBump = this.generateBumpMap();
    const earthSpecular = this.generateSpecularMap();

    // Earth Sphere Geometry
    const earthGeo = new THREE.SphereGeometry(this.earthRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: earthBump,
      bumpScale: 1.2,
      roughness: 0.6,
      metalness: 0.1,
      roughnessMap: earthSpecular
    });

    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthMesh.rotation.y = THREE.MathUtils.degToRad(-100); // Orient India towards initial camera
    this.earthMesh.rotation.x = THREE.MathUtils.degToRad(18);  // Axial tilt ~23 degrees
    this.group.add(this.earthMesh);

    // 3. Cloud Layer
    const cloudGeo = new THREE.SphereGeometry(this.earthRadius * 1.015, 48, 48);
    const cloudTexture = this.generateCloudTexture();
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      roughness: 1.0
    });
    this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    this.cloudMesh.rotation.copy(this.earthMesh.rotation);
    this.group.add(this.cloudMesh);

    // 4. Atmospheric Blue Scattering Glow Halo
    const atmoGeo = new THREE.SphereGeometry(this.earthRadius * 1.045, 48, 48);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.25, 0.65, 1.0, 1.0) * intensity * 0.85;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    this.atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
    this.group.add(this.atmosphereMesh);

    // 5. India / New Delhi Locus Coordinate Marker
    // Lat ~28.6 deg N, Long ~77.2 deg E mapped to sphere surface
    const phi = THREE.MathUtils.degToRad(90 - 28.6);
    const theta = THREE.MathUtils.degToRad(77.2 + 180);
    const markerPos = new THREE.Vector3(
      -(this.earthRadius * 1.01) * Math.sin(phi) * Math.cos(theta),
      (this.earthRadius * 1.01) * Math.cos(phi),
      (this.earthRadius * 1.01) * Math.sin(phi) * Math.sin(theta)
    );

    const markerGeo = new THREE.RingGeometry(0.8, 1.6, 32);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.indiaMarker = new THREE.Mesh(markerGeo, markerMat);
    this.indiaMarker.position.copy(markerPos);
    this.indiaMarker.lookAt(markerPos.clone().multiplyScalar(2));
    this.earthMesh.add(this.indiaMarker);

    // Register update callback for slow rotational kinematics
    threeScene.registerUpdatable((delta, time) => {
      if (!this.group.visible) return;
      if (this.cloudMesh) {
        this.cloudMesh.rotation.y += delta * 0.015;
      }
      if (this.indiaMarker) {
        const s = 1 + Math.sin(time * 3) * 0.15;
        this.indiaMarker.scale.set(s, s, 1);
      }
    });

    this.isBuilt = true;
    console.log('[EarthScene] High-detail procedural Earth initialized.');
  }

  createStarfield() {
    const starCount = 2800;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 2500 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const tint = 0.8 + Math.random() * 0.2;
      colors[i * 3] = tint;
      colors[i * 3 + 1] = tint * (0.9 + Math.random() * 0.1);
      colors[i * 3 + 2] = 1.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    this.starsMesh = new THREE.Points(starGeo, starMat);
    this.group.add(this.starsMesh);
  }

  generateEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep Ocean gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#041026');
    oceanGrad.addColorStop(0.5, '#071e40');
    oceanGrad.addColorStop(1, '#041026');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Continental landmasses
    ctx.fillStyle = '#223821';
    
    // Eurasia / Africa / India broad coordinates
    // Indian Subcontinent (centered around X: ~1460, Y: ~380)
    ctx.beginPath();
    // India Peninsular Triangle
    ctx.moveTo(1400, 310);
    ctx.lineTo(1510, 320); // Northern Himalaya border
    ctx.lineTo(1490, 420); // Eastern coast
    ctx.lineTo(1455, 480); // Kanyakumari cape
    ctx.lineTo(1420, 410); // Western coast
    ctx.closePath();
    ctx.fillStyle = '#4a5d2e';
    ctx.fill();

    // Himalayan crest
    ctx.beginPath();
    ctx.moveTo(1390, 305);
    ctx.lineTo(1530, 310);
    ctx.lineTo(1510, 290);
    ctx.lineTo(1410, 290);
    ctx.closePath();
    ctx.fillStyle = '#cfd8dc';
    ctx.fill();

    // Broad Eurasian & African landmasses
    ctx.fillStyle = '#283822';
    // Africa
    ctx.beginPath();
    ctx.ellipse(1200, 500, 160, 200, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Eurasia
    ctx.beginPath();
    ctx.ellipse(1350, 260, 380, 140, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Americas
    ctx.beginPath();
    ctx.ellipse(500, 340, 180, 120, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(650, 620, 120, 180, 0.2, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  generateBumpMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mountain ridges in white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(730, 150, 30, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  generateSpecularMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    // Oceans specular (high shine)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Landmass non-specular
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(730, 200, 90, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  generateCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 25 + Math.random() * 55;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }
}

export const earthScene = new EarthScene();
