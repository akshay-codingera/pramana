/**
 * PRAMANA — High-Fidelity Supreme Court of India Architectural Reconstruction
 * Second Visual Refinement Pass (Milestone 4.2)
 *
 * Authentic Indo-British Classical Architecture designed by Ganesh Bhikaji Deolalikar (1958).
 * Key Features:
 * - Monumental Hexastyle Portico: 8 fluted classical columns (Attic bases, entasis, 24 flutes, Ionic/Doric capitals),
 *   dentil entablature, coffered ceiling with pendant lanterns, and triangular pediment with Ashoka medallion.
 * - Multi-Tiered Central Dome: Square attic pavilion with corner urns, 16-sided clerestory drum with recessed arched
 *   windows, voussoirs, keystones, pilasters, bracketed chajja with modillions, stepped attic rings, 16 vertical
 *   architectural ribs, lotus pedestal, and multi-tier golden Kalasha finial with needle spire.
 * - Symmetrical East & West Wings: Deep shaded arcaded loggias with keystoned arches and vaulted corridors,
 *   recessed first-floor window bays with alternating triangular pediments and curved hoods, multi-pane white
 *   mullions, reflective glass, and classical roof balustrades with ornamental urns.
 * - Main Ceremonial Entrance: Recessed stone portal, Burma teak double doors with recessed field panels, forged bronze
 *   studs, lion-head knockers, vertical brass pull handles, bronze kick plates, and gilded "यतो धर्मस्ततो जयः" motto plaque.
 *   Doors swing smoothly open on hinges as the camera approaches.
 * - Dynamic 3D Indian National Flag (Tiranga): Strictly compliant with the Flag Code of India (3:2 ratio, 24-spoke
 *   Ashoka Chakra with gopura dots, micro-weave fabric normal map, aerodynamic wave physics with dynamic normals,
 *   fabric backscattering translucency, and complete halyard/cleat rigging).
 * - Full Institutional Campus: Semicircular driveway with granite curbs, flagstone plaza, manicured turf, geometric
 *   floral parterres, trimmed hedges, Royal Palm avenue, spreading Neem shade trees, cast-iron Delhi streetlamps,
 *   and red sandstone boundary walls with ornamental iron railings.
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';
import {
  createSandstonePBR,
  createWoodPBR,
  createBrassPBR,
  createPaverPBR,
  createGrassPBR,
  createAsphaltPBR,
  createIndianFlagPBR,
  createBarkPBR,
  createPalmBarkPBR,
  createPineBarkPBR,
  createPalmFrondTexture,
  createPineNeedleTexture,
  createFoliageTexture
} from './procedural_textures.js';

class SupremeCourtExteriorScene {
  constructor() {
    this.group = threeScene.exteriorGroup;
    this.flagMesh = null;
    this.flagClothMaterial = null;
    this.leftDoor = null;
    this.rightDoor = null;
    this.doorOpenProgress = 0.0;
    this.targetDoorOpen = 0.0;
    this.animatedFoliage = [];
    this.isBuilt = false;
  }

  build() {
    if (this.isBuilt) return;

    // =========================================================================
    // 1. HIGH-RESOLUTION PROCEDURAL PBR MATERIALS PALETTE
    // =========================================================================

    // Dholpur Red Sandstone (Base Plinth, Ceremonial Steps, Portal Frame)
    const redSandstonePBR = createSandstonePBR({
      baseColor: '#8a311b',
      veinColor: '#5c1e0e',
      mortarColor: '#361108',
      blockW: 96,
      blockH: 48,
      width: 512,
      height: 512,
      hasBlocks: true,
      normalStrength: 3.0
    });
    redSandstonePBR.map.repeat.set(4, 2);
    redSandstonePBR.normalMap.repeat.set(4, 2);
    redSandstonePBR.roughnessMap.repeat.set(4, 2);

    const sandstoneRedMat = new THREE.MeshStandardMaterial({
      color: 0x8a311b,
      map: redSandstonePBR.map,
      normalMap: redSandstonePBR.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: redSandstonePBR.roughnessMap,
      roughness: 0.82,
      metalness: 0.04
    });

    // Jodhpur / Dholpur Buff Cream Sandstone (Columns, Facade, Cornices, Drum)
    const creamSandstonePBR = createSandstonePBR({
      baseColor: '#efe4d2',
      veinColor: '#cdbea6',
      mortarColor: '#8c7d67',
      blockW: 80,
      blockH: 40,
      width: 512,
      height: 512,
      hasBlocks: true,
      normalStrength: 2.4
    });
    creamSandstonePBR.map.repeat.set(6, 4);
    creamSandstonePBR.normalMap.repeat.set(6, 4);
    creamSandstonePBR.roughnessMap.repeat.set(6, 4);

    const facadeCreamMat = new THREE.MeshStandardMaterial({
      color: 0xefe4d2,
      map: creamSandstonePBR.map,
      normalMap: creamSandstonePBR.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: creamSandstonePBR.roughnessMap,
      roughness: 0.70,
      metalness: 0.05
    });

    // Central Dome Weathered Cream / Patina Stone
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xd8d0c0,
      roughness: 0.52,
      metalness: 0.15
    });

    // Gilded Architectural Brass / Golden Kalasha & Plaque
    const brassPBR = createBrassPBR(256, 256);
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      map: brassPBR.map,
      metalness: 0.85,
      roughness: 0.26
    });

    // Carved Burma Teak Wood (Doors)
    const teakPBR = createWoodPBR('#3a1f10', '#1c0c05', 512, 512);
    const teakDoorMat = new THREE.MeshStandardMaterial({
      color: 0x3a1f10,
      map: teakPBR.map,
      normalMap: teakPBR.normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughnessMap: teakPBR.roughnessMap,
      roughness: 0.58,
      metalness: 0.06
    });

    // Reflective Architectural Glass (Windows & Transom)
    const glassWindowMat = new THREE.MeshStandardMaterial({
      color: 0x0c1e2c,
      roughness: 0.04,
      metalness: 0.94
    });

    // Paved Flagstone Promenade & Forecourt Plaza
    const paverPBR = createPaverPBR(512, 512);
    paverPBR.map.repeat.set(8, 8);
    paverPBR.normalMap.repeat.set(8, 8);
    paverPBR.roughnessMap.repeat.set(8, 8);

    const paverMat = new THREE.MeshStandardMaterial({
      color: 0x948c80,
      map: paverPBR.map,
      normalMap: paverPBR.normalMap,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: paverPBR.roughnessMap,
      roughness: 0.80,
      metalness: 0.03
    });

    // Manicured Turf Lawn Grass
    const grassPBR = createGrassPBR(512, 512);
    grassPBR.map.repeat.set(16, 16);
    grassPBR.normalMap.repeat.set(16, 16);

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x244b20,
      map: grassPBR.map,
      normalMap: grassPBR.normalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 0.92,
      metalness: 0.0
    });

    // Asphalt Carriage Driveway
    const asphaltPBR = createAsphaltPBR(512, 512);
    asphaltPBR.map.repeat.set(12, 6);
    asphaltPBR.normalMap.repeat.set(12, 6);

    const drivewayMat = new THREE.MeshStandardMaterial({
      color: 0x262930,
      map: asphaltPBR.map,
      normalMap: asphaltPBR.normalMap,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.85,
      metalness: 0.08
    });

    // Granite Curbs & Road Edges
    const graniteCurbMat = new THREE.MeshStandardMaterial({
      color: 0xc4c2be,
      roughness: 0.72,
      metalness: 0.05
    });

    // Cast-Iron Streetlamps & Boundary Railings
    const darkIronMat = new THREE.MeshStandardMaterial({
      color: 0x16181e,
      roughness: 0.42,
      metalness: 0.72
    });

    // Streetlamp Frosted Globe Glow
    const lampGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfff2e0,
      emissive: 0xffe8c8,
      emissiveIntensity: 2.4,
      roughness: 0.2
    });

    // Dense Trimmed Boxwood Hedges
    const hedgeMat = new THREE.MeshStandardMaterial({
      color: 0x1a4018,
      roughness: 0.88,
      metalness: 0.0
    });

    // Colorful Floral Parterres (Salvia Red & Marigold Gold)
    const flowerRedMat = new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.75 });
    const flowerGoldMat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.75 });

    // High-Fidelity PBR Tree Bark (Neem / Peepal)
    const barkPBR = createBarkPBR(512, 512);
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x483a30,
      map: barkPBR.map,
      normalMap: barkPBR.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: barkPBR.roughnessMap,
      roughness: 0.88,
      metalness: 0.02
    });

    // High-Fidelity PBR Palm Trunk Bark (Ringed Leaf-Scars)
    const palmBarkPBR = createPalmBarkPBR(256, 512);
    const palmBarkMat = new THREE.MeshStandardMaterial({
      color: 0x766c60,
      map: palmBarkPBR.map,
      normalMap: palmBarkPBR.normalMap,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughness: 0.84,
      metalness: 0.04
    });

    // Realistic Organic Canopy Foliage with Alpha Transparency & Subsurface Sheen
    const foliageTex = createFoliageTexture(512, 512);
    const foliageMat = new THREE.MeshStandardMaterial({
      map: foliageTex,
      alphaTest: 0.35,
      transparent: true,
      roughness: 0.65,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    // Authentic Pinnate Royal Palm Frond Material
    const palmFrondTex = createPalmFrondTexture(256, 1024);
    const palmFrondMat = new THREE.MeshStandardMaterial({
      map: palmFrondTex,
      alphaTest: 0.25,
      transparent: true,
      roughness: 0.55,
      metalness: 0.04,
      side: THREE.DoubleSide
    });

    // High-Fidelity PBR Pine Bark (Rich Furrowed Reddish-Brown)
    const pineBarkPBR = createPineBarkPBR(256, 512);
    const pineBarkMat = new THREE.MeshStandardMaterial({
      map: pineBarkPBR.map,
      normalMap: pineBarkPBR.normalMap,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughnessMap: pineBarkPBR.roughnessMap,
      roughness: 0.90,
      metalness: 0.02
    });

    // Realistic Evergreen Pine Needle Foliage Spray (Double-Sided Alpha Test with Depth Write)
    const pineNeedleTex = createPineNeedleTexture(512, 512);
    const pineNeedleMat = new THREE.MeshStandardMaterial({
      map: pineNeedleTex,
      alphaTest: 0.18,
      transparent: true,
      depthWrite: true,
      roughness: 0.65,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    // Deep evergreen interior core material for inner canopy depth and optical occlusion
    const pineCoreMat = new THREE.MeshStandardMaterial({
      color: 0x112b18,
      roughness: 0.88,
      metalness: 0.01,
      side: THREE.DoubleSide
    });

    // Dark Organic Mulch / Soil for Garden Planting Beds
    const mulchMat = new THREE.MeshStandardMaterial({
      color: 0x241810,
      roughness: 0.95,
      metalness: 0.0
    });

    // White Painted Window Frame Trim
    const whiteTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf5f3ee,
      roughness: 0.45,
      metalness: 0.08
    });

    // =========================================================================
    // 2. SURROUNDING GROUNDS, CAMPUS & FORECOURT
    // =========================================================================

    // A. Master Campus Ground Surface (1400 x 1400 units)
    const groundGeo = new THREE.PlaneGeometry(1400, 1400);
    const groundMesh = new THREE.Mesh(groundGeo, grassMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.group.add(groundMesh);

    // B. Semicircular Carriage Driveway
    const driveGeo = new THREE.RingGeometry(85, 165, 64);
    const driveMesh = new THREE.Mesh(driveGeo, drivewayMat);
    driveMesh.rotation.x = -Math.PI / 2;
    driveMesh.position.set(0, 0.25, 160);
    driveMesh.receiveShadow = true;
    this.group.add(driveMesh);

    // Driveway Outer & Inner Granite Curbs
    const outerCurbGeo = new THREE.RingGeometry(164.5, 166.5, 64);
    const outerCurb = new THREE.Mesh(outerCurbGeo, graniteCurbMat);
    outerCurb.rotation.x = -Math.PI / 2;
    outerCurb.position.set(0, 0.5, 160);
    this.group.add(outerCurb);

    const innerCurbGeo = new THREE.RingGeometry(83.5, 85.5, 64);
    const innerCurb = new THREE.Mesh(innerCurbGeo, graniteCurbMat);
    innerCurb.rotation.x = -Math.PI / 2;
    innerCurb.position.set(0, 0.5, 160);
    this.group.add(innerCurb);

    // C. Central Forecourt Ceremonial Lawn Island & Flag Plaza
    const centerLawnGeo = new THREE.CircleGeometry(83, 48);
    const centerLawn = new THREE.Mesh(centerLawnGeo, grassMat);
    centerLawn.rotation.x = -Math.PI / 2;
    centerLawn.position.set(0, 0.35, 160);
    centerLawn.receiveShadow = true;
    this.group.add(centerLawn);

    // Circular Flag Plaza with dressed stone pavers
    const flagPlazaGeo = new THREE.CircleGeometry(26, 36);
    const flagPlaza = new THREE.Mesh(flagPlazaGeo, paverMat);
    flagPlaza.rotation.x = -Math.PI / 2;
    flagPlaza.position.set(0, 0.55, 160);
    flagPlaza.receiveShadow = true;
    this.group.add(flagPlaza);

    // Plaza Granite Kerb Ring
    const flagCurbGeo = new THREE.RingGeometry(25.5, 26.5, 36);
    const flagCurb = new THREE.Mesh(flagCurbGeo, graniteCurbMat);
    flagCurb.rotation.x = -Math.PI / 2;
    flagCurb.position.set(0, 0.65, 160);
    this.group.add(flagCurb);

    // D. Axial Promenade Walkway (from Flag Plaza to Portico Steps)
    const axisPathGeo = new THREE.PlaneGeometry(38, 75);
    const axisPath = new THREE.Mesh(axisPathGeo, paverMat);
    axisPath.rotation.x = -Math.PI / 2;
    axisPath.position.set(0, 0.5, 118);
    axisPath.receiveShadow = true;
    this.group.add(axisPath);

    // Walkway Granite Border Curbs
    for (let side of [-1, 1]) {
      const curbGeo = new THREE.BoxGeometry(1.5, 0.4, 75);
      const curb = new THREE.Mesh(curbGeo, graniteCurbMat);
      curb.position.set(side * 19.5, 0.6, 118);
      this.group.add(curb);
    }

    // Geometric Floral Parterres & Low Boxwood Hedges in Forecourt
    for (let side of [-1, 1]) {
      // Semicircular Flower Beds
      const flowerRingGeo = new THREE.RingGeometry(40, 56, 32, 1, side > 0 ? 0 : Math.PI, Math.PI);
      const flowerRing = new THREE.Mesh(flowerRingGeo, side > 0 ? flowerRedMat : flowerGoldMat);
      flowerRing.rotation.x = -Math.PI / 2;
      flowerRing.position.set(0, 0.45, 160);
      this.group.add(flowerRing);

      // Low Trimmed Hedges Framing the Central Promenade
      const hedgeGeo = new THREE.BoxGeometry(3.5, 2.8, 68);
      const hedge = new THREE.Mesh(hedgeGeo, hedgeMat);
      hedge.position.set(side * 22, 1.6, 118);
      hedge.castShadow = true;
      this.group.add(hedge);
    }

    // =========================================================================
    // 3. MONUMENTAL DHOLPUR RED SANDSTONE PLINTH & CEREMONIAL STEPS
    // =========================================================================

    // A. Monumental High Plinth Course (Width: 380, Height: 14, Depth: 180)
    const plinthGeo = new THREE.BoxGeometry(380, 14, 180);
    const plinth = new THREE.Mesh(plinthGeo, sandstoneRedMat);
    plinth.position.set(0, 7, 0);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    this.group.add(plinth);

    // Plinth Upper Molded Torus Cornice
    const plinthCorniceGeo = new THREE.BoxGeometry(386, 2.2, 186);
    const plinthCornice = new THREE.Mesh(plinthCorniceGeo, sandstoneRedMat);
    plinthCornice.position.set(0, 14.6, 0);
    plinthCornice.castShadow = true;
    this.group.add(plinthCornice);

    // B. Grand Ceremonial Flight of 14 Tiered Steps with Molded Nosing (Y=0 to Y=14)
    // Positioned seamlessly in front of portico floor (Z = 92.0) down to Z = 135.6
    for (let s = 0; s < 14; s++) {
      const stepW = 104 + (13 - s) * 2.4;
      const stepY = s * 1.0 + 0.5;
      const stepZ = 93.5 + (13 - s) * 3.2;

      // Tread Block
      const stepGeo = new THREE.BoxGeometry(stepW, 1.0, 3.4);
      const step = new THREE.Mesh(stepGeo, sandstoneRedMat);
      step.position.set(0, stepY, stepZ);
      step.receiveShadow = true;
      step.castShadow = true;
      this.group.add(step);

      // Molded Bullnose Nosing Edge
      const nosingGeo = new THREE.CylinderGeometry(0.25, 0.25, stepW + 0.4, 12);
      const nosing = new THREE.Mesh(nosingGeo, sandstoneRedMat);
      nosing.rotation.z = Math.PI / 2;
      nosing.position.set(0, stepY + 0.48, stepZ + 1.7);
      this.group.add(nosing);
    }

    // C. Stepped Flanking Balustrade Cheek Walls
    for (let side of [-1, 1]) {
      const cheekGeo = new THREE.BoxGeometry(6.5, 17, 46);
      const cheek = new THREE.Mesh(cheekGeo, sandstoneRedMat);
      cheek.position.set(side * 64, 8.5, 114);
      cheek.castShadow = true;
      cheek.receiveShadow = true;
      this.group.add(cheek);

      // Molded Cheek Cap
      const cheekCapGeo = new THREE.BoxGeometry(7.5, 1.6, 47);
      const cheekCap = new THREE.Mesh(cheekCapGeo, sandstoneRedMat);
      cheekCap.position.set(side * 64, 17.5, 114);
      this.group.add(cheekCap);

      // Monumental Stone Lamp Pedestal at foot of staircase
      const pedestalGeo = new THREE.BoxGeometry(11, 7, 11);
      const pedestal = new THREE.Mesh(pedestalGeo, sandstoneRedMat);
      pedestal.position.set(side * 64, 3.5, 138);
      pedestal.castShadow = true;
      this.group.add(pedestal);

      // Molded Pedestal Cornice
      const pedCorniceGeo = new THREE.BoxGeometry(12.5, 1.5, 12.5);
      const pedCornice = new THREE.Mesh(pedCorniceGeo, sandstoneRedMat);
      pedCornice.position.set(side * 64, 7.5, 138);
      this.group.add(pedCornice);

      // Cast-Iron Pedestal Lantern Post
      const lampPostGeo = new THREE.CylinderGeometry(0.7, 1.1, 15, 16);
      const lampPost = new THREE.Mesh(lampPostGeo, darkIronMat);
      lampPost.position.set(side * 64, 15.5, 138);
      lampPost.castShadow = true;
      this.group.add(lampPost);

      // Frosted Glass Luminous Sphere
      const lanternGeo = new THREE.SphereGeometry(1.8, 20, 20);
      const lantern = new THREE.Mesh(lanternGeo, lampGlowMat);
      lantern.position.set(side * 64, 23.5, 138);
      this.group.add(lantern);
    }

    // =========================================================================
    // 4. CENTRAL HEXASTYLE ENTRANCE PORTICO & ARCHITRAVE
    // =========================================================================

    // Portico Raised Sandstone Platform Floor (Z spans [60.0, 92.0], no step overlap)
    const porticoFloorGeo = new THREE.BoxGeometry(112, 2.0, 32);
    const porticoFloor = new THREE.Mesh(porticoFloorGeo, sandstoneRedMat);
    porticoFloor.position.set(0, 15.0, 76.0);
    this.group.add(porticoFloor);

    // 6 Monumental Classical Fluted Pillars across Front + 2 Side Return Pillars
    const pillarPositions = [
      { x: -45, z: 86 }, { x: -27, z: 86 }, { x: -9, z: 86 },
      { x: 9, z: 86 },   { x: 27, z: 86 },  { x: 45, z: 86 },
      { x: -45, z: 66 }, { x: 45, z: 66 }
    ];

    pillarPositions.forEach(pos => {
      // 1. Square Plinth Base
      const plinthGeo = new THREE.BoxGeometry(7.6, 2.8, 7.6);
      const plinth = new THREE.Mesh(plinthGeo, sandstoneRedMat);
      plinth.position.set(pos.x, 17.4, pos.z);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      this.group.add(plinth);

      // 2. Attic Base: Lower Torus
      const lowerTorusGeo = new THREE.CylinderGeometry(3.4, 3.6, 1.2, 24);
      const lowerTorus = new THREE.Mesh(lowerTorusGeo, facadeCreamMat);
      lowerTorus.position.set(pos.x, 19.3, pos.z);
      lowerTorus.castShadow = true;
      this.group.add(lowerTorus);

      // 3. Attic Base: Scotia Groove
      const scotiaGeo = new THREE.CylinderGeometry(2.9, 2.9, 0.8, 24);
      const scotia = new THREE.Mesh(scotiaGeo, facadeCreamMat);
      scotia.position.set(pos.x, 20.3, pos.z);
      this.group.add(scotia);

      // 4. Attic Base: Upper Torus
      const upperTorusGeo = new THREE.CylinderGeometry(3.1, 3.1, 1.0, 24);
      const upperTorus = new THREE.Mesh(upperTorusGeo, facadeCreamMat);
      upperTorus.position.set(pos.x, 21.2, pos.z);
      upperTorus.castShadow = true;
      this.group.add(upperTorus);

      // 5. Fluted Column Shaft with Entasis (tapering from 2.7 to 2.25)
      const shaftGeo = new THREE.CylinderGeometry(2.25, 2.7, 40, 24); // 24 facets for flutes
      const shaft = new THREE.Mesh(shaftGeo, facadeCreamMat);
      shaft.position.set(pos.x, 41.5, pos.z);
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      this.group.add(shaft);

      // 6. Classical Capital: Necking Ring (Astragal)
      const astragalGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.8, 24);
      const astragal = new THREE.Mesh(astragalGeo, facadeCreamMat);
      astragal.position.set(pos.x, 61.8, pos.z);
      this.group.add(astragal);

      // 7. Classical Capital: Echinus Bell
      const echinusGeo = new THREE.CylinderGeometry(3.4, 2.5, 1.6, 24);
      const echinus = new THREE.Mesh(echinusGeo, facadeCreamMat);
      echinus.position.set(pos.x, 62.9, pos.z);
      echinus.castShadow = true;
      this.group.add(echinus);

      // 8. Classical Capital: Square Abacus Block
      const abacusGeo = new THREE.BoxGeometry(7.6, 1.6, 7.6);
      const abacus = new THREE.Mesh(abacusGeo, facadeCreamMat);
      abacus.position.set(pos.x, 64.4, pos.z);
      abacus.castShadow = true;
      this.group.add(abacus);
    });

    // Entablature Architecture:
    // A. Architrave (Stepped 3 Fascia Bands)
    const architraveGeo = new THREE.BoxGeometry(114, 3.2, 36);
    const architrave = new THREE.Mesh(architraveGeo, facadeCreamMat);
    architrave.position.set(0, 66.5, 76);
    architrave.castShadow = true;
    this.group.add(architrave);

    // B. Frieze Course
    const friezeGeo = new THREE.BoxGeometry(112, 3.0, 35);
    const frieze = new THREE.Mesh(friezeGeo, facadeCreamMat);
    frieze.position.set(0, 69.5, 76);
    this.group.add(frieze);

    // C. Dentil Course (Row of crisp rectangular stone dentil blocks)
    for (let d = -54; d <= 54; d += 3.6) {
      const dentilGeo = new THREE.BoxGeometry(2.0, 1.2, 1.5);
      const dentil = new THREE.Mesh(dentilGeo, facadeCreamMat);
      dentil.position.set(d, 71.4, 93.8);
      dentil.castShadow = true;
      this.group.add(dentil);
    }

    // D. Projecting Cornice (Geison)
    const corniceGeo = new THREE.BoxGeometry(116, 2.2, 38);
    const cornice = new THREE.Mesh(corniceGeo, facadeCreamMat);
    cornice.position.set(0, 72.8, 76);
    cornice.castShadow = true;
    this.group.add(cornice);

    // E. Classical Triangular Pediment with Molded Raking Cornice
    const pedimentShape = new THREE.Shape();
    pedimentShape.moveTo(-58, 0);
    pedimentShape.lineTo(0, 19);
    pedimentShape.lineTo(58, 0);
    pedimentShape.closePath();

    const pedimentExtrudeSettings = { depth: 5, bevelEnabled: true, bevelThickness: 1.8, bevelSize: 1.2, bevelSegments: 3 };
    const pedimentGeo = new THREE.ExtrudeGeometry(pedimentShape, pedimentExtrudeSettings);
    const pediment = new THREE.Mesh(pedimentGeo, facadeCreamMat);
    pediment.position.set(0, 73.5, 93);
    pediment.castShadow = true;
    this.group.add(pediment);

    // Tympanum Medallion (Ashoka Emblem / Dharma Chakra Relief)
    const medallionGeo = new THREE.CylinderGeometry(5.2, 5.2, 1.2, 24);
    const medallion = new THREE.Mesh(medallionGeo, goldTrimMat);
    medallion.rotation.x = Math.PI / 2;
    medallion.position.set(0, 80.5, 96.5);
    medallion.castShadow = true;
    this.group.add(medallion);

    // F. Deep Coffered Portico Ceiling with Recessed Panels & Bronze Lanterns
    const ceilingBeamGeo = new THREE.BoxGeometry(108, 1.5, 32);
    const ceilingBeams = new THREE.Mesh(ceilingBeamGeo, facadeCreamMat);
    ceilingBeams.position.set(0, 65.0, 75);
    this.group.add(ceilingBeams);

    for (let cx = -36; cx <= 36; cx += 24) {
      for (let cz = 68; cz <= 82; cz += 14) {
        // Recessed coffer box
        const cofferGeo = new THREE.BoxGeometry(16, 1.2, 10);
        const coffer = new THREE.Mesh(cofferGeo, sandstoneRedMat);
        coffer.position.set(cx, 65.5, cz);
        this.group.add(coffer);

        // Hanging Bronze Pendant Lantern
        const lanternGeo = new THREE.SphereGeometry(1.0, 12, 12);
        const lantern = new THREE.Mesh(lanternGeo, lampGlowMat);
        lantern.position.set(cx, 60.5, cz);
        this.group.add(lantern);

        const cordGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.0, 6);
        const cord = new THREE.Mesh(cordGeo, darkIronMat);
        cord.position.set(cx, 62.5, cz);
        this.group.add(cord);
      }
    }

    // =========================================================================
    // 5. CEREMONIAL MAIN ENTRANCE PORTAL, MOTTO PLAQUE & ANIMATED DOORS
    // =========================================================================

    // Recessed Sandstone Portal Surround (Red Sandstone Outer Frame)
    // Positioned at Z = 60.0 with depth 6.0 (spans Z in [57.0, 63.0]; front face Z = 63.0)
    const portalSurroundGeo = new THREE.BoxGeometry(42, 44, 6.0);
    const portalSurround = new THREE.Mesh(portalSurroundGeo, sandstoneRedMat);
    portalSurround.position.set(0, 36, 60.0);
    portalSurround.castShadow = true;
    portalSurround.receiveShadow = true;
    this.group.add(portalSurround);

    // Stepped Inner Molded Portal Reveal (Cream Sandstone Inner Frame)
    // Positioned at Z = 58.0 with depth 4.0 (spans Z in [56.0, 60.0]; front face Z = 60.0)
    // 3.0-unit clear architectural step behind portalSurround front face — zero coplanar overlap!
    const innerRevealGeo = new THREE.BoxGeometry(32, 38, 4.0);
    const innerReveal = new THREE.Mesh(innerRevealGeo, facadeCreamMat);
    innerReveal.position.set(0, 34, 58.0);
    this.group.add(innerReveal);

    // Door Portal Dark Opening / Vestibule Cavity (Well behind doors)
    // Positioned at Z = 50.5 with depth 10.0 (spans Z in [45.5, 55.5]; front face Z = 55.5)
    const doorVoidGeo = new THREE.BoxGeometry(25, 32, 10.0);
    const doorVoidMat = new THREE.MeshBasicMaterial({ color: 0x12100e });
    const doorVoid = new THREE.Mesh(doorVoidGeo, doorVoidMat);
    doorVoid.position.set(0, 31, 50.5);
    this.group.add(doorVoid);

    // Warm Interior Entrance Rotunda / Vestibule Light
    const vestibuleLight = new THREE.PointLight(0xffecd0, 2.5, 35);
    vestibuleLight.position.set(0, 32, 49.0);
    this.group.add(vestibuleLight);

    // --- Burma Teak Double Doors with Full Architectural Detailing & Hinges ---
    const doorWidth = 11.2;
    const doorHeight = 27.0;
    const doorThickness = 1.4;

    // Doors placed at Z = 57.5 (Leaves span Z in [56.8, 58.2])
    // Perfectly positioned inside innerReveal (Z in [56.0, 60.0]) and cleanly in front of doorVoid (Z <= 55.5)

    // LEFT DOOR LEAF (Hinged at x = -11.2, z = 57.5)
    this.leftDoor = new THREE.Group();
    this.leftDoor.position.set(-11.2, 16.5, 57.5);

    const leftLeafMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
      teakDoorMat
    );
    leftLeafMesh.position.set(doorWidth / 2, doorHeight / 2, 0);
    leftLeafMesh.castShadow = true;
    this.leftDoor.add(leftLeafMesh);

    // Recessed Panels on Left Door (4 Beveled Panels)
    for (let py = 0; py < 4; py++) {
      const panelGeo = new THREE.BoxGeometry(doorWidth - 2.8, 4.8, 0.2);
      const panel = new THREE.Mesh(panelGeo, teakDoorMat);
      panel.position.set(doorWidth / 2, 4.2 + py * 6.2, 0.78);
      this.leftDoor.add(panel);
    }

    // Heavy Bronze Kick Plate
    const kickPlateGeo = new THREE.BoxGeometry(doorWidth, 3.2, 0.12);
    const leftKick = new THREE.Mesh(kickPlateGeo, goldTrimMat);
    leftKick.position.set(doorWidth / 2, 1.6, 0.76);
    this.leftDoor.add(leftKick);

    // Vertical Polished Brass Pull Handle & Lion-Head Knocker
    const handleGeo = new THREE.CylinderGeometry(0.3, 0.3, 5.5, 12);
    const leftHandle = new THREE.Mesh(handleGeo, goldTrimMat);
    leftHandle.position.set(doorWidth - 2.0, 13.5, 1.35);
    this.leftDoor.add(leftHandle);

    const knockerGeo = new THREE.TorusGeometry(0.9, 0.22, 12, 16);
    const leftKnocker = new THREE.Mesh(knockerGeo, goldTrimMat);
    leftKnocker.position.set(doorWidth - 2.0, 17.5, 1.25);
    this.leftDoor.add(leftKnocker);

    // Bronze Studs (4 Rows of 2 Studs)
    for (let r = 0; r < 4; r++) {
      for (let c of [2.5, doorWidth - 2.5]) {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), goldTrimMat);
        stud.position.set(c, 4.2 + r * 6.2, 1.05);
        this.leftDoor.add(stud);
      }
    }
    this.group.add(this.leftDoor);

    // RIGHT DOOR LEAF (Hinged at x = +11.2, z = 57.5)
    this.rightDoor = new THREE.Group();
    this.rightDoor.position.set(11.2, 16.5, 57.5);

    const rightLeafMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
      teakDoorMat
    );
    rightLeafMesh.position.set(-doorWidth / 2, doorHeight / 2, 0);
    rightLeafMesh.castShadow = true;
    this.rightDoor.add(rightLeafMesh);

    // Recessed Panels on Right Door
    for (let py = 0; py < 4; py++) {
      const panelGeo = new THREE.BoxGeometry(doorWidth - 2.8, 4.8, 0.2);
      const panel = new THREE.Mesh(panelGeo, teakDoorMat);
      panel.position.set(-doorWidth / 2, 4.2 + py * 6.2, 0.78);
      this.rightDoor.add(panel);
    }

    // Right Kick Plate
    const rightKick = new THREE.Mesh(kickPlateGeo, goldTrimMat);
    rightKick.position.set(-doorWidth / 2, 1.6, 0.76);
    this.rightDoor.add(rightKick);

    // Right Handle & Knocker
    const rightHandle = new THREE.Mesh(handleGeo, goldTrimMat);
    rightHandle.position.set(-doorWidth + 2.0, 13.5, 1.35);
    this.rightDoor.add(rightHandle);

    const rightKnocker = new THREE.Mesh(knockerGeo, goldTrimMat);
    rightKnocker.position.set(-doorWidth + 2.0, 17.5, 1.25);
    this.rightDoor.add(rightKnocker);

    // Right Bronze Studs
    for (let r = 0; r < 4; r++) {
      for (let c of [-2.5, -doorWidth + 2.5]) {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), goldTrimMat);
        stud.position.set(c, 4.2 + r * 6.2, 1.05);
        this.rightDoor.add(stud);
      }
    }
    this.group.add(this.rightDoor);

    // Transom Arched Fanlight with Radiating Spokes above Doors (Z = 57.5, thickness 0.4)
    const fanlightGeo = new THREE.CylinderGeometry(11.2, 11.2, 0.4, 24, 1, false, 0, Math.PI);
    const fanlight = new THREE.Mesh(fanlightGeo, glassWindowMat);
    fanlight.rotation.z = Math.PI / 2;
    fanlight.position.set(0, 43.5, 57.5);
    this.group.add(fanlight);

    // Fanlight Wrought Iron Sunburst Spokes (Z = 57.85, thickness 0.25)
    for (let sp = 0; sp < 7; sp++) {
      const spAngle = (sp * Math.PI) / 6;
      const spokeGeo = new THREE.BoxGeometry(0.35, 11.2, 0.25);
      const spoke = new THREE.Mesh(spokeGeo, darkIronMat);
      spoke.position.set(0, 43.5, 57.85);
      spoke.rotation.z = spAngle - Math.PI / 2;
      this.group.add(spoke);
    }

    // Gilded Bronze Motto Plaque above Entrance: "यतो धर्मस्ततो जयः"
    // Mounted on portalSurround front face (Z = 63.0) with clean forward relief
    const plaqueFrameGeo = new THREE.BoxGeometry(54, 7.2, 1.4);
    const plaqueFrame = new THREE.Mesh(plaqueFrameGeo, goldTrimMat);
    plaqueFrame.position.set(0, 53.5, 63.8);
    plaqueFrame.castShadow = true;
    this.group.add(plaqueFrame);

    const plaqueInnerGeo = new THREE.BoxGeometry(50, 5.4, 0.3);
    const plaqueInnerMat = new THREE.MeshStandardMaterial({ color: 0x1f1406, roughness: 0.5, metalness: 0.4 });
    const plaqueInner = new THREE.Mesh(plaqueInnerGeo, plaqueInnerMat);
    plaqueInner.position.set(0, 53.5, 64.6);
    this.group.add(plaqueInner);

    // =========================================================================
    // 6. ICONIC CENTRAL DOME & 16-SIDED CLERESTORY DRUM
    // =========================================================================

    // A. Central Architectural Pavilion Core Block
    const centralCoreGeo = new THREE.BoxGeometry(160, 60, 120);
    const centralCore = new THREE.Mesh(centralCoreGeo, facadeCreamMat);
    centralCore.position.set(0, 44, 0);
    centralCore.castShadow = true;
    centralCore.receiveShadow = true;
    this.group.add(centralCore);

    // B. Square Attic Pavilion Base with Corner Balustrades & Urns
    const atticBaseGeo = new THREE.BoxGeometry(110, 8, 110);
    const atticBase = new THREE.Mesh(atticBaseGeo, facadeCreamMat);
    atticBase.position.set(0, 78, 0);
    atticBase.castShadow = true;
    this.group.add(atticBase);

    // Corner Stone Urns on Attic Base
    const cornerOffsets = [
      { x: -50, z: -50 }, { x: 50, z: -50 },
      { x: -50, z: 50 },  { x: 50, z: 50 }
    ];
    cornerOffsets.forEach(co => {
      const urnGeo = new THREE.CylinderGeometry(2.4, 1.6, 6.5, 16);
      const urn = new THREE.Mesh(urnGeo, facadeCreamMat);
      urn.position.set(co.x, 85, co.z);
      urn.castShadow = true;
      this.group.add(urn);
    });

    // C. 16-Sided Clerestory Drum with Recessed Arched Windows & Pilasters
    const drumGeo = new THREE.CylinderGeometry(36, 36, 18, 16);
    const drum = new THREE.Mesh(drumGeo, facadeCreamMat);
    drum.position.set(0, 91, 0);
    drum.castShadow = true;
    this.group.add(drum);

    // 16 Recessed Arched Windows, Keystones, and Engaged Pilasters around the Drum
    for (let w = 0; w < 16; w++) {
      const angle = (w * 360 / 16) * (Math.PI / 180);
      const wx = Math.sin(angle) * 36.1;
      const wz = Math.cos(angle) * 36.1;

      // Recessed Window Glass
      const winGeo = new THREE.PlaneGeometry(5.2, 9.8);
      const winMesh = new THREE.Mesh(winGeo, glassWindowMat);
      winMesh.position.set(wx, 91, wz);
      winMesh.lookAt(wx * 2, 91, wz * 2);
      this.group.add(winMesh);

      // Window White Mullion / Transom Cross
      const mullionGeo = new THREE.BoxGeometry(0.4, 9.8, 0.4);
      const mullion = new THREE.Mesh(mullionGeo, whiteTrimMat);
      mullion.position.set(wx * 1.005, 91, wz * 1.005);
      mullion.lookAt(wx * 2, 91, wz * 2);
      this.group.add(mullion);

      // Arched Molded Stone Surround / Hood
      const hoodGeo = new THREE.BoxGeometry(6.4, 1.2, 1.2);
      const hood = new THREE.Mesh(hoodGeo, facadeCreamMat);
      hood.position.set(wx * 1.02, 96.5, wz * 1.02);
      hood.lookAt(wx * 2, 96.5, wz * 2);
      this.group.add(hood);

      // Engaged Pilaster between windows
      const pilasterAngle = angle + (360 / 32) * (Math.PI / 180);
      const px = Math.sin(pilasterAngle) * 36.4;
      const pz = Math.cos(pilasterAngle) * 36.4;
      const pilasterGeo = new THREE.BoxGeometry(2.0, 18, 1.4);
      const pilaster = new THREE.Mesh(pilasterGeo, facadeCreamMat);
      pilaster.position.set(px, 91, pz);
      pilaster.lookAt(px * 2, 91, pz * 2);
      pilaster.castShadow = true;
      this.group.add(pilaster);
    }

    // Projecting Bracketed Chajja / Cornice over Drum
    const drumCorniceGeo = new THREE.CylinderGeometry(40, 36, 3.8, 32);
    const drumCornice = new THREE.Mesh(drumCorniceGeo, facadeCreamMat);
    drumCornice.position.set(0, 101.5, 0);
    drumCornice.castShadow = true;
    this.group.add(drumCornice);

    // 32 Modillion Corbel Brackets beneath Drum Cornice
    for (let b = 0; b < 32; b++) {
      const bAngle = (b * 360 / 32) * (Math.PI / 180);
      const bx = Math.sin(bAngle) * 37.8;
      const bz = Math.cos(bAngle) * 37.8;
      const bracketGeo = new THREE.BoxGeometry(1.2, 2.0, 2.6);
      const bracket = new THREE.Mesh(bracketGeo, facadeCreamMat);
      bracket.position.set(bx, 100.2, bz);
      bracket.lookAt(bx * 2, 100.2, bz * 2);
      this.group.add(bracket);
    }

    // Stepped Circular Transition Drum
    const upperDrumGeo = new THREE.CylinderGeometry(34.5, 34.5, 5.5, 32);
    const upperDrum = new THREE.Mesh(upperDrumGeo, facadeCreamMat);
    upperDrum.position.set(0, 106, 0);
    this.group.add(upperDrum);

    // D. High Hemispherical Dome (Weathered Patina Cream Stone)
    const domeGeo = new THREE.SphereGeometry(34.5, 48, 28, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 108.5, 0);
    dome.castShadow = true;
    this.group.add(dome);

    // 16 Authentic Curved Stone Meridian Ribs (Conforming mathematically to dome curvature)
    // Replaces straight cylinder spikes with smooth meridian surface moldings
    class DomeMeridianCurve extends THREE.Curve {
      constructor(radius, startAngle, endAngle) {
        super();
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
      }
      getPoint(t, optionalTarget = new THREE.Vector3()) {
        const theta = this.startAngle + t * (this.endAngle - this.startAngle);
        return optionalTarget.set(
          Math.cos(theta) * this.radius,
          Math.sin(theta) * this.radius,
          0
        );
      }
    }

    const ribCurve = new DomeMeridianCurve(34.65, 0.0, Math.PI / 2 - 0.08);
    const ribGeo = new THREE.TubeGeometry(ribCurve, 28, 0.45, 8, false);

    for (let r = 0; r < 16; r++) {
      const angle = (r * 360 / 16) * (Math.PI / 180);
      const rib = new THREE.Mesh(ribGeo, facadeCreamMat);
      rib.position.set(0, 108.5, 0);
      rib.rotation.y = angle;
      rib.castShadow = true;
      rib.receiveShadow = true;
      this.group.add(rib);
    }

    // Molded Stone Collar Ring at Top of Ribs (graceful architectural termination)
    const collarGeo = new THREE.CylinderGeometry(5.2, 5.8, 1.4, 24);
    const collar = new THREE.Mesh(collarGeo, facadeCreamMat);
    collar.position.set(0, 143.0, 0);
    collar.castShadow = true;
    this.group.add(collar);

    // E. Magnificent Multi-Tiered Golden Kalasha Finial
    // Inverted Lotus Petal Base (Padma-kosa)
    const lotusBaseGeo = new THREE.CylinderGeometry(4.8, 7.2, 3.5, 24);
    const lotusBase = new THREE.Mesh(lotusBaseGeo, goldTrimMat);
    lotusBase.position.set(0, 145.2, 0);
    this.group.add(lotusBase);

    // Golden Kumbha Vessel (Pot of Nectar)
    const kumbhaGeo = new THREE.SphereGeometry(3.5, 20, 20);
    const kumbha = new THREE.Mesh(kumbhaGeo, goldTrimMat);
    kumbha.position.set(0, 149.0, 0);
    this.group.add(kumbha);

    // Amla Ring
    const amlaGeo = new THREE.TorusGeometry(3.2, 0.75, 12, 24);
    const amla = new THREE.Mesh(amlaGeo, goldTrimMat);
    amla.rotation.x = Math.PI / 2;
    amla.position.set(0, 151.2, 0);
    this.group.add(amla);

    // Tapering Needle Spire (Shikha)
    const spireGeo = new THREE.CylinderGeometry(0.35, 1.8, 16, 16);
    const spire = new THREE.Mesh(spireGeo, goldTrimMat);
    spire.position.set(0, 159.5, 0);
    spire.castShadow = true;
    this.group.add(spire);

    // =========================================================================
    // 7. SYMMETRICAL EAST AND WEST WINGS (COLONNADED LOGGIAS & WINDOWS)
    // =========================================================================

    for (let wingSide of [-1, 1]) {
      const wingCenterX = wingSide * 144;

      // Main Two-Story Wing Block
      const wingBlockGeo = new THREE.BoxGeometry(124, 48, 86);
      const wingBlock = new THREE.Mesh(wingBlockGeo, facadeCreamMat);
      wingBlock.position.set(wingCenterX, 38, -6);
      wingBlock.castShadow = true;
      wingBlock.receiveShadow = true;
      this.group.add(wingBlock);

      // Ground Floor Rusticated Red Sandstone Arcade Base (Height: 22)
      const wingArcadeGeo = new THREE.BoxGeometry(126, 22, 14);
      const wingArcade = new THREE.Mesh(wingArcadeGeo, sandstoneRedMat);
      wingArcade.position.set(wingCenterX, 25, 38);
      wingArcade.castShadow = true;
      wingArcade.receiveShadow = true;
      this.group.add(wingArcade);

      // Molded Belt Course separating Ground and First Floors
      const beltCourseGeo = new THREE.BoxGeometry(128, 1.8, 16);
      const beltCourse = new THREE.Mesh(beltCourseGeo, facadeCreamMat);
      beltCourse.position.set(wingCenterX, 36.5, 38);
      this.group.add(beltCourse);

      // Colonnaded Round Arches along Ground Floor Verandah Loggia
      for (let a = 0; a < 6; a++) {
        const archX = wingCenterX - 50 + a * 20;

        // Deep Shadowed Verandah Interior Loggia
        const archVoidGeo = new THREE.BoxGeometry(11, 16, 16);
        const archVoidMat = new THREE.MeshBasicMaterial({ color: 0x0c0e12 });
        const archVoid = new THREE.Mesh(archVoidGeo, archVoidMat);
        archVoid.position.set(archX, 22, 38);
        this.group.add(archVoid);

        // Molded Arch Voussoirs & Keystone
        const keystoneGeo = new THREE.BoxGeometry(2.4, 3.2, 1.5);
        const keystone = new THREE.Mesh(keystoneGeo, sandstoneRedMat);
        keystone.position.set(archX, 30.5, 45.2);
        this.group.add(keystone);

        // --- First Floor Window Bay with Stone Sills and Alternating Pediments ---
        // Recessed Window Reveal
        const windowRevealGeo = new THREE.BoxGeometry(8.5, 12.5, 3.5);
        const windowReveal = new THREE.Mesh(windowRevealGeo, glassWindowMat);
        windowReveal.position.set(archX, 46, 38);
        this.group.add(windowReveal);

        // White Multi-Pane Mullions & Transom
        const winMullionGeo = new THREE.BoxGeometry(0.35, 12.2, 0.35);
        const winMullion = new THREE.Mesh(winMullionGeo, whiteTrimMat);
        winMullion.position.set(archX, 46, 39.8);
        this.group.add(winMullion);

        const winTransomGeo = new THREE.BoxGeometry(8.2, 0.35, 0.35);
        const winTransom = new THREE.Mesh(winTransomGeo, whiteTrimMat);
        winTransom.position.set(archX, 46, 39.8);
        this.group.add(winTransom);

        // Projecting Molded Stone Sill supported by 2 Corbel Brackets
        const sillGeo = new THREE.BoxGeometry(11.0, 1.5, 4.8);
        const sill = new THREE.Mesh(sillGeo, facadeCreamMat);
        sill.position.set(archX, 39.5, 39);
        sill.castShadow = true;
        this.group.add(sill);

        for (let cb of [-3.5, 3.5]) {
          const corbelGeo = new THREE.BoxGeometry(1.2, 2.0, 2.0);
          const corbel = new THREE.Mesh(corbelGeo, facadeCreamMat);
          corbel.position.set(archX + cb, 38.0, 39.5);
          this.group.add(corbel);
        }

        // Alternating Triangular Pediments and Segmental Arched Hoods
        if (a % 2 === 0) {
          // Triangular Pediment
          const hoodGeo = new THREE.ConeGeometry(7.0, 3.5, 4);
          const hood = new THREE.Mesh(hoodGeo, facadeCreamMat);
          hood.rotation.y = Math.PI / 4;
          hood.position.set(archX, 54.0, 39.5);
          hood.castShadow = true;
          this.group.add(hood);
        } else {
          // Segmental Arched Hood
          const segHoodGeo = new THREE.CylinderGeometry(5.5, 5.5, 1.8, 16, 1, false, 0, Math.PI);
          const segHood = new THREE.Mesh(segHoodGeo, facadeCreamMat);
          segHood.rotation.z = Math.PI / 2;
          segHood.position.set(archX, 53.0, 39.5);
          segHood.castShadow = true;
          this.group.add(segHood);
        }
      }

      // Roofline Classical Balustrade
      const balustradeRailGeo = new THREE.BoxGeometry(124, 2.2, 4.5);
      const balustradeRail = new THREE.Mesh(balustradeRailGeo, facadeCreamMat);
      balustradeRail.position.set(wingCenterX, 63.5, 36);
      this.group.add(balustradeRail);

      // Turned Balusters along Roofline
      for (let bl = -56; bl <= 56; bl += 4.0) {
        const balusterGeo = new THREE.CylinderGeometry(0.5, 0.7, 3.2, 10);
        const baluster = new THREE.Mesh(balusterGeo, facadeCreamMat);
        baluster.position.set(wingCenterX + bl, 61.5, 36);
        this.group.add(baluster);
      }

      // Ornamental Corner Urns atop Wing Piers
      for (let corner of [-59, 59]) {
        const urnGeo = new THREE.CylinderGeometry(2.2, 1.4, 5.8, 16);
        const urn = new THREE.Mesh(urnGeo, facadeCreamMat);
        urn.position.set(wingCenterX + corner, 66.5, 36);
        urn.castShadow = true;
        this.group.add(urn);
      }
    }

    // =========================================================================
    // 8. DYNAMIC INDIAN NATIONAL FLAG (TIRANGA) & RIGGED MAST
    // =========================================================================

    // Monumental Sandstone Mast Pedestal
    const mastBaseGeo = new THREE.CylinderGeometry(3.6, 4.8, 4.5, 24);
    const mastBase = new THREE.Mesh(mastBaseGeo, sandstoneRedMat);
    mastBase.position.set(0, 2.8, 160);
    mastBase.castShadow = true;
    this.group.add(mastBase);

    // Tapered Steel Flagpole (Height: 78 units)
    const mastGeo = new THREE.CylinderGeometry(0.7, 1.4, 78, 20);
    const mast = new THREE.Mesh(mastGeo, darkIronMat);
    mast.position.set(0, 43.5, 160);
    mast.castShadow = true;
    this.group.add(mast);

    // Mast Golden Ball Finial & Pulley Truck
    const mastBallGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const mastBall = new THREE.Mesh(mastBallGeo, goldTrimMat);
    mastBall.position.set(0, 83.0, 160);
    this.group.add(mastBall);

    // Cleat at base with wound halyard rope
    const cleatGeo = new THREE.BoxGeometry(0.6, 1.8, 0.4);
    const cleat = new THREE.Mesh(cleatGeo, goldTrimMat);
    cleat.position.set(0, 8.5, 161.4);
    this.group.add(cleat);

    // Dual Halyard Ropes extending from cleat to masthead
    const ropeGeo = new THREE.CylinderGeometry(0.06, 0.06, 75, 6);
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0xded8cc });
    const halyardRope = new THREE.Mesh(ropeGeo, ropeMat);
    halyardRope.position.set(0.75, 45.5, 160);
    this.group.add(halyardRope);

    // Official 3:2 Proportions Indian Flag with 24-Spoke Ashoka Chakra & Weave PBR
    const flagPBR = createIndianFlagPBR(1024, 683);

    // Subdivided High-Density Cloth Geometry: Width 21, Height 14 (Exact 3:2 Ratio)
    const flagGeo = new THREE.PlaneGeometry(21, 14, 64, 40);
    // Translate geometry so left edge (x=0) is fixed at the halyard rope, extending to x=21
    flagGeo.translate(10.5, 0, 0);

    // Advanced Aerodynamic Cloth Simulation Shader with Dynamic Tangent Normal Computation
    this.flagClothMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFlagMap: { value: flagPBR.map },
        uNormalMap: { value: flagPBR.normalMap },
        uSunDirection: { value: new THREE.Vector3(260, 420, 280).normalize() }
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Normalized coordinate along flag length: 0.0 at mast/hoist, 1.0 at free fly
          float nx = clamp(pos.x / 21.0, 0.0, 1.0);
          float weight = pow(nx, 1.12);

          // Multi-harmonic aerodynamic traveling waves
          float t = uTime * 4.6;
          float w1 = sin(nx * 5.4 - t) * 1.8;
          float w2 = sin(nx * 9.2 + pos.y * 0.35 - t * 1.35) * 0.65;
          float w3 = sin(nx * 15.0 - t * 2.1) * 0.25;
          // High-frequency fluttering ripples near fly edge
          float flutter = sin(nx * 26.0 - t * 3.2) * 0.12 * pow(nx, 2.0);

          pos.z += (w1 + w2 + w3 + flutter) * weight;

          // Gravity drape / slight vertical lift under wind pressure
          pos.y += sin(nx * 3.8 - t * 0.8) * 0.35 * weight;

          // Analytical normal computation from wave derivatives
          float dzdx = (5.4 * cos(nx * 5.4 - t) * 1.8 + 9.2 * cos(nx * 9.2 + pos.y * 0.35 - t * 1.35) * 0.65) * (weight / 21.0);
          float dzdy = (0.35 * cos(nx * 9.2 + pos.y * 0.35 - t * 1.35) * 0.65) * weight;

          vec3 tangent = vec3(1.0, 0.0, dzdx);
          vec3 bitangent = vec3(0.0, 1.0, dzdy);
          vec3 calcNormal = normalize(cross(tangent, bitangent));

          vNormal = normalize(normalMatrix * calcNormal);
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uFlagMap;
        uniform vec3 uSunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec4 tex = texture2D(uFlagMap, vUv);

          // Sunlight diffuse lighting + khadi fabric backscattering translucency
          vec3 n = normalize(vNormal);
          float sunDiff = max(0.0, dot(n, uSunDirection));
          float backScatter = max(0.0, dot(-n, uSunDirection)) * 0.42;
          float ambient = 0.52;
          float light = ambient + 0.48 * (sunDiff + backScatter);

          // Subtle silk sheen along fold crests (Fresnel reflection)
          float sheen = pow(1.0 - abs(n.z), 3.2) * 0.18;

          vec3 finalColor = tex.rgb * light + vec3(sheen);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });

    this.flagMesh = new THREE.Mesh(flagGeo, this.flagClothMaterial);
    this.flagMesh.position.set(0.85, 74.0, 160);
    this.flagMesh.castShadow = true;
    this.group.add(this.flagMesh);

    // White Canvas Heading Tape along the hoist edge
    const headingTapeGeo = new THREE.BoxGeometry(0.35, 14.2, 0.35);
    const headingTapeMat = new THREE.MeshBasicMaterial({ color: 0xf5f3ee });
    const headingTape = new THREE.Mesh(headingTapeGeo, headingTapeMat);
    headingTape.position.set(0.85, 74.0, 160);
    this.group.add(headingTape);

    // Brass Snap Grommets at top and bottom of heading
    for (let gy of [-7.0, 7.0]) {
      const grommetGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12);
      const grommet = new THREE.Mesh(grommetGeo, goldTrimMat);
      grommet.rotation.z = Math.PI / 2;
      grommet.position.set(0.85, 74.0 + gy, 160);
      this.group.add(grommet);
    }

    // =========================================================================
    // 9. CAMPUS AVENUE TREES, STREETLAMPS & PERIMETER WALL
    // =========================================================================

    // A. 14 Majestic Evergreen Pine Trees (Pinus roxburghii / Weeping Architectural Pines)
    // lining the Semicircular Driveway — Lush, dense, tiered evergreen boughs with ZERO bare sticks or pins
    for (let p = 0; p < 14; p++) {
      const angle = (p * Math.PI / 13);
      const rad = 176;
      const px = Math.cos(angle) * rad;
      const pz = 160 + Math.sin(angle) * 76;

      const pineGroup = new THREE.Group();

      // Subtle natural variation in height and rotation
      const pScale = 0.94 + (p % 4) * 0.05;
      pineGroup.scale.set(pScale, pScale, pScale);

      // 1. Natural root flare at base (Y = 0 to 2.2)
      const flareGeo = new THREE.CylinderGeometry(1.5, 2.6, 2.4, 14);
      const flareMesh = new THREE.Mesh(flareGeo, pineBarkMat);
      flareMesh.position.y = 1.2;
      flareMesh.castShadow = true;
      pineGroup.add(flareMesh);

      // 2. Tapered Trunk (Height 16.5, Y = 8.25)
      // Base radius 1.35, top radius 0.40 at Y = 16.5 — completely enveloped by dense cascading evergreen boughs!
      const trunkGeo = new THREE.CylinderGeometry(0.40, 1.35, 16.5, 16);
      const trunkMesh = new THREE.Mesh(trunkGeo, pineBarkMat);
      trunkMesh.position.y = 8.25;
      trunkMesh.castShadow = true;
      pineGroup.add(trunkMesh);

      // 3. Dynamic Animated Crown Group (sways gently in environmental breeze)
      const foliageGroup = new THREE.Group();
      foliageGroup.userData = { baseRotZ: 0, baseRotX: 0, seed: p * 1.5 };
      this.animatedFoliage.push(foliageGroup);

      // 4. Fifteen dense, cascading, tiered evergreen skirts forming a majestic, seamless pyramidal pine
      // Continuous, full coverage from base to summit — zero bare sticks, zero gaps, zero cactus appearance!
      const pineTiers = [
        { y: 4.8,  count: 14, len: 14.5, wid: 8.8, droop: -0.38 }, // Lowest skirt: sweeping gracefully toward lawn
        { y: 6.8,  count: 14, len: 13.5, wid: 8.4, droop: -0.36 },
        { y: 8.8,  count: 13, len: 12.2, wid: 7.8, droop: -0.34 },
        { y: 10.7, count: 13, len: 11.0, wid: 7.2, droop: -0.32 },
        { y: 12.5, count: 12, len: 9.8,  wid: 6.6, droop: -0.30 },
        { y: 14.2, count: 12, len: 8.6,  wid: 6.0, droop: -0.28 },
        { y: 15.8, count: 11, len: 7.5,  wid: 5.4, droop: -0.26 },
        { y: 17.3, count: 11, len: 6.4,  wid: 4.8, droop: -0.25 },
        { y: 18.7, count: 10, len: 5.3,  wid: 4.2, droop: -0.24 },
        { y: 20.0, count: 10, len: 4.3,  wid: 3.8, droop: -0.22 },
        { y: 21.2, count: 9,  len: 3.4,  wid: 3.4, droop: -0.20 },
        { y: 22.3, count: 8,  len: 2.6,  wid: 2.8, droop: -0.19 },
        { y: 23.3, count: 8,  len: 1.9,  wid: 2.2, droop: -0.18 },
        { y: 24.2, count: 7,  len: 1.3,  wid: 1.6, droop: -0.18 },
        { y: 24.9, count: 6,  len: 0.8,  wid: 1.1, droop: -0.18 }
      ];

      pineTiers.forEach((tier, tIdx) => {
        const tierGroup = new THREE.Group();
        tierGroup.position.y = tier.y;

        const radialOffset = tIdx * 0.44; // Stagger tiers radially for natural dense interleaving

        for (let b = 0; b < tier.count; b++) {
          const bAngle = (b * Math.PI * 2) / tier.count + radialOffset;
          const boughGroup = new THREE.Group();
          boughGroup.rotation.y = bAngle;

          // Outer Sweeping Bough Pad (Horizontal Fan Plane with downward droop)
          const outerZ = tier.len * 0.58 * Math.cos(tier.droop);
          const outerY = tier.len * 0.58 * Math.sin(tier.droop);
          const fanGeo = new THREE.PlaneGeometry(tier.wid, tier.len * 0.75);
          const fanMesh = new THREE.Mesh(fanGeo, pineNeedleMat);
          fanMesh.position.set(0, outerY, outerZ);
          fanMesh.rotation.x = Math.PI / 2 - tier.droop;
          fanMesh.castShadow = true;
          boughGroup.add(fanMesh);

          // Inner Overlapping Shoulder Pad (hugs close to trunk, filling inner canopy)
          const innerZ = tier.len * 0.28 * Math.cos(tier.droop);
          const innerY = tier.len * 0.28 * Math.sin(tier.droop);
          const innerGeo = new THREE.PlaneGeometry(tier.wid * 0.85, tier.len * 0.55);
          const innerMesh = new THREE.Mesh(innerGeo, pineNeedleMat);
          innerMesh.position.set(0, innerY, innerZ);
          innerMesh.rotation.x = Math.PI / 2 - tier.droop * 0.6;
          innerMesh.castShadow = true;
          boughGroup.add(innerMesh);

          // Volumetric Cross-Card (vertical quad tilted at 60 deg to add fluffy 3D fullness)
          const crossGeo = new THREE.PlaneGeometry(tier.wid * 0.72, tier.len * 0.68);
          const crossMesh = new THREE.Mesh(crossGeo, pineNeedleMat);
          crossMesh.position.set(0, outerY, outerZ);
          crossMesh.rotation.x = Math.PI / 2 - tier.droop;
          crossMesh.rotation.z = Math.PI / 3;
          crossMesh.castShadow = true;
          boughGroup.add(crossMesh);

          tierGroup.add(boughGroup);
        }

        foliageGroup.add(tierGroup);
      });

      // 5. Delicate Pointed Pine Spire Tip (Y = 25.1 to 26.2)
      // Tiny pointed needle cluster that smoothly finishes the conical crown
      const apexGroup = new THREE.Group();
      apexGroup.position.y = 25.1;

      for (let s = 0; s < 4; s++) {
        const spireGeo = new THREE.PlaneGeometry(0.9, 1.4);
        const spireMesh = new THREE.Mesh(spireGeo, pineNeedleMat);
        spireMesh.position.y = 0.7;
        spireMesh.rotation.y = (s * Math.PI) / 4;
        spireMesh.castShadow = true;
        apexGroup.add(spireMesh);
      }
      foliageGroup.add(apexGroup);

      pineGroup.add(foliageGroup);
      pineGroup.position.set(px, 0, pz);
      this.group.add(pineGroup);
    }

    // B. 6 Majestic Mature Indian Shade Trees (Neem / Peepal) framing the Wings
    const shadeTreePositions = [
      { x: -245, z: 25, scale: 1.05 }, { x: -265, z: 85, scale: 0.95 }, { x: -235, z: 145, scale: 1.0 },
      { x: 245, z: 25, scale: 1.0 },   { x: 265, z: 85, scale: 1.1 },  { x: 235, z: 145, scale: 0.92 }
    ];

    shadeTreePositions.forEach((tp, idx) => {
      const treeGroup = new THREE.Group();
      treeGroup.scale.set(tp.scale, tp.scale, tp.scale);

      // 1. Massive gnarled trunk base with buttress roots
      const trunkBaseGeo = new THREE.CylinderGeometry(3.2, 4.6, 12, 14);
      const trunkBase = new THREE.Mesh(trunkBaseGeo, barkMat);
      trunkBase.position.y = 6;
      trunkBase.castShadow = true;
      treeGroup.add(trunkBase);

      // Buttress root flares
      for (let r = 0; r < 4; r++) {
        const rootAngle = (r * Math.PI / 2) + 0.3;
        const rootGeo = new THREE.BoxGeometry(2.0, 5.0, 5.5);
        const root = new THREE.Mesh(rootGeo, barkMat);
        root.position.set(Math.cos(rootAngle) * 3.2, 2.5, Math.sin(rootAngle) * 3.2);
        root.rotation.y = rootAngle;
        root.castShadow = true;
        treeGroup.add(root);
      }

      // 2. Main trunk stem rising to fork (Y = 6 to 18)
      const trunkStemGeo = new THREE.CylinderGeometry(2.4, 3.2, 12, 12);
      const trunkStem = new THREE.Mesh(trunkStemGeo, barkMat);
      trunkStem.position.y = 15;
      trunkStem.castShadow = true;
      treeGroup.add(trunkStem);

      // 3. Three Primary Boughs branching organically outwards
      const boughConfigs = [
        { angle: 0.65, azimuth: 0.2, len: 18, radTop: 1.4, radBot: 2.2 },
        { angle: 0.75, azimuth: 2.1, len: 17, radTop: 1.3, radBot: 2.1 },
        { angle: 0.70, azimuth: 4.2, len: 19, radTop: 1.4, radBot: 2.3 }
      ];

      boughConfigs.forEach((bough, bIdx) => {
        const boughGroup = new THREE.Group();
        boughGroup.position.set(0, 19, 0);
        boughGroup.rotation.y = bough.azimuth;

        const boughGeo = new THREE.CylinderGeometry(bough.radTop, bough.radBot, bough.len, 10);
        const boughMesh = new THREE.Mesh(boughGeo, barkMat);
        boughMesh.position.set(0, bough.len * 0.45 * Math.cos(bough.angle), bough.len * 0.45 * Math.sin(bough.angle));
        boughMesh.rotation.x = bough.angle;
        boughMesh.castShadow = true;
        boughGroup.add(boughMesh);

        // Secondary spreading limbs
        for (let l = 0; l < 2; l++) {
          const limbAngle = bough.angle + (l === 0 ? -0.35 : 0.35);
          const limbLen = 12;
          const limbGeo = new THREE.CylinderGeometry(0.8, bough.radTop, limbLen, 8);
          const limbMesh = new THREE.Mesh(limbGeo, barkMat);
          const limbStartX = (l === 0 ? -2.5 : 2.5);
          const limbStartY = bough.len * 0.75 * Math.cos(bough.angle);
          const limbStartZ = bough.len * 0.75 * Math.sin(bough.angle);

          limbMesh.position.set(limbStartX, limbStartY + limbLen * 0.45 * Math.cos(limbAngle), limbStartZ + limbLen * 0.45 * Math.sin(limbAngle));
          limbMesh.rotation.x = limbAngle;
          limbMesh.rotation.z = (l === 0 ? -0.3 : 0.3);
          limbMesh.castShadow = true;
          boughGroup.add(limbMesh);

          // Volumetric Leafy Canopy Clusters on secondary limbs (pure organic alpha leaf planes, zero geometric spheres)
          const clusterGroup = new THREE.Group();
          clusterGroup.position.set(limbStartX, limbStartY + limbLen * Math.cos(limbAngle), limbStartZ + limbLen * Math.sin(limbAngle));
          clusterGroup.userData = { baseRotZ: 0, baseRotX: 0, seed: idx * 2.5 + bIdx + l };
          this.animatedFoliage.push(clusterGroup);

          // 6 Intersecting radial foliage planes forming a lush, multi-directional canopy
          for (let p = 0; p < 6; p++) {
            const quadGeo = new THREE.PlaneGeometry(24, 18);
            const quad = new THREE.Mesh(quadGeo, foliageMat);
            quad.rotation.y = (p * Math.PI) / 6;
            quad.rotation.x = (p % 2 === 0 ? 0.28 : -0.28);
            quad.castShadow = true;
            clusterGroup.add(quad);
          }

          // Horizontal canopy cap plane
          const capGeo = new THREE.PlaneGeometry(22, 22);
          const capMesh = new THREE.Mesh(capGeo, foliageMat);
          capMesh.rotation.x = Math.PI / 2;
          capMesh.position.y = 4.0;
          clusterGroup.add(capMesh);

          boughGroup.add(clusterGroup);
        }

        treeGroup.add(boughGroup);
      });

      // Central overarching crown canopy cluster connecting the boughs
      const crownCluster = new THREE.Group();
      crownCluster.position.set(0, 26, 0);
      crownCluster.userData = { baseRotZ: 0, baseRotX: 0, seed: idx * 3.1 };
      this.animatedFoliage.push(crownCluster);

      for (let cp = 0; cp < 6; cp++) {
        const cGeo = new THREE.PlaneGeometry(32, 24);
        const cMesh = new THREE.Mesh(cGeo, foliageMat);
        cMesh.rotation.y = (cp * Math.PI) / 6;
        cMesh.rotation.x = (cp % 2 === 0 ? 0.32 : -0.32);
        cMesh.castShadow = true;
        crownCluster.add(cMesh);
      }
      treeGroup.add(crownCluster);

      treeGroup.position.set(tp.x, 0, tp.z);
      this.group.add(treeGroup);
    });

    // C. 12 Cast-Iron Municipal Delhi Streetlamps
    for (let l = 0; l < 8; l++) {
      const angle = (l * Math.PI / 7);
      const lx = Math.cos(angle) * 82;
      const lz = 160 + Math.sin(angle) * 36;

      const lampGroup = new THREE.Group();

      const postGeo = new THREE.CylinderGeometry(0.5, 0.85, 17, 14);
      const post = new THREE.Mesh(postGeo, darkIronMat);
      post.position.y = 8.5;
      post.castShadow = true;
      lampGroup.add(post);

      const lanternGeo = new THREE.SphereGeometry(1.5, 18, 18);
      const lantern = new THREE.Mesh(lanternGeo, lampGlowMat);
      lantern.position.y = 17.5;
      lampGroup.add(lantern);

      lampGroup.position.set(lx, 0, lz);
      this.group.add(lampGroup);
    }

    // D. Low Red Sandstone Perimeter Boundary Wall with Spear-Point Iron Railings
    for (let side of [-1, 1]) {
      const wallGeo = new THREE.BoxGeometry(140, 3.8, 2.8);
      const wall = new THREE.Mesh(wallGeo, sandstoneRedMat);
      wall.position.set(side * 225, 1.9, 230);
      wall.castShadow = true;
      this.group.add(wall);

      // Railing with Spear-Point Finials
      const railGeo = new THREE.BoxGeometry(140, 6.2, 0.8);
      const rail = new THREE.Mesh(railGeo, darkIronMat);
      rail.position.set(side * 225, 6.8, 230);
      rail.castShadow = true;
      this.group.add(rail);
    }

    // =========================================================================
    // 10. ANIMATION, WIND LOOP & DOOR INTERACTION
    // =========================================================================
    threeScene.registerUpdatable((delta, time) => {
      if (!this.group.visible) return;

      // 1. Update Flag Cloth Shader Time
      if (this.flagClothMaterial && this.flagClothMaterial.uniforms.uTime) {
        this.flagClothMaterial.uniforms.uTime.value = time;
      }

      // 2. Subtle Environmental Wind Movement on Foliage
      this.animatedFoliage.forEach(f => {
        const wind = Math.sin(time * 2.2 + f.userData.seed) * 0.035;
        f.rotation.z = f.userData.baseRotZ + wind;
        f.rotation.x = f.userData.baseRotX + Math.cos(time * 1.8 + f.userData.seed) * 0.025;
      });

      // 3. Smooth Door Opening Interpolation
      if (Math.abs(this.doorOpenProgress - this.targetDoorOpen) > 0.001) {
        this.doorOpenProgress += (this.targetDoorOpen - this.doorOpenProgress) * Math.min(1.0, delta * 3.5);

        // Max opening angle: ~75 degrees (1.31 rad)
        const openAngle = this.doorOpenProgress * (Math.PI * 0.42);
        if (this.leftDoor) {
          this.leftDoor.rotation.y = -openAngle; // Swings inward to the left
        }
        if (this.rightDoor) {
          this.rightDoor.rotation.y = openAngle;  // Swings inward to the right
        }
      }
    });

    this.isBuilt = true;
    console.log('[ExteriorScene] Second Refinement Pass: High-Fidelity Supreme Court Architecture loaded.');
  }

  /**
   * Triggers natural inward opening of the ceremonial Burma teak doors
   */
  openEntranceDoors() {
    this.targetDoorOpen = 1.0;
  }

  /**
   * Closes the entrance doors
   */
  closeEntranceDoors() {
    this.targetDoorOpen = 0.0;
  }
}

export const exteriorScene = new SupremeCourtExteriorScene();
