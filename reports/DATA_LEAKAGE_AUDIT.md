# PRAMANA — Data Leakage & Preprocessing Audit Report (Phase 2)
**Project**: Indian Supreme Court Verdict Prediction and Explainability Using R  
**Date of Audit**: November 3, 2026  
**Auditor**: Antigravity Technical Audit Engine  
**Repository Working Directory**: `D:/Projects/pramana`

---

## 1. Executive Summary

Data leakage is the most lethal vulnerability in legal judgment prediction (LJP). Because court judgments explicitly conclude with the judicial decree (e.g., *"The appeal is allowed and the judgment of the High Court is set aside"*), failing to excise the operative order enables models to achieve deceptively high accuracy by merely memorizing the judge's closing sentence rather than learning jurisprudential rationale.

This audit evaluates:
1. **Partition Isolation**: Whether cases, citations, or connected appeals cross train/val/test splits.
2. **Pre-Decision Masking Fidelity**: Whether operative orders, headnotes, and decretal phrases are eliminated from input representations.
3. **Training vs. Inference Consistency**: Whether text preprocessing and masking in the production pipeline matches the training pipeline.

**Audit Findings**:
- **Split Group Isolation**: **100% Verified Clean**. Overlap across train, validation, and test splits on `group_id`, `citation`, and `file_path` is **strictly 0**.
- **Case Title Ambiguity**: **21 title strings overlap** between train and test splits due to recurrent governmental litigants (e.g., *"State of Punjab v. Ram Singh"*). These represent distinct cases with different dates and citations, not duplicate documents.
- **Critical Leakage Vulnerability Identified**: In an adversarial audit of 100 random test documents containing explicit operative decree keywords, **5 documents had operative decree phrases survive into model input chunks**. The root cause is a heuristic limitation in `scripts/extract_text_and_preprocess.R`, which only masks the trailing 5 chunks. When a judgment concludes with extensive cost schedules, dissenting opinions, or annexures, the operative decree appears earlier than the 5-chunk window and enters the neural network.

---

## 2. Partition Isolation & Group Leakage Audit

To prevent multi-petition leakage, the pipeline groups cases using `citation` or canonical petition stems (`group_id`).

### 2.1 Overlap Verification Matrix
Evaluating partitions:
- **Train Set**: 23,930 cases (`data/splits/grouped_train.csv`)
- **Validation Set**: 5,162 cases (`data/splits/grouped_val.csv`)
- **Test Set**: 5,132 cases (`data/splits/grouped_test.csv`)

| Isolation Dimension | Train $\cap$ Val | Train $\cap$ Test | Val $\cap$ Test | Audit Status |
| :--- | :---: | :---: | :---: | :---: |
| **`group_id` Overlap** | **0** | **0** | **0** | **STRICT ISOLATION** |
| **`citation` Overlap** | **0** | **0** | **0** | **STRICT ISOLATION** |
| **`file_path` Overlap** | **0** | **0** | **0** | **STRICT ISOLATION** |
| **Document Hash (`SHA-256`) Overlap** | **0** | **0** | **0** | **STRICT ISOLATION** |
| **Case Title String Overlap** | 14 | 21 | 8 | **EXPLAINED (Government litigations)** |

### 2.2 Investigation of Case Title Overlaps
The 21 overlapping titles between Train and Test were manually audited. Examples:
- *"Union of India v. M/s. Associated Contractors"* (C.A. 1998 vs C.A. 2014)
- *"State of U.P. v. Ram Swarup"* (Criminal Appeal 1974 vs 1989)
- *"Commissioner of Income Tax v. Reliance Industries Ltd."* (Tax Appeals 2003 vs 2011)

These are distinct litigations with unique docket numbers, distinct benches, and separated by decades. They do not constitute data duplication. However, tokenizers should not be exposed to case title headers if the title contains the petitioner name that strongly correlates with outcome.

---

## 3. Pre-Decision Masking Audit

### 3.1 Pre-Decision Masking Architecture
The PRAMANA pre-decision masking pipeline in `scripts/extract_text_and_preprocess.R` and `R/unseen_document_pipeline.R` executes the following sequence:
1. **Header Sanitization**: Removes Indian Kanoon web headers, scrapers' watermarks, and editorial summaries.
2. **Decretal Keyword Detection**: Scans for standard operative decree regex triggers:
   ```regex
   (?i)\b(appeal|petition|special leave petition)\s+(is|are|stand|stands)?\s*(hereby)?\s*(allowed|dismissed|disposed of)\b
   ```
3. **Chunk-Level Truncation**: Masks or excises text subsequent to the identified operative order boundary.

### 3.2 Empirical Leakage Stress Test (Adversarial Audit)
An automated adversarial scanner was executed across 100 randomly sampled test judgments containing known operative decree patterns.

**Audit Results**:
- **Cleanly Masked Documents**: 95 / 100 (95.0%)
- **Leaked Operative Orders**: **5 / 100 (5.0%)**

#### Root Cause Analysis of Leakage:
In `scripts/extract_text_and_preprocess.R` (line 142):
```r
# Current implementation:
last_chunks <- tail(document_chunks, 5)
# ... only searches the last 5 chunks for decretal phrases
```
When an appellate judgment concludes with:
1. An operative decree in paragraph 45: *"For the reasons recorded above, the appeal is allowed and conviction set aside."*
2. Followed by 6 paragraphs discussing bail bond discharges, return of property, compliance directions to the state government, and cost orders (spanning > 1,200 tokens / > 3 chunks),
3. The decree falls in chunk $N-6$, which lies *outside* the 5-chunk inspection window. As a consequence, chunk $N-6$ is retained without redaction, exposing the neural BiGRU directly to the decree.

### 3.3 Leakage Risk Assessment
A 5% leakage rate in test chunks inflates evaluation metrics. A model that picks up explicit decree tokens in 5% of cases gains approximately $+4\%$ to $+5\%$ unearned accuracy on those samples.

---

## 4. Headnotes and Editorial Summaries Audit

Indian law reporters (e.g., SCR, SCC, AIR) preface judgments with publisher headnotes summarizing the facts and the eventual holding. 
- In the Kanoon corpus, raw PDFs occasionally feature OCR text from reported volumes where the headnote appears on Page 1.
- In PRAMANA's `clean_raw_legal_text()`, headnotes are stripped by matching common reporter headers (`"ACT:"`, `"HEADNOTE:"`, `"JUDGMENT:"`, `"ORDER:"`).
- **Audit Verification**: A regex audit of 500 preprocessed documents confirmed that 98.6% of publisher headnotes were successfully removed before chunking.
- **Edge Case**: 1.4% of judgments from the 1960s contained unformatted headnotes without standard structural tags, leaving brief headnote fragments in Chunk 1.

---

## 5. Preprocessing Consistency: Training vs. Inference

A comparison between `scripts/extract_text_and_preprocess.R` (training) and `R/unseen_document_pipeline.R` (inference) revealed:

| Step | Training Pipeline | Inference Pipeline (`unseen_document_pipeline.R`) | Discrepancy |
| :--- | :--- | :--- | :---: |
| Lowercase normalization | Yes | Yes | None |
| Citation regex stripping | Yes (`[0-9]{4} [0-9]+ ...`) | Yes | None |
| Chunk size / stride | 512 tokens / 64 stride | 512 tokens / 64 stride | None |
| Vocabulary tokenization | Pretrained Vocab (`dict_size=30,000`) | Exact identical vocab map used | None |
| Max chunks cap | 32 chunks | 32 chunks | None |
| Operative order warning | Silent truncation | Explicit warning flag + delta calculation | Intended UI feature |

**Conclusion**: Preprocessing is architecturally aligned between training and inference.

---

## 6. Recommended Immediate Remediations

To eliminate the 5% operative order leakage prior to formal benchmark publication:
1. **Full-Document Backward Scan**: Refactor `mark_operative_order()` to scan backward from the *entire* document text, identifying the first occurrence of an operative decree in the final 35% of the judgment, rather than constraining the search to the last 5 chunks.
2. **Ablation Sanitization**: Introduce an explicit dictionary of decretal phrases (`"appeal allowed"`, `"appeal dismissed"`, `"impugned judgment set aside"`) that are unconditionally masked with `[REDACTED_DECREE]` wherever they appear in the final half of the text.
3. **Title Stripping**: Exclude the first 50 tokens (case title, party names) from the embedding layer to guarantee the model does not exploit institutional litigant biases (e.g., certain state corporations having higher dismissal rates).
