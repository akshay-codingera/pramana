# scripts/audit_phase2_3_leakage_and_reproducibility.R
# Phase 2 & 3: Rigorous Data Leakage Audit & Model Reproducibility Verification

suppressPackageStartupMessages({
  library(data.table)
  library(dplyr)
  library(stringr)
  library(jsonlite)
})

WORKSPACE <- "D:/Projects/pramana"
setwd(WORKSPACE)

source("R/data_loader.R")
source("R/hierarchical_model.R")

cat("====================================================================\n")
cat("PHASE 2 & 3: LEAKAGE AUDIT & MODEL REPRODUCIBILITY VERIFICATION\n")
cat("====================================================================\n\n")

# -------------------------------------------------------------
# 1. SPLIT CONTAMINATION AUDIT
# -------------------------------------------------------------
cat("1. Auditing split partitions for cross-contamination...\n")
tr <- fread("data/splits/grouped_train.csv")
va <- fread("data/splits/grouped_val.csv")
te <- fread("data/splits/grouped_test.csv")

cat(sprintf("Partition sizes: Train=%d | Val=%d | Test=%d (Total=%d)\n",
            nrow(tr), nrow(va), nrow(te), nrow(tr) + nrow(va) + nrow(te)))

# Check overlap across group_id
ov_tv_grp <- intersect(tr[['group_id']], va[['group_id']])
ov_tt_grp <- intersect(tr[['group_id']], te[['group_id']])
ov_vt_grp <- intersect(va[['group_id']], te[['group_id']])

cat(sprintf("  group_id Overlap: Train<->Val: %d | Train<->Test: %d | Val<->Test: %d\n",
            length(ov_tv_grp), length(ov_tt_grp), length(ov_vt_grp)))

# Check overlap across citation
cit_tr <- unique(tr[['citation']][tr[['citation']] != "" & !is.na(tr[['citation']])])
cit_va <- unique(va[['citation']][va[['citation']] != "" & !is.na(va[['citation']])])
cit_te <- unique(te[['citation']][te[['citation']] != "" & !is.na(te[['citation']])])

ov_tv_cit <- intersect(cit_tr, cit_va)
ov_tt_cit <- intersect(cit_tr, cit_te)
ov_vt_cit <- intersect(cit_va, cit_te)

cat(sprintf("  citation Overlap: Train<->Val: %d | Train<->Test: %d | Val<->Test: %d\n",
            length(ov_tv_cit), length(ov_tt_cit), length(ov_vt_cit)))

# Check overlap across path stems
ov_tv_path <- intersect(tr[['path']], va[['path']])
ov_tt_path <- intersect(tr[['path']], te[['path']])
ov_vt_path <- intersect(va[['path']], te[['path']])

cat(sprintf("  path stem Overlap: Train<->Val: %d | Train<->Test: %d | Val<->Test: %d\n",
            length(ov_tv_path), length(ov_tt_path), length(ov_vt_path)))

# Check near-duplicates across titles
clean_titles_tr <- tolower(gsub("[^a-zA-Z0-9]", "", tr[['title']]))
clean_titles_te <- tolower(gsub("[^a-zA-Z0-9]", "", te[['title']]))
title_overlap <- intersect(clean_titles_tr[nchar(clean_titles_tr) > 10], clean_titles_te[nchar(clean_titles_te) > 10])
cat(sprintf("  Identical Title Strings between Train and Test: %d\n", length(title_overlap)))

# -------------------------------------------------------------
# 2. PRE-DECISION MASKING & OPERATIVE DECREE LEAKAGE AUDIT
# -------------------------------------------------------------
cat("\n2. Auditing Pre-Decision Masking efficacy on real documents...\n")

disp_patterns <- c(
  "\\bappeal\\s+is\\s+(allowed|dismissed|partly\\s+allowed)\\b",
  "\\bappeals?\\s+(are|stand)\\s+(allowed|dismissed)\\b",
  "\\bwe\\s+(allow|dismiss)\\s+the\\s+(appeal|appeals|petition)\\b",
  "\\bimpugned\\s+(order|judgment)\\s+is\\s+(set\\s+aside|upheld|quashed)\\b",
  "\\bwe\\s+find\\s+no\\s+merit\\s+in\\s+this\\s+appeal\\b"
)

# Test 100 randomly sampled test documents
sample_indices <- sample(seq_len(nrow(te)), 100)
raw_leaks_found <- 0
masked_leaks_found <- 0

# Load model bundle to check embedding projector
bundle_path <- "engine/models/pramana_hierarchical_bundle.rds"
bundle <- readRDS(bundle_path)

for (idx in sample_indices) {
  row <- te[idx, ]
  txt <- load_judgment_text(row[['path']], row[['year']])
  if (is.na(txt) || nchar(txt) < 200) next
  
  # Check raw text for operative patterns in tail
  has_raw_leak <- any(sapply(disp_patterns, function(p) grepl(p, txt, ignore.case = TRUE, perl = TRUE)))
  if (has_raw_leak) raw_leaks_found <- raw_leaks_found + 1
  
  # Embed with pre-decision masking
  emb <- embed_document_chunks(txt, bundle$projector)
  
  # Check if any generated chunk text in the embedded document contains operative patterns
  chunk_texts <- sapply(emb$chunk_metadata, function(m) m$chunk_text)
  has_masked_leak <- any(sapply(disp_patterns, function(p) any(grepl(p, chunk_texts, ignore.case = TRUE, perl = TRUE))))
  if (has_masked_leak) masked_leaks_found <- masked_leaks_found + 1
}

cat(sprintf("  Sample of 100 held-out documents:\n"))
cat(sprintf("    Raw documents containing explicit operative decree keywords: %d / 100\n", raw_leaks_found))
cat(sprintf("    Documents where operative decree survived pre-decision masking: %d / 100\n", masked_leaks_found))

# -------------------------------------------------------------
# 3. INDEPENDENT RE-EVALUATION OF SAVED MODEL CHECKPOINT
# -------------------------------------------------------------
cat("\n3. Re-evaluating saved model checkpoint on independent held-out test partition...\n")
cat("Loading model checkpoint and weights...\n")

weights_path <- "engine/models/hierarchical_bigru_weights.pt"
if (!file.exists(weights_path)) {
  stop("Model weights file not found: ", weights_path)
}

# Parse command line args
args <- commandArgs(trailingOnly = TRUE)
get_arg <- function(flag, default_val) {
  idx <- which(args == flag)
  if (length(idx) > 0 && idx < length(args)) return(args[idx + 1])
  return(default_val)
}
opt_sample <- as.integer(get_arg("--sample", "5132"))

# Load test cases from disk
cat("Loading available test texts from disk...\n")
te_use <- te
if (opt_sample > 0 && opt_sample < nrow(te)) {
  cat(sprintf("Subsampling test partition to %d cases before file loading...\n", opt_sample))
  set.seed(42)
  te_use <- te[sample(nrow(te), opt_sample), ]
}

test_texts <- list()
test_targets <- integer(0)
test_stems <- character(0)

for (i in seq_len(nrow(te_use))) {
  row <- te_use[i, ]
  txt <- load_judgment_text(row[['path']], row[['year']])
  if (!is.na(txt) && nchar(str_trim(txt)) > 200) {
    test_texts[[length(test_texts) + 1]] <- txt
    test_targets <- c(test_targets, row[['target_binary']])
    test_stems <- c(test_stems, row[['path']])
  }
}

cat(sprintf("Loaded %d usable test cases (%d Allowed, %d Dismissed).\n",
            length(test_texts), sum(test_targets == 1), sum(test_targets == 0)))

# Run batch prediction via PyTorch model (instantiated once for maximum speed)
cat("Instantiating PyTorch neural model once for evaluation...\n")
eval_model <- py_nn$create_hierarchical_model(
  chunk_input_dim = as.integer(bundle$input_dim),
  chunk_emb_dim = as.integer(128),
  rnn_hidden_dim = as.integer(64)
)
eval_model <- py_nn$load_model(eval_model, bundle$weights_path)

cat("Executing model inference across test set...\n")
t_eval_start <- Sys.time()

n_test <- length(test_texts)
test_preds <- integer(n_test)
test_probs <- numeric(n_test)

for (k in seq_len(n_test)) {
  emb <- embed_document_chunks(test_texts[[k]], bundle$projector)
  pred <- py_nn$predict_document(eval_model, np_array(emb$chunk_matrix, dtype = "float32"))
  
  test_probs[k] <- pred$prob_allowed
  test_preds[k] <- ifelse(pred$predicted_label == "ALLOWED", 1L, 0L)
  
  if (k %% 100 == 0 || k == n_test) {
    cat(sprintf("  Evaluated %d / %d test cases...\n", k, n_test))
  }
}
eval_time_sec <- as.numeric(difftime(Sys.time(), t_eval_start, units = "secs"))

# Compute metrics
tp <- sum(test_preds == 1 & test_targets == 1)
fp <- sum(test_preds == 1 & test_targets == 0)
fn <- sum(test_preds == 0 & test_targets == 1)
tn <- sum(test_preds == 0 & test_targets == 0)

acc <- (tp + tn) / n_test
sens <- tp / max(1, (tp + fn))
spec <- tn / max(1, (tn + fp))
prec <- tp / max(1, (tp + fp))
f1 <- 2 * prec * sens / max(1e-8, (prec + sens))
bal_acc <- (sens + spec) / 2
brier <- mean((test_probs - test_targets)^2)

cat("\n====================================================================\n")
cat("INDEPENDENTLY REPRODUCED TEST SET METRICS:\n")
cat("====================================================================\n")
cat(sprintf("  Total Evaluated Cases: %d\n", n_test))
cat(sprintf("  Accuracy:              %.2f%%\n", acc * 100))
cat(sprintf("  Balanced Accuracy:     %.2f%%\n", bal_acc * 100))
cat(sprintf("  Precision:             %.2f%%\n", prec * 100))
cat(sprintf("  Recall / Sensitivity:  %.2f%%\n", sens * 100))
cat(sprintf("  Specificity:           %.2f%%\n", spec * 100))
cat(sprintf("  F1 Score:              %.4f\n", f1))
cat(sprintf("  Brier Score:           %.4f\n", brier))
cat(sprintf("  Confusion Matrix:      TP=%d, FP=%d, FN=%d, TN=%d\n", tp, fp, fn, tn))
cat(sprintf("  Inference Latency:     %.2f ms/doc\n", (eval_time_sec / n_test) * 1000))
cat("====================================================================\n")

# Save reproduced metrics to CSV for report inclusion
repro_df <- data.frame(
  Metric = c("Evaluated_Samples", "Accuracy", "Balanced_Accuracy", "Precision", "Recall", "Specificity", "F1_Score", "Brier_Score", "TP", "FP", "FN", "TN"),
  Reproduced_Value = c(n_test, round(acc * 100, 2), round(bal_acc * 100, 2), round(prec * 100, 2), round(sens * 100, 2), round(spec * 100, 2), round(f1, 4), round(brier, 4), tp, fp, fn, tn),
  Previously_Reported = c(5132, 78.55, 78.61, 84.52, 70.30, 86.92, 0.7676, 0.1439, 1818, 333, 768, 2213),
  stringsAsFactors = FALSE
)
repro_df$Discrepancy <- repro_df$Reproduced_Value - repro_df$Previously_Reported

write.csv(repro_df, "reports/audit_data/model_reproducibility_audit.csv", row.names = FALSE)
print(repro_df)
cat("\nSaved: reports/audit_data/model_reproducibility_audit.csv\n")
