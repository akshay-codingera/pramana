# ==============================================================================
# PRAMANA — Indian Supreme Court Verdict Prediction Research
# Script: R/label_extraction.R
# Objective: Defensible extraction, mapping, and validation of judicial labels
# Author: Senior Data Engineer / ML Research Scientist
# ==============================================================================

suppressPackageStartupMessages({
  library(nanoparquet)
  library(dplyr)
  library(stringr)
})

cat("====================================================================\n")
cat("Starting Phase 2: Judicial Label Extraction and Mapping Pipeline\n")
cat("====================================================================\n\n")

# Ensure output directories exist
dir.create("reports/tables", recursive = TRUE, showWarnings = FALSE)

# Ingest all metadata Parquet files
parquet_files <- list.files("data/source/metadata_parquet", pattern = "\\.parquet$", full.names = TRUE, recursive = TRUE)
meta_list <- lapply(parquet_files, read_parquet)
all_meta <- do.call(rbind, meta_list)

cat(sprintf("Loaded %d metadata records for label extraction.\n", nrow(all_meta)))

# Function to extract and normalize legal outcomes
extract_normalized_verdict <- function(disposal_raw) {
  if (is.na(disposal_raw) || str_trim(disposal_raw) == "") {
    return(list(normalized = NA, category = "UNSPECIFIED", eligible_binary = FALSE, reason = "Missing disposal field"))
  }
  
  disp_clean <- tolower(str_trim(disposal_raw))
  
  # 1. Substantive Rulings: ALLOWED
  if (grepl("^(appeal\\(s\\)\\s+allowed|case\\s+allowed|leave\\s+granted\\s+&\\s+allowed|allowed)$", disp_clean) ||
      (grepl("allowed", disp_clean) && !grepl("part|dismiss|dispos", disp_clean))) {
    return(list(normalized = "ALLOWED", category = "MERITS_ALLOWED", eligible_binary = TRUE, reason = "Substantive grant of appeal/petition"))
  }
  
  # 2. Substantive Rulings: DISMISSED
  if (grepl("^(dismissed|leave\\s+granted\\s+&\\s+dismissed)$", disp_clean) ||
      (grepl("dismissed", disp_clean) && !grepl("part|allow|dispos", disp_clean))) {
    return(list(normalized = "DISMISSED", category = "MERITS_DISMISSED", eligible_binary = TRUE, reason = "Substantive rejection/dismissal of appeal"))
  }
  
  # 3. Mixed Rulings: PARTIALLY ALLOWED / MODIFIED (Excluded from binary)
  if (grepl("partly|partially|modified", disp_clean)) {
    return(list(normalized = "PARTIALLY_ALLOWED", category = "MIXED_OUTCOME", eligible_binary = FALSE, reason = "Partial relief granted; ambiguous binary status"))
  }
  
  # 4. Procedural Closures: DISPOSED OF (Excluded from binary)
  if (grepl("disposed", disp_clean)) {
    return(list(normalized = "DISPOSED_OF", category = "PROCEDURAL_DISPOSAL", eligible_binary = FALSE, reason = "Disposed on consent, terms, or without decision on merits"))
  }
  
  # 5. Remanded / Remitted to Lower Court (Excluded from binary)
  if (grepl("remand|remitted", disp_clean)) {
    return(list(normalized = "REMANDED", category = "PROCEDURAL_REMAND", eligible_binary = FALSE, reason = "Case remitted to lower court for fresh adjudication"))
  }
  
  # 6. Withdrawn by Petioner (Excluded from binary)
  if (grepl("withdrawn", disp_clean)) {
    return(list(normalized = "WITHDRAWN", category = "PROCEDURAL_WITHDRAWAL", eligible_binary = FALSE, reason = "Withdrawn by parties; no judicial determination"))
  }
  
  # 7. Interlocutory / References (Excluded from binary)
  if (grepl("adjourned|reference|larger bench|directions", disp_clean)) {
    return(list(normalized = "INTERLOCUTORY", category = "INTERLOCUTORY_ORDER", eligible_binary = FALSE, reason = "Interlocutory direction or reference; not a final decision"))
  }
  
  return(list(normalized = "OTHER", category = "OTHER_UNCLASSIFIED", eligible_binary = FALSE, reason = "Unmapped miscellaneous disposition phrase"))
}

# Apply extraction across dataset
cat("Mapping and normalizing verdicts across all 43,578 records...\n")

norm_results <- lapply(all_meta$disposal_nature, extract_normalized_verdict)

all_meta$normalized_verdict <- sapply(norm_results, function(x) x$normalized)
all_meta$verdict_category <- sapply(norm_results, function(x) x$category)
all_meta$eligible_binary <- sapply(norm_results, function(x) x$eligible_binary)
all_meta$exclusion_reason <- sapply(norm_results, function(x) x$reason)

# Summary of mapping
mapping_summary <- all_meta %>%
  group_by(verdict_category, normalized_verdict, eligible_binary) %>%
  summarise(
    Count = n(),
    Percentage = round(100 * n() / nrow(all_meta), 2),
    Example_Raw = first(na.omit(disposal_nature)),
    .groups = "drop"
  ) %>%
  arrange(desc(Count))

write.csv(mapping_summary, "reports/tables/label_mapping_summary.csv", row.names = FALSE)
cat("Saved: reports/tables/label_mapping_summary.csv\n\n")

print(mapping_summary)
cat("\n")

# Exclusion Report
exclusion_summary <- all_meta %>%
  filter(!eligible_binary) %>%
  group_by(exclusion_reason, normalized_verdict) %>%
  summarise(
    Excluded_Cases = n(),
    Pct_of_Corpus = round(100 * n() / nrow(all_meta), 2),
    .groups = "drop"
  ) %>%
  arrange(desc(Excluded_Cases))

write.csv(exclusion_summary, "reports/tables/label_exclusion_report.csv", row.names = FALSE)
cat("Saved: reports/tables/label_exclusion_report.csv\n\n")
cat("Exclusion Report for Non-Binary / Ambiguous Cases:\n")
print(exclusion_summary)
cat("\n")

# Binary Dataset Cohort
binary_cohort <- all_meta %>% filter(eligible_binary)
cat(sprintf("Eligible High-Quality Binary Classification Cohort: %d cases (%.2f%% of full corpus)\n", 
            nrow(binary_cohort), 100 * nrow(binary_cohort) / nrow(all_meta)))
cat(sprintf("  - ALLOWED:   %d cases (%.2f%%)\n", 
            sum(binary_cohort$normalized_verdict == "ALLOWED"),
            100 * sum(binary_cohort$normalized_verdict == "ALLOWED") / nrow(binary_cohort)))
cat(sprintf("  - DISMISSED: %d cases (%.2f%%)\n", 
            sum(binary_cohort$normalized_verdict == "DISMISSED"),
            100 * sum(binary_cohort$normalized_verdict == "DISMISSED") / nrow(binary_cohort)))

cat("\nLabel Extraction and Validation Completed Successfully.\n")
cat("====================================================================\n")
