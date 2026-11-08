// scripts/inspect_browser_live.js
// Uses native Node WebSocket to connect to Chrome DevTools Protocol on port 9222

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

async function run() {
  const wsUrl = await getPageWsUrl();
  console.log('Connecting to Chrome CDP at:', wsUrl);

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('CDP WebSocket connected!');
    // Enable Console, Runtime, and Page domains
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
    ws.send(JSON.stringify({ id: 4, method: 'Page.enable' }));
    ws.send(JSON.stringify({ id: 5, method: 'Network.enable' }));
    ws.send(JSON.stringify({ id: 6, method: 'Page.reload' }));

    setTimeout(() => {
      ws.send(JSON.stringify({
        id: 10,
        method: 'Runtime.evaluate',
        params: {
          expression: `({
            title: document.title,
            canvasExists: !!document.getElementById('viewport3D'),
            clockVisible: !!document.getElementById('openingClock'),
            clockTime: document.getElementById('clockDigits')?.textContent,
            windowKeys: Object.keys(window)
          })`,
          returnByValue: true
        }
      }));
    }, 1500);

    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 3500);
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Network.responseReceived') {
      const resp = msg.params.response;
      if (resp.status >= 400) {
        console.error(`[HTTP ${resp.status} ERROR]`, resp.url, resp.statusText);
      }
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value !== undefined ? a.value : a.description).join(' ');
      console.log(`[Browser Console ${msg.params.type.toUpperCase()}]`, args);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[Browser Exception]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception);
    } else if (msg.method === 'Log.entryAdded') {
      console.log('[Browser Log Entry]', msg.params.entry.level, msg.params.entry.text);
    } else if (msg.id === 10) {
      console.log('[Page State Eval]:', msg.result.result.value);
    }
  };

  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };
}

run().catch(err => {
  console.error('Error in inspector:', err);
  process.exit(1);
});
