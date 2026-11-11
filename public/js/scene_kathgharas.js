/**
 * PRAMANA — Scene Two Interactive Kathgharas (Milestone 6)
 * Physically modeled wooden Indian courtroom witness/accused enclosures
 * with raycasting, hover highlights, camera transitions, and modal drawer triggers.
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';
import { createTeakWoodPBR, createBrassPBR } from './procedural_textures.js';

class KathgharasSystem {
  constructor() {
    this.group = new THREE.Group();
    this.kathghara1 = null; // Left: Case Details
    this.kathghara2 = null; // Right: Document Submission

    this.onSelectKathghara1 = null;
    this.onSelectKathghara2 = null;

    this.isBuilt = false;
  }

  build(onSelect1, onSelect2) {
    if (this.isBuilt) return;
    this.onSelectKathghara1 = onSelect1;
    this.onSelectKathghara2 = onSelect2;

    threeScene.courtroomGroup.add(this.group);

    // 1. Build Kathghara 1 (Left - Case Details)
    this.kathghara1 = this.createKathgharaModel('KATHGHARA_1', 0xd4af37);
    this.kathghara1.position.set(-24, 0, -8);
    this.kathghara1.rotation.y = Math.PI / 10; // Angle slightly towards center bench
    this.group.add(this.kathghara1);

    // 2. Build Kathghara 2 (Right - Document Submission)
    this.kathghara2 = this.createKathgharaModel('KATHGHARA_2', 0x10b981);
    this.kathghara2.position.set(24, 0, -8);
    this.kathghara2.rotation.y = -Math.PI / 10; // Angle slightly towards center bench
    this.group.add(this.kathghara2);

    // 3. Register Interactive Raycast Handlers
    threeScene.registerInteractive(
      this.kathghara1,
      () => {
        if (this.onSelectKathghara1) this.onSelectKathghara1();
      },
      (hovered) => {
        this.setHighlight(this.kathghara1, hovered, 0xd4af37);
      }
    );

    threeScene.registerInteractive(
      this.kathghara2,
      () => {
        if (this.onSelectKathghara2) this.onSelectKathghara2();
      },
      (hovered) => {
        this.setHighlight(this.kathghara2, hovered, 0x10b981);
      }
    );

    // Register screen projection updater for 2D floating tags
    threeScene.registerUpdatable(() => {
      this.updateScreenTags();
    });

    this.isBuilt = true;
    console.log('[Kathgharas] Two interactive wooden kathgharas initialized.');
  }

  createKathgharaModel(id, accentColor) {
    const root = new THREE.Group();
    root.name = id;

    // High-Fidelity Teak & Brass PBR Materials
    const teakPBR = createTeakWoodPBR(512, 512);
    const teakMat = new THREE.MeshStandardMaterial({
      color: 0x482414,
      map: teakPBR.map,
      normalMap: teakPBR.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: teakPBR.roughnessMap,
      roughness: 0.48,
      metalness: 0.05
    });

    const brassPBR = createBrassPBR(256, 256);
    const brassMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      map: brassPBR.map,
      normalMap: brassPBR.normalMap,
      roughness: 0.28,
      metalness: 0.85
    });

    // 1. Elevated Wooden Base Plinth (Width: 6.8, Depth: 6.8, Height: 1.2)
    const baseGeo = new THREE.BoxGeometry(6.8, 1.2, 6.8);
    const baseMesh = new THREE.Mesh(baseGeo, teakMat);
    baseMesh.position.set(0, 0.6, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    root.add(baseMesh);

    // 2. Corner Pillars (4 Square Fluted Posts)
    const postGeo = new THREE.BoxGeometry(0.5, 6.8, 0.5);
    const postPositions = [
      [-3.1, -3.1],
      [3.1, -3.1],
      [-3.1, 3.1],
      [3.1, 3.1]
    ];

    postPositions.forEach(([x, z]) => {
      const post = new THREE.Mesh(postGeo, teakMat);
      post.position.set(x, 4.6, z);
      post.castShadow = true;
      root.add(post);

      // Brass Finial Cap atop corner post
      const capGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const cap = new THREE.Mesh(capGeo, brassMat);
      cap.position.set(x, 8.2, z);
      root.add(cap);
    });

    // 3. Vertical Baluster Spindles (Back & Two Sides)
    const spindleGeo = new THREE.CylinderGeometry(0.12, 0.12, 5.8, 12);

    // Back Side Spindles
    for (let i = -2.4; i <= 2.4; i += 0.8) {
      const s = new THREE.Mesh(spindleGeo, teakMat);
      s.position.set(i, 4.5, -3.1);
      s.castShadow = true;
      root.add(s);
    }

    // Left Side Spindles
    for (let i = -2.4; i <= 2.4; i += 0.8) {
      const s = new THREE.Mesh(spindleGeo, teakMat);
      s.position.set(-3.1, 4.5, i);
      s.castShadow = true;
      root.add(s);
    }

    // Right Side Spindles
    for (let i = -2.4; i <= 2.4; i += 0.8) {
      const s = new THREE.Mesh(spindleGeo, teakMat);
      s.position.set(3.1, 4.5, i);
      s.castShadow = true;
      root.add(s);
    }

    // 4. Top Molded Handrail (U-shaped across 3 sides)
    const railMat = teakMat.clone();
    root.userData.railMat = railMat;

    // Back Rail
    const railBack = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.5, 0.6), railMat);
    railBack.position.set(0, 7.8, -3.1);
    railBack.castShadow = true;
    root.add(railBack);

    // Left Rail
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 6.8), railMat);
    railL.position.set(-3.1, 7.8, 0);
    railL.castShadow = true;
    root.add(railL);

    // Right Rail
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 6.8), railMat);
    railR.position.set(3.1, 7.8, 0);
    railR.castShadow = true;
    root.add(railR);

    // Front Brass Access Gate Bar
    const gateGeo = new THREE.CylinderGeometry(0.15, 0.15, 5.8, 16);
    const gate = new THREE.Mesh(gateGeo, brassMat);
    gate.position.set(0, 5.0, 3.1);
    gate.rotation.z = Math.PI / 2;
    gate.castShadow = true;
    root.add(gate);

    return root;
  }

  setHighlight(kathgharaGroup, isHovered, colorHex) {
    if (!kathgharaGroup || !kathgharaGroup.userData.railMat) return;
    if (isHovered) {
      kathgharaGroup.userData.railMat.emissive.setHex(colorHex);
      kathgharaGroup.userData.railMat.emissiveIntensity = 0.35;
    } else {
      kathgharaGroup.userData.railMat.emissive.setHex(0x000000);
      kathgharaGroup.userData.railMat.emissiveIntensity = 0.0;
    }
  }

  updateScreenTags() {
    if (!threeScene.courtroomGroup.visible || !threeScene.camera) return;

    this.projectTag(this.kathghara1, 'tagKathghara1', 8.5);
    this.projectTag(this.kathghara2, 'tagKathghara2', 8.5);
  }

  projectTag(object3D, tagElementId, yOffset = 8) {
    const el = document.getElementById(tagElementId);
    if (!el || !object3D) return;

    const wp = new THREE.Vector3();
    object3D.getWorldPosition(wp);
    wp.y += yOffset;

    // Check if behind camera
    const temp = wp.clone().project(threeScene.camera);
    if (temp.z > 1.0) {
      el.style.display = 'none';
      return;
    }

    const x = (temp.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(temp.y * 0.5) + 0.5) * window.innerHeight;

    el.style.display = 'flex';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }
}

export const kathgharasSystem = new KathgharasSystem();
