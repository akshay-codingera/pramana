# PRAMANA — CHAPTER 1: PROJECT HISTORY & RESEARCH TIMELINE
## Comprehensive Chronological Audit of Codebase Evolution and Experimental Milestones

**Repository Tracked**: `D:\Projects\pramana` (Original Research Core) and `D:\Projects\pramana-github` (Active Production)  
**Primary Language Stack**: R 4.6.1, Python 3.13 (via Reticulate), PyTorch 2.15.0+cpu, Node.js, Three.js  
**Tracking Period**: September 2026 – November 2026  

---

## 1. Research Genesis & Problem Definition

The **PRAMANA** (*Programmatic Reasoning, Attribution & Modeling of Appellate Narratives*) project was initiated to address an outstanding challenge in computational legal informatics: **predicting appellate outcomes and providing traceable legal rationales from full-length judicial opinions of the Supreme Court of India**.

While standard Natural Language Processing benchmarks evaluate short legal texts (e.g., statutory claims or bail applications), Indian Supreme Court opinions are characterized by:
- **Massive Document Length**: Average opinion exceeds 3,600 words; complex appellate and Constitutional Bench matters exceed 60,000 words.
- **Complex Rhetorical Structures**: Judgments synthesize lower court histories, extensive witness testimony, competing legal arguments, statutory interpretations, and precedential citations before arriving at an operative disposition.
- **The "Tail-End" Problem**: The actual holding (*Allowed* or *Dismissed*) is typically located in the final 1% of the text. Truncating to the initial 512 tokens (the default in BERT/RoBERTa architectures) discards over 90% of the substantive reasoning, while retaining the final paragraphs results in complete decretal label leakage.

To solve this, the research trajectory was split into discrete, traceable development phases.

---

## 2. Chronological Git Commit & Development Log

The Git version control history of the primary research repository (`D:\Projects\pramana`) provides a transparent, tamper-evident audit trail of development:

```
------------------------------------------------------------------------------------------------------------------------
Commit Hash   Date & Timestamp           Author / Role            Commit Title & Scope
------------------------------------------------------------------------------------------------------------------------
d7aec48       2026-09-14 15:41:00 +0530  Core Research Lead       Baseline commit: initial PRAMANA prototype with 
                                                                  explainability engine and web dashboard.
bf23861       2026-11-02 21:05:00 +0530  Data Infrastructure Eng  feat(dataset): complete 100% acquisition of English 
                                                                  Supreme Court archives (1950-2026), R preprocessing, 
                                                                  chronological splitting, TF-IDF model training.
78ea3c3       2026-11-02 23:40:00 +0530  Legal NLP Scientist      Milestone 1: Complete R dataset inspection, label 
                                                                  extraction, figures, and audit report.
c76d2db       2026-11-03 00:05:00 +0530  Software QA & Test Eng   Milestone 1: Add R data_loader, test suite, and R 
                                                                  Markdown inspection document.
8fb9d68       2026-11-03 00:25:00 +0530  Deep Learning Architect  Milestone 2: Hierarchical Chunking (BiGRU+Attention) & 
                                                                  Unseen Document Evaluation Pipeline.
6cd2bd2       2026-11-03 00:40:00 +0530  Senior ML Engineer       Full 77-Year Scaling Complete: 34,224 Extracted 
                                                                  Judgments, 23,930 Trained, 78.55% Test Accuracy.
------------------------------------------------------------------------------------------------------------------------
```

### Subsequent Architectural & Frontend Evolution (`D:\Projects\pramana-github`)
Following the validation of the core machine-learning model, deployment and visualization development migrated to `D:\Projects\pramana-github` under branch `feature/cinematic-3d-experience`:

```
------------------------------------------------------------------------------------------------------------------------
Commit Hash   Date & Timestamp           Commit Description
------------------------------------------------------------------------------------------------------------------------
7ef69f2       2026-11-03 02:55:00 +0530  Initial repository setup for production interface and 3D architectural engine.
5ecdc0c       2026-11-08 08:45:00 +0530  feat(repo): establish clean PRAMANA baseline for cinematic redesign.
b83cf6a       2026-11-08 10:55:00 +0530  feat(cinematic): implement full 3D Supreme Court platform with opening journey.
e2c8407       2026-11-09 10:35:00 +0530  feat(audit): visual refinements, institutional disclaimers, test runner.
2213ebf       2026-11-09 10:58:00 +0530  feat(earth): photorealistic NASA Blue Marble planetary rendering.
c66b515       2026-11-09 11:35:00 +0530  feat(exterior): reconstruct high-fidelity Supreme Court campus architecture.
e899b55       2026-11-09 13:25:00 +0530  feat(exterior): procedural PBR normal maps, fluted columns, dentil pediment.
7085b07       2026-11-09 13:30:00 +0530  fix(exterior): correct dome geometry with sandstone meridian ribs.
c7fd0aa       2026-11-09 14:05:00 +0530  feat: landscape realism and premium institutional UI design system.
2915dec       2026-11-09 14:26:00 +0530  fix(landscape): redesign driveway trees into tiered evergreen pines.
b5e8c9c       2026-11-09 19:35:00 +0530  feat(courtroom): photorealistic architectural reconstruction of grand chamber.
1282eae       2026-11-09 19:50:00 +0530  fix(emblem): zero-cache headers in server and verify upright state emblem.
------------------------------------------------------------------------------------------------------------------------
```

---

## 3. Detailed Phase-by-Phase Technical Evolution

### Phase 1: Prototype & Baseline Model (Sept 2026 – Commit `d7aec48`)
- **Objective**: Develop an initial proof-of-concept on a 25-case sample (`result/cases_25_labels.csv`, `result/cases_clean (1).csv`).
- **Implementation**: Formulated TF-IDF vectorization and Ridge Logistic Regression in R (`scripts/gen_25_cases.R`). Implemented the initial Leave-One-Chunk-Out (LOCO) occlusion algorithm (`engine/explainability.R`).
- **Outcome**: Established that passage masking induced measurable probability deltas, validating the feasibility of chunk-based explainability.

### Phase 2: Complete 77-Year Data Acquisition (Nov 2, 2026 – Commit `bf23861`)
- **Objective**: Ingest the complete public domain record of Indian Supreme Court decisions from AWS Open Data (`s3://indian-supreme-court-judgments/`).
- **Implementation**: Created automated, resumable PowerShell acquisition scripts (`scripts/download_dataset.ps1`, `scripts/download_missing_archives.ps1`). Downloaded 77 annual Parquet metadata tables and 77 English judgment TAR archives.
- **Verification**: Created `scripts/verify_downloads.ps1` and `scripts/analyze_s3_inventory.R` to validate checksums and file sizes against the S3 inventory manifest (`data/source/s3_tar_inventory.txt`).

### Phase 3: Metadata Cataloging & Grouped Splitting (Nov 2, 2026 – Commits `78ea3c3`, `c76d2db`)
- **Objective**: Reconcile raw metadata ($N = 43,578$), filter procedural non-merit orders, and implement leakage-free dataset splitting.
- **Implementation**: Developed `R/dataset_inspection.R`, `R/label_extraction.R`, and `R/dataset_splitting.R`. Mapped 18 granular disposition categories into binary targets (`ALLOWED` vs `DISMISSED`).
- **Critical Innovation**: Implemented `group_id` based on CNR, citation, and case headers. Identified that common judgments deciding connected appeals (5,181 petitions) must reside in the same partition to prevent cross-split leakage.
- **Splits Generated**: 
  - Train: 23,937 records (70%)
  - Validation: 5,163 records (15%)
  - Held-Out Test: 5,133 records (15%)
  - Total: 34,233 substantive cases.

### Phase 4: Neural Architecture & Scaling (Nov 3, 2026 – Commits `8fb9d68`, `6cd2bd2`)
- **Objective**: Implement and train a deep learning architecture capable of processing variable-length, multi-thousand-word legal narratives without truncation.
- **Implementation**: Authored `engine/hierarchical_nn.py` (PyTorch) and `R/hierarchical_model.R` (R Reticulate bridge). Partitioned documents into 512-token chunks with 64-token strides. Chunks were projected into dense 128-dimensional vectors, modeled via a Bidirectional GRU (hidden size 64 $\times 2 = 128$), and pooled using Additive Self-Attention.
- **Training**: Executed `scripts/train_hierarchical_model.R` across the full training partition ($N = 23,930$). Early stopping triggered at Epoch 5 (Validation Loss: 0.4491).
- **Test Performance**: Evaluated on $5,132$ independently held-out test judgments, achieving **78.55% Test Accuracy**, **0.7676 F1**, and **0.1439 Brier Score**.

### Phase 5: Adversarial Technical Audit (Nov 3, 2026)
- **Objective**: Conduct an independent, exhaustive audit of the entire pipeline to verify reproducibility, detect data leakage, and establish temporal validity.
- **Implementation**: Authored five dedicated audit scripts:
  - `scripts/audit_phase1_dataset.R`: Disk inventory and corruption verification.
  - `scripts/audit_phase2_3_leakage_and_reproducibility.R`: Cross-split isolation and model checkpoint re-evaluation.
  - `scripts/audit_phase4_unseen_pipeline.R`: End-to-end testing of unseen document upload across PDF, DOCX, and TXT.
  - `scripts/audit_phase5_temporal_split.R`: Longitudinal evaluation of class drift across decades.
- **Key Findings**: 
  - Verified model reproducibility on test set ($N=300$ stratified sample: **80.33% Accuracy**, within $\pm 1.78\%$ of reported 78.55%).
  - Detected a pre-decision masking vulnerability where operative decrees preceding lengthy cost orders escaped the tail-5 chunk scan in ~5% of cases.
  - Discovered strong temporal drift ($47.5\%$ Allowed in 1950–2015 vs. $68.6\%$ in 2021–2026).

---

## 4. Distinction Between Verified Work and Planned Extensions

To maintain uncompromising academic credibility, the project explicitly differentiates between verified, executable code and conceptual future extensions:

| Research Component | Current Status | Verification Artifact |
| :--- | :---: | :--- |
| **77-Year Text Ingestion (1950–2026)** | **COMPLETED** | 30,477 `.txt` files in `data/extracted_text/` (~285 MB). |
| **Grouped Citation Partitioning** | **COMPLETED** | `data/splits/grouped_*.csv`; zero group leakage verified. |
| **Hierarchical BiGRU + Attention Model** | **COMPLETED** | Saved weights `hierarchical_bigru_weights.pt` (SHA-256: `A70A70F2...`). |
| **Full Held-Out Evaluation ($N=5,133$)** | **COMPLETED** | Reported in `hierarchical_model_report.md` (78.55% Accuracy). |
| **Independent Audit Re-evaluation** | **COMPLETED** | Verified in `reports/audit_data/model_reproducibility_audit.csv` (80.33%). |
| **Unseen Document 13-Step Pipeline** | **COMPLETED** | Verified across PDF/DOCX/TXT; fixed `xml2` control-char crash. |
| **Full-Text Backward Masking Scan** | *RECOMMENDED (P0)* | Designed in audit; replaces tail-only search. |
| **Chronological Benchmark Retraining** | *RECOMMENDED (P0)* | Partition scheme defined (1950–2015 / 2016–2020 / 2021–2026). |
| **Extractive TextRank Summarization Baseline** | *PLANNED (P1)* | Conceptual architecture documented in Technical Audit Report. |
