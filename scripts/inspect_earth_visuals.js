// scripts/inspect_earth_visuals.js
// Automated verification and high-resolution capture of the upgraded photorealistic Earth.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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
        else reject(new Error('PRAMANA page target not found'));
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
  const filepath = path.join(__dirname, '..', 'reports', 'screenshots', filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`[Captured] ${filename} (${(buffer.length / 1024).toFixed(1)} KB) -> ${filepath}`);
  return filepath;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const wsUrl = await getPageWsUrl();
  console.log('Connecting to Chrome CDP for Earth Realism Inspection...');
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

  console.log('\nReloading page to observe full cinematic sequence from the start...');
  await sendCommand(ws, 5, 'Page.navigate', { url: 'http://localhost:3001' });

  // 1. Opening Black Screen & Clock
  console.log('Waiting 1.2s for opening screen...');
  await sleep(1200);
  await captureScreenshot(ws, 10, '01_black_clock.png');

  // 2. Earth Reveal from Orbit (~4.2s after start)
  console.log('Waiting 3.2s for Earth reveal...');
  await sleep(3200);
  await captureScreenshot(ws, 11, '02_earth.png');
  await captureScreenshot(ws, 12, 'earth_realism_reveal.png');

  // 3. Earth Rotation & Cloud Parallax (~2.5s later)
  console.log('Waiting 2.5s for Earth rotation & illumination...');
  await sleep(2500);
  await captureScreenshot(ws, 13, 'earth_realism_rotation.png');

  // 4. India Transition & Descent (~2.5s later)
  console.log('Waiting 2.5s for orbital descent towards India...');
  await sleep(2500);
  await captureScreenshot(ws, 14, '03_india_transition.png');
  await captureScreenshot(ws, 15, 'earth_realism_descent.png');

  console.log('\n--- Earth Realism Visual Inspection Capture Complete! ---');
  ws.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal inspection error:', err);
  process.exit(1);
});
