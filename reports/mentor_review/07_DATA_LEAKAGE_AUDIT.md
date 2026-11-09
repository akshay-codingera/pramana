# PRAMANA — CHAPTER 7: DATA LEAKAGE & PREPROCESSING VULNERABILITY AUDIT
## Partition Isolation Verification, Tail-Masking Vulnerability Analysis & Adversarial Penetration Testing

**Audited Scripts**: `scripts/extract_text_and_preprocess.R`, `R/hierarchical_model.R`, `scripts/audit_phase2_3_leakage_and_reproducibility.R`  
**Audit Dimension**: Cross-Split Isolation, Decretal Word Survival & Lookahead Contamination  
**Key Audit Finding**: **5% Pre-Decision Masking Vulnerability Detected in Tail-Only Scanning**  

---

## 1. Scope & Objectives of the Adversarial Leakage Audit

In legal outcome prediction, **data leakage** is the single greatest threat to scientific validity. A model that appears to achieve high accuracy may simply be detecting:
1. **Cross-Partition Contamination**: Overlapping case texts or connected petitions present in both training and test sets.
2. **Decretal Outcome Tokens**: Operative holding phrases (e.g., *"appeal allowed"*, *"conviction set aside"*, *"petition dismissed"*) surviving preprocessing into model input embeddings.
3. **Publisher Headnotes**: Editorial summaries at the beginning of commercial law reports (e.g., SCR, AIR, SCC) that explicitly summarize the ruling before the judicial text begins.

Phase 2 of the PRAMANA audit subjected the pipeline to adversarial penetration testing to uncover any subtle leakage vectors.

---

## 2. Partition Isolation Audit: Zero Leakage Confirmed

As established in Chapter 6, PRAMANA groups all connected petitions sharing the same CNR, citation, or master order path under an immutable `group_id`.

```
========================================================================================
                       CROSS-PARTITION ISOLATION AUDIT SUMMARY
========================================================================================
Train Partition Group Count       : 23,405 Unique Groups (23,937 Records)
Validation Partition Group Count  :  5,047 Unique Groups (5,163 Records)
Test Partition Group Count        :  5,020 Unique Groups (5,133 Records)
----------------------------------------------------------------------------------------
group_id Intersection (Train ? Test)        : 0 Groups (Strictly 0.00%)
citation Intersection (Train ? Test)        : 0 Citations (Strictly 0.00%)
file_path Intersection (Train ? Test)       : 0 Files (Strictly 0.00%)
Regional Vernacular Inclusion in Test       : 0 Files (Excluded to separate directories)
========================================================================================
AUDIT VERDICT: PASS — Zero Cross-Partition Text or Group Contamination.
========================================================================================
```

---

## 3. Critical Discovery: The Tail-Masking Vulnerability (5% Leakage)

While cross-partition isolation was verified, the adversarial audit uncovered a significant algorithmic vulnerability in the **Pre-Decision Masking Engine**.

### 3.1 The Vulnerability Mechanism
In `scripts/extract_text_and_preprocess.R` (lines 142–148), pre-decision masking was implemented with the assumption that operative decrees always occur in the final paragraphs:
```r
# Look specifically at the last 5 chunks (tail of the judgment)
tail_indices <- seq(from = max(1, n_chunks - 4), to = n_chunks)
for (idx in tail_indices) {
  for (pat in disp_patterns) {
    if (grepl(pat, chunk_txt, ignore.case = TRUE, perl = TRUE)) {
      chunks_df$is_operative_order[idx] <- TRUE
      break
    }
  }
}
```

Similarly, in `R/hierarchical_model.R` (line 74):
```r
# Check only the final 3 chunks
if (k < nrow(df_chunks) - 2) return(FALSE)
```

### 3.2 How Decretal Orders Escaped Redaction
In Indian appellate practice, particularly in complex civil and criminal appeals, the Court often delivers its operative ruling and then adds extensive administrative directions:

```
Document Narrative Architecture (Example: 49 Paragraphs / 14 Chunks):
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ Chunk 1 to N-7   : Factual Background, High Court Findings, Statutory Analysis        │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ Chunk N-6 (Para 45): "For the reasons aforesaid, the appeal is allowed and conviction │
│                      is hereby set aside."                                            │
│                      [OPERATIVE HOLDING LOCATED HERE!]                                │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ Chunk N-5 (Para 46): Detailed directions on bail bond discharge and surety release.   │
│ Chunk N-4 (Para 47): Directions to State Government on prison medical facilities.     │
│ Chunk N-3 (Para 48): Mandatory registry directions regarding certified copy dispatch. │
│ Chunk N-2 (Para 49): Cost apportionments and litigation schedules.                    │
│ Chunk N-1 (Para 50): Formal signatures and presiding judge affirmations.              │
└───────────────────────────────────────────────────────────────────────────────────────┘
                                ▲
                                │ PRAMANA Tail-5 Window Checked Chunks N-4 to N:
                                └─► MISSED CHUNK N-6 COMPLETELY!
```

Because Chunks $N-4$ to $N$ were occupied by post-judgment administrative orders, the tail-window search concluded that no operative order was present in those trailing chunks. Consequently, **Chunk $N-6$ (which contained the explicit phrase *"appeal is allowed and conviction is hereby set aside"*) survived into the input chunk sequence fed into the BiGRU**.

---

## 4. Empirical Quantification of Decretal Survival

To measure the real-world impact of this vulnerability, `scripts/audit_phase2_3_leakage_and_reproducibility.R` executed an adversarial regex audit on **100 randomly sampled test judgments** known to contain substantive appellate decrees:

```
[Adversarial Leakage Audit: 100 Sampled Test Opinions]
----------------------------------------------------------------------------------------
Cleanly Masked Judgments (Decree in tail 5 chunks correctly redacted) : 95 Cases (95.0%)
Leaked Judgments (Decree located in Chunk N-5 or earlier)             :  5 Cases ( 5.0%)
----------------------------------------------------------------------------------------
```

### Breakdown of Leaked Cases
In all 5 leaked instances, the operative decree was followed by:
1. Extensive cost calculations under Supreme Court Rules (2 cases).
2. Institutional guidelines to High Courts / Subordinate Tribunals (2 cases).
3. Post-adjudication directions regarding custody transfer (1 case).

### Impact on Model Performance
When the BiGRU encounters an explicit phrase like `"appeal is allowed"`, its additive attention weights spike dramatically, assigning near-certain probability to class 1.
- We estimate that this 5% decretal survival inflated overall test accuracy by approximately **2.0% to 3.5%**.
- If full backward masking were applied across the entire text, the true non-leaked test accuracy would be approximately **75.0% to 76.5%** rather than 78.55%.

---

## 5. Remediation Plan: Full-Text Backward Masking (P0)

To resolve this vulnerability permanently in future versions of PRAMANA, the tail-window heuristic must be replaced with a **backward full-text regex anchor**:

```r
#' Remediation Algorithm: Full-Text Backward Scanning
remediated_pre_decision_masking <- function(chunks_df) {
  n <- nrow(chunks_df)
  if (n == 0) return(chunks_df)
  
  # Scan backwards from the final chunk to chunk 1
  cutoff_index <- n + 1
  for (idx in seq(n, 1, by = -1)) {
    chunk_txt <- chunks_df$text[idx]
    for (pat in disp_patterns) {
      if (grepl(pat, chunk_txt, ignore.case = TRUE, perl = TRUE)) {
        cutoff_index <- idx
        break
      }
    }
    if (cutoff_index <= n) break
  }
  
  # If a disposition boundary is found, redact that chunk AND all subsequent chunks
  if (cutoff_index <= n) {
    chunks_df$is_operative_order[cutoff_index:n] <- TRUE
  }
  return(chunks_df)
}
```

This ensures that whenever an operative decree is identified, it and every subsequent procedural, administrative, or cost paragraph is eliminated from the input embedding.

**Conclusion**: PRAMANA has zero cross-partition train-test data contamination, but exhibits a documented 5% tail-masking leakage vulnerability on judgments with extensive trailing orders. This finding is disclosed transparently in this dossier.
