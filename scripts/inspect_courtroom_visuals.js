// scripts/inspect_courtroom_visuals.js
// Automated high-resolution visual inspection & capture for the Grand Judicial Chamber Reconstruction.

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
  console.log('Connecting to Chrome CDP for Courtroom Interior Visual Quality Audit...');
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

  console.log('Switching directly into the Courtroom Environment...');
  await sendCommand(ws, 6, 'Runtime.evaluate', {
    expression: `
      window.cinematicDirector.isIntroSkipped = true;
      if (window.cinematicDirector.stageTimeout) clearTimeout(window.cinematicDirector.stageTimeout);
      window.cinematicDirector.hideOpeningClock();
      window.cinematicDirector.enterCourtroomActive();
      const curtain = document.getElementById('blackCurtain');
      if (curtain) { curtain.classList.add('fade-out'); curtain.style.display = 'none'; }
      true;
    `
  });
  await sleep(2000);

  // VIEW A: Wide Cinematic Courtroom Overview
  console.log('\n--- VIEW A: Wide Cinematic Courtroom Overview ---');
  await sendCommand(ws, 10, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(0, 14, 40), new THREE.Vector3(0, 8, -25));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 11, 'courtroom_wide_overview.png');

  // VIEW B: Front-on Judicial Bench View (Three Judges & Workstations)
  console.log('\n--- VIEW B: Front-on Judicial Bench View ---');
  await sendCommand(ws, 12, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(0, 7.8, -13), new THREE.Vector3(0, 5.4, -26));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 13, 'courtroom_judicial_bench_front.png');

  // VIEW C: Close-up of Judicial Chairs and State Emblem Backdrop
  console.log('\n--- VIEW C: Close-up of Judicial Chairs and State Emblem Backdrop ---');
  await sendCommand(ws, 14, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(0, 14.0, -20), new THREE.Vector3(0, 19.5, -45));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 15, 'courtroom_emblem_and_chairs_closeup.png');

  // VIEW D: Advocate Well & Central Speaking Lectern
  console.log('\n--- VIEW D: Advocate Well and Central Lectern ---');
  await sendCommand(ws, 16, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(0, 7.5, 16), new THREE.Vector3(0, 4.5, -2));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 17, 'courtroom_advocate_well_lectern.png');

  // VIEW E: Visitor Gallery & Press Section (Looking back from Bar Rail)
  console.log('\n--- VIEW E: Visitor and Press Gallery ---');
  await sendCommand(ws, 18, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(0, 7.5, 8), new THREE.Vector3(0, 5.5, 54));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 19, 'courtroom_visitor_gallery.png');

  // VIEW F: Full Rotunda Ceiling & Grand Chandelier (Looking Straight Up)
  console.log('\n--- VIEW F: Full Rotunda Ceiling & Grand Chandelier ---');
  await sendCommand(ws, 20, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(0, 10.0, -6), new THREE.Vector3(0, 42.0, -6));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 21, 'courtroom_rotunda_ceiling.png');

  // VIEW G: Ground-Level Entrance Perspective
  console.log('\n--- VIEW G: Ground-Level Entrance Perspective ---');
  await sendCommand(ws, 22, 'Runtime.evaluate', {
    expression: `
      window.threeScene.teleportCamera(new THREE.Vector3(0, 5.5, 56), new THREE.Vector3(0, 8.0, -30));
    `
  });
  await sleep(1500);
  await captureScreenshot(ws, 23, 'courtroom_entrance_perspective.png');

  console.log('\nAll 7 Courtroom Quality Gate screenshots captured successfully!');
  ws.close();
}

run().catch(err => {
  console.error('Courtroom inspection failed:', err);
  process.exit(1);
});
