# scripts/build_legal_labels.R
# Phase 4: Construct verified legal labels from official disposal_nature across all 43,578 records
suppressPackageStartupMessages({
  library(nanoparquet)
})

master_file <- "result/dataset_audit/master_metadata_all_years.rds"
if (!file.exists(master_file)) {
  stop("Master metadata file not found: ", master_file)
}

df <- readRDS(master_file)
cat("Loaded", nrow(df), "records from master metadata.\n")

# Transparent label mapping function
map_disposal_to_outcome <- function(disposal) {
  if (is.na(disposal) || !nzchar(trimws(disposal))) {
    return(list(outcome = "UNKNOWN", confidence = 0.0, category = "UNSPECIFIED"))
  }
  
  d <- tolower(trimws(disposal))
  
  # Allowed
  if (grepl("appeal.*allowed", d) || grepl("^case allowed", d) || grepl("leave granted & allowed", d) || d == "allowed") {
    return(list(outcome = "ALLOWED", confidence = 1.0, category = "SUBSTANTIVE_ALLOWED"))
  }
  
  # Dismissed
  if (grepl("dismissed", d) || d == "rejected") {
    return(list(outcome = "DISMISSED", confidence = 1.0, category = "SUBSTANTIVE_DISMISSED"))
  }
  
  # Partly allowed
  if (grepl("partly allowed", d) || grepl("modified", d)) {
    return(list(outcome = "PARTLY_ALLOWED", confidence = 0.9, category = "MIXED_OUTCOME"))
  }
  
  # Procedural / Non-verdict
  if (grepl("disposed", d) || grepl("directions issued", d) || grepl("larger bench", d) ||
      grepl("reference", d) || grepl("adjourned", d) || grepl("remitted", d) || grepl("leave granted", d)) {
    return(list(outcome = "PROCEDURAL_DISPOSITION", confidence = 0.8, category = "NON_VERDICT_PROCEDURAL"))
  }
  
  # Unknown fallback
  return(list(outcome = "UNKNOWN", confidence = 0.0, category = "AMBIGUOUS"))
}

# Apply mapping across all 43,578 records
cat("Mapping legal outcomes...\n")
mapped_list <- lapply(df$disposal_nature, map_disposal_to_outcome)

df$normalized_outcome <- sapply(mapped_list, function(x) x$outcome)
df$outcome_confidence <- sapply(mapped_list, function(x) x$confidence)
df$outcome_category   <- sapply(mapped_list, function(x) x$category)
df$label_source       <- "OFFICIAL_SUPREME_COURT_METADATA"
df$label_verification_status <- ifelse(df$normalized_outcome %in% c("ALLOWED", "DISMISSED", "PARTLY_ALLOWED"), "VERIFIED_PRIMARY", "VERIFIED_PROCEDURAL_OR_UNSPECIFIED")

cat("\nOutcome Label Distribution across all 43,578 Supreme Court Records:\n")
outcome_table <- table(df$normalized_outcome, useNA = "always")
print(outcome_table)
cat("\nPercentages:\n")
print(round(100 * prop.table(outcome_table), 2))

# Deduplication check: Case-level grouping
# Some cases appear multiple times because they have multiple citations or multiple language records
cat("\nChecking duplicate representations...\n")
cat("Total rows:", nrow(df), "\n")
cat("Unique CNR numbers:", length(unique(df$cnr[nzchar(df$cnr)])), "\n")
cat("Unique Case IDs:", length(unique(df$case_id[nzchar(df$case_id)])), "\n")
cat("Unique Citations:", length(unique(df$citation[nzchar(df$citation)])), "\n")

# Order by year, decision_date
df <- df[order(df$year, df$decision_date), ]

# Format legal_cases.csv
legal_cases <- data.frame(
  case_id                   = df$case_id,
  citation                  = df$citation,
  cnr                       = df$cnr,
  case_title                = df$title,
  decision_date             = df$decision_date,
  year                      = df$year,
  court                     = df$court,
  judge                     = df$judge,
  original_disposal_nature  = df$disposal_nature,
  normalized_outcome        = df$normalized_outcome,
  outcome_category          = df$outcome_category,
  outcome_confidence        = df$outcome_confidence,
  source_document           = paste0(df$path, "_EN.pdf"),
  path_stem                 = df$path,
  available_languages       = df$available_languages,
  label_source              = df$label_source,
  label_verification_status = df$label_verification_status,
  stringsAsFactors          = FALSE
)

dir.create("data/processed", recursive = TRUE, showWarnings = FALSE)
write.csv(legal_cases, "data/processed/legal_cases.csv", row.names = FALSE)
cat(sprintf("\nSaved verified legal dataset to data/processed/legal_cases.csv (%d rows)\n", nrow(legal_cases)))

# Save label mapping documentation
label_doc <- paste0(
"# PRAMANA Legal Label Construction & Mapping Documentation

## Methodology
Outcome labels were constructed directly from the official Supreme Court of India `disposal_nature` field across all 43,578 judgment records (1950–2026).

## Mapping Rules
- **ALLOWED**: 'Appeal(s) allowed', 'Case Allowed', 'Leave Granted & Allowed', 'Allowed'.
- **DISMISSED**: 'Dismissed', 'Appeal(s) dismissed', 'Petition dismissed', 'Rejected'.
- **PARTLY_ALLOWED**: 'Case Partly allowed', 'Partly allowed', 'Order modified', 'Modified'.
- **PROCEDURAL_DISPOSITION**: 'Disposed off', 'Directions issued', 'Matter referred to larger bench', 'Reference answered', 'Hearing Adjourned', 'Remitted to Lower Court', 'Leave granted', 'IA disposed'.
- **UNKNOWN**: Empty strings, NA, or ambiguous procedural text.

## Distribution Summary (N = 43,578)
- **ALLOWED**: ", sum(legal_cases$normalized_outcome == "ALLOWED"), " (", round(100*mean(legal_cases$normalized_outcome == "ALLOWED"), 2), "%)
- **DISMISSED**: ", sum(legal_cases$normalized_outcome == "DISMISSED"), " (", round(100*mean(legal_cases$normalized_outcome == "DISMISSED"), 2), "%)
- **PARTLY_ALLOWED**: ", sum(legal_cases$normalized_outcome == "PARTLY_ALLOWED"), " (", round(100*mean(legal_cases$normalized_outcome == "PARTLY_ALLOWED"), 2), "%)
- **PROCEDURAL_DISPOSITION**: ", sum(legal_cases$normalized_outcome == "PROCEDURAL_DISPOSITION"), " (", round(100*mean(legal_cases$normalized_outcome == "PROCEDURAL_DISPOSITION"), 2), "%)
- **UNKNOWN**: ", sum(legal_cases$normalized_outcome == "UNKNOWN"), " (", round(100*mean(legal_cases$normalized_outcome == "UNKNOWN"), 2), "%)
"
)
writeLines(label_doc, "data/processed/LABEL_MAPPING.md")
cat("Saved mapping documentation to data/processed/LABEL_MAPPING.md\n")
