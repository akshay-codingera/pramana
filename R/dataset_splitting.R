# ==============================================================================
# PRAMANA — Indian Supreme Court Verdict Prediction Research
# Script: R/dataset_splitting.R
# Objective: Grouped Random Splitting to Prevent Contamination Across Partitions
# Author: Senior ML Engineer / Research Scientist
# ==============================================================================

suppressPackageStartupMessages({
  library(dplyr)
  library(stringr)
})

cat("====================================================================\n")
cat("Starting Phase 4: Grouped Random Dataset Partitioning in R\n")
cat("====================================================================\n\n")

source("R/data_loader.R")

dir.create("data/splits", recursive = TRUE, showWarnings = FALSE)
dir.create("reports/tables", recursive = TRUE, showWarnings = FALSE)

# 1. Load full substantive binary corpus
cat("Loading complete binary classification cohort (1950–2026)...\n")
binary_df <- load_binary_corpus()
cat(sprintf("Loaded %d binary cases (%d Allowed, %d Dismissed).\n\n", 
            nrow(binary_df),
            sum(binary_df$target_label == "ALLOWED"),
            sum(binary_df$target_label == "DISMISSED")))

# 2. Define Group Identifier (Citation or CNR or normalized Case Title)
# Multiple petitions decided by a single judgment share the same Citation or CNR.
binary_df$group_id <- ifelse(!is.na(binary_df$citation) & binary_df$citation != "", 
                             binary_df$citation, 
                             ifelse(!is.na(binary_df$cnr) & binary_df$cnr != "", 
                                    binary_df$cnr, 
                                    binary_df$case_id))

unique_groups <- unique(binary_df$group_id)
total_groups <- length(unique_groups)
cat(sprintf("Total distinct case groups (unique judgments): %d across %d petitions.\n", 
            total_groups, nrow(binary_df)))

# 3. Perform Stratified Grouped Split: 70% Train, 15% Validation, 15% Test
set.seed(42) # Ensure strict reproducibility

# Compute majority label per group for stratification
group_labels <- binary_df %>%
  group_by(group_id) %>%
  summarise(
    dominant_label = ifelse(mean(target_binary) >= 0.5, "ALLOWED", "DISMISSED"),
    case_count = n(),
    .groups = "drop"
  )

allowed_groups <- sample(group_labels$group_id[group_labels$dominant_label == "ALLOWED"])
dismissed_groups <- sample(group_labels$group_id[group_labels$dominant_label == "DISMISSED"])

split_groups <- function(grp_vec, train_p = 0.70, val_p = 0.15) {
  n <- length(grp_vec)
  n_tr <- round(n * train_p)
  n_va <- round(n * val_p)
  
  tr <- grp_vec[1:n_tr]
  va <- grp_vec[(n_tr + 1):(n_tr + n_va)]
  te <- grp_vec[(n_tr + n_va + 1):n]
  
  list(train = tr, val = va, test = te)
}

split_allowed <- split_groups(allowed_groups)
split_dismissed <- split_groups(dismissed_groups)

train_groups <- c(split_allowed$train, split_dismissed$train)
val_groups <- c(split_allowed$val, split_dismissed$val)
test_groups <- c(split_allowed$test, split_dismissed$test)

train_df <- binary_df[binary_df$group_id %in% train_groups, ]
val_df <- binary_df[binary_df$group_id %in% val_groups, ]
test_df <- binary_df[binary_df$group_id %in% test_groups, ]

# 4. Rigorous Overlap Verification
overlap_train_val <- intersect(train_df$group_id, val_df$group_id)
overlap_train_test <- intersect(train_df$group_id, test_df$group_id)
overlap_val_test <- intersect(val_df$group_id, test_df$group_id)

cat("--------------------------------------------------------------------\n")
cat("Verification of Group Isolation (Zero Cross-Split Leakage):\n")
cat(sprintf("  Overlap Train <-> Validation: %d cases\n", length(overlap_train_val)))
cat(sprintf("  Overlap Train <-> Test:       %d cases\n", length(overlap_train_test)))
cat(sprintf("  Overlap Val   <-> Test:       %d cases\n", length(overlap_val_test)))

if (length(overlap_train_val) > 0 || length(overlap_train_test) > 0 || length(overlap_val_test) > 0) {
  stop("FATAL: Cross-split leakage detected in grouped partitioning!")
}
cat("  Integrity: 100% Verified. Zero leakage across splits.\n")
cat("--------------------------------------------------------------------\n\n")

# 5. Save Split Partitions and Summary
write.csv(train_df, "data/splits/grouped_train.csv", row.names = FALSE)
write.csv(val_df, "data/splits/grouped_val.csv", row.names = FALSE)
write.csv(test_df, "data/splits/grouped_test.csv", row.names = FALSE)

summary_table <- data.frame(
  Split = c("Train (70%)", "Validation (15%)", "Test (15%)", "Total"),
  Total_Cases = c(nrow(train_df), nrow(val_df), nrow(test_df), nrow(binary_df)),
  Unique_Groups = c(length(train_groups), length(val_groups), length(test_groups), total_groups),
  Allowed_Count = c(sum(train_df$target_label == "ALLOWED"),
                    sum(val_df$target_label == "ALLOWED"),
                    sum(test_df$target_label == "ALLOWED"),
                    sum(binary_df$target_label == "ALLOWED")),
  Dismissed_Count = c(sum(train_df$target_label == "DISMISSED"),
                      sum(val_df$target_label == "DISMISSED"),
                      sum(test_df$target_label == "DISMISSED"),
                      sum(binary_df$target_label == "DISMISSED")),
  Allowed_Pct = c(
    round(100 * mean(train_df$target_label == "ALLOWED"), 2),
    round(100 * mean(val_df$target_label == "ALLOWED"), 2),
    round(100 * mean(test_df$target_label == "ALLOWED"), 2),
    round(100 * mean(binary_df$target_label == "ALLOWED"), 2)
  ),
  stringsAsFactors = FALSE
)

write.csv(summary_table, "reports/tables/split_verification.csv", row.names = FALSE)
cat("Dataset Split Summary Table:\n")
print(summary_table)
cat("\nSaved split CSV files to data/splits/ and reports/tables/split_verification.csv\n")
cat("====================================================================\n")
