# ==============================================================================
# PRAMANA — Indian Supreme Court Verdict Prediction Research
# Script: R/hierarchical_model.R
# Architecture: Hierarchical Chunk-Based Document Modeling (BiGRU + Attention)
# Author: Senior ML Engineer / Legal NLP Research Scientist
# Reference: ILDC for CJPE (ACL 2021)
# ==============================================================================

suppressPackageStartupMessages({
  library(reticulate)
  library(dplyr)
  library(stringr)
  library(stringi)
  library(jsonlite)
})

# Source legal segmentation engine
source("engine/segmentation.R")

# Import isolated PyTorch neural engine
py_nn <- import_from_path("hierarchical_nn", path = "engine")

cat("Hierarchical Neural Engine loaded successfully via reticulate.\n")

#' Build Vocabulary and Dense Projection for Chunks in R
#'
#' @param text_corpus List of judgment texts
#' @param vocab_size Max vocabulary size (default: 5000)
#' @param proj_dim Target dense embedding dimension (default: 256)
build_chunk_projector <- function(text_corpus, vocab_size = 5000, proj_dim = 256) {
  cat(sprintf("Building legal chunk vocabulary (top %d terms) across %d documents...\n", 
              vocab_size, length(text_corpus)))
  
  # Fast tokenization & term frequencies in R
  all_words <- unlist(lapply(text_corpus, function(txt) {
    w <- tolower(unlist(strsplit(gsub("[^a-zA-Z0-9_]", " ", txt), "\\s+")))
    w[nchar(w) >= 3 & nchar(w) <= 25]
  }))
  
  tbl <- sort(table(all_words), decreasing = TRUE)
  vocab <- names(head(tbl, vocab_size))
  
  # Random projection matrix (Achlioptas / Johnson-Lindenstrauss lemma)
  set.seed(42)
  proj_matrix <- matrix(rnorm(vocab_size * proj_dim, mean = 0, sd = 1 / sqrt(proj_dim)), 
                        nrow = vocab_size, ncol = proj_dim)
  rownames(proj_matrix) <- vocab
  
  return(list(
    vocab = vocab,
    vocab_map = setNames(seq_along(vocab), vocab),
    proj_matrix = proj_matrix,
    proj_dim = proj_dim
  ))
}

#' Convert Document into Sequence of Chunk Embedding Vectors with Pre-Decision Masking
#'
#' @param text Judgment text
#' @param projector Chunk projector bundle
#' @param max_chunks Maximum chunks per document (default: 32)
#' @return List containing chunk_matrix and chunk_metadata
embed_document_chunks <- function(text, projector, max_chunks = 32) {
  seg <- segment_judgment(text)
  df_chunks <- seg$chunks
  
  if (nrow(df_chunks) == 0) {
    return(list(
      chunk_matrix = matrix(0, nrow = 1, ncol = projector$proj_dim),
      chunk_metadata = list(list(chunk_id = "chunk_1", chunk_text = text, paragraph_num = 1, start_char = 1, end_char = nchar(text)))
    ))
  }
  
  # Pre-decision masking: mask out operative disposition chunks at the end of the document
  is_operative <- sapply(seq_len(nrow(df_chunks)), function(k) {
    if (k < nrow(df_chunks) - 2) return(FALSE)
    txt <- tolower(df_chunks$text[k])
    grepl("appeal.*allowed|appeal.*dismissed|order accordingly|conviction.*set aside|petition.*allowed|petition.*dismissed", txt)
  })
  
  keep_indices <- which(!is_operative)
  if (length(keep_indices) == 0) {
    keep_indices <- seq_len(min(nrow(df_chunks), max_chunks))
  } else if (length(keep_indices) > max_chunks) {
    keep_indices <- keep_indices[1:max_chunks]
  }
  
  pre_decision_df <- df_chunks[keep_indices, ]
  num_chunks <- nrow(pre_decision_df)
  chunk_mat <- matrix(0, nrow = num_chunks, ncol = projector$proj_dim)
  
  chunk_meta_list <- list()
  for (k in seq_len(num_chunks)) {
    c_text <- pre_decision_df$text[k]
    chunk_meta_list[[k]] <- list(
      chunk_id = pre_decision_df$chunk_id[k],
      paragraph_num = pre_decision_df$paragraph_num[k],
      start_char = pre_decision_df$start_char[k],
      end_char = pre_decision_df$end_char[k],
      chunk_text = c_text
    )
    
    words <- tolower(unlist(strsplit(gsub("[^a-zA-Z0-9_]", " ", c_text), "\\s+")))
    words <- words[words %in% projector$vocab]
    
    if (length(words) > 0) {
      word_counts <- table(words)
      w_names <- names(word_counts)
      w_indices <- projector$vocab_map[w_names]
      
      tf_vals <- as.numeric(word_counts) / length(words)
      sub_proj <- projector$proj_matrix[w_indices, , drop = FALSE]
      chunk_vec <- colSums(sub_proj * tf_vals)
      
      norm_val <- sqrt(sum(chunk_vec^2))
      if (norm_val > 0) {
        chunk_vec <- chunk_vec / norm_val
      }
      chunk_mat[k, ] <- chunk_vec
    }
  }
  
  return(list(
    chunk_matrix = chunk_mat,
    chunk_metadata = chunk_meta_list
  ))
}

#' Train Hierarchical Chunk-Based Model
#'
#' @param train_texts List of training judgment texts
#' @param train_labels Vector of 0/1 labels (1 = ALLOWED, 0 = DISMISSED)
#' @param val_texts List of validation judgment texts
#' @param val_labels Vector of 0/1 labels
#' @param epochs Number of training epochs (default: 5)
#' @param lr Learning rate (default: 1e-3)
#' @param batch_size Batch size (default: 8)
train_hierarchical_model <- function(train_texts, train_labels, val_texts, val_labels, 
                                     epochs = 5, lr = 1e-3, batch_size = 8) {
  
  cat("====================================================================\n")
  cat("TRAINING HIERARCHICAL CHUNK-BASED CLASSIFIER (BiGRU + ATTENTION)\n")
  cat(sprintf("Training cases: %d | Validation cases: %d | Epochs: %d\n", 
              length(train_texts), length(val_texts), epochs))
  cat("====================================================================\n\n")
  
  # 1. Build Projector
  proj <- build_chunk_projector(train_texts, vocab_size = 5000, proj_dim = 256)
  
  # 2. Embed all training documents into chunk sequences
  cat("Embedding training documents into chunk sequences...\n")
  train_chunks_list <- list()
  for (i in seq_along(train_texts)) {
    emb <- embed_document_chunks(train_texts[[i]], proj)
    train_chunks_list[[i]] <- emb$chunk_matrix
  }
  
  cat("Embedding validation documents into chunk sequences...\n")
  val_chunks_list <- list()
  for (i in seq_along(val_texts)) {
    emb <- embed_document_chunks(val_texts[[i]], proj)
    val_chunks_list[[i]] <- emb$chunk_matrix
  }
  
  # 3. Create PyTorch Model via reticulate
  model <- py_nn$create_hierarchical_model(
    chunk_input_dim = as.integer(proj$proj_dim),
    chunk_emb_dim = as.integer(128),
    rnn_hidden_dim = as.integer(64),
    dropout_p = 0.3
  )
  
  torch <- import("torch")
  optimizer <- torch$optim$AdamW(model$parameters(), lr = lr, weight_decay = 0.01)
  criterion <- torch$nn$BCEWithLogitsLoss()
  
  # 4. Helper to prepare padded batches
  make_batches <- function(chunks_list, labels, b_size) {
    n <- length(chunks_list)
    indices <- sample(n)
    batches_x <- list()
    batches_y <- list()
    
    for (start_idx in seq(1, n, by = b_size)) {
      end_idx <- min(start_idx + b_size - 1, n)
      batch_idx <- indices[start_idx:end_idx]
      
      sub_chunks <- chunks_list[batch_idx]
      sub_labels <- labels[batch_idx]
      
      max_m <- max(sapply(sub_chunks, nrow))
      dim_d <- ncol(sub_chunks[[1]])
      
      batch_arr <- array(0, dim = c(length(sub_chunks), max_m, dim_d))
      for (k in seq_along(sub_chunks)) {
        m_k <- nrow(sub_chunks[[k]])
        if (m_k > 0) {
          batch_arr[k, 1:m_k, ] <- sub_chunks[[k]]
        }
      }
      
      batches_x[[length(batches_x) + 1]] <- np_array(batch_arr, dtype = "float32")
      batches_y[[length(batches_y) + 1]] <- np_array(as.numeric(sub_labels), dtype = "float32")
    }
    list(x = batches_x, y = batches_y)
  }
  
  # 5. Training Loop
  best_val_f1 <- 0.0
  best_state <- NULL
  history <- list()
  
  for (ep in seq_len(epochs)) {
    tr_batches <- make_batches(train_chunks_list, train_labels, batch_size)
    tr_loss <- py_nn$train_epoch(model, optimizer, criterion, tr_batches$x, tr_batches$y)
    
    val_batches <- make_batches(val_chunks_list, val_labels, batch_size)
    val_eval <- py_nn$evaluate_model(model, val_batches$x, val_batches$y)
    
    cat(sprintf("Epoch %d/%d — Train Loss: %.4f | Val Loss: %.4f | Val Acc: %.2f%% | Val F1: %.4f\n",
                ep, epochs, tr_loss, val_eval$loss, val_eval$accuracy * 100, val_eval$f1))
    
    history[[ep]] <- list(
      epoch = ep,
      train_loss = tr_loss,
      val_loss = val_eval$loss,
      val_accuracy = val_eval$accuracy,
      val_f1 = val_eval$f1
    )
    
    if (val_eval$f1 > best_val_f1 || ep == 1) {
      best_val_f1 <- val_eval$f1
      best_state <- model$state_dict()
    }
  }
  
  # Load best weights
  model$load_state_dict(best_state)
  cat(sprintf("\nBest Validation F1: %.4f\n", best_val_f1))
  
  # Save PyTorch weights
  weights_path <- "engine/models/hierarchical_bigru_weights.pt"
  py_nn$save_model(model, weights_path)
  
  # Bundle model and projector
  bundle <- list(
    architecture = "Hierarchical_BiGRU_Attention",
    projector = proj,
    weights_path = weights_path,
    input_dim = proj$proj_dim,
    training_history = history,
    val_metrics = val_eval
  )
  
  saveRDS(bundle, "engine/models/pramana_hierarchical_bundle.rds")
  cat("Saved: engine/models/pramana_hierarchical_bundle.rds and weights\n")
  
  return(bundle)
}

#' Predict Verdict and Attention Weights for an Unseen Document
#'
#' @param bundle Model bundle object
#' @param document_text Judgment text
#' @return Prediction results including label, calibrated probabilities, and attention scores
predict_hierarchical_document <- function(bundle, document_text) {
  emb <- embed_document_chunks(document_text, bundle$projector)
  
  model <- py_nn$create_hierarchical_model(
    chunk_input_dim = as.integer(bundle$input_dim),
    chunk_emb_dim = as.integer(128),
    rnn_hidden_dim = as.integer(64)
  )
  model <- py_nn$load_model(model, bundle$weights_path)
  
  pred <- py_nn$predict_document(model, np_array(emb$chunk_matrix, dtype = "float32"))
  
  attention_vector <- as.numeric(pred$attention_weights)
  for (k in seq_along(emb$chunk_metadata)) {
    emb$chunk_metadata[[k]]$attention_score <- attention_vector[k]
  }
  
  return(list(
    predicted_label = pred$predicted_label,
    prob_allowed = pred$prob_allowed,
    prob_dismissed = pred$prob_dismissed,
    chunks = emb$chunk_metadata,
    num_chunks = nrow(emb$chunk_matrix)
  ))
}

#' Execute Leave-One-Chunk-Out (LOCO) Explainability
#'
#' @param bundle Model bundle object
#' @param document_text Judgment text
#' @return Ranked list of chunks with causal delta probabilities and verbatim text
explain_hierarchical_loco <- function(bundle, document_text) {
  emb <- embed_document_chunks(document_text, bundle$projector)
  
  model <- py_nn$create_hierarchical_model(
    chunk_input_dim = as.integer(bundle$input_dim),
    chunk_emb_dim = as.integer(128),
    rnn_hidden_dim = as.integer(64)
  )
  model <- py_nn$load_model(model, bundle$weights_path)
  
  raw_loco <- py_nn$explain_document_loco(model, np_array(emb$chunk_matrix, dtype = "float32"))
  
  annotated_results <- list()
  for (r in raw_loco) {
    c_idx <- r$chunk_index + 1
    if (c_idx <= length(emb$chunk_metadata)) {
      meta <- emb$chunk_metadata[[c_idx]]
      annotated_results[[length(annotated_results) + 1]] <- list(
        chunk_id = meta$chunk_id,
        paragraph_num = meta$paragraph_num,
        start_char = meta$start_char,
        end_char = meta$end_char,
        delta_probability = r$delta_probability,
        importance_score = r$importance_score,
        direction = r$direction,
        verbatim_text = meta$chunk_text,
        preview = substr(meta$chunk_text, 1, 150)
      )
    }
  }
  return(annotated_results)
}
