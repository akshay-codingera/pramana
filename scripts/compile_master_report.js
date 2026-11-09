const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.resolve(__dirname, '..', 'reports', 'mentor_review');
const chapters = [
  '00_EXECUTIVE_SUMMARY.md',
  '01_PROJECT_HISTORY.md',
  '02_DATASET_PROVENANCE.md',
  '03_DATA_COLLECTION_REPORT.md',
  '04_DATA_CLEANING_REPORT.md',
  '05_TEXT_PREPROCESSING_REPORT.md',
  '06_TRAIN_VALIDATION_TEST_SPLITS.md',
  '07_DATA_LEAKAGE_AUDIT.md',
  '08_MODEL_ARCHITECTURE.md',
  '09_LOCAL_TRAINING_ENVIRONMENT.md',
  '10_DEEP_LEARNING_TRAINING_REPORT.md',
  '11_VALIDATION_RESULTS.md',
  '12_FINAL_TEST_RESULTS.md',
  '13_BASELINE_MODEL_COMPARISON.md',
  '14_LOCO_EXPLAINABILITY_REPORT.md',
  '15_REPRODUCIBILITY_GUIDE.md',
  '16_LIMITATIONS_AND_RESEARCH_CAVEATS.md'
];

let masterContent = `# PRAMANA — COMPLETE MODEL DEVELOPMENT, DEEP-LEARNING TRAINING & EXPERIMENTAL EVIDENCE DOSSIER
## Comprehensive Mentor Review Edition (Full 77-Year Indian Supreme Court Corpus: 1950–2026)

**Research Project**: PRAMANA (*Programmatic Reasoning, Attribution & Modeling of Appellate Narratives*)  
**Jurisdiction**: Supreme Court of India  
**Temporal Horizon**: 77 Years of Adjudication (January 26, 1950 to April 2026)  
**Host Workstation**: Local Institutional Research Environment (\`D:\\Projects\\pramana\`, \`D:\\Projects\\pramana-github\`)  
**Repository Branch**: \`feature/cinematic-3d-experience\`  
**Document Classification**: Comprehensive Technical Development & Audit Dossier  
**Supervisory Audience**: Academic Mentors, Senior Machine Learning Reviewers, Judicial Informatics Advisors  
**Publication Date**: November 9, 2026  

---

## Master Table of Contents

1. [Chapter 0: Executive Summary & Research Abstract](#00-executive-summary)
2. [Chapter 1: Research Project History & Development Timeline](#01-project-history)
3. [Chapter 2: Dataset Provenance, S3 Bucket Architecture & Public Archives](#02-dataset-provenance)
4. [Chapter 3: Batch Data Extraction & Text Yield Verification](#03-data-collection-report)
5. [Chapter 4: Data Cleaning Audit, Procedural Exclusions & Label Fidelity](#04-data-cleaning-report)
6. [Chapter 5: Long-Document Text Preprocessing & Pre-Decision Masking](#05-text-preprocessing-report)
7. [Chapter 6: Grouped Citation Partitioning & Cross-Split Balance](#06-train-validation-test-splits)
8. [Chapter 7: Data Leakage Audit & Tail-Masking Vulnerability Analysis](#07-data-leakage-audit)
9. [Chapter 8: Neural Model Architecture & Mathematical Formulations](#08-model-architecture)
10. [Chapter 9: Local Workstation Training Environment & Hardware Specifications](#09-local-training-environment)
11. [Chapter 10: Deep-Learning Training Dynamics, Convergence & Checkpoints](#10-deep-learning-training-report)
12. [Chapter 11: Validation Results, Decision Thresholds & Probability Calibration](#11-validation-results)
13. [Chapter 12: Held-Out Test Evaluation & Independent Audit Re-Evaluation](#12-final-test-results)
14. [Chapter 13: Baseline Model Comparisons & Architectural Value-Add](#13-baseline-model-comparison)
15. [Chapter 14: LOCO Explainability, Wilcoxon Significance ($Z = 11.20$) & Ratio Decidendi](#14-loco-explainability-report)
16. [Chapter 15: End-to-End System Reproducibility & CLI Execution Guide](#15-reproducibility-guide)
17. [Chapter 16: Scientific Limitations, Temporal Drift & Institutional Safeguards](#16-limitations-and-research-caveats)

---

`;

for (let i = 0; i < chapters.length; i++) {
  const fileName = chapters[i];
  const filePath = path.join(REPORT_DIR, fileName);
  console.log(`Compiling Chapter ${i}: ${fileName}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  masterContent += `\n\n<div style="page-break-before: always;"></div>\n\n`;
  masterContent += `<!-- START OF CHAPTER ${i}: ${fileName} -->\n\n`;
  masterContent += content;
  masterContent += `\n\n<!-- END OF CHAPTER ${i}: ${fileName} -->\n\n`;
  masterContent += `---\n`;
}

const outMasterPath = path.join(REPORT_DIR, 'PRAMANA_COMPLETE_MODEL_DEVELOPMENT_REPORT.md');
fs.writeFileSync(outMasterPath, masterContent, 'utf8');
console.log(`Successfully compiled Master Report: ${outMasterPath} (${(masterContent.length / 1024).toFixed(1)} KB)`);
