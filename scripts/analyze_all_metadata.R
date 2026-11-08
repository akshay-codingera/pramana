# scripts/analyze_all_metadata.R
# Complete metadata analysis across all 77 years (1950-2026) in PRAMANA
suppressPackageStartupMessages({
  library(nanoparquet)
})

parquet_files <- list.files("data/source/metadata_parquet", pattern = "\\.parquet$", recursive = TRUE, full.names = TRUE)
cat(sprintf("Found %d Parquet metadata files in data/source/metadata_parquet/\n", length(parquet_files)))

if (length(parquet_files) == 0) {
  cat("No parquet files found.\n")
  quit(status = 1)
}

# Read and bind all parquet files
dfs <- list()
for (f in parquet_files) {
  tryCatch({
    df_y <- read_parquet(f)
    dfs[[length(dfs) + 1]] <- df_y
  }, error = function(e) {
    cat("Error reading", f, ":", e$message, "\n")
  })
}

master_df <- do.call(rbind, dfs)
cat(sprintf("\nSuccessfully loaded %d total case records across %d years!\n",
            nrow(master_df), length(unique(master_df$year))))

cat("Memory footprint:", round(object.size(master_df) / (1024^2), 2), "MB\n")

# Summary of fields
cat("\nSummary of Fields:\n")
for (col in colnames(master_df)) {
  na_count <- sum(is.na(master_df[[col]]) | master_df[[col]] == "")
  cat(sprintf("  %-20s: %6d non-empty (%5.1f%% populated)\n",
              col, nrow(master_df) - na_count, 100 * (1 - na_count / nrow(master_df))))
}

# Unique cases
n_unique_case_id <- length(unique(master_df$case_id[nzchar(master_df$case_id)]))
n_unique_cnr <- length(unique(master_df$cnr[nzchar(master_df$cnr)]))
n_unique_citation <- length(unique(master_df$citation[nzchar(master_df$citation)]))

cat("\nUniqueness Check:\n")
cat(sprintf("  Unique case_id values:  %d\n", n_unique_case_id))
cat(sprintf("  Unique cnr values:      %d\n", n_unique_cnr))
cat(sprintf("  Unique citations:       %d\n", n_unique_citation))

# Disposal Nature Distribution
cat("\nTop 20 Disposal Nature Values across all 1950-2026 Judgments:\n")
disp_table <- sort(table(ifelse(is.na(master_df$disposal_nature) | master_df$disposal_nature == "",
                                "[EMPTY_OR_UNSPECIFIED]", master_df$disposal_nature)), decreasing = TRUE)
print(head(disp_table, 20))

# Cases per decade
cat("\nCases by Decade:\n")
master_df$decade <- paste0(substr(as.character(master_df$year), 1, 3), "0s")
print(table(master_df$decade))

# Save master metadata summary
dir.create("result/dataset_audit", recursive = TRUE, showWarnings = FALSE)
saveRDS(master_df, "result/dataset_audit/master_metadata_all_years.rds")
cat("\nSaved master metadata data.frame to result/dataset_audit/master_metadata_all_years.rds\n")
