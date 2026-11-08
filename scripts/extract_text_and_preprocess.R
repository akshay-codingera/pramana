# scripts/extract_text_and_preprocess.R
# PRAMANA: Phase 5 - Document Text Extraction, Cleaning & Preprocessing in R
#
# Processes downloaded English TAR archives:
# 1. Unpacks PDFs for a given year.
# 2. Extracts clean text using pdftools::pdf_text()
# 3. Strips page headers/footers, normalizes typography and whitespace
# 4. Detects operative disposition boundary (for pre-decision experimentation)
# 5. Performs traceable paragraph and legal context segmentation
# 6. Saves clean text (.txt) and structured chunk records (.rds, .json)
# 7. Maintains an incremental extraction manifest

suppressPackageStartupMessages({
  library(pdftools)
  library(stringr)
  library(jsonlite)
})

# Source existing PRAMANA segmentation engine
source("d:/Projects/pramana/engine/segmentation.R")

WORKSPACE <- "D:/Projects/pramana"
ARCHIVE_DIR <- file.path(WORKSPACE, "data/source/english_archives")
EXTRACTED_PDF_DIR <- file.path(WORKSPACE, "data/extracted/english")
TEXT_OUT_DIR <- file.path(WORKSPACE, "data/processed/extracted_text")
CHUNKS_OUT_DIR <- file.path(WORKSPACE, "data/processed/segmented_cases")
MANIFEST_PATH <- file.path(WORKSPACE, "data/processed/extraction_manifest.csv")
LEGAL_CASES_PATH <- file.path(WORKSPACE, "data/processed/legal_cases.csv")

# Ensure required directories exist
dir.create(TEXT_OUT_DIR, recursive = TRUE, showWarnings = FALSE)
dir.create(CHUNKS_OUT_DIR, recursive = TRUE, showWarnings = FALSE)
dir.create(EXTRACTED_PDF_DIR, recursive = TRUE, showWarnings = FALSE)

# Initialize manifest if absent
if (!file.exists(MANIFEST_PATH)) {
  init_df <- data.frame(
    case_id = character(0),
    path_stem = character(0),
    year = integer(0),
    page_count = integer(0),
    char_count = integer(0),
    word_count = integer(0),
    chunk_count = integer(0),
    operative_chunk_count = integer(0),
    extraction_status = character(0),
    timestamp = character(0),
    stringsAsFactors = FALSE
  )
  write.csv(init_df, MANIFEST_PATH, row.names = FALSE)
}

# Parse command line arguments
args <- commandArgs(trailingOnly = TRUE)
get_arg <- function(flag, default_val) {
  idx <- which(args == flag)
  if (length(idx) > 0 && idx < length(args)) {
    return(args[idx + 1])
  }
  return(default_val)
}

start_year <- as.integer(get_arg("--start-year", "1950"))
end_year <- as.integer(get_arg("--end-year", "1954"))
clean_extracted_pdfs <- as.logical(get_arg("--cleanup-pdfs", "FALSE"))
overwrite <- as.logical(get_arg("--overwrite", "FALSE"))

cat("================================================================\n")
cat("PRAMANA DOCUMENT EXTRACTION & PREPROCESSING (IN R)\n")
cat(sprintf("Years to process: %d to %d\n", start_year, end_year))
cat(sprintf("Text output: %s\n", TEXT_OUT_DIR))
cat(sprintf("Segmentation output: %s\n", CHUNKS_OUT_DIR))
cat(sprintf("Cleanup uncompressed PDFs after processing: %s\n", clean_extracted_pdfs))
cat("================================================================\n\n")

# Load legal cases metadata
cat("Loading legal cases metadata...\n")
legal_cases <- read.csv(LEGAL_CASES_PATH, stringsAsFactors = FALSE)
cat(sprintf("Total registered cases in dataset: %d\n", nrow(legal_cases)))

# Regular expressions for header/footer cleaning
HEADER_PATTERNS <- c(
  "^\\s*S\\.?C\\.?R\\.?\\s+SUPREME\\s+COURT\\s+REPORTS.*$",
  "^\\s*SUPREME\\s+COURT\\s+REPORTS\\s+\\[\\d{4}\\].*$",
  "^\\s*\\[\\d{4}\\]\\s+\\d+\\s+S\\.?C\\.?R\\.?.*$",
  "^\\s*\\d+\\s+SUPREME\\s+COURT\\s+REPORTS.*$",
  "^\\s*Page\\s+\\d+\\s+of\\s+\\d+\\s*$"
)

#' Clean a single extracted PDF page
clean_pdf_page <- function(page_text) {
  lines <- strsplit(page_text, "\r?\n")[[1]]
  if (length(lines) == 0) return("")
  
  # Strip headers from first 3 lines
  clean_lines <- lines
  header_limit <- min(3, length(clean_lines))
  for (i in seq_len(header_limit)) {
    for (pat in HEADER_PATTERNS) {
      if (grepl(pat, clean_lines[i], ignore.case = TRUE, perl = TRUE)) {
        clean_lines[i] <- ""
      }
    }
    # Standalone page number
    if (grepl("^\\s*\\d{1,4}\\s*$", clean_lines[i])) {
      clean_lines[i] <- ""
    }
  }
  
  # Strip footers from last 2 lines
  footer_start <- max(1, length(clean_lines) - 1)
  for (i in footer_start:length(clean_lines)) {
    if (grepl("^\\s*\\d{1,4}\\s*$", clean_lines[i])) {
      clean_lines[i] <- ""
    }
  }
  
  # Join cleaned lines
  paste(clean_lines, collapse = "\n")
}

#' Detect operative disposition chunks (for pre-decision masking)
mark_operative_order <- function(chunks_df) {
  if (nrow(chunks_df) == 0) return(chunks_df)
  
  chunks_df$is_operative_order <- FALSE
  n_chunks <- nrow(chunks_df)
  
  # Operative order disposition keywords
  disp_patterns <- c(
    "\\bappeal\\s+is\\s+(allowed|dismissed|partly\\s+allowed)\\b",
    "\\bappeals?\\s+(are|stand)\\s+(allowed|dismissed)\\b",
    "\\bwe\\s+(allow|dismiss)\\s+the\\s+(appeal|appeals|petition)\\b",
    "\\bin\\s+the\\s+result,?\\s+the\\s+(appeal|petition)\\b",
    "\\bfor\\s+the\\s+reasons\\s+stated\\s+above\\b",
    "\\bfor\\s+the\\s+foregoing\\s+reasons\\b",
    "\\bimpugned\\s+(order|judgment)\\s+is\\s+(set\\s+aside|upheld|quashed)\\b",
    "\\bwe\\s+find\\s+no\\s+merit\\s+in\\s+this\\s+appeal\\b",
    "\\bno\\s+order\\s+as\\s+to\\s+costs\\b",
    "\\bcosts\\s+shall\\s+be\\s+borne\\b"
  )
  
  # Look specifically at the last 5 chunks (tail of the judgment)
  tail_indices <- seq(from = max(1, n_chunks - 4), to = n_chunks)
  for (idx in tail_indices) {
    chunk_txt <- chunks_df$text[idx]
    for (pat in disp_patterns) {
      if (grepl(pat, chunk_txt, ignore.case = TRUE, perl = TRUE)) {
        chunks_df$is_operative_order[idx] <- TRUE
        break
      }
    }
  }
  
  return(chunks_df)
}

# Process years
manifest_entries <- list()

for (yr in start_year:end_year) {
  tar_path <- file.path(ARCHIVE_DIR, sprintf("year=%d/english.tar", yr))
  year_pdf_dir <- file.path(EXTRACTED_PDF_DIR, sprintf("year=%d", yr))
  year_text_dir <- file.path(TEXT_OUT_DIR, sprintf("year=%d", yr))
  year_chunks_dir <- file.path(CHUNKS_OUT_DIR, sprintf("year=%d", yr))
  
  dir.create(year_pdf_dir, recursive = TRUE, showWarnings = FALSE)
  dir.create(year_text_dir, recursive = TRUE, showWarnings = FALSE)
  dir.create(year_chunks_dir, recursive = TRUE, showWarnings = FALSE)
  
  if (!file.exists(tar_path)) {
    cat(sprintf("[SKIP] Archive not found for year %d: %s\n", yr, tar_path))
    next
  }
  
  cat(sprintf("\n=== PROCESSING YEAR %d ===\n", yr))
  
  # Check if PDFs need to be unpacked
  index_path <- file.path(WORKSPACE, "data/source/indexes", sprintf("year=%d/english.index.json", yr))
  expected_count <- if (file.exists(index_path)) {
    tryCatch(jsonlite::fromJSON(index_path)$file_count, error = function(e) 0)
  } else 0
  
  existing_pdfs <- list.files(year_pdf_dir, pattern = "\\.pdf$", full.names = TRUE)
  if (length(existing_pdfs) < expected_count || length(existing_pdfs) == 0 || overwrite) {
    cat(sprintf("Unpacking %s (expected %d files) to %s...\n", basename(tar_path), expected_count, year_pdf_dir))
    system2("tar", args = c("-xf", shQuote(tar_path), "-C", shQuote(year_pdf_dir)))
    existing_pdfs <- list.files(year_pdf_dir, pattern = "\\.pdf$", full.names = TRUE)
  }
  cat(sprintf("Found %d PDF documents for year %d.\n", length(existing_pdfs), yr))
  
  # Process each PDF
  year_cases <- legal_cases[legal_cases$year == yr, ]
  success_count <- 0
  
  for (pdf_file in existing_pdfs) {
    pdf_name <- basename(pdf_file)
    stem <- sub("\\.pdf$", "", pdf_name)
    # Strip trailing language code if present (e.g. _EN)
    stem_base <- sub("_EN$", "", stem)
    
    out_txt_file <- file.path(year_text_dir, paste0(stem, ".txt"))
    out_chunks_rds <- file.path(year_chunks_dir, paste0(stem, "_chunks.rds"))
    out_chunks_json <- file.path(year_chunks_dir, paste0(stem, "_chunks.json"))
    
    if (file.exists(out_txt_file) && file.exists(out_chunks_rds) && !overwrite) {
      success_count <- success_count + 1
      next
    }
    
    # Locate metadata row
    meta_match <- year_cases[year_cases$path_stem == stem_base | year_cases$source_document == pdf_name, ]
    case_id_val <- if (nrow(meta_match) > 0) meta_match$case_id[1] else paste0(yr, "_", stem)
    
    tryCatch({
      # 1. Extract text from PDF
      raw_pages <- pdftools::pdf_text(pdf_file)
      n_pages <- length(raw_pages)
      
      if (n_pages == 0) {
        cat(sprintf("  [EMPTY] %s has 0 pages\n", pdf_name))
        next
      }
      
      # 2. Clean each page
      cleaned_pages <- vapply(raw_pages, clean_pdf_page, character(1), USE.NAMES = FALSE)
      full_judgment_text <- paste(cleaned_pages, collapse = "\n\n")
      
      # Normalize whitespace
      full_judgment_text <- gsub("\r\n", "\n", full_judgment_text)
      full_judgment_text <- gsub("[ \t]+", " ", full_judgment_text)
      full_judgment_text <- gsub("\n[ \t]+", "\n", full_judgment_text)
      full_judgment_text <- gsub("\n{3,}", "\n\n", full_judgment_text)
      full_judgment_text <- str_trim(full_judgment_text)
      
      # Save clean full text
      writeLines(full_judgment_text, out_txt_file, useBytes = TRUE)
      
      # 3. Context Segmentation using engine/segmentation.R
      seg_res <- segment_judgment(full_judgment_text)
      chunks_df <- seg_res$chunks
      
      # 4. Mark operative order chunks for pre-decision experiments
      chunks_df <- mark_operative_order(chunks_df)
      chunks_df$case_id <- case_id_val
      chunks_df$source_file <- pdf_name
      
      # Count words
      total_words <- sum(chunks_df$word_count)
      op_chunks <- sum(chunks_df$is_operative_order)
      
      # Save chunk objects
      saveRDS(chunks_df, out_chunks_rds)
      
      # Export JSON representation for Node.js / web UI consumption
      jsonlite::write_json(
        list(
          case_id = case_id_val,
          source_document = pdf_name,
          year = yr,
          total_pages = n_pages,
          total_chars = nchar(full_judgment_text),
          total_words = total_words,
          chunk_count = nrow(chunks_df),
          operative_chunk_count = op_chunks,
          chunks = chunks_df
        ),
        out_chunks_json,
        auto_unbox = TRUE,
        pretty = TRUE
      )
      
      manifest_entries[[length(manifest_entries) + 1]] <- data.frame(
        case_id = case_id_val,
        path_stem = stem,
        year = yr,
        page_count = n_pages,
        char_count = nchar(full_judgment_text),
        word_count = total_words,
        chunk_count = nrow(chunks_df),
        operative_chunk_count = op_chunks,
        extraction_status = "SUCCESS",
        timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S"),
        stringsAsFactors = FALSE
      )
      
      success_count <- success_count + 1
      if (success_count %% 25 == 0) {
        cat(sprintf("  Processed %d / %d judgments in year %d...\n", success_count, length(existing_pdfs), yr))
      }
    }, error = function(e) {
      cat(sprintf("  [ERROR] %s: %s\n", pdf_name, e$message))
    })
  }
  
  cat(sprintf("Year %d completed: %d documents processed.\n", yr, success_count))
  
  # Optional cleanup of uncompressed PDFs
  if (clean_extracted_pdfs) {
    cat(sprintf("Cleaning up uncompressed PDFs in %s to conserve disk space...\n", year_pdf_dir))
    unlink(existing_pdfs)
  }
}

# Update manifest
if (length(manifest_entries) > 0) {
  new_manifest_df <- do.call(rbind, manifest_entries)
  write.table(new_manifest_df, MANIFEST_PATH, sep = ",", col.names = FALSE, row.names = FALSE, append = TRUE)
  cat(sprintf("\nExtraction manifest updated with %d new records.\n", nrow(new_manifest_df)))
}

cat("================================================================\n")
cat("EXTRACTION AND PREPROCESSING BATCH COMPLETED SUCCESSFULLY\n")
cat("================================================================\n")
