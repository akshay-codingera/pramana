# engine/plot_explanations.R
# Visualizations for PRAMANA explainability engine implemented natively in R.
# Generates high-resolution PNG charts:
# 1. chunk_ranking.png: Chunk contribution ranking
# 2. probability_changes.png: Probability changes / waterfall after removal
# 3. pos_neg_contributions.png: Positive versus negative contributions
# 4. original_vs_perturbed.png: Original versus perturbed predictions
# 5. random_vs_influential.png: Random removal comparison histogram

suppressPackageStartupMessages({
  library(jsonlite)
})

generate_explanation_plots <- function(json_path, output_dir = "result/plots") {
  dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)
  
  if (!file.exists(json_path)) {
    stop("JSON file not found: ", json_path)
  }
  
  data <- jsonlite::fromJSON(json_path)
  ranked_df <- data$loco$ranked_chunks
  baseline_p <- data$baseline$probabilities[1]
  orig_class <- data$baseline$predicted_class
  
  if (nrow(ranked_df) == 0) return(list())
  
  saved_plots <- list()
  
  # -------------------------------------------------------------
  # Chart 1: Chunk Contribution Ranking
  # -------------------------------------------------------------
  plot_path_1 <- file.path(output_dir, "chunk_ranking.png")
  png(plot_path_1, width = 900, height = 600, res = 120)
  par(mar = c(5, 7, 4, 2))
  
  # Take top 10 for clarity if large
  sub_df <- head(ranked_df, 12)
  sub_df <- sub_df[order(sub_df$contribution), ] # ascending for horizontal barplot
  
  colors <- ifelse(sub_df$contribution > 0, "#2e7d32", "#c62828")
  
  barplot(
    sub_df$contribution,
    horiz = TRUE,
    names.arg = sub_df$chunk_id,
    las = 1,
    col = colors,
    border = NA,
    xlab = sprintf("Contribution: Delta P(%s)", orig_class),
    main = sprintf("Chunk Contribution Ranking (LOCO)\nPredicted: %s (P=%.3f)", orig_class, baseline_p),
    cex.names = 0.85
  )
  abline(v = 0, lty = 2, col = "#555555")
  legend("bottomright", legend = c("Supporting (+Delta P)", "Opposing (-Delta P)"),
         fill = c("#2e7d32", "#c62828"), bty = "n", cex = 0.85)
  dev.off()
  saved_plots$chunk_ranking <- plot_path_1
  
  # -------------------------------------------------------------
  # Chart 2: Probability Changes Waterfall
  # -------------------------------------------------------------
  plot_path_2 <- file.path(output_dir, "probability_changes.png")
  png(plot_path_2, width = 900, height = 550, res = 120)
  par(mar = c(5, 5, 4, 2))
  
  top_chunks <- head(ranked_df, 8)
  bar_labels <- c("Full Doc", top_chunks$chunk_id)
  bar_probs <- c(baseline_p, top_chunks$ablated_prob)
  bar_cols <- c("#1565c0", ifelse(top_chunks$class_flipped, "#e65100", "#546e7a"))
  
  bp <- barplot(
    bar_probs,
    names.arg = bar_labels,
    las = 2,
    col = bar_cols,
    ylim = c(0, 1.05),
    ylab = sprintf("P(%s | document without chunk)", orig_class),
    main = "Probability Changes After Single Chunk Removal",
    cex.names = 0.8
  )
  abline(h = 0.5, lty = 2, col = "#d32f2f", lwd = 1.5)
  text(bp[1], 0.52, "Decision Threshold (0.5)", pos = 4, col = "#d32f2f", cex = 0.8)
  legend("topright", legend = c("Baseline Full Doc", "Ablated (Same Class)", "Ablated (Class Flipped!)"),
         fill = c("#1565c0", "#546e7a", "#e65100"), bty = "n", cex = 0.8)
  dev.off()
  saved_plots$probability_changes <- plot_path_2
  
  # -------------------------------------------------------------
  # Chart 3: Positive vs Negative Contributions
  # -------------------------------------------------------------
  plot_path_3 <- file.path(output_dir, "pos_neg_contributions.png")
  png(plot_path_3, width = 900, height = 500, res = 120)
  par(mar = c(5, 5, 4, 2))
  
  pos_contribs <- ranked_df$contribution[ranked_df$contribution > 1e-7]
  neg_contribs <- ranked_df$contribution[ranked_df$contribution < -1e-7]
  
  n_pos <- length(pos_contribs)
  n_neg <- length(neg_contribs)
  sum_pos <- sum(pos_contribs)
  sum_neg <- abs(sum(neg_contribs))
  
  counts <- c(n_pos, n_neg)
  bp_pn <- barplot(
    counts,
    names.arg = c(sprintf("Supporting Chunks\n(N=%d, Sum=+%.3f)", n_pos, sum_pos),
                  sprintf("Opposing Chunks\n(N=%d, Sum=-%.3f)", n_neg, sum_neg)),
    col = c("#2e7d32", "#c62828"),
    ylab = "Number of Chunks",
    main = "Supporting vs. Opposing Chunk Balance",
    ylim = c(0, max(counts) * 1.25 + 1)
  )
  text(bp_pn, counts + 0.3, labels = as.character(counts), font = 2)
  dev.off()
  saved_plots$pos_neg_contributions <- plot_path_3
  
  # -------------------------------------------------------------
  # Chart 4: Original vs Perturbed Predictions (Top-K)
  # -------------------------------------------------------------
  plot_path_4 <- file.path(output_dir, "original_vs_perturbed.png")
  png(plot_path_4, width = 900, height = 500, res = 120)
  par(mar = c(5, 5, 4, 2))
  
  top_k_df <- data$top_k_removal
  if (nrow(top_k_df) > 0) {
    k_vals <- c(0, top_k_df$actual_k)
    prob_vals <- c(baseline_p, top_k_df$remaining_prob)
    
    plot(k_vals, prob_vals, type = "b", pch = 19, col = "#0d47a1", lwd = 2.5,
         ylim = c(0, 1.05),
         xlab = "Number of Top Influential Chunks Removed (K)",
         ylab = sprintf("Remaining P(%s)", orig_class),
         main = "Original vs. Perturbed Prediction (Top-K Removal Curve)",
         xaxt = "n")
    axis(1, at = k_vals, labels = c("0 (Full)", paste0("Top-", top_k_df$k)))
    abline(h = 0.5, lty = 2, col = "#d32f2f", lwd = 1.5)
    grid()
    points(k_vals[prob_vals < 0.5], prob_vals[prob_vals < 0.5], pch = 21, bg = "#ff5722", cex = 2)
    legend("bottomleft", legend = c("Trajectory P(class)", "Threshold (0.5)", "Class Flip Point"),
           col = c("#0d47a1", "#d32f2f", "#ff5722"), pch = c(19, NA, 21), pt.bg = c(NA, NA, "#ff5722"),
           lty = c(1, 2, NA), lwd = c(2.5, 1.5, NA), bty = "n")
  }
  dev.off()
  saved_plots$original_vs_perturbed <- plot_path_4
  
  # -------------------------------------------------------------
  # Chart 5: Random Removal Baseline Comparison
  # -------------------------------------------------------------
  plot_path_5 <- file.path(output_dir, "random_vs_influential.png")
  png(plot_path_5, width = 900, height = 500, res = 120)
  par(mar = c(5, 5, 4, 2))
  
  rand_drops <- data$random_baseline$random_drops
  top1_drop <- data$random_baseline$top1_influential_drop
  mean_rand <- data$random_baseline$mean_random_drop
  
  if (length(rand_drops) > 0) {
    hist_range <- range(c(rand_drops, top1_drop))
    h <- hist(rand_drops, breaks = 12, col = "#bbdefb", border = "#1976d2",
              main = sprintf("Random Chunk Removal vs. Top-1 Influential Chunk\n(Z-Score: %.2f, Empirical P-Value: %.4f)",
                             data$random_baseline$z_score, data$random_baseline$empirical_p_value),
              xlab = "Probability Drop Delta P(orig_class)",
              xlim = c(hist_range[1] - 0.05, hist_range[2] + 0.05))
    abline(v = mean_rand, col = "#0d47a1", lwd = 2, lty = 2)
    abline(v = top1_drop, col = "#d50000", lwd = 3)
    legend("topright",
           legend = c("Random Removal Trials", sprintf("Random Mean (%.4f)", mean_rand), sprintf("Top-1 Influential (%.4f)", top1_drop)),
           fill = c("#bbdefb", NA, NA), border = c("#1976d2", NA, NA),
           col = c(NA, "#0d47a1", "#d50000"), lty = c(NA, 2, 1), lwd = c(NA, 2, 3), bty = "n")
  }
  dev.off()
  saved_plots$random_vs_influential <- plot_path_5
  
  cat("All 5 explanation charts generated successfully in", output_dir, "\n")
  invisible(saved_plots)
}

# If run directly from Rscript
if (!interactive()) {
  args <- commandArgs(trailingOnly = TRUE)
  json_file <- if (length(args) >= 1) args[1] else "result/case_03_explain.json"
  out_dir <- if (length(args) >= 2) args[2] else "result/plots"
  generate_explanation_plots(json_file, out_dir)
}
