/**
 * PRAMANA — Scene Courtroom Interior Architecture (Milestone 5)
 * Detailed 3D Courtroom inspired by Courtroom No. 1, Supreme Court of India.
 * Includes Elevated Curved Teak Bench, National Seal Crest, Advocate Podiums,
 * Coffered Ceilings, Brass Chandeliers, and Spectator Seating.
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';
import { createWoodTexture, createMarbleTexture } from './procedural_textures.js';

class CourtroomScene {
  constructor() {
    this.group = threeScene.courtroomGroup;
    this.isBuilt = false;
  }

  build() {
    if (this.isBuilt) return;

    // Procedural PBR Textures
    const teakWoodTex = createWoodTexture('#482414', '#261005', 512, 512);
    teakWoodTex.repeat.set(4, 2);

    const darkTrimTex = createWoodTexture('#2b1409', '#150803', 512, 512);
    darkTrimTex.repeat.set(6, 2);

    const floorMarbleTex = createMarbleTexture('#dedad2', '#a09789', 512, 512);
    floorMarbleTex.repeat.set(10, 12);

    // Materials Palette
    const teakWoodMat = new THREE.MeshStandardMaterial({
      color: 0x482414, // Rich Indian Teak
      map: teakWoodTex,
      bumpMap: teakWoodTex,
      bumpScale: 0.35,
      roughness: 0.38,
      metalness: 0.08
    });

    const darkTrimWoodMat = new THREE.MeshStandardMaterial({
      color: 0x2b1409,
      map: darkTrimTex,
      bumpMap: darkTrimTex,
      bumpScale: 0.4,
      roughness: 0.45,
      metalness: 0.05
    });

    const floorMarbleMat = new THREE.MeshStandardMaterial({
      color: 0xdcd6cd, // Honed courtroom stone floor
      map: floorMarbleTex,
      bumpMap: floorMarbleTex,
      bumpScale: 0.2,
      roughness: 0.28,
      metalness: 0.04
    });

    const wallPanelMat = new THREE.MeshStandardMaterial({
      color: 0x5a321d, // Acoustic teak wall paneling
      roughness: 0.55,
      metalness: 0.04
    });

    const wallPlasterMat = new THREE.MeshStandardMaterial({
      color: 0xeee9dd, // Upper acoustic plaster
      roughness: 0.8,
      metalness: 0.0
    });

    const goldBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.8
    });

    const leatherGreenMat = new THREE.MeshStandardMaterial({
      color: 0x163321, // Judicial green leather upholstery
      roughness: 0.6,
      metalness: 0.1
    });

    // 1. Courtroom Chamber Floor & Walls (Width: 100, Length: 120, Height: 35)
    const floorGeo = new THREE.PlaneGeometry(100, 120);
    const floor = new THREE.Mesh(floorGeo, floorMarbleMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Front/Rear/Side Walls
    const backWallGeo = new THREE.BoxGeometry(100, 35, 2);
    const backWall = new THREE.Mesh(backWallGeo, wallPlasterMat);
    backWall.position.set(0, 17.5, -45);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    // Teak Wainscoting / Wall Paneling along back wall (lower 16 units)
    const wainscotGeo = new THREE.BoxGeometry(98, 16, 2.4);
    const wainscot = new THREE.Mesh(wainscotGeo, wallPanelMat);
    wainscot.position.set(0, 8, -44.2);
    wainscot.receiveShadow = true;
    this.group.add(wainscot);

    // Side Walls
    const leftWallGeo = new THREE.BoxGeometry(2, 35, 120);
    const leftWall = new THREE.Mesh(leftWallGeo, wallPlasterMat);
    leftWall.position.set(-50, 17.5, 0);
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    const rightWallGeo = new THREE.BoxGeometry(2, 35, 120);
    const rightWall = new THREE.Mesh(rightWallGeo, wallPlasterMat);
    rightWall.position.set(50, 17.5, 0);
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // Coffered Ceiling with Beams
    const ceilingGeo = new THREE.PlaneGeometry(100, 120);
    const ceiling = new THREE.Mesh(ceilingGeo, darkTrimWoodMat);
    ceiling.position.set(0, 35, 0);
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    // 2. Supreme Court National Seal Crest behind Bench
    // Circular Gold Emblem with Ashoka Capital representation
    const sealGeo = new THREE.CylinderGeometry(5.5, 5.5, 0.6, 48);
    const seal = new THREE.Mesh(sealGeo, goldBrassMat);
    seal.rotation.x = Math.PI / 2;
    seal.position.set(0, 18, -43.2);
    seal.castShadow = true;
    this.group.add(seal);

    // Seal Motto Banner: "यतो धर्मस्ततो जयः"
    const mottoGeo = new THREE.BoxGeometry(18, 2.2, 0.4);
    const motto = new THREE.Mesh(mottoGeo, goldBrassMat);
    motto.position.set(0, 11, -43.2);
    this.group.add(motto);

    // 3. Elevated Judicial Dais & Curved Teak Bench
    // Dais Platform (Elevated 2.2 units above courtroom floor)
    const daisGeo = new THREE.BoxGeometry(60, 2.2, 28);
    const dais = new THREE.Mesh(daisGeo, darkTrimWoodMat);
    dais.position.set(0, 1.1, -28);
    dais.receiveShadow = true;
    this.group.add(dais);

    // Dais Carpet (Rich Burgundy/Crimson)
    const carpetGeo = new THREE.PlaneGeometry(58, 26);
    const carpetMat = new THREE.MeshStandardMaterial({ color: 0x4a121a, roughness: 0.9 });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.position.set(0, 2.25, -28);
    carpet.rotation.x = -Math.PI / 2;
    carpet.receiveShadow = true;
    this.group.add(carpet);

    // The Curved Judicial Bench
    // Segmented into 3 curved facets
    const centerBenchGeo = new THREE.BoxGeometry(26, 6.5, 4.5);
    const centerBench = new THREE.Mesh(centerBenchGeo, teakWoodMat);
    centerBench.position.set(0, 5.45, -20);
    centerBench.castShadow = true;
    centerBench.receiveShadow = true;
    this.group.add(centerBench);

    const leftBenchWing = new THREE.Mesh(new THREE.BoxGeometry(14, 6.5, 4.5), teakWoodMat);
    leftBenchWing.position.set(-18.5, 5.45, -22);
    leftBenchWing.rotation.y = Math.PI / 12;
    leftBenchWing.castShadow = true;
    this.group.add(leftBenchWing);

    const rightBenchWing = new THREE.Mesh(new THREE.BoxGeometry(14, 6.5, 4.5), teakWoodMat);
    rightBenchWing.position.set(18.5, 5.45, -22);
    rightBenchWing.rotation.y = -Math.PI / 12;
    rightBenchWing.castShadow = true;
    this.group.add(rightBenchWing);

    // Green Leather Judicial Blotters / Desk Pads atop bench
    const blotterGeo = new THREE.BoxGeometry(10, 0.1, 3.2);
    const blotter = new THREE.Mesh(blotterGeo, leatherGreenMat);
    blotter.position.set(0, 8.75, -20);
    this.group.add(blotter);

    // High-Backed Chief Justice Chair behind center bench
    const chairBackGeo = new THREE.BoxGeometry(4.8, 8.5, 1.0);
    const chairBack = new THREE.Mesh(chairBackGeo, leatherGreenMat);
    chairBack.position.set(0, 7.8, -26.5);
    chairBack.castShadow = true;
    this.group.add(chairBack);

    const chairFrameGeo = new THREE.BoxGeometry(5.2, 9.0, 1.2);
    const chairFrame = new THREE.Mesh(chairFrameGeo, teakWoodMat);
    chairFrame.position.set(0, 7.8, -26.8);
    this.group.add(chairFrame);

    const chairSeatGeo = new THREE.BoxGeometry(4.8, 1.2, 4.5);
    const chairSeat = new THREE.Mesh(chairSeatGeo, leatherGreenMat);
    chairSeat.position.set(0, 4.2, -25.2);
    chairSeat.castShadow = true;
    this.group.add(chairSeat);

    // 4. Advocate Bar Tables & Podiums (in front of Bench)
    // Left Advocate Table (Petitioner Senior Counsel)
    const petTableGeo = new THREE.BoxGeometry(22, 5.2, 5);
    const petTable = new THREE.Mesh(petTableGeo, teakWoodMat);
    petTable.position.set(-16, 2.6, -4);
    petTable.castShadow = true;
    petTable.receiveShadow = true;
    this.group.add(petTable);

    // Right Advocate Table (Respondent Senior Counsel)
    const resTableGeo = new THREE.BoxGeometry(22, 5.2, 5);
    const resTable = new THREE.Mesh(resTableGeo, teakWoodMat);
    resTable.position.set(16, 2.6, -4);
    resTable.castShadow = true;
    resTable.receiveShadow = true;
    this.group.add(resTable);

    // Central Advocate Lectern / Speaking Podium
    const podiumGeo = new THREE.BoxGeometry(4.2, 7.2, 3.5);
    const podium = new THREE.Mesh(podiumGeo, teakWoodMat);
    podium.position.set(0, 3.6, -8);
    podium.castShadow = true;
    this.group.add(podium);

    // Legal Dossiers & Case Briefs on Advocate Tables (Indian Court Basta Folders)
    const fileDossierMat = new THREE.MeshStandardMaterial({ color: 0xf0ebd8, roughness: 0.6 });
    const ribbonRedMat = new THREE.MeshStandardMaterial({ color: 0x9e1a1a, roughness: 0.7 });

    const dossierGeo = new THREE.BoxGeometry(2.4, 0.35, 3.2);
    const ribbonGeo = new THREE.BoxGeometry(2.45, 0.38, 0.35);

    [-19, -14, 14, 19].forEach(x => {
      const file = new THREE.Mesh(dossierGeo, fileDossierMat);
      file.position.set(x, 5.4, -4);
      file.rotation.y = (x > 0 ? 0.08 : -0.08);
      file.castShadow = true;
      this.group.add(file);

      const ribbon = new THREE.Mesh(ribbonGeo, ribbonRedMat);
      ribbon.position.copy(file.position);
      ribbon.rotation.copy(file.rotation);
      this.group.add(ribbon);
    });

    // 5. Spectator Wooden Benches (Rows 1 to 4)
    for (let r = 0; r < 4; r++) {
      const z = 18 + r * 14;
      // Left Bench
      const benchL = new THREE.Mesh(new THREE.BoxGeometry(32, 4, 3.5), teakWoodMat);
      benchL.position.set(-22, 2, z);
      benchL.castShadow = true;
      this.group.add(benchL);

      // Right Bench
      const benchR = new THREE.Mesh(new THREE.BoxGeometry(32, 4, 3.5), teakWoodMat);
      benchR.position.set(22, 2, z);
      benchR.castShadow = true;
      this.group.add(benchR);
    }

    // 6. Brass Courtroom Chandeliers (Warm lighting points)
    const chandelierPositions = [
      new THREE.Vector3(-18, 26, -15),
      new THREE.Vector3(18, 26, -15),
      new THREE.Vector3(-18, 26, 15),
      new THREE.Vector3(18, 26, 15)
    ];

    chandelierPositions.forEach(pos => {
      const chanMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 0.4, 3.0, 16), goldBrassMat);
      chanMesh.position.copy(pos);
      this.group.add(chanMesh);

      const chanLight = new THREE.PointLight(0xffe6b8, 1.2, 45, 1.5);
      chanLight.position.set(pos.x, pos.y - 2, pos.z);
      this.group.add(chanLight);
    });

    this.isBuilt = true;
    console.log('[CourtroomScene] Courtroom interior architecture initialized.');
  }
}

export const courtroomScene = new CourtroomScene();
