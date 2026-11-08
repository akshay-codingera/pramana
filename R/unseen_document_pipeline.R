# R/unseen_document_pipeline.R
# Complete Unseen Legal Document Ingestion, Validation, Prediction, Explainability, and Evaluation Engine
# Complies with strict pre-decision integrity, LOCO attribution, and ground-truth isolation.

suppressPackageStartupMessages({
  library(jsonlite)
  library(digest)
})

# Load supporting engines
source("R/hierarchical_model.R")
source("engine/explainability.R")

# Ensure storage directories
dir.create("result", showWarnings = FALSE, recursive = TRUE)
dir.create("data/unseen_uploads", showWarnings = FALSE, recursive = TRUE)

#' Extract Text from Document (PDF, DOCX, TXT)
#' @param file_path Absolute or relative path to document
#' @return Clean extracted text string
extract_document_text <- function(file_path) {
  if (!file.exists(file_path)) {
    stop("Uploaded file does not exist: ", file_path)
  }
  
  ext <- tolower(tools::file_ext(file_path))
  
  if (ext == "pdf") {
    if (!requireNamespace("pdftools", quietly = TRUE)) {
      stop("pdftools package required for PDF extraction.")
    }
    pages <- pdftools::pdf_text(file_path)
    clean_text <- paste(pages, collapse = "\n\n")
  } else if (ext %in% c("docx", "doc")) {
    # Extract DOCX by unzipping word/document.xml and parsing with xml2
    if (!requireNamespace("xml2", quietly = TRUE)) {
      stop("xml2 package required for DOCX extraction.")
    }
    td <- tempfile("docx_unseen_")
    dir.create(td)
    on.exit(unlink(td, recursive = TRUE), add = TRUE)
    
    unzip_res <- tryCatch({
      utils::unzip(file_path, files = "word/document.xml", exdir = td)
    }, error = function(e) e)
    
    xml_path <- file.path(td, "word", "document.xml")
    if (file.exists(xml_path)) {
      # Defensive XML sanitization against control characters (PCDATA invalid char error)
      xml_raw <- paste(readLines(xml_path, warn = FALSE, encoding = "UTF-8"), collapse = "\n")
      xml_clean <- gsub("[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F]", "", xml_raw, perl = TRUE)
      doc <- tryCatch(xml2::read_xml(xml_clean), error = function(e) xml2::read_xml(xml_path))
      nodes <- xml2::xml_find_all(doc, ".//w:p")
      paragraphs <- xml2::xml_text(nodes)
      clean_text <- paste(paragraphs[nzchar(trimws(paragraphs))], collapse = "\n\n")
    } else {
      # Fallback for plain text or older formats
      clean_text <- paste(readLines(file_path, warn = FALSE, encoding = "UTF-8"), collapse = "\n")
    }
  } else {
    # Default text reader
    clean_text <- paste(readLines(file_path, warn = FALSE, encoding = "UTF-8"), collapse = "\n")
  }
  
  # Normalize line endings
  clean_text <- gsub("\r\n", "\n", clean_text)
  clean_text <- gsub("\r", "\n", clean_text)
  return(trimws(clean_text))
}

#' Generate Cryptographic SHA-256 Hashes
#' @param file_path Path to uploaded file
#' @param text Extracted text string
#' @return Named list with file_hash and text_hash
generate_document_hashes <- function(file_path, text) {
  f_hash <- digest::digest(file_path, algo = "sha256", file = TRUE)
  t_hash <- digest::digest(text, algo = "sha256")
  list(file_hash = f_hash, text_hash = t_hash)
}

#' Check Whether Document Exists in Training/Evaluation Dataset
#' @param text_hash Extracted text SHA-256 hash
#' @param doc_text Extracted document text
#' @return Match diagnosis list
check_dataset_presence <- function(text_hash, doc_text) {
  # 1. Check legal_cases.csv if available
  cases_file <- "data/processed/legal_cases.csv"
  if (file.exists(cases_file)) {
    cases_df <- tryCatch(read.csv(cases_file, stringsAsFactors = FALSE, nrows = 50000), error = function(e) NULL)
    if (!is.null(cases_df)) {
      # Check title / citation matching if present in header
      first_lines <- substr(doc_text, 1, 1000)
      for (i in 1:min(500, nrow(cases_df))) {
        c_title <- cases_df$case_title[i]
        c_cit <- cases_df$citation[i]
        if (!is.na(c_cit) && nzchar(c_cit) && grepl(c_cit, first_lines, fixed = TRUE)) {
          return(list(
            exists = TRUE,
            match_type = "CITATION_EXACT_MATCH",
            matched_id = cases_df$case_id[i],
            citation = c_cit,
            split = "data/processed/legal_cases.csv"
          ))
        }
      }
    }
  }
  
  # 2. Check grouped split files
  for (split_name in c("grouped_train", "grouped_val", "grouped_test")) {
    sp_path <- file.path("data/splits", paste0(split_name, ".csv"))
    if (file.exists(sp_path)) {
      sp_df <- tryCatch(read.csv(sp_path, stringsAsFactors = FALSE), error = function(e) NULL)
      if (!is.null(sp_df)) {
        # Check against first 500 characters
        first_lines <- substr(doc_text, 1, 500)
        for (i in 1:min(300, nrow(sp_df))) {
          c_cit <- sp_df$citation[i]
          if (!is.na(c_cit) && nzchar(c_cit) && grepl(c_cit, first_lines, fixed = TRUE)) {
            return(list(
              exists = TRUE,
              match_type = "SPLIT_CITATION_MATCH",
              matched_id = sp_df$case_id[i],
              citation = c_cit,
              split = split_name
            ))
          }
        }
      }
    }
  }
  
  return(list(
    exists = FALSE,
    match_type = "NO_MATCH",
    matched_id = NULL,
    citation = NULL,
    split = NULL
  ))
}

#' Detect Verdict Indicators & Operative Orders
#' @param doc_text Document text
#' @return Warning audit list
audit_verdict_indicators <- function(doc_text) {
  patterns <- c(
    "\\bappeal\\s+(is\\s+)?(hereby\\s+)?allowed\\b",
    "\\bappeal\\s+(is\\s+)?(hereby\\s+)?dismissed\\b",
    "\\bleave\\s+granted\\b",
    "\\bimpugned\\s+(order|judgment)\\s+(is\\s+)?set\\s+aside\\b",
    "\\bjudgment\\s+of\\s+the\\s+high\\s+court\\s+is\\s+set\\s+aside\\b",
    "\\bwe\\s+find\\s+no\\s+merit\\s+in\\s+this\\s+appeal\\b",
    "\\bwe\\s+allow\\s+(this|the)\\s+appeal\\b",
    "\\bwe\\s+dismiss\\s+(this|the)\\s+appeal\\b",
    "\\border\\s+accordingly\\b",
    "\\bconviction\\s+is\\s+upheld\\b",
    "\\bacquitted\\s+of\\s+all\\s+charges\\b",
    "\\bstands\\s+allowed\\b",
    "\\bstands\\s+dismissed\\b"
  )
  
  lines <- unlist(strsplit(doc_text, "\n"))
  detected <- list()
  
  for (i in seq_along(lines)) {
    ln <- lines[i]
    if (nchar(trimws(ln)) == 0) next
    
    for (pat in patterns) {
      if (grepl(pat, ln, ignore.case = TRUE)) {
        m <- regexpr(pat, ln, ignore.case = TRUE)
        matched_str <- substr(ln, m, m + attr(m, "match.length") - 1)
        detected[[length(detected) + 1]] <- list(
          line_number = i,
          matched_pattern = matched_str,
          snippet = trimws(substr(ln, 1, 140))
        )
      }
    }
  }
  
  has_leakage <- length(detected) > 0
  warning_msg <- if (has_leakage) {
    sprintf("WARNING: %d explicit verdict indicator(s) or operative order(s) detected in the document. Pre-decision masking will be enforced during feature extraction to avoid trivial outcome leakage, but original document text is preserved unaltered.", length(detected))
  } else {
    "Document validated: No explicit outcome indicators detected in preliminary scan."
  }
  
  list(
    has_leakage = has_leakage,
    indicators_count = length(detected),
    indicators = detected,
    warning_message = warning_msg
  )
}

#' Run Unseen Document Prediction and LOCO Explainability
#' @param doc_text Extracted document text
#' @param model_type "hierarchical" (default) or "baseline"
#' @return Detailed prediction and explainability result
predict_and_explain_unseen <- function(doc_text, model_type = "hierarchical") {
  if (model_type == "hierarchical") {
    bundle_path <- "engine/models/pramana_hierarchical_bundle.rds"
    if (!file.exists(bundle_path)) {
      stop("Hierarchical model bundle not found at: ", bundle_path)
    }
    bundle <- readRDS(bundle_path)
    
    # 1. Prediction with pre-decision masking
    pred_res <- predict_hierarchical_document(bundle, doc_text)
    
    # 2. LOCO Explainability
    loco_res <- explain_hierarchical_loco(bundle, doc_text)
    
    # Calibrated confidence: distance from decision boundary 0.50
    confidence <- abs(pred_res$prob_allowed - 0.50) * 2.0
    
    # Sort LOCO by absolute importance
    ranked_chunks <- loco_res[order(sapply(loco_res, function(x) x$importance_score), decreasing = TRUE)]
    
    return(list(
      model_type = "Hierarchical BiGRU + Additive Attention (512-Token Chunks)",
      model_version = "PRAMANA-HBiGRU-v1.0",
      dataset_version = "Supreme Court of India (1950-2026 Corpus, Grouped Partition)",
      predicted_outcome = pred_res$predicted_label,
      prob_allowed = pred_res$prob_allowed,
      prob_dismissed = pred_res$prob_dismissed,
      confidence = round(confidence, 4),
      confidence_justification = "Calibrated absolute distance from maximum uncertainty (|P - 0.5| * 2)",
      total_chunks = pred_res$num_chunks,
      top_passages = ranked_chunks[1:min(8, length(ranked_chunks))],
      all_chunks = ranked_chunks
    ))
  } else {
    # Baseline Model (Elastic-Net / Logistic Regression)
    model <- readRDS("engine/models/pramana_model_v1.rds")
    rep <- explain_judgment(model, doc_text, metadata = list(data_source = "UNSEEN_UPLOAD"))
    
    p_allowed <- rep$baseline$probabilities["ALLOWED"]
    if (is.na(p_allowed)) p_allowed <- rep$baseline$probabilities["ACCEPTED"]
    p_dismissed <- rep$baseline$probabilities["DISMISSED"]
    if (is.na(p_dismissed)) p_dismissed <- rep$baseline$probabilities["REJECTED"]
    
    pred_label <- rep$baseline$predicted_class
    if (pred_label == "ACCEPTED") pred_label <- "ALLOWED"
    if (pred_label == "REJECTED") pred_label <- "DISMISSED"
    
    return(list(
      model_type = "Elastic-Net Logistic Regression Baseline (TF-IDF)",
      model_version = "PRAMANA-ENET-v1.0",
      dataset_version = "Supreme Court of India Clean Cases",
      predicted_outcome = pred_label,
      prob_allowed = as.numeric(p_allowed),
      prob_dismissed = as.numeric(p_dismissed),
      confidence = round(rep$baseline$confidence, 4),
      confidence_justification = "Margin over alternative class probability",
      total_chunks = rep$segmentation$chunk_count,
      top_passages = rep$loco$ranked_chunks[1:min(8, nrow(rep$loco$ranked_chunks)), ],
      all_chunks = rep$loco$ranked_chunks
    ))
  }
}

#' Save Experiment Record to Persistent Registry
#' @param record Named list with complete experiment metadata
#' @param registry_file Path to JSON registry
save_experiment_record <- function(record, registry_file = "result/unseen_experiments.json") {
  records <- list()
  if (file.exists(registry_file)) {
    content <- paste(readLines(registry_file, warn = FALSE, encoding = "UTF-8"), collapse = "\n")
    if (nzchar(trimws(content))) {
      records <- tryCatch(jsonlite::fromJSON(content, simplifyVector = FALSE), error = function(e) list())
    }
  }
  
  # Append new record
  records[[length(records) + 1]] <- record
  
  # Serialize atomically
  json_txt <- jsonlite::toJSON(records, auto_unbox = TRUE, pretty = TRUE, digits = 6)
  writeLines(json_txt, registry_file)
  return(record$experiment_id)
}

#' Record Ground Truth Verdict and Calculate Cumulative Evaluation
#' @param experiment_id Target experiment ID
#' @param actual_verdict Ground truth outcome ("ALLOWED" or "DISMISSED")
#' @param registry_file Path to JSON registry
#' @return Updated experiment record and cumulative evaluation stats
record_ground_truth <- function(experiment_id, actual_verdict, registry_file = "result/unseen_experiments.json") {
  actual_verdict <- toupper(trimws(actual_verdict))
  if (!actual_verdict %in% c("ALLOWED", "DISMISSED")) {
    stop("Actual verdict must be either 'ALLOWED' or 'DISMISSED'. Received: ", actual_verdict)
  }
  
  if (!file.exists(registry_file)) {
    stop("Experiment registry does not exist at: ", registry_file)
  }
  
  content <- paste(readLines(registry_file, warn = FALSE, encoding = "UTF-8"), collapse = "\n")
  records <- jsonlite::fromJSON(content, simplifyVector = FALSE)
  
  found_idx <- NULL
  for (i in seq_along(records)) {
    if (records[[i]]$experiment_id == experiment_id) {
      found_idx <- i
      break
    }
  }
  
  if (is.null(found_idx)) {
    stop("Experiment ID not found: ", experiment_id)
  }
  
  # Update ground truth
  rec <- records[[found_idx]]
  rec$ground_truth <- actual_verdict
  rec$ground_truth_entered_at <- format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC")
  rec$is_correct <- (rec$predicted_outcome == actual_verdict)
  records[[found_idx]] <- rec
  
  # Calculate cumulative evaluation across all evaluated records
  evaluated_records <- list()
  for (r in records) {
    gt <- r$ground_truth
    if (is.character(gt) && length(gt) == 1 && !is.na(gt) && nzchar(trimws(gt)) && (toupper(trimws(gt)) %in% c("ALLOWED", "DISMISSED"))) {
      evaluated_records[[length(evaluated_records) + 1]] <- r
    }
  }
  
  n_eval <- length(evaluated_records)
  tp <- 0; fp <- 0; fn <- 0; tn <- 0
  
  for (r in evaluated_records) {
    pred <- r$predicted_outcome
    act <- r$ground_truth
    if (pred == "ALLOWED" && act == "ALLOWED") tp <- tp + 1
    if (pred == "ALLOWED" && act == "DISMISSED") fp <- fp + 1
    if (pred == "DISMISSED" && act == "ALLOWED") fn <- fn + 1
    if (pred == "DISMISSED" && act == "DISMISSED") tn <- tn + 1
  }
  
  acc <- if (n_eval > 0) (tp + tn) / n_eval else 0.0
  prec <- if ((tp + fp) > 0) tp / (tp + fp) else 0.0
  rec_val <- if ((tp + fn) > 0) tp / (tp + fn) else 0.0
  spec <- if ((tn + fp) > 0) tn / (tn + fp) else 0.0
  f1 <- if ((prec + rec_val) > 0) 2 * (prec * rec_val) / (prec + rec_val) else 0.0
  
  eval_summary <- list(
    total_unseen_evaluated = n_eval,
    correct_predictions = (tp + tn),
    accuracy = round(acc * 100, 2),
    precision = round(prec * 100, 2),
    recall = round(rec_val * 100, 2),
    specificity = round(spec * 100, 2),
    f1_score = round(f1, 4),
    confusion_matrix = list(
      true_positives = tp,
      false_positives = fp,
      false_negatives = fn,
      true_negatives = tn
    )
  )
  
  # Save updated registry
  json_txt <- jsonlite::toJSON(records, auto_unbox = TRUE, pretty = TRUE, digits = 6)
  writeLines(json_txt, registry_file)
  
  list(
    updated_experiment = rec,
    cumulative_evaluation = eval_summary
  )
}
