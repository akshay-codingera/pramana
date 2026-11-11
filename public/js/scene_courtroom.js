/**
 * PRAMANA — Grand Judicial Chamber Architecture
 * Authentic Architectural Reconstruction of the Supreme Court of India Courtroom No. 1
 * Features:
 * - Monumental Coffered Ceiling with Central Grand Rotunda Dome, 16 Radial Meridian Ribs, and Gilded Oculus
 * - 3-Tiered Brass & Crystal Judicial Chandelier with 32 Flame Lamps and Cove Illumination
 * - High-Fidelity Indian Burma Teak Wainscoting, Fluted Pilasters, Classical Dentil Cornices & Baseboards
 * - Herringbone Parquet Timber Flooring with Royal Crimson Velvet Central Runner Carpet
 * - 3-Tiered Elevated Judicial Dais with Bullnose Brass Nosings
 * - Magnificent Curved Indian Teak Judicial Bench with 12 Fielded Facade Panels, Brass Mouldings, and Workstations
 * - Circular Carved Teak & Antique Gold State Emblem of India Plaque with Sacred Mottos in Pristine Typography:
 *   "सत्यमेव जयते" (Satyameva Jayate) & "यतो धर्मस्ततो जयः" (Yato Dharmastato Jayah)
 * - Three Stately High-Backed Burgundy Tufted Leather Judicial Armchairs with Scrolled Finial Crests
 * - Advocates' Well: Lowered Court Master / Stenographer Desks, Senior Counsel Tables, and Central Speaking Lectern
 * - Turned Teak Bar Railing with Brass Spherical Finials and Central Swinging Gates
 * - Tiered Visitor Gallery & Press Section with Burgundy Leather Padded Benches
 * - Comprehensive Warm Chamber Illumination (Chandelier, Downlights, Sconces, Cove, and Emblem Picture-Light)
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';
import {
  createTeakWoodPBR,
  createCourtroomParquetPBR,
  createBurgundyLeatherPBR,
  createAshokaEmblemPBR,
  createLawBookSpineTexture,
  createCofferedCeilingPBR,
  createSandstonePBR,
  createBrassPBR
} from './procedural_textures.js';

class CourtroomScene {
  constructor() {
    this.group = new THREE.Group();
    this.isBuilt = false;
  }

  build() {
    if (this.isBuilt) return;

    threeScene.courtroomGroup.add(this.group);

    // =========================================================================
    // 1. MATERIAL PALETTES & PROCEDURAL PBR SHADERS
    // =========================================================================

    // A. Indian Burma Teak Wood (Satin Lacquer Furniture & Architectural Wainscoting)
    const teakPBR = createTeakWoodPBR(512, 512);
    teakPBR.map.repeat.set(3, 3);
    teakPBR.normalMap.repeat.set(3, 3);
    teakPBR.roughnessMap.repeat.set(3, 3);

    const teakMat = new THREE.MeshStandardMaterial({
      map: teakPBR.map,
      normalMap: teakPBR.normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughnessMap: teakPBR.roughnessMap,
      roughness: 0.48,
      metalness: 0.04
    });

    // Darker Carved Teak for Mouldings, Pilasters & Heavy Frames
    const darkTeakMat = new THREE.MeshStandardMaterial({
      color: 0x34190c,
      map: teakPBR.map,
      normalMap: teakPBR.normalMap,
      normalScale: new THREE.Vector2(0.40, 0.40),
      roughness: 0.50,
      metalness: 0.05
    });

    // B. Herringbone Courtroom Parquet Timber Flooring
    const parquetPBR = createCourtroomParquetPBR(1024, 1024);
    parquetPBR.map.repeat.set(5, 5);
    parquetPBR.normalMap.repeat.set(5, 5);
    parquetPBR.roughnessMap.repeat.set(5, 5);

    const parquetMat = new THREE.MeshStandardMaterial({
      map: parquetPBR.map,
      normalMap: parquetPBR.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: parquetPBR.roughnessMap,
      roughness: 0.42,
      metalness: 0.03
    });

    // C. Upper Wall Acoustic Plaster (Warm Institutional Cream)
    const plasterPBR = createSandstonePBR({ baseColor: '#ede7db', veinColor: '#c9c0ac', hasBlocks: false, width: 512, height: 512 });
    const plasterMat = new THREE.MeshStandardMaterial({
      map: plasterPBR.map,
      normalMap: plasterPBR.normalMap,
      normalScale: new THREE.Vector2(0.30, 0.30),
      roughness: 0.85,
      metalness: 0.0
    });

    // D. Monumental Coffered Ceiling Suite
    const cofferedCeilingPBR = createCofferedCeilingPBR(1024, 1024);
    cofferedCeilingPBR.map.repeat.set(4, 5);
    cofferedCeilingPBR.normalMap.repeat.set(4, 5);
    cofferedCeilingPBR.roughnessMap.repeat.set(4, 5);

    const cofferedCeilingMat = new THREE.MeshStandardMaterial({
      map: cofferedCeilingPBR.map,
      normalMap: cofferedCeilingPBR.normalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughnessMap: cofferedCeilingPBR.roughnessMap,
      roughness: 0.55,
      metalness: 0.08
    });

    // E. State Emblem of India Plaque PBR
    const emblemPBR = createAshokaEmblemPBR(1024, 1024);
    const emblemMat = new THREE.MeshStandardMaterial({
      map: emblemPBR.map,
      normalMap: emblemPBR.normalMap,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughnessMap: emblemPBR.roughnessMap,
      roughness: 0.32,
      metalness: 0.82
    });

    // F. Deep Imperial Burgundy Judicial Leather (Chairs & Cushions)
    const burgundyLeatherPBR = createBurgundyLeatherPBR(512, 512);
    const burgundyLeatherMat = new THREE.MeshStandardMaterial({
      map: burgundyLeatherPBR.map,
      normalMap: burgundyLeatherPBR.normalMap,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughnessMap: burgundyLeatherPBR.roughnessMap,
      roughness: 0.50,
      metalness: 0.08
    });

    // G. Deep Judicial Green Desk Blotter Leather
    const greenBlotterMat = new THREE.MeshStandardMaterial({
      color: 0x143522,
      roughness: 0.58,
      metalness: 0.05
    });

    // H. Polished Antique Brass & Gold Leaf
    const brassPBR = createBrassPBR(256, 256);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      map: brassPBR.map,
      normalMap: brassPBR.normalMap,
      roughness: 0.28,
      metalness: 0.85
    });

    // I. Law Library Bookshelf Spines
    const bookSpineTex = createLawBookSpineTexture(512, 512);
    bookSpineTex.repeat.set(3, 1);
    const bookSpineMat = new THREE.MeshStandardMaterial({
      map: bookSpineTex,
      roughness: 0.60,
      metalness: 0.15
    });

    // J. Crimson Velvet Central Runner Carpet
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0x5a0f1b,
      roughness: 0.90,
      metalness: 0.02
    });

    // K. Courtroom Monitor Displays
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0a101d,
      roughness: 0.18,
      metalness: 0.35,
      emissive: 0x0a1e36,
      emissiveIntensity: 0.55
    });

    // =========================================================================
    // 2. CHAMBER ENCLOSURE (FLOOR, VELVET RUNNER, AND WALLS)
    // =========================================================================

    // Chamber dimensions: Width 108, Depth 124, Height 36
    // A. Main Courtroom Floor
    const floorGeo = new THREE.PlaneGeometry(108, 124);
    const floorMesh = new THREE.Mesh(floorGeo, parquetMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // B. Royal Crimson Velvet Central Runner Carpet leading down aisle
    const runnerGeo = new THREE.PlaneGeometry(7.8, 86);
    const runnerMesh = new THREE.Mesh(runnerGeo, carpetMat);
    runnerMesh.rotation.x = -Math.PI / 2;
    runnerMesh.position.set(0, 0.03, 17);
    runnerMesh.receiveShadow = true;
    this.group.add(runnerMesh);

    // Fine Gold Embroidered Border on Runner
    const runnerBorderGeo = new THREE.PlaneGeometry(8.2, 86.4);
    const runnerBorderMesh = new THREE.Mesh(runnerBorderGeo, brassMat);
    runnerBorderMesh.rotation.x = -Math.PI / 2;
    runnerBorderMesh.position.set(0, 0.02, 17);
    this.group.add(runnerBorderMesh);

    // C. Monumental Rear Judicial Wall (Z = -46)
    const backWallGroup = new THREE.Group();
    backWallGroup.position.set(0, 0, -46);

    // Upper Plaster Wall Surface (Y = 18 to 36)
    const backUpperGeo = new THREE.BoxGeometry(108, 18, 2.0);
    const backUpper = new THREE.Mesh(backUpperGeo, plasterMat);
    backUpper.position.set(0, 27, 0);
    backUpper.receiveShadow = true;
    backWallGroup.add(backUpper);

    // Rich Teak Wainscoting & Panelling (Y = 0 to 18)
    const backWainscotGeo = new THREE.BoxGeometry(108, 18, 2.4);
    const backWainscot = new THREE.Mesh(backWainscotGeo, teakMat);
    backWainscot.position.set(0, 9, 0.2);
    backWainscot.receiveShadow = true;
    backWallGroup.add(backWainscot);

    // Stepped Teak Baseboard
    const baseboardGeo = new THREE.BoxGeometry(108.4, 2.2, 3.0);
    const baseboard = new THREE.Mesh(baseboardGeo, darkTeakMat);
    baseboard.position.set(0, 1.1, 0.4);
    backWallGroup.add(baseboard);

    // Classical Teak Chair Rail & Dentil Cornice at Y = 18
    const chairRailGeo = new THREE.BoxGeometry(108.4, 1.4, 3.2);
    const chairRail = new THREE.Mesh(chairRailGeo, darkTeakMat);
    chairRail.position.set(0, 18.0, 0.4);
    backWallGroup.add(chairRail);

    // Grand Arched Judicial Niche (Centred behind the dais)
    const nicheFrameGeo = new THREE.BoxGeometry(36, 26, 2.2);
    const nicheFrame = new THREE.Mesh(nicheFrameGeo, darkTeakMat);
    nicheFrame.position.set(0, 18.0, 0.8);
    backWallGroup.add(nicheFrame);

    // Recessed Niche Backing with Acoustic Vertical Teak Slats
    const nicheBackGeo = new THREE.BoxGeometry(32, 23, 1.0);
    const nicheBack = new THREE.Mesh(nicheBackGeo, teakMat);
    nicheBack.position.set(0, 18.0, 1.8);
    backWallGroup.add(nicheBack);

    // Fluted Corinthian/Indian Pilasters flanking Judicial Niche
    [-17, 17].forEach(px => {
      const colGeo = new THREE.CylinderGeometry(1.2, 1.4, 25, 16);
      const col = new THREE.Mesh(colGeo, darkTeakMat);
      col.position.set(px, 17.5, 2.2);
      col.castShadow = true;
      backWallGroup.add(col);

      // Carved Capital
      const capGeo = new THREE.BoxGeometry(3.6, 2.2, 3.2);
      const cap = new THREE.Mesh(capGeo, brassMat);
      cap.position.set(px, 30.5, 2.2);
      backWallGroup.add(cap);

      // Plinth Base
      const plinthGeo = new THREE.BoxGeometry(3.6, 3.2, 3.2);
      const plinth = new THREE.Mesh(plinthGeo, darkTeakMat);
      plinth.position.set(px, 1.6, 2.2);
      backWallGroup.add(plinth);
    });

    // =========================================================================
    // 3. THE STATE EMBLEM OF INDIA & SATYAMEVA JAYATE
    // =========================================================================

    // A. Heavy Carved Teak Plaque Base
    const plaqueBaseGeo = new THREE.CylinderGeometry(6.6, 6.6, 0.8, 64);
    const plaqueBase = new THREE.Mesh(plaqueBaseGeo, darkTeakMat);
    plaqueBase.rotation.x = Math.PI / 2;
    plaqueBase.position.set(0, 20.0, 2.6);
    plaqueBase.castShadow = true;
    backWallGroup.add(plaqueBase);

    // B. Upright Emblem Face (CircleGeometry in XY plane facing directly forward +Z)
    // Guarantees zero rotation ambiguity: Ashoka Lions on top, Satyameva Jayate below
    const emblemFaceGeo = new THREE.CircleGeometry(6.35, 64);
    const emblemFace = new THREE.Mesh(emblemFaceGeo, emblemMat);
    emblemFace.position.set(0, 20.0, 3.02);
    backWallGroup.add(emblemFace);

    // C. Outer Gilded Beveled Trim Ring
    const emblemTrimGeo = new THREE.TorusGeometry(6.4, 0.45, 16, 64);
    const emblemTrim = new THREE.Mesh(emblemTrimGeo, brassMat);
    emblemTrim.position.set(0, 20.0, 3.05);
    backWallGroup.add(emblemTrim);

    // D. Dedicated Brass Picture-Light Fixture overhead illuminating the mottos
    const picLightArmGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.8, 8);
    const picLightArm = new THREE.Mesh(picLightArmGeo, brassMat);
    picLightArm.rotation.x = Math.PI / 2;
    picLightArm.position.set(0, 27.2, 2.8);
    backWallGroup.add(picLightArm);

    const picLightShadeGeo = new THREE.CylinderGeometry(0.5, 0.5, 7.5, 16);
    const picLightShade = new THREE.Mesh(picLightShadeGeo, brassMat);
    picLightShade.rotation.z = Math.PI / 2;
    picLightShade.position.set(0, 27.2, 4.2);
    backWallGroup.add(picLightShade);

    // Dedicated focused spotlight on State Emblem & Motto
    const emblemSpot = new THREE.SpotLight(0xfff0d4, 3.5);
    emblemSpot.position.set(0, 25, -34);
    emblemSpot.target = emblemFace;
    emblemSpot.angle = Math.PI / 4.0;
    emblemSpot.penumbra = 0.45;
    emblemSpot.decay = 1.6;
    emblemSpot.distance = 30;
    emblemSpot.castShadow = true;
    this.group.add(emblemSpot);

    // Flanking Legal Reference Bookshelves behind Bench
    [-34, 34].forEach(bx => {
      const shelfCaseGeo = new THREE.BoxGeometry(16, 17, 3.0);
      const shelfCase = new THREE.Mesh(shelfCaseGeo, darkTeakMat);
      shelfCase.position.set(bx, 10.5, 1.4);
      backWallGroup.add(shelfCase);

      // 4 Shelves of Bound Law Reports (Supreme Court Reports / AIR)
      for (let s = 0; s < 4; s++) {
        const sy = 4.0 + s * 4.0;
        const bookGeo = new THREE.PlaneGeometry(14.8, 3.4);
        const bookRow = new THREE.Mesh(bookGeo, bookSpineMat);
        bookRow.position.set(bx, sy, 3.0);
        backWallGroup.add(bookRow);
      }
    });

    this.group.add(backWallGroup);

    // D. Lateral Walls (Left: X = -54, Right: X = +54)
    [-54, 54].forEach(wx => {
      const sideGroup = new THREE.Group();
      sideGroup.position.set(wx, 0, 0);
      const rotY = wx < 0 ? Math.PI / 2 : -Math.PI / 2;
      sideGroup.rotation.y = rotY;

      // Wainscoting & Upper Plaster
      const sideUpper = new THREE.Mesh(new THREE.BoxGeometry(124, 18, 2.0), plasterMat);
      sideUpper.position.set(0, 27, 0);
      sideUpper.receiveShadow = true;
      sideGroup.add(sideUpper);

      const sideWainscot = new THREE.Mesh(new THREE.BoxGeometry(124, 18, 2.4), teakMat);
      sideWainscot.position.set(0, 9, 0.2);
      sideWainscot.receiveShadow = true;
      sideGroup.add(sideWainscot);

      // Classical Chair Rail & Baseboard
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(124.4, 1.4, 3.0), darkTeakMat);
      sideRail.position.set(0, 18.0, 0.4);
      sideGroup.add(sideRail);

      const sideBase = new THREE.Mesh(new THREE.BoxGeometry(124.4, 2.2, 3.0), darkTeakMat);
      sideBase.position.set(0, 1.1, 0.4);
      sideGroup.add(sideBase);

      // Pilasters dividing lateral walls into 6 bays
      for (let b = -2; b <= 2; b++) {
        const bz = b * 22;
        const pilaster = new THREE.Mesh(new THREE.BoxGeometry(2.4, 34, 1.2), darkTeakMat);
        pilaster.position.set(bz, 17.0, 1.4);
        sideGroup.add(pilaster);

        // Brass Twin-Arm Wall Sconces
        const sconceArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.8, 8), brassMat);
        sconceArm.rotation.x = Math.PI / 2;
        sconceArm.position.set(bz, 19.5, 2.4);
        sideGroup.add(sconceArm);

        [-0.8, 0.8].forEach(sx => {
          const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 1.2, 12), brassMat);
          shade.position.set(bz + sx, 20.2, 3.0);
          sideGroup.add(shade);

          // Warm luminous sconce bulb
          const bulbGeo = new THREE.SphereGeometry(0.25, 8, 8);
          const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffe2a4, emissive: 0xffd27d, emissiveIntensity: 1.4 });
          const bulb = new THREE.Mesh(bulbGeo, bulbMat);
          bulb.position.set(bz + sx, 20.8, 3.0);
          sideGroup.add(bulb);
        });

        // Local Warm Sconce Fill Light to illuminate wood panelling
        const sconceFill = new THREE.PointLight(0xffe0a8, 0.9, 22, 1.8);
        sconceFill.position.set(bz, 21.0, 4.0);
        sideGroup.add(sconceFill);

        // Built-in Bookcases in alternating bays
        if (Math.abs(b) === 1) {
          const libGeo = new THREE.BoxGeometry(14, 15, 2.2);
          const libMesh = new THREE.Mesh(libGeo, darkTeakMat);
          libMesh.position.set(bz, 9.5, 1.0);
          sideGroup.add(libMesh);

          for (let s = 0; s < 3; s++) {
            const row = new THREE.Mesh(new THREE.PlaneGeometry(13.2, 3.6), bookSpineMat);
            row.position.set(bz, 4.0 + s * 4.2, 2.2);
            sideGroup.add(row);
          }
        }
      }

      this.group.add(sideGroup);
    });

    // Courtroom Wall Clock (Left wall)
    const clockGroup = new THREE.Group();
    clockGroup.position.set(-52.6, 22.5, 0);
    clockGroup.rotation.y = Math.PI / 2;

    const clockRim = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.5, 32), brassMat);
    clockRim.rotation.x = Math.PI / 2;
    clockGroup.add(clockRim);

    const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.55, 32), new THREE.MeshStandardMaterial({ color: 0xfaf6ec, roughness: 0.3 }));
    clockFace.rotation.x = Math.PI / 2;
    clockGroup.add(clockFace);
    this.group.add(clockGroup);

    // E. Entrance Portal & Rear Wall (Z = 62)
    const rearWallGroup = new THREE.Group();
    rearWallGroup.position.set(0, 0, 62);
    rearWallGroup.rotation.y = Math.PI;

    const rearUpper = new THREE.Mesh(new THREE.BoxGeometry(108, 18, 2.0), plasterMat);
    rearUpper.position.set(0, 27, 0);
    rearUpper.receiveShadow = true;
    rearWallGroup.add(rearUpper);

    const rearWainscot = new THREE.Mesh(new THREE.BoxGeometry(108, 18, 2.4), teakMat);
    rearWainscot.position.set(0, 9, 0.2);
    rearWainscot.receiveShadow = true;
    rearWallGroup.add(rearWainscot);

    // Monumental Carved Double Teak Doors
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(14, 20, 2.8), darkTeakMat);
    doorFrame.position.set(0, 10, 0.8);
    rearWallGroup.add(doorFrame);

    [-3.2, 3.2].forEach(dx => {
      const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(6.0, 18.5, 1.4), teakMat);
      doorLeaf.position.set(dx, 9.5, 1.6);
      doorLeaf.castShadow = true;
      rearWallGroup.add(doorLeaf);

      // Heavy Brass Door Handle & Push Plate
      const handlePlate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 0.2), brassMat);
      handlePlate.position.set(dx - Math.sign(dx) * 1.8, 9.5, 2.4);
      rearWallGroup.add(handlePlate);
    });

    this.group.add(rearWallGroup);

    // =========================================================================
    // 4. THE GRAND ROTUNDA & COFFERED CEILING
    // =========================================================================

    // Perimeter Flat Coffered Ceiling at Y = 34 with central circular opening for rotunda
    const ceilShape = new THREE.Shape();
    ceilShape.moveTo(-54, -62);
    ceilShape.lineTo(54, -62);
    ceilShape.lineTo(54, 62);
    ceilShape.lineTo(-54, 62);
    ceilShape.closePath();

    // Central circular hole for the monumental rotunda dome
    const rotundaHole = new THREE.Path();
    rotundaHole.absarc(0, -6, 24.2, 0, Math.PI * 2, true);
    ceilShape.holes.push(rotundaHole);

    const ceilGeo = new THREE.ShapeGeometry(ceilShape, 48);
    const ceilMesh = new THREE.Mesh(ceilGeo, cofferedCeilingMat);
    ceilMesh.position.set(0, 34.0, 0);
    ceilMesh.rotation.x = Math.PI / 2;
    this.group.add(ceilMesh);

    // Central Rotunda Dome (Opening in ceiling from Z = -28 to Z = 16, Radius = 24)
    const rotundaGroup = new THREE.Group();
    rotundaGroup.position.set(0, 34.0, -6);

    // Octagonal Drum Cornice
    const drumGeo = new THREE.CylinderGeometry(24.5, 24.5, 3.2, 48, 1, true);
    const drumMesh = new THREE.Mesh(drumGeo, darkTeakMat);
    drumMesh.position.y = 1.6;
    rotundaGroup.add(drumMesh);

    // Fluted Console Brackets around Drum
    for (let b = 0; b < 16; b++) {
      const bAng = (b * Math.PI * 2) / 16;
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.8, 2.2), darkTeakMat);
      bracket.position.set(Math.cos(bAng) * 24.0, 1.4, Math.sin(bAng) * 24.0);
      bracket.rotation.y = -bAng;
      rotundaGroup.add(bracket);
    }

    // Hemispherical Rotunda Dome Vault (Curving upward to Y = 46)
    const domeGeo = new THREE.SphereGeometry(24.0, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.7);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0e4,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.BackSide
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.y = 3.2;
    rotundaGroup.add(domeMesh);

    // 16 Gilded Radial Architectural Meridian Ribs
    for (let r = 0; r < 16; r++) {
      const rAng = (r * Math.PI * 2) / 16;
      const ribGeo = new THREE.BoxGeometry(0.75, 13.0, 0.75);
      const rib = new THREE.Mesh(ribGeo, brassMat);
      rib.position.set(Math.cos(rAng) * 12.0, 8.5, Math.sin(rAng) * 12.0);
      rib.rotation.y = -rAng;
      rib.rotation.x = Math.PI / 5.2;
      rotundaGroup.add(rib);
    }

    // Central Dome Rosette & Oculus at Summit
    const oculusGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.8, 32);
    const oculus = new THREE.Mesh(oculusGeo, brassMat);
    oculus.position.y = 12.0;
    rotundaGroup.add(oculus);

    // Hidden Rotunda Cove Illumination (Warm Amber Glow casting up into vault)
    const coveLight = new THREE.PointLight(0xffecd0, 3.8, 52, 1.6);
    coveLight.position.set(0, 6.5, 0);
    rotundaGroup.add(coveLight);

    // Monumental 3-Tiered Brass & Crystal Judicial Chandelier
    const chandelierGroup = new THREE.Group();
    chandelierGroup.position.set(0, -9.5, 0); // Suspended at Y = 24.5

    // Heavy Suspension Chains from Oculus down to Chandelier
    for (let c = 0; c < 4; c++) {
      const cAng = (c * Math.PI * 2) / 4;
      const chainGeo = new THREE.CylinderGeometry(0.08, 0.08, 12.5, 8);
      const chain = new THREE.Mesh(chainGeo, brassMat);
      chain.position.set(Math.cos(cAng) * 2.8, 6.0, Math.sin(cAng) * 2.8);
      chandelierGroup.add(chain);
    }

    // 3 Tiered Hexagonal Brass Rings with Candle Lights
    const tiers = [
      { r: 7.2, y: 0.0, lights: 16 },
      { r: 4.8, y: 2.2, lights: 10 },
      { r: 2.6, y: 4.2, lights: 6 }
    ];

    tiers.forEach(t => {
      const ringGeo = new THREE.TorusGeometry(t.r, 0.35, 12, 32);
      const ring = new THREE.Mesh(ringGeo, brassMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = t.y;
      chandelierGroup.add(ring);

      for (let l = 0; l < t.lights; l++) {
        const lAng = (l * Math.PI * 2) / t.lights;
        const lx = Math.cos(lAng) * t.r;
        const lz = Math.sin(lAng) * t.r;

        // Candle stalk & bobeche
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8), brassMat);
        stalk.position.set(lx, t.y + 0.45, lz);
        chandelierGroup.add(stalk);

        // Luminous Flame Bulb
        const bulbGeo = new THREE.SphereGeometry(0.22, 8, 8);
        const bulbMat = new THREE.MeshStandardMaterial({
          color: 0xfff0cc,
          emissive: 0xffd27d,
          emissiveIntensity: 2.4
        });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(lx, t.y + 1.1, lz);
        chandelierGroup.add(bulb);
      }
    });

    // Central Chamber Illumination Point Light from Chandelier
    const chLight = new THREE.PointLight(0xffeed2, 4.8, 80, 1.8);
    chLight.position.set(0, 1.5, 0);
    chLight.castShadow = true;
    chLight.shadow.bias = -0.0005;
    chandelierGroup.add(chLight);

    rotundaGroup.add(chandelierGroup);
    this.group.add(rotundaGroup);

    // Dedicated Gallery Chandelier (Y = 26, Z = 35)
    const galleryChandelier = new THREE.Group();
    galleryChandelier.position.set(0, 26, 35);

    const galRing = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.3, 12, 32), brassMat);
    galRing.rotation.x = Math.PI / 2;
    galleryChandelier.add(galRing);

    for (let gl = 0; gl < 12; gl++) {
      const gAng = (gl * Math.PI * 2) / 12;
      const gx = Math.cos(gAng) * 4.5;
      const gz = Math.sin(gAng) * 4.5;

      const gStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), brassMat);
      gStalk.position.set(gx, 0.4, gz);
      galleryChandelier.add(gStalk);

      const gBulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({
        color: 0xfff0cc,
        emissive: 0xffd27d,
        emissiveIntensity: 2.2
      }));
      gBulb.position.set(gx, 0.95, gz);
      galleryChandelier.add(gBulb);
    }

    const galLight = new THREE.PointLight(0xffeed2, 3.8, 65, 1.8);
    galLight.position.set(0, 1.0, 0);
    galleryChandelier.add(galLight);
    this.group.add(galleryChandelier);

    // Recessed Ceiling Downlights Grid across Chamber (Y = 33.5)
    [-22, 22].forEach(lx => {
      [-20, 5, 35].forEach(lz => {
        const downLight = new THREE.PointLight(0xffeed8, 1.4, 45, 1.6);
        downLight.position.set(lx, 33.5, lz);
        this.group.add(downLight);
      });
    });

    // =========================================================================
    // 5. THE ELEVATED JUDICIAL DAIS & 3-JUDGE BENCH
    // =========================================================================

    // A. 3-Tiered Stepped Dais Platform (Width 76 to 68, Depth 26 to 22)
    const daisGroup = new THREE.Group();
    daisGroup.position.set(0, 0, -32);

    const daisSteps = [
      { y: 0.6, w: 76, d: 26, riser: 0.6 },
      { y: 1.2, w: 72, d: 24, riser: 0.6 },
      { y: 1.8, w: 68, d: 22, riser: 0.6 }
    ];

    daisSteps.forEach(st => {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(st.w, st.riser, st.d), teakMat);
      stepMesh.position.set(0, st.y - st.riser / 2, 0);
      stepMesh.receiveShadow = true;
      daisGroup.add(stepMesh);

      // Brass Bullnose Nosing Strip along front edge
      const nosing = new THREE.Mesh(new THREE.BoxGeometry(st.w + 0.4, 0.22, 0.35), brassMat);
      nosing.position.set(0, st.y, st.d / 2);
      daisGroup.add(nosing);
    });

    // Dais Crimson Runner Rug
    const daisRug = new THREE.Mesh(new THREE.BoxGeometry(62, 0.04, 20), carpetMat);
    daisRug.position.set(0, 1.82, 0);
    daisRug.receiveShadow = true;
    daisGroup.add(daisRug);

    // =========================================================================
    // B. MAGNIFICENT CURVED INDIAN TEAK JUDICIAL BENCH
    // Solid Architectural Enclosure Renders Seamlessly Across Chamber
    // =========================================================================
    const benchGroup = new THREE.Group();
    benchGroup.position.set(0, 0, 0); // Dais-relative or global coordinates

    // Bench Dimensions:
    // Floor is Dais Tier 3 at Y = 1.8
    // Desktop Height is Y = 4.8 (height above dais = 3.0 units)
    // Desk Profile: Center section + Left Wing + Right Wing angled backwards

    // 1. Center Section (X = -9 to +9, Front Z = -23.5, Depth = 3.4)
    const centerDeskTop = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.35, 3.5), darkTeakMat);
    centerDeskTop.position.set(0, 4.8, -25.2);
    centerDeskTop.castShadow = true;
    centerDeskTop.receiveShadow = true;
    benchGroup.add(centerDeskTop);

    // Center Front Enclosing Wall Barrier (Y = 1.8 to 4.65)
    const centerFront = new THREE.Mesh(new THREE.BoxGeometry(18.2, 2.9, 0.6), teakMat);
    centerFront.position.set(0, 3.25, -23.5);
    centerFront.castShadow = true;
    centerFront.receiveShadow = true;
    benchGroup.add(centerFront);

    // Center Stepped Baseboard
    const centerBase = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.5, 0.8), darkTeakMat);
    centerBase.position.set(0, 2.05, -23.5);
    benchGroup.add(centerBase);

    // Center Brass Bullnose Trim
    const centerBrassTrim = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.15, 0.15), brassMat);
    centerBrassTrim.position.set(0, 4.95, -23.4);
    benchGroup.add(centerBrassTrim);

    // 4 Fielded Panels on Center Front
    for (let p = -1.5; p <= 1.5; p += 1.0) {
      const px = p * 4.2;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.0, 0.15), darkTeakMat);
      panel.position.set(px, 3.3, -23.15);
      benchGroup.add(panel);

      const panelTrim = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.15, 0.05), brassMat);
      panelTrim.position.set(px, 3.3, -23.1);
      benchGroup.add(panelTrim);
    }

    // 2. Left Wing (Angled backwards by 0.14 rad, Center X = -17.5, Z = -24.4)
    const leftWingGroup = new THREE.Group();
    leftWingGroup.position.set(-17.5, 0, -24.4);
    leftWingGroup.rotation.y = 0.14;

    const leftDeskTop = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.35, 3.5), darkTeakMat);
    leftDeskTop.position.set(0, 4.8, -1.6);
    leftDeskTop.castShadow = true;
    leftDeskTop.receiveShadow = true;
    leftWingGroup.add(leftDeskTop);

    const leftFront = new THREE.Mesh(new THREE.BoxGeometry(17.5, 2.9, 0.6), teakMat);
    leftFront.position.set(0, 3.25, 0.1);
    leftFront.castShadow = true;
    leftFront.receiveShadow = true;
    leftWingGroup.add(leftFront);

    const leftBase = new THREE.Mesh(new THREE.BoxGeometry(17.7, 0.5, 0.8), darkTeakMat);
    leftBase.position.set(0, 2.05, 0.1);
    leftWingGroup.add(leftBase);

    const leftBrassTrim = new THREE.Mesh(new THREE.BoxGeometry(17.7, 0.15, 0.15), brassMat);
    leftBrassTrim.position.set(0, 4.95, 0.2);
    leftWingGroup.add(leftBrassTrim);

    for (let p = -1.5; p <= 1.5; p += 1.0) {
      const px = p * 4.0;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, 0.15), darkTeakMat);
      panel.position.set(px, 3.3, 0.45);
      leftWingGroup.add(panel);
    }
    benchGroup.add(leftWingGroup);

    // 3. Right Wing (Angled backwards by -0.14 rad, Center X = 17.5, Z = -24.4)
    const rightWingGroup = new THREE.Group();
    rightWingGroup.position.set(17.5, 0, -24.4);
    rightWingGroup.rotation.y = -0.14;

    const rightDeskTop = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.35, 3.5), darkTeakMat);
    rightDeskTop.position.set(0, 4.8, -1.6);
    rightDeskTop.castShadow = true;
    rightDeskTop.receiveShadow = true;
    rightWingGroup.add(rightDeskTop);

    const rightFront = new THREE.Mesh(new THREE.BoxGeometry(17.5, 2.9, 0.6), teakMat);
    rightFront.position.set(0, 3.25, 0.1);
    rightFront.castShadow = true;
    rightFront.receiveShadow = true;
    rightWingGroup.add(rightFront);

    const rightBase = new THREE.Mesh(new THREE.BoxGeometry(17.7, 0.5, 0.8), darkTeakMat);
    rightBase.position.set(0, 2.05, 0.1);
    rightWingGroup.add(rightBase);

    const rightBrassTrim = new THREE.Mesh(new THREE.BoxGeometry(17.7, 0.15, 0.15), brassMat);
    rightBrassTrim.position.set(0, 4.95, 0.2);
    rightWingGroup.add(rightBrassTrim);

    for (let p = -1.5; p <= 1.5; p += 1.0) {
      const px = p * 4.0;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, 0.15), darkTeakMat);
      panel.position.set(px, 3.3, 0.45);
      rightWingGroup.add(panel);
    }
    benchGroup.add(rightWingGroup);

    // =========================================================================
    // C. THREE INDIVIDUAL JUDICIAL WORKSTATIONS ON BENCH TOP
    // =========================================================================
    const judgeSeats = [
      { x: 0,     z: -25.2, angle: 0,     isCJI: true },
      { x: -13.5, z: -25.8, angle: 0.14,  isCJI: false },
      { x: 13.5,  z: -25.8, angle: -0.14, isCJI: false }
    ];

    judgeSeats.forEach(s => {
      const wsGroup = new THREE.Group();
      wsGroup.position.set(s.x, 4.85, s.z);
      wsGroup.rotation.y = s.angle;

      // 1. Dark Green Judicial Leather Desk Blotter
      const blotter = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.06, 3.2), greenBlotterMat);
      blotter.position.set(0, 0.04, 0);
      blotter.receiveShadow = true;
      wsGroup.add(blotter);

      // Gold Tooled Border on Blotter
      const blotterBorder = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.03, 3.4), brassMat);
      blotterBorder.position.set(0, 0.02, 0);
      wsGroup.add(blotterBorder);

      // 2. Slim Courtroom Display Monitor in Teak Bezel
      const monBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.15, 16), darkTeakMat);
      monBase.position.set(2.5, 0.08, -1.0);
      wsGroup.add(monBase);

      const monArm = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 1.0, 8), brassMat);
      monArm.position.set(2.5, 0.6, -1.0);
      wsGroup.add(monArm);

      const monFrame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.0, 0.25), darkTeakMat);
      monFrame.position.set(2.5, 1.5, -1.0);
      monFrame.rotation.x = -0.12;
      monFrame.rotation.y = -0.18;
      wsGroup.add(monFrame);

      const monScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.7), screenMat);
      monScreen.position.set(2.5, 1.5, -0.87);
      monScreen.rotation.x = -0.12;
      monScreen.rotation.y = -0.18;
      wsGroup.add(monScreen);

      // 3. Digital Gooseneck Microphone on Cast Brass Base
      const micBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.2, 16), brassMat);
      micBase.position.set(-1.8, 0.1, -0.9);
      wsGroup.add(micBase);

      const micStem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), darkTeakMat);
      micStem.position.set(-1.8, 0.9, -0.75);
      micStem.rotation.x = 0.25;
      wsGroup.add(micStem);

      const micHead = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12), brassMat);
      micHead.position.set(-1.8, 1.6, -0.55);
      micHead.rotation.x = 0.25;
      wsGroup.add(micHead);

      // 4. Polished Brass Banker's Lamp with Green Glass Shade
      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.2, 16), brassMat);
      lampBase.position.set(-2.5, 0.1, -1.1);
      wsGroup.add(lampBase);

      const lampStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), brassMat);
      lampStalk.position.set(-2.5, 0.8, -1.1);
      wsGroup.add(lampStalk);

      const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 1.9, 16, 1, false, 0, Math.PI), greenBlotterMat);
      lampShade.rotation.z = Math.PI / 2;
      lampShade.position.set(-2.5, 1.5, -1.1);
      wsGroup.add(lampShade);

      // 5. Authentic Bound Judicial Briefs with Red Ribbon Tape
      const briefStack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 2.8), new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.8 }));
      briefStack.position.set(0.15, 0.25, -0.5);
      wsGroup.add(briefStack);

      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 2.82), carpetMat);
      ribbon.position.set(0.15, 0.25, -0.5);
      wsGroup.add(ribbon);

      benchGroup.add(wsGroup);
    });

    this.group.add(benchGroup);

    // =========================================================================
    // D. THREE STATELY HIGH-BACKED JUDICIAL ARMCHAIRS
    // =========================================================================
    judgeSeats.forEach(s => {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(s.x, 1.8, s.z - 3.4); // Placed on dais floor (Y = 1.8)
      chairGroup.rotation.y = s.angle;

      const chairH = s.isCJI ? 8.2 : 7.2; // Chief Justice seat is prominently elevated
      const chairW = s.isCJI ? 4.6 : 4.2;

      // Heavy Carved Teak Legs & Base Frame
      const legGeo = new THREE.BoxGeometry(0.45, 1.4, 0.45);
      [[-chairW * 0.44, -1.4], [chairW * 0.44, -1.4], [-chairW * 0.44, 1.4], [chairW * 0.44, 1.4]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, darkTeakMat);
        leg.position.set(lx, 0.7, lz);
        leg.castShadow = true;
        chairGroup.add(leg);
      });

      // Thick Padded Burgundy Seat Cushion
      const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(chairW, 0.7, 3.4), burgundyLeatherMat);
      seatMesh.position.set(0, 1.6, 0);
      seatMesh.castShadow = true;
      chairGroup.add(seatMesh);

      // High-Backed Curved Tufted Backrest
      const backMesh = new THREE.Mesh(new THREE.BoxGeometry(chairW, chairH, 0.75), burgundyLeatherMat);
      backMesh.position.set(0, 1.6 + chairH / 2, -1.4);
      backMesh.rotation.x = -0.05;
      backMesh.castShadow = true;
      chairGroup.add(backMesh);

      // Carved Teak Crest Rail at Top of Chair
      const crestMesh = new THREE.Mesh(new THREE.BoxGeometry(chairW + 0.6, 1.0, 1.0), darkTeakMat);
      crestMesh.position.set(0, 1.6 + chairH + 0.4, -1.5);
      chairGroup.add(crestMesh);

      // Center Chief Justice Finial Crest Accent
      if (s.isCJI) {
        const cFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 1.2, 16), brassMat);
        cFinial.position.set(0, 1.6 + chairH + 1.2, -1.5);
        chairGroup.add(cFinial);
      }

      // Carved Padded Armrests
      [-chairW * 0.52, chairW * 0.52].forEach(ax => {
        const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 3.0), darkTeakMat);
        armRest.position.set(ax, 2.6, 0);
        chairGroup.add(armRest);

        const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 2.4), burgundyLeatherMat);
        armPad.position.set(ax, 2.85, 0);
        chairGroup.add(armPad);
      });

      this.group.add(chairGroup);
    });

    this.group.add(daisGroup);

    // =========================================================================
    // 6. ADVOCATES' WELL & COURTROOM OFFICIALS
    // =========================================================================

    // A. Court Master & Stenographer's Lowered Desks (Directly in front of Dais at Z = -17.5)
    const officerDeskGroup = new THREE.Group();
    officerDeskGroup.position.set(0, 0, -17.5);

    const offDeskMesh = new THREE.Mesh(new THREE.BoxGeometry(22, 2.8, 4.2), teakMat);
    offDeskMesh.position.set(0, 1.4, 0);
    offDeskMesh.castShadow = true;
    officerDeskGroup.add(offDeskMesh);

    // Officer Monitors & Keyboards
    [-6.5, 6.5].forEach(ox => {
      const offMon = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.2), screenMat);
      offMon.position.set(ox, 3.8, -0.6);
      officerDeskGroup.add(offMon);

      const offChair = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.8, 2.4), darkTeakMat);
      offChair.position.set(ox, 1.9, 2.8);
      officerDeskGroup.add(offChair);
    });

    this.group.add(officerDeskGroup);

    // B. Central Speaking Lectern (Facing Judges at X = 0, Z = 3.2)
    const lecternGroup = new THREE.Group();
    lecternGroup.position.set(0, 0, 3.2);

    // Sculpted Octagonal Teak Base & Column
    const lectBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 0.6, 8), darkTeakMat);
    lectBase.position.y = 0.3;
    lectBase.castShadow = true;
    lecternGroup.add(lectBase);

    const lectColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 3.6, 8), teakMat);
    lectColumn.position.y = 2.4;
    lectColumn.castShadow = true;
    lecternGroup.add(lectColumn);

    // Slanted Reading Table Top
    const lectTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 2.8), darkTeakMat);
    lectTop.position.set(0, 4.3, 0);
    lectTop.rotation.x = -0.24; // Angled toward advocate
    lectTop.castShadow = true;
    lecternGroup.add(lectTop);

    // Brass Document Ledge & Gooseneck Mic
    const docLedge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 0.1), brassMat);
    docLedge.position.set(0, 4.0, 1.3);
    lecternGroup.add(docLedge);

    const lectMic = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), brassMat);
    lectMic.position.set(0, 5.0, -0.8);
    lectMic.rotation.x = 0.35;
    lecternGroup.add(lectMic);

    // Active Legal Brief on Lectern
    const activeDoc = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 1.6), new THREE.MeshStandardMaterial({ color: 0xfdfaf2, roughness: 0.9 }));
    activeDoc.position.set(0, 4.4, 0.1);
    activeDoc.rotation.x = -0.24;
    lecternGroup.add(activeDoc);

    this.group.add(lecternGroup);

    // C. Senior Counsel Advocate Tables (Left & Right of Lectern at Z = -4)
    [-17, 17].forEach(tx => {
      const advTableGroup = new THREE.Group();
      advTableGroup.position.set(tx, 0, -4);

      // Heavy Teak Table
      const advTable = new THREE.Mesh(new THREE.BoxGeometry(16, 2.8, 4.2), teakMat);
      advTable.position.set(0, 1.4, 0);
      advTable.castShadow = true;
      advTableGroup.add(advTable);

      // Desk blotter & file briefs
      const blot = new THREE.Mesh(new THREE.BoxGeometry(14, 0.05, 3.4), greenBlotterMat);
      blot.position.set(0, 2.83, 0);
      advTableGroup.add(blot);

      // 3 Leather Advocate Armchairs behind each table
      for (let c = -1; c <= 1; c++) {
        const chair = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.5, 3.0), burgundyLeatherMat);
        chair.position.set(c * 5.0, 2.25, 3.2);
        chair.castShadow = true;
        advTableGroup.add(chair);
      }

      this.group.add(advTableGroup);
    });

    // D. Traditional Turned Teak Bar Railing (Z = 12, separating Well from Gallery)
    const barRailGroup = new THREE.Group();
    barRailGroup.position.set(0, 0, 12.0);

    const railLength = 96;
    const gateWidth = 9.0; // Central opening for aisle

    // Left & Right Balustrade Sections
    [-1, 1].forEach(side => {
      const spanW = (railLength - gateWidth) / 2;
      const spanX = side * (gateWidth / 2 + spanW / 2);

      // Top Handrail
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(spanW, 0.45, 0.75), darkTeakMat);
      topRail.position.set(spanX, 3.4, 0);
      topRail.castShadow = true;
      barRailGroup.add(topRail);

      // Bottom Base Rail
      const botRail = new THREE.Mesh(new THREE.BoxGeometry(spanW, 0.45, 0.75), darkTeakMat);
      botRail.position.set(spanX, 0.5, 0);
      barRailGroup.add(botRail);

      // Turned Balusters along span
      const numBalusters = Math.floor(spanW / 1.6);
      for (let b = 0; b <= numBalusters; b++) {
        const bx = spanX - spanW / 2 + b * 1.6;
        const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.5, 12), teakMat);
        baluster.position.set(bx, 1.95, 0);
        baluster.castShadow = true;
        barRailGroup.add(baluster);
      }
    });

    // Gate Posts with Brass Finial Globes
    [-gateWidth / 2, gateWidth / 2].forEach(gx => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.8, 0.9), darkTeakMat);
      post.position.set(gx, 1.9, 0);
      post.castShadow = true;
      barRailGroup.add(post);

      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), brassMat);
      finial.position.set(gx, 4.15, 0);
      barRailGroup.add(finial);
    });

    this.group.add(barRailGroup);

    // =========================================================================
    // 7. TIERED VISITOR GALLERY & PRESS SECTION
    // =========================================================================

    const galleryGroup = new THREE.Group();
    galleryGroup.position.set(0, 0, 18);

    // 4 Tiered Stepped Rows (Z = 4, 12, 20, 28)
    const galleryRows = [
      { z: 4,  elev: 0.6 },
      { z: 12, elev: 1.2 },
      { z: 20, elev: 1.8 },
      { z: 28, elev: 2.4 }
    ];

    galleryRows.forEach(row => {
      // Step Platform across left and right sections
      [-1, 1].forEach(side => {
        const platW = 42;
        const platX = side * (5.5 + platW / 2);

        const platMesh = new THREE.Mesh(new THREE.BoxGeometry(platW, row.elev, 7.5), teakMat);
        platMesh.position.set(platX, row.elev / 2, row.z);
        platMesh.receiveShadow = true;
        galleryGroup.add(platMesh);

        // Continuous Teak Courtroom Pew Bench with Burgundy Cushion
        const benchBack = new THREE.Mesh(new THREE.BoxGeometry(platW - 2, 3.4, 0.5), darkTeakMat);
        benchBack.position.set(platX, row.elev + 2.0, row.z - 2.8);
        benchBack.castShadow = true;
        galleryGroup.add(benchBack);

        const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(platW - 2, 0.45, 2.4), burgundyLeatherMat);
        benchSeat.position.set(platX, row.elev + 1.2, row.z - 1.6);
        benchSeat.castShadow = true;
        galleryGroup.add(benchSeat);
      });
    });

    this.group.add(galleryGroup);

    this.isBuilt = true;
    console.log('[CourtroomScene] Grand Judicial Chamber architecture built successfully.');
  }
}

export const courtroomScene = new CourtroomScene();
