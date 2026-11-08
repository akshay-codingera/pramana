# tests/test_explainability_manual.R
source("engine/explainability.R")

# 1. Load dataset & train model
cases <- read.csv("result/cases_clean (1).csv", stringsAsFactors = FALSE)
labels_df <- read.csv("result/cases_25_labels.csv", stringsAsFactors = FALSE)
merged <- merge(cases, labels_df, by = "id")
model <- train_legal_model(merged$clean_text, merged$true_label)

# 2. Run explainability on Case 1 (Synthetic Fixture)
sample_text <- merged$clean_text[1]
exp_result <- explain_judgment(
  model = model,
  full_text = sample_text,
  metadata = list(case_id = "sample_case_01", data_source = "SAMPLE_ENGINEERING_FIXTURE"),
  random_seed = 42,
  n_random_trials = 30
)

cat("========================================================\n")
cat("EXPLAINABILITY REPORT FOR SAMPLE CASE 01\n")
cat("Data Source:", exp_result$meta$data_source_label, "\n")
cat("Original Prediction:", exp_result$baseline$predicted_class,
    "(Confidence:", sprintf("%.4f", exp_result$baseline$confidence), ")\n")
cat("Total Chunks:", exp_result$segmentation$chunk_count, "\n")
cat("Supporting Chunks:", nrow(exp_result$loco$supporting_chunks), "\n")
cat("Opposing Chunks:", nrow(exp_result$loco$opposing_chunks), "\n")
cat("\nTop 3 Influential Chunks:\n")
print(head(exp_result$loco$ranked_chunks[, c("chunk_id", "section_heading", "contribution", "role", "text_preview")], 3))

cat("\nRandom Removal Comparison:\n")
cat("Top-1 Influential Drop:", sprintf("%.4f", exp_result$random_baseline$top1_influential_drop), "\n")
cat("Mean Random Drop (30 trials):", sprintf("%.4f (SD: %.4f)", exp_result$random_baseline$mean_random_drop, exp_result$random_baseline$sd_random_drop), "\n")
cat("Z-Score:", sprintf("%.2f", exp_result$random_baseline$z_score), "\n")
cat("Empirical P-Value:", sprintf("%.4f", exp_result$random_baseline$empirical_p_value), "\n")

cat("\nTop-K Removal Results:\n")
print(exp_result$top_k_removal)

cat("\nCounterfactual Analysis:\n")
cat("Counterfactual Found:", exp_result$counterfactual$counterfactual_found, "\n")
if (exp_result$counterfactual$counterfactual_found) {
  cat("Minimal Chunks to Flip:", paste(exp_result$counterfactual$minimal_chunk_combination, collapse = ", "), "\n")
  cat("New Prediction:", exp_result$counterfactual$counterfactual_class, "\n")
  cat("Evaluations Used:", exp_result$counterfactual$evaluations_used, "\n")
}
cat("Caveat:", substr(exp_result$counterfactual$caveat, 1, 100), "...\n")
