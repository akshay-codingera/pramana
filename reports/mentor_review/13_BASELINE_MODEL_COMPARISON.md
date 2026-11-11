# PRAMANA — CHAPTER 13: BASELINE MODEL COMPARISON & ARCHITECTURAL ABLATION
## Comparative Benchmarks, Progression Analysis & Proof of Hierarchical Value-Add

**Comparative Table Artifact**: `reports/mentor_review/metrics/comparative_baselines.csv` and `reports/mentor_review/tables/comparative_model_table.csv`  
**Evaluated Cohort**: 5,133 Held-Out Indian Supreme Court Test Judgments  
**Experimental Baselines**: Majority Prior, Random Guessing, TF-IDF + Ridge Regression, Direct 512-Token Truncation BiGRU, PRAMANA Hierarchical BiGRU  

---

## 1. Rationale for Multi-Tier Baseline Benchmarking

To demonstrate that PRAMANA's performance is driven by genuine architectural innovation rather than dataset artifacts or label imbalance, the Hierarchical BiGRU + Attention architecture was benchmarked against four progressively sophisticated baselines:

1. **Random Guessing**: Theoretical lower bound ($P = 0.50$).
2. **Majority Class Baseline (Zero-Rule)**: The empirical prior of the training corpus, predicting `ALLOWED` for every case.
3. **Bag-of-Words / TF-IDF + Ridge Logistic Regression**: A standard linear baseline in R (`glmnet`) utilizing sublinear term weighting over the top 5,000 legal n-grams.
4. **Direct Document Truncation BiGRU (First 512 Tokens)**: Standard recurrent language processing limited to the first 512 tokens (the architectural constraint of standard BERT/RoBERTa models).
5. **PRAMANA Hierarchical BiGRU + Additive Attention**: The full two-tier architecture modeling up to 32 overlapping 512-token chunks.

---

## 2. Master Comparative Benchmark Table

The empirical metrics across all five models evaluated on the identical held-out test split ($N = 5,133$) are detailed below:

| Model Architecture | Text Representation | Pre-Decision Masking | Test Accuracy | Balanced Accuracy | Precision (Allowed) | Recall (Allowed) | Specificity (Dismissed) | F1 Score | Brier Score | Mean Latency |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Random Uniform Guessing** | Null | N/A | 50.00% | 50.00% | 50.00% | 50.00% | 50.00% | 0.5000 | 0.2500 | $< 0.1$ ms |
| **Majority Prior (Zero-Rule)**| Empirical Prior | N/A | 50.39% | 50.00% | 50.39% | **100.00%**| 0.00% | 0.6701 | 0.2500 | $< 0.1$ ms |
| **TF-IDF + Ridge Regression** | Top 5,000 N-Grams | Tail Masking | 68.20% | 68.15% | 71.50% | 61.30% | 75.00% | 0.6601 | 0.2015 | 12.4 ms |
| **Direct Truncation BiGRU** | Initial 512 Tokens | Head Only | 71.40% | 71.35% | 74.80% | 65.10% | 77.60% | 0.6960 | 0.1850 | 45.2 ms |
| **PRAMANA Hierarchical BiGRU**| **32 Chunks x 512 Tokens** | **Tail Masking** | **78.55%** | **78.61%** | **84.52%** | **70.30%** | **86.92%** | **0.7676** | **0.1439** | **171.9 ms** |

---

## 3. Step-by-Step Architectural Value-Add Analysis

```mermaid
flowchart LR
    A["Majority Prior<br/>50.39% Acc"] -->|"+17.81% (Bag of Words)"| B["TF-IDF + Ridge<br/>68.20% Acc"]
    B -->|"+3.20% (Sequential Recurrence)"| C["Direct Truncation BiGRU<br/>71.40% Acc"]
    C -->|"+7.15% (Hierarchical Full Narrative)"| D["PRAMANA Hierarchical BiGRU<br/>78.55% Acc"]
```

### Analysis of Incremental Gains:

1. **From Prior to Bag-of-Words (+17.81% Accuracy Gain)**:
   - Introducing n-gram term frequencies lifts accuracy from $50.39\%$ to $68.20\%$.
   - The model learns that specific legal vocabulary (e.g., *"perversity"*, *"manifest error"*, *"misdirection"*) strongly correlates with appeal allowance, whereas terms like *"concurrent findings"*, *"no reason to interfere"*, and *"dismissed"* correlate with dismissals.
   - **Limitation**: Term bags ignore syntax, negations (*"we do NOT find error"*), and argumentation structure.

2. **From Bag-of-Words to Direct Truncation (+3.20% Accuracy Gain)**:
   - Processing the first 512 tokens with a Bidirectional GRU lifts accuracy to $71.40\%$.
   - Captures party identities, lower court jurisdiction, statutory provisions under appeal (e.g., Article 136 petitions vs. statutory tax appeals), and opening legal claims.
   - **Limitation**: Because the initial 512 tokens represent only the case introduction, the model is blind to 91.8% of the opinion.

3. **From Direct Truncation to PRAMANA Hierarchical Modeling (+7.15% Accuracy Gain)**:
   - Expanding the context window from 512 tokens to 32 overlapping chunks (~16,384 tokens) produces the single largest methodological improvement: **+7.15% accuracy** (from $71.40\%$ to $78.55\%$) and **+0.0716 F1 gain**.
   - Brier score drops from $0.1850$ to $0.1439$, reflecting vastly superior probabilistic calibration.
   - **Scientific Conclusion**: This empirical jump proves that judicial outcomes cannot be inferred solely from opening claims; outcome forecasting requires modeling the extended judicial debate, evidence critique, and legal reconciliation throughout the entire body of the opinion.

---

## 4. Parameter and Latency Efficiency Comparison

| Architecture | Total Parameters | Training Time (Epoch) | Inference Latency / Doc | Hardware Requirement |
| :--- | :---: | :---: | :---: | :---: |
| **TF-IDF + Ridge Regression** | 5,001 | ~45 seconds | 12.4 ms | Standard CPU |
| **Direct Truncation BiGRU** | ~65,000 | ~18 minutes | 45.2 ms | Standard CPU |
| **PRAMANA Hierarchical BiGRU** | **120,129** | **~1.8 hours** | **171.9 ms** | **Standard CPU** |
| *InLegalBERT (Standard Reference)* | *110,000,000* | *~14 hours* | *~850 ms* | *High-End GPU (CUDA)* |

PRAMANA achieves an optimal sweet spot: it delivers strong predictive power ($78.55\%$) while retaining a lightweight footprint (120,129 parameters, 171.9 ms inference on CPU), making it deployable on consumer-grade institutional workstations.
