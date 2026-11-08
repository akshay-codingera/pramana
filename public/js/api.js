/**
 * PRAMANA — Backend API Client (Milestone 7 & 8)
 * Connects frontend directly to the authentic Node.js + R/PyTorch backend.
 */

export const apiClient = {
  /**
   * Run unseen document prediction through the actual R/PyTorch pipeline
   * @param {FormData} formData - multipart containing 'document' or 'raw_text'
   */
  async predictUnseen(formData) {
    const res = await fetch('/api/predict-unseen', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Server error ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Submit blind ground-truth evaluation
   * @param {string} experimentId
   * @param {string} groundTruth - "ALLOWED" or "DISMISSED"
   */
  async recordGroundTruth(experimentId, groundTruth) {
    const res = await fetch('/api/ground_truth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experiment_id: experimentId,
        ground_truth: groundTruth
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Server error ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Fetch historical cases list from the 77-year corpus
   */
  async fetchCases() {
    const res = await fetch('/api/cases');
    if (!res.ok) throw new Error(`Failed to load historical cases (HTTP ${res.status})`);
    return await res.json();
  },

  /**
   * Fetch experiment registry ledger and evaluation summary
   */
  async fetchExperiments() {
    const res = await fetch('/api/experiments');
    if (!res.ok) throw new Error(`Failed to load experiment registry (HTTP ${res.status})`);
    return await res.json();
  },

  /**
   * Construct URL for generated R explanation plots
   * @param {string} plotName - e.g. "chunk_ranking.png"
   */
  getPlotUrl(plotName) {
    return `/api/plots/${plotName}?t=${Date.now()}`;
  }
};
