// scripts/inspect_landscape_and_ui.js
// Automated verification and high-resolution capture of upgraded Landscaping and UI Design System.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\aksha\\.gemini\\antigravity\\brain\\54ef08f6-1581-47d5-9f68-d717a0a18f3c\\figures\\audit';

async function ensureChrome() {
  return new Promise((resolve) => {
    http.get('http://localhost:9222/json/list', () => resolve(true))
      .on('error', () => {
        console.log('Spawning Chrome headless on port 9222...');
        const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
          '--headless=new',
          '--no-sandbox',
          '--remote-debugging-port=9222',
          '--user-data-dir=D:\\Projects\\pramana-github\\.chrome_debug',
          'http://localhost:3001'
        ], { detached: true, stdio: 'ignore' });
        chrome.unref();
        setTimeout(resolve, 2000);
      });
  });
}

async function getPageWsUrl() {
  await ensureChrome();
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const list = JSON.parse(data);
        const page = list.find(t => t.type === 'page' && t.url.includes('3001'));
        if (page) resolve(page.webSocketDebuggerUrl);
        else reject(new Error('PRAMANA page target not found on port 3001'));
      });
    }).on('error', reject);
  });
}

function sendCommand(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) {
          reject(new Error(msg.error.message));
        } else {
          resolve(msg.result);
        }
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function captureScreenshot(ws, id, filename) {
  const res = await sendCommand(ws, id, 'Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  const localDir = path.join(__dirname, '..', 'reports', 'screenshots');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const localPath = path.join(localDir, filename);
  fs.writeFileSync(localPath, buffer);

  // Copy to artifact directory
  try {
    if (!fs.existsSync(ARTIFACT_DIR)) {
      fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    }
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artifactPath, buffer);
  } catch (err) {
    console.warn('Could not copy to artifact dir:', err.message);
  }

  console.log(`[Captured] ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  return localPath;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const wsUrl = await getPageWsUrl();
  console.log('Connecting to Chrome CDP for Landscape Realism & Premium UI Inspection...');
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  // Enable events
  await sendCommand(ws, 1, 'Page.enable');
  await sendCommand(ws, 2, 'Runtime.enable');

  // Set 1920x1080 viewport
  await sendCommand(ws, 4, 'Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('\n--- 1. Testing & Capturing Cinematic Opening HUD & Narration Title ---');
  await sendCommand(ws, 5, 'Page.navigate', { url: 'http://localhost:3001' });
  await sleep(4000); // Earth phase where HUD and narration are active
  await captureScreenshot(ws, 10, 'ui_cinematic_hud_and_title.png');

  console.log('\n--- 2. Transitioning to Exterior to Inspect Landscaping & Trees ---');
  // Switch to exterior and disable automatic intro transitions
  await sendCommand(ws, 11, 'Runtime.evaluate', {
    expression: `
      window.cinematicDirector.isIntroSkipped = true;
      if (window.cinematicDirector.stageTimeout) clearTimeout(window.cinematicDirector.stageTimeout);
      window.threeScene.earthGroup.visible = false;
      window.threeScene.exteriorGroup.visible = true;
      window.threeScene.courtroomGroup.visible = false;
      window.threeScene.setLightingMode('exterior');
      window.cinematicDirector.hideOpeningClock();
      const curtain = document.getElementById('blackCurtain');
      if (curtain) { curtain.classList.add('fade-out'); curtain.style.display = 'none'; }
    `
  });
  await sleep(1000);

  // Landscape View 1: Establishing shots of promenade vegetation
  console.log('Capturing Landscape Establishing View (Palms + Shade Trees + Mulch Beds)...');
  await sendCommand(ws, 12, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(140, 52, 330), new THREE.Vector3(0, 28, 140));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 13, 'landscape_trees_establishing.png');

  // Landscape View 2: Royal Palm Close-Up (Ringed bark, crownshaft, 3-tier fronds)
  console.log('Capturing Royal Palm Close-Up...');
  await sendCommand(ws, 14, 'Runtime.evaluate', {
    expression: `
      // Royal Palm at p=4: angle = 4 * PI / 13 ~ 55.4 deg -> px ~ 100, pz ~ 222
      window.threeScene.teleportCamera(new THREE.Vector3(100, 24, 258), new THREE.Vector3(100, 24, 222));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 15, 'landscape_royal_palm_detail.png');

  // Landscape View 3: Mature Indian Shade Tree Close-Up (Buttress roots, branching boughs, layered foliage)
  console.log('Capturing Mature Indian Shade Tree Close-Up...');
  await sendCommand(ws, 16, 'Runtime.evaluate', {
    expression: `
      // Shade Tree at x: -235, z: 145
      window.threeScene.teleportCamera(new THREE.Vector3(-185, 26, 175), new THREE.Vector3(-235, 24, 145));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 17, 'landscape_neem_shade_detail.png');

  console.log('\n--- 3. Entering Courtroom to Inspect Brand Plaque & Viewpoint Navigation ---');
  await sendCommand(ws, 18, 'Runtime.evaluate', {
    expression: `
      window.cinematicDirector.enterCourtroomActive();
    `
  });
  await sleep(1500);

  // Capture Courtroom Header and Brand Badge
  console.log('Capturing Courtroom Header & PRAMANA Brand Plaque...');
  await captureScreenshot(ws, 19, 'ui_courtroom_brand_plaque.png');

  // Viewpoint Navigation bar
  console.log('Capturing Viewpoint Navigation Bar & Kathghara Badges...');
  await captureScreenshot(ws, 20, 'ui_viewpoint_nav_and_kathghara_tags.png');

  console.log('\n--- 4. Inspecting Kathghara 1 Drawer (Case Details) ---');
  await sendCommand(ws, 21, 'Runtime.evaluate', {
    expression: `window.cinematicDirector.openDrawer('drawerCaseDetails');`
  });
  await sleep(1200);
  await captureScreenshot(ws, 22, 'ui_kathghara_1_drawer.png');

  console.log('\n--- 5. Inspecting Kathghara 2 Drawer (Dropzone & Masking Banner) ---');
  await sendCommand(ws, 23, 'Runtime.evaluate', {
    expression: `
      window.cinematicDirector.closeDrawers();
      window.cinematicDirector.openDrawer('drawerDocumentSubmission');
    `
  });
  await sleep(1200);
  await captureScreenshot(ws, 24, 'ui_kathghara_2_drawer_upload.png');

  console.log('\n--- 6. Running Prediction in Kathghara 2 to Inspect Verdict & LOCO Cards ---');
  await sendCommand(ws, 25, 'Runtime.evaluate', {
    expression: `
      // Fill text input and run prediction
      document.getElementById('subTabText').click();
      document.getElementById('rawTextInput').value = "Criminal Appeal No. 1234 of 2026. The appellant challenges conviction under Section 306 IPC. Having considered the evidence, there is no proximate instigation.";
      document.getElementById('btnRunPrediction').click();
    `
  });
  await sleep(9500); // Wait for R engine hierarchical inference and LOCO calculation
  await captureScreenshot(ws, 26, 'ui_kathghara_2_prediction_result.png');

  console.log('\n--- 7. Inspecting Historical Research Suite & Stat Cards ---');
  await sendCommand(ws, 27, 'Runtime.evaluate', {
    expression: `
      window.cinematicDirector.closeDrawers();
      document.getElementById('btnEnterResearchWorkspace').click();
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 28, 'ui_research_workspace.png');

  console.log('\nAll landscape and UI verification captures complete!');
  ws.close();
}

run().catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
