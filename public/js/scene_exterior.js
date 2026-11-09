/**
 * PRAMANA — Scene Supreme Court Exterior & Arrival (Milestone 4)
 * Authentic architectural representation of the Supreme Court of India
 * (Central Dome, Symmetrical Wings, Red Sandstone Plinth, Cream Colonnade, Forecourt).
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';
import { createSandstoneTexture } from './procedural_textures.js';

class SupremeCourtExteriorScene {
  constructor() {
    this.group = threeScene.exteriorGroup;
    this.isBuilt = false;
  }

  build() {
    if (this.isBuilt) return;

    // Procedural Stone PBR Textures
    const redSandstoneTex = createSandstoneTexture('#7c2d12', '#4d1607', 512, 512);
    redSandstoneTex.repeat.set(4, 2);

    const creamFacadeTex = createSandstoneTexture('#f3ecda', '#c4b8a2', 512, 512);
    creamFacadeTex.repeat.set(6, 4);

    // Materials Palette
    const sandstoneRedMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12, // Dholpur red sandstone base plinth
      map: redSandstoneTex,
      bumpMap: redSandstoneTex,
      bumpScale: 0.4,
      roughness: 0.82,
      metalness: 0.05
    });

    const facadeCreamMat = new THREE.MeshStandardMaterial({
      color: 0xf3ecda, // Traditional Supreme Court cream sandstone
      map: creamFacadeTex,
      bumpMap: creamFacadeTex,
      bumpScale: 0.3,
      roughness: 0.68,
      metalness: 0.08
    });

    const domeCreamMat = new THREE.MeshStandardMaterial({
      color: 0xe8dfc8,
      roughness: 0.6,
      metalness: 0.12
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.75,
      roughness: 0.35
    });

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x1d381e,
      roughness: 0.9,
      metalness: 0.0
    });

    const drivewayMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.8,
      metalness: 0.1
    });

    // 1. Surrounding Lawns & Circular Forecourt Driveway
    const groundGeo = new THREE.PlaneGeometry(1200, 1200);
    const groundMesh = new THREE.Mesh(groundGeo, grassMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.group.add(groundMesh);

    // Circular driveway in front of portico
    const driveGeo = new THREE.RingGeometry(80, 150, 48);
    const driveMesh = new THREE.Mesh(driveGeo, drivewayMat);
    driveMesh.rotation.x = -Math.PI / 2;
    driveMesh.position.set(0, 0.2, 160);
    driveMesh.receiveShadow = true;
    this.group.add(driveMesh);

    // 2. High Red Sandstone Stepped Plinth
    const plinthGeo = new THREE.BoxGeometry(320, 12, 180);
    const plinth = new THREE.Mesh(plinthGeo, sandstoneRedMat);
    plinth.position.set(0, 6, 0);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    this.group.add(plinth);

    // Broad Front Entrance Steps
    for (let s = 0; s < 8; s++) {
      const stepGeo = new THREE.BoxGeometry(110 + s * 4, 1.2, 5);
      const step = new THREE.Mesh(stepGeo, sandstoneRedMat);
      step.position.set(0, s * 1.2 + 0.6, 92 + s * 4.5);
      step.receiveShadow = true;
      this.group.add(step);
    }

    // 3. Central Architectural Block
    const centralBlockGeo = new THREE.BoxGeometry(160, 65, 120);
    const centralBlock = new THREE.Mesh(centralBlockGeo, facadeCreamMat);
    centralBlock.position.set(0, 44.5, 0);
    centralBlock.castShadow = true;
    centralBlock.receiveShadow = true;
    this.group.add(centralBlock);

    // Symmetrical East Wing
    const eastWingGeo = new THREE.BoxGeometry(110, 48, 90);
    const eastWing = new THREE.Mesh(eastWingGeo, facadeCreamMat);
    eastWing.position.set(130, 36, -10);
    eastWing.castShadow = true;
    eastWing.receiveShadow = true;
    this.group.add(eastWing);

    // Symmetrical West Wing
    const westWingGeo = new THREE.BoxGeometry(110, 48, 90);
    const westWing = new THREE.Mesh(westWingGeo, facadeCreamMat);
    westWing.position.set(-130, 36, -10);
    westWing.castShadow = true;
    westWing.receiveShadow = true;
    this.group.add(westWing);

    // 4. Iconic Supreme Court Central Dome
    // Cylindrical Drum
    const drumGeo = new THREE.CylinderGeometry(34, 34, 20, 36);
    const drum = new THREE.Mesh(drumGeo, facadeCreamMat);
    drum.position.set(0, 86, 0);
    drum.castShadow = true;
    this.group.add(drum);

    // Hemispherical High Dome
    const domeGeo = new THREE.SphereGeometry(34, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, domeCreamMat);
    dome.position.set(0, 96, 0);
    dome.castShadow = true;
    this.group.add(dome);

    // Golden Kalasha / Finial atop central dome
    const finialGeo = new THREE.CylinderGeometry(1.2, 3, 14, 16);
    const finial = new THREE.Mesh(finialGeo, goldTrimMat);
    finial.position.set(0, 137, 0);
    this.group.add(finial);

    // 5. Grand Colonnade / Pillared Portico
    const porticoRoofGeo = new THREE.BoxGeometry(90, 8, 30);
    const porticoRoof = new THREE.Mesh(porticoRoofGeo, facadeCreamMat);
    porticoRoof.position.set(0, 60, 72);
    porticoRoof.castShadow = true;
    this.group.add(porticoRoof);

    // Classical Fluted Pillars with Base Pedestals and Capital Cornices
    const pillarGeo = new THREE.CylinderGeometry(2.2, 2.6, 44, 20);
    const capitalGeo = new THREE.BoxGeometry(7, 2, 7);
    const baseGeo = new THREE.BoxGeometry(7.5, 2.5, 7.5);
    const pillarPositions = [-38, -26, -14, 14, 26, 38];
    pillarPositions.forEach(x => {
      const pillar = new THREE.Mesh(pillarGeo, facadeCreamMat);
      pillar.position.set(x, 35, 76);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.group.add(pillar);

      const base = new THREE.Mesh(baseGeo, sandstoneRedMat);
      base.position.set(x, 13.25, 76);
      base.castShadow = true;
      base.receiveShadow = true;
      this.group.add(base);

      const cap = new THREE.Mesh(capitalGeo, facadeCreamMat);
      cap.position.set(x, 57, 76);
      cap.castShadow = true;
      cap.receiveShadow = true;
      this.group.add(cap);
    });

    // Central Archway / Main Entrance Doors
    const doorFrameGeo = new THREE.BoxGeometry(26, 32, 4);
    const doorFrame = new THREE.Mesh(doorFrameGeo, sandstoneRedMat);
    doorFrame.position.set(0, 28, 59);
    this.group.add(doorFrame);

    const doorInteriorGeo = new THREE.BoxGeometry(20, 28, 6);
    const doorInteriorMat = new THREE.MeshBasicMaterial({ color: 0x050608 });
    const doorInterior = new THREE.Mesh(doorInteriorGeo, doorInteriorMat);
    doorInterior.position.set(0, 26, 58);
    this.group.add(doorInterior);

    // Inscription Plaque above Main Entrance: "यतो धर्मस्ततो जयः"
    const plaqueGeo = new THREE.BoxGeometry(45, 6, 1);
    const plaque = new THREE.Mesh(plaqueGeo, goldTrimMat);
    plaque.position.set(0, 48, 61);
    this.group.add(plaque);

    // 6. National Tricolor Flag & Mast in Forecourt
    const mastGeo = new THREE.CylinderGeometry(0.8, 1.2, 70, 16);
    const mast = new THREE.Mesh(mastGeo, goldTrimMat);
    mast.position.set(0, 35, 160);
    mast.castShadow = true;
    this.group.add(mast);

    // Flag Mesh
    const flagGeo = new THREE.PlaneGeometry(16, 10);
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 128;
    flagCanvas.height = 80;
    const fctx = flagCanvas.getContext('2d');
    fctx.fillStyle = '#ff9933'; fctx.fillRect(0, 0, 128, 27); // Saffron
    fctx.fillStyle = '#ffffff'; fctx.fillRect(0, 27, 128, 26); // White
    fctx.fillStyle = '#128807'; fctx.fillRect(0, 53, 128, 27); // Green
    // Ashoka Chakra Navy Blue circle
    fctx.strokeStyle = '#000088'; fctx.lineWidth = 2;
    fctx.beginPath(); fctx.arc(64, 40, 8, 0, Math.PI * 2); fctx.stroke();
    const flagTex = new THREE.CanvasTexture(flagCanvas);
    const flagMat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(8.2, 64, 160);
    flagMesh.castShadow = true;
    this.group.add(flagMesh);

    // Flag wave animation
    threeScene.registerUpdatable((delta, time) => {
      if (!this.group.visible) return;
      flagMesh.rotation.y = Math.sin(time * 3) * 0.12;
      flagMesh.position.y = 64 + Math.cos(time * 2.5) * 0.3;
    });

    this.isBuilt = true;
    console.log('[ExteriorScene] Supreme Court of India architectural exterior initialized.');
  }
}

export const exteriorScene = new SupremeCourtExteriorScene();
