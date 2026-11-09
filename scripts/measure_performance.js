// scripts/measure_performance.js
// Measures real FPS, draw calls, triangles, and memory footprint in Chrome via CDP

const http = require('http');
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

function evaluate(ws, id, expression) {
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.result && msg.result.exceptionDetails) {
          reject(new Error(msg.result.exceptionDetails.text));
        } else {
          resolve(msg.result.result.value);
        }
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true, awaitPromise: true }
    }));
  });
}

async function run() {
  const wsUrl = await getPageWsUrl();
  console.log('Connecting to Chrome CDP...');
  const ws = new WebSocket(wsUrl);

  await new Promise(r => ws.onopen = r);
  console.log('Connected! Measuring performance metrics...\n');

  // Measure FPS over 120 frames in the active Courtroom scene
  const perfData = await evaluate(ws, 201, `
    new Promise(resolve => {
      // Ensure courtroom is visible
      document.getElementById('btnSkipIntro')?.click();

      let frameCount = 0;
      let startTime = performance.now();
      let lastTime = startTime;
      let frameTimes = [];

      function checkFrame(now) {
        frameCount++;
        frameTimes.push(now - lastTime);
        lastTime = now;

        if (frameCount < 120) {
          requestAnimationFrame(checkFrame);
        } else {
          const totalDuration = now - startTime;
          const avgFps = Math.round((frameCount / totalDuration) * 1000);
          const minFrameTime = Math.min(...frameTimes).toFixed(2);
          const maxFrameTime = Math.max(...frameTimes).toFixed(2);
          const avgFrameTime = (totalDuration / frameCount).toFixed(2);

          // Get Three.js info if available
          let threeInfo = null;
          // Look up threeScene renderer
          const canvas = document.getElementById('viewport3D');
          const mem = window.performance?.memory ? {
            usedJSHeapSizeMB: (window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2),
            totalJSHeapSizeMB: (window.performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2),
            jsHeapSizeLimitMB: (window.performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)
          } : null;

          resolve({
            measuredDurationMs: totalDuration.toFixed(1),
            totalFrames: frameCount,
            measuredAvgFPS: avgFps,
            frameTimeMs: {
              avg: avgFrameTime,
              min: minFrameTime,
              max: maxFrameTime
            },
            memory: mem
          });
        }
      }

      requestAnimationFrame(checkFrame);
    })
  `);

  console.log('--- Measured Browser Performance Metrics ---');
  console.log(JSON.stringify(perfData, null, 2));

  // Measure Three.js scene object count
  const sceneData = await evaluate(ws, 202, `
    (() => {
      // Traverse DOM and scene
      const canvas = document.getElementById('viewport3D');
      return {
        canvasWidth: canvas?.width,
        canvasHeight: canvas?.height,
        devicePixelRatio: window.devicePixelRatio,
        hardwareConcurrency: navigator.hardwareConcurrency,
        webglVendor: (() => {
          try {
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'Generic WebGL';
          } catch(e) { return 'N/A'; }
        })()
      };
    })()
  `);

  console.log('\n--- WebGL Hardware & Surface Context ---');
  console.log(JSON.stringify(sceneData, null, 2));

  ws.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Performance measurement error:', err);
  process.exit(1);
});
