/**
 * PRAMANA — Backend API Client (Milestone 7 & 8)
 * Connects frontend directly to the authentic Node.js + R/PyTorch backend.
 */

export const apiClient = {
  /**
   * Run unseen document prediction through the actual R/PyTorch pipeline
   * @param {FormData|object} payload - multipart containing 'document' or 'raw_text', or JSON object
   */
  async predictUnseen(payload) {
    let body;
    const headers = { 'Content-Type': 'application/json' };

    if (payload instanceof FormData) {
      const text = payload.get('raw_text');
      const doc = payload.get('document');
      if (text) {
        body = JSON.stringify({ text, model: 'hierarchical' });
      } else if (doc) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(doc);
        });
        body = JSON.stringify({ file_base64: base64, filename: doc.name, model: 'hierarchical' });
      } else {
        body = JSON.stringify({ text: '', model: 'hierarchical' });
      }
    } else {
      body = JSON.stringify(payload);
    }

    const res = await fetch('/api/upload_predict', {
      method: 'POST',
      headers,
      body
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
