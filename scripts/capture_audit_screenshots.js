// scripts/capture_audit_screenshots.js
// Captures full-resolution 1920x1080 visual audit screenshots via Chrome DevTools Protocol

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const LOCAL_DIR = path.join(__dirname, '..', 'reports', 'screenshots');
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
          '--window-size=1920,1080',
          '--user-data-dir=D:\\Projects\\pramana-github\\.chrome_debug',
          'http://localhost:3001'
        ], { detached: true, stdio: 'ignore' });
        chrome.unref();
        setTimeout(resolve, 2500);
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

class CDPClient {
  constructor(ws) {
    this.ws = ws;
    this.id = 1;
    this.callbacks = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const callId = this.id++;
      this.callbacks.set(callId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: callId, method, params }));
    });
  }

  async evaluate(expression, awaitPromise = false) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise
    });
    if (res.exceptionDetails) {
      throw new Error(`CDP Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const localPath = path.join(LOCAL_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(localPath, buffer);
    fs.writeFileSync(artifactPath, buffer);
    console.log(`[Captured] ${filename} (${(buffer.length / 1024).toFixed(1)} KB) -> ${localPath}`);
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const wsUrl = await getPageWsUrl();
  console.log('Connecting to Chrome CDP at:', wsUrl);
  const ws = new WebSocket(wsUrl);

  await new Promise(r => ws.onopen = r);
  const cdp = new CDPClient(ws);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('--- Starting Visual Quality Audit Screenshot Capture ---');

  // 1. Initial Black Screen and Clock
  await cdp.send('Page.reload');
  await sleep(1000);
  await cdp.screenshot('01_black_clock.png');

  // 2. Earth Reveal
  await sleep(2200);
  await cdp.screenshot('02_earth.png');

  // 3. India Transition
  await sleep(3500);
  await cdp.screenshot('03_india_transition.png');

  // 4. Supreme Court Exterior
  await sleep(4000);
  await cdp.screenshot('04_sc_exterior.png');

  // 5. Building Entrance
  await sleep(3500);
  await cdp.screenshot('05_building_entrance.png');

  // 6. Courtroom Overview
  await sleep(2500);
  await cdp.screenshot('06_courtroom.png');

  // 7. Judge and Gavel Focus
  await cdp.evaluate(`
    document.querySelector('.viewpoint-btn[data-viewpoint="bench"]').click();
  `);
  await sleep(1200);
  await cdp.screenshot('07_judge_gavel.png');

  // 8. Both Kathgharas
  await cdp.evaluate(`
    document.querySelector('.viewpoint-btn[data-viewpoint="grand"]').click();
  `);
  await sleep(1200);
  await cdp.screenshot('08_both_kathgharas.png');

  // 9. Kathghara 1 Drawer (Case Details)
  await cdp.evaluate(`
    document.querySelector('.viewpoint-btn[data-viewpoint="kathghara1"]').click();
  `);
  await sleep(1000);
  await cdp.screenshot('09_case_details_interface.png');

  // Close Drawer 1
  await cdp.evaluate(`document.getElementById('btnCloseDrawer1').click();`);
  await sleep(500);

  // 10. Kathghara 2 Drawer (Document Submission)
  await cdp.evaluate(`
    document.querySelector('.viewpoint-btn[data-viewpoint="kathghara2"]').click();
  `);
  await sleep(1000);
  await cdp.screenshot('10_document_upload_interface.png');

  // 11. Run Prediction on sample text to get real prediction result & LOCO cards
  console.log('Running real prediction for result and LOCO inspection...');
  await cdp.evaluate(`
    document.getElementById('subTabText').click();
    document.getElementById('rawTextInput').value = "CRIMINAL APPEAL NO. 4250 OF 2025. ANUKUL SINGH versus STATE OF UTTAR PRADESH. R. MAHADEVAN, J. This Criminal Appeal is directed against final judgment of Allahabad High Court. High Court dismissed appellant's application under Section 482 CrPC. Prosecution alleged offences under Sections 420, 467, 468, 471 IPC regarding land dispute. We have heard learned counsel for appellant and State. Dispute is purely of civil nature arising out of registered sale deed. High Court erred in refusing to quash criminal proceedings. In the result, the Criminal Appeal stands allowed.";
    document.getElementById('btnRunPrediction').click();
  `);

  // Wait for real prediction inference and LOCO calculation to complete
  console.log('Waiting for model inference and LOCO calculation...');
  await sleep(16000);
  await cdp.screenshot('11_prediction_result.png');

  // 12. LOCO Analysis Focus (scroll drawer to LOCO cards)
  await cdp.evaluate(`
    document.querySelector('#drawerDocumentSubmission .drawer-body').scrollTop = 450;
  `);
  await sleep(600);
  await cdp.screenshot('12_loco_analysis.png');

  // Close Drawer 2
  await cdp.evaluate(`document.getElementById('btnCloseDrawer2').click();`);
  await sleep(500);

  // 13. Historical Research Workspace (Case Explorer)
  await cdp.evaluate(`
    document.getElementById('btnEnterResearchWorkspace').click();
    document.querySelector('.nav-tab-btn[data-tab="tabExplorer"]').click();
  `);
  await sleep(1200);
  await cdp.screenshot('13_historical_workspace.png');

  // 14. 77-Year Legal Analytics Tab
  await cdp.evaluate(`
    document.querySelector('.nav-tab-btn[data-tab="tabAnalytics"]').click();
  `);
  await sleep(800);
  await cdp.screenshot('14_analytics_methodology.png');

  // 15. LOCO Explainability Lab (5 R Charts)
  await cdp.evaluate(`
    document.querySelector('.nav-tab-btn[data-tab="tabExplainability"]').click();
  `);
  await sleep(1200);
  await cdp.screenshot('15_loco_plots.png');

  // 16. Experiment Registry Ledger Tab
  await cdp.evaluate(`
    document.querySelector('.nav-tab-btn[data-tab="tabRegistry"]').click();
  `);
  await sleep(1200);
  await cdp.screenshot('16_experiment_registry.png');

  console.log('\n--- All 16 Visual Quality Audit Screenshots Captured Successfully! ---');
  ws.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
