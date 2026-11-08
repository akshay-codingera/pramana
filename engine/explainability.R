# engine/explainability.R
# Core explainability engine for PRAMANA:
# 1. Context-based iterative chunk removal (Leave-One-Chunk-Out)
# 2. Random removal baseline with statistical comparisons
# 3. Progressive Top-K removal
# 4. Budget-constrained counterfactual combinatorial search
# All operations implemented purely in R.

source("engine/segmentation.R")
source("engine/model.R")

#' Run baseline prediction on full document
#' @param model A trained legal_outcome_model
#' @param text Complete document text
#' @return Baseline prediction list
get_baseline_prediction <- function(model, text) {
  pred <- predict_document(model, text)
  list(
    predicted_class = pred$predicted_class,
    probabilities = pred$probabilities,
    confidence = pred$confidence,
    logit = pred$logit
  )
}

#' Run Leave-One-Chunk-Out (LOCO) sensitivity analysis
#' @param model Trained model
#' @param full_text Document text
#' @param seg_result Output from segment_judgment
#' @param baseline Output from get_baseline_prediction
#' @return List with ranked chunks, contributions, and category splits
run_loco <- function(model, full_text, seg_result, baseline) {
  chunks_df <- seg_result$chunks
  n_chunks <- nrow(chunks_df)
  orig_class <- baseline$predicted_class
  orig_prob <- baseline$probabilities[orig_class]
  
  if (n_chunks == 0) {
    return(list(
      ranked_chunks = data.frame(),
      supporting_chunks = data.frame(),
      opposing_chunks = data.frame(),
      neutral_chunks = data.frame()
    ))
  }
  
  contributions <- numeric(n_chunks)
  new_probs <- numeric(n_chunks)
  new_classes <- character(n_chunks)
  class_flipped <- logical(n_chunks)
  
  for (i in 1:n_chunks) {
    target_id <- chunks_df$chunk_id[i]
    # Reconstruct document without this chunk
    ablated_text <- reconstruct_without_chunks(seg_result, c(target_id))
    
    # Predict on ablated document
    ablated_pred <- predict_document(model, ablated_text)
    ablated_prob <- ablated_pred$probabilities[orig_class]
    
    # Contribution(i) = P(orig | full) - P(orig | full \ {i})
    # Positive delta: removing chunk decreases confidence -> chunk SUPPORTS original prediction
    # Negative delta: removing chunk increases confidence -> chunk OPPOSES original prediction
    delta_p <- as.numeric(orig_prob - ablated_prob)
    
    contributions[i] <- delta_p
    new_probs[i] <- as.numeric(ablated_prob)
    new_classes[i] <- ablated_pred$predicted_class
    class_flipped[i] <- (ablated_pred$predicted_class != orig_class)
  }
  
  results_df <- data.frame(
    chunk_id = chunks_df$chunk_id,
    paragraph_num = chunks_df$paragraph_num,
    section_heading = chunks_df$section_heading,
    start_char = chunks_df$start_char,
    end_char = chunks_df$end_char,
    word_count = chunks_df$word_count,
    text_preview = ifelse(nchar(chunks_df$text) > 80,
                          paste0(substr(chunks_df$text, 1, 77), "..."),
                          chunks_df$text),
    original_prob = as.numeric(orig_prob),
    ablated_prob = new_probs,
    contribution = contributions,
    ablated_class = new_classes,
    class_flipped = class_flipped,
    stringsAsFactors = FALSE
  )
  
  # Categorize chunks with sensitive epsilon
  results_df$role <- ifelse(results_df$contribution > 1e-7, "SUPPORTING",
                     ifelse(results_df$contribution < -1e-7, "OPPOSING", "NEUTRAL"))
  
  # Rank by absolute influence / contribution
  results_df$rank <- order(order(results_df$contribution, decreasing = TRUE))
  results_df <- results_df[order(results_df$contribution, decreasing = TRUE), ]
  rownames(results_df) <- NULL
  
  supporting <- results_df[results_df$role == "SUPPORTING", ]
  opposing <- results_df[results_df$role == "OPPOSING", ]
  neutral <- results_df[results_df$role == "NEUTRAL", ]
  
  list(
    ranked_chunks = results_df,
    supporting_chunks = supporting,
    opposing_chunks = opposing,
    neutral_chunks = neutral
  )
}

#' Run Random Removal Baseline
#' Compares drop in probability between influential chunk removal and random chunk removal
#' @param model Trained model
#' @param full_text Document text
#' @param seg_result Output from segment_judgment
#' @param baseline Baseline prediction
#' @param loco_result Output from run_loco
#' @param n_trials Number of random trials (default 30)
#' @param seed Random seed for reproducibility
#' @return List with trial results, summary statistics, and comparison metrics
run_random_baseline <- function(model, full_text, seg_result, baseline, loco_result,
                                n_trials = 30, seed = 42) {
  set.seed(seed)
  chunks_df <- seg_result$chunks
  n_chunks <- nrow(chunks_df)
  orig_class <- baseline$predicted_class
  orig_prob <- baseline$probabilities[orig_class]
  
  if (n_chunks <= 1) {
    return(list(
      seed = seed,
      n_trials = 0,
      random_drops = numeric(0),
      mean_random_drop = 0,
      sd_random_drop = 0,
      top1_influential_drop = 0,
      ratio_top1_to_random = 1.0,
      p_value = 1.0
    ))
  }
  
  top1_drop <- if (nrow(loco_result$ranked_chunks) > 0) {
    loco_result$ranked_chunks$contribution[1]
  } else 0
  
  # Repeated single-chunk random removal trials
  random_drops <- numeric(n_trials)
  sampled_chunk_ids <- character(n_trials)
  
  for (t in 1:n_trials) {
    sampled_idx <- sample(1:n_chunks, 1)
    sampled_id <- chunks_df$chunk_id[sampled_idx]
    sampled_chunk_ids[t] <- sampled_id
    
    ablated_text <- reconstruct_without_chunks(seg_result, c(sampled_id))
    ablated_pred <- predict_document(model, ablated_text)
    ablated_prob <- ablated_pred$probabilities[orig_class]
    
    random_drops[t] <- as.numeric(orig_prob - ablated_prob)
  }
  
  mean_drop <- mean(random_drops)
  sd_drop <- sd(random_drops)
  if (is.na(sd_drop)) sd_drop <- 0
  
  # Empirical p-value: proportion of random trials that produce a drop >= top1_drop
  emp_p_val <- sum(random_drops >= top1_drop) / n_trials
  z_score <- if (sd_drop > 1e-6) (top1_drop - mean_drop) / sd_drop else 0
  
  list(
    seed = seed,
    n_trials = n_trials,
    random_drops = random_drops,
    sampled_chunks = sampled_chunk_ids,
    mean_random_drop = as.numeric(mean_drop),
    sd_random_drop = as.numeric(sd_drop),
    min_random_drop = as.numeric(min(random_drops)),
    max_random_drop = as.numeric(max(random_drops)),
    top1_influential_drop = as.numeric(top1_drop),
    z_score = as.numeric(z_score),
    empirical_p_value = as.numeric(emp_p_val),
    ratio_top1_to_random_mean = as.numeric(if (abs(mean_drop) > 1e-6) top1_drop / mean_drop else 0)
  )
}

#' Run Top-K Progressive Removal
#' Removes top 1, 3, 5, 10 highest-ranked chunks and tracks probability changes
#' @param model Trained model
#' @param full_text Document text
#' @param seg_result Output from segment_judgment
#' @param baseline Baseline prediction
#' @param loco_result Output from run_loco
#' @param k_values Integer vector of K values (default c(1, 3, 5, 10))
#' @return Data frame of Top-K removal progression
run_top_k_removal <- function(model, full_text, seg_result, baseline, loco_result,
                              k_values = c(1, 3, 5, 10)) {
  ranked_df <- loco_result$ranked_chunks
  n_available <- nrow(ranked_df)
  orig_class <- baseline$predicted_class
  orig_prob <- baseline$probabilities[orig_class]
  
  records <- list()
  
  for (k in k_values) {
    actual_k <- min(k, n_available)
    if (actual_k == 0) next
    
    top_ids <- ranked_df$chunk_id[1:actual_k]
    ablated_text <- reconstruct_without_chunks(seg_result, top_ids)
    ablated_pred <- predict_document(model, ablated_text)
    
    ablated_prob <- ablated_pred$probabilities[orig_class]
    cumulative_drop <- as.numeric(orig_prob - ablated_prob)
    
    records[[length(records) + 1]] <- data.frame(
      k = as.integer(k),
      actual_k = as.integer(actual_k),
      removed_chunks = paste(top_ids, collapse = ", "),
      remaining_prob = as.numeric(ablated_prob),
      cumulative_drop = as.numeric(cumulative_drop),
      predicted_class = ablated_pred$predicted_class,
      class_flipped = (ablated_pred$predicted_class != orig_class),
      confidence = as.numeric(ablated_pred$confidence),
      stringsAsFactors = FALSE
    )
  }
  
  if (length(records) == 0) return(data.frame())
  do.call(rbind, records)
}

#' Budget-constrained Counterfactual Combinatorial Search
#' Searches for the minimal set of chunks whose removal flips the predicted class
#' @param model Trained model
#' @param full_text Document text
#' @param seg_result Output from segment_judgment
#' @param baseline Baseline prediction
#' @param loco_result Output from run_loco
#' @param max_depth Maximum combination size to explore (default 5)
#' @param search_budget Maximum number of model evaluations (default 50)
#' @return List detailing counterfactual outcome, search statistics, and research disclaimer
run_counterfactual_analysis <- function(model, full_text, seg_result, baseline, loco_result,
                                        max_depth = 5, search_budget = 50) {
  orig_class <- baseline$predicted_class
  orig_prob <- baseline$probabilities[orig_class]
  ranked_df <- loco_result$ranked_chunks
  
  disclaimer <- paste(
    "RESEARCH DISCLAIMER: Counterfactual chunk removal identifies the minimal textual",
    "modifications that alter the statistical model's output score. This measures",
    "classifier sensitivity to specific lexical patterns, NOT legal causality or judicial",
    "decision-making logic. In genuine legal proceedings, an outcome depends on statutory",
    "interpretation and procedural law, not token ablation."
  )
  
  if (nrow(ranked_df) == 0) {
    return(list(
      counterfactual_found = FALSE,
      minimal_chunk_combination = character(0),
      search_budget = search_budget,
      evaluations_used = 0,
      original_class = orig_class,
      counterfactual_class = NA_character_,
      original_prob = orig_prob,
      counterfactual_prob = NA_real_,
      caveat = disclaimer
    ))
  }
  
  # Check if single chunk already flips
  flipped_single <- ranked_df[ranked_df$class_flipped, ]
  if (nrow(flipped_single) > 0) {
    best_single <- flipped_single[1, ]
    return(list(
      counterfactual_found = TRUE,
      minimal_chunk_combination = c(best_single$chunk_id),
      combination_size = 1L,
      search_budget = search_budget,
      evaluations_used = nrow(ranked_df),
      original_class = orig_class,
      counterfactual_class = best_single$ablated_class,
      original_prob = as.numeric(orig_prob),
      counterfactual_prob = as.numeric(best_single$ablated_prob),
      caveat = disclaimer
    ))
  }
  
  # Forward greedy beam search among top influential chunks
  candidate_pool <- ranked_df$chunk_id[ranked_df$contribution > 0]
  if (length(candidate_pool) == 0) {
    candidate_pool <- head(ranked_df$chunk_id, 8)
  } else {
    candidate_pool <- head(candidate_pool, 10)
  }
  
  evals <- 0
  found_comb <- NULL
  found_pred <- NULL
  
  # Evaluate combinations of depth 2 up to max_depth
  if (length(candidate_pool) >= 2) {
    max_d <- min(max_depth, length(candidate_pool))
    for (d in 2:max_d) {
      combs <- combn(candidate_pool, d, simplify = FALSE)
      
      for (combo in combs) {
        evals <- evals + 1
        if (evals > search_budget) break
        
        ablated_text <- reconstruct_without_chunks(seg_result, combo)
        pred <- predict_document(model, ablated_text)
        
        if (pred$predicted_class != orig_class) {
          found_comb <- combo
          found_pred <- pred
          break
        }
      }
      
      if (!is.null(found_comb) || evals >= search_budget) break
    }
  }
  
  if (!is.null(found_comb)) {
    list(
      counterfactual_found = TRUE,
      minimal_chunk_combination = found_comb,
      combination_size = length(found_comb),
      search_budget = search_budget,
      evaluations_used = evals,
      original_class = orig_class,
      counterfactual_class = found_pred$predicted_class,
      original_prob = as.numeric(orig_prob),
      counterfactual_prob = as.numeric(found_pred$probabilities[orig_class]),
      caveat = disclaimer
    )
  } else {
    list(
      counterfactual_found = FALSE,
      minimal_chunk_combination = character(0),
      combination_size = 0L,
      search_budget = search_budget,
      evaluations_used = evals,
      original_class = orig_class,
      counterfactual_class = NA_character_,
      original_prob = as.numeric(orig_prob),
      counterfactual_prob = NA_real_,
      caveat = disclaimer
    )
  }
}

#' Complete Explainability Pipeline Orchestration
#' Runs segmentation, baseline, LOCO, random baseline, Top-K, and counterfactual analysis
#' @param model Trained model
#' @param full_text Document text
#' @param metadata Named list of document metadata (e.g. data_source, case_id)
#' @param random_seed Seed for random removal baseline
#' @param n_random_trials Number of random trials
#' @return Comprehensive explainability report list
explain_judgment <- function(model, full_text, metadata = list(),
                             random_seed = 42, n_random_trials = 30) {
  # 1. Segmentation
  seg_result <- segment_judgment(full_text)
  
  # 2. Baseline Prediction
  baseline <- get_baseline_prediction(model, full_text)
  
  # 3. Leave-One-Chunk-Out (LOCO)
  loco_result <- run_loco(model, full_text, seg_result, baseline)
  
  # 4. Random Removal Baseline
  random_result <- run_random_baseline(model, full_text, seg_result, baseline,
                                       loco_result, n_trials = n_random_trials, seed = random_seed)
  
  # 5. Top-K Removal
  top_k_result <- run_top_k_removal(model, full_text, seg_result, baseline,
                                    loco_result, k_values = c(1, 3, 5, 10))
  
  # 6. Counterfactual Analysis
  cf_result <- run_counterfactual_analysis(model, full_text, seg_result, baseline,
                                           loco_result, max_depth = 5, search_budget = 50)
  
  # Default metadata tagging
  data_source <- if (!is.null(metadata$data_source)) {
    metadata$data_source
  } else {
    "SAMPLE_ENGINEERING_FIXTURE"
  }
  
  list(
    meta = list(
      case_id = if (!is.null(metadata$case_id)) metadata$case_id else "doc_01",
      data_source = data_source,
      data_source_label = if (data_source == "REAL_INSC_JUDGMENT") {
        "Real Indian Legal Judgment (Supreme Court of India)"
      } else {
        "Sample / Synthetic Data (Engineering Test Fixture Only)"
      },
      is_sample_fixture = (data_source != "REAL_INSC_JUDGMENT"),
      generated_at = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC", tz = "UTC"),
      r_version = R.version.string
    ),
    segmentation = list(
      chunk_count = seg_result$chunk_count,
      full_text = seg_result$full_text,
      chunks = seg_result$chunks
    ),
    baseline = baseline,
    loco = loco_result,
    random_baseline = random_result,
    top_k_removal = top_k_result,
    counterfactual = cf_result
  )
}
