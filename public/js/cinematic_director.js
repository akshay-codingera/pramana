/**
 * PRAMANA — Cinematic Master Director (Milestones 2, 3, 4, 5)
 * Orchestrates the full opening sequence:
 * Pitch Darkness -> Ephemeral Clock -> Earth Reveal -> Descent to India ->
 * Supreme Court Exterior -> Entrance Transition -> Courtroom 3D Environment.
 */

import * as THREE from 'three';
import { threeScene } from './three_scene.js';
import { earthScene } from './scene_earth.js';
import { exteriorScene } from './scene_exterior.js';
import { courtroomScene } from './scene_courtroom.js';
import { judgeGavel } from './scene_judge_gavel.js';
import { kathgharasSystem } from './scene_kathgharas.js';
import { audioSystem } from './audio.js';

export const CINEMATIC_STAGES = {
  DARKNESS: 'DARKNESS',
  EARTH_REVEAL: 'EARTH_REVEAL',
  JOURNEY_INDIA: 'JOURNEY_INDIA',
  SC_EXTERIOR: 'SC_EXTERIOR',
  ENTERING_COURTROOM: 'ENTERING_COURTROOM',
  COURTROOM_ACTIVE: 'COURTROOM_ACTIVE'
};

class CinematicDirector {
  constructor() {
    this.stage = CINEMATIC_STAGES.DARKNESS;
    this.clockInterval = null;
    this.stageTimeout = null;
    this.isIntroSkipped = false;
  }

  init() {
    // 1. Build all 3D scenes in the engine
    earthScene.build();
    exteriorScene.build();
    courtroomScene.build();
    judgeGavel.build();
    kathgharasSystem.build(
      () => this.focusKathghara1(),
      () => this.focusKathghara2()
    );

    // 2. Start Opening Clock (Current Real Local Time)
    this.startOpeningClock();

    // 3. Setup UI Event Listeners
    this.bindUIEvents();

    // 4. Begin Sequence
    this.startOpeningSequence();

    console.log('[CinematicDirector] Director initialized.');
  }

  bindUIEvents() {
    const skipBtn = document.getElementById('btnSkipIntro');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipIntro());
    }

    const replayBtn = document.getElementById('btnReplayIntro');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => this.replayIntro());
    }

    const muteBtn = document.getElementById('btnAudioToggle');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = audioSystem.toggleMute();
        muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
        muteBtn.title = isMuted ? 'Unmute Audio' : 'Mute Audio';
      });
    }

    // Viewpoint Selector Buttons
    document.querySelectorAll('.viewpoint-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vp = e.currentTarget.getAttribute('data-viewpoint');
        this.setViewpoint(vp);
      });
    });
  }

  startOpeningClock() {
    const clockEl = document.getElementById('openingClock');
    const digitsEl = document.getElementById('clockDigits');
    if (!clockEl || !digitsEl) return;

    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      digitsEl.textContent = `${h}:${m}:${s}`;
    };

    updateTime();
    this.clockInterval = setInterval(updateTime, 1000);

    // Show clock on black screen
    setTimeout(() => {
      clockEl.classList.add('visible');
    }, 400);
  }

  hideOpeningClock() {
    const clockEl = document.getElementById('openingClock');
    if (clockEl) {
      clockEl.classList.remove('visible');
      clockEl.classList.add('fade-away');
      setTimeout(() => {
        if (this.clockInterval) clearInterval(this.clockInterval);
        clockEl.style.display = 'none';
      }, 1500);
    }
  }

  setSubtext(title, desc) {
    const container = document.getElementById('cinematicSubtext');
    const titleEl = document.getElementById('cinematicSubtextTitle');
    const descEl = document.getElementById('cinematicSubtextDesc');
    if (!container || !titleEl || !descEl) return;

    if (!title) {
      container.classList.remove('visible');
      return;
    }

    titleEl.textContent = title;
    descEl.textContent = desc;
    container.classList.add('visible');
  }

  setProgress(pct) {
    const bar = document.getElementById('cinematicProgress');
    if (bar) bar.style.width = `${pct}%`;
  }

  startOpeningSequence() {
    this.isIntroSkipped = false;
    this.stage = CINEMATIC_STAGES.DARKNESS;

    // Start audio
    audioSystem.startAmbientDrone(4.0);

    // Scene 1: Darkness with Clock (Duration: ~2.5s)
    this.stageTimeout = setTimeout(() => {
      if (this.isIntroSkipped) return;
      this.transitionToEarth();
    }, 2500);
  }

  transitionToEarth() {
    this.stage = CINEMATIC_STAGES.EARTH_REVEAL;
    this.setProgress(20);

    // Show Earth Scene
    threeScene.earthGroup.visible = true;
    threeScene.exteriorGroup.visible = false;
    threeScene.courtroomGroup.visible = false;
    threeScene.setLightingMode('space');

    // Camera deep space orbit
    threeScene.teleportCamera(new THREE.Vector3(0, 35, 340), new THREE.Vector3(0, 0, 0));
    threeScene.setCameraTarget(new THREE.Vector3(20, 25, 260), new THREE.Vector3(0, 0, 0), 0.035);

    // Fade black curtain to reveal Earth
    const curtain = document.getElementById('blackCurtain');
    if (curtain) curtain.classList.add('fade-out');

    // Show top controls
    const hud = document.querySelector('.cinematic-hud');
    if (hud) hud.classList.add('visible');

    this.setSubtext(
      'PRAMANA // EPIGENESIS OF JURISPRUDENCE',
      'Observing Earth from high orbit — Tracking towards the Sovereign Democratic Republic of India.'
    );

    // Next: Journey to India (after ~4s)
    this.stageTimeout = setTimeout(() => {
      if (this.isIntroSkipped) return;
      this.transitionToJourneyIndia();
    }, 4200);
  }

  transitionToJourneyIndia() {
    this.stage = CINEMATIC_STAGES.JOURNEY_INDIA;
    this.setProgress(45);

    // STRICT CLOCK RULE: Fade clock away before reaching the Supreme Court
    this.hideOpeningClock();

    // Camera descent towards New Delhi coordinates
    threeScene.setCameraTarget(new THREE.Vector3(12, 14, 155), new THREE.Vector3(0, 0, 0), 0.04);

    this.setSubtext(
      'APPROACHING THE INDIAN SUBCONTINENT',
      'Geospatial descent into the National Capital Territory of New Delhi — Seat of the Supreme Court of India.'
    );

    // Next: Supreme Court Exterior (after ~4s)
    this.stageTimeout = setTimeout(() => {
      if (this.isIntroSkipped) return;
      this.transitionToExterior();
    }, 4200);
  }

  transitionToExterior() {
    this.stage = CINEMATIC_STAGES.SC_EXTERIOR;
    this.setProgress(70);

    // Switch visible scene group
    threeScene.earthGroup.visible = false;
    threeScene.exteriorGroup.visible = true;
    threeScene.courtroomGroup.visible = false;
    threeScene.setLightingMode('exterior');

    // Camera high exterior aerial approach
    threeScene.teleportCamera(new THREE.Vector3(0, 160, 380), new THREE.Vector3(0, 45, 0));
    threeScene.setCameraTarget(new THREE.Vector3(0, 22, 120), new THREE.Vector3(0, 32, 60), 0.03);

    this.setSubtext(
      'THE SUPREME COURT OF INDIA',
      'The Apex Judicial Authority — Established January 28, 1950 under Part V, Chapter IV of the Constitution.'
    );

    // Next: Enter Building through Central Portico
    this.stageTimeout = setTimeout(() => {
      if (this.isIntroSkipped) return;
      this.transitionEnteringCourtroom();
    }, 4500);
  }

  transitionEnteringCourtroom() {
    this.stage = CINEMATIC_STAGES.ENTERING_COURTROOM;
    this.setProgress(90);

    // Move camera straight into the main entrance doors
    threeScene.setCameraTarget(new THREE.Vector3(0, 24, 62), new THREE.Vector3(0, 26, 50), 0.06);

    this.setSubtext(
      'ENTERING THE CENTRAL ROTUNDA',
      'Transitioning into the institutional chamber of Chief Justice Courtroom No. 1.'
    );

    // Complete into Courtroom (after 2s)
    this.stageTimeout = setTimeout(() => {
      if (this.isIntroSkipped) return;
      this.enterCourtroomActive();
    }, 2200);
  }

  enterCourtroomActive() {
    this.stage = CINEMATIC_STAGES.COURTROOM_ACTIVE;
    this.setProgress(100);

    // Switch to Courtroom scene
    threeScene.earthGroup.visible = false;
    threeScene.exteriorGroup.visible = false;
    threeScene.courtroomGroup.visible = true;
    threeScene.setLightingMode('courtroom');

    // Camera initial grand chamber overview
    threeScene.teleportCamera(new THREE.Vector3(0, 12, 38), new THREE.Vector3(0, 7, -20));
    threeScene.setCameraTarget(new THREE.Vector3(0, 12, 35), new THREE.Vector3(0, 7, -20), 0.05);

    // Hide cinematic narration subtext
    this.setSubtext('', '');

    // Hide cinematic progress bar
    const bar = document.getElementById('cinematicProgress');
    if (bar) bar.style.display = 'none';

    // Show Courtroom HUD & Kathghara floating tags
    const courtroomContainer = document.getElementById('courtroomContainer');
    if (courtroomContainer) {
      courtroomContainer.classList.remove('visually-hidden');
      courtroomContainer.classList.add('interactive');
    }

    // Set active viewpoint button
    this.updateActiveViewpointBtn('grand');

    console.log('[CinematicDirector] Courtroom environment active.');
  }

  skipIntro() {
    this.isIntroSkipped = true;
    if (this.stageTimeout) clearTimeout(this.stageTimeout);
    this.hideOpeningClock();

    const curtain = document.getElementById('blackCurtain');
    if (curtain) {
      curtain.classList.add('fade-out');
      curtain.style.display = 'none';
    }

    this.enterCourtroomActive();
  }

  replayIntro() {
    if (this.stageTimeout) clearTimeout(this.stageTimeout);

    // Hide courtroom HUD
    const courtroomContainer = document.getElementById('courtroomContainer');
    if (courtroomContainer) {
      courtroomContainer.classList.add('visually-hidden');
      courtroomContainer.classList.remove('interactive');
    }

    // Close any open drawers
    this.closeDrawers();

    // Reset black curtain
    const curtain = document.getElementById('blackCurtain');
    if (curtain) {
      curtain.style.display = 'block';
      curtain.classList.remove('fade-out');
    }

    // Re-show clock
    const clockEl = document.getElementById('openingClock');
    if (clockEl) {
      clockEl.style.display = 'flex';
      clockEl.classList.remove('fade-away');
      clockEl.classList.add('visible');
    }

    const bar = document.getElementById('cinematicProgress');
    if (bar) {
      bar.style.display = 'block';
      bar.style.width = '0%';
    }

    this.startOpeningSequence();
  }

  // Camera Viewpoint Movements
  setViewpoint(vpName) {
    this.closeDrawers();
    this.updateActiveViewpointBtn(vpName);

    if (vpName === 'grand') {
      threeScene.setCameraTarget(new THREE.Vector3(0, 12, 35), new THREE.Vector3(0, 7, -20), 0.06);
    } else if (vpName === 'bench') {
      threeScene.setCameraTarget(new THREE.Vector3(0, 9.5, -6), new THREE.Vector3(0, 7.5, -24), 0.06);
    } else if (vpName === 'kathghara1') {
      this.focusKathghara1();
    } else if (vpName === 'kathghara2') {
      this.focusKathghara2();
    }
  }

  focusKathghara1() {
    this.updateActiveViewpointBtn('kathghara1');
    threeScene.setCameraTarget(new THREE.Vector3(-18, 9, 8), new THREE.Vector3(-24, 5, -8), 0.06);
    this.openDrawer('drawerCaseDetails');
  }

  focusKathghara2() {
    this.updateActiveViewpointBtn('kathghara2');
    threeScene.setCameraTarget(new THREE.Vector3(18, 9, 8), new THREE.Vector3(24, 5, -8), 0.06);
    this.openDrawer('drawerDocumentSubmission');
  }

  updateActiveViewpointBtn(vpName) {
    document.querySelectorAll('.viewpoint-btn').forEach(btn => {
      if (btn.getAttribute('data-viewpoint') === vpName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  openDrawer(drawerId) {
    const backdrop = document.getElementById('drawerBackdrop');
    const drawer = document.getElementById(drawerId);
    if (backdrop) backdrop.classList.add('active');
    if (drawer) drawer.classList.add('active');
  }

  closeDrawers() {
    const backdrop = document.getElementById('drawerBackdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.querySelectorAll('.court-drawer').forEach(d => d.classList.remove('active'));
  }
}

export const cinematicDirector = new CinematicDirector();
