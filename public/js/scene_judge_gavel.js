/**
 * PRAMANA — Scene Three-Judge Bench & Interactive Ceremonial Gavel
 * High-Fidelity Anatomical Digital Reconstruction of the Three Judicial Figures:
 * - Chief Justice of India (Presiding Judge - Center)
 * - Two Companion Senior Justices (Left & Right)
 * Features:
 * - Natural Anatomical Head Sculpting, Organic Facial Contours, Eyes, and Distinguished Hair
 * - Authentic White Starched Legal Neckbands (Advocates'/Judges' Two-Tab Bands)
 * - Tailored Black Waistcoat and Silk Pleated Robes with Draped Bell Sleeves Resting on Desk
 * - Natural Seated Posture, Ergonomic Alignment with the Elevated Judicial Bench & Burgundy Chairs
 * - Chief Justice Holding Fine Gold Fountain Pen Above Case Briefs
 * - Multi-frequency Asynchronous Kinematic Idle Motion (Breathing, Head Turns, Reading Case Briefs)
 * - Interactive Rosewood Ceremonial Gavel with Sound-Block Strike & Audio Trigger
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';
import { audioSystem } from './audio.js';

class JudgeAndGavelSystem {
  constructor() {
    this.group = new THREE.Group();
    this.judgesGroup = new THREE.Group();
    this.gavelGroup = new THREE.Group();
    this.gavelHead = null;
    this.gavelSoundBlock = null;

    // 3 Judges array for independent kinematic updates
    this.judges = [];

    // Gavel strike animation state
    this.isStriking = false;
    this.strikeStartTime = 0;
    this.soundPlayed = false;

    this.isBuilt = false;
  }

  build() {
    if (this.isBuilt) return;

    threeScene.courtroomGroup.add(this.group);
    this.group.add(this.judgesGroup);
    this.group.add(this.gavelGroup);

    // 1. Build the Three Judicial Characters
    this.buildThreeJudgeBench();

    // 2. Build Interactive Rosewood Gavel on Chief Justice Desk
    this.buildGavel();

    // 3. Register Animation Loop for Multi-Character Kinematics
    threeScene.registerUpdatable((delta, time) => {
      this.update(delta, time);
    });

    this.isBuilt = true;
    console.log('[JudgeGavel] Three-Judge Judicial Bench and interactive gavel initialized.');
  }

  buildThreeJudgeBench() {
    // Judicial Attire Materials Palette
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x111317, // Heavy black judicial silk robe
      roughness: 0.85,
      metalness: 0.04
    });

    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c22, // Traditional buttoned black judicial waistcoat/coat
      roughness: 0.78,
      metalness: 0.05
    });

    const bandsMat = new THREE.MeshStandardMaterial({
      color: 0xfcfdff, // Crisp starched white legal neckbands
      roughness: 0.35,
      metalness: 0.0
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf4f7fa,
      roughness: 0.20,
      metalness: 0.0
    });

    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x221309, // Deep warm brown iris
      roughness: 0.15,
      metalness: 0.10
    });

    const skinTones = [
      0xbf9372, // Chief Justice warm olive-gold complexion
      0xb58666, // Left Companion Judge
      0xc6997b  // Right Companion Judge
    ];

    const hairTones = [
      0xd9dcde, // Chief Justice: Distinguished silver-white hair
      0x4a4d52, // Left Judge: Salt-and-pepper dark grey hair
      0x2c2e33  // Right Judge: Distinguished dark charcoal hair
    ];

    // Dais floor level is Y = 1.8. Bench desktop is at Y = 4.8.
    const benchConfigs = [
      { id: 'CJI',     x: 0,     y: 1.8, z: -27.6, rotY: 0,      scale: 1.04, isCJI: true,  seed: 0.0 },
      { id: 'J_LEFT',  x: -13.5, y: 1.8, z: -28.4, rotY: 0.14,  scale: 0.98, isCJI: false, seed: 2.4 },
      { id: 'J_RIGHT', x: 13.5,  y: 1.8, z: -28.4, rotY: -0.14, scale: 1.0,  isCJI: false, seed: 4.8 }
    ];

    benchConfigs.forEach((cfg, idx) => {
      const jGroup = new THREE.Group();
      jGroup.position.set(cfg.x, cfg.y, cfg.z);
      jGroup.rotation.y = cfg.rotY;
      jGroup.scale.set(cfg.scale, cfg.scale, cfg.scale);

      const skinMat = new THREE.MeshStandardMaterial({
        color: skinTones[idx],
        roughness: 0.58,
        metalness: 0.0
      });

      const lipsMat = new THREE.MeshStandardMaterial({
        color: idx === 0 ? 0x9b6b55 : 0x96634e,
        roughness: 0.60,
        metalness: 0.0
      });

      const hairMat = new THREE.MeshStandardMaterial({
        color: hairTones[idx],
        roughness: 0.82,
        metalness: 0.02
      });

      // Kinematic tracking references
      const parts = {
        id: cfg.id,
        isCJI: cfg.isCJI,
        seed: cfg.seed,
        root: jGroup,
        torso: null,
        head: null,
        neck: null,
        leftArm: null,
        rightArm: null
      };

      // 1. Lower Body / Seated Robed Base (resting on chair seat cushion)
      const seatBaseGeo = new THREE.BoxGeometry(3.6, 1.8, 3.2);
      const seatBase = new THREE.Mesh(seatBaseGeo, robeMat);
      seatBase.position.set(0, 1.2, 0);
      seatBase.castShadow = true;
      jGroup.add(seatBase);

      // 2. Torso / Buttoned Judicial Coat & Silk Pleated Robe
      // Local Y = 3.0 places torso right behind desktop (Y = 4.8 in chamber)
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, 2.8, 0);

      // Waistcoat / Coat (Tapered human torso)
      const coatGeo = new THREE.CylinderGeometry(1.5, 1.8, 2.6, 24);
      const coat = new THREE.Mesh(coatGeo, coatMat);
      coat.position.set(0, 0, 0);
      coat.castShadow = true;
      torsoGroup.add(coat);

      // Silk Robe Pleats draped across back and shoulders
      const robeBackGeo = new THREE.BoxGeometry(3.8, 3.2, 1.0);
      const robeBack = new THREE.Mesh(robeBackGeo, robeMat);
      robeBack.position.set(0, 0.1, -0.5);
      robeBack.castShadow = true;
      torsoGroup.add(robeBack);

      // Small Brass Judicial Waistcoat Buttons
      for (let b = -0.8; b <= 0.6; b += 0.45) {
        const btn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 }));
        btn.position.set(0, b, 1.45);
        torsoGroup.add(btn);
      }

      jGroup.add(torsoGroup);
      parts.torso = torsoGroup;

      // 3. Crisp White Advocate / Judicial Neckbands (Two Starched Tabs)
      // Located at neck base (local Y = 4.3), falling over the black waistcoat
      const wingCollarGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.4, 24);
      const wingCollar = new THREE.Mesh(wingCollarGeo, bandsMat);
      wingCollar.position.set(0, 4.35, 0.15);
      jGroup.add(wingCollar);

      const collarBandGeo = new THREE.BoxGeometry(1.6, 0.35, 0.2);
      const collarBand = new THREE.Mesh(collarBandGeo, bandsMat);
      collarBand.position.set(0, 4.35, 0.85);
      jGroup.add(collarBand);

      // The iconic Twin Tabs of the Indian Legal Attire
      [-0.32, 0.32].forEach(tx => {
        const tabGeo = new THREE.BoxGeometry(0.48, 1.4, 0.08);
        const tab = new THREE.Mesh(tabGeo, bandsMat);
        tab.position.set(tx, 3.65, 0.95);
        tab.rotation.x = -0.06;
        jGroup.add(tab);
      });

      // 4. Neck
      const neckGeo = new THREE.CylinderGeometry(0.58, 0.68, 0.8, 24);
      const neck = new THREE.Mesh(neckGeo, skinMat);
      neck.position.set(0, 4.7, 0.15);
      jGroup.add(neck);
      parts.neck = neck;

      // 5. Articulated Head & Natural Sculpted Human Facial Contours
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 5.5, 0.2);

      // Cranium / Face (Organic smooth ellipsoidal skull)
      const skullGeo = new THREE.SphereGeometry(0.92, 32, 24);
      skullGeo.scale(0.92, 1.15, 1.0);
      const skull = new THREE.Mesh(skullGeo, skinMat);
      skull.castShadow = true;
      headGroup.add(skull);

      // Brow Ridge & Forehead
      const browGeo = new THREE.BoxGeometry(1.25, 0.2, 0.4);
      const brow = new THREE.Mesh(browGeo, skinMat);
      brow.position.set(0, 0.22, 0.72);
      headGroup.add(brow);

      // Sculpted Natural Nose
      const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.5, 12), skinMat);
      noseBridge.position.set(0, 0.05, 0.92);
      noseBridge.rotation.x = -0.22;
      headGroup.add(noseBridge);

      const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), skinMat);
      noseTip.position.set(0, -0.12, 0.98);
      headGroup.add(noseTip);

      // Realistic Almond Eyes & Sclera
      [-0.36, 0.36].forEach(ex => {
        // Eye Sclera (White of the eye)
        const eyeSclera = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), eyeWhiteMat);
        eyeSclera.position.set(ex, 0.15, 0.82);
        headGroup.add(eyeSclera);

        // Iris & Pupil
        const iris = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), irisMat);
        iris.position.set(ex, 0.15, 0.92);
        headGroup.add(iris);

        // Upper Eyelid Crease
        const lid = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.1), skinMat);
        lid.position.set(ex, 0.25, 0.86);
        headGroup.add(lid);
      });

      // Sculpted Upper & Lower Lips
      const lipsGeo = new THREE.BoxGeometry(0.55, 0.12, 0.25);
      const lips = new THREE.Mesh(lipsGeo, lipsMat);
      lips.position.set(0, -0.38, 0.86);
      headGroup.add(lips);

      // Defined Chin & Jawline
      const chinGeo = new THREE.SphereGeometry(0.35, 16, 16);
      chinGeo.scale(1.0, 0.75, 0.9);
      const chin = new THREE.Mesh(chinGeo, skinMat);
      chin.position.set(0, -0.62, 0.76);
      headGroup.add(chin);

      // Distinguished Judicial Hair (Curving naturally over cranium)
      const hairGeo = new THREE.SphereGeometry(0.98, 32, 24, 0, Math.PI * 2, 0, Math.PI / 1.7);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 0.15, -0.06);
      headGroup.add(hair);

      // Natural Sideburns & Temples
      [-0.82, 0.82].forEach(sx => {
        const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.75, 0.45), hairMat);
        sideburn.position.set(sx, -0.15, 0.18);
        headGroup.add(sideburn);
      });

      jGroup.add(headGroup);
      parts.head = headGroup;

      // 6. Robed Arms & Flowing Pleated Bell Sleeves
      // Local Y = 3.0 matches desktop height (Y = 4.8 in chamber)
      // Left Arm: resting forward on desk blotter
      const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 1.8, 16), robeMat);
      lUpperArm.position.set(-1.8, 3.6, 0.5);
      lUpperArm.rotation.x = 0.55;
      lUpperArm.rotation.z = 0.25;
      lUpperArm.castShadow = true;
      jGroup.add(lUpperArm);

      const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 2.0, 16), robeMat);
      lForearm.position.set(-1.4, 3.08, 1.7);
      lForearm.rotation.x = Math.PI / 2;
      lForearm.rotation.y = -0.20;
      lForearm.castShadow = true;
      jGroup.add(lForearm);
      parts.leftArm = lForearm;

      // Sculpted Left Hand resting flat on desk blotter
      const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.95), skinMat);
      lHand.position.set(-1.3, 3.08, 2.65);
      lHand.rotation.y = -0.15;
      jGroup.add(lHand);

      // Right Arm: resting forward on desk briefs
      const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 1.8, 16), robeMat);
      rUpperArm.position.set(1.8, 3.6, 0.5);
      rUpperArm.rotation.x = 0.55;
      rUpperArm.rotation.z = -0.25;
      rUpperArm.castShadow = true;
      jGroup.add(rUpperArm);

      const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 2.0, 16), robeMat);
      rForearm.position.set(1.4, 3.08, 1.7);
      rForearm.rotation.x = Math.PI / 2;
      rForearm.rotation.y = 0.20;
      rForearm.castShadow = true;
      jGroup.add(rForearm);
      parts.rightArm = rForearm;

      // Sculpted Right Hand
      const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.95), skinMat);
      rHand.position.set(1.3, 3.08, 2.65);
      rHand.rotation.y = 0.15;
      jGroup.add(rHand);

      // Gold Fountain Pen in Chief Justice's Hand
      if (cfg.isCJI) {
        const penGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.1, 12);
        const penMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.92, roughness: 0.18 });
        const pen = new THREE.Mesh(penGeo, penMat);
        pen.position.set(1.4, 3.16, 2.75);
        pen.rotation.x = Math.PI / 3.2;
        pen.rotation.z = -Math.PI / 8;
        jGroup.add(pen);
      }

      this.judgesGroup.add(jGroup);
      this.judges.push(parts);
    });
  }

  buildGavel() {
    const rosewoodMat = new THREE.MeshStandardMaterial({
      color: 0x361609, // Dark Indian Rosewood
      roughness: 0.38,
      metalness: 0.05
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Polished Brass Accents
      roughness: 0.25,
      metalness: 0.85
    });

    // Resting directly on right side of Chief Justice desktop (Y = 4.85, X = 3.6, Z = -25.2)
    this.gavelGroup.position.set(3.6, 4.88, -25.2);

    // Turned Rosewood Sounding Block (Stepped Circular Base)
    const blockGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.35, 32);
    this.gavelSoundBlock = new THREE.Mesh(blockGeo, rosewoodMat);
    this.gavelSoundBlock.position.set(0, 0.18, 0);
    this.gavelSoundBlock.castShadow = true;
    this.gavelSoundBlock.receiveShadow = true;
    this.gavelGroup.add(this.gavelSoundBlock);

    // Brass Inlay Ring on Sound Block
    const blockRingGeo = new THREE.TorusGeometry(1.4, 0.08, 8, 32);
    const blockRing = new THREE.Mesh(blockRingGeo, brassMat);
    blockRing.rotation.x = Math.PI / 2;
    blockRing.position.set(0, 0.36, 0);
    this.gavelGroup.add(blockRing);

    // Gavel Assembly (Pivot at handle base)
    this.gavelPivot = new THREE.Group();
    this.gavelPivot.position.set(0, 0.36, 0);
    this.gavelGroup.add(this.gavelPivot);

    // Gavel Turned Handle
    const handleGeo = new THREE.CylinderGeometry(0.12, 0.18, 3.2, 16);
    const handle = new THREE.Mesh(handleGeo, rosewoodMat);
    handle.position.set(0, 0.2, 1.6);
    handle.rotation.x = Math.PI / 2;
    handle.castShadow = true;
    this.gavelPivot.add(handle);

    // Gavel Head (Turned cylindrical mallet)
    const headGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.6, 24);
    this.gavelHead = new THREE.Mesh(headGeo, rosewoodMat);
    this.gavelHead.position.set(0, 0.2, 0);
    this.gavelHead.rotation.z = Math.PI / 2;
    this.gavelHead.castShadow = true;
    this.gavelPivot.add(this.gavelHead);

    // Dual Brass Rings on Mallet Head
    [-0.45, 0.45].forEach(bx => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 24), brassMat);
      band.position.set(bx, 0.2, 0);
      band.rotation.z = Math.PI / 2;
      this.gavelPivot.add(band);
    });

    // Register Gavel as interactive click target
    threeScene.registerInteractive(
      this.gavelGroup,
      () => {
        this.strikeGavel();
      },
      (isHovered) => {
        this.gavelSoundBlock.material.color.setHex(isHovered ? 0x5a2512 : 0x361609);
      }
    );
  }

  strikeGavel() {
    if (this.isStriking) return;
    this.isStriking = true;
    this.strikeStartTime = performance.now();
  }

  update(delta, time) {
    if (!threeScene.courtroomGroup.visible) return;

    // 1. Multi-Character Judicial Idle Kinematics
    this.judges.forEach((j, idx) => {
      const t = time + j.seed;

      // A. Natural Rhythmic Respiration (Chest Breathing)
      if (j.torso) {
        const breathFreq = 1.1 + (idx * 0.20);
        const breath = Math.sin(t * breathFreq) * 0.018;
        j.torso.scale.set(1 + breath, 1 + breath * 0.5, 1 + breath);
      }

      // B. Asynchronous Head Turns & Thoughtful Judicial Movements
      if (j.head) {
        if (j.isCJI) {
          // Chief Justice: Contemplative, looking between advocates and documents
          j.head.rotation.y = Math.sin(t * 0.45) * 0.09;
          j.head.rotation.x = Math.sin(t * 0.70) * 0.04 + 0.03;
        } else if (j.id === 'J_LEFT') {
          // Left Judge: Reading case brief, head tilted downward, glancing up periodically
          j.head.rotation.y = Math.sin(t * 0.35) * 0.07 + 0.10; // Inward bias toward bench center
          j.head.rotation.x = Math.sin(t * 0.60) * 0.05 + 0.10; // Looking down at documents
        } else {
          // Right Judge: Attentive posture watching speaking lectern
          j.head.rotation.y = Math.sin(t * 0.40) * 0.08 - 0.10; // Inward bias toward lectern
          j.head.rotation.x = Math.sin(t * 0.55) * 0.04;
        }
      }
    });

    // 2. Interactive Gavel Strike Animation Loop
    if (this.isStriking && this.gavelPivot) {
      const elapsed = (performance.now() - this.strikeStartTime) / 1000;
      const duration = 0.65;

      if (elapsed < 0.25) {
        // Phase 1: Deliberate gavel raise
        const t = elapsed / 0.25;
        this.gavelPivot.rotation.x = -Math.sin(t * Math.PI / 2) * 0.75;
      } else if (elapsed < 0.35) {
        // Phase 2: Decisive downward strike
        const t = (elapsed - 0.25) / 0.1;
        this.gavelPivot.rotation.x = -0.75 + t * 0.75;
        if (t >= 0.9 && !this.soundPlayed) {
          audioSystem.playGavelStrike();
          this.soundPlayed = true;
        }
      } else if (elapsed < duration) {
        // Phase 3: Natural wood rebound settling back onto sound block
        const t = (elapsed - 0.35) / (duration - 0.35);
        this.gavelPivot.rotation.x = -Math.sin(t * Math.PI) * 0.08;
      } else {
        // Strike cycle complete
        this.gavelPivot.rotation.x = 0;
        this.isStriking = false;
        this.soundPlayed = false;
      }
    } else if (this.gavelPivot) {
      this.gavelPivot.rotation.z = Math.sin(time * 0.8) * 0.006;
    }
  }
}

export const judgeGavel = new JudgeAndGavelSystem();
