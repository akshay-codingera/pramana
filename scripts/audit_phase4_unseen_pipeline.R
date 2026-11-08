# scripts/audit_phase4_unseen_pipeline.R
# Phase 4: Unseen-Document Pipeline Audit Across 3 Diverse Authentic Documents

suppressPackageStartupMessages({
  library(jsonlite)
  library(digest)
  library(stringr)
})

WORKSPACE <- "D:/Projects/pramana"
setwd(WORKSPACE)

source("R/unseen_document_pipeline.R")

cat("====================================================================\n")
cat("PHASE 4: UNSEEN DOCUMENT PIPELINE AUDIT\n")
cat("====================================================================\n\n")

test_docs <- list(
  list(
    type = "PDF",
    path = "data/raw_data/road_contract.pdf",
    true_label = "DISMISSED",
    desc = "Authentic Supreme Court Criminal Appeal PDF (2025 INSC 1153)"
  ),
  list(
    type = "DOCX",
    path = "data/raw_data/authentic_sc_2026.docx",
    true_label = "ALLOWED",
    desc = "Authentic Modern 2026 Supreme Court Judgment DOCX (2026 INSC 118)"
  ),
  list(
    type = "TXT",
    path = "data/raw_data/authentic_sc_appeal_disposition.txt",
    true_label = "ALLOWED",
    desc = "Authentic Modern 2026 Text Judgment with Operative Decrees"
  )
)

audit_registry <- "reports/audit_data/audit_unseen_registry.json"
if (file.exists(audit_registry)) unlink(audit_registry)

audit_results <- list()

for (i in seq_along(test_docs)) {
  td <- test_docs[[i]]
  cat(sprintf("\n--- TESTING DOCUMENT %d: %s (%s) ---\n", i, td$desc, td$type))
  
  # Step 1-4: File extraction
  t0 <- Sys.time()
  doc_text <- extract_document_text(td$path)
  extract_time <- as.numeric(difftime(Sys.time(), t0, units = "secs"))
  char_len <- nchar(doc_text)
  word_cnt <- length(unlist(strsplit(doc_text, "\\s+")))
  cat(sprintf("  Extraction: SUCCESS in %.2fs (Chars: %d | Words: %d)\n", extract_time, char_len, word_cnt))
  stopifnot(char_len > 500)
  
  # Step 5: SHA256 Hashing
  hashes <- generate_document_hashes(td$path, doc_text)
  cat(sprintf("  File SHA-256: %s\n", hashes$file_hash))
  cat(sprintf("  Text SHA-256: %s\n", hashes$text_hash))
  stopifnot(nchar(hashes$file_hash) == 64 && nchar(hashes$text_hash) == 64)
  
  # Step 6: Corpus Overlap Check
  presence <- check_dataset_presence(hashes$text_hash, doc_text)
  cat(sprintf("  Corpus Overlap Detected: %s (Match Type: %s)\n", presence$exists, presence$match_type))
  
  # Step 7: Verdict Indicator & Operative Order Audit
  indicators <- audit_verdict_indicators(doc_text)
  cat(sprintf("  Operative Decree Indicators Detected: %d\n", indicators$indicators_count))
  if (indicators$has_leakage) {
    cat(sprintf("  Sample Matched Marker: '%s' (Line %d)\n", 
                indicators$indicators[[1]]$matched_pattern, indicators$indicators[[1]]$line_number))
  }
  
  # Step 8-10: Chunking, Neural Inference & Probabilities
  t_infer_start <- Sys.time()
  pred_res <- predict_and_explain_unseen(doc_text, model_type = "hierarchical")
  infer_time <- as.numeric(difftime(Sys.time(), t_infer_start, units = "secs"))
  
  cat(sprintf("  Model Inferred: %s in %.2fs\n", pred_res$predicted_outcome, infer_time))
  cat(sprintf("    P(ALLOWED):   %.4f\n", pred_res$prob_allowed))
  cat(sprintf("    P(DISMISSED): %.4f\n", pred_res$prob_dismissed))
  cat(sprintf("    Confidence:   %.4f (%s)\n", pred_res$confidence, pred_res$confidence_justification))
  cat(sprintf("    Total Chunks: %d\n", pred_res$total_chunks))
  stopifnot(abs(pred_res$prob_allowed + pred_res$prob_dismissed - 1.0) < 1e-4)
  
  # Step 11: LOCO Explainability Check
  top1 <- pred_res$top_passages[[1]]
  cat(sprintf("  Top-1 Influential Passage: Paragraph %d (Delta P: %s%.4f | Role: %s)\n",
              top1$paragraph_num, ifelse(top1$delta_probability >= 0, "+", ""),
              top1$delta_probability, top1$direction))
  
  # Step 12: Immutable Record Persistence BEFORE Ground Truth
  exp_id <- paste0("AUDIT_EXP_", i, "_", substr(hashes$text_hash, 1, 8))
  record <- list(
    experiment_id = exp_id,
    document_name = basename(td$path),
    file_type = td$type,
    file_hash = hashes$file_hash,
    text_hash = hashes$text_hash,
    upload_timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
    model_type = pred_res$model_type,
    model_version = pred_res$model_version,
    dataset_version = pred_res$dataset_version,
    predicted_outcome = pred_res$predicted_outcome,
    prob_allowed = pred_res$prob_allowed,
    prob_dismissed = pred_res$prob_dismissed,
    confidence = pred_res$confidence,
    indicators_count = indicators$indicators_count,
    verdict_warnings = indicators$warning_message,
    top_passage_delta_p = top1$delta_probability,
    top_passage_direction = top1$direction,
    ground_truth = NULL,
    ground_truth_entered_at = NULL,
    is_correct = NULL
  )
  
  saved_id <- save_experiment_record(record, audit_registry)
  cat(sprintf("  Pre-GT Experiment Record Saved: %s (Verified ground_truth == NULL)\n", saved_id))
  
  # Step 13: Ground Truth Submission & Verification
  gt_res <- record_ground_truth(saved_id, td$true_label, audit_registry)
  is_corr <- gt_res$updated_experiment$is_correct
  cat(sprintf("  Ground Truth Recorded: Actual=%s | Predicted=%s -> Correct: %s\n",
              td$true_label, pred_res$predicted_outcome, is_corr))
  
  audit_results[[length(audit_results) + 1]] <- data.frame(
    Document_Type = td$type,
    File_Name = basename(td$path),
    Words = word_cnt,
    Chunks = pred_res$total_chunks,
    Detected_Indicators = indicators$indicators_count,
    Predicted_Label = pred_res$predicted_outcome,
    P_Allowed = round(pred_res$prob_allowed, 4),
    P_Dismissed = round(pred_res$prob_dismissed, 4),
    Confidence = round(pred_res$confidence, 4),
    Top1_Delta_P = round(top1$delta_probability, 4),
    Ground_Truth = td$true_label,
    Is_Correct = is_corr,
    stringsAsFactors = FALSE
  )
}

# Cumulative Evaluation Across Audit Test Set
all_audit_df <- do.call(rbind, audit_results)
write.csv(all_audit_df, "reports/audit_data/unseen_pipeline_audit_results.csv", row.names = FALSE)

cat("\n====================================================================\n")
cat("PHASE 4 AUDIT SUMMARY TABLE:\n")
cat("====================================================================\n")
print(all_audit_df)
cat("====================================================================\n")
