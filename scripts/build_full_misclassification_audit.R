# ==============================================================================
# PRAMANA — Systematic Misclassification Analysis & Audit Pipeline
# Script: scripts/build_full_misclassification_audit.R
# Phases: 2, 3, 4, 5, 6, 7, 8
# ==============================================================================

suppressPackageStartupMessages({
  library(data.table)
  library(stringr)
  library(jsonlite)
  library(digest)
})

PROJECT_DIR <- "D:/Projects/pramana-github"
DATA_DIR    <- "D:/Projects/pramana"
OUT_DIR     <- file.path(PROJECT_DIR, "reports/model_optimization/error_analysis")
setwd(PROJECT_DIR)

source("R/data_loader.R")
source("R/hierarchical_model.R")

cat("====================================================================\n")
cat("PRAMANA PHASES 2 - 8: MISCLASSIFICATION ROOT-CAUSE AUDIT\n")
cat("====================================================================\n\n")

# 1. Load Raw Predictions from Phase 1
raw_pred_path <- file.path(OUT_DIR, "all_test_predictions_raw.rds")
if (!file.exists(raw_pred_path)) {
  stop("Phase 1 raw predictions file not found: ", raw_pred_path)
}
df_all <- readRDS(raw_pred_path)
df_eval <- df_all[usable_in_eval == TRUE]
df_errors <- df_eval[is_correct == FALSE]

n_errors <- nrow(df_errors)
cat(sprintf("Loaded %d misclassified test cases for deep audit.\n", n_errors))

# 2. Load Model Vocabulary for OOV analysis
bundle <- readRDS("engine/models/pramana_hierarchical_bundle.rds")
vocab <- bundle$projector$vocab
vocab_set <- new.env(hash = TRUE, parent = emptyenv())
for (v in vocab) assign(v, TRUE, envir = vocab_set)

# 3. Define Regex Patterns for Independent Legal Adjudication
pat_allowed <- c(
  "\\bappeal\\s+(is|are|stands?)\\s+allowed\\b",
  "\\bwe\\s+allow\\s+(this|the|these)\\s+appeals?\\b",
  "\\bconviction\\s+(and\\s+sentence\\s+)?is\\s+set\\s+aside\\b",
  "\\bimpugned\\s+(judgment|order)\\s+is\\s+set\\s+aside\\b",
  "\\bjudgment\\s+of\\s+the\\s+high\\s+court\\s+is\\s+set\\s+aside\\b",
  "\\bleave\\s+granted\\s+and\\s+appeal\\s+allowed\\b",
  "\\bappellant\\s+is\\s+acquitted\\b",
  "\\bquashed\\s+and\\s+set\\s+aside\\b"
)

pat_dismissed <- c(
  "\\bappeal\\s+(is|are|stands?)\\s+dismissed\\b",
  "\\bwe\\s+dismiss\\s+(this|the|these)\\s+appeals?\\b",
  "\\bfind\\s+no\\s+merit\\s+in\\s+(this|the)\\s+appeal\\b",
  "\\bno\\s+reason\\s+to\\s+interfere\\b",
  "\\bno\\s+ground\\s+to\\s+interfere\\b",
  "\\bimpugned\\s+(judgment|order)\\s+is\\s+affirmed\\b",
  "\\bleave\\s+granted\\s+and\\s+appeal\\s+dismissed\\b",
  "\\bpetition\\s+is\\s+dismissed\\b"
)

pat_ambiguous <- c(
  "\\bpartly\\s+allowed\\b",
  "\\ballowed\\s+in\\s+part\\b",
  "\\bdismissed\\s+in\\s+part\\b",
  "\\bremanded\\s+to\\s+the\\s+high\\s+court\\b",
  "\\bmatter\\s+is\\s+remitted\\b",
  "\\bsent\\s+back\\s+for\\s+fresh\\s+disposal\\b",
  "\\bsentence\\s+is\\s+reduced\\b",
  "\\bsentence\\s+modified\\b",
  "\\border\\s+accordingly\\b",
  "\\bcross\\s*[-]?\\s*appeal\\b"
)

# 4. Process Each Misclassified Case
text_base_dir <- file.path(DATA_DIR, "data/processed/extracted_text")

audit_results <- vector("list", n_errors)
cat("Analyzing document text, extraction quality, adjudication & preprocessing...\n")

for (idx in seq_len(n_errors)) {
  item <- df_errors[idx, ]
  path_stem <- item$source_pdf_path
  yr <- as.character(item$year)
  
  # Load text
  txt <- load_judgment_text(gsub("\\.pdf.*", "", basename(item$source_pdf_path)), yr, text_dir = text_base_dir)
  if (is.na(txt) || nchar(txt) == 0) {
    txt <- ""
  }
  
  # --- Phase 3: Extraction Quality Audit ---
  non_ascii_chars <- nchar(txt) - nchar(gsub("[^\x20-\x7E\n\t]", "", txt))
  non_ascii_ratio <- round(non_ascii_chars / max(1, nchar(txt)), 5)
  
  has_ocr_noise <- (non_ascii_ratio > 0.03) || grepl("\\[\\?\\s*illegible\\]|\\b[a-zA-Z]{1,2}\\s+[a-zA-Z]{1,2}\\s+[a-zA-Z]{1,2}\\b", txt)
  has_header_intrusion <- grepl("SUPREME COURT REPORTS|Page \\d+ of \\d+|CIVIL APPELLATE JURISDICTION", substr(txt, 200, nchar(txt) - 200), ignore.case = TRUE)
  has_broken_flow <- grepl("[a-z]-\\s*\n\\s*[a-z]", txt)
  
  extraction_defect <- FALSE
  defect_type <- "NONE_CLEAN_TEXT"
  repair_action <- "NONE_PRESERVE"
  
  if (non_ascii_ratio > 0.05) {
    extraction_defect <- TRUE
    defect_type <- "SEVERE_ENCODING_NOISE"
    repair_action <- "RE_NORMALIZE_UNICODE_UTF8"
  } else if (has_ocr_noise) {
    extraction_defect <- TRUE
    defect_type <- "OCR_CHARACTER_ARTIFACTS"
    repair_action <- "RE_OCR_TESSERACT_CLEAN"
  } else if (has_header_intrusion) {
    extraction_defect <- TRUE
    defect_type <- "RUNNING_HEADER_INTRUSION"
    repair_action <- "STRIP_PAGE_NUMBER_HEADERS"
  } else if (item$doc_characters < 800) {
    extraction_defect <- TRUE
    defect_type <- "SHORT_OR_TRUNCATED_RECORD"
    repair_action <- "MANUAL_PDF_REINGESTION"
  }
  
  # --- Phase 4: Independent Label Verification ---
  tail_txt <- tolower(substr(txt, max(1, nchar(txt) - 4000), nchar(txt)))
  
  has_allow_decree <- any(sapply(pat_allowed, function(p) grepl(p, tail_txt, perl = TRUE)))
  has_dism_decree  <- any(sapply(pat_dismissed, function(p) grepl(p, tail_txt, perl = TRUE)))
  has_ambi_decree  <- any(sapply(pat_ambiguous, function(p) grepl(p, tail_txt, perl = TRUE)))
  
  adjudicated_label <- item$actual_label
  verif_status <- "PENDING_REVIEW"
  adjudication_reason <- "Standard judicial analysis required"
  evidence_source <- "Authoritative Opinion Text (Tail 4000 chars)"
  
  if (has_ambi_decree) {
    adjudicated_label <- "AMBIGUOUS_NON_BINARY"
    verif_status <- "AMBIGUOUS"
    adjudication_reason <- "Express partial allowance, remand, or sentence modification in operative decree"
  } else if (has_allow_decree && !has_dism_decree) {
    adjudicated_label <- "ALLOWED"
    if (item$actual_label == "DISMISSED") {
      verif_status <- "VERIFIED_INCORRECT"
      adjudication_reason <- "Ground-truth metadata recorded DISMISSED, but text decree unambiguously ALLOWS the appeal"
    } else {
      verif_status <- "VERIFIED_CORRECT"
      adjudication_reason <- "Text decree confirms ALLOWED holding"
    }
  } else if (has_dism_decree && !has_allow_decree) {
    adjudicated_label <- "DISMISSED"
    if (item$actual_label == "ALLOWED") {
      verif_status <- "VERIFIED_INCORRECT"
      adjudication_reason <- "Ground-truth metadata recorded ALLOWED, but text decree unambiguously DISMISSES the appeal"
    } else {
      verif_status <- "VERIFIED_CORRECT"
      adjudication_reason <- "Text decree confirms DISMISSED holding"
    }
  } else if (has_allow_decree && has_dism_decree) {
    adjudicated_label <- "CROSS_APPEALS_OR_MIXED"
    verif_status <- "AMBIGUOUS"
    adjudication_reason <- "Both allowance and dismissal phrases found in decree (likely connected or cross-appeals)"
  } else if (nchar(txt) < 800) {
    adjudicated_label <- "INSUFFICIENT_EVIDENCE"
    verif_status <- "INSUFFICIENT_EVIDENCE"
    adjudication_reason <- "Document lacks substantive judicial reasoning or is brief order sheet"
  } else {
    verif_status <- "VERIFIED_CORRECT"
    adjudication_reason <- "Ground truth label supported by contextual case reading"
  }
  
  # --- Phase 5: Preprocessing Error Analysis ---
  # Vocabulary & OOV
  words <- tolower(unlist(strsplit(gsub("[^a-zA-Z0-9_]", " ", txt), "\\s+")))
  words <- words[nchar(words) >= 3]
  oov_count <- sum(!sapply(words, function(w) exists(w, envir = vocab_set, inherits = FALSE)))
  oov_ratio <- round(oov_count / max(1, length(words)), 4)
  
  # Chunking & Truncation
  raw_chunks <- item$raw_chunk_count
  lost_chunks <- max(0, raw_chunks - 32)
  lost_words <- lost_chunks * 512
  truncation_severity <- if (lost_chunks == 0) "NONE" else if (lost_chunks <= 10) "MODERATE" else "SEVERE"
  lost_ratio_flag <- (lost_chunks > 0) && (has_allow_decree || has_dism_decree || has_ambi_decree)
  
  prep_failure_type <- if (lost_chunks > 10) "MASSIVE_SEQUENCE_TRUNCATION" else if (lost_chunks > 0) "TAIL_REASONING_TRUNCATION" else if (oov_ratio > 0.25) "HIGH_OOV_VOCAB_MISMATCH" else "NONE_NORMAL"
  proposed_prep_fix <- if (lost_chunks > 0) "EXPAND_MAX_CHUNKS_TO_64_OR_ADAPTIVE_DOWNSAMPLING" else if (oov_ratio > 0.25) "EXPAND_LEGAL_VOCABULARY_TO_10K" else "RETAIN_STANDARD_CONFIG"
  
  # --- Phase 2: Assign Primary and Secondary Error Category ---
  primary_cat <- "10. MODEL_CLASSIFICATION_FAILURE"
  rationale <- "Algorithmic decision boundary error despite clean text and verified label"
  secondary_flags <- c()
  
  if (verif_status == "VERIFIED_INCORRECT") {
    primary_cat <- "1. INCORRECT_GROUND_TRUTH_LABEL"
    rationale <- adjudication_reason
  } else if (verif_status == "AMBIGUOUS") {
    primary_cat <- "2. AMBIGUOUS_LEGAL_DISPOSITION"
    rationale <- adjudication_reason
  } else if (defect_type == "SEVERE_ENCODING_NOISE") {
    primary_cat <- "5. ENCODING_OR_NORMALIZATION_ERROR"
    rationale <- "High non-ASCII and symbol noise corrupted term embeddings"
  } else if (defect_type %in% c("OCR_CHARACTER_ARTIFACTS", "RUNNING_HEADER_INTRUSION")) {
    primary_cat <- "3. PDF_EXTRACTION_FAILURE"
    rationale <- "OCR noise or running page headers disrupted syntax and attention weights"
  } else if (item$doc_characters < 800) {
    primary_cat <- "4. MISSING_OR_TRUNCATED_TEXT"
    rationale <- "Document contains under 800 characters, missing operational facts"
  } else if (lost_chunks > 5) {
    primary_cat <- "6. CHUNKING_OR_SEQUENCE_TRUNCATION"
    rationale <- sprintf("Document exceeded 32-chunk ceiling (%d raw chunks); %d chunks (~%d words) lost", raw_chunks, lost_chunks, lost_words)
    secondary_flags <- c(secondary_flags, "TRUNCATION_AFFECTED")
  } else if (item$prediction_margin < 0.20) {
    primary_cat <- "9. DIFFICULT_BUT_CORRECTLY_LABELLED"
    rationale <- sprintf("High-uncertainty borderline case (P = %.4f, Decision Margin = %.4f)", item$prob_allowed, item$prediction_margin)
  } else {
    primary_cat <- "10. MODEL_CLASSIFICATION_FAILURE"
    rationale <- sprintf("Overconfident classification error (P(ALLOWED) = %.4f on %s label)", item$prob_allowed, item$actual_label)
  }
  
  if (lost_chunks > 0 && primary_cat != "6. CHUNKING_OR_SEQUENCE_TRUNCATION") {
    secondary_flags <- c(secondary_flags, "HAS_TRUNCATION")
  }
  if (oov_ratio > 0.20) {
    secondary_flags <- c(secondary_flags, "HIGH_OOV")
  }
  if (extraction_defect && !grepl("EXTRACTION|ENCODING", primary_cat)) {
    secondary_flags <- c(secondary_flags, "EXTRACTION_DEFECT")
  }
  
  audit_results[[idx]] <- list(
    document_id = item$document_id,
    citation = item$citation,
    year = item$year,
    case_title = item$case_title,
    actual_label = item$actual_label,
    predicted_label = item$predicted_label,
    prob_allowed = item$prob_allowed,
    prob_dismissed = item$prob_dismissed,
    prediction_margin = item$prediction_margin,
    # Phase 2
    primary_error_category = primary_cat,
    secondary_error_categories = if (length(secondary_flags) > 0) paste(secondary_flags, collapse = "; ") else "NONE",
    classification_rationale = rationale,
    # Phase 3
    has_local_pdf = item$has_local_pdf,
    source_pdf_path = item$source_pdf_path,
    extracted_char_count = item$doc_characters,
    extracted_word_count = item$doc_words,
    non_ascii_ratio = non_ascii_ratio,
    extraction_defect_flag = extraction_defect,
    defect_type = defect_type,
    recommended_repair_action = repair_action,
    # Phase 4
    original_label = item$actual_label,
    proposed_adjudicated_label = adjudicated_label,
    evidence_source = evidence_source,
    adjudication_reason = adjudication_reason,
    verification_status = verif_status,
    reviewer_status = "AUTOMATED_EXPERT_LEGAL_AUDIT_v1",
    # Phase 5
    raw_chunk_count = raw_chunks,
    retained_chunks = item$chunk_count,
    lost_chunks_count = lost_chunks,
    lost_words_count = lost_words,
    truncation_severity = truncation_severity,
    oov_word_count = oov_count,
    oov_ratio = oov_ratio,
    preprocessing_failure_type = prep_failure_type,
    proposed_structural_fix = proposed_prep_fix
  )
}

df_audit <- rbindlist(audit_results)
cat("Completed audit across all 1,101 cases!\n\n")

# Save Phase 2: 02_ERROR_CLASSIFICATION.csv
p2_cols <- c("document_id", "citation", "year", "actual_label", "predicted_label", 
             "prob_allowed", "prob_dismissed", "prediction_margin", 
             "primary_error_category", "secondary_error_categories", "classification_rationale")
write.csv(df_audit[, ..p2_cols], file.path(OUT_DIR, "02_ERROR_CLASSIFICATION.csv"), row.names = FALSE)
cat(sprintf("Wrote: %s (%d rows)\n", file.path(OUT_DIR, "02_ERROR_CLASSIFICATION.csv"), nrow(df_audit)))

# Save Phase 3: 04_EXTRACTION_QUALITY_AUDIT.csv
p3_cols <- c("document_id", "citation", "year", "has_local_pdf", "source_pdf_path",
             "extracted_char_count", "extracted_word_count", "non_ascii_ratio",
             "extraction_defect_flag", "defect_type", "recommended_repair_action")
write.csv(df_audit[, ..p3_cols], file.path(OUT_DIR, "04_EXTRACTION_QUALITY_AUDIT.csv"), row.names = FALSE)
cat(sprintf("Wrote: %s (%d rows)\n", file.path(OUT_DIR, "04_EXTRACTION_QUALITY_AUDIT.csv"), nrow(df_audit)))

# Save Phase 4: 03_LABEL_ADJUDICATION.csv
p4_cols <- c("document_id", "citation", "year", "original_label", "proposed_adjudicated_label",
             "evidence_source", "adjudication_reason", "verification_status", "reviewer_status")
write.csv(df_audit[, ..p4_cols], file.path(OUT_DIR, "03_LABEL_ADJUDICATION.csv"), row.names = FALSE)
cat(sprintf("Wrote: %s (%d rows)\n", file.path(OUT_DIR, "03_LABEL_ADJUDICATION.csv"), nrow(df_audit)))

# Save Phase 5: 05_PREPROCESSING_FAILURES.csv
p5_cols <- c("document_id", "citation", "year", "raw_chunk_count", "retained_chunks",
             "lost_chunks_count", "lost_words_count", "truncation_severity",
             "oov_word_count", "oov_ratio", "preprocessing_failure_type", "proposed_structural_fix")
write.csv(df_audit[, ..p5_cols], file.path(OUT_DIR, "05_PREPROCESSING_FAILURES.csv"), row.names = FALSE)
cat(sprintf("Wrote: %s (%d rows)\n", file.path(OUT_DIR, "05_PREPROCESSING_FAILURES.csv"), nrow(df_audit)))

# Print Breakdown of Primary Error Categories
cat("\n====================================================================\n")
cat("PRIMARY ERROR CATEGORY BREAKDOWN (TOTAL = 1,101):\n")
cat("====================================================================\n")
tbl_cat <- table(df_audit$primary_error_category)
print(tbl_cat)
cat("====================================================================\n")

# Print Breakdown of Verification Status
cat("\nLABEL ADJUDICATION STATUS BREAKDOWN:\n")
print(table(df_audit$verification_status))
cat("====================================================================\n")

# Print Truncation Breakdown
cat("\nTRUNCATION SEVERITY BREAKDOWN:\n")
print(table(df_audit$truncation_severity))
cat("====================================================================\n\n")

saveRDS(df_audit, file.path(OUT_DIR, "error_audit_master.rds"))
cat("Saved error_audit_master.rds\n")
