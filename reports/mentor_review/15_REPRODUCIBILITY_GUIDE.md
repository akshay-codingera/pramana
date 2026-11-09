# PRAMANA — CHAPTER 15: COMPLETE SYSTEM REPRODUCIBILITY GUIDE
## End-to-End Environment Setup, Execution Commands, Model Verification & Inference Reproduction

**Workstation Environment**: Windows 11 / x86-64 / CPU Execution  
**Code Repositories**: `D:\Projects\pramana` (Research Engine) and `D:\Projects\pramana-github` (Production UI)  
**Trained Weights Fingerprint**: `A70A70F2827B3DC35CA38561F6051192458A4971EDA174C9E7AA904E1A90830D`  

---

## 1. System Prerequisites & Dependencies

To reproduce the findings, evaluation benchmarks, and user interface on a fresh workstation, ensure the following core tools are installed:

1. **R Language Runtime**: Version $\ge 4.6.0$ (Official CRAN release for Windows).
2. **Python Runtime**: Version $3.11$ to $3.13$ (64-bit).
3. **Node.js Runtime**: Version $\ge 20.0.0$ (LTS or Current).
4. **AWS Command Line Interface (CLI)**: For fetching public S3 archives.
5. **Git Version Control**: For cloning repository branches.

---

## 2. Environment Setup & Dependency Installation

### Step 2.1: Clone Repository
```powershell
# Clone production branch
git clone https://github.com/akshay-codingera/pramana.git D:\Projects\pramana-github
cd D:\Projects\pramana-github
git checkout feature/cinematic-3d-experience
```

### Step 2.2: Install Required R Packages
Launch R or run via Rscript:
```r
# scripts/install_r_pkgs.R
required_pkgs <- c("reticulate", "dplyr", "stringr", "stringi", "jsonlite", "pdftools", "xml2", "ggplot2", "glmnet")
new_pkgs <- required_pkgs[!(required_pkgs %in% installed.packages()[, "Package"])]
if (length(new_pkgs) > 0) {
  install.packages(new_pkgs, repos = "https://cloud.r-project.org")
}
```

### Step 2.3: Configure Python Reticulate Virtual Environment
```r
# Initialize Reticulate Python virtual environment
library(reticulate)
virtualenv_create("pramana_env", python = "python")
virtualenv_install("pramana_env", packages = c("torch==2.15.0+cpu", "numpy==2.5.4"), pip_options = "--extra-index-url https://download.pytorch.org/whl/cpu")
use_virtualenv("pramana_env", required = TRUE)
```

---

## 3. Dataset Acquisition & Verification

### Step 3.1: Download Public Metadata & Archives
```powershell
# Download complete 77-year Parquet partitions and English TAR archives from S3
Set-Location D:\Projects\pramana
.\scripts\download_dataset.ps1 -StartYear 1950 -EndYear 2026
```

### Step 3.2: Verify Checksums
```powershell
# Validate file sizes against S3 manifest
.\scripts\verify_downloads.ps1
```

---

## 4. Checkpoint Verification (Zero Retraining Requirement)

Before executing any evaluation, verify that the existing PyTorch model checkpoint matches the documented cryptographic hash:

```powershell
# In PowerShell:
Get-FileHash D:\Projects\pramana\engine\models\hierarchical_bigru_weights.pt -Algorithm SHA256

# Expected Output:
# Algorithm: SHA256
# Hash:      A70A70F2827B3DC35CA38561F6051192458A4971EDA174C9E7AA904E1A90830D
```

---

## 5. Independent Test Set Re-Evaluation

To reproduce the held-out test evaluation without retraining the model:

```powershell
# Execute the independent re-evaluation audit script
Set-Location D:\Projects\pramana
& "D:\Data_AI\01_Software\R\R-4.6.1\bin\x64\Rscript.exe" scripts/audit_phase2_3_leakage_and_reproducibility.R
```

### Expected Audit Output:
```
====================================================================
PRAMANA: INDEPENDENT RE-EVALUATION AUDIT
====================================================================
Evaluating on stratified held-out test cases (N = 300)...
Accuracy            : 80.33% (Expected: 78.55% +/- 2.5%)
Balanced Accuracy   : 79.86%
Precision (Allowed) : 82.26%
Recall (Allowed)    : 73.38%
Specificity (Dism)  : 86.34%
F1 Score            : 0.7757
Brier Score         : 0.1434
====================================================================
AUDIT RESULT: VERIFIED & REPRODUCED
====================================================================
```

---

## 6. Training From Scratch (Full Pipeline Reproduction)

If complete retraining from scratch is desired:

```powershell
# 1. Extract text and preprocess chunks across the entire 77-year corpus
& "D:\Data_AI\01_Software\R\R-4.6.1\bin\x64\Rscript.exe" scripts/extract_all_77_years.R --start-year 1950 --end-year 2026

# 2. Partition dataset into grouped splits
& "D:\Data_AI\01_Software\R\R-4.6.1\bin\x64\Rscript.exe" scripts/split_dataset.R

# 3. Train Hierarchical BiGRU + Additive Attention
& "D:\Data_AI\01_Software\R\R-4.6.1\bin\x64\Rscript.exe" scripts/train_hierarchical_model.R --epochs 7 --batch-size 32 --lr 0.001
```

---

## 7. Command-Line Inference on Unseen Filings

To evaluate a novel, unseen judgment PDF, DOCX, or TXT file from the terminal:

```powershell
# Execute CLI inference with LOCO attribution
& "D:\Data_AI\01_Software\R\R-4.6.1\bin\x64\Rscript.exe" engine/pramana_cli.R `
    --input "D:\Projects\pramana\tests\fixtures\road_contract.pdf" `
    --explain
```

### Sample Output:
```json
{
  "file": "road_contract.pdf",
  "predicted_verdict": "DISMISSED",
  "probability_allowed": 0.1845,
  "probability_dismissed": 0.8155,
  "confidence": 0.8155,
  "loco_attribution": [
    { "chunk_index": 12, "delta_p": -0.0921, "direction": "OPPOSING" },
    { "chunk_index": 8,  "delta_p": -0.0614, "direction": "OPPOSING" }
  ]
}
```

---

## 8. Web Dashboard & 3D Interactive Courtroom

To launch the integrated production environment:

```powershell
Set-Location D:\Projects\pramana-github
node server.js
```
Open web browser to `http://localhost:3001`. The interface automatically initializes the 3D Grand Judicial Chamber, connects to the local analytics endpoints, and enables drag-and-drop judgment document processing.
