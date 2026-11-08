# scripts/run_full_77_year_pipeline.R
# Master End-to-End Orchestrator for Full 77-Year Scaling (Option A)
# 1. Extracts all remaining substantive judgments (1966-2025).
# 2. Trains Hierarchical BiGRU + Attention on the complete 77-year substantive training partition.
# 3. Evaluates on the held-out test partition and updates benchmark tables, plots, and artifacts.

cat("====================================================================\n")
cat("PRAMANA: OPTION A — COMPLETE 77-YEAR DATASET SCALING & MODEL TRAINING\n")
cat("====================================================================\n\n")

# Phase 1: Batch Text Extraction across 1966 to 2025
cat("PHASE 1: Extracting all substantive judgment texts (1966-2025)...\n")
t0 <- Sys.time()
res_extract <- system2(
  "D:/Data_AI/01_Software/R/R-4.6.1/bin/Rscript.exe",
  args = c("scripts/extract_all_77_years.R", "--start-year", "1966", "--end-year", "2025")
)

if (res_extract != 0) {
  stop("Batch text extraction encountered an error (exit code: ", res_extract, ")")
}
cat(sprintf("Phase 1 complete in %.2f minutes.\n\n", as.numeric(difftime(Sys.time(), t0, units = "mins"))))

# Phase 2: Full-Scale Hierarchical Model Training & Evaluation
cat("PHASE 2: Training Hierarchical BiGRU + Attention across Full 77-Year Corpus...\n")
t1 <- Sys.time()
res_train <- system2(
  "D:/Data_AI/01_Software/R/R-4.6.1/bin/Rscript.exe",
  args = c("scripts/train_hierarchical_model.R", "--epochs", "6", "--batch-size", "32", "--lr", "0.001")
)

if (res_train != 0) {
  stop("Model training encountered an error (exit code: ", res_train, ")")
}
cat(sprintf("Phase 2 complete in %.2f minutes.\n\n", as.numeric(difftime(Sys.time(), t1, units = "mins"))))

# Phase 3: Copy updated plots to artifact directory
cat("PHASE 3: Updating artifact figures and research report...\n")
artifact_fig_dir <- "C:/Users/aksha/.gemini/antigravity/brain/54ef08f6-1581-47d5-9f68-d717a0a18f3c/figures"
dir.create(artifact_fig_dir, recursive = TRUE, showWarnings = FALSE)
figs <- c(
  "reports/figures/hierarchical_training_curve.png",
  "reports/figures/confusion_matrix_hierarchical.png",
  "reports/figures/loco_chunk_importance_plot.png"
)
for (f in figs) {
  if (file.exists(f)) {
    file.copy(f, file.path(artifact_fig_dir, basename(f)), overwrite = TRUE)
  }
}

cat("====================================================================\n")
cat("FULL 77-YEAR PIPELINE EXECUTION COMPLETED SUCCESSFULLY!\n")
cat("====================================================================\n")
