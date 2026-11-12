# ==============================================================================
# PRAMANA — Phase 1: Test Misclassification Inventory Generator
# Script: scripts/run_error_inventory_pipeline.R
# ==============================================================================

suppressPackageStartupMessages({
  library(data.table)
  library(reticulate)
  library(stringr)
  library(digest)
  library(jsonlite)
})

PROJECT_DIR <- "D:/Projects/pramana-github"
DATA_DIR    <- "D:/Projects/pramana"
OUT_DIR     <- file.path(PROJECT_DIR, "reports/model_optimization/error_analysis")

dir.create(OUT_DIR, recursive = TRUE, showWarnings = FALSE)
setwd(PROJECT_DIR)

source("R/data_loader.R")
source("R/hierarchical_model.R")

cat("====================================================================\n")
cat("PRAMANA PHASE 1: GENERATING ERROR & TEST INVENTORY\n")
cat("====================================================================\n\n")

# 1. Load Test Split
test_split_path <- file.path(DATA_DIR, "data/splits/grouped_test.csv")
if (!file.exists(test_split_path)) {
  stop("Test split not found at: ", test_split_path)
}
te <- fread(test_split_path)
cat(sprintf("Loaded test partition: %d rows\n", nrow(te)))

# 2. Load Model Bundle and PyTorch Weights
bundle_path <- file.path(PROJECT_DIR, "engine/models/pramana_hierarchical_bundle.rds")
bundle <- readRDS(bundle_path)

eval_model <- py_nn$create_hierarchical_model(
  chunk_input_dim = as.integer(bundle$input_dim),
  chunk_emb_dim = as.integer(128),
  rnn_hidden_dim = as.integer(64)
)
weights_abs <- file.path(PROJECT_DIR, "engine/models/hierarchical_bigru_weights.pt")
eval_model <- py_nn$load_model(eval_model, weights_abs)
cat("Loaded PRAMANA v1 Hierarchical BiGRU model weights.\n\n")

# 3. Iterate over all test cases
n_total <- nrow(te)
results_list <- vector("list", n_total)

cat(sprintf("Executing inference across all %d test cases...\n", n_total))
t0 <- Sys.time()

text_base_dir <- file.path(DATA_DIR, "data/processed/extracted_text")
pdf_base_dir  <- file.path(DATA_DIR, "data/extracted/english")

for (i in seq_len(n_total)) {
  row <- te[i, ]
  path_stem <- row[['path']]
  yr <- as.character(row[['year']])
  
  # Find text
  txt <- load_judgment_text(path_stem, yr, text_dir = text_base_dir)
  
  # Find PDF path
  pdf_cand <- file.path(pdf_base_dir, paste0("year=", yr), paste0(path_stem, ".pdf"))
  has_pdf <- file.exists(pdf_cand)
  source_pdf <- if (has_pdf) pdf_cand else file.path(pdf_base_dir, paste0("year=", yr), paste0(path_stem, ".pdf (archive)"))
  
  # Extraction status check
  if (is.na(txt) || nchar(str_trim(txt)) == 0) {
    status <- "MISSING_TEXT"
    chars <- 0
    words <- 0
    thash <- "NA"
    prob_allowed <- 0.5
    pred_label <- "DISMISSED"
    chunk_cnt <- 0
    raw_chunks <- 0
    usable <- FALSE
  } else if (nchar(str_trim(txt)) < 200) {
    status <- "INSUFFICIENT_TEXT"
    chars <- nchar(txt)
    words <- length(unlist(strsplit(txt, "\\s+")))
    thash <- digest(txt, algo = "sha256")
    prob_allowed <- 0.5
    pred_label <- "DISMISSED"
    chunk_cnt <- 0
    raw_chunks <- 0
    usable <- FALSE
  } else {
    chars <- nchar(txt)
    words <- length(unlist(strsplit(txt, "\\s+")))
    thash <- digest(txt, algo = "sha256")
    usable <- TRUE
    
    # Check for garbled characters
    non_ascii_ratio <- (nchar(txt) - nchar(gsub("[^\x20-\x7E\n\t]", "", txt))) / max(1, nchar(txt))
    status <- if (non_ascii_ratio > 0.05) "GARBLED_EXTRACTION" else "COMPLETE_TEXT"
    
    # Embed & Predict
    emb <- embed_document_chunks(txt, bundle$projector, max_chunks = 32)
    chunk_cnt <- nrow(emb$chunk_matrix)
    
    # Raw segmentation before 32-chunk cap
    raw_seg <- segment_judgment(txt)
    raw_chunks <- nrow(raw_seg$chunks)
    
    pred <- py_nn$predict_document(eval_model, np_array(emb$chunk_matrix, dtype = "float32"))
    prob_allowed <- pred$prob_allowed
    pred_label <- pred$predicted_label
  }
  
  act_label <- row[['target_label']]
  prob_dismissed <- 1.0 - prob_allowed
  margin <- abs(prob_allowed - 0.5) * 2.0
  is_correct <- (pred_label == act_label)
  
  results_list[[i]] <- list(
    record_id = i,
    document_id = if (!is.na(row[['case_id']]) && row[['case_id']] != "") row[['case_id']] else row[['title']],
    citation = if (!is.na(row[['citation']]) && row[['citation']] != "") row[['citation']] else "UNREPORTED",
    case_title = row[['title']],
    year = as.integer(yr),
    source_pdf_path = source_pdf,
    has_local_pdf = has_pdf,
    actual_label = act_label,
    predicted_label = pred_label,
    prob_allowed = round(prob_allowed, 6),
    prob_dismissed = round(prob_dismissed, 6),
    prediction_margin = round(margin, 6),
    is_correct = is_correct,
    extraction_status = status,
    doc_characters = chars,
    doc_words = words,
    text_hash = thash,
    chunk_count = chunk_cnt,
    raw_chunk_count = raw_chunks,
    is_truncated = (raw_chunks > 32),
    model_version = "PRAMANA-HBiGRU-v1.0",
    split_membership = "test",
    usable_in_eval = usable,
    disposal_nature = as.character(row[['disposal_nature']]),
    clean_outcome = as.character(row[['clean_outcome']])
  )
  
  if (i %% 500 == 0 || i == n_total) {
    cat(sprintf("  Processed %d / %d test cases...\n", i, n_total))
  }
}

t1 <- Sys.time()
cat(sprintf("Inference complete in %.2f seconds!\n\n", as.numeric(difftime(t1, t0, units = "secs"))))

# Convert to data.table
df_all <- rbindlist(results_list)

# Save master full test predictions
saveRDS(df_all, file.path(OUT_DIR, "all_test_predictions_raw.rds"))

# Filter to evaluated cohort (usable_in_eval == TRUE)
df_eval <- df_all[usable_in_eval == TRUE]
cat(sprintf("Evaluated Cohort Size: %d (Excluded unusable: %d)\n", nrow(df_eval), nrow(df_all) - nrow(df_eval)))

# Verification of confusion matrix
tp <- sum(df_eval$actual_label == "ALLOWED" & df_eval$predicted_label == "ALLOWED")
tn <- sum(df_eval$actual_label == "DISMISSED" & df_eval$predicted_label == "DISMISSED")
fp <- sum(df_eval$actual_label == "DISMISSED" & df_eval$predicted_label == "ALLOWED")
fn <- sum(df_eval$actual_label == "ALLOWED" & df_eval$predicted_label == "DISMISSED")
acc <- (tp + tn) / nrow(df_eval)

cat("====================================================================\n")
cat("CONFUSION MATRIX VERIFICATION:\n")
cat(sprintf("  Evaluated N:      %d\n", nrow(df_eval)))
cat(sprintf("  True Positives:   %d\n", tp))
cat(sprintf("  True Negatives:   %d\n", tn))
cat(sprintf("  False Positives:  %d\n", fp))
cat(sprintf("  False Negatives:  %d\n", fn))
cat(sprintf("  Total Correct:    %d\n", tp + tn))
cat(sprintf("  Total Incorrect:  %d\n", fp + fn))
cat(sprintf("  Test Accuracy:    %.2f%%\n", acc * 100))
cat("====================================================================\n\n")

# Save Confusion Matrix CSV
conf_mat_df <- data.frame(
  Metric = c("Test_Sample_Size", "Accuracy", "True_Positives", "True_Negatives", "False_Positives", "False_Negatives", "Total_Errors"),
  Value = c(nrow(df_eval), round(acc * 100, 2), tp, tn, fp, fn, fp + fn)
)
write.csv(conf_mat_df, file.path(OUT_DIR, "confusion_matrix.csv"), row.names = FALSE)

# Generate Phase 1 Required Inventory Files
# 1. all_test_errors.csv
df_errors <- df_eval[is_correct == FALSE]
df_correct <- df_eval[is_correct == TRUE]
df_fp <- df_eval[actual_label == "DISMISSED" & predicted_label == "ALLOWED"]
df_fn <- df_eval[actual_label == "ALLOWED" & predicted_label == "DISMISSED"]

# Standard error inventory columns
error_cols <- c(
  "document_id", "citation", "year", "source_pdf_path", "actual_label",
  "predicted_label", "prob_allowed", "prob_dismissed", "prediction_margin",
  "extraction_status", "text_hash", "chunk_count", "raw_chunk_count",
  "doc_characters", "doc_words", "model_version", "split_membership"
)

write.csv(df_errors[, ..error_cols], file.path(OUT_DIR, "all_test_errors.csv"), row.names = FALSE)
write.csv(df_errors[, ..error_cols], file.path(OUT_DIR, "01_COMPLETE_ERROR_INVENTORY.csv"), row.names = FALSE)
write.csv(df_correct[, ..error_cols], file.path(OUT_DIR, "all_test_correct.csv"), row.names = FALSE)
write.csv(df_fp[, ..error_cols], file.path(OUT_DIR, "false_positives.csv"), row.names = FALSE)
write.csv(df_fn[, ..error_cols], file.path(OUT_DIR, "false_negatives.csv"), row.names = FALSE)

cat(sprintf("Wrote: %s (%d rows)\n", file.path(OUT_DIR, "all_test_errors.csv"), nrow(df_errors)))
cat(sprintf("Wrote: %s (%d rows)\n", file.path(OUT_DIR, "all_test_correct.csv"), nrow(df_correct)))
cat(sprintf("Wrote: %s (%d rows)\n", file.path(OUT_DIR, "false_positives.csv"), nrow(df_fp)))
cat(sprintf("Wrote: %s (%d rows)\n", file.path(OUT_DIR, "false_negatives.csv"), nrow(df_fn)))
cat(sprintf("Wrote: %s\n", file.path(OUT_DIR, "confusion_matrix.csv")))

cat("\nPhase 1 Inventory generation completed successfully!\n")
