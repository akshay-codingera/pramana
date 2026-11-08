# tests/test_real_judgment.R
# Test explainability on an authentic Supreme Court of India judgment fixture
# from data/raw_data/road_contract.pdf (2025 INSC 1153)

source("engine/explainability.R")
library(pdftools)

cat("1. Extracting text from real judgment PDF...\n")
pdf_path <- "data/raw_data/road_contract.pdf"
pages <- pdftools::pdf_text(pdf_path)
full_judgment_text <- paste(pages, collapse = "\n\n")

cat(sprintf("Extracted %d pages, %d characters, approx %d words.\n",
            length(pages), nchar(full_judgment_text),
            length(unlist(strsplit(full_judgment_text, "\\s+")))))

# 2. Train model on the corpus
cases <- read.csv("result/cases_clean (1).csv", stringsAsFactors = FALSE)
labels_df <- read.csv("result/cases_25_labels.csv", stringsAsFactors = FALSE)
merged <- merge(cases, labels_df, by = "id")
model <- train_legal_model(merged$clean_text, merged$true_label)

# 3. Explain judgment
cat("\n2. Running explainability engine on authentic Supreme Court judgment...\n")
start_time <- Sys.time()
exp_real <- explain_judgment(
  model = model,
  full_text = full_judgment_text,
  metadata = list(
    case_id = "INSC_2025_1153",
    data_source = "REAL_INSC_JUDGMENT",
    case_title = "Supreme Court of India Criminal Appeal No. 4250 of 2024"
  ),
  random_seed = 100,
  n_random_trials = 25
)
elapsed <- round(difftime(Sys.time(), start_time, units = "secs"), 2)
cat(sprintf("Explainability run complete in %s seconds.\n", elapsed))

cat("\n========================================================\n")
cat("EXPLAINABILITY REPORT FOR REAL SUPREME COURT JUDGMENT\n")
cat("Data Source:", exp_real$meta$data_source_label, "\n")
cat("Is Sample Fixture:", exp_real$meta$is_sample_fixture, "\n")
cat("Chunks Identified:", exp_real$segmentation$chunk_count, "\n")
cat("Original Prediction:", exp_real$baseline$predicted_class,
    "(Prob:", sprintf("%.4f", exp_real$baseline$probabilities[exp_real$baseline$predicted_class]), ")\n")

cat("\nTop 5 Influential Chunks by Leave-One-Chunk-Out (LOCO):\n")
print(head(exp_real$loco$ranked_chunks[, c("chunk_id", "section_heading", "contribution", "role", "text_preview")], 5))

cat("\nRandom Removal Comparison (25 trials):\n")
cat("Top-1 Influential Drop:", sprintf("%.6f", exp_real$random_baseline$top1_influential_drop), "\n")
cat("Mean Random Drop:", sprintf("%.6f (SD: %.6f)", exp_real$random_baseline$mean_random_drop, exp_real$random_baseline$sd_random_drop), "\n")
cat("Z-Score:", sprintf("%.2f", exp_real$random_baseline$z_score), "\n")
cat("Empirical P-Value:", sprintf("%.4f", exp_real$random_baseline$empirical_p_value), "\n")

cat("\nTop-K Removal Results:\n")
print(exp_real$top_k_removal)

# Save as test artifact for inspection
dir.create("result/experiments", recursive = TRUE, showWarnings = FALSE)
saveRDS(exp_real, "result/experiments/real_judgment_explainability.rds")
cat("\nSaved serialized report to result/experiments/real_judgment_explainability.rds\n")
