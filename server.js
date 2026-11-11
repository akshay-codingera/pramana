// server.js
// Lightweight Node.js server bridging web clients to the PRAMANA R explainability & unseen document engines.
// Requires only built-in Node modules (http, fs, path, child_process).

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, exec } = require('child_process');

// Load .env if present (zero-dependency parser)
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
}

const PORT = process.env.PORT || 3001;
const RSCRIPT_PATH = process.env.RSCRIPT_PATH || 
  (fs.existsSync("D:\\Data_AI\\01_Software\\R\\R-4.6.1\\bin\\Rscript.exe") 
    ? "D:\\Data_AI\\01_Software\\R\\R-4.6.1\\bin\\Rscript.exe" 
    : "Rscript");
const WORKSPACE_DIR = __dirname;
const PUBLIC_DIR = path.join(WORKSPACE_DIR, 'public');
const RESULT_DIR = path.join(WORKSPACE_DIR, 'result');
const PLOTS_DIR = path.join(RESULT_DIR, 'plots');
const UPLOAD_DIR = path.join(WORKSPACE_DIR, 'data', 'unseen_uploads');

// Ensure directories exist
[PLOTS_DIR, RESULT_DIR, UPLOAD_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content);
    }
  });
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  // CORS headers
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // 1. API: List available cases
  if (req.method === 'GET' && pathname === '/api/cases') {
    const casesFile = path.join(RESULT_DIR, 'cases_list.json');
    if (fs.existsSync(casesFile)) {
      return sendFile(res, casesFile, 'application/json');
    }
    execFile(RSCRIPT_PATH, ['engine/pramana_cli.R', '--action', 'list_cases', '--output', casesFile],
      { cwd: WORKSPACE_DIR }, (error) => {
        if (error) {
          return sendJSON(res, 500, { error: 'Failed to list cases: ' + error.message });
        }
        sendFile(res, casesFile, 'application/json');
      });
    return;
  }

  // 2. API: Explain Judgment (Interactive Explorer)
  if (req.method === 'POST' && pathname === '/api/explain') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const caseId = payload.case_id || '1';
        const dataSource = payload.data_source || 'SAMPLE_ENGINEERING_FIXTURE';
        const seed = payload.seed || 42;
        const trials = payload.trials || 30;
        const customText = payload.text || '';

        const timestamp = Date.now();
        const outJson = path.join(RESULT_DIR, `explain_${caseId}_${timestamp}.json`);
        const args = [
          'engine/pramana_cli.R',
          '--action', 'explain',
          '--case_id', String(caseId),
          '--data_source', dataSource,
          '--seed', String(seed),
          '--trials', String(trials),
          '--output', outJson
        ];

        let tempTextFile = null;
        if (customText.trim().length > 0) {
          tempTextFile = path.join(RESULT_DIR, `custom_input_${timestamp}.txt`);
          fs.writeFileSync(tempTextFile, customText, 'utf8');
          args.push('--file', tempTextFile);
        }

        console.log(`[R Explain] Running: ${RSCRIPT_PATH} ${args.join(' ')}`);

        execFile(RSCRIPT_PATH, args, { cwd: WORKSPACE_DIR, maxBuffer: 15 * 1024 * 1024 }, (err, stdout, stderr) => {
          if (tempTextFile && fs.existsSync(tempTextFile)) {
            try { fs.unlinkSync(tempTextFile); } catch (e) {}
          }

          if (err) {
            console.error('[R Error]', stderr || err.message);
            return sendJSON(res, 500, { error: 'R execution failed', details: stderr || err.message });
          }

          if (!fs.existsSync(outJson)) {
            return sendJSON(res, 500, { error: 'Explainability output file not created by R' });
          }

          // Generate plots from the JSON result
          const plotArgs = ['engine/plot_explanations.R', outJson, PLOTS_DIR];
          execFile(RSCRIPT_PATH, plotArgs, { cwd: WORKSPACE_DIR }, (plotErr) => {
            if (plotErr) {
              console.warn('[Plot Warning] Could not generate plots:', plotErr.message);
            }

            fs.readFile(outJson, 'utf8', (readErr, jsonContent) => {
              try { fs.unlinkSync(outJson); } catch (e) {}

              if (readErr) {
                return sendJSON(res, 500, { error: 'Failed to read output' });
              }
              const report = JSON.parse(jsonContent);
              report.plots = {
                chunk_ranking: `/api/plots/chunk_ranking.png?t=${timestamp}`,
                probability_changes: `/api/plots/probability_changes.png?t=${timestamp}`,
                pos_neg_contributions: `/api/plots/pos_neg_contributions.png?t=${timestamp}`,
                original_vs_perturbed: `/api/plots/original_vs_perturbed.png?t=${timestamp}`,
                random_vs_influential: `/api/plots/random_vs_influential.png?t=${timestamp}`
              };
              sendJSON(res, 200, report);
            });
          });
        });
      } catch (err) {
        sendJSON(res, 400, { error: 'Invalid JSON payload: ' + err.message });
      }
    });
    return;
  }

  // 3. API: Unseen Document Upload & Prediction
  if (req.method === 'POST' && (pathname === '/api/upload_predict' || pathname === '/api/predict-unseen')) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const timestamp = Date.now();
        const model = payload.model || 'hierarchical';
        let uploadFilePath = null;

        if (payload.file_base64 && payload.filename) {
          // Decode binary file (PDF / DOCX)
          const base64Data = payload.file_base64.replace(/^data:.*?;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const cleanName = path.basename(payload.filename).replace(/[^a-zA-Z0-9._-]/g, '_');
          uploadFilePath = path.join(UPLOAD_DIR, `${timestamp}_${cleanName}`);
          fs.writeFileSync(uploadFilePath, buffer);
        } else if (payload.text && payload.text.trim().length > 0) {
          // Plain text input
          uploadFilePath = path.join(UPLOAD_DIR, `${timestamp}_custom_text.txt`);
          fs.writeFileSync(uploadFilePath, payload.text.trim(), 'utf8');
        } else {
          return sendJSON(res, 400, { error: 'No document file or text provided.' });
        }

        const outJson = path.join(RESULT_DIR, `unseen_pred_${timestamp}.json`);
        const args = [
          'engine/pramana_cli.R',
          '--action', 'predict_unseen',
          '--file', uploadFilePath,
          '--model', model,
          '--output', outJson
        ];

        console.log(`[Unseen Prediction] Running: ${RSCRIPT_PATH} ${args.join(' ')}`);

        execFile(RSCRIPT_PATH, args, { cwd: WORKSPACE_DIR, maxBuffer: 25 * 1024 * 1024 }, (err, stdout, stderr) => {
          if (err) {
            console.error('[Unseen Error]', stderr || err.message);
            return sendJSON(res, 500, { error: 'Inference failed in R engine', details: stderr || err.message });
          }

          if (!fs.existsSync(outJson)) {
            return sendJSON(res, 500, { error: 'Prediction output file not generated by R engine.' });
          }

          fs.readFile(outJson, 'utf8', (readErr, jsonContent) => {
            try { fs.unlinkSync(outJson); } catch (e) {}

            if (readErr) {
              return sendJSON(res, 500, { error: 'Failed to read prediction JSON.' });
            }

            const result = JSON.parse(jsonContent);
            sendJSON(res, 200, result);
          });
        });

      } catch (err) {
        sendJSON(res, 400, { error: 'Invalid JSON payload: ' + err.message });
      }
    });
    return;
  }

  // 4. API: Record Ground Truth
  if (req.method === 'POST' && pathname === '/api/ground_truth') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const experimentId = payload.experiment_id;
        const groundTruth = (payload.ground_truth || '').toUpperCase();

        if (!experimentId || !['ALLOWED', 'DISMISSED'].includes(groundTruth)) {
          return sendJSON(res, 400, { error: 'experiment_id and ground_truth ("ALLOWED" or "DISMISSED") required.' });
        }

        const timestamp = Date.now();
        const outJson = path.join(RESULT_DIR, `gt_${timestamp}.json`);
        const args = [
          'engine/pramana_cli.R',
          '--action', 'record_ground_truth',
          '--experiment_id', experimentId,
          '--ground_truth', groundTruth,
          '--output', outJson
        ];

        console.log(`[Ground Truth] Running: ${RSCRIPT_PATH} ${args.join(' ')}`);

        execFile(RSCRIPT_PATH, args, { cwd: WORKSPACE_DIR }, (err, stdout, stderr) => {
          if (err) {
            return sendJSON(res, 500, { error: 'Failed to record ground truth: ' + (stderr || err.message) });
          }

          if (!fs.existsSync(outJson)) {
            return sendJSON(res, 500, { error: 'Ground truth result file not created.' });
          }

          fs.readFile(outJson, 'utf8', (readErr, jsonContent) => {
            try { fs.unlinkSync(outJson); } catch (e) {}
            if (readErr) return sendJSON(res, 500, { error: 'Failed to read output' });
            sendJSON(res, 200, JSON.parse(jsonContent));
          });
        });

      } catch (err) {
        sendJSON(res, 400, { error: 'Invalid JSON payload: ' + err.message });
      }
    });
    return;
  }

  // 5. API: List Experiments & Cumulative Evaluation
  if (req.method === 'GET' && pathname === '/api/experiments') {
    const regFile = path.join(RESULT_DIR, 'unseen_experiments.json');
    if (fs.existsSync(regFile)) {
      try {
        const content = fs.readFileSync(regFile, 'utf8').trim();
        const records = content ? JSON.parse(content) : [];
        let tp = 0, fp = 0, fn = 0, tn = 0, n_eval = 0;
        records.forEach(r => {
          const gt = r.ground_truth;
          if (typeof gt === 'string' && (gt.toUpperCase() === 'ALLOWED' || gt.toUpperCase() === 'DISMISSED')) {
            n_eval++;
            const pred = r.predicted_outcome;
            const act = gt.toUpperCase();
            if (pred === 'ALLOWED' && act === 'ALLOWED') tp++;
            if (pred === 'ALLOWED' && act === 'DISMISSED') fp++;
            if (pred === 'DISMISSED' && act === 'ALLOWED') fn++;
            if (pred === 'DISMISSED' && act === 'DISMISSED') tn++;
          }
        });
        const evalSummary = {
          total_experiments: records.length,
          total_evaluated: n_eval,
          accuracy: n_eval > 0 ? (tp + tn) / n_eval : 0,
          confusion_matrix: {
            true_positives: tp,
            false_positives: fp,
            false_negatives: fn,
            true_negatives: tn
          }
        };
        return sendJSON(res, 200, { experiments: records, evaluation_summary: evalSummary });
      } catch (parseErr) {
        // Fall through to Rscript fallback below
      }
    }

    const timestamp = Date.now();
    const outJson = path.join(RESULT_DIR, `exp_list_${timestamp}.json`);
    const args = [
      'engine/pramana_cli.R',
      '--action', 'list_experiments',
      '--output', outJson
    ];

    execFile(RSCRIPT_PATH, args, { cwd: WORKSPACE_DIR }, (err, stdout, stderr) => {
      if (err) {
        return sendJSON(res, 500, { error: 'Failed to list experiments: ' + (stderr || err.message) });
      }
      if (!fs.existsSync(outJson)) {
        return sendJSON(res, 200, { experiments: [], evaluation_summary: { total_experiments: 0, total_evaluated: 0, accuracy: 0 } });
      }
      fs.readFile(outJson, 'utf8', (readErr, content) => {
        try { fs.unlinkSync(outJson); } catch (e) {}
        if (readErr) return sendJSON(res, 500, { error: 'Failed to read experiments list' });
        sendJSON(res, 200, JSON.parse(content));
      });
    });
    return;
  }

  // 6. API: Serve Generated R Plots
  if (req.method === 'GET' && pathname.startsWith('/api/plots/')) {
    const filename = path.basename(pathname);
    const plotFile = path.join(PLOTS_DIR, filename);
    return sendFile(res, plotFile, 'image/png');
  }

  // 7. Static File Serving (Frontend)
  let staticPath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!staticPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Access denied');
  }

  const ext = path.extname(staticPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  sendFile(res, staticPath, contentType);
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`PRAMANA Explainable Legal Outcome Prediction System`);
  console.log(`R Engine: ${RSCRIPT_PATH}`);
  console.log(`Web Interface listening at: http://localhost:${PORT}`);
  console.log(`========================================================`);
});
