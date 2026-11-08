# tests/test_segmentation_manual.R
source("engine/segmentation.R")

cases <- read.csv("result/cases_clean (1).csv", stringsAsFactors = FALSE)
sample_text <- cases$clean_text[1]

cat("Length of sample text:", nchar(sample_text), "\n")

seg <- segment_judgment(sample_text)
cat("Found chunks:", seg$chunk_count, "\n")
cat("Traceability valid:", verify_traceability(seg), "\n")
print(seg$chunks[, c("chunk_id", "paragraph_num", "section_heading", "start_char", "end_char", "word_count")])

# Test reconstruction
without_c1 <- reconstruct_without_chunks(seg, c("chk_001"))
cat("\nReconstructed without chk_001 (length:", nchar(without_c1), ")\n")
cat("Starts with:\n", substr(without_c1, 1, 100), "\n")
