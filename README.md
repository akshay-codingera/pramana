# PRAMANA — Explainable Legal Outcome Prediction System

> **PRAMANA (प्रमाण)**: In Indian jurisprudence and epistemology, *Pramana* signifies the valid means of acquiring verified knowledge, evidentiary proof, and justified belief.

PRAMANA is an explainable legal judgment outcome prediction and attribution system developed in **R** with a PyTorch deep learning backend and an interactive web exploration interface. It predicts appellate outcomes of Supreme Court of India decisions from pre-decision text while providing local counterfactual explainability via **Leave-One-Chunk-Out (LOCO)** occlusion attribution.

---

## System Overview & Architecture

```
[Uploaded Court Document (PDF / DOCX / TXT)]
                  │
                  ▼
[Document Sanitization & Cryptographic Provenance]
  - Native extraction (pdftools / xml2 with control-character sanitization)
  - SHA-256 binary and text fingerprinting
  - Pre-decision masking (strips operative decretal orders & publisher headnotes)
                  │
                  ▼
[Hierarchical Chunk-Based Neural Network (HAN)]
  - Sliding window: 512-word overlapping chunks (64-token stride, up to 32 chunks)
  - Level 1: Word-level BiGRU (hidden=64x2=128) + Additive Attention -> 32 Chunk Vectors
  - Level 2: Document-level BiGRU (hidden=64x2=128) + Additive Attention -> Document Vector (128d)
  - Classifier MLP: Linear 128 -> 64 -> ReLU -> Dropout(0.3) -> Linear 64 -> 1 -> Sigmoid
                  │
                  ▼
[Outcome Prediction & Uncertainty Quantification]
  - Binary classification: ALLOWED (Positive) vs DISMISSED (Negative)
  - Calibrated confidence: Absolute distance from decision boundary (|P - 0.5| * 2)
                  │
                  ▼
[Explainability Engine: Leave-One-Chunk-Out (LOCO)]
  - Systematically removes each chunk c_i and computes marginal probability shift:
      Delta P(c_i) = P(predicted | D) - P(predicted | D \ {c_i})
  - Isolates decisive statutory, factual, and contractual passages
                  │
                  ▼
[Cryptographic Registry & Blind Ground-Truth Verification]
  - Immutable pre-ground-truth experiment logging
  - Post-prediction ground-truth entry and live cumulative confusion matrix tracking
```

---

## Verified Empirical Benchmarks

All metrics below are verified through independent re-evaluation runs documented in the repository audit reports:

### Full Held-Out Test Set Performance ($N = 5,132$ Judgments)

| Evaluation Metric | PRAMANA Hierarchical BiGRU | Empirical Majority Baseline | Improvement Margin ($\Delta$) |
| :--- | :---: | :---: | :---: |
| **Test Accuracy** | **78.55%** | 50.39% | **$+28.16\%$** |
| **Balanced Accuracy** | **78.61%** | 50.00% | **$+28.61\%$** |
| **F1 Score** | **0.7676** | 0.6701 | **$+0.0975$** |
| **Precision (`ALLOWED`)** | **84.52%** | 50.39% | **$+34.13\%$** |
| **Recall (`ALLOWED`)** | **70.30%** | 100.00% | *(Conservative gatekeeper)* |
| **Specificity (`DISMISSED`)** | **86.92%** | 0.00% | **$+86.92\%$** |
| **Negative Predictive Value (NPV)** | **74.24%** | N/A | High certainty in dismissals |
| **Brier Score (Calibration)** | **0.1439** | 0.2500 | **$-0.1061$** (Lower is better) |
| **Mean Inference Latency** | **171.89 ms / doc** | $< 1$ ms | Real-time CPU inference |

### Confusion Matrix Breakdown ($N = 5,132$)

```
                         Actual DISMISSED       Actual ALLOWED         Total
Predicted DISMISSED         2,213 (TN)              768 (FN)           2,981
Predicted ALLOWED             333 (FP)            1,818 (TP)           2,151
                         ────────────────       ────────────────
Total                       2,546                 2,586                5,132
```

### Explainability (LOCO) Significance ($Z = 11.20, p < 10^{-15}$)
- **Mean Top-1 Influential Chunk Shift**: $\mathbb{E}[\Delta P] = \mathbf{+0.0876}$ (8.76 percentage points).
- **Random Chunk Ablation Baseline**: $\mathbb{E}[\Delta P] = \mathbf{+0.0093}$.
- **Statistical Significance**: A two-sample hypothesis test yields $Z = 11.20$ ($p < 10^{-15}$), proving that the neural attention head reliably isolates decisive legal arguments rather than uniform textual noise.

---

## Dataset Provenance & Cohort Reconciliation

To prevent ambiguity, the official case numbers are reconciled as follows:

1. **Raw Scraped Corpus (77 Years, 1950–2026)**:
   - **43,578** total records across annual Parquet stores (**43,572** cataloged in annual index files).
   - Missing values for core legal identifiers (`case_id`, `citation`, `cnr`, `year`): **0.00%**.
2. **Procedural Exclusions**:
   - **7,287** non-merit procedural orders (withdrawn, transferred, settled, infructuous) + **2,058** unlabelled orders = **9,345** excluded cases.
3. **Substantive Binary Cohort**:
   - Exactly **34,233** substantive binary judgments (**17,238 ALLOWED [50.35%]** vs **16,995 DISMISSED [49.65%]**).
4. **Physical Files vs Case Count Discrepancy**:
   - Disk stores **30,477 `.txt` files** representing **29,795 unique judgment stems**.
   - The numerical difference is explained by **5,181 connected / batch appeals** decided jointly under a single master judgment order.
5. **Grouped Benchmark Partition (34,224 Cases)**:
   - Partitioned strictly by citation and petition group ID (zero cross-split leakage):
     - **Training Split (70%)**: 23,930 cases (12,049 Allowed / 11,881 Dismissed)
     - **Validation Split (15%)**: 5,162 cases (2,602 Allowed / 2,560 Dismissed)
     - **Held-Out Test Split (15%)**: 5,132 cases (2,586 Allowed / 2,546 Dismissed)
     - Total: $23,930 + 5,162 + 5,132 = \mathbf{34,224}$ cases.

### Scientific Integrity & Caveats
- **Random Grouped Split vs. Forward-Looking Forecasting**: The 78.55% test accuracy was established under a *random grouped split* (measuring in-era interpolation). In forward-looking judicial forecasting ($T_{\text{test}} > T_{\text{train}}$), contemporary judgments exhibit a higher allowance rate (68.55% in 2021–2026 vs. 47.53% in 1950–2015). See `reports/TEMPORAL_EVALUATION_PLAN.md` for the longitudinal benchmark plan.
- **LOCO Attribution vs Legal Precedent**: Leave-One-Chunk-Out measures *statistical classifier sensitivity* to text tokens, NOT judicial doctrine or legal *ratio decidendi*.

---

## Repository Directory Structure

```
PRAMANA/
├── R/                               # Core R pipeline modules
│   ├── hierarchical_model.R         # PyTorch model interface & forward pass
│   ├── unseen_document_pipeline.R   # Multi-format ingestion & blind evaluation
│   ├── data_loader.R                # Data ingestion & schema normalization
│   ├── dataset_splitting.R          # Grouped partition routines
│   └── label_extraction.R           # Legal outcome ontology mapping
│
├── engine/                          # Deep learning & explainability engine
│   ├── hierarchical_nn.py           # BiGRU + Additive Attention architecture (PyTorch)
│   ├── explainability.R             # Mathematical LOCO & counterfactual search
│   ├── pramana_cli.R                # JSON-RPC CLI bridge
│   ├── segmentation.R               # 512-token sliding window tokenizer
│   ├── plot_explanations.R          # Publication-grade chart generation
│   ├── model.R                      # TF-IDF linear baseline
│   └── models/                      # Trained model checkpoints (local / gitignored)
│       ├── hierarchical_bigru_weights.pt (PyTorch state_dict)
│       └── pramana_hierarchical_bundle.rds (R vocabulary bundle)
│
├── public/                          # Web interface (HTML5 / CSS3 / Vanilla JS)
│   ├── index.html                   # Dual-mode dashboard layout
│   ├── style.css                    # Professional legal styling
│   └── app.js                       # Real-time inference controller
│
├── server.js                        # Node.js HTTP API server
├── scripts/                         # Pipeline orchestration & audit scripts
├── tests/                           # Automated test suites
├── reports/                         # Technical audit reports & empirical tables
│   ├── PRAMANA_TECHNICAL_AUDIT.md   # Master technical audit
│   ├── DATASET_AUDIT.md             # Dataset inventory verification
│   ├── DATA_LEAKAGE_AUDIT.md        # Pre-decision masking audit
│   ├── MODEL_REPRODUCIBILITY.md     # Independent reproducibility report
│   ├── UNSEEN_PIPELINE_TEST_REPORT.md # Operational pipeline tests
│   └── TEMPORAL_EVALUATION_PLAN.md  # Longitudinal generalization plan
│
├── data/fixtures/                   # Authentic test fixtures (PDF, DOCX, TXT)
├── .env.example                     # Environment configuration template
├── .gitignore                       # Hardened Git exclusion rules
├── LICENSE                          # Apache 2.0 License
└── README.md
```

---

## Quick Start Guide

### 1. Prerequisites
- **R** ($\ge 4.0$, ucrt on Windows): `pdftools`, `stringr`, `dplyr`, `readr`, `purrr`, `fs`, `jsonlite`, `digest`, `xml2`, `reticulate`.
- **Python** ($\ge 3.10$): `torch` ($\ge 2.0$), `numpy`.
- **Node.js** ($\ge 18.0$): Built-in modules only (`http`, `fs`, `path`, `child_process`).

### 2. Configuration
Copy the configuration template to `.env`:
```bash
cp .env.example .env
```
Adjust `RSCRIPT_PATH` if R is not on your system `PATH`.

### 3. Launching the Web Interface
```bash
node server.js
```
Open **`http://localhost:3001`** (or configured `PORT`) in your browser.

### 4. Running Automated Tests
```bash
Rscript tests/test_unseen_pipeline.R
Rscript tests/test_explainability.R
```

---

## License
Distributed under the **Apache License 2.0**. See `LICENSE` for details.
