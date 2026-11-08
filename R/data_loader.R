# ==============================================================================
# PRAMANA — Indian Supreme Court Verdict Prediction Research
# Script: R/data_loader.R
# Objective: Robust Data Loader for Indian Kanoon / Supreme Court 77-Year Corpus
# Author: Senior Data Engineer / Legal NLP Research Scientist
# ==============================================================================

suppressPackageStartupMessages({
  library(nanoparquet)
  library(dplyr)
  library(stringr)
  library(jsonlite)
})

#' Load Master Corpus Metadata
#'
#' @param base_dir Base path containing metadata_parquet (default: "data/source/metadata_parquet")
#' @param years Vector of numeric or character years to load (e.g. 1950:2026). If NULL, loads all available years.
#' @return A data.frame containing metadata for all matched judgments.
load_metadata <- function(base_dir = "data/source/metadata_parquet", years = NULL) {
  if (!dir.exists(base_dir)) {
    # Fallback to processed CSV if raw parquet directory is unavailable
    fallback_csv <- "data/processed/legal_cases.csv"
    if (file.exists(fallback_csv)) {
      message("Loading metadata from processed fallback: ", fallback_csv)
      df <- read.csv(fallback_csv, stringsAsFactors = FALSE)
      if (!is.null(years)) {
        df <- df[df$year %in% as.character(years), ]
      }
      return(df)
    }
    stop(sprintf("Metadata directory not found: %s", base_dir))
  }
  
  parquet_files <- list.files(base_dir, pattern = "\\.parquet$", full.names = TRUE, recursive = TRUE)
  
  if (length(parquet_files) == 0) {
    stop(sprintf("No Parquet files found in %s", base_dir))
  }
  
  # Filter by requested years if provided
  if (!is.null(years)) {
    year_patterns <- paste0("year=", years, "/")
    parquet_files <- parquet_files[sapply(parquet_files, function(p) any(str_detect(p, year_patterns)))]
  }
  
  if (length(parquet_files) == 0) {
    stop("No Parquet files matched the requested years.")
  }
  
  dfs <- lapply(parquet_files, read_parquet)
  combined <- do.call(rbind, dfs)
  return(combined)
}

#' Load Clean Judgment Text by Case Identifier or Path Stem
#'
#' @param path_stem Case path stem (e.g., "1950_1_806_821")
#' @param year Judicial year (e.g., 1950)
#' @param text_dir Directory containing extracted text (default: "data/processed/extracted_text")
#' @return Character string of judgment text, or NA if not yet extracted.
load_judgment_text <- function(path_stem, year, text_dir = "data/processed/extracted_text") {
  # Candidate filenames (handling both _EN.txt and .txt conventions)
  yr_dir <- file.path(text_dir, paste0("year=", year))
  candidates <- c(
    file.path(yr_dir, paste0(path_stem, "_EN.txt")),
    file.path(yr_dir, paste0(path_stem, ".txt")),
    file.path(text_dir, paste0(path_stem, ".txt"))
  )
  
  for (f in candidates) {
    if (file.exists(f)) {
      return(paste(readLines(f, warn = FALSE, encoding = "UTF-8"), collapse = "\n"))
    }
  }
  
  return(NA_character_)
}

#' Load Substantive Binary Classification Cohort
#'
#' @param years Vector of years to load (default: NULL = all 1950-2026)
#' @return A data.frame containing only substantive ALLOWED (1) vs DISMISSED (0) cases
load_binary_corpus <- function(years = NULL) {
  meta <- load_metadata(years = years)
  
  # Normalize outcomes
  meta$clean_outcome <- tolower(str_trim(as.character(meta$disposal_nature)))
  
  is_allowed <- grepl("^(appeal\\(s\\)\\s+allowed|case\\s+allowed|leave\\s+granted\\s+&\\s+allowed|allowed)$", meta$clean_outcome) |
    (grepl("allowed", meta$clean_outcome) & !grepl("part|dismiss|dispos", meta$clean_outcome))
  
  is_dismissed <- grepl("^(dismissed|leave\\s+granted\\s+&\\s+dismissed)$", meta$clean_outcome) |
    (grepl("dismissed", meta$clean_outcome) & !grepl("part|allow|dispos", meta$clean_outcome))
  
  binary_df <- meta[is_allowed | is_dismissed, ]
  binary_df$target_label <- ifelse(is_allowed[is_allowed | is_dismissed], "ALLOWED", "DISMISSED")
  binary_df$target_binary <- ifelse(binary_df$target_label == "ALLOWED", 1L, 0L)
  
  return(binary_df)
}

#' Inspect Corpus Summary Statistics
#'
#' @return List of key dataset summary dimensions
get_dataset_summary <- function() {
  all_meta <- load_metadata()
  bin_df <- load_binary_corpus()
  
  list(
    total_records = nrow(all_meta),
    years_available = range(as.numeric(all_meta$year), na.rm = TRUE),
    binary_cohort_size = nrow(bin_df),
    allowed_count = sum(bin_df$target_label == "ALLOWED"),
    dismissed_count = sum(bin_df$target_label == "DISMISSED"),
    class_balance = round(prop.table(table(bin_df$target_label)) * 100, 2)
  )
}
