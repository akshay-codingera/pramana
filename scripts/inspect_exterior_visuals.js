// scripts/inspect_exterior_visuals.js
// Automated verification and high-resolution capture of the upgraded Supreme Court architectural reconstruction.
// Captures the 4 designated architectural camera views and flag close-up.

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
  const localPath = path.join(__dirname, '..', 'reports', 'screenshots', filename);
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
  console.log('Connecting to Chrome CDP for Supreme Court Architectural Inspection...');
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  // Enable events
  await sendCommand(ws, 1, 'Page.enable');
  await sendCommand(ws, 2, 'Runtime.enable');
  await sendCommand(ws, 3, 'Console.enable');

  // Monitor console errors
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Console.messageAdded' && msg.params.message.level === 'error') {
      console.error('[Browser Error]', msg.params.message.text);
    }
  });

  // Set 1920x1080 viewport
  await sendCommand(ws, 4, 'Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('\nReloading page to observe exterior sequence...');
  await sendCommand(ws, 5, 'Page.navigate', { url: 'http://localhost:3001' });

  // Wait for Earth sequence to complete and arrive at exterior (~11.5s from reload)
  console.log('Waiting 11.5s for natural arrival at Supreme Court exterior...');
  await sleep(11500);

  // 1. Natural In-Flight Sequence Captures
  console.log('\n--- Capturing In-Flight Cinematic Journey ---');
  await captureScreenshot(ws, 10, '04_sc_exterior.png');
  await captureScreenshot(ws, 11, 'sc_establishing_shot.png');

  await sleep(2200);
  await captureScreenshot(ws, 12, 'sc_flag_forecourt.png');

  await sleep(2000);
  await captureScreenshot(ws, 13, 'sc_portico_colonnade.png');

  await sleep(1500);
  await captureScreenshot(ws, 14, '05_building_entrance.png');
  await captureScreenshot(ws, 15, 'sc_entrance_doors.png');

  // 2. High-Precision Dedicated Architectural Views (A, B, C, D)
  console.log('\n--- Capturing 4 Dedicated Architectural Views ---');

  // View A: Complete Aerial Architectural View
  console.log('Setting View A: Complete Aerial View...');
  await sendCommand(ws, 20, 'Runtime.evaluate', {
    expression: `window.cinematicDirector.setCameraView('A_AERIAL')`
  });
  await sleep(1200);
  await captureScreenshot(ws, 21, 'view_a_aerial_architecture.png');

  // View B: Full Frontal Architectural View
  console.log('Setting View B: Full Frontal Elevation...');
  await sendCommand(ws, 22, 'Runtime.evaluate', {
    expression: `window.cinematicDirector.setCameraView('B_FRONTAL')`
  });
  await sleep(1200);
  await captureScreenshot(ws, 23, 'view_b_frontal_architecture.png');

  // View C: Ground-Level Entrance Approach
  console.log('Setting View C: Ground-Level Entrance Approach...');
  await sendCommand(ws, 24, 'Runtime.evaluate', {
    expression: `window.cinematicDirector.setCameraView('C_GROUND')`
  });
  await sleep(1200);
  await captureScreenshot(ws, 25, 'view_c_ground_approach.png');

  // View D: Detailed Entrance Close-Up (Framed with pillars, ceiling, and opening doors)
  console.log('Setting View D: Detailed Entrance Close-Up (Framed with Opening Doors)...');
  await sendCommand(ws, 26, 'Runtime.evaluate', {
    expression: `window.cinematicDirector.setCameraView('D_ENTRANCE')`
  });
  await sleep(1500);
  await captureScreenshot(ws, 27, 'view_d_entrance_detail.png');

  // Dedicated Close-Up of Dynamic Indian National Flag (Tiranga)
  console.log('Setting Dedicated Close-Up of Dynamic Tiranga Flag...');
  await sendCommand(ws, 28, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(12, 74, 185), new THREE.Vector3(10, 74, 160));
    `
  });
  await sleep(1200);
  await captureScreenshot(ws, 29, 'view_flag_cloth_detail.png');

  // Measure Real-Time Performance & JS Memory Metrics
  console.log('\nMeasuring 60 FPS Performance & Memory Footprint...');
  const perfResult = await sendCommand(ws, 30, 'Runtime.evaluate', {
    expression: `
      new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        function check() {
          frames++;
          if (performance.now() - start >= 1000) {
            const duration = performance.now() - start;
            const fps = (frames / (duration / 1000)).toFixed(1);
            const memory = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(2) : 'N/A';
            resolve({ fps: parseFloat(fps), frameTimeMs: (duration / frames).toFixed(2), memoryMB: memory });
          } else {
            requestAnimationFrame(check);
          }
        }
        requestAnimationFrame(check);
      });
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('--- Performance Metrics on Intel Iris Xe Integrated Graphics ---');
  console.log(`FPS: ${perfResult.result.value.fps} FPS`);
  console.log(`Average Frame Time: ${perfResult.result.value.frameTimeMs} ms`);
  console.log(`Active JS Heap: ${perfResult.result.value.memoryMB} MB`);

  console.log('\n--- Supreme Court Architectural Inspection & Verification Complete! ---');
  ws.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal inspection error:', err);
  process.exit(1);
});
