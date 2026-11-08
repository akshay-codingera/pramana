# scripts/split_dataset.R
# PRAMANA: Phase 6 - Scientifically Valid Dataset Splitting in R
#
# Implements chronological dataset splitting to prevent data leakage:
# 1. Filters for substantive outcomes (ALLOWED vs DISMISSED)
# 2. Partitions chronologically (e.g. Training: past, Validation: intermediate, Test: future)
# 3. Groups by case_id / CNR to prevent cross-split leakage
# 4. Exports train_cases.csv, val_cases.csv, test_cases.csv
# 5. Generates split summary and leakage audit report

suppressPackageStartupMessages({
  library(dplyr)
  library(readr)
})

WORKSPACE <- "D:/Projects/pramana"
LEGAL_CASES_PATH <- file.path(WORKSPACE, "data/processed/legal_cases.csv")
TRAIN_DIR <- file.path(WORKSPACE, "data/train")
VAL_DIR <- file.path(WORKSPACE, "data/validation")
TEST_DIR <- file.path(WORKSPACE, "data/test")
REPORT_PATH <- file.path(WORKSPACE, "result/dataset_audit/split_summary.md")

dir.create(TRAIN_DIR, recursive = TRUE, showWarnings = FALSE)
dir.create(VAL_DIR, recursive = TRUE, showWarnings = FALSE)
dir.create(TEST_DIR, recursive = TRUE, showWarnings = FALSE)
dir.create(dirname(REPORT_PATH), recursive = TRUE, showWarnings = FALSE)

# Parse command line arguments
args <- commandArgs(trailingOnly = TRUE)
get_arg <- function(flag, default_val) {
  idx <- which(args == flag)
  if (length(idx) > 0 && idx < length(args)) {
    return(args[idx + 1])
  }
  return(default_val)
}

train_end_year <- as.integer(get_arg("--train-end", "1953"))
val_start_year <- as.integer(get_arg("--val-start", "1954"))
val_end_year <- as.integer(get_arg("--val-end", "1954"))
test_start_year <- as.integer(get_arg("--test-start", "1955"))
test_end_year <- as.integer(get_arg("--test-end", "1955"))

cat("================================================================\n")
cat("PRAMANA DATASET SPLITTING ENGINE\n")
cat(sprintf("Train Period: Up to %d\n", train_end_year))
cat(sprintf("Validation Period: %d to %d\n", val_start_year, val_end_year))
cat(sprintf("Test Period: %d to %d\n", test_start_year, test_end_year))
cat("================================================================\n\n")

cat("Reading master legal cases...\n")
df <- read.csv(LEGAL_CASES_PATH, stringsAsFactors = FALSE)
cat(sprintf("Total registered cases: %d\n", nrow(df)))

# Filter for substantive outcomes only
substantive_df <- df[df$normalized_outcome %in% c("ALLOWED", "DISMISSED"), ]
cat(sprintf("Total substantive cases (ALLOWED / DISMISSED): %d\n", nrow(substantive_df)))

# Restrict to available processed years window
min_year <- min(substantive_df$year, na.rm = TRUE)
max_split_year <- test_end_year

scope_df <- substantive_df[substantive_df$year <= max_split_year, ]
cat(sprintf("Cases in selected years (%d - %d): %d\n", min_year, max_split_year, nrow(scope_df)))

# Chronological partition
train_set <- scope_df[scope_df$year <= train_end_year, ]
val_set   <- scope_df[scope_df$year >= val_start_year & scope_df$year <= val_end_year, ]
test_set  <- scope_df[scope_df$year >= test_start_year & scope_df$year <= test_end_year, ]

# Strict leakage check across splits by case_id
train_cases <- unique(train_set$case_id)
val_cases   <- unique(val_set$case_id)
test_cases  <- unique(test_set$case_id)

train_val_overlap  <- intersect(train_cases, val_cases)
train_test_overlap <- intersect(train_cases, test_cases)
val_test_overlap   <- intersect(val_cases, test_cases)

# If any overlap exists, purge overlapping cases from val and test to keep train pure
if (length(train_val_overlap) > 0) {
  val_set <- val_set[!(val_set$case_id %in% train_val_overlap), ]
}
if (length(train_test_overlap) > 0) {
  test_set <- test_set[!(test_set$case_id %in% train_test_overlap), ]
}
if (length(val_test_overlap) > 0) {
  test_set <- test_set[!(test_set$case_id %in% val_test_overlap), ]
}

# Export splits
write.csv(train_set, file.path(TRAIN_DIR, "train_cases.csv"), row.names = FALSE)
write.csv(val_set,   file.path(VAL_DIR, "val_cases.csv"), row.names = FALSE)
write.csv(test_set,  file.path(TEST_DIR, "test_cases.csv"), row.names = FALSE)

# Generate Class Distributions
calc_dist <- function(subset, name) {
  n <- nrow(subset)
  n_allowed <- sum(subset$normalized_outcome == "ALLOWED")
  n_dismissed <- sum(subset$normalized_outcome == "DISMISSED")
  pct_allowed <- if (n > 0) round(n_allowed / n * 100, 2) else 0
  pct_dismissed <- if (n > 0) round(n_dismissed / n * 100, 2) else 0
  
  data.frame(
    Split = name,
    Total_Cases = n,
    Allowed = n_allowed,
    Pct_Allowed = paste0(pct_allowed, "%"),
    Dismissed = n_dismissed,
    Pct_Dismissed = paste0(pct_dismissed, "%"),
    stringsAsFactors = FALSE
  )
}

dist_df <- rbind(
  calc_dist(train_set, "Training"),
  calc_dist(val_set, "Validation"),
  calc_dist(test_set, "Held-Out Test")
)

# Output summary report
report_content <- paste0(
  "# PRAMANA Chronological Dataset Split Summary\n\n",
  "**Generated:** ", format(Sys.time(), "%Y-%m-%d %H:%M:%S"), "\n\n",
  "## 1. Split Definition\n",
  "- **Training Period:** 1950 – ", train_end_year, "\n",
  "- **Validation Period:** ", val_start_year, " – ", val_end_year, "\n",
  "- **Independent Held-Out Test Period:** ", test_start_year, " – ", test_end_year, "\n\n",
  "## 2. Partition Sizes & Natural Class Balance\n\n",
  "| Split | Total Cases | Allowed (n) | Allowed (%) | Dismissed (n) | Dismissed (%) |\n",
  "|---|---|---|---|---|---|\n",
  paste(
    apply(dist_df, 1, function(r) {
      paste0("| ", r["Split"], " | ", r["Total_Cases"], " | ", r["Allowed"], " | ", r["Pct_Allowed"], " | ", r["Dismissed"], " | ", r["Pct_Dismissed"], " |")
    }),
    collapse = "\n"
  ),
  "\n\n",
  "## 3. Data Leakage Verification\n",
  "- **Train-Validation Overlapping Cases:** ", length(train_val_overlap), "\n",
  "- **Train-Test Overlapping Cases:** ", length(train_test_overlap), "\n",
  "- **Validation-Test Overlapping Cases:** ", length(val_test_overlap), "\n",
  "- **Status:** ", if (length(train_test_overlap) == 0 && length(train_val_overlap) == 0) "PASSED (Zero Leakage)" else "PURGED (Enforced Zero Leakage)", "\n\n",
  "## 4. File Manifest\n",
  "- `data/train/train_cases.csv` (", nrow(train_set), " cases)\n",
  "- `data/validation/val_cases.csv` (", nrow(val_set), " cases)\n",
  "- `data/test/test_cases.csv` (", nrow(test_set), " cases)\n"
)

writeLines(report_content, REPORT_PATH)
cat(sprintf("Split summary report authored to: %s\n\n", REPORT_PATH))
cat("Summary:\n")
print(dist_df)
cat("\nSplit operation completed successfully.\n")
