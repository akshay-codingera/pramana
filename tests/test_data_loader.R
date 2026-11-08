source("R/data_loader.R")
cat("Testing load_metadata() for sample years 1950:1952...\n")
sample_meta <- load_metadata(years = 1950:1952)
cat(sprintf("Loaded %d records across years 1950-1952.\n", nrow(sample_meta)))

cat("Testing load_binary_corpus() for sample years 1950:1952...\n")
bin_sample <- load_binary_corpus(years = 1950:1952)
cat(sprintf("Loaded %d binary cases (%d Allowed, %d Dismissed).\n", 
            nrow(bin_sample),
            sum(bin_sample$target_label == "ALLOWED"),
            sum(bin_sample$target_label == "DISMISSED")))

cat("Testing load_judgment_text()...\n")
sample_case <- bin_sample[1, ]
txt <- load_judgment_text(sample_case$path, sample_case$year)
if (!is.na(txt)) {
  cat(sprintf("Loaded text successfully! Length: %d chars, %d words.\n", 
              nchar(txt), length(strsplit(txt, "\\s+")[[1]])))
} else {
  cat("Text not yet extracted for this sample case.\n")
}
cat("data_loader.R test completed successfully!\n")
