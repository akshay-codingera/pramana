# tests/test_unseen_pipeline.R
# Unit and integration test for the unseen document prediction and evaluation pipeline

source("R/unseen_document_pipeline.R")

cat("====================================================================\n")
cat("TESTING UNSEEN LEGAL DOCUMENT PIPELINE\n")
cat("====================================================================\n")

# 1. Test Text Extraction and Hashes on existing PDF fixture
test_pdf <- "data/raw_data/road_contract.pdf"
if (!file.exists(test_pdf)) {
  stop("Test PDF not found: ", test_pdf)
}

cat("Extracting text from authentic test PDF...\n")
extracted_text <- extract_document_text(test_pdf)
cat("Extracted character length:", nchar(extracted_text), "\n")
stopifnot(nchar(extracted_text) > 1000)

cat("Computing cryptographic hashes...\n")
hashes <- generate_document_hashes(test_pdf, extracted_text)
cat("File SHA-256:", hashes$file_hash, "\n")
cat("Text SHA-256:", hashes$text_hash, "\n")
stopifnot(nchar(hashes$text_hash) == 64)

# 2. Test Dataset Presence Check
cat("Checking dataset presence...\n")
pres <- check_dataset_presence(hashes$text_hash, extracted_text)
cat("Presence diagnosis:", pres$exists, "| Match type:", pres$match_type, "\n")

# 3. Test Verdict Indicator Audit
cat("Auditing verdict indicators & operative decrees...\n")
audit <- audit_verdict_indicators(extracted_text)
cat("Has outcome indicators:", audit$has_leakage, "\n")
cat("Warning message:", audit$warning_message, "\n")
if (audit$has_leakage) {
  cat("Sample detected indicator:", audit$indicators[[1]]$snippet, "\n")
}

# 4. Test Prediction & Explainability with Hierarchical Model
cat("Running Hierarchical BiGRU + Attention inference & LOCO...\n")
pred_res <- predict_and_explain_unseen(extracted_text, model_type = "hierarchical")
cat("Model Version:", pred_res$model_version, "\n")
cat("Predicted Outcome:", pred_res$predicted_outcome, "\n")
cat(sprintf("Prob(ALLOWED): %.4f | Prob(DISMISSED): %.4f\n", pred_res$prob_allowed, pred_res$prob_dismissed))
cat("Calibrated Confidence:", pred_res$confidence, "\n")
cat("Number of Chunks Processed:", pred_res$total_chunks, "\n")
cat("Top-1 Influential Passage delta P:", pred_res$top_passages[[1]]$delta_probability, "\n")
cat("Top-1 Direction:", pred_res$top_passages[[1]]$direction, "\n")

# 5. Test Experiment Record Persistence
cat("Creating experiment record...\n")
exp_id <- paste0("EXP_", format(Sys.time(), "%Y%m%d_%H%M%S"), "_", substr(hashes$text_hash, 1, 8))
record <- list(
  experiment_id = exp_id,
  document_name = basename(test_pdf),
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
  confidence_justification = pred_res$confidence_justification,
  verdict_warnings = audit$warning_message,
  top_passages = pred_res$top_passages,
  ground_truth = NULL,
  ground_truth_entered_at = NULL,
  evaluation = NULL
)

saved_id <- save_experiment_record(record, "result/test_unseen_registry.json")
cat("Saved experiment ID:", saved_id, "\n")
stopifnot(file.exists("result/test_unseen_registry.json"))

# 6. Test Ground Truth Submission & Evaluation
cat("Submitting Ground Truth verdict ('DISMISSED')...\n")
eval_res <- record_ground_truth(saved_id, "DISMISSED", "result/test_unseen_registry.json")
cat("Prediction Correct:", eval_res$updated_experiment$is_correct, "\n")
cat("Cumulative Accuracy:", eval_res$cumulative_evaluation$accuracy, "%\n")
cat("Confusion Matrix TP:", eval_res$cumulative_evaluation$confusion_matrix$true_positives,
    "| TN:", eval_res$cumulative_evaluation$confusion_matrix$true_negatives, "\n")

# Clean up test registry
unlink("result/test_unseen_registry.json")

cat("\n====================================================================\n")
cat("ALL UNSEEN DOCUMENT PIPELINE TESTS PASSED SUCCESSFULLY!\n")
cat("====================================================================\n")
