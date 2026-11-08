# scripts/audit_phase1_dataset.R
# Phase 1: Comprehensive Dataset Audit

suppressPackageStartupMessages({
  library(nanoparquet)
  library(dplyr)
  library(stringr)
  library(jsonlite)
})

WORKSPACE <- "D:/Projects/pramana"
setwd(WORKSPACE)

cat("====================================================================\n")
cat("PHASE 1: DATASET AUDIT EXECUTION\n")
cat("====================================================================\n\n")

# 1. Inspect Archives and Expected PDF Counts from Index Files
cat("1. Auditing source archives and index JSONs...\n")
index_files <- list.files("data/source/indexes", pattern = "\\.index\\.json$", full.names = TRUE, recursive = TRUE)
tar_files <- list.files("data/source/english_archives", pattern = "\\.tar$", full.names = TRUE, recursive = TRUE)

cat(sprintf("Found %d TAR archives and %d index JSON files.\n", length(tar_files), length(index_files)))

total_expected_pdfs <- 0
index_counts_by_year <- data.frame(year = integer(0), expected_pdfs = integer(0))

for (idx_file in index_files) {
  tryCatch({
    data <- jsonlite::fromJSON(idx_file)
    yr <- as.integer(sub(".*year=(\\d+).*", "\\1", idx_file))
    cnt <- if (!is.null(data$file_count)) data$file_count else length(data$files)
    total_expected_pdfs <- total_expected_pdfs + cnt
    index_counts_by_year <- rbind(index_counts_by_year, data.frame(year = yr, expected_pdfs = cnt))
  }, error = function(e) {})
}

cat(sprintf("Total expected PDF documents across all index files: %d\n\n", total_expected_pdfs))

# 2. Inspect Extracted Text Files on Disk
cat("2. Auditing extracted text files in data/processed/extracted_text/...\n")
text_files <- list.files("data/processed/extracted_text", pattern = "\\.txt$", full.names = TRUE, recursive = TRUE)
cat(sprintf("Total extracted text files on disk: %d\n", length(text_files)))

# File size audit
file_sizes <- file.size(text_files)
empty_files <- sum(is.na(file_sizes) | file_sizes == 0)
tiny_files <- sum(!is.na(file_sizes) & file_sizes > 0 & file_sizes < 200) # Less than ~30 words
usable_files <- sum(!is.na(file_sizes) & file_sizes >= 200)

cat(sprintf("  Empty files (0 bytes): %d\n", empty_files))
cat(sprintf("  Tiny / corrupted files (< 200 bytes): %d\n", tiny_files))
cat(sprintf("  Usable text files (>= 200 bytes): %d\n", usable_files))

# Extract year from path
text_years <- as.integer(sub(".*year=(\\d+).*", "\\1", text_files))
extracted_by_year <- as.data.frame(table(year = text_years))
colnames(extracted_by_year) <- c("year", "extracted_count")
extracted_by_year$year <- as.integer(as.character(extracted_by_year$year))

# 3. Inspect Master Metadata Parquet Files
cat("\n3. Auditing master metadata Parquet files...\n")
parquet_files <- list.files("data/source/metadata_parquet", pattern = "\\.parquet$", full.names = TRUE, recursive = TRUE)
cat(sprintf("Found %d annual metadata Parquet files.\n", length(parquet_files)))

meta_dfs <- lapply(parquet_files, nanoparquet::read_parquet)
master_meta <- do.call(rbind, meta_dfs)
cat(sprintf("Total records in master metadata: %d records across %d columns.\n", nrow(master_meta), ncol(master_meta)))

# Missing value audit
missing_summary <- sapply(master_meta, function(x) sum(is.na(x) | str_trim(as.character(x)) == "" | x == "None"))
missing_df <- data.frame(
  Column = names(missing_summary),
  Missing_Count = as.integer(missing_summary),
  Missing_Pct = round(as.integer(missing_summary) / nrow(master_meta) * 100, 2)
)

# 4. Label Definition and Cohort Analysis
cat("\n4. Auditing outcome labels in metadata (disposal_nature)...\n")
clean_disp <- tolower(str_trim(as.character(master_meta$disposal_nature)))

is_allowed <- grepl("^(appeal\\(s\\)\\s+allowed|case\\s+allowed|leave\\s+granted\\s+&\\s+allowed|allowed)$", clean_disp) |
  (grepl("allowed", clean_disp) & !grepl("part|dismiss|dispos", clean_disp))

is_dismissed <- grepl("^(dismissed|leave\\s+granted\\s+&\\s+dismissed)$", clean_disp) |
  (grepl("dismissed", clean_disp) & !grepl("part|allow|dispos", clean_disp))

is_partly_allowed <- grepl("partly\\s+allowed|partially\\s+allowed", clean_disp)
is_disposed <- grepl("disposed|remand|withdrawn|settled|compromise", clean_disp) & !is_allowed & !is_dismissed

cat(sprintf("  ALLOWED cases: %d (%.2f%%)\n", sum(is_allowed), sum(is_allowed)/nrow(master_meta)*100))
cat(sprintf("  DISMISSED cases: %d (%.2f%%)\n", sum(is_dismissed), sum(is_dismissed)/nrow(master_meta)*100))
cat(sprintf("  Partly Allowed cases: %d (%.2f%%)\n", sum(is_partly_allowed), sum(is_partly_allowed)/nrow(master_meta)*100))
cat(sprintf("  Disposed / Other cases: %d (%.2f%%)\n", sum(is_disposed), sum(is_disposed)/nrow(master_meta)*100))
cat(sprintf("  Unlabeled / Missing disposal: %d (%.2f%%)\n", 
            nrow(master_meta) - (sum(is_allowed) + sum(is_dismissed) + sum(is_partly_allowed) + sum(is_disposed)),
            (nrow(master_meta) - (sum(is_allowed) + sum(is_dismissed) + sum(is_partly_allowed) + sum(is_disposed)))/nrow(master_meta)*100))

substantive_total <- sum(is_allowed) + sum(is_dismissed)
cat(sprintf("  Total Substantive Binary Cohort (ALLOWED + DISMISSED): %d cases\n", substantive_total))

# 5. Duplicates, Identifiers, and Grouping Audit
cat("\n5. Auditing identifiers, citations, CNRs, and duplicates...\n")
# CNR audit
non_empty_cnr <- sum(!is.na(master_meta$cnr) & master_meta$cnr != "" & master_meta$cnr != "None")
cat(sprintf("  Records with valid CNR: %d (%.2f%%)\n", non_empty_cnr, non_empty_cnr/nrow(master_meta)*100))

# Citation audit
non_empty_cit <- sum(!is.na(master_meta$citation) & master_meta$citation != "" & master_meta$citation != "None")
cat(sprintf("  Records with valid Citation: %d (%.2f%%)\n", non_empty_cit, non_empty_cit/nrow(master_meta)*100))

# Group key generation
group_keys <- ifelse(!is.na(master_meta$citation) & master_meta$citation != "" & master_meta$citation != "None",
                     paste0("CIT_", master_meta$citation),
                     ifelse(!is.na(master_meta$cnr) & master_meta$cnr != "" & master_meta$cnr != "None",
                            paste0("CNR_", master_meta$cnr),
                            paste0("CASE_", master_meta$case_id)))

total_unique_groups <- length(unique(group_keys))
connected_petitions_count <- nrow(master_meta) - total_unique_groups
cat(sprintf("  Unique Judgment Groups: %d\n", total_unique_groups))
cat(sprintf("  Connected / Batch Petitions sharing same group: %d cases\n", connected_petitions_count))

# Multiple PDFs representing same judgment
stems <- master_meta$path
dup_stems <- sum(duplicated(stems))
cat(sprintf("  Duplicate path stems in metadata: %d\n", dup_stems))

# Export audit summary tables
dir.create("reports/audit_data", recursive = TRUE, showWarnings = FALSE)
write.csv(missing_df, "reports/audit_data/metadata_missing_summary.csv", row.names = FALSE)

# Combined year breakdown
all_years <- sort(unique(c(index_counts_by_year$year, extracted_by_year$year, master_meta$year)))
year_audit <- data.frame(year = all_years)
year_audit <- merge(year_audit, index_counts_by_year, by = "year", all.x = TRUE)
year_audit <- merge(year_audit, extracted_by_year, by = "year", all.x = TRUE)

meta_by_year <- as.data.frame(table(year = master_meta$year))
colnames(meta_by_year) <- c("year", "metadata_records")
meta_by_year$year <- as.integer(as.character(meta_by_year$year))
year_audit <- merge(year_audit, meta_by_year, by = "year", all.x = TRUE)

year_audit[is.na(year_audit)] <- 0
write.csv(year_audit, "reports/audit_data/year_by_year_audit.csv", row.names = FALSE)

cat("\nPhase 1 audit complete. Saved audit tables to reports/audit_data/\n")
cat("====================================================================\n")
