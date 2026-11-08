/**
 * PRAMANA — Main Frontend Application Entry Point
 * Initializes 3D WebGL engine, cinematic director, and research workspace.
 */

import { threeScene } from './three_scene.js';
import { cinematicDirector } from './cinematic_director.js';
import { workspaceManager } from './workspace.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('⚖️ PRAMANA — Initializing Supreme Court 3D AI Research Platform...');

  const viewportContainer = document.getElementById('viewportContainer');
  if (!viewportContainer) {
    console.error('Fatal: viewportContainer not found in DOM.');
    return;
  }

  // 1. Initialize Three.js Engine
  threeScene.init(viewportContainer);

  // 2. Initialize Cinematic Director (Darkness, Clock, Earth, SC Exterior, Courtroom)
  cinematicDirector.init();

  // 3. Initialize Research Workspace & Ingestion Handlers
  workspaceManager.init();

  console.log('✅ PRAMANA — Core subsystems fully initialized.');
});
