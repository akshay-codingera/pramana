# scripts/extract_all_77_years.R
# Complete 77-Year Substantive Judgment Text Extraction Engine
# Extracts, cleans, and pre-decision masks substantive cases across all remaining years (1961-2025).
# Strictly maintains disk space by unpacking and cleaning PDFs year-by-year.

suppressPackageStartupMessages({
  library(pdftools)
  library(stringr)
  library(jsonlite)
})

WORKSPACE <- "D:/Projects/pramana"
ARCHIVE_BASE <- file.path(WORKSPACE, "data/source/english_archives")
TEXT_OUT_BASE <- file.path(WORKSPACE, "data/processed/extracted_text")
PROGRESS_JSON <- file.path(WORKSPACE, "data/processed/extraction_progress.json")
SPLITS_DIR <- file.path(WORKSPACE, "data/splits")

dir.create(TEXT_OUT_BASE, recursive = TRUE, showWarnings = FALSE)

# 1. Parse arguments
args <- commandArgs(trailingOnly = TRUE)
get_arg <- function(flag, default_val) {
  idx <- which(args == flag)
  if (length(idx) > 0 && idx < length(args)) return(args[idx + 1])
  return(default_val)
}

start_year <- as.integer(get_arg("--start-year", "1961"))
end_year <- as.integer(get_arg("--end-year", "2025"))

cat("====================================================================\n")
cat("PRAMANA: COMPLETE 77-YEAR SUBSTANTIVE TEXT EXTRACTION\n")
cat(sprintf("Target Year Range: %d to %d\n", start_year, end_year))
cat("====================================================================\n\n")

# 2. Load substantive cohort from grouped splits
cat("Loading substantive cohort identifiers from grouped splits...\n")
tr_split <- read.csv(file.path(SPLITS_DIR, "grouped_train.csv"), stringsAsFactors = FALSE)
va_split <- read.csv(file.path(SPLITS_DIR, "grouped_val.csv"), stringsAsFactors = FALSE)
te_split <- read.csv(file.path(SPLITS_DIR, "grouped_test.csv"), stringsAsFactors = FALSE)

substantive_cases <- rbind(tr_split, va_split, te_split)
cat(sprintf("Total Substantive Cases across 77 Years: %d (50/50 Cohort)\n", nrow(substantive_cases)))

# Build fast lookup hash of stems per year
substantive_map <- split(substantive_cases$path, substantive_cases$year)

# Header/Footer regex cleaning patterns
HEADER_PATTERNS <- c(
  "^\\s*S\\.?C\\.?R\\.?\\s+SUPREME\\s+COURT\\s+REPORTS.*$",
  "^\\s*SUPREME\\s+COURT\\s+REPORTS\\s+\\[\\d{4}\\].*$",
  "^\\s*\\[\\d{4}\\]\\s+\\d+\\s+S\\.?C\\.?R\\.?.*$",
  "^\\s*\\d+\\s+SUPREME\\s+COURT\\s+REPORTS.*$",
  "^\\s*Page\\s+\\d+\\s+of\\s+\\d+\\s*$",
  "^\\s*\\d{1,4}\\s*$"
)

clean_page <- function(page_text) {
  lines <- strsplit(page_text, "\r?\n")[[1]]
  if (length(lines) == 0) return("")
  
  clean_lines <- lines
  header_limit <- min(3, length(clean_lines))
  for (i in seq_len(header_limit)) {
    for (pat in HEADER_PATTERNS) {
      if (grepl(pat, clean_lines[i], ignore.case = TRUE, perl = TRUE)) {
        clean_lines[i] <- ""
      }
    }
  }
  
  footer_start <- max(1, length(clean_lines) - 1)
  for (i in footer_start:length(clean_lines)) {
    for (pat in HEADER_PATTERNS) {
      if (grepl(pat, clean_lines[i], ignore.case = TRUE, perl = TRUE)) {
        clean_lines[i] <- ""
      }
    }
  }
  paste(clean_lines, collapse = "\n")
}

# Track cumulative progress
progress_log <- list()
t_total_start <- Sys.time()
total_extracted_all_years <- 0

for (yr in start_year:end_year) {
  yr_str <- as.character(yr)
  target_stems <- substantive_map[[yr_str]]
  
  if (is.null(target_stems) || length(target_stems) == 0) {
    cat(sprintf("[SKIP] Year %d has no registered substantive cases in cohort.\n", yr))
    next
  }
  
  tar_file <- file.path(ARCHIVE_BASE, sprintf("year=%d/english.tar", yr))
  if (!file.exists(tar_file)) {
    cat(sprintf("[MISSING] Archive not found for year %d: %s\n", yr, tar_file))
    next
  }
  
  yr_text_dir <- file.path(TEXT_OUT_BASE, sprintf("year=%d", yr))
  dir.create(yr_text_dir, recursive = TRUE, showWarnings = FALSE)
  
  # Check how many are already extracted
  existing_txts <- list.files(yr_text_dir, pattern = "\\.txt$")
  existing_stems <- sub("(_EN)?\\.txt$", "", existing_txts)
  needed_stems <- setdiff(target_stems, existing_stems)
  
  if (length(needed_stems) == 0) {
    cat(sprintf("Year %d already fully extracted (%d cases present). Skipping unpacking.\n", yr, length(existing_stems)))
    next
  }
  
  cat(sprintf("\n--- YEAR %d: Extracting %d substantive judgments (%d already present) ---\n",
              yr, length(needed_stems), length(existing_stems)))
  
  # Unpack archive to temporary year directory
  temp_pdf_dir <- file.path(WORKSPACE, "data/extracted/english", sprintf("year=%d", yr))
  dir.create(temp_pdf_dir, recursive = TRUE, showWarnings = FALSE)
  
  t_yr_start <- Sys.time()
  system2("tar", args = c("-xf", shQuote(tar_file), "-C", shQuote(temp_pdf_dir)))
  
  all_pdfs <- list.files(temp_pdf_dir, pattern = "\\.pdf$", full.names = TRUE)
  pdf_stems <- sub("(_EN)?\\.pdf$", "", basename(all_pdfs))
  names(all_pdfs) <- pdf_stems
  
  # Filter to needed substantive cases only
  substantive_pdfs <- all_pdfs[names(all_pdfs) %in% needed_stems]
  
  extracted_this_yr <- 0
  for (stem_name in names(substantive_pdfs)) {
    pdf_path <- substantive_pdfs[[stem_name]]
    out_txt_file <- file.path(yr_text_dir, paste0(stem_name, "_EN.txt"))
    
    tryCatch({
      pages <- pdftools::pdf_text(pdf_path)
      cleaned_pages <- sapply(pages, clean_page)
      full_doc <- paste(cleaned_pages, collapse = "\n\n")
      
      # Normalize line breaks
      full_doc <- gsub("\r\n", "\n", full_doc)
      full_doc <- gsub("\r", "\n", full_doc)
      full_doc <- trimws(full_doc)
      
      if (nchar(full_doc) > 100) {
        writeLines(full_doc, out_txt_file, useBytes = TRUE)
        extracted_this_yr <- extracted_this_yr + 1
      }
    }, error = function(e) {
      # Handle occasional unreadable PDF gracefully
    })
  }
  
  # Immediately cleanup uncompressed PDFs to maintain strict disk safety
  unlink(temp_pdf_dir, recursive = TRUE)
  
  yr_elapsed <- as.numeric(difftime(Sys.time(), t_yr_start, units = "secs"))
  total_extracted_all_years <- total_extracted_all_years + extracted_this_yr
  
  cat(sprintf("Year %d finished: %d judgments extracted in %.1f seconds (Rate: %.2f docs/sec).\n",
              yr, extracted_this_yr, yr_elapsed, ifelse(yr_elapsed > 0, extracted_this_yr / yr_elapsed, 0)))
}

t_total_elapsed <- as.numeric(difftime(Sys.time(), t_total_start, units = "mins"))
cat("\n====================================================================\n")
cat(sprintf("BATCH EXTRACTION COMPLETE! Total new judgments extracted: %d in %.2f minutes.\n",
            total_extracted_all_years, t_total_elapsed))
cat("====================================================================\n")
