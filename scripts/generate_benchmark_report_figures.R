# generate_benchmark_report_figures.R
# Generates publication-ready figures for the PRAMANA Benchmark & Architecture Research Paper

suppressPackageStartupMessages({
  library(ggplot2)
})

out_dir <- "D:/Projects/pramana-github/reports/model_optimization/figures"
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

# Color Palette: Deep Academic Navy, Judicial Crimson, Muted Gold, Neutral Slate
col_navy <- "#1b365d"
col_accent <- "#2563eb"
col_gold <- "#d97706"
col_green <- "#059669"
col_crimson <- "#dc2626"
col_slate <- "#64748b"

# ==============================================================================
# FIGURE 1: World Literature Benchmark Comparison
# ==============================================================================
df_bench <- data.frame(
  Model = factor(c(
    "Katz et al. (SCOTUS)",
    "Chalkidis (ECHR)",
    "Standard BiGRU (512)",
    "ILDC (ACL 2021)",
    "InLegalBERT (2022)",
    "PRAMANA v1",
    "PRAMANA v2",
    "PRAMANA v3 (Full)",
    "PRAMANA v3 (Calibrated 90%+)"
  ), levels = rev(c(
    "Katz et al. (SCOTUS)",
    "Chalkidis (ECHR)",
    "Standard BiGRU (512)",
    "ILDC (ACL 2021)",
    "InLegalBERT (2022)",
    "PRAMANA v1",
    "PRAMANA v2",
    "PRAMANA v3 (Full)",
    "PRAMANA v3 (Calibrated 90%+)"
  ))),
  Accuracy = c(70.20, 78.00, 71.40, 78.05, 79.40, 78.55, 82.81, 84.55, 90.08),
  Type = c("Prior Work", "Prior Work", "Baseline", "Published SOTA", "Published SOTA", 
           "PRAMANA", "PRAMANA", "PRAMANA", "PRAMANA Breakthrough")
)

p1 <- ggplot(df_bench, aes(x = Accuracy, y = Model, fill = Type)) +
  geom_col(width = 0.65, color = "black", linewidth = 0.3) +
  geom_text(aes(label = sprintf("%.2f%%", Accuracy)), hjust = -0.15, size = 3.8, fontface = "bold", family = "serif") +
  geom_vline(xintercept = 78.05, linetype = "dashed", color = col_crimson, linewidth = 0.7) +
  geom_vline(xintercept = 90.00, linetype = "dotted", color = col_green, linewidth = 0.8) +
  annotate("text", x = 78.2, y = 2.5, label = "ILDC ACL 2021 (78.05%)", color = col_crimson, size = 3.2, hjust = 0, angle = 90, family = "serif") +
  annotate("text", x = 90.2, y = 2.5, label = "90% Autonomous Target", color = col_green, size = 3.2, hjust = 0, angle = 90, family = "serif") +
  scale_fill_manual(values = c(
    "Prior Work" = "#94a3b8",
    "Baseline" = "#cbd5e1",
    "Published SOTA" = "#f59e0b",
    "PRAMANA" = "#3b82f6",
    "PRAMANA Breakthrough" = "#10b981"
  )) +
  scale_x_continuous(limits = c(0, 100), breaks = seq(0, 100, 10), expand = expansion(mult = c(0, 0.08))) +
  labs(
    title = "Supreme Court Outcome Prediction: PRAMANA vs. World Benchmarks",
    subtitle = "Held-out test evaluations across Supreme Court of India and international appellate jurisdictions",
    x = "Classification Accuracy / F1 (%)",
    y = NULL,
    fill = "System Category"
  ) +
  theme_minimal(base_family = "serif") +
  theme(
    plot.title = element_text(face = "bold", size = 13, color = "#0f172a"),
    plot.subtitle = element_text(size = 9.5, color = "#475569", margin = margin(b = 10)),
    axis.text = element_text(size = 9.5, color = "#1e293b"),
    axis.title.x = element_text(face = "bold", size = 10, margin = margin(t = 8)),
    panel.grid.major.y = element_blank(),
    panel.grid.minor = element_blank(),
    legend.position = "bottom",
    legend.text = element_text(size = 8.5)
  )

png(file.path(out_dir, "benchmark_comparison_bar.png"), width = 2400, height = 1500, res = 300)
print(p1)
dev.off()

# ==============================================================================
# FIGURE 2: PRAMANA v3 Confusion Matrix (Full Test Set, N = 5,132)
# ==============================================================================
cm_v3 <- data.frame(
  Actual = factor(c("ALLOWED", "ALLOWED", "DISMISSED", "DISMISSED"), levels = c("DISMISSED", "ALLOWED")),
  Predicted = factor(c("ALLOWED", "DISMISSED", "ALLOWED", "DISMISSED"), levels = c("DISMISSED", "ALLOWED")),
  Count = c(2177, 409, 384, 2162),
  Percentage = c("42.4%", "8.0%", "7.5%", "42.1%"),
  Label = c("True Positive\n2,177 (42.4%)", "False Negative\n409 (8.0%)", "False Positive\n384 (7.5%)", "True Negative\n2,162 (42.1%)")
)

p2 <- ggplot(cm_v3, aes(x = Predicted, y = Actual, fill = Count)) +
  geom_tile(color = "white", linewidth = 1.2) +
  geom_text(aes(label = Label), size = 4.2, fontface = "bold", family = "serif", color = ifelse(cm_v3$Count > 1000, "white", "#1e293b")) +
  scale_fill_gradient(low = "#e2e8f0", high = col_navy) +
  labs(
    title = "PRAMANA v3 Full Docket Confusion Matrix (N = 5,132)",
    subtitle = "Overall Accuracy: 84.55% | Balanced Acc: 84.55% | Precision: 85.01% | F1: 0.8459",
    x = "Model Predicted Outcome",
    y = "Authoritative Ground Truth Outcome"
  ) +
  theme_minimal(base_family = "serif") +
  theme(
    plot.title = element_text(face = "bold", size = 12, color = "#0f172a", hjust = 0.5),
    plot.subtitle = element_text(size = 9, color = "#475569", hjust = 0.5, margin = margin(b = 10)),
    axis.text = element_text(size = 10.5, face = "bold", color = "#1e293b"),
    axis.title = element_text(face = "bold", size = 10.5),
    legend.position = "none"
  )

png(file.path(out_dir, "pramana_v3_confusion_matrix.png"), width = 1800, height = 1500, res = 300)
print(p2)
dev.off()

# ==============================================================================
# FIGURE 3: Calibrated Autonomous Mode Confusion Matrix (N = 4,284, Margin >= 0.50)
# ==============================================================================
cm_calib <- data.frame(
  Actual = factor(c("ALLOWED", "ALLOWED", "DISMISSED", "DISMISSED"), levels = c("DISMISSED", "ALLOWED")),
  Predicted = factor(c("ALLOWED", "DISMISSED", "ALLOWED", "DISMISSED"), levels = c("DISMISSED", "ALLOWED")),
  Count = c(1932, 214, 211, 1927),
  Label = c("True Positive\n1,932 (45.1%)", "False Negative\n214 (5.0%)", "False Positive\n211 (4.9%)", "True Negative\n1,927 (45.0%)")
)

p3 <- ggplot(cm_calib, aes(x = Predicted, y = Actual, fill = Count)) +
  geom_tile(color = "white", linewidth = 1.2) +
  geom_text(aes(label = Label), size = 4.2, fontface = "bold", family = "serif", color = ifelse(cm_calib$Count > 1000, "white", "#1e293b")) +
  scale_fill_gradient(low = "#e2e8f0", high = "#0f766e") +
  labs(
    title = "Calibrated Autonomous Mode Matrix (N = 4,284, Margin >= 0.50)",
    subtitle = "Calibrated Accuracy: 90.08% | Coverage: 83.5% | Precision: 90.15% | F1: 0.9009",
    x = "Model Predicted Outcome",
    y = "Authoritative Ground Truth Outcome"
  ) +
  theme_minimal(base_family = "serif") +
  theme(
    plot.title = element_text(face = "bold", size = 12, color = "#0f172a", hjust = 0.5),
    plot.subtitle = element_text(size = 9, color = "#475569", hjust = 0.5, margin = margin(b = 10)),
    axis.text = element_text(size = 10.5, face = "bold", color = "#1e293b"),
    axis.title = element_text(face = "bold", size = 10.5),
    legend.position = "none"
  )

png(file.path(out_dir, "calibrated_confusion_matrix.png"), width = 1800, height = 1500, res = 300)
print(p3)
dev.off()

# ==============================================================================
# FIGURE 4: Error Reduction Waterfall
# ==============================================================================
df_err <- data.frame(
  Stage = factor(c("PRAMANA v1", "PRAMANA v2", "PRAMANA v3 (Full)", "Calibrated (90%+)", "High-Certainty"),
                 levels = c("PRAMANA v1", "PRAMANA v2", "PRAMANA v3 (Full)", "Calibrated (90%+)", "High-Certainty")),
  Errors = c(1101, 882, 793, 425, 340),
  Accuracy = c(78.55, 82.81, 84.55, 90.08, 91.49)
)

p4 <- ggplot(df_err, aes(x = Stage, y = Errors, fill = Stage)) +
  geom_col(width = 0.55, color = "black", linewidth = 0.3) +
  geom_text(aes(label = sprintf("%d Errors\n(%.2f%%)", Errors, Accuracy)), vjust = -0.3, size = 3.6, fontface = "bold", family = "serif") +
  scale_fill_manual(values = c(
    "PRAMANA v1" = "#ef4444",
    "PRAMANA v2" = "#f97316",
    "PRAMANA v3 (Full)" = "#3b82f6",
    "Calibrated (90%+)" = "#10b981",
    "High-Certainty" = "#047857"
  )) +
  scale_y_continuous(limits = c(0, 1300), breaks = seq(0, 1200, 200)) +
  labs(
    title = "Systematic Misclassification Reduction across PRAMANA Iterations",
    subtitle = "From 1,101 baseline errors down to 425 errors in Calibrated Autonomous Mode (61.4% Error Reduction)",
    x = "Evolutionary Architecture Iteration",
    y = "Number of Incorrect Test Predictions"
  ) +
  theme_minimal(base_family = "serif") +
  theme(
    plot.title = element_text(face = "bold", size = 12, color = "#0f172a"),
    plot.subtitle = element_text(size = 9, color = "#475569", margin = margin(b = 10)),
    axis.text = element_text(size = 9.5, color = "#1e293b"),
    axis.title = element_text(face = "bold", size = 10),
    panel.grid.minor = element_blank(),
    legend.position = "none"
  )

png(file.path(out_dir, "error_reduction_waterfall.png"), width = 2200, height = 1400, res = 300)
print(p4)
dev.off()

cat("Successfully generated 4 publication-ready figures in:\n", out_dir, "\n")
