/**
 * PRAMANA — Research Workspace, Document Ingestion & LOCO Analytics (Milestones 6, 7, 8)
 * Connects Kathghara 1 & 2 drawers, executes real model inference, displays LOCO cards,
 * manages the blind ground-truth feedback loop, and drives the 77-year historical analytics suite.
 */

import { apiClient } from './api.js';
import { judgeGavel } from './scene_judge_gavel.js';
import { cinematicDirector } from './cinematic_director.js';

class WorkspaceManager {
  constructor() {
    this.currentFile = null;
    this.lastPrediction = null;
    this.historicalCases = [];
    this.selectedCase = null;
    this.experimentsList = [];
  }

  init() {
    this.bindKathghara1Events();
    this.bindKathghara2Events();
    this.bindWorkspaceNavEvents();
    this.loadInitialData();
    console.log('[Workspace] Research workspace initialized.');
  }

  // =========================================================================
  // KATHGHARA 1 — CASE DETAILS & FACTS
  // =========================================================================
  bindKathghara1Events() {
    const closeBtn = document.getElementById('btnCloseDrawer1');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => cinematicDirector.closeDrawers());
    }

    const loadSampleBtn = document.getElementById('btnLoadSampleCase');
    if (loadSampleBtn) {
      loadSampleBtn.addEventListener('click', () => {
        if (this.historicalCases.length > 0) {
          this.populateCaseDetails(this.historicalCases[0]);
        }
      });
    }
  }

  populateCaseDetails(caseData) {
    document.getElementById('caseTitleInput').value = caseData.title || '';
    document.getElementById('casePetitionerInput').value = caseData.petitioner || 'Appellant';
    document.getElementById('caseRespondentInput').value = caseData.respondent || 'State of Rajasthan & Anr.';
    document.getElementById('caseCitationInput').value = caseData.citation || '[2026 INSC 1190]';
    document.getElementById('caseYearInput').value = caseData.year || '2026';
    document.getElementById('caseLegalIssueInput').value = caseData.legal_issue || 'Whether abetment under Section 306 IPC requires direct instigation or proximate mens rea.';
    document.getElementById('caseFactsInput').value = caseData.facts || 'Appeal challenging High Court judgment affirming conviction under Section 306 IPC for alleged abetment of suicide without active proximate inducement.';
  }

  // =========================================================================
  // KATHGHARA 2 — DOCUMENT SUBMISSION & OUTCOME PREDICTION
  // =========================================================================
  bindKathghara2Events() {
    const closeBtn = document.getElementById('btnCloseDrawer2');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => cinematicDirector.closeDrawers());
    }

    // Tab switching inside Kathghara 2 (Upload File vs Paste Text)
    const tabFile = document.getElementById('subTabFile');
    const tabText = document.getElementById('subTabText');
    const panelFile = document.getElementById('panelUploadFile');
    const panelText = document.getElementById('panelUploadText');

    if (tabFile && tabText && panelFile && panelText) {
      tabFile.addEventListener('click', () => {
        tabFile.classList.add('active');
        tabText.classList.remove('active');
        panelFile.classList.remove('hidden');
        panelText.classList.add('hidden');
      });
      tabText.addEventListener('click', () => {
        tabText.classList.add('active');
        tabFile.classList.remove('active');
        panelText.classList.remove('hidden');
        panelFile.classList.add('hidden');
      });
    }

    // Drag and Drop File Upload
    const dropzone = document.getElementById('dropzoneDocument');
    const fileInput = document.getElementById('fileInputDocument');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelected(e.dataTransfer.files[0]);
        }
      });
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          this.handleFileSelected(fileInput.files[0]);
        }
      });
    }

    // Execute Prediction Button
    const runBtn = document.getElementById('btnRunPrediction');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.executePrediction());
    }

    // Blind Ground-Truth Submission
    const submitGtBtn = document.getElementById('btnSubmitGroundTruth');
    if (submitGtBtn) {
      submitGtBtn.addEventListener('click', () => this.submitGroundTruth());
    }

    // Drawer Backdrop click to dismiss
    const backdrop = document.getElementById('drawerBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => cinematicDirector.closeDrawers());
    }
  }

  handleFileSelected(file) {
    this.currentFile = file;
    const nameEl = document.getElementById('selectedFileName');
    const sizeEl = document.getElementById('selectedFileSize');
    const infoBox = document.getElementById('selectedFileInfo');

    if (nameEl && sizeEl && infoBox) {
      nameEl.textContent = file.name;
      sizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      infoBox.classList.remove('hidden');
    }
  }

  async executePrediction() {
    const runBtn = document.getElementById('btnRunPrediction');
    const progressBox = document.getElementById('predictionProgressBox');
    const statusText = document.getElementById('predictionStatusText');
    const resultsContainer = document.getElementById('predictionResultsContainer');
    const errorBox = document.getElementById('predictionErrorBox');

    if (errorBox) errorBox.classList.add('hidden');
    if (resultsContainer) resultsContainer.classList.add('hidden');

    const rawTextInput = document.getElementById('rawTextInput');
    const isTextMode = document.getElementById('subTabText').classList.contains('active');

    const formData = new FormData();

    if (isTextMode) {
      const text = rawTextInput.value.trim();
      if (!text) {
        this.showError('Please enter judgment text to analyze.');
        return;
      }
      formData.append('raw_text', text);
    } else {
      if (!this.currentFile) {
        this.showError('Please select a PDF, DOCX, or TXT judgment file.');
        return;
      }
      formData.append('document', this.currentFile);
    }

    // UI Loading state
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = '⏳ Computing Hierarchical Inference...';
    }
    if (progressBox) progressBox.classList.remove('hidden');
    if (statusText) statusText.textContent = 'Preprocessing document & verifying cryptographic hashes...';

    try {
      if (statusText) statusText.textContent = 'Executing Hierarchical BiGRU + Additive Attention forward pass...';
      const result = await apiClient.predictUnseen(formData);

      this.lastPrediction = result;

      // Strike gavel with realistic sound upon conclusion!
      judgeGavel.strikeGavel();

      // Render Results
      this.renderPredictionResults(result);

      if (progressBox) progressBox.classList.add('hidden');
      if (resultsContainer) resultsContainer.classList.remove('hidden');

      // Refresh experiment registry in background
      this.loadExperimentsLedger();
    } catch (err) {
      console.error('[Prediction] Error:', err);
      this.showError(err.message || 'Prediction engine error');
    } finally {
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.innerHTML = '⚖️ Run Hierarchical Prediction';
      }
      if (progressBox) progressBox.classList.add('hidden');
    }
  }

  renderPredictionResults(data) {
    const isAllowed = data.predicted_outcome === 'ALLOWED';

    // Outcome Badge
    const badge = document.getElementById('resultVerdictBadge');
    if (badge) {
      badge.textContent = data.predicted_outcome;
      badge.className = `verdict-badge-large ${isAllowed ? 'allowed' : 'dismissed'}`;
    }

    // Probabilities
    const pAllowedPct = (data.prob_allowed * 100).toFixed(2);
    const pDismissedPct = (data.prob_dismissed * 100).toFixed(2);

    document.getElementById('valProbAllowed').textContent = `${pAllowedPct}%`;
    document.getElementById('barProbAllowed').style.width = `${pAllowedPct}%`;

    document.getElementById('valProbDismissed').textContent = `${pDismissedPct}%`;
    document.getElementById('barProbDismissed').style.width = `${pDismissedPct}%`;

    // Confidence
    const confVal = ((data.confidence || 0) * 100).toFixed(1);
    document.getElementById('valConfidenceMargin').textContent = `${confVal}%`;

    // Cryptographic Hashes & Pre-Decision Masking status
    document.getElementById('valExpId').textContent = data.experiment_id || 'N/A';
    document.getElementById('valFileHash').textContent = (data.file_hash || '').substring(0, 16) + '...';
    document.getElementById('valTextHash').textContent = (data.text_hash || '').substring(0, 16) + '...';
    document.getElementById('valMaskingStatus').textContent = data.indicators_count > 0 
      ? `Masked (${data.indicators_count} verdict indicators removed)`
      : 'Clean (No explicit verdict indicators found)';

    // LOCO Top Influential Passages
    const passagesList = document.getElementById('locoPassagesList');
    if (passagesList) {
      passagesList.innerHTML = '';
      const top = data.top_passages || [];

      if (top.length === 0) {
        passagesList.innerHTML = '<p class="text-muted text-center">No influential passages extracted.</p>';
      } else {
        top.slice(0, 6).forEach((p, idx) => {
          const card = document.createElement('div');
          const isSupporting = (p.direction || '').toUpperCase() === 'SUPPORTING';
          card.className = `loco-passage-card ${isSupporting ? 'supporting' : 'opposing'}`;
          
          const deltaSign = p.delta_probability > 0 ? `+${p.delta_probability.toFixed(4)}` : p.delta_probability.toFixed(4);

          card.innerHTML = `
            <div class="loco-card-header">
              <span class="mono-metric" style="color: #94a3b8;">Chunk #${p.paragraph_num || (idx + 1)}</span>
              <span class="loco-delta-tag ${isSupporting ? 'supporting' : 'opposing'}">ΔP: ${deltaSign}</span>
            </div>
            <div class="loco-passage-text">"${(p.preview || p.verbatim_text || '').substring(0, 150)}..."</div>
          `;
          passagesList.appendChild(card);
        });
      }
    }

    // Reset Ground Truth Form
    document.getElementById('gtSelectOutcome').value = '';
    const gtStatus = document.getElementById('gtSubmissionStatus');
    if (gtStatus) gtStatus.textContent = '';
  }

  async submitGroundTruth() {
    if (!this.lastPrediction || !this.lastPrediction.experiment_id) {
      alert('Please run a prediction first before submitting ground truth.');
      return;
    }

    const outcome = document.getElementById('gtSelectOutcome').value;
    if (!outcome) {
      alert('Please select either ALLOWED or DISMISSED as the authentic verified outcome.');
      return;
    }

    const statusEl = document.getElementById('gtSubmissionStatus');
    const submitBtn = document.getElementById('btnSubmitGroundTruth');

    submitBtn.disabled = true;
    statusEl.textContent = 'Persisting blind ground-truth evaluation...';

    try {
      const res = await apiClient.recordGroundTruth(this.lastPrediction.experiment_id, outcome);
      const isMatch = res.updated_experiment ? res.updated_experiment.is_correct : res.is_correct;
      statusEl.innerHTML = `<span style="color: ${isMatch ? '#10b981' : '#ef4444'}; font-weight: 600;">
        Recorded: Actual [${outcome}] vs Predicted [${this.lastPrediction.predicted_outcome}] (${isMatch ? 'MATCH ✓' : 'MISMATCH ✗'})
      </span>`;
      // Reload registry ledger
      this.loadExperimentsLedger();
    } catch (e) {
      statusEl.textContent = `Error: ${e.message}`;
    } finally {
      submitBtn.disabled = false;
    }
  }

  showError(msg) {
    const errorBox = document.getElementById('predictionErrorBox');
    if (errorBox) {
      errorBox.textContent = `⚠️ ${msg}`;
      errorBox.classList.remove('hidden');
    }
  }

  // =========================================================================
  // RESEARCH WORKSPACE NAVIGATION & DATA TABS
  // =========================================================================
  bindWorkspaceNavEvents() {
    // Open Research Workspace Button (from Courtroom HUD)
    const openWsBtn = document.getElementById('btnEnterResearchWorkspace');
    if (openWsBtn) {
      openWsBtn.addEventListener('click', () => this.openResearchWorkspace());
    }

    // Back to Courtroom Button (from Research Workspace header)
    const backBtn = document.getElementById('btnBackToCourtroom');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.closeResearchWorkspace());
    }

    // Workspace Nav Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        this.switchWorkspaceTab(targetTab);
      });
    });

    // Case Explorer Search Input
    const searchInput = document.getElementById('caseSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterCasesList(e.target.value);
      });
    }
  }

  openResearchWorkspace() {
    const ws = document.getElementById('researchWorkspace');
    if (ws) {
      ws.classList.remove('visually-hidden');
      ws.classList.add('interactive');
    }
    // Refresh plots and experiments
    this.loadExplainabilityPlots();
    this.loadExperimentsLedger();
  }

  closeResearchWorkspace() {
    const ws = document.getElementById('researchWorkspace');
    if (ws) {
      ws.classList.add('visually-hidden');
      ws.classList.remove('interactive');
    }
  }

  switchWorkspaceTab(tabId) {
    document.querySelectorAll('.nav-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });

    if (tabId === 'tabExplainability') {
      this.loadExplainabilityPlots();
    } else if (tabId === 'tabRegistry') {
      this.loadExperimentsLedger();
    }
  }

  async loadInitialData() {
    try {
      const casesData = await apiClient.fetchCases();
      this.historicalCases = Array.isArray(casesData) ? casesData : (casesData.cases || []);
      this.renderCasesList(this.historicalCases);

      if (this.historicalCases.length > 0) {
        this.selectCase(this.historicalCases[0]);
      }
    } catch (e) {
      console.warn('[Workspace] Could not preload historical cases:', e);
    }
  }

  renderCasesList(cases) {
    const listEl = document.getElementById('historicalCasesList');
    if (!listEl) return;
    listEl.innerHTML = '';

    cases.forEach(c => {
      const item = document.createElement('div');
      item.className = 'case-item';
      item.setAttribute('data-id', c.id);

      const outcome = c.true_label || c.outcome || 'N/A';
      const isAllowed = outcome.toUpperCase() === 'ALLOWED';
      const title = c.case_title || c.title || c.id;

      item.innerHTML = `
        <div class="case-item-title">${title}</div>
        <div class="case-item-meta">
          <span>Year: ${c.year || 'N/A'}</span>
          <span class="badge ${isAllowed ? 'badge-allowed' : 'badge-dismissed'}">${outcome}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        document.querySelectorAll('.case-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        this.selectCase(c);
      });

      listEl.appendChild(item);
    });
  }

  filterCasesList(query) {
    const q = query.toLowerCase().trim();
    const filtered = this.historicalCases.filter(c => {
      const title = (c.case_title || c.title || c.id || '').toLowerCase();
      const outcome = (c.true_label || c.outcome || '').toLowerCase();
      const year = (c.year || '').toString();
      return title.includes(q) || outcome.includes(q) || year.includes(q);
    });
    this.renderCasesList(filtered);
  }

  selectCase(caseData) {
    this.selectedCase = caseData;
    document.getElementById('readerCaseTitle').textContent = caseData.case_title || caseData.title || caseData.id;
    document.getElementById('readerCaseCitation').textContent = caseData.title || caseData.case_id || `Year: ${caseData.year}`;

    const outcome = caseData.true_label || caseData.outcome || 'N/A';
    const outcomeBadge = document.getElementById('readerCaseOutcomeBadge');
    if (outcomeBadge) {
      const isAllowed = outcome.toUpperCase() === 'ALLOWED';
      outcomeBadge.textContent = outcome;
      outcomeBadge.className = `badge ${isAllowed ? 'badge-allowed' : 'badge-dismissed'}`;
    }

    const readerBody = document.getElementById('readerCaseBody');
    if (readerBody) {
      const raw = caseData.preview || caseData.text || caseData.summary || 'Full judgment text loaded from the verified corpus archive.';
      readerBody.innerHTML = `<p>${raw.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }
  }

  loadExplainabilityPlots() {
    const plots = [
      { id: 'imgPlot1', name: 'chunk_ranking.png' },
      { id: 'imgPlot2', name: 'original_vs_perturbed.png' },
      { id: 'imgPlot3', name: 'pos_neg_contributions.png' },
      { id: 'imgPlot4', name: 'probability_changes.png' },
      { id: 'imgPlot5', name: 'random_vs_influential.png' }
    ];

    plots.forEach(p => {
      const img = document.getElementById(p.id);
      if (img) img.src = apiClient.getPlotUrl(p.name);
    });
  }

  async loadExperimentsLedger() {
    try {
      const res = await apiClient.fetchExperiments();
      const experiments = res.experiments || [];
      const summary = res.evaluation_summary || {};

      document.getElementById('statTotalExps').textContent = experiments.length;
      document.getElementById('statEvaluatedExps').textContent = summary.total_evaluated || 0;
      document.getElementById('statLedgerAccuracy').textContent = summary.accuracy 
        ? `${(summary.accuracy * 100).toFixed(1)}%` 
        : 'N/A';

      const tbody = document.getElementById('ledgerTableBody');
      if (tbody) {
        tbody.innerHTML = '';
        experiments.forEach(e => {
          const row = document.createElement('tr');
          const isMatch = e.is_correct === true;
          const isEvaluated = e.is_correct !== undefined && e.is_correct !== null && typeof e.is_correct === 'boolean';

          row.innerHTML = `
            <td class="mono-metric">${e.experiment_id || 'N/A'}</td>
            <td>${e.document_name || 'N/A'}</td>
            <td><span class="badge ${e.predicted_outcome === 'ALLOWED' ? 'badge-allowed' : 'badge-dismissed'}">${e.predicted_outcome || 'N/A'}</span></td>
            <td>${isEvaluated ? `<span class="badge ${e.ground_truth === 'ALLOWED' ? 'badge-allowed' : 'badge-dismissed'}">${e.ground_truth}</span>` : '<span class="text-muted">Pending</span>'}</td>
            <td>${isEvaluated ? `<span style="color: ${isMatch ? '#10b981' : '#ef4444'}; font-weight: 600;">${isMatch ? 'MATCH' : 'MISMATCH'}</span>` : '<span class="text-muted">—</span>'}</td>
            <td class="mono-metric" style="font-size: 11px;">${e.upload_timestamp || 'N/A'}</td>
          `;
          tbody.appendChild(row);
        });
      }
    } catch (err) {
      console.warn('[Workspace] Could not load experiment ledger:', err);
    }
  }
}

export const workspaceManager = new WorkspaceManager();
