// scripts/test_web_assets.js
// Tests static serving of index.html, three.module.js, css files, and js modules.

const http = require('http');

function checkUrl(urlPath, expectedType, mustInclude) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const typeMatch = res.headers['content-type'] && res.headers['content-type'].includes(expectedType);
        const includeMatch = mustInclude ? data.includes(mustInclude) : true;
        const pass = res.statusCode === 200 && typeMatch && includeMatch;
        console.log(`[${pass ? 'PASS' : 'FAIL'}] ${urlPath} -> HTTP ${res.statusCode} (${res.headers['content-type']}) [${data.length} bytes]`);
        if (!pass) {
          console.error(`  Expected type: ${expectedType}, matched: ${typeMatch}. Must include '${mustInclude}', matched: ${includeMatch}`);
        }
        resolve(pass);
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- Testing PRAMANA 3D Web Assets on Port 3001 ---');
  const results = [];
  results.push(await checkUrl('/', 'text/html', 'PRAMANA — Supreme Court of India 3D Research Platform'));
  results.push(await checkUrl('/vendor/three/three.module.js', 'application/javascript', 'export'));
  results.push(await checkUrl('/vendor/three/addons/controls/OrbitControls.js', 'application/javascript', 'Controls'));
  results.push(await checkUrl('/css/main.css', 'text/css', '--bg-obsidian'));
  results.push(await checkUrl('/css/cinematic.css', 'text/css', '#openingClock'));
  results.push(await checkUrl('/css/courtroom.css', 'text/css', '.kathghara-tag'));
  results.push(await checkUrl('/css/research.css', 'text/css', '#researchWorkspace'));
  results.push(await checkUrl('/js/main.js', 'application/javascript', 'threeScene'));
  results.push(await checkUrl('/js/three_scene.js', 'application/javascript', 'ThreeSceneManager'));
  results.push(await checkUrl('/js/audio.js', 'application/javascript', 'CinematicAudioSystem'));
  results.push(await checkUrl('/js/scene_earth.js', 'application/javascript', 'EarthScene'));
  results.push(await checkUrl('/js/scene_exterior.js', 'application/javascript', 'SupremeCourtExteriorScene'));
  results.push(await checkUrl('/js/scene_courtroom.js', 'application/javascript', 'CourtroomScene'));
  results.push(await checkUrl('/js/scene_judge_gavel.js', 'application/javascript', 'JudgeAndGavelSystem'));
  results.push(await checkUrl('/js/scene_kathgharas.js', 'application/javascript', 'KathgharasSystem'));
  results.push(await checkUrl('/js/cinematic_director.js', 'application/javascript', 'CinematicDirector'));
  results.push(await checkUrl('/js/api.js', 'application/javascript', 'apiClient'));
  results.push(await checkUrl('/js/workspace.js', 'application/javascript', 'WorkspaceManager'));
  results.push(await checkUrl('/api/cases', 'application/json', 'cases'));
  results.push(await checkUrl('/api/plots/chunk_ranking.png', 'image/png'));

  const allPassed = results.every(Boolean);
  console.log(`\nResult: ${results.filter(Boolean).length} / ${results.length} checks passed.`);
  process.exit(allPassed ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
