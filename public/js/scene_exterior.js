/**
 * PRAMANA — High-Fidelity Supreme Court of India Architectural Reconstruction (Milestone 4)
 * Authentic Indo-British Classical Architecture designed by Ganesh Bhikaji Deolalikar (1958).
 * Features:
 * - Hexastyle Colonnaded Entrance Portico with fluted pillars, dentil entablature, and triangular pediment
 * - Multi-tiered Central Dome with 16-sided clerestory drum, vertical ribbed dome, and golden Kalasha finial
 * - Symmetrical East & West Wings with ground-floor arched colonnades, recessed first-floor pediment windows, and roof balustrades
 * - Dholpur Red Sandstone high plinth and grand 12-tier ceremonial entrance steps
 * - Carved Burma teak entrance doors with gilded "यतो धर्मस्ततो जयः" motto plaque
 * - Dynamic 3D Indian National Flag (Tiranga) with 3:2 Flag Code proportions, 24-spoke Ashoka Chakra, and aerodynamic cloth physics
 * - Full Institutional Landscaping: Semicircular driveway, paved flagstone plaza, manicured lawns, geometric floral parterres,
 *   trimmed hedges, Royal Palm avenue, spreading Neem shade trees, cast-iron streetlamps, and perimeter boundary railings.
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';
import {
  createWoodTexture,
  createSandstoneTexture,
  createIndianFlagTexture,
  createPaverTexture,
  createGrassTexture,
  createAsphaltTexture
} from './procedural_textures.js';

class SupremeCourtExteriorScene {
  constructor() {
    this.group = threeScene.exteriorGroup;
    this.flagMesh = null;
    this.flagClothMaterial = null;
    this.isBuilt = false;
  }

  build() {
    if (this.isBuilt) return;

    // =========================================================================
    // 1. HIGH-RESOLUTION PBR MATERIALS PALETTE
    // =========================================================================

    // Dholpur Red Sandstone (Base Plinth, Steps, Entrance Portal)
    const redSandstoneTex = createSandstoneTexture('#842f18', '#541908', 512, 512);
    redSandstoneTex.repeat.set(4, 2);
    const sandstoneRedMat = new THREE.MeshStandardMaterial({
      color: 0x842f18,
      map: redSandstoneTex,
      bumpMap: redSandstoneTex,
      bumpScale: 0.35,
      roughness: 0.85,
      metalness: 0.04
    });

    // Jodhpur / Rajasthani Cream Sandstone (Columns, Facade, Cornices, Drum)
    const creamSandstoneTex = createSandstoneTexture('#f2e8d5', '#bfb29c', 512, 512);
    creamSandstoneTex.repeat.set(6, 4);
    const facadeCreamMat = new THREE.MeshStandardMaterial({
      color: 0xf2e8d5,
      map: creamSandstoneTex,
      bumpMap: creamSandstoneTex,
      bumpScale: 0.28,
      roughness: 0.72,
      metalness: 0.06
    });

    // Central Dome Weathered Copper / Aged Patina Cream
    const domePatinaMat = new THREE.MeshStandardMaterial({
      color: 0xd8d0bd,
      roughness: 0.58,
      metalness: 0.16
    });

    // Polished Architectural Brass / Gilded Finial & Plaque
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.78,
      roughness: 0.28
    });

    // Carved Burma Teak Wood (Main Entrance Doors)
    const teakTex = createWoodTexture('#381e0f', '#1c0c05', 512, 512);
    const teakDoorMat = new THREE.MeshStandardMaterial({
      color: 0x381e0f,
      map: teakTex,
      bumpMap: teakTex,
      bumpScale: 0.2,
      roughness: 0.65,
      metalness: 0.05
    });

    // Reflective Architectural Glass (Windows & Clerestory Panes)
    const glassWindowMat = new THREE.MeshStandardMaterial({
      color: 0x081422,
      roughness: 0.08,
      metalness: 0.92
    });

    // Landscaped Manicured Lawn Grass
    const grassTex = createGrassTexture(512, 512);
    grassTex.repeat.set(16, 16);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x244a22,
      map: grassTex,
      bumpMap: grassTex,
      bumpScale: 0.3,
      roughness: 0.90,
      metalness: 0.0
    });

    // Plaza & Pedestrian Flagstone Pavers
    const paverTex = createPaverTexture(512, 512);
    paverTex.repeat.set(8, 8);
    const paverMat = new THREE.MeshStandardMaterial({
      color: 0x8a8276,
      map: paverTex,
      bumpMap: paverTex,
      bumpScale: 0.3,
      roughness: 0.82,
      metalness: 0.02
    });

    // Asphalt Semicircular Driveway
    const asphaltTex = createAsphaltTexture(512, 512);
    asphaltTex.repeat.set(12, 6);
    const drivewayMat = new THREE.MeshStandardMaterial({
      color: 0x282c34,
      map: asphaltTex,
      roughness: 0.86,
      metalness: 0.08
    });

    // Granite Curbs & Road Edges
    const graniteCurbMat = new THREE.MeshStandardMaterial({
      color: 0xc4c2be,
      roughness: 0.75,
      metalness: 0.05
    });

    // Cast-Iron Streetlamps & Boundary Railings
    const darkIronMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.45,
      metalness: 0.65
    });

    // Lamp Frosted Glass Glow
    const lampGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfff0dc,
      emissive: 0xffecd0,
      emissiveIntensity: 2.2,
      roughness: 0.2
    });

    // Dense Trimmed Boxwood Hedges
    const hedgeMat = new THREE.MeshStandardMaterial({
      color: 0x1b3f18,
      roughness: 0.88,
      metalness: 0.0
    });

    // Vibrant Floral Parterres (Red, Gold, Violet blooms)
    const flowerRedMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.8 });
    const flowerGoldMat = new THREE.MeshStandardMaterial({ color: 0xeeaa11, roughness: 0.8 });

    // Palm Tree Bark & Fronds
    const palmBarkMat = new THREE.MeshStandardMaterial({ color: 0x6e5d4e, roughness: 0.85 });
    const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x285c24, roughness: 0.75, side: THREE.DoubleSide });

    // =========================================================================
    // 2. SURROUNDING GROUNDS, CAMPUS & FORECOURT
    // =========================================================================

    // A. Master Ground Surface (1400 x 1400 units)
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
    outerCurb.position.set(0, 0.45, 160);
    this.group.add(outerCurb);

    const innerCurbGeo = new THREE.RingGeometry(83.5, 85.5, 64);
    const innerCurb = new THREE.Mesh(innerCurbGeo, graniteCurbMat);
    innerCurb.rotation.x = -Math.PI / 2;
    innerCurb.position.set(0, 0.45, 160);
    this.group.add(innerCurb);

    // C. Central Forecourt Ceremonial Lawn & Flag Plaza
    const centerLawnGeo = new THREE.CircleGeometry(83, 48);
    const centerLawn = new THREE.Mesh(centerLawnGeo, grassMat);
    centerLawn.rotation.x = -Math.PI / 2;
    centerLawn.position.set(0, 0.35, 160);
    centerLawn.receiveShadow = true;
    this.group.add(centerLawn);

    // Stone Paved Plaza surrounding the National Flag Mast
    const flagPlazaGeo = new THREE.CircleGeometry(26, 36);
    const flagPlaza = new THREE.Mesh(flagPlazaGeo, paverMat);
    flagPlaza.rotation.x = -Math.PI / 2;
    flagPlaza.position.set(0, 0.5, 160);
    flagPlaza.receiveShadow = true;
    this.group.add(flagPlaza);

    // D. Ceremonial Axis Pathway (from Flag Plaza to Portico Entrance Steps)
    const axisPathGeo = new THREE.PlaneGeometry(38, 75);
    const axisPath = new THREE.Mesh(axisPathGeo, paverMat);
    axisPath.rotation.x = -Math.PI / 2;
    axisPath.position.set(0, 0.45, 118);
    axisPath.receiveShadow = true;
    this.group.add(axisPath);

    // Geometric Flower Beds & Hedges in Forecourt
    for (let side of [-1, 1]) {
      // Semicircular Floral Parterres
      const flowerRingGeo = new THREE.RingGeometry(40, 56, 32, 1, side > 0 ? 0 : Math.PI, Math.PI);
      const flowerRing = new THREE.Mesh(flowerRingGeo, side > 0 ? flowerRedMat : flowerGoldMat);
      flowerRing.rotation.x = -Math.PI / 2;
      flowerRing.position.set(0, 0.4, 160);
      this.group.add(flowerRing);

      // Low Trimmed Boxwood Hedges framing the Central Path
      const hedgeGeo = new THREE.BoxGeometry(3, 2.5, 65);
      const hedge = new THREE.Mesh(hedgeGeo, hedgeMat);
      hedge.position.set(side * 21, 1.5, 118);
      hedge.castShadow = true;
      this.group.add(hedge);
    }

    // =========================================================================
    // 3. DHOLPUR RED SANDSTONE PLINTH & CEREMONIAL ENTRANCE STEPS
    // =========================================================================

    // A. Monumental High Plinth Course
    const plinthGeo = new THREE.BoxGeometry(380, 14, 180);
    const plinth = new THREE.Mesh(plinthGeo, sandstoneRedMat);
    plinth.position.set(0, 7, 0);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    this.group.add(plinth);

    // Plinth Upper Molded Torus Cornice
    const plinthCorniceGeo = new THREE.BoxGeometry(386, 2, 186);
    const plinthCornice = new THREE.Mesh(plinthCorniceGeo, sandstoneRedMat);
    plinthCornice.position.set(0, 14.5, 0);
    plinthCornice.castShadow = true;
    this.group.add(plinthCornice);

    // B. Grand Ceremonial Flight of 12 Tiered Steps (Leading from Y=0 to Y=14)
    for (let s = 0; s < 12; s++) {
      const stepW = 100 + (11 - s) * 2.5;
      const stepY = s * 1.15 + 0.58;
      const stepZ = 85 + (11 - s) * 4.2;
      const stepGeo = new THREE.BoxGeometry(stepW, 1.2, 4.4);
      const step = new THREE.Mesh(stepGeo, sandstoneRedMat);
      step.position.set(0, stepY, stepZ);
      step.receiveShadow = true;
      step.castShadow = true;
      this.group.add(step);
    }

    // C. Stepped Flanking Balustrade Retaining Walls
    for (let side of [-1, 1]) {
      const cheekGeo = new THREE.BoxGeometry(6, 16, 52);
      const cheek = new THREE.Mesh(cheekGeo, sandstoneRedMat);
      cheek.position.set(side * 62, 8, 108);
      cheek.castShadow = true;
      cheek.receiveShadow = true;
      this.group.add(cheek);

      // Ornamental Stone Lamp Pedestal at foot of steps
      const pedestalGeo = new THREE.BoxGeometry(10, 6, 10);
      const pedestal = new THREE.Mesh(pedestalGeo, sandstoneRedMat);
      pedestal.position.set(side * 62, 3, 134);
      pedestal.castShadow = true;
      this.group.add(pedestal);

      const lampPostGeo = new THREE.CylinderGeometry(0.6, 0.9, 14, 12);
      const lampPost = new THREE.Mesh(lampPostGeo, darkIronMat);
      lampPost.position.set(side * 62, 13, 134);
      lampPost.castShadow = true;
      this.group.add(lampPost);

      const lanternGeo = new THREE.SphereGeometry(1.6, 16, 16);
      const lantern = new THREE.Mesh(lanternGeo, lampGlowMat);
      lantern.position.set(side * 62, 20.5, 134);
      this.group.add(lantern);
    }

    // =========================================================================
    // 4. CENTRAL HEXASTYLE ENTRANCE PORTICO & ARCHITRAVE
    // =========================================================================

    // Portico Raised Floor
    const porticoFloorGeo = new THREE.BoxGeometry(108, 2, 34);
    const porticoFloor = new THREE.Mesh(porticoFloorGeo, sandstoneRedMat);
    porticoFloor.position.set(0, 14.5, 76);
    this.group.add(porticoFloor);

    // 6 Monumental Fluted Pillars across Front Facade + 2 Side Return Pillars
    const pillarPositions = [
      { x: -44, z: 86 }, { x: -26, z: 86 }, { x: -9, z: 86 },
      { x: 9, z: 86 },   { x: 26, z: 86 },  { x: 44, z: 86 },
      { x: -44, z: 66 }, { x: 44, z: 66 }
    ];

    const pillarPlinthGeo = new THREE.BoxGeometry(7.2, 2.8, 7.2);
    const pillarBaseTorusGeo = new THREE.CylinderGeometry(3.0, 3.5, 1.8, 24);
    const pillarShaftGeo = new THREE.CylinderGeometry(2.35, 2.75, 42, 20); // 20 fluting facets
    const pillarCapitalGeo = new THREE.BoxGeometry(7.5, 2.6, 7.5);

    pillarPositions.forEach(pos => {
      // Square Base Plinth
      const base = new THREE.Mesh(pillarPlinthGeo, sandstoneRedMat);
      base.position.set(pos.x, 16.5, pos.z);
      base.castShadow = true;
      base.receiveShadow = true;
      this.group.add(base);

      // Molded Torus
      const torus = new THREE.Mesh(pillarBaseTorusGeo, facadeCreamMat);
      torus.position.set(pos.x, 18.5, pos.z);
      torus.castShadow = true;
      this.group.add(torus);

      // Fluted Shaft
      const shaft = new THREE.Mesh(pillarShaftGeo, facadeCreamMat);
      shaft.position.set(pos.x, 39.5, pos.z);
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      this.group.add(shaft);

      // Classical Capital
      const cap = new THREE.Mesh(pillarCapitalGeo, facadeCreamMat);
      cap.position.set(pos.x, 61.2, pos.z);
      cap.castShadow = true;
      this.group.add(cap);
    });

    // Entablature (Architrave, Frieze, and Dentil Cornice)
    const entablatureGeo = new THREE.BoxGeometry(112, 6, 36);
    const entablature = new THREE.Mesh(entablatureGeo, facadeCreamMat);
    entablature.position.set(0, 65.5, 76);
    entablature.castShadow = true;
    this.group.add(entablature);

    // Classical Triangular Pediment atop Portico
    const pedimentShape = new THREE.Shape();
    pedimentShape.moveTo(-56, 0);
    pedimentShape.lineTo(0, 18);
    pedimentShape.lineTo(56, 0);
    pedimentShape.closePath();

    const pedimentExtrudeSettings = { depth: 4, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1, bevelSegments: 3 };
    const pedimentGeo = new THREE.ExtrudeGeometry(pedimentShape, pedimentExtrudeSettings);
    const pediment = new THREE.Mesh(pedimentGeo, facadeCreamMat);
    pediment.position.set(0, 68.5, 92);
    pediment.castShadow = true;
    this.group.add(pediment);

    // Portico Roof Deck
    const porticoRoofGeo = new THREE.BoxGeometry(108, 3, 34);
    const porticoRoof = new THREE.Mesh(porticoRoofGeo, facadeCreamMat);
    porticoRoof.position.set(0, 70, 76);
    this.group.add(porticoRoof);

    // Main Ceremonial Entrance Portal & Carved Teak Doors
    const doorFrameGeo = new THREE.BoxGeometry(32, 38, 5);
    const doorFrame = new THREE.Mesh(doorFrameGeo, sandstoneRedMat);
    doorFrame.position.set(0, 31, 59.5);
    doorFrame.castShadow = true;
    this.group.add(doorFrame);

    const doorLeafGeo = new THREE.BoxGeometry(11.5, 28, 2.5);
    for (let d of [-1, 1]) {
      const doorLeaf = new THREE.Mesh(doorLeafGeo, teakDoorMat);
      doorLeaf.position.set(d * 6.2, 28, 61);
      doorLeaf.castShadow = true;
      this.group.add(doorLeaf);

      // Bronze Door Studs / Bosses
      for (let r = 0; r < 4; r++) {
        const studGeo = new THREE.SphereGeometry(0.35, 12, 12);
        const stud = new THREE.Mesh(studGeo, goldTrimMat);
        stud.position.set(d * (6.2 + (d > 0 ? 3 : -3)), 18 + r * 6, 62.4);
        this.group.add(stud);
      }
    }

    // Transom Arched Fanlight above Doors
    const fanlightGeo = new THREE.CylinderGeometry(11.5, 11.5, 2, 24, 1, false, 0, Math.PI);
    const fanlight = new THREE.Mesh(fanlightGeo, glassWindowMat);
    fanlight.rotation.z = Math.PI / 2;
    fanlight.position.set(0, 42, 60);
    this.group.add(fanlight);

    // Gilded Inscription Plaque above Main Entrance: "यतो धर्मस्ततो जयः"
    const plaqueGeo = new THREE.BoxGeometry(52, 6.5, 1.2);
    const plaque = new THREE.Mesh(plaqueGeo, goldTrimMat);
    plaque.position.set(0, 52, 61.5);
    plaque.castShadow = true;
    this.group.add(plaque);

    // =========================================================================
    // 5. THE ICONIC CENTRAL DOME & MULTI-TIERED DRUM
    // =========================================================================

    // A. Central Architectural Core Block
    const centralCoreGeo = new THREE.BoxGeometry(160, 60, 120);
    const centralCore = new THREE.Mesh(centralCoreGeo, facadeCreamMat);
    centralCore.position.set(0, 44, 0);
    centralCore.castShadow = true;
    centralCore.receiveShadow = true;
    this.group.add(centralCore);

    // B. 16-Sided Lower Clerestory Drum
    const drumGeo = new THREE.CylinderGeometry(36, 36, 18, 16);
    const drum = new THREE.Mesh(drumGeo, facadeCreamMat);
    drum.position.set(0, 83, 0);
    drum.castShadow = true;
    this.group.add(drum);

    // 16 Arched Clerestory Windows around the Drum
    for (let w = 0; w < 16; w++) {
      const angle = (w * 360 / 16) * (Math.PI / 180);
      const wx = Math.sin(angle) * 36.1;
      const wz = Math.cos(angle) * 36.1;

      const windowGeo = new THREE.PlaneGeometry(5.2, 9.5);
      const windowMesh = new THREE.Mesh(windowGeo, glassWindowMat);
      windowMesh.position.set(wx, 83, wz);
      windowMesh.lookAt(wx * 2, 83, wz * 2);
      this.group.add(windowMesh);
    }

    // Drum Projecting Cornice with Stone Brackets
    const drumCorniceGeo = new THREE.CylinderGeometry(39, 36, 3.5, 32);
    const drumCornice = new THREE.Mesh(drumCorniceGeo, facadeCreamMat);
    drumCornice.position.set(0, 93, 0);
    drumCornice.castShadow = true;
    this.group.add(drumCornice);

    // Stepped Circular Transition Drum
    const upperDrumGeo = new THREE.CylinderGeometry(34, 34, 6, 32);
    const upperDrum = new THREE.Mesh(upperDrumGeo, facadeCreamMat);
    upperDrum.position.set(0, 97, 0);
    this.group.add(upperDrum);

    // C. Ribbed Hemispherical High Dome
    const domeGeo = new THREE.SphereGeometry(34, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, domePatinaMat);
    dome.position.set(0, 100, 0);
    dome.castShadow = true;
    this.group.add(dome);

    // 16 Raised Architectural Ribs running up the Dome
    const ribGeo = new THREE.CylinderGeometry(0.5, 0.8, 36, 8);
    for (let r = 0; r < 16; r++) {
      const angle = (r * 360 / 16) * (Math.PI / 180);
      const rib = new THREE.Mesh(ribGeo, goldTrimMat);
      rib.position.set(Math.sin(angle) * 22, 116, Math.cos(angle) * 22);
      rib.rotation.z = Math.sin(angle) * -0.7;
      rib.rotation.x = Math.cos(angle) * 0.7;
      this.group.add(rib);
    }

    // D. Multi-Tiered Golden Kalasha Finial (Lotus Pedestal + Kumbha + Spire)
    const lotusBaseGeo = new THREE.CylinderGeometry(4.5, 7.0, 3.5, 16);
    const lotusBase = new THREE.Mesh(lotusBaseGeo, goldTrimMat);
    lotusBase.position.set(0, 134.5, 0);
    this.group.add(lotusBase);

    const kumbhaGeo = new THREE.SphereGeometry(3.2, 16, 16);
    const kumbha = new THREE.Mesh(kumbhaGeo, goldTrimMat);
    kumbha.position.set(0, 138, 0);
    this.group.add(kumbha);

    const spireGeo = new THREE.CylinderGeometry(0.4, 1.8, 14, 16);
    const spire = new THREE.Mesh(spireGeo, goldTrimMat);
    spire.position.set(0, 146, 0);
    spire.castShadow = true;
    this.group.add(spire);

    // =========================================================================
    // 6. SYMMETRICAL EAST AND WEST WINGS (COLONNADED VERANDAHS & WINDOWS)
    // =========================================================================

    for (let wingSide of [-1, 1]) {
      const wingCenterX = wingSide * 142;

      // Main Wing Block (Width: 124, Height: 48, Depth: 86)
      const wingBlockGeo = new THREE.BoxGeometry(124, 48, 86);
      const wingBlock = new THREE.Mesh(wingBlockGeo, facadeCreamMat);
      wingBlock.position.set(wingCenterX, 38, -6);
      wingBlock.castShadow = true;
      wingBlock.receiveShadow = true;
      this.group.add(wingBlock);

      // Ground Floor Rusticated Red Sandstone Arcade Base (Height: 22)
      const wingArcadeGeo = new THREE.BoxGeometry(126, 22, 12);
      const wingArcade = new THREE.Mesh(wingArcadeGeo, sandstoneRedMat);
      wingArcade.position.set(wingCenterX, 25, 38);
      wingArcade.castShadow = true;
      wingArcade.receiveShadow = true;
      this.group.add(wingArcade);

      // Colonnaded Round Arches along Ground Floor Verandah
      for (let a = 0; a < 6; a++) {
        const archX = wingCenterX - 50 + a * 20;

        // Dark shaded verandah opening
        const archVoidGeo = new THREE.BoxGeometry(11, 16, 14);
        const archVoidMat = new THREE.MeshBasicMaterial({ color: 0x050608 });
        const archVoid = new THREE.Mesh(archVoidGeo, archVoidMat);
        archVoid.position.set(archX, 22, 38);
        this.group.add(archVoid);

        // First Floor Recessed Windows with Stone Sills and Triangular Pediments
        const windowGeo = new THREE.BoxGeometry(8, 12, 3);
        const windowMesh = new THREE.Mesh(windowGeo, glassWindowMat);
        windowMesh.position.set(archX, 46, 38);
        this.group.add(windowMesh);

        // Stone Window Sill & Architrave
        const sillGeo = new THREE.BoxGeometry(10.5, 1.4, 4.5);
        const sill = new THREE.Mesh(sillGeo, facadeCreamMat);
        sill.position.set(archX, 39.5, 38.5);
        this.group.add(sill);

        // Window Triangular Hood Pediment
        const hoodGeo = new THREE.ConeGeometry(6.5, 3.2, 4);
        const hood = new THREE.Mesh(hoodGeo, facadeCreamMat);
        hood.rotation.y = Math.PI / 4;
        hood.position.set(archX, 53.5, 39);
        this.group.add(hood);
      }

      // Classical Roofline Parapet Balustrade
      const balustradeRailGeo = new THREE.BoxGeometry(124, 2, 4);
      const balustradeRail = new THREE.Mesh(balustradeRailGeo, facadeCreamMat);
      balustradeRail.position.set(wingCenterX, 63, 36);
      this.group.add(balustradeRail);

      // Ornamental Corner Urns atop Wing Piers
      for (let corner of [-58, 58]) {
        const urnGeo = new THREE.CylinderGeometry(2, 1.2, 5, 12);
        const urn = new THREE.Mesh(urnGeo, facadeCreamMat);
        urn.position.set(wingCenterX + corner, 65, 36);
        urn.castShadow = true;
        this.group.add(urn);
      }
    }

    // =========================================================================
    // 7. INDIAN NATIONAL FLAG (TIRANGA) & MONUMENTAL MAST
    // =========================================================================

    // Monumental Stainless Steel / Brass Mast
    const mastBaseGeo = new THREE.CylinderGeometry(3.5, 4.5, 4, 24);
    const mastBase = new THREE.Mesh(mastBaseGeo, sandstoneRedMat);
    mastBase.position.set(0, 2.5, 160);
    mastBase.castShadow = true;
    this.group.add(mastBase);

    const mastGeo = new THREE.CylinderGeometry(0.7, 1.4, 75, 20);
    const mast = new THREE.Mesh(mastGeo, darkIronMat);
    mast.position.set(0, 41, 160);
    mast.castShadow = true;
    this.group.add(mast);

    // Mast Golden Ball Finial
    const mastBallGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const mastBall = new THREE.Mesh(mastBallGeo, goldTrimMat);
    mastBall.position.set(0, 78.5, 160);
    this.group.add(mastBall);

    // Official 3:2 Proportions Indian Flag with 24-Spoke Ashoka Chakra Texture
    const flagTexture = createIndianFlagTexture(1024, 683);

    // Subdivided Plane Geometry for Dynamic Wave Simulation (Width: 18, Height: 12)
    const flagGeo = new THREE.PlaneGeometry(18, 12, 44, 28);
    // Offset geometry so left edge (x=0) is fixed at the mast, extending to x=18
    flagGeo.translate(9, 0, 0);

    // Custom Wind Wave Vertex Shader with Dynamic Normal Perturbation & Translucency
    this.flagClothMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFlagMap: { value: flagTexture },
        uSunDirection: { value: new THREE.Vector3(220, 380, 260).normalize() }
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Normalized coordinate along flag length: 0.0 at mast, 1.0 at free fly edge
          float nx = clamp(pos.x / 18.0, 0.0, 1.0);
          float weight = pow(nx, 1.15);

          // Aerodynamic travelling sine wave harmonics
          float w1 = sin(nx * 5.2 - uTime * 4.2) * 1.5;
          float w2 = sin(nx * 8.5 + pos.y * 0.4 - uTime * 6.5) * 0.5;
          float w3 = sin(nx * 14.0 - uTime * 9.0) * 0.2;
          pos.z += (w1 + w2 + w3) * weight;

          // Compute perturbed surface normal from wave partial derivatives
          float dzdx = (5.2 * cos(nx * 5.2 - uTime * 4.2) * 1.5 + 8.5 * cos(nx * 8.5 + pos.y * 0.4 - uTime * 6.5) * 0.5) * (weight / 18.0);
          float dzdy = (0.4 * cos(nx * 8.5 + pos.y * 0.4 - uTime * 6.5) * 0.5) * weight;
          vec3 tangent = vec3(1.0, 0.0, dzdx);
          vec3 bitangent = vec3(0.0, 1.0, dzdy);
          vec3 calcNormal = normalize(cross(tangent, bitangent));

          vNormal = normalize(normalMatrix * calcNormal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uFlagMap;
        uniform vec3 uSunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec4 tex = texture2D(uFlagMap, vUv);

          // Sunlight diffuse lighting + fabric backscattering translucency
          vec3 n = normalize(vNormal);
          float sunDiff = max(0.0, dot(n, uSunDirection));
          float backScatter = max(0.0, dot(-n, uSunDirection)) * 0.45;
          float light = 0.55 + 0.45 * (sunDiff + backScatter);

          // Subtle fabric sheen along folds
          float sheen = pow(1.0 - abs(n.z), 3.0) * 0.15;

          vec3 finalColor = tex.rgb * light + vec3(sheen);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });

    this.flagMesh = new THREE.Mesh(flagGeo, this.flagClothMaterial);
    this.flagMesh.position.set(0.6, 70, 160);
    this.flagMesh.castShadow = true;
    this.group.add(this.flagMesh);

    // =========================================================================
    // 8. DELHI AVENUE TREES & CAMPUS STREETLAMPS
    // =========================================================================

    // A. 14 Royal Palm Trees (Roystonea regia) lining the Semicircular Driveway
    for (let p = 0; p < 14; p++) {
      const angle = (p * Math.PI / 13);
      const rad = 175;
      const px = Math.cos(angle) * rad;
      const pz = 160 + Math.sin(angle) * 75;

      const palmGroup = new THREE.Group();

      // Ringed Grey Trunk
      const trunkGeo = new THREE.CylinderGeometry(1.2, 1.8, 32, 12);
      const trunk = new THREE.Mesh(trunkGeo, palmBarkMat);
      trunk.position.y = 16;
      trunk.castShadow = true;
      palmGroup.add(trunk);

      // Feather Palm Fronds Fan
      for (let f = 0; f < 8; f++) {
        const frondAngle = (f * Math.PI * 2) / 8;
        const frondGeo = new THREE.PlaneGeometry(16, 5);
        const frond = new THREE.Mesh(frondGeo, palmFrondMat);
        frond.position.set(Math.sin(frondAngle) * 6, 32, Math.cos(frondAngle) * 6);
        frond.rotation.y = frondAngle;
        frond.rotation.x = 0.45;
        palmGroup.add(frond);
      }

      palmGroup.position.set(px, 0, pz);
      this.group.add(palmGroup);
    }

    // B. 6 Spreading Mature Shade Trees (Neem / Peepal) framing the Wings
    const shadeTreePositions = [
      { x: -240, z: 30 }, { x: -260, z: 90 }, { x: -230, z: 150 },
      { x: 240, z: 30 },  { x: 260, z: 90 },  { x: 230, z: 150 }
    ];

    shadeTreePositions.forEach(tp => {
      const treeGroup = new THREE.Group();

      // Gnarled Trunk
      const trunkGeo = new THREE.CylinderGeometry(2.5, 3.8, 22, 12);
      const trunk = new THREE.Mesh(trunkGeo, palmBarkMat);
      trunk.position.y = 11;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Dense Organic Leaf Canopy Cluster (3 overlapping spheres)
      for (let c = 0; c < 3; c++) {
        const canopyGeo = new THREE.SphereGeometry(14 + c * 2, 12, 10);
        const canopy = new THREE.Mesh(canopyGeo, hedgeMat);
        canopy.position.set((c - 1) * 6, 26 + c * 3, (c % 2) * 5);
        canopy.castShadow = true;
        treeGroup.add(canopy);
      }

      treeGroup.position.set(tp.x, 0, tp.z);
      this.group.add(treeGroup);
    });

    // C. 12 Cast-Iron Municipal Delhi Streetlamps along Driveway & Pathways
    for (let l = 0; l < 8; l++) {
      const angle = (l * Math.PI / 7);
      const lx = Math.cos(angle) * 82;
      const lz = 160 + Math.sin(angle) * 36;

      const lampGroup = new THREE.Group();

      const postGeo = new THREE.CylinderGeometry(0.5, 0.8, 16, 12);
      const post = new THREE.Mesh(postGeo, darkIronMat);
      post.position.y = 8;
      post.castShadow = true;
      lampGroup.add(post);

      const lanternGeo = new THREE.SphereGeometry(1.4, 16, 16);
      const lantern = new THREE.Mesh(lanternGeo, lampGlowMat);
      lantern.position.y = 16.5;
      lampGroup.add(lantern);

      lampGroup.position.set(lx, 0, lz);
      this.group.add(lampGroup);
    }

    // D. Low Sandstone Perimeter Boundary Wall with Ornamental Iron Railings
    for (let side of [-1, 1]) {
      const wallGeo = new THREE.BoxGeometry(140, 3.5, 2.5);
      const wall = new THREE.Mesh(wallGeo, sandstoneRedMat);
      wall.position.set(side * 220, 1.75, 230);
      wall.castShadow = true;
      this.group.add(wall);

      const railGeo = new THREE.BoxGeometry(140, 6, 1);
      const rail = new THREE.Mesh(railGeo, darkIronMat);
      rail.position.set(side * 220, 6.5, 230);
      rail.castShadow = true;
      this.group.add(rail);
    }

    // =========================================================================
    // 9. ANIMATION & WIND UPDATE LOOP
    // =========================================================================
    threeScene.registerUpdatable((delta, time) => {
      if (!this.group.visible) return;

      // Update flag dynamic cloth physics simulation time
      if (this.flagClothMaterial && this.flagClothMaterial.uniforms.uTime) {
        this.flagClothMaterial.uniforms.uTime.value = time;
      }
    });

    this.isBuilt = true;
    console.log('[ExteriorScene] High-Fidelity Supreme Court Architectural Reconstruction initialized.');
  }
}

export const exteriorScene = new SupremeCourtExteriorScene();
