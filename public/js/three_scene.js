/**
 * PRAMANA — Core Three.js Engine & Scene Manager
 * Handles WebGL rendering, camera kinematics, multi-scene coordination,
 * lighting rigs, raycasting interactions, and render loop.
 */

import * as THREE from 'three';

class ThreeSceneManager {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // Sub-scene root groups
    this.earthGroup = new THREE.Group();
    this.exteriorGroup = new THREE.Group();
    this.courtroomGroup = new THREE.Group();

    // Camera animation state
    this.cameraTargetPos = new THREE.Vector3(0, 0, 500);
    this.cameraTargetLook = new THREE.Vector3(0, 0, 0);
    this.cameraLerpSpeed = 0.05;
    this.isCameraAnimating = true;

    // Raycaster for interactive objects (Kathgharas, Gavel)
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-1000, -1000);
    this.interactiveObjects = [];
    this.hoveredObject = null;

    this.lastTime = performance.now();
    this.startTime = performance.now();

    // Callbacks for animation updates
    this.updatables = [];

    this.onWindowResize = this.onWindowResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerClick = this.onPointerClick.bind(this);
    this.animate = this.animate.bind(this);
  }

  init(containerElement) {
    this.container = containerElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x050608, 0.0005);

    // Add root groups
    this.scene.add(this.earthGroup);
    this.scene.add(this.exteriorGroup);
    this.scene.add(this.courtroomGroup);

    // Initial group visibility
    this.earthGroup.visible = false;
    this.exteriorGroup.visible = false;
    this.courtroomGroup.visible = false;

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 15000);
    this.camera.position.set(0, 0, 800);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer with PBR & Soft Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.canvas = this.renderer.domElement;
    this.canvas.id = 'viewport3D';
    this.container.appendChild(this.canvas);

    // 4. Lighting Rig
    this.setupLighting();

    // 5. Event Listeners
    window.addEventListener('resize', this.onWindowResize, false);
    window.addEventListener('pointermove', this.onPointerMove, false);
    window.addEventListener('click', this.onPointerClick, false);

    // 6. Start Loop
    this.animate();

    console.log('[ThreeScene] Engine initialized with WebGL renderer.');
  }

  setupLighting() {
    // Universal Subtle Ambient
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    // Realistic Sky / Ground Bounce Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0xfff6eb, 0x1a1e28, 0.5);
    this.scene.add(this.hemiLight);

    // Space/Sun Directional Light (used for Earth and Exterior)
    this.sunLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    this.sunLight.position.set(1000, 400, 800);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 3000;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Warm Courtroom Interior Point / Spot Lighting
    this.courtroomBenchSpot = new THREE.SpotLight(0xffecd2, 3.5);
    this.courtroomBenchSpot.position.set(0, 22, 5);
    this.courtroomBenchSpot.angle = Math.PI / 3.5;
    this.courtroomBenchSpot.penumbra = 0.6;
    this.courtroomBenchSpot.decay = 2;
    this.courtroomBenchSpot.distance = 50;
    this.courtroomBenchSpot.castShadow = true;
    this.courtroomBenchSpot.shadow.bias = -0.001;
    this.courtroomGroup.add(this.courtroomBenchSpot);
  }

  setLightingMode(mode) {
    if (mode === 'space') {
      this.ambientLight.intensity = 0.2;
      this.hemiLight.intensity = 0.15;
      this.sunLight.position.set(800, 300, 600);
      this.sunLight.intensity = 2.4;
      this.scene.fog.density = 0.00005;
    } else if (mode === 'exterior') {
      this.ambientLight.intensity = 0.6;
      this.hemiLight.intensity = 0.65;
      this.hemiLight.color.setHex(0xeef4fc);
      this.hemiLight.groundColor.setHex(0x382c20);
      this.sunLight.position.set(200, 350, 250);
      this.sunLight.intensity = 2.0;
      this.scene.fog.density = 0.0008;
    } else if (mode === 'courtroom') {
      this.ambientLight.intensity = 0.7;
      this.hemiLight.intensity = 0.55;
      this.hemiLight.color.setHex(0xffeed6);
      this.hemiLight.groundColor.setHex(0x2c180e);
      this.sunLight.position.set(10, 40, 20);
      this.sunLight.intensity = 1.0;
      this.scene.fog.density = 0.004;
    }
  }

  registerUpdatable(fn) {
    this.updatables.push(fn);
  }

  registerInteractive(object, clickHandler, hoverHandler) {
    object.userData.onClick = clickHandler;
    object.userData.onHover = hoverHandler;
    this.interactiveObjects.push(object);
  }

  setCameraTarget(position, lookAtTarget, lerpSpeed = 0.05) {
    this.cameraTargetPos.copy(position);
    this.cameraTargetLook.copy(lookAtTarget);
    this.cameraLerpSpeed = lerpSpeed;
  }

  teleportCamera(position, lookAtTarget) {
    this.camera.position.copy(position);
    this.cameraTargetPos.copy(position);
    this.cameraTargetLook.copy(lookAtTarget);
    this.camera.lookAt(lookAtTarget);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onPointerMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onPointerClick(event) {
    if (this.interactiveObjects.length === 0) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      // Find top interactive ancestor
      let current = intersects[0].object;
      while (current && !current.userData.onClick && current.parent) {
        current = current.parent;
      }
      if (current && current.userData.onClick) {
        current.userData.onClick(intersects[0]);
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    const time = (now - this.startTime) / 1000;

    // 1. Camera smooth interpolation
    if (this.isCameraAnimating) {
      this.camera.position.lerp(this.cameraTargetPos, this.cameraLerpSpeed);
      
      // Calculate current look target and lerp towards target
      const currentLook = new THREE.Vector3();
      this.camera.getWorldDirection(currentLook);
      const currentLookPoint = this.camera.position.clone().add(currentLook.multiplyScalar(100));
      currentLookPoint.lerp(this.cameraTargetLook, this.cameraLerpSpeed);
      this.camera.lookAt(this.cameraTargetLook);
    }

    // 2. Interactive raycasting hover states
    if (this.interactiveObjects.length > 0) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      let found = null;
      if (intersects.length > 0) {
        let current = intersects[0].object;
        while (current && !current.userData.onClick && current.parent) {
          current = current.parent;
        }
        if (current && current.userData.onClick) {
          found = current;
        }
      }

      if (found !== this.hoveredObject) {
        if (this.hoveredObject && this.hoveredObject.userData.onHover) {
          this.hoveredObject.userData.onHover(false);
        }
        this.hoveredObject = found;
        if (this.hoveredObject && this.hoveredObject.userData.onHover) {
          this.hoveredObject.userData.onHover(true);
        }
        document.body.style.cursor = this.hoveredObject ? 'pointer' : 'default';
      }
    }

    // 3. Execute all registered updatables
    for (let i = 0; i < this.updatables.length; i++) {
      this.updatables[i](delta, time);
    }

    // 4. Render
    this.renderer.render(this.scene, this.camera);
  }
}

export const threeScene = new ThreeSceneManager();
