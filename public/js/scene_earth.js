/**
 * PRAMANA — Scene Earth & Space-to-Ground Sequence (Photorealistic Planetary Upgrade)
 * High-resolution NASA Blue Marble diffuse albedo, topographical normal mapping,
 * ocean specular reflectivity, night-side city lights, multi-layer dynamic clouds
 * with parallax shadows, and physical Rayleigh atmospheric scattering.
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';

class EarthScene {
  constructor() {
    this.group = threeScene.earthGroup;
    this.earthRadius = 100;
    this.earthMesh = null;
    this.cloudMesh = null;
    this.cloudShadowMesh = null;
    this.atmosphereMesh = null;
    this.starsMesh = null;
    this.indiaMarker = null;

    this.isBuilt = false;
  }

  build() {
    if (this.isBuilt) return;

    // 1. Deep Space Starfield
    this.createStarfield();

    // 2. Texture Pipeline — NASA Blue Marble & Planetary Maps
    const textureLoader = new THREE.TextureLoader();

    // Albedo / Diffuse: NASA Blue Marble high-resolution satellite imagery
    const dayMap = textureLoader.load('/assets/earth/earth_day_4k.jpg');
    dayMap.colorSpace = THREE.SRGBColorSpace;

    // Normal / Bump: Topographical elevation relief (Himalayas, Deccan, continental shelves)
    const normalMap = textureLoader.load('/assets/earth/earth_normal_2048.jpg');

    // Specular / Roughness Mask: Deep ocean reflectivity vs. matte landmasses
    const specularMap = textureLoader.load('/assets/earth/earth_specular_2048.jpg');

    // Emissive Night Lights: NASA Black Marble city lights on the dark terminator
    const lightsMap = textureLoader.load('/assets/earth/earth_lights_2048.png');

    // Cloud Layer: Real meteorological atmospheric circulation
    const cloudsMap = textureLoader.load('/assets/earth/earth_clouds_2k.jpg');

    // Enable high-fidelity anisotropic filtering if supported
    const maxAniso = (threeScene.renderer && threeScene.renderer.capabilities.getMaxAnisotropy) ? 
                     threeScene.renderer.capabilities.getMaxAnisotropy() : 4;
    [dayMap, normalMap, specularMap, lightsMap, cloudsMap].forEach(tex => {
      tex.anisotropy = Math.min(8, maxAniso);
    });

    // Space Directional Sun Light Vector
    const sunDirection = new THREE.Vector3(800, 300, 600).normalize();

    // 3. Realistic Planetary Earth Material with Custom Shader Injections
    const earthGeo = new THREE.SphereGeometry(this.earthRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: dayMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: specularMap,
      roughness: 0.8,
      metalness: 0.05,
      emissiveMap: lightsMap,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.0
    });

    // Custom shader injection for ocean specular reflectivity, night city lights,
    // and horizon Rayleigh atmospheric grazing haze
    earthMat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDirection = { value: sunDirection };

      // Add uniform to fragment shader
      shader.fragmentShader = `uniform vec3 uSunDirection;\n` + shader.fragmentShader;

      // In roughnessmap: Invert specular map: Oceans (white in spec map) get smooth roughness ~0.12; land gets rough ~0.90
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        #include <roughnessmap_fragment>
        #ifdef USE_ROUGHNESSMAP
          roughnessFactor = mix(0.90, 0.12, texelRoughness.r);
        #endif
        `
      );

      // In emissivemap: Modulate city lights to only illuminate the dark night hemisphere
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #ifdef USE_EMISSIVEMAP
          vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
          vec3 sunDirView = normalize((viewMatrix * vec4(uSunDirection, 0.0)).xyz);
          float sunDotVal = dot(normalize(vNormal), sunDirView);
          float nightFactor = 1.0 - smoothstep(-0.25, 0.05, sunDotVal);
          totalEmissiveRadiance = emissiveColor.rgb * vec3(1.0, 0.85, 0.52) * nightFactor * 2.2;
        #endif
        `
      );

      // In opaque_fragment: Inject daytime atmospheric horizon Rayleigh grazing haze
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `
        #include <opaque_fragment>
        vec3 vDir = -normalize(vViewPosition);
        vec3 sDir = normalize((viewMatrix * vec4(uSunDirection, 0.0)).xyz);
        float rimFresnel = pow(1.0 - max(0.0, dot(normal, vDir)), 3.0);
        float dayScatter = max(0.0, dot(normal, sDir));
        outgoingLight += vec3(0.2, 0.58, 1.0) * rimFresnel * dayScatter * 0.75;
        `
      );
    };

    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    // Physically authentic axial tilt (~23.4 deg) and orientation locking India towards initial camera
    this.earthMesh.rotation.x = THREE.MathUtils.degToRad(-24.0);
    this.earthMesh.rotation.y = THREE.MathUtils.degToRad(-164.5);
    this.group.add(this.earthMesh);

    // 4. Parallax Cloud Shadow Layer (Inset at radius * 1.004)
    const cloudShadowGeo = new THREE.SphereGeometry(this.earthRadius * 1.004, 64, 64);
    const cloudShadowMat = new THREE.MeshBasicMaterial({
      color: 0x020408,
      alphaMap: cloudsMap,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });
    this.cloudShadowMesh = new THREE.Mesh(cloudShadowGeo, cloudShadowMat);
    this.cloudShadowMesh.rotation.copy(this.earthMesh.rotation);
    this.group.add(this.cloudShadowMesh);

    // 5. Separate Outer Dynamic Cloud Sphere (Elevated at radius * 1.012)
    const cloudGeo = new THREE.SphereGeometry(this.earthRadius * 1.012, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      alphaMap: cloudsMap,
      transparent: true,
      opacity: 0.88,
      roughness: 0.95,
      metalness: 0.0,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    this.cloudMesh.rotation.copy(this.earthMesh.rotation);
    this.group.add(this.cloudMesh);

    // 6. Atmospheric Blue Rayleigh Scattering Rim Glow (Inverted BackSide Sphere)
    const atmoGeo = new THREE.SphereGeometry(this.earthRadius * 1.036, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: {
        uSunDirection: { value: sunDirection }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform vec3 uSunDirection;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // BackSide: normal points inward toward sphere center
          float viewDot = dot(normal, viewDir);
          float rim = pow(1.0 - max(0.0, viewDot), 2.8);

          // Atmospheric scattering is brightest on the sunlit limb
          vec3 sunDirView = normalize((viewMatrix * vec4(uSunDirection, 0.0)).xyz);
          float sunScatter = max(0.0, dot(-normal, sunDirView) * 0.6 + 0.4);

          vec3 deepBlue = vec3(0.12, 0.46, 0.98);
          vec3 cyanRim = vec3(0.55, 0.85, 1.0);
          vec3 atmoColor = mix(deepBlue, cyanRim, rim);

          float alpha = rim * sunScatter * 1.1;
          gl_FragColor = vec4(atmoColor, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    this.atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
    this.group.add(this.atmosphereMesh);

    // 7. Precise India / New Delhi Locus Coordinate Marker
    // Latitude 28.614° N, Longitude 77.209° E mapped exactly to equirectangular sphere UV:
    const u = (77.209 + 180) / 360;
    const v = (28.614 + 90) / 180;
    const theta = u * Math.PI * 2;
    const phi = (1 - v) * Math.PI;

    const markerPos = new THREE.Vector3(
      -(this.earthRadius * 1.01) * Math.cos(theta) * Math.sin(phi),
      (this.earthRadius * 1.01) * Math.cos(phi),
      (this.earthRadius * 1.01) * Math.sin(theta) * Math.sin(phi)
    );

    const markerGroup = new THREE.Group();
    const markerGeo = new THREE.RingGeometry(0.8, 1.6, 32);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ringMesh = new THREE.Mesh(markerGeo, markerMat);

    const dotGeo = new THREE.CircleGeometry(0.4, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);

    markerGroup.add(ringMesh);
    markerGroup.add(dotMesh);
    markerGroup.position.copy(markerPos);
    markerGroup.lookAt(markerPos.clone().multiplyScalar(2));
    this.indiaMarker = markerGroup;
    this.earthMesh.add(this.indiaMarker);

    // 8. Rotational Kinematics Update Loop
    threeScene.registerUpdatable((delta, time) => {
      if (!this.group.visible) return;

      // Realistic slow cloud circulation independent of terrain
      if (this.cloudMesh) {
        this.cloudMesh.rotation.y += delta * 0.005;
      }
      if (this.cloudShadowMesh) {
        this.cloudShadowMesh.rotation.y += delta * 0.005;
      }

      // Elegant pulse on New Delhi marker ring
      if (ringMesh) {
        const s = 1.0 + Math.sin(time * 3.2) * 0.18;
        ringMesh.scale.set(s, s, 1);
      }
    });

    this.isBuilt = true;
    console.log('[EarthScene] Photorealistic NASA Blue Marble Earth initialized.');
  }

  createStarfield() {
    const starCount = 3200;
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

      // Realistic stellar color temperature: white, cyan-blue, and warm yellow
      const tempType = Math.random();
      if (tempType > 0.8) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.65; // Warm K/M type
      } else if (tempType > 0.4) {
        colors[i * 3] = 0.85;
        colors[i * 3 + 1] = 0.92;
        colors[i * 3 + 2] = 1.0;  // Blue-white O/B type
      } else {
        colors[i * 3] = 0.98;
        colors[i * 3 + 1] = 0.98;
        colors[i * 3 + 2] = 1.0;  // White A/F type
      }
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
}

export const earthScene = new EarthScene();
