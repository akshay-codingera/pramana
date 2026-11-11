// scripts/inspect_pine_trees.js
// Dedicated visual capture to verify removal of pins/spikes and inspect the new Architectural Pine Trees

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
  console.log('Connecting to Chrome CDP for Pine Tree inspection...');
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  await sendCommand(ws, 1, 'Page.enable');
  await sendCommand(ws, 2, 'Runtime.enable');

  await sendCommand(ws, 4, 'Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:3001...');
  await sendCommand(ws, 5, 'Page.navigate', { url: 'http://localhost:3001' });
  await sleep(2500);

  console.log('Switching to Exterior Scene...');
  const evalRes = await sendCommand(ws, 6, 'Runtime.evaluate', {
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
      true;
    `
  });

  if (evalRes.exceptionDetails) {
    console.error('JS Evaluation Error:', evalRes.exceptionDetails);
    process.exit(1);
  }

  await sleep(1500);

  // 1. Establishing View (Same camera as landscape_trees_establishing.png where user saw pins)
  console.log('\n--- 1. Capturing landscape_trees_establishing.png ---');
  await sendCommand(ws, 10, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(140, 52, 330), new THREE.Vector3(0, 28, 140));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 11, 'landscape_trees_establishing.png');

  // 2. Close-up on Pine Tree along Driveway
  console.log('\n--- 2. Capturing landscape_royal_palm_detail.png (now pine tree detail) ---');
  await sendCommand(ws, 12, 'Runtime.evaluate', {
    expression: `
      // Looking at pine tree near driveway curve
      window.threeScene.teleportCamera(new THREE.Vector3(120, 26, 260), new THREE.Vector3(100, 24, 222));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 13, 'landscape_royal_palm_detail.png');

  // 3. Medium low-angle shot showing tiered bough structure against the colonnade
  console.log('\n--- 3. Capturing landscape_pine_bough_tiers.png ---');
  await sendCommand(ws, 14, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(80, 16, 280), new THREE.Vector3(45, 26, 230));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 15, 'landscape_pine_bough_tiers.png');

  // 4. Ground promenade approach showing the avenue of pines leading to the portico
  console.log('\n--- 4. Capturing landscape_pine_avenue_approach.png ---');
  await sendCommand(ws, 16, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(0, 18, 380), new THREE.Vector3(0, 25, 160));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 17, 'landscape_pine_avenue_approach.png');

  console.log('\nAll pine tree captures completed successfully!');
  ws.close();
}

run().catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
