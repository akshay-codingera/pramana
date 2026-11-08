# ==============================================================================
# PRAMANA — Indian Supreme Court Verdict Prediction Research
# Script: scripts/train_hierarchical_model.R
# Architecture: Hierarchical Chunk-Based Document Modeling (BiGRU + Attention)
# Author: Senior ML Engineer / Legal NLP Research Scientist
# Reference: ILDC for CJPE (ACL 2021)
# ==============================================================================

suppressPackageStartupMessages({
  library(dplyr)
  library(stringr)
  library(ggplot2)
  library(jsonlite)
})

cat("====================================================================\n")
cat("PRAMANA: HIERARCHICAL CHUNK-BASED CLASSIFICATION & EVALUATION\n")
cat("====================================================================\n\n")

# Parse command line args
args <- commandArgs(trailingOnly = TRUE)
get_arg <- function(flag, default_val) {
  idx <- which(args == flag)
  if (length(idx) > 0 && idx < length(args)) return(args[idx + 1])
  return(default_val)
}
opt_epochs <- as.integer(get_arg("--epochs", "6"))
opt_batch_size <- as.integer(get_arg("--batch-size", "32"))
opt_lr <- as.numeric(get_arg("--lr", "0.001"))
opt_max_train <- as.integer(get_arg("--max-train", "-1"))

cat(sprintf("Hyperparameters: Epochs=%d | BatchSize=%d | LR=%.4f\n\n", opt_epochs, opt_batch_size, opt_lr))

source("R/data_loader.R")
source("R/hierarchical_model.R")

# Ensure output directories exist
dir.create("engine/models", recursive = TRUE, showWarnings = FALSE)
dir.create("reports/tables", recursive = TRUE, showWarnings = FALSE)
dir.create("reports/figures", recursive = TRUE, showWarnings = FALSE)

# 1. Load Grouped Splits
cat("Loading grouped dataset splits...\n")
train_split <- read.csv("data/splits/grouped_train.csv", stringsAsFactors = FALSE)
val_split <- read.csv("data/splits/grouped_val.csv", stringsAsFactors = FALSE)
test_split <- read.csv("data/splits/grouped_test.csv", stringsAsFactors = FALSE)

cat(sprintf("Loaded splits: %d Train | %d Validation | %d Test cases.\n",
            nrow(train_split), nrow(val_split), nrow(test_split)))

# 2. Filter for cases that have extracted text available
load_available_cases <- function(split_df) {
  texts <- list()
  labels <- integer(0)
  valid_rows <- list()
  
  for (i in seq_len(nrow(split_df))) {
    row <- split_df[i, ]
    txt <- load_judgment_text(row$path, row$year)
    if (!is.na(txt) && nchar(str_trim(txt)) > 200) {
      texts[[length(texts) + 1]] <- txt
      labels <- c(labels, row$target_binary)
      valid_rows[[length(valid_rows) + 1]] <- row
    }
  }
  
  return(list(
    texts = texts,
    labels = labels,
    metadata = do.call(rbind, valid_rows)
  ))
}

cat("Retrieving extracted texts for available cases across partitions...\n")
tr_data <- load_available_cases(train_split)
va_data <- load_available_cases(val_split)
te_data <- load_available_cases(test_split)

cat(sprintf("Extracted & Ready: %d Train cases (%d Allowed, %d Dismissed)\n", 
            length(tr_data$texts), sum(tr_data$labels == 1), sum(tr_data$labels == 0)))
cat(sprintf("Extracted & Ready: %d Val cases   (%d Allowed, %d Dismissed)\n", 
            length(va_data$texts), sum(va_data$labels == 1), sum(va_data$labels == 0)))
cat(sprintf("Extracted & Ready: %d Test cases  (%d Allowed, %d Dismissed)\n\n", 
            length(te_data$texts), sum(te_data$labels == 1), sum(te_data$labels == 0)))

if (length(tr_data$texts) < 20 || length(va_data$texts) < 5 || length(te_data$texts) < 5) {
  stop("Insufficient extracted cases available for robust training. Please ensure text extraction is complete.")
}

# 3. Train Hierarchical Model
if (opt_max_train > 0 && length(tr_data$texts) > opt_max_train) {
  cat(sprintf("Subsampling training cases to %d as requested by --max-train...\n", opt_max_train))
  sub_idx <- sample(length(tr_data$texts), opt_max_train)
  tr_texts_use <- tr_data$texts[sub_idx]
  tr_labels_use <- tr_data$labels[sub_idx]
} else {
  tr_texts_use <- tr_data$texts
  tr_labels_use <- tr_data$labels
}

t_start <- Sys.time()
bundle <- train_hierarchical_model(
  train_texts = tr_texts_use,
  train_labels = tr_labels_use,
  val_texts = va_data$texts,
  val_labels = va_data$labels,
  epochs = opt_epochs,
  lr = opt_lr,
  batch_size = opt_batch_size
)
train_time_sec <- as.numeric(difftime(Sys.time(), t_start, units = "secs"))
cat(sprintf("Training completed in %.2f seconds.\n\n", train_time_sec))

# 4. Evaluate on Independent Held-Out Test Set
cat("Evaluating Hierarchical BiGRU + Attention on Independent Held-Out Test Set...\n")
t_eval_start <- Sys.time()

test_preds <- integer(length(te_data$texts))
test_probs <- numeric(length(te_data$texts))

for (k in seq_along(te_data$texts)) {
  p <- predict_hierarchical_document(bundle, te_data$texts[[k]])
  test_probs[k] <- p$prob_allowed
  test_preds[k] <- ifelse(p$predicted_label == "ALLOWED", 1L, 0L)
}
eval_time_sec <- as.numeric(difftime(Sys.time(), t_eval_start, units = "secs"))

test_targets <- te_data$labels
n_test <- length(test_targets)

# Confusion Matrix
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

cat("--------------------------------------------------------------------\n")
cat("HELD-OUT TEST SET EVALUATION METRICS (HIERARCHICAL CHUNKING):\n")
cat(sprintf("  Accuracy:          %.2f%%\n", acc * 100))
cat(sprintf("  Balanced Accuracy: %.2f%%\n", bal_acc * 100))
cat(sprintf("  Precision:         %.2f%%\n", prec * 100))
cat(sprintf("  Recall:            %.2f%%\n", sens * 100))
cat(sprintf("  Specificity:       %.2f%%\n", spec * 100))
cat(sprintf("  F1 Score:          %.4f\n", f1))
cat(sprintf("  Brier Score:       %.4f\n", brier))
cat(sprintf("  Confusion Matrix:  TP=%d, FP=%d, FN=%d, TN=%d (N=%d)\n", tp, fp, fn, tn, n_test))
cat("--------------------------------------------------------------------\n\n")

# 5. Baseline Comparisons: Majority Class & Document-Level Log-Odds
maj_class <- ifelse(mean(tr_data$labels) >= 0.5, 1, 0)
maj_acc <- mean(test_targets == maj_class)
maj_f1 <- ifelse(maj_class == 1, 2 * (tp+fn)/(n_test + tp+fn), 0)

# Export Comparative Table
comp_table <- data.frame(
  Model = c("Majority Class Baseline", "Hierarchical BiGRU + Attention (Chunks)"),
  Representation = c("Empirical Prior", "Hierarchical 512-Token Overlapping Chunks"),
  Pre_Decision_Masking = c("N/A", "YES (Operative decree removed)"),
  Test_Accuracy = c(sprintf("%.2f%%", maj_acc * 100), sprintf("%.2f%%", acc * 100)),
  Balanced_Accuracy = c("50.00%", sprintf("%.2f%%", bal_acc * 100)),
  F1_Score = c(sprintf("%.4f", maj_f1), sprintf("%.4f", f1)),
  Brier_Score = c(sprintf("%.4f", mean((mean(tr_data$labels) - test_targets)^2)), sprintf("%.4f", brier)),
  Inference_Time = c("< 1ms", sprintf("%.2f ms/doc", (eval_time_sec / n_test) * 1000)),
  stringsAsFactors = FALSE
)

write.csv(comp_table, "reports/tables/comparative_model_table.csv", row.names = FALSE)
cat("Saved: reports/tables/comparative_model_table.csv\n")
print(comp_table)
cat("\n")

# 6. Run Leave-One-Chunk-Out (LOCO) Explainability on Test Sample
cat("Running LOCO Occlusion Sensitivity Analysis across held-out cases...\n")
sample_loco_n <- min(50, length(te_data$texts))
top1_drops <- numeric(sample_loco_n)
random_drops <- numeric(sample_loco_n)

for (s in seq_len(sample_loco_n)) {
  loco_res <- explain_hierarchical_loco(bundle, te_data$texts[[s]])
  if (length(loco_res) > 0) {
    top1_drops[s] <- loco_res[[1]]$importance_score
    rand_idx <- sample(seq_along(loco_res), 1)
    random_drops[s] <- loco_res[[rand_idx]]$importance_score
  }
}

mean_top1 <- mean(top1_drops)
mean_rand <- mean(random_drops)
se_diff <- sd(top1_drops - random_drops) / sqrt(sample_loco_n)
z_score <- (mean_top1 - mean_rand) / max(1e-8, se_diff)
p_val <- 2 * (1 - pnorm(abs(z_score)))

loco_summary <- data.frame(
  Metric = c("Top-1 Influential Chunk Probability Impact", "Random Chunk Baseline Impact", "Mean Delta", "Z-Score", "p-value"),
  Value = c(sprintf("%.4f", mean_top1), sprintf("%.4f", mean_rand), sprintf("%.4f", mean_top1 - mean_rand), 
            sprintf("%.2f", z_score), sprintf("%.4e", p_val)),
  Statistical_Significance = c("Hypothesis H1", "Null Baseline", "Observed Margin", 
                               ifelse(abs(z_score) > 1.96, "p < 0.05 (Statistically Significant)", "Not Significant"),
                               ifelse(p_val < 0.05, "Statistically Significant", "Not Significant"))
)

write.csv(loco_summary, "reports/tables/loco_evaluation_summary.csv", row.names = FALSE)
cat("Saved: reports/tables/loco_evaluation_summary.csv\n")
print(loco_summary)
cat("\n")

# 7. Generate Visualizations
cat("Generating evaluation and diagnostic visualizations in ggplot2...\n")

# A. Training Curve
hist_df <- do.call(rbind, lapply(bundle$training_history, as.data.frame))
p_loss <- ggplot(hist_df, aes(x = epoch)) +
  geom_line(aes(y = train_loss, color = "Train Loss"), size = 1) +
  geom_point(aes(y = train_loss, color = "Train Loss"), size = 2) +
  geom_line(aes(y = val_loss, color = "Validation Loss"), size = 1, linetype = "dashed") +
  geom_point(aes(y = val_loss, color = "Validation Loss"), size = 2) +
  scale_color_manual(values = c("Train Loss" = "#2980b9", "Validation Loss" = "#e74c3c")) +
  scale_x_continuous(breaks = seq_len(nrow(hist_df))) +
  labs(
    title = "Hierarchical BiGRU + Attention Training & Validation Loss",
    subtitle = "AdamW optimizer (lr=0.001, wd=0.01) with gradient clipping",
    x = "Epoch",
    y = "Binary Cross-Entropy Loss",
    color = "Metric",
    caption = "PRAMANA Legal Outcome Prediction"
  ) +
  theme_minimal(base_size = 12)

ggsave("reports/figures/hierarchical_training_curve.png", p_loss, width = 9, height = 5, dpi = 300)
cat("Saved: reports/figures/hierarchical_training_curve.png\n")

# B. Confusion Matrix Plot
cm_df <- data.frame(
  Actual = factor(c("ALLOWED", "ALLOWED", "DISMISSED", "DISMISSED"), levels = c("DISMISSED", "ALLOWED")),
  Predicted = factor(c("ALLOWED", "DISMISSED", "ALLOWED", "DISMISSED"), levels = c("ALLOWED", "DISMISSED")),
  Count = c(tp, fn, fp, tn)
)

p_cm <- ggplot(cm_df, aes(x = Predicted, y = Actual, fill = Count)) +
  geom_tile(color = "white", size = 1.5) +
  geom_text(aes(label = sprintf("%d\n(%.1f%%)", Count, 100 * Count / n_test)), size = 5, fontface = "bold") +
  scale_fill_gradient(low = "#ebf5fb", high = "#2980b9") +
  labs(
    title = "Held-Out Test Confusion Matrix (Hierarchical BiGRU + Attention)",
    subtitle = sprintf("N = %d judgments | Balanced Accuracy: %.2f%% | F1: %.4f", n_test, bal_acc * 100, f1),
    x = "Predicted Supreme Court Outcome",
    y = "Actual Ground-Truth Outcome",
    caption = "Source: PRAMANA Held-Out Test Evaluation"
  ) +
  theme_minimal(base_size = 12) +
  theme(plot.title = element_text(face = "bold", size = 13))

ggsave("reports/figures/confusion_matrix_hierarchical.png", p_cm, width = 8, height = 5.5, dpi = 300)
cat("Saved: reports/figures/confusion_matrix_hierarchical.png\n")

# C. LOCO Sensitivity Plot
loco_plot_df <- data.frame(
  Method = c("Top-1 Influential Passage", "Random Passage Baseline"),
  Impact = c(mean_top1, mean_rand),
  SE = c(sd(top1_drops)/sqrt(sample_loco_n), sd(random_drops)/sqrt(sample_loco_n))
)

p_loco <- ggplot(loco_plot_df, aes(x = Method, y = Impact, fill = Method)) +
  geom_bar(stat = "identity", width = 0.5, show.legend = FALSE) +
  geom_errorbar(aes(ymin = Impact - SE, ymax = Impact + SE), width = 0.15, size = 0.8) +
  geom_text(aes(label = sprintf("ΔP = %.4f", Impact)), vjust = -1.2, fontface = "bold", size = 4) +
  scale_fill_manual(values = c("Top-1 Influential Passage" = "#27ae60", "Random Passage Baseline" = "#7f8c8d")) +
  scale_y_continuous(limits = c(0, max(loco_plot_df$Impact) * 1.4)) +
  labs(
    title = "LOCO Occlusion Faithfulness Verification",
    subtitle = sprintf("Causal probability impact vs. random baseline (Z = %.2f, %s)", 
                       z_score, ifelse(p_val < 0.05, "p < 0.05", "ns")),
    x = "Ablation Method",
    y = "Mean Absolute Probability Change (|ΔP|)",
    caption = "ILDC-Inspired Leave-One-Chunk-Out (LOCO) Sensitivity Analysis"
  ) +
  theme_minimal(base_size = 12) +
  theme(plot.title = element_text(face = "bold", size = 13))

ggsave("reports/figures/loco_chunk_importance_plot.png", p_loco, width = 8, height = 5.5, dpi = 300)
cat("Saved: reports/figures/loco_chunk_importance_plot.png\n")

cat("\n====================================================================\n")
cat("Hierarchical Chunking Pipeline Execution & Evaluation Completed!\n")
cat("====================================================================\n")
