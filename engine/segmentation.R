# engine/segmentation.R
# Context segmentation module for PRAMANA explainability engine.
# Divides legal judgments into meaningful paragraphs/sections while preserving
# strict character-offset traceability to the original document.

library(stringr)

#' Detect section heading from a chunk of text
#' @param text Character string of the paragraph/chunk
#' @return String with heading label or NA
detect_section_heading <- function(text) {
  # Clean leading whitespace
  trimmed <- stringr::str_trim(text)
  
  # Standard Indian Court section headers
  patterns <- list(
    "^IN THE SUPREME COURT OF INDIA" = "COURT_HEADER",
    "^(CRIMINAL|CIVIL)\\s+(APPELLATE|ORIGINAL)\\s+JURISDICTION" = "JURISDICTION",
    "^(CRIMINAL|CIVIL|SPECIAL LEAVE)\\s+APPEAL\\s+NO" = "APPEAL_NUMBER",
    "^(APPELLANT|PETITIONER|RESPONDENT)\\s*[:\\.]" = "PARTIES",
    "^JUDGMENT\\b" = "JUDGMENT_HEADING",
    "^ORDER\\b" = "ORDER_HEADING",
    "^FACTS\\b" = "FACTS",
    "^SUBMISSIONS?\\b" = "SUBMISSIONS",
    "^FINDINGS?\\b" = "FINDINGS",
    "^CONCLUSION\\b" = "CONCLUSION",
    "^HELD\\b" = "HOLDING",
    "^(\\d+)\\.\\s+" = "NUMBERED_PARAGRAPH"
  )
  
  for (pat in names(patterns)) {
    if (stringr::str_detect(trimmed, stringr::regex(pat, ignore_case = TRUE))) {
      return(patterns[[pat]])
    }
  }
  
  # Check if all-uppercase line at start
  first_line <- stringr::str_split(trimmed, "\n")[[1]][1]
  if (nchar(first_line) > 3 && nchar(first_line) < 60 && toupper(first_line) == first_line && !stringr::str_detect(first_line, "\\d")) {
    return(stringr::str_trim(first_line))
  }
  
  return("BODY_PARAGRAPH")
}

#' Segment a legal judgment document into traceable chunks
#' @param full_text The complete raw or preprocessed judgment text
#' @return A list containing:
#'   - chunks: data.frame of chunks with metadata
#'   - full_text: the original text
#'   - chunk_count: integer count of chunks
segment_judgment <- function(full_text) {
  if (is.null(full_text) || is.na(full_text) || nchar(full_text) == 0) {
    return(list(
      chunks = data.frame(
        chunk_id = character(0),
        paragraph_num = integer(0),
        section_heading = character(0),
        start_char = integer(0),
        end_char = integer(0),
        word_count = integer(0),
        text = character(0),
        stringsAsFactors = FALSE
      ),
      full_text = full_text,
      chunk_count = 0
    ))
  }

  # Normalize line endings to \n for consistent cross-platform offset indexing
  normalized_text <- gsub("\r\n", "\n", full_text)
  normalized_text <- gsub("\r", "\n", normalized_text)
  
  # Split by paragraph breaks: 2 or more newlines
  # We use regex matches with character positions to preserve exact offsets
  # Find all paragraph blocks (non-empty sequences separated by \n\n+)
  # Using gregexpr to locate blocks
  matches <- gregexpr("(?:[^\n]+\n?)+", normalized_text, perl = TRUE)[[1]]
  
  # Fallback: if single block, or standard split
  starts <- as.vector(matches)
  lengths <- attr(matches, "match.length")
  
  # If no match found, treat whole text as 1 chunk
  if (length(starts) == 0 || starts[1] == -1) {
    starts <- 1
    lengths <- nchar(normalized_text)
  }
  
  # Filter out whitespace-only blocks
  chunk_list <- list()
  para_idx <- 0
  
  for (i in seq_along(starts)) {
    s <- starts[i]
    l <- lengths[i]
    chunk_raw <- substr(normalized_text, s, s + l - 1)
    chunk_trimmed <- stringr::str_trim(chunk_raw)
    
    if (nchar(chunk_trimmed) > 0) {
      para_idx <- para_idx + 1
      # Adjust start and end to trimmed bounds for clean highlighting
      lead_ws <- attr(regexpr("^\\s*", chunk_raw), "match.length")
      if (lead_ws < 0) lead_ws <- 0
      trail_ws <- attr(regexpr("\\s*$", chunk_raw), "match.length")
      if (trail_ws < 0) trail_ws <- 0
      
      adj_start <- s + lead_ws
      adj_end <- s + l - 1 - trail_ws
      if (adj_end < adj_start) adj_end <- adj_start + nchar(chunk_trimmed) - 1
      
      heading <- detect_section_heading(chunk_trimmed)
      words <- length(unlist(strsplit(chunk_trimmed, "\\s+")))
      
      chunk_list[[length(chunk_list) + 1]] <- data.frame(
        chunk_id = sprintf("chk_%03d", para_idx),
        paragraph_num = para_idx,
        section_heading = heading,
        start_char = as.integer(adj_start),
        end_char = as.integer(adj_end),
        word_count = as.integer(words),
        text = chunk_trimmed,
        stringsAsFactors = FALSE
      )
    }
  }
  
  if (length(chunk_list) == 0) {
    chunks_df <- data.frame(
      chunk_id = character(0),
      paragraph_num = integer(0),
      section_heading = character(0),
      start_char = integer(0),
      end_char = integer(0),
      word_count = integer(0),
      text = character(0),
      stringsAsFactors = FALSE
    )
  } else {
    chunks_df <- do.call(rbind, chunk_list)
  }
  
  list(
    chunks = chunks_df,
    full_text = normalized_text,
    chunk_count = nrow(chunks_df)
  )
}

#' Reconstruct judgment text excluding specified chunks
#' @param segmentation_result The output from segment_judgment
#' @param exclude_ids Character vector of chunk_ids to remove
#' @return Reconstructed character string
reconstruct_without_chunks <- function(segmentation_result, exclude_ids) {
  chunks_df <- segmentation_result$chunks
  if (nrow(chunks_df) == 0) return("")
  
  keep_chunks <- chunks_df[!chunks_df$chunk_id %in% exclude_ids, ]
  if (nrow(keep_chunks) == 0) return("")
  
  # Join remaining chunks with clean paragraph breaks
  paste(keep_chunks$text, collapse = "\n\n")
}

#' Verify chunk traceability: check that original substring matches chunk text
#' @param segmentation_result The output from segment_judgment
#' @return Boolean indicating full traceability
verify_traceability <- function(segmentation_result) {
  full_text <- segmentation_result$full_text
  chunks_df <- segmentation_result$chunks
  
  if (nrow(chunks_df) == 0) return(TRUE)
  
  for (i in seq_len(nrow(chunks_df))) {
    s <- chunks_df$start_char[i]
    e <- chunks_df$end_char[i]
    expected <- chunks_df$text[i]
    actual <- substr(full_text, s, e)
    
    if (actual != expected) {
      cat(sprintf("Traceability mismatch at chunk %s:\nExpected: '%s'\nActual: '%s'\n",
                  chunks_df$chunk_id[i], substr(expected, 1, 30), substr(actual, 1, 30)))
      return(FALSE)
    }
  }
  return(TRUE)
}
