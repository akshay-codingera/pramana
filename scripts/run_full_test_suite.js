// scripts/run_full_test_suite.js
// Master automated test suite runner for PRAMANA 3D platform.
// Executes asset verification, UI interactions, and validates experiment registry isolation.

const { spawnSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', 'result', 'unseen_experiments.json');

function getRegistryFingerprint() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return { exists: false, count: 0, hash: null };
  }
  const content = fs.readFileSync(REGISTRY_PATH);
  const data = JSON.parse(content.toString('utf8'));
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return { exists: true, count: data.length, hash };
}

console.log('================================================================');
console.log('       PRAMANA COMPREHENSIVE AUTOMATED TEST SUITE RUNNER        ');
console.log('================================================================\n');

// 1. Pre-execution Live Registry Check
console.log('[Phase 1] Pre-test live experiment registry fingerprint:');
const preFingerprint = getRegistryFingerprint();
console.log(`  File exists: ${preFingerprint.exists}`);
console.log(`  Record count: ${preFingerprint.count}`);
console.log(`  SHA-256: ${preFingerprint.hash}\n`);

// 2. Run Web Assets & Endpoint Tests
console.log('[Phase 2] Executing Web Assets & Endpoints Verification...');
const assetTest = spawnSync('node', ['scripts/test_web_assets.js'], { stdio: 'inherit' });
if (assetTest.status !== 0) {
  console.error('\n[FAIL] Phase 2 (Web Assets Test) failed with exit code', assetTest.status);
  process.exit(assetTest.status || 1);
}
console.log('[PASS] Phase 2 (Web Assets Test) passed successfully.\n');

// 3. Run Chrome DevTools Protocol Interactive Tests
console.log('[Phase 3] Executing Browser Interaction & User Flow Tests via Chrome CDP...');
const uiTest = spawnSync('node', ['scripts/test_user_interactions.js'], { stdio: 'inherit' });
if (uiTest.status !== 0) {
  console.error('\n[FAIL] Phase 3 (Browser Interactions Test) failed with exit code', uiTest.status);
  process.exit(uiTest.status || 1);
}
console.log('[PASS] Phase 3 (Browser Interactions Test) passed successfully.\n');

// 4. Post-execution Live Registry Isolation Verification
console.log('[Phase 4] Post-test live experiment registry fingerprint verification:');
const postFingerprint = getRegistryFingerprint();
console.log(`  File exists: ${postFingerprint.exists}`);
console.log(`  Record count: ${postFingerprint.count}`);
console.log(`  SHA-256: ${postFingerprint.hash}`);

if (preFingerprint.count !== postFingerprint.count || preFingerprint.hash !== postFingerprint.hash) {
  console.error('\n[CRITICAL ERROR] Registry pollution detected! Live experiment registry was altered during tests.');
  console.error(`  Pre: count=${preFingerprint.count}, hash=${preFingerprint.hash}`);
  console.error(`  Post: count=${postFingerprint.count}, hash=${postFingerprint.hash}`);
  process.exit(1);
}

console.log('  [PASS] Live experiment registry remains 100% UNTOUCHED and pristine.');

console.log('\n================================================================');
console.log('       ALL TEST PHASES PASSED WITH ZERO ERRORS & ISOLATION!     ');
console.log('================================================================');
process.exit(0);
