# engine/pramana_cli.R
# Command-line interface bridging external calls to the R explainability & unseen document engines.
# Serializes full predictions, explainability results, and experiment records into structured JSON.

suppressPackageStartupMessages({
  library(jsonlite)
  library(digest)
})

source("engine/explainability.R")
source("R/hierarchical_model.R")
source("R/unseen_document_pipeline.R")

# Parse command line arguments
args <- commandArgs(trailingOnly = TRUE)

parse_args <- function(args) {
  params <- list(
    action = "explain",
    model = "hierarchical",
    case_id = "1",
    data_source = "SAMPLE_ENGINEERING_FIXTURE",
    file = NULL,
    text = NULL,
    experiment_id = NULL,
    ground_truth = NULL,
    output = NULL,
    seed = 42,
    trials = 30
  )
  
  i <- 1
  while (i <= length(args)) {
    arg <- args[i]
    if (arg == "--action" && i < length(args)) {
      params$action <- args[i + 1]
      i <- i + 2
    } else if (arg == "--model" && i < length(args)) {
      params$model <- args[i + 1]
      i <- i + 2
    } else if (arg == "--case_id" && i < length(args)) {
      params$case_id <- args[i + 1]
      i <- i + 2
    } else if (arg == "--data_source" && i < length(args)) {
      params$data_source <- args[i + 1]
      i <- i + 2
    } else if (arg == "--file" && i < length(args)) {
      params$file <- args[i + 1]
      i <- i + 2
    } else if (arg == "--text" && i < length(args)) {
      params$text <- args[i + 1]
      i <- i + 2
    } else if (arg == "--experiment_id" && i < length(args)) {
      params$experiment_id <- args[i + 1]
      i <- i + 2
    } else if (arg == "--ground_truth" && i < length(args)) {
      params$ground_truth <- args[i + 1]
      i <- i + 2
    } else if (arg == "--output" && i < length(args)) {
      params$output <- args[i + 1]
      i <- i + 2
    } else if (arg == "--seed" && i < length(args)) {
      params$seed <- as.integer(args[i + 1])
      i <- i + 2
    } else if (arg == "--trials" && i < length(args)) {
      params$trials <- as.integer(args[i + 1])
      i <- i + 2
    } else {
      i <- i + 1
    }
  }
  params
}

params <- parse_args(args)

# Helper to output JSON
emit_json <- function(obj, output_path = NULL) {
  res_json <- jsonlite::toJSON(obj, auto_unbox = TRUE, pretty = TRUE, digits = 6)
  if (!is.null(output_path)) {
    writeLines(res_json, output_path)
    cat(sprintf("Output saved to %s\n", output_path))
  } else {
    cat(res_json)
  }
}

# -------------------------------------------------------------
# ACTION: list_cases
# -------------------------------------------------------------
if (params$action == "list_cases") {
  cases_list <- list()
  
  # 1. Real Indian Supreme Court Judgments (Held-Out Test Set)
  test_cases_path <- "data/test/test_cases.csv"
  if (file.exists(test_cases_path)) {
    test_df <- read.csv(test_cases_path, stringsAsFactors = FALSE)
    n_display <- min(25, nrow(test_df))
    for (i in 1:n_display) {
      r <- test_df[i, ]
      stem <- r$path_stem
      yr <- r$year
      
      txt_path <- file.path("data/processed/extracted_text", sprintf("year=%d", yr), paste0(stem, "_EN.txt"))
      if (!file.exists(txt_path)) {
        txt_path <- file.path("data/processed/extracted_text", sprintf("year=%d", yr), paste0(stem, ".txt"))
      }
      
      preview_txt <- ""
      w_cnt <- 0
      if (file.exists(txt_path)) {
        lines <- readLines(txt_path, n = 10, warn = FALSE, encoding = "UTF-8")
        preview_txt <- substr(paste(lines, collapse = " "), 1, 150)
        all_lines <- readLines(txt_path, warn = FALSE, encoding = "UTF-8")
        w_cnt <- length(unlist(strsplit(paste(all_lines, collapse = " "), "\\s+")))
      }
      
      cases_list[[length(cases_list) + 1]] <- list(
        id = paste0("real_", r$year, "_", stem),
        case_id = r$case_id,
        title = sprintf("%s (%s - %s)", r$citation, r$case_id, r$year),
        case_title = r$case_title,
        true_label = r$normalized_outcome,
        data_source = "REAL_INSC_JUDGMENT",
        data_source_label = "Real Indian Legal Judgment (Supreme Court of India)",
        word_count = w_cnt,
        preview = preview_txt,
        path_stem = stem,
        year = yr
      )
    }
  }
  
  # 2. Modern 2026 Supreme Court Judgments (Present Time)
  legal_cases_path <- "data/processed/legal_cases.csv"
  if (file.exists(legal_cases_path)) {
    all_cases <- read.csv(legal_cases_path, stringsAsFactors = FALSE)
    cases_2026 <- all_cases[all_cases$year == 2026 & all_cases$normalized_outcome %in% c("ALLOWED", "DISMISSED"), ]
    n_2026 <- min(15, nrow(cases_2026))
    if (n_2026 > 0) {
      for (i in 1:n_2026) {
        r <- cases_2026[i, ]
        stem <- r$path_stem
        txt_path <- file.path("data/processed/extracted_text", "year=2026", paste0(stem, "_EN.txt"))
        if (!file.exists(txt_path)) {
          txt_path <- file.path("data/processed/extracted_text", "year=2026", paste0(stem, ".txt"))
        }
        
        preview_txt <- ""
        w_cnt <- 0
        if (file.exists(txt_path)) {
          lines <- readLines(txt_path, n = 10, warn = FALSE, encoding = "UTF-8")
          preview_txt <- substr(paste(lines, collapse = " "), 1, 150)
          all_lines <- readLines(txt_path, warn = FALSE, encoding = "UTF-8")
          w_cnt <- length(unlist(strsplit(paste(all_lines, collapse = " "), "\\s+")))
        }
        
        cases_list[[length(cases_list) + 1]] <- list(
          id = paste0("real_2026_", stem),
          case_id = r$case_id,
          title = sprintf("%s (%s - 2026 Present)", r$case_id, r$citation),
          case_title = r$case_title,
          true_label = r$normalized_outcome,
          data_source = "REAL_INSC_JUDGMENT",
          data_source_label = "Present-Day Indian Supreme Court Judgment (2026)",
          word_count = w_cnt,
          preview = preview_txt,
          path_stem = stem,
          year = 2026
        )
      }
    }
  }
  
  # 3. Add real judgment fixture
  cases_list[[length(cases_list) + 1]] <- list(
    id = "real_sc_01",
    title = "Authentic SC Judgment (Criminal Appeal No. 4250 of 2024 / 2025 INSC 1153)",
    case_title = "Criminal Appeal No. 4250 of 2024",
    true_label = "DISMISSED",
    data_source = "REAL_INSC_JUDGMENT",
    data_source_label = "Real Indian Legal Judgment (Supreme Court of India)",
    word_count = 5072,
    preview = "REPORTABLE IN THE SUPREME COURT OF INDIA CRIMINAL APPELLATE JURISDICTION CRIMINAL APPEAL NO. 4250 OF 2024..."
  )
  
  # 4. Add sample cases (strictly marked as engineering fixture)
  if (file.exists("result/cases_clean (1).csv") && file.exists("result/cases_25_labels.csv")) {
    cases <- read.csv("result/cases_clean (1).csv", stringsAsFactors = FALSE)
    labels_df <- read.csv("result/cases_25_labels.csv", stringsAsFactors = FALSE)
    merged <- merge(cases, labels_df, by = "id")
    for (i in 1:min(5, nrow(merged))) {
      cases_list[[length(cases_list) + 1]] <- list(
        id = as.character(merged$id[i]),
        title = sprintf("Sample Case %02d (Synthetic Fixture)", merged$id[i]),
        case_title = sprintf("Synthetic Test Case %02d", merged$id[i]),
        true_label = merged$true_label[i],
        data_source = "SAMPLE_ENGINEERING_FIXTURE",
        data_source_label = "Sample / Synthetic Data (Engineering Test Fixture Only)",
        word_count = merged$word_count[i],
        preview = substr(merged$clean_text[i], 1, 120)
      )
    }
  }
  
  emit_json(cases_list, params$output)
  quit(status = 0)
}

# -------------------------------------------------------------
# ACTION: predict_unseen
# -------------------------------------------------------------
if (params$action == "predict_unseen") {
  doc_text <- NULL
  file_name <- "Custom_Input_Text"
  file_hash <- "N/A"
  
  if (!is.null(params$file) && file.exists(params$file)) {
    doc_text <- extract_document_text(params$file)
    file_name <- basename(params$file)
    hashes <- generate_document_hashes(params$file, doc_text)
    file_hash <- hashes$file_hash
    text_hash <- hashes$text_hash
  } else if (!is.null(params$text) && nchar(params$text) > 0) {
    doc_text <- trimws(params$text)
    text_hash <- digest::digest(doc_text, algo = "sha256")
    file_hash <- text_hash
  } else {
    stop("Neither --file nor --text provided for unseen prediction.")
  }
  
  # 1. Dataset Presence Check
  presence <- check_dataset_presence(text_hash, doc_text)
  
  # 2. Verdict Indicator Audit
  indicator_audit <- audit_verdict_indicators(doc_text)
  
  # 3. Model Inference & LOCO Explainability
  model_choice <- if (!is.null(params$model)) params$model else "hierarchical"
  pred_res <- predict_and_explain_unseen(doc_text, model_type = model_choice)
  
  # 4. Formulate Experiment Record
  exp_id <- paste0("EXP_", format(Sys.time(), "%Y%m%d_%H%M%S"), "_", substr(text_hash, 1, 8))
  
  # Save clean uploaded text for inspection
  saved_text_path <- file.path("data/unseen_uploads", paste0(exp_id, ".txt"))
  writeLines(doc_text, saved_text_path)
  
  record <- list(
    experiment_id = exp_id,
    document_name = file_name,
    file_hash = file_hash,
    text_hash = text_hash,
    upload_timestamp = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
    model_type = pred_res$model_type,
    model_version = pred_res$model_version,
    dataset_version = pred_res$dataset_version,
    predicted_outcome = pred_res$predicted_outcome,
    prob_allowed = pred_res$prob_allowed,
    prob_dismissed = pred_res$prob_dismissed,
    confidence = pred_res$confidence,
    confidence_justification = pred_res$confidence_justification,
    dataset_presence = presence,
    verdict_warnings = indicator_audit$warning_message,
    indicators_count = indicator_audit$indicators_count,
    detected_indicators = indicator_audit$indicators,
    total_chunks = pred_res$total_chunks,
    word_count = length(unlist(strsplit(doc_text, "\\s+"))),
    top_passages = pred_res$top_passages,
    ground_truth = NULL,
    ground_truth_entered_at = NULL,
    is_correct = NULL,
    text_preview = substr(doc_text, 1, 1200)
  )
  
  save_experiment_record(record, "result/unseen_experiments.json")
  emit_json(record, params$output)
  quit(status = 0)
}

# -------------------------------------------------------------
# ACTION: record_ground_truth
# -------------------------------------------------------------
if (params$action == "record_ground_truth") {
  if (is.null(params$experiment_id) || is.null(params$ground_truth)) {
    stop("Both --experiment_id and --ground_truth ('ALLOWED' or 'DISMISSED') are required.")
  }
  
  eval_res <- record_ground_truth(params$experiment_id, params$ground_truth, "result/unseen_experiments.json")
  emit_json(eval_res, params$output)
  quit(status = 0)
}

# -------------------------------------------------------------
# ACTION: list_experiments
# -------------------------------------------------------------
if (params$action == "list_experiments") {
  reg_file <- "result/unseen_experiments.json"
  records <- list()
  if (file.exists(reg_file)) {
    content <- paste(readLines(reg_file, warn = FALSE, encoding = "UTF-8"), collapse = "\n")
    if (nzchar(trimws(content))) {
      records <- tryCatch(jsonlite::fromJSON(content, simplifyVector = FALSE), error = function(e) list())
    }
  }
  
  # Compute cumulative evaluation
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
  
  eval_summary <- list(
    total_experiments = length(records),
    total_evaluated = n_eval,
    accuracy = if (n_eval > 0) round(((tp + tn) / n_eval) * 100, 2) else 0.0,
    confusion_matrix = list(
      true_positives = tp,
      false_positives = fp,
      false_negatives = fn,
      true_negatives = tn
    )
  )
  
  out_obj <- list(
    experiments = records,
    evaluation_summary = eval_summary
  )
  
  emit_json(out_obj, params$output)
  quit(status = 0)
}

# -------------------------------------------------------------
# ACTION: explain (Legacy / Interactive Explorer)
# -------------------------------------------------------------
if (params$action == "explain") {
  load_or_train_baseline <- function() {
    real_model_path <- "engine/models/pramana_model_v1.rds"
    if (file.exists(real_model_path)) {
      return(readRDS(real_model_path))
    }
    cases <- read.csv("result/cases_clean (1).csv", stringsAsFactors = FALSE)
    labels_df <- read.csv("result/cases_25_labels.csv", stringsAsFactors = FALSE)
    merged <- merge(cases, labels_df, by = "id")
    train_legal_model(merged$clean_text, merged$true_label)
  }
  
  doc_text <- NULL
  data_src <- params$data_source
  case_title <- "Custom Query Judgment"
  
  if (!is.null(params$text) && nchar(params$text) > 0) {
    doc_text <- params$text
    case_title <- "User Submitted Text"
  } else if (!is.null(params$file) && file.exists(params$file)) {
    doc_text <- extract_document_text(params$file)
    case_title <- basename(params$file)
  } else if (startsWith(params$case_id, "real_") && params$case_id != "real_sc_01") {
    parts <- strsplit(params$case_id, "_")[[1]]
    yr <- parts[2]
    stem <- paste(parts[3:length(parts)], collapse = "_")
    
    txt_path <- file.path("data/processed/extracted_text", sprintf("year=%s", yr), paste0(stem, "_EN.txt"))
    if (!file.exists(txt_path)) {
      txt_path <- file.path("data/processed/extracted_text", sprintf("year=%s", yr), paste0(stem, ".txt"))
    }
    
    if (file.exists(txt_path)) {
      doc_text <- paste(readLines(txt_path, warn = FALSE, encoding = "UTF-8"), collapse = "\n")
      data_src <- "REAL_INSC_JUDGMENT"
      case_title <- paste("Supreme Court Judgment", stem, paste0("(", yr, ")"))
    } else {
      stop("Could not locate extracted text for: ", params$case_id)
    }
  } else if (params$case_id == "real_sc_01") {
    doc_text <- extract_document_text("data/raw_data/road_contract.pdf")
    data_src <- "REAL_INSC_JUDGMENT"
    case_title <- "Authentic Supreme Court Judgment (2025 INSC 1153)"
  } else {
    cid <- as.integer(params$case_id)
    cases <- read.csv("result/cases_clean (1).csv", stringsAsFactors = FALSE)
    row_match <- which(cases$id == cid)
    if (length(row_match) == 0) row_match <- 1
    doc_text <- cases$clean_text[row_match]
    data_src <- "SAMPLE_ENGINEERING_FIXTURE"
    case_title <- sprintf("Sample Case %02d (Synthetic Fixture)", cid)
  }
  
  # Standard explainability pipeline
  model <- load_or_train_baseline()
  report <- explain_judgment(
    model = model,
    full_text = doc_text,
    metadata = list(
      case_id = params$case_id,
      case_title = case_title,
      data_source = data_src
    ),
    random_seed = params$seed,
    n_random_trials = params$trials
  )
  
  emit_json(report, params$output)
  quit(status = 0)
}
