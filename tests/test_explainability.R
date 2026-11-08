# tests/test_explainability.R
# Comprehensive Automated Test Suite for PRAMANA Explainability Engine
# Validates:
# 1. Probability calculations and calibration
# 2. Chunk position preservation and traceability
# 3. Correct reconstruction after deletion
# 4. Reproducibility across random seeds
# 5. Empty-document and malformed input handling
# 6. Prediction consistency
# 7. Random baseline statistical properties

source("engine/segmentation.R")
source("engine/model.R")
source("engine/explainability.R")

test_results <- list(passed = 0, failed = 0, tests = list())

assert <- function(condition, test_name, error_msg = "") {
  if (isTRUE(condition)) {
    test_results$passed <<- test_results$passed + 1
    test_results$tests[[length(test_results$tests) + 1]] <<- list(
      name = test_name, status = "PASSED", message = "OK"
    )
    cat(sprintf("[PASS] %s\n", test_name))
  } else {
    test_results$failed <<- test_results$failed + 1
    test_results$tests[[length(test_results$tests) + 1]] <<- list(
      name = test_name, status = "FAILED", message = error_msg
    )
    cat(sprintf("[FAIL] %s - %s\n", test_name, error_msg))
  }
}

cat("================================================================\n")
cat("PRAMANA EXPLAINABILITY ENGINE AUTOMATED TEST SUITE\n")
cat("================================================================\n\n")

# Setup: Load dataset and train reference model
cases <- read.csv("result/cases_clean (1).csv", stringsAsFactors = FALSE)
labels_df <- read.csv("result/cases_25_labels.csv", stringsAsFactors = FALSE)
merged <- merge(cases, labels_df, by = "id")
model <- train_legal_model(merged$clean_text, merged$true_label)

sample_doc <- merged$clean_text[1]
sample_doc_3 <- merged$clean_text[3]

# -----------------------------------------------------------------
# 1. Probability Calculations & Calibration Tests
# -----------------------------------------------------------------
cat("--- 1. Testing Probability Calculations & Calibration ---\n")

pred1 <- predict_document(model, sample_doc)
p_sum <- sum(pred1$probabilities)
assert(abs(p_sum - 1.0) < 1e-7, "Probabilities sum to 1.0", sprintf("Sum was %.8f", p_sum))

p_bounds <- all(pred1$probabilities >= 0.0 & pred1$probabilities <= 1.0)
assert(p_bounds, "All probabilities bounded in [0, 1]", "Probabilities out of bounds")

conf_valid <- pred1$confidence >= 0.5 && pred1$confidence == max(pred1$probabilities)
assert(conf_valid, "Confidence equals maximum probability and >= 0.5", sprintf("Confidence was %.4f", pred1$confidence))

pred3 <- predict_document(model, sample_doc_3)
assert(abs(sum(pred3$probabilities) - 1.0) < 1e-7, "Case 3 probabilities sum to 1.0", "Sum was not 1.0")
assert(pred3$probabilities["ACCEPTED"] > 0 && pred3$probabilities["REJECTED"] > 0,
       "Probabilities are strictly non-degenerate for ambiguous cases", "Degenerate zero prob")


# -----------------------------------------------------------------
# 2. Chunk Position Preservation & Traceability Tests
# -----------------------------------------------------------------
cat("\n--- 2. Testing Chunk Position Preservation & Traceability ---\n")

seg <- segment_judgment(sample_doc)
assert(seg$chunk_count > 0, "Segmentation produces non-zero chunks for valid document", "0 chunks produced")

trace_ok <- verify_traceability(seg)
assert(trace_ok, "Substrings match exact original document at [start_char..end_char]", "Traceability failed")

# Check offsets ordering
chunks_df <- seg$chunks
offsets_ordered <- all(chunks_df$start_char < chunks_df$end_char)
assert(offsets_ordered, "Start offsets are strictly less than end offsets", "Offset inverted")

if (nrow(chunks_df) > 1) {
  no_overlap <- all(chunks_df$start_char[-1] > chunks_df$end_char[-nrow(chunks_df)])
  assert(no_overlap, "Chunk character intervals are strictly non-overlapping", "Overlapping intervals detected")
}

# Real judgment traceability
if (file.exists("data/raw_data/road_contract.pdf")) {
  real_pages <- pdftools::pdf_text("data/raw_data/road_contract.pdf")
  real_text <- paste(real_pages, collapse = "\n\n")
  real_seg <- segment_judgment(real_text)
  real_trace_ok <- verify_traceability(real_seg)
  assert(real_trace_ok, "Authentic Supreme Court judgment preserves 100% chunk traceability",
         "Mismatch in real judgment substrings")
}


# -----------------------------------------------------------------
# 3. Correct Reconstruction After Deletion Tests
# -----------------------------------------------------------------
cat("\n--- 3. Testing Correct Reconstruction After Chunk Deletion ---\n")

target_chunk <- seg$chunks$chunk_id[1]
target_text <- seg$chunks$text[1]
reconstructed <- reconstruct_without_chunks(seg, c(target_chunk))

assert(!grepl(target_text, reconstructed, fixed = TRUE),
       "Reconstructed text does not contain deleted chunk text", "Deleted text still present")

assert(nchar(reconstructed) < nchar(seg$full_text),
       "Reconstructed text length is strictly less than full document", "Length not reduced")

# Multi-chunk reconstruction
multi_targets <- seg$chunks$chunk_id[1:3]
reconstructed_multi <- reconstruct_without_chunks(seg, multi_targets)
assert(nchar(reconstructed_multi) < nchar(reconstructed),
       "Multi-chunk ablation produces monotonically smaller document", "Length was not smaller")

# Removing all chunks produces empty string
all_chunks <- seg$chunks$chunk_id
reconstructed_none <- reconstruct_without_chunks(seg, all_chunks)
assert(reconstructed_none == "", "Removing all chunks reconstructs to empty string", "Not empty")


# -----------------------------------------------------------------
# 4. Reproducibility Across Random Seeds Tests
# -----------------------------------------------------------------
cat("\n--- 4. Testing Reproducibility Across Random Seeds ---\n")

exp_seed_42_a <- explain_judgment(model, sample_doc_3, random_seed = 42, n_random_trials = 25)
exp_seed_42_b <- explain_judgment(model, sample_doc_3, random_seed = 42, n_random_trials = 25)
exp_seed_99   <- explain_judgment(model, sample_doc_3, random_seed = 99, n_random_trials = 25)

seed_match <- identical(exp_seed_42_a$random_baseline$random_drops,
                        exp_seed_42_b$random_baseline$random_drops)
assert(seed_match, "Identical seed produces identical random removal trials", "Trial drops diverged")

z_match <- abs(exp_seed_42_a$random_baseline$z_score - exp_seed_42_b$random_baseline$z_score) < 1e-9
assert(z_match, "Identical seed produces identical Z-scores", "Z-scores diverged")

diff_seed_changes <- !identical(exp_seed_42_a$random_baseline$random_drops,
                                exp_seed_99$random_baseline$random_drops)
assert(diff_seed_changes, "Different seed produces distinct random trials sample sequence", "Seeds produced identical samples")


# -----------------------------------------------------------------
# 5. Empty-Document and Edge-Case Handling Tests
# -----------------------------------------------------------------
cat("\n--- 5. Testing Empty-Document and Edge-Case Handling ---\n")

empty_seg <- segment_judgment("")
assert(empty_seg$chunk_count == 0 && nrow(empty_seg$chunks) == 0,
       "Empty string produces 0 chunks without error", "Failed on empty string")

na_seg <- segment_judgment(NA_character_)
assert(na_seg$chunk_count == 0, "NA input produces 0 chunks without error", "Failed on NA")

ws_seg <- segment_judgment("   \n\n   \t  \n  ")
assert(ws_seg$chunk_count == 0, "Whitespace-only input produces 0 chunks without error", "Failed on whitespace")

empty_pred <- predict_document(model, "")
assert(empty_pred$predicted_class %in% c("ACCEPTED", "REJECTED"),
       "Empty document returns valid prior prediction", "Prediction failed on empty string")

empty_exp <- explain_judgment(model, "")
assert(empty_exp$segmentation$chunk_count == 0 && nrow(empty_exp$loco$ranked_chunks) == 0,
       "Explainability engine handles empty document gracefully", "Explain failed on empty string")


# -----------------------------------------------------------------
# 6. Prediction Consistency Tests
# -----------------------------------------------------------------
cat("\n--- 6. Testing Prediction Consistency ---\n")

pred_run_1 <- predict_document(model, sample_doc)
pred_run_2 <- predict_document(model, sample_doc)

assert(identical(pred_run_1$predicted_class, pred_run_2$predicted_class),
       "Predicted class is strictly deterministic across runs", "Deterministic class failed")

assert(abs(pred_run_1$logit - pred_run_2$logit) < 1e-12,
       "Logit value is numerically identical across repeated inferences", "Logit differed")

assert(identical(pred_run_1$probabilities, pred_run_2$probabilities),
       "Probability vector is identical across repeated inferences", "Probabilities differed")


# -----------------------------------------------------------------
# 7. Random Baseline Statistical Properties Tests
# -----------------------------------------------------------------
cat("\n--- 7. Testing Random Baseline Statistical Properties ---\n")

rb <- exp_seed_42_a$random_baseline
assert(rb$n_trials == 25, "Trial count matches configured argument", "Trial count mismatch")

p_val_valid <- rb$empirical_p_value >= 0.0 && rb$empirical_p_value <= 1.0
assert(p_val_valid, "Empirical p-value lies within [0, 1]", "P-value out of bounds")

calculated_z <- if (rb$sd_random_drop > 1e-6) (rb$top1_influential_drop - rb$mean_random_drop) / rb$sd_random_drop else 0
assert(abs(rb$z_score - calculated_z) < 1e-6,
       "Z-score matches formula (top1 - mean) / sd", "Z-score formula mismatch")

assert(rb$top1_influential_drop >= rb$mean_random_drop,
       "Top-1 influential drop is greater than or equal to random mean drop", "Top1 drop lower than random mean")


# -----------------------------------------------------------------
# Final Test Summary
# -----------------------------------------------------------------
cat("\n================================================================\n")
cat(sprintf("TEST SUMMARY: %d Passed, %d Failed (Total %d)\n",
            test_results$passed, test_results$failed,
            test_results$passed + test_results$failed))
cat("================================================================\n")

if (test_results$failed > 0) {
  cat("One or more tests failed!\n")
  quit(status = 1)
} else {
  cat("All tests passed successfully.\n")
  quit(status = 0)
}
