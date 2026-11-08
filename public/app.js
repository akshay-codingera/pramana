// public/app.js
// Interactive frontend logic for PRAMANA Explainable Legal Outcome Prediction System
// Supports both:
// 1. Unseen Legal Document Blind Prediction Experiment & Cumulative Evaluation
// 2. 77-Year SC Corpus Explorer & Sensitivity Diagnostics

let currentReport = null;
let currentFilter = 'all';
let selectedChunkId = null;

// Unseen Experiment State
let currentUnseenFile = null;
let currentUnseenBase64 = null;
let currentUnseenExperimentId = null;

// DOM Elements: Navigation Modes
const modeBtnUnseen = document.getElementById('modeBtnUnseen');
const modeBtnExplorer = document.getElementById('modeBtnExplorer');
const unseenContainer = document.getElementById('unseenContainer');
const explorerContainer = document.getElementById('explorerContainer');

// DOM Elements: Unseen Document Workflow
const unseenDropzone = document.getElementById('unseenDropzone');
const unseenFileInput = document.getElementById('unseenFileInput');
const selectedFileInfo = document.getElementById('selectedFileInfo');
const selectedFileName = document.getElementById('selectedFileName');
const selectedFileSize = document.getElementById('selectedFileSize');
const unseenTextInput = document.getElementById('unseenTextInput');
const unseenModelSelect = document.getElementById('unseenModelSelect');
const btnPredictUnseen = document.getElementById('btnPredictUnseen');
const unseenBtnText = document.getElementById('unseenBtnText');
const unseenBtnSpinner = document.getElementById('unseenBtnSpinner');

// Unseen Audit & Result Elements
const unseenAuditCard = document.getElementById('unseenAuditCard');
const verdictWarningBox = document.getElementById('verdictWarningBox');
const warningHeading = document.getElementById('warningHeading');
const warningBody = document.getElementById('warningBody');
const docNameDisplay = document.getElementById('docNameDisplay');
const fileHashDisplay = document.getElementById('fileHashDisplay');
const textHashDisplay = document.getElementById('textHashDisplay');
const presenceDisplay = document.getElementById('presenceDisplay');
const unseenWordCount = document.getElementById('unseenWordCount');
const unseenChunkCount = document.getElementById('unseenChunkCount');
const unseenMarkerCount = document.getElementById('unseenMarkerCount');
const extractedTextPreview = document.getElementById('extractedTextPreview');

const unseenPredCard = document.getElementById('unseenPredCard');
const unseenOutcomeDisplay = document.getElementById('unseenOutcomeDisplay');
const unseenBarAllowed = document.getElementById('unseenBarAllowed');
const unseenBarDismissed = document.getElementById('unseenBarDismissed');
const unseenProbAllowed = document.getElementById('unseenProbAllowed');
const unseenProbDismissed = document.getElementById('unseenProbDismissed');
const unseenConfidenceDisplay = document.getElementById('unseenConfidenceDisplay');
const modelVerBadge = document.getElementById('modelVerBadge');

const unseenLocoCard = document.getElementById('unseenLocoCard');
const unseenPassagesBody = document.getElementById('unseenPassagesBody');

const unseenGtCard = document.getElementById('unseenGtCard');
const btnSubmitGroundTruth = document.getElementById('btnSubmitGroundTruth');
const evaluationFeedback = document.getElementById('evaluationFeedback');
const gtStatusBadge = document.getElementById('gtStatusBadge');

// Cumulative Evaluation Dashboard Elements
const evalTotalCount = document.getElementById('evalTotalCount');
const evalAccuracy = document.getElementById('evalAccuracy');
const evalPrecision = document.getElementById('evalPrecision');
const evalRecall = document.getElementById('evalRecall');
const evalSpecificity = document.getElementById('evalSpecificity');
const cmTP = document.getElementById('cmTP');
const cmFP = document.getElementById('cmFP');
const cmFN = document.getElementById('cmFN');
const cmTN = document.getElementById('cmTN');
const historyTableBody = document.getElementById('historyTableBody');

// DOM Elements: Explorer Mode
const caseSelect = document.getElementById('caseSelect');
const randomTrials = document.getElementById('randomTrials');
const randomSeed = document.getElementById('randomSeed');
const runExplainBtn = document.getElementById('runExplainBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');

const customTextInput = document.getElementById('customTextInput');
const analyzeCustomBtn = document.getElementById('analyzeCustomBtn');
const clearCustomBtn = document.getElementById('clearCustomBtn');

const predOutcome = document.getElementById('predOutcome');
const predMargin = document.getElementById('predMargin');
const barAccepted = document.getElementById('barAccepted');
const barRejected = document.getElementById('barRejected');
const probAccepted = document.getElementById('probAccepted');
const probRejected = document.getElementById('probRejected');
const metricChunkCount = document.getElementById('metricChunkCount');
const metricSuppCount = document.getElementById('metricSuppCount');
const metricOppCount = document.getElementById('metricOppCount');
const metricCFFlip = document.getElementById('metricCFFlip');
const metricCFDetails = document.getElementById('metricCFDetails');

const documentContent = document.getElementById('documentContent');
const chunkList = document.getElementById('chunkList');
const viewerBadge = document.getElementById('viewerBadge');

const tabButtons = document.querySelectorAll('.tab-btn');
const navTabs = document.querySelectorAll('.nav-tab');
const tabPanels = document.querySelectorAll('.tab-panel');

const chartChunkRanking = document.getElementById('chartChunkRanking');
const chartProbChanges = document.getElementById('chartProbChanges');
const chartPosNeg = document.getElementById('chartPosNeg');
const chartOriginalPerturbed = document.getElementById('chartOriginalPerturbed');
const chartRandomInfluential = document.getElementById('chartRandomInfluential');

const topKTableBody = document.getElementById('topKTableBody');
const statTop1Drop = document.getElementById('statTop1Drop');
const statMeanRandom = document.getElementById('statMeanRandom');
const statSdRandom = document.getElementById('statSdRandom');
const statZScore = document.getElementById('statZScore');
const statPValue = document.getElementById('statPValue');

const cfStatus = document.getElementById('cfStatus');
const cfDetails = document.getElementById('cfDetails');
const cfCaveatText = document.getElementById('cfCaveatText');

// ========================================================
// INITIALIZATION
// ========================================================
async function init() {
  setupModeNavigation();
  setupUnseenWorkflow();
  setupTabs();
  setupFilterTabs();
  setupExplorerListeners();
  
  // Load past experiment history and cumulative evaluation
  await loadExperimentHistory();

  // Load cases for Explorer mode
  await loadCases();
}

// --------------------------------------------------------
// 1. Workflow Mode Switching
// --------------------------------------------------------
function setupModeNavigation() {
  modeBtnUnseen.addEventListener('click', () => {
    modeBtnUnseen.classList.add('active');
    modeBtnExplorer.classList.remove('active');
    unseenContainer.style.display = 'flex';
    explorerContainer.style.display = 'none';
  });

  modeBtnExplorer.addEventListener('click', () => {
    modeBtnExplorer.classList.add('active');
    modeBtnUnseen.classList.remove('active');
    unseenContainer.style.display = 'none';
    explorerContainer.style.display = 'block';

    // If no case loaded yet, trigger default
    if (!currentReport && caseSelect.value && caseSelect.value !== 'loading') {
      runExplain();
    }
  });
}

// --------------------------------------------------------
// 2. Unseen Document Workflow Handlers
// --------------------------------------------------------
function setupUnseenWorkflow() {
  // Dropzone click -> trigger input
  unseenDropzone.addEventListener('click', () => unseenFileInput.click());

  // Drag & drop handlers
  unseenDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    unseenDropzone.classList.add('dragover');
  });

  unseenDropzone.addEventListener('dragleave', () => {
    unseenDropzone.classList.remove('dragover');
  });

  unseenDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    unseenDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  unseenFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Predict Action
  btnPredictUnseen.addEventListener('click', () => runUnseenPrediction());

  // Ground Truth Submit Action
  btnSubmitGroundTruth.addEventListener('click', () => submitGroundTruth());
}

function handleFileSelected(file) {
  currentUnseenFile = file;
  selectedFileName.textContent = file.name;
  selectedFileSize.textContent = `(${(file.size / 1024).toFixed(1)} KB)`;
  selectedFileInfo.style.display = 'inline-flex';

  const reader = new FileReader();
  reader.onload = (e) => {
    currentUnseenBase64 = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function runUnseenPrediction() {
  const customText = unseenTextInput.value.trim();
  if (!currentUnseenBase64 && !customText) {
    alert('Please select a PDF/DOCX file or paste judgment text to predict.');
    return;
  }

  setUnseenLoading(true);

  const payload = {
    filename: currentUnseenFile ? currentUnseenFile.name : 'custom_input.txt',
    file_base64: currentUnseenBase64 || '',
    text: customText,
    model: unseenModelSelect.value
  };

  try {
    const res = await fetch('/api/upload_predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || errData.details || 'Inference failed');
    }

    const result = await res.json();
    renderUnseenResult(result);
    await loadExperimentHistory();
  } catch (err) {
    alert('Prediction error: ' + err.message);
    console.error(err);
  } finally {
    setUnseenLoading(false);
  }
}

function renderUnseenResult(res) {
  currentUnseenExperimentId = res.experiment_id;

  // 1. Audit Card
  unseenAuditCard.style.display = 'block';
  docNameDisplay.textContent = res.document_name;
  fileHashDisplay.textContent = res.file_hash;
  textHashDisplay.textContent = res.text_hash;

  if (res.dataset_presence && res.dataset_presence.exists) {
    presenceDisplay.textContent = `MATCH FOUND: ${res.dataset_presence.matched_id} in ${res.dataset_presence.split}`;
    presenceDisplay.style.color = '#ef4444';
  } else {
    presenceDisplay.textContent = 'VERIFIED UNSEEN: Not Present in 77-Year SC Corpus or Splits (0% Data Leakage)';
    presenceDisplay.style.color = '#4ade80';
  }

  unseenWordCount.textContent = res.word_count || '—';
  unseenChunkCount.textContent = res.total_chunks || '—';
  unseenMarkerCount.textContent = res.indicators_count || 0;

  if (res.indicators_count > 0) {
    verdictWarningBox.style.display = 'block';
    warningHeading.textContent = `⚠️ ${res.indicators_count} Operative Decree / Verdict Indicator(s) Detected`;
    warningBody.textContent = res.verdict_warnings;
  } else {
    verdictWarningBox.style.display = 'none';
  }

  extractedTextPreview.textContent = res.text_preview || 'No text extracted.';

  // 2. Prediction Card
  unseenPredCard.style.display = 'block';
  modelVerBadge.textContent = res.model_version || 'PRAMANA-HBiGRU-v1.0';

  unseenOutcomeDisplay.textContent = res.predicted_outcome;
  if (res.predicted_outcome === 'ALLOWED') {
    unseenOutcomeDisplay.className = 'metric-value text-success';
  } else {
    unseenOutcomeDisplay.className = 'metric-value text-danger';
  }

  const pAllowed = res.prob_allowed;
  const pDismissed = res.prob_dismissed;
  unseenProbAllowed.textContent = `P(ALLOWED): ${(pAllowed * 100).toFixed(2)}%`;
  unseenProbDismissed.textContent = `P(DISMISSED): ${(pDismissed * 100).toFixed(2)}%`;
  unseenBarAllowed.style.width = `${pAllowed * 100}%`;
  unseenBarDismissed.style.width = `${pDismissed * 100}%`;

  unseenConfidenceDisplay.textContent = `${(res.confidence * 100).toFixed(1)}%`;

  // 3. LOCO Salient Passages
  unseenLocoCard.style.display = 'block';
  renderUnseenPassages(res.top_passages);

  // 4. Ground Truth Card (Reset state)
  unseenGtCard.style.display = 'block';
  gtStatusBadge.textContent = 'Pending User Ground-Truth Entry';
  gtStatusBadge.className = 'header-badge';
  evaluationFeedback.style.display = 'none';

  const radios = document.getElementsByName('actualVerdict');
  radios.forEach(r => r.checked = false);
  btnSubmitGroundTruth.disabled = false;
}

function renderUnseenPassages(passages) {
  unseenPassagesBody.innerHTML = '';
  if (!passages || passages.length === 0) {
    unseenPassagesBody.innerHTML = '<tr><td colspan="5">No influential passages extracted.</td></tr>';
    return;
  }

  passages.forEach((p, idx) => {
    const tr = document.createElement('tr');
    const isSupp = (p.direction === 'SUPPORTING' || p.role === 'SUPPORTING');
    const roleBadge = isSupp
      ? '<span class="role-badge role-supp">SUPPORTING</span>'
      : '<span class="role-badge role-opp">OPPOSING</span>';
    
    const deltaP = p.delta_probability !== undefined ? p.delta_probability : p.contribution;
    const snippet = p.verbatim_text || p.preview || p.text_preview || '';

    tr.innerHTML = `
      <td><strong>#${idx + 1}</strong></td>
      <td>Para ${p.paragraph_num || (idx + 1)}</td>
      <td>${roleBadge}</td>
      <td><code>${deltaP >= 0 ? '+' : ''}${Number(deltaP).toFixed(4)}</code></td>
      <td style="font-size: 0.85rem; max-width: 450px;">${escapeHtml(snippet)}</td>
    `;
    unseenPassagesBody.appendChild(tr);
  });
}

async function submitGroundTruth() {
  if (!currentUnseenExperimentId) {
    alert('No active experiment to record ground truth for.');
    return;
  }

  const selectedRadio = document.querySelector('input[name="actualVerdict"]:checked');
  if (!selectedRadio) {
    alert('Please select the actual court verdict (ALLOWED or DISMISSED).');
    return;
  }

  const verdict = selectedRadio.value;
  btnSubmitGroundTruth.disabled = true;

  try {
    const res = await fetch('/api/ground_truth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experiment_id: currentUnseenExperimentId,
        ground_truth: verdict
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit ground truth');
    }

    const data = await res.json();
    const isCorrect = data.updated_experiment.is_correct;

    // Show evaluation feedback
    evaluationFeedback.style.display = 'block';
    if (isCorrect) {
      evaluationFeedback.style.background = '#dcfce7';
      evaluationFeedback.style.color = '#166534';
      evaluationFeedback.style.border = '1px solid #86efac';
      evaluationFeedback.innerHTML = `
        <strong>VERIFIED CORRECT PREDICTION!</strong><br>
        The model predicted <strong>${data.updated_experiment.predicted_outcome}</strong>, which matches the authentic court disposition (<strong>${verdict}</strong>).
      `;
      gtStatusBadge.textContent = 'EVALUATED: CORRECT';
      gtStatusBadge.className = 'header-badge badge-success';
    } else {
      evaluationFeedback.style.background = '#fee2e2';
      evaluationFeedback.style.color = '#991b1b';
      evaluationFeedback.style.border = '1px solid #fca5a5';
      evaluationFeedback.innerHTML = `
        <strong>PREDICTION INCORRECT:</strong><br>
        The model predicted <strong>${data.updated_experiment.predicted_outcome}</strong>, while the authentic court disposition was <strong>${verdict}</strong>.
      `;
      gtStatusBadge.textContent = 'EVALUATED: INCORRECT';
      gtStatusBadge.className = 'header-badge badge-danger';
    }

    // Refresh cumulative dashboard
    await loadExperimentHistory();
  } catch (err) {
    alert('Error saving ground truth: ' + err.message);
    btnSubmitGroundTruth.disabled = false;
  }
}

async function loadExperimentHistory() {
  try {
    const res = await fetch('/api/experiments');
    if (!res.ok) return;

    const data = await res.json();
    const experiments = data.experiments || [];
    const summary = data.evaluation_summary || {};

    evalTotalCount.textContent = summary.total_evaluated || 0;
    evalAccuracy.textContent = summary.total_evaluated > 0 ? `${summary.accuracy}%` : '—';
    
    // Confusion matrix cells
    const cm = summary.confusion_matrix || { true_positives: 0, false_positives: 0, false_negatives: 0, true_negatives: 0 };
    cmTP.textContent = `${cm.true_positives} (TP)`;
    cmFP.textContent = `${cm.false_positives} (FP)`;
    cmFN.textContent = `${cm.false_negatives} (FN)`;
    cmTN.textContent = `${cm.true_negatives} (TN)`;

    // Additional metrics
    const tp = cm.true_positives;
    const fp = cm.false_positives;
    const fn = cm.false_negatives;
    const tn = cm.true_negatives;

    const prec = (tp + fp) > 0 ? ((tp / (tp + fp)) * 100).toFixed(1) + '%' : '—';
    const rec = (tp + fn) > 0 ? ((tp / (tp + fn)) * 100).toFixed(1) + '%' : '—';
    const spec = (tn + fp) > 0 ? ((tn / (tn + fp)) * 100).toFixed(1) + '%' : '—';

    evalPrecision.textContent = prec;
    evalRecall.textContent = rec;
    evalSpecificity.textContent = spec;

    // History Table
    historyTableBody.innerHTML = '';
    if (experiments.length === 0) {
      historyTableBody.innerHTML = '<tr><td colspan="7">No unseen document experiments recorded yet.</td></tr>';
      return;
    }

    // Render most recent first
    experiments.slice().reverse().forEach(exp => {
      const tr = document.createElement('tr');
      const hasGt = exp.ground_truth !== null && exp.ground_truth !== undefined && exp.ground_truth !== '';
      const evalBadge = hasGt
        ? (exp.is_correct
            ? '<span class="badge badge-success">CORRECT</span>'
            : '<span class="badge badge-danger">INCORRECT</span>')
        : '<span class="badge badge-warning">BLIND (PENDING)</span>';

      const pAllowedStr = exp.prob_allowed !== undefined ? `${(exp.prob_allowed * 100).toFixed(1)}%` : '—';

      tr.innerHTML = `
        <td><code>${exp.experiment_id}</code></td>
        <td>${exp.upload_timestamp || '—'}</td>
        <td>${escapeHtml(exp.document_name || 'Document')}</td>
        <td><strong>${exp.predicted_outcome}</strong></td>
        <td>${pAllowedStr}</td>
        <td>${exp.ground_truth ? `<strong>${exp.ground_truth}</strong>` : '<em>Unrevealed</em>'}</td>
        <td>${evalBadge}</td>
      `;
      historyTableBody.appendChild(tr);
    });

  } catch (err) {
    console.warn('Could not load experiment history:', err);
  }
}

function setUnseenLoading(loading) {
  if (loading) {
    btnPredictUnseen.disabled = true;
    unseenBtnSpinner.classList.remove('hidden');
    unseenBtnText.textContent = 'Processing & Inferring in R...';
  } else {
    btnPredictUnseen.disabled = false;
    unseenBtnSpinner.classList.add('hidden');
    unseenBtnText.textContent = 'Validate & Predict Unseen Case';
  }
}

// --------------------------------------------------------
// 3. Explorer Mode Functions (Historical Corpus)
// --------------------------------------------------------
function setupExplorerListeners() {
  runExplainBtn.addEventListener('click', () => runExplain());

  caseSelect.addEventListener('change', () => {
    runExplain();
  });

  analyzeCustomBtn.addEventListener('click', () => {
    const text = customTextInput.value.trim();
    if (!text) {
      alert('Please enter or paste judgment text.');
      return;
    }
    runExplain({ customText: text, dataSource: 'SAMPLE_ENGINEERING_FIXTURE' });
  });

  clearCustomBtn.addEventListener('click', () => {
    customTextInput.value = '';
  });
}

function setupTabs() {
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.dataset.target;
      document.getElementById(targetId).classList.add('active');
    });
  });
}

function setupFilterTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderChunkList();
    });
  });
}

async function loadCases() {
  try {
    const res = await fetch('/api/cases');
    const cases = await res.json();
    caseSelect.innerHTML = '';

    cases.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.title} — [Ground Truth: ${c.true_label}]`;
      opt.dataset.dataSource = c.data_source;
      caseSelect.appendChild(opt);
    });

    if (caseSelect.querySelector('option[value="real_sc_01"]')) {
      caseSelect.value = "real_sc_01";
    }
  } catch (err) {
    console.error('Failed to load cases:', err);
    caseSelect.innerHTML = '<option value="real_sc_01">Authentic SC Judgment (Criminal Appeal No. 4250/2024)</option>';
  }
}

async function runExplain(options = {}) {
  setLoading(true);

  const selectedOpt = caseSelect.options[caseSelect.selectedIndex];
  const caseId = options.caseId || caseSelect.value;
  const dataSource = options.dataSource || (selectedOpt ? selectedOpt.dataset.dataSource : 'SAMPLE_ENGINEERING_FIXTURE');
  const customText = options.customText || '';

  const payload = {
    case_id: caseId,
    data_source: dataSource,
    seed: parseInt(randomSeed.value, 10) || 42,
    trials: parseInt(randomTrials.value, 10) || 30,
    text: customText
  };

  try {
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || errData.details || 'Server error');
    }

    currentReport = await res.json();
    updateUI(currentReport);
  } catch (err) {
    alert('Error running explainability engine: ' + err.message);
    console.error(err);
  } finally {
    setLoading(false);
  }
}

function updateUI(rep) {
  const pAllowed = rep.baseline.probabilities.ALLOWED || rep.baseline.probabilities.ACCEPTED || 0.5;
  const pDismissed = rep.baseline.probabilities.DISMISSED || rep.baseline.probabilities.REJECTED || 0.5;
  const pOrig = rep.baseline.probabilities[rep.baseline.predicted_class];

  predOutcome.textContent = rep.baseline.predicted_class;
  if (rep.baseline.predicted_class === 'ALLOWED' || rep.baseline.predicted_class === 'ACCEPTED') {
    predOutcome.className = 'metric-value text-success';
  } else {
    predOutcome.className = 'metric-value text-danger';
  }

  predMargin.textContent = `Margin: ${(rep.baseline.confidence * 100).toFixed(1)}% | P(orig)=${pOrig.toFixed(4)}`;

  barAccepted.style.width = `${pAllowed * 100}%`;
  barRejected.style.width = `${pDismissed * 100}%`;
  probAccepted.textContent = `P(ALLOWED): ${(pAllowed * 100).toFixed(2)}%`;
  probRejected.textContent = `P(DISMISSED): ${(pDismissed * 100).toFixed(2)}%`;

  metricChunkCount.textContent = rep.segmentation.chunk_count;

  const supp = rep.loco.supporting_chunks ? rep.loco.supporting_chunks.length : 0;
  const opp = rep.loco.opposing_chunks ? rep.loco.opposing_chunks.length : 0;
  metricSuppCount.textContent = supp;
  metricOppCount.textContent = opp;

  if (rep.counterfactual && rep.counterfactual.counterfactual_found) {
    metricCFFlip.textContent = `Flipped (${rep.counterfactual.combination_size} chunks)`;
    metricCFFlip.className = 'metric-value font-sm text-danger';
    const comboStr = Array.isArray(rep.counterfactual.minimal_chunk_combination)
      ? rep.counterfactual.minimal_chunk_combination.join(', ')
      : rep.counterfactual.minimal_chunk_combination;
    metricCFDetails.textContent = `Combo: [${comboStr}] -> ${rep.counterfactual.counterfactual_class}`;
  } else {
    metricCFFlip.textContent = 'Stable (No Flip)';
    metricCFFlip.className = 'metric-value font-sm text-success';
    metricCFDetails.textContent = 'Resistant within budget';
  }

  renderDocument(rep.segmentation);
  renderChunkList();
  renderTopKTable(rep.top_k_removal.progressive_steps);
  renderRandomStats(rep.random_baseline);
  renderCounterfactual(rep.counterfactual);
  updatePlots(rep.plots);
}

function renderDocument(seg) {
  documentContent.innerHTML = '';
  selectedChunkId = null;
  viewerBadge.textContent = `${seg.chunk_count} passages indexed`;

  if (!seg.chunks || seg.chunks.length === 0) {
    documentContent.innerHTML = '<p class="placeholder-text">No chunks found in document.</p>';
    return;
  }

  seg.chunks.forEach((chunk) => {
    const p = document.createElement('div');
    p.className = 'doc-paragraph';
    p.id = `doc-chunk-${chunk.chunk_id}`;
    p.dataset.chunkId = chunk.chunk_id;

    p.innerHTML = `
      <span class="para-num">¶${chunk.paragraph_num} [ID: ${chunk.chunk_id}]</span>
      <span class="chunk-text">${escapeHtml(chunk.text)}</span>
    `;

    p.addEventListener('click', () => {
      highlightChunk(chunk.chunk_id);
    });

    documentContent.appendChild(p);
  });
}

function renderChunkList() {
  if (!currentReport || !currentReport.loco) return;

  chunkList.innerHTML = '';
  let chunks = currentReport.loco.ranked_chunks || [];

  if (currentFilter === 'SUPPORTING') {
    chunks = chunks.filter(c => c.role === 'SUPPORTING');
  } else if (currentFilter === 'OPPOSING') {
    chunks = chunks.filter(c => c.role === 'OPPOSING');
  }

  if (chunks.length === 0) {
    chunkList.innerHTML = '<p class="placeholder-text">No passages match the selected filter.</p>';
    return;
  }

  chunks.forEach(chunk => {
    const card = document.createElement('div');
    const isSupp = chunk.role === 'SUPPORTING';
    card.className = `chunk-card ${isSupp ? 'role-supporting' : 'role-opposing'}`;
    card.id = `card-chunk-${chunk.chunk_id}`;
    card.dataset.chunkId = chunk.chunk_id;

    const sign = chunk.contribution >= 0 ? '+' : '';
    const formattedContrib = `${sign}${chunk.contribution.toFixed(4)}`;

    card.innerHTML = `
      <div class="chunk-card-header">
        <div class="chunk-card-title">
          <span>Rank #${chunk.rank}</span>
          <span class="role-badge ${isSupp ? 'role-supp' : 'role-opp'}">${chunk.role}</span>
        </div>
        <div class="chunk-contrib-val ${isSupp ? 'val-supp' : 'val-opp'}">
          Delta P: ${formattedContrib}
        </div>
      </div>
      <div class="chunk-meta">
        Paragraph ${chunk.paragraph_num} | ${chunk.word_count} words | Chars: ${chunk.start_char}-${chunk.end_char}
      </div>
      <div class="chunk-preview-text">
        "${escapeHtml(chunk.text_preview)}"
      </div>
    `;

    card.addEventListener('click', () => {
      highlightChunk(chunk.chunk_id);
    });

    chunkList.appendChild(card);
  });
}

function highlightChunk(chunkId) {
  selectedChunkId = chunkId;

  document.querySelectorAll('.doc-paragraph').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.chunk-card').forEach(el => el.classList.remove('active'));

  const docEl = document.getElementById(`doc-chunk-${chunkId}`);
  if (docEl) {
    docEl.classList.add('selected');
    docEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const cardEl = document.getElementById(`card-chunk-${chunkId}`);
  if (cardEl) {
    cardEl.classList.add('active');
    cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  viewerBadge.textContent = `Active: Passage [ID: ${chunkId}]`;
}

function renderTopKTable(topKList) {
  topKTableBody.innerHTML = '';
  if (!topKList || topKList.length === 0) {
    topKTableBody.innerHTML = '<tr><td colspan="6">No Top-K results available.</td></tr>';
    return;
  }

  topKList.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>Top ${row.k}</strong> (${row.actual_k} chunks)</td>
      <td><code>${row.removed_chunks}</code></td>
      <td>${row.remaining_prob.toFixed(4)}</td>
      <td><strong>${row.cumulative_drop.toFixed(4)}</strong></td>
      <td>${row.predicted_class} (${(row.confidence * 100).toFixed(1)}%)</td>
      <td>
        <span class="${row.class_flipped ? 'badge-flip' : 'badge-noflip'}">
          ${row.class_flipped ? 'YES (FLIPPED)' : 'NO'}
        </span>
      </td>
    `;
    topKTableBody.appendChild(tr);
  });
}

function renderRandomStats(rb) {
  if (!rb) return;
  statTop1Drop.textContent = rb.top1_influential_drop.toFixed(5);
  statMeanRandom.textContent = rb.mean_random_drop.toFixed(5);
  statSdRandom.textContent = rb.sd_random_drop.toFixed(5);
  statZScore.textContent = `${rb.z_score.toFixed(2)} σ`;
  statPValue.textContent = rb.empirical_p_value.toFixed(4);
}

function renderCounterfactual(cf) {
  if (!cf) return;
  if (cf.counterfactual_found) {
    cfStatus.textContent = 'Minimal Counterfactual Inversion Discovered';
    cfStatus.className = 'cf-status text-danger';
    const combo = Array.isArray(cf.minimal_chunk_combination)
      ? cf.minimal_chunk_combination.join(', ')
      : cf.minimal_chunk_combination;
    cfDetails.innerHTML = `
      Removing chunk(s) <strong>[${combo}]</strong> (${cf.combination_size} passage(s))
      flips model prediction from <strong>${cf.original_class}</strong> (P=${cf.original_prob.toFixed(4)})
      to <strong>${cf.counterfactual_class}</strong> (P=${cf.counterfactual_prob.toFixed(4)}).<br>
      Combinatorial Search Budget: ${cf.search_budget} | Evaluations Used: ${cf.evaluations_used}.
    `;
  } else {
    cfStatus.textContent = 'No Class Inversion Found within Budget';
    cfStatus.className = 'cf-status text-success';
    cfDetails.textContent = `The prediction remained stable across all tested chunk combinations within the search budget of ${cf.search_budget} evaluations.`;
  }

  if (cf.caveat) {
    cfCaveatText.textContent = cf.caveat;
  }
}

function updatePlots(plots) {
  if (!plots) return;
  chartChunkRanking.src = plots.chunk_ranking;
  chartProbChanges.src = plots.probability_changes;
  chartPosNeg.src = plots.pos_neg_contributions;
  chartOriginalPerturbed.src = plots.original_vs_perturbed;
  chartRandomInfluential.src = plots.random_vs_influential;
}

function setLoading(loading) {
  if (loading) {
    runExplainBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    btnText.textContent = 'Computing Explainability in R...';
  } else {
    runExplainBtn.disabled = false;
    btnSpinner.classList.add('hidden');
    btnText.textContent = 'Analyze & Explain';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.addEventListener('DOMContentLoaded', init);
