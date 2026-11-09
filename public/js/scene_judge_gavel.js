/**
 * PRAMANA — Scene Judge Character & Interactive Gavel (Milestone 6)
 * Articulated fictional judge with natural idle kinematics (breathing, subtle head motion)
 * and interactive wooden gavel with sound-block strike animation.
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';
import { audioSystem } from './audio.js';

class JudgeAndGavelSystem {
  constructor() {
    this.group = new THREE.Group();
    this.judgeGroup = new THREE.Group();
    this.gavelGroup = new THREE.Group();
    this.gavelHead = null;
    this.gavelSoundBlock = null;

    // Judge body parts for kinematic idle motion
    this.headMesh = null;
    this.torsoMesh = null;
    this.leftArm = null;
    this.rightArm = null;

    // Gavel strike animation state
    this.isStriking = false;
    this.strikeStartTime = 0;

    this.isBuilt = false;
  }

  build() {
    if (this.isBuilt) return;

    // Add to courtroom
    threeScene.courtroomGroup.add(this.group);
    this.group.add(this.judgeGroup);
    this.group.add(this.gavelGroup);

    // 1. Build Fictional Non-Identifiable Judge Character
    this.buildJudgeCharacter();

    // 2. Build Interactive Rosewood Gavel on Bench
    this.buildGavel();

    // 3. Register Animation Loop
    threeScene.registerUpdatable((delta, time) => {
      this.update(delta, time);
    });

    this.isBuilt = true;
    console.log('[JudgeGavel] Judge character and interactive gavel initialized.');
  }

  buildJudgeCharacter() {
    // Judicial Attire Materials
    const robeBlackMat = new THREE.MeshStandardMaterial({
      color: 0x121418, // Traditional heavy black judicial robe
      roughness: 0.85,
      metalness: 0.05
    });

    const collarWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // White judicial neck-bands
      roughness: 0.5,
      metalness: 0.0
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xb58a68, // Stylized neutral tone
      roughness: 0.65,
      metalness: 0.0
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a, // Distinguished grey/dark hair
      roughness: 0.9,
      metalness: 0.0
    });

    // Positioning behind center bench
    this.judgeGroup.position.set(0, 4.2, -24.5);

    // Torso / Robed Body
    const torsoGeo = new THREE.CylinderGeometry(2.0, 2.6, 6.0, 16);
    this.torsoMesh = new THREE.Mesh(torsoGeo, robeBlackMat);
    this.torsoMesh.position.set(0, 3.2, 0);
    this.torsoMesh.castShadow = true;
    this.judgeGroup.add(this.torsoMesh);

    // White Judicial Neck-Bands
    const bandsGeo = new THREE.BoxGeometry(0.8, 1.8, 0.2);
    const bands = new THREE.Mesh(bandsGeo, collarWhiteMat);
    bands.position.set(0, 5.6, 1.9);
    this.judgeGroup.add(bands);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.7, 0.8, 1.0, 16);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 6.4, 0.2);
    this.judgeGroup.add(neck);

    // Head
    const headGeo = new THREE.SphereGeometry(1.2, 24, 24);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.set(0, 7.5, 0.3);
    this.headMesh.castShadow = true;
    this.judgeGroup.add(this.headMesh);

    // Hair
    const hairGeo = new THREE.SphereGeometry(1.28, 20, 20, 0, Math.PI * 2, 0, Math.PI / 1.8);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 7.7, 0.1);
    this.judgeGroup.add(hair);

    // Robed Shoulders & Arms resting forward toward the bench
    // Left Arm
    const armGeo = new THREE.CylinderGeometry(0.6, 0.8, 4.5, 12);
    this.leftArm = new THREE.Mesh(armGeo, robeBlackMat);
    this.leftArm.position.set(-2.4, 3.5, 1.5);
    this.leftArm.rotation.x = Math.PI / 3.8;
    this.leftArm.rotation.z = Math.PI / 12;
    this.leftArm.castShadow = true;
    this.judgeGroup.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Mesh(armGeo, robeBlackMat);
    this.rightArm.position.set(2.4, 3.5, 1.5);
    this.rightArm.rotation.x = Math.PI / 3.8;
    this.rightArm.rotation.z = -Math.PI / 12;
    this.rightArm.castShadow = true;
    this.judgeGroup.add(this.rightArm);

    // Hands resting on judicial blotter
    const handGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-2.0, 1.8, 3.8);
    this.judgeGroup.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(2.0, 1.8, 3.8);
    this.judgeGroup.add(rightHand);
  }

  buildGavel() {
    const rosewoodMat = new THREE.MeshStandardMaterial({
      color: 0x361609, // Turned Indian Rosewood
      roughness: 0.35,
      metalness: 0.1
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });

    // Resting position on right blotter of center bench
    this.gavelGroup.position.set(3.8, 8.8, -19.5);

    // Sounding Block (Circular stepped base)
    const blockGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.45, 32);
    this.gavelSoundBlock = new THREE.Mesh(blockGeo, rosewoodMat);
    this.gavelSoundBlock.position.set(0, 0.22, 0);
    this.gavelSoundBlock.castShadow = true;
    this.gavelSoundBlock.receiveShadow = true;
    this.gavelGroup.add(this.gavelSoundBlock);

    // Gavel Assembly (Pivot at handle base)
    this.gavelPivot = new THREE.Group();
    this.gavelPivot.position.set(0, 0.45, 0);
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

    // Brass accent bands on head
    const bandGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 24);
    const bandL = new THREE.Mesh(bandGeo, brassMat);
    bandL.position.set(-0.4, 0.2, 0);
    bandL.rotation.z = Math.PI / 2;
    this.gavelPivot.add(bandL);

    const bandR = new THREE.Mesh(bandGeo, brassMat);
    bandR.position.set(0.4, 0.2, 0);
    bandR.rotation.z = Math.PI / 2;
    this.gavelPivot.add(bandR);

    // Register Gavel as interactive object for clicks
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

    // 1. Natural Judge Idle Kinematics
    // Breathing: subtle chest/torso rhythmic expansion
    if (this.torsoMesh) {
      const breath = Math.sin(time * 1.8) * 0.025;
      this.torsoMesh.scale.set(1 + breath, 1 + breath * 0.5, 1 + breath);
    }

    // Subtle head movement (calm contemplation, slight nodding/turning)
    if (this.headMesh) {
      this.headMesh.rotation.y = Math.sin(time * 0.6) * 0.08;
      this.headMesh.rotation.x = Math.sin(time * 0.9) * 0.04;
    }

    // 2. Gavel Strike Animation
    if (this.isStriking && this.gavelPivot) {
      const elapsed = (performance.now() - this.strikeStartTime) / 1000;
      const duration = 0.65;

      if (elapsed < 0.25) {
        // Raise gavel up
        const t = elapsed / 0.25;
        this.gavelPivot.rotation.x = -Math.sin(t * Math.PI / 2) * 0.75;
      } else if (elapsed < 0.35) {
        // Swift decisive strike down
        const t = (elapsed - 0.25) / 0.1;
        this.gavelPivot.rotation.x = -0.75 + t * 0.75;
        if (t >= 0.9 && !this.soundPlayed) {
          audioSystem.playGavelStrike();
          this.soundPlayed = true;
        }
      } else if (elapsed < duration) {
        // Minor rebound resting back on block
        const t = (elapsed - 0.35) / (duration - 0.35);
        this.gavelPivot.rotation.x = -Math.sin(t * Math.PI) * 0.08;
      } else {
        // Finished
        this.gavelPivot.rotation.x = 0;
        this.isStriking = false;
        this.soundPlayed = false;
      }
    } else if (this.gavelPivot) {
      // Gentle idle vibration/sheen
      this.gavelPivot.rotation.z = Math.sin(time * 0.8) * 0.01;
    }
  }
}

export const judgeGavel = new JudgeAndGavelSystem();
