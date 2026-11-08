# scripts/benchmark_extraction_speed.R
# Benchmark extraction speed on year 1961

suppressPackageStartupMessages({
  library(pdftools)
  library(stringr)
})

tar_path <- "data/source/english_archives/year=1961/english.tar"
if (!file.exists(tar_path)) {
  stop("Archive not found: ", tar_path)
}

temp_pdf_dir <- "data/extracted/english/year=1961_test"
dir.create(temp_pdf_dir, recursive = TRUE, showWarnings = FALSE)
on.exit(unlink(temp_pdf_dir, recursive = TRUE), add = TRUE)

cat("Unpacking 1961 archive...\n")
t0 <- Sys.time()
system2("tar", args = c("-xf", shQuote(tar_path), "-C", shQuote(temp_pdf_dir)))
unpack_time <- as.numeric(difftime(Sys.time(), t0, units = "secs"))
cat(sprintf("Unpacking completed in %.2f seconds.\n", unpack_time))

pdfs <- list.files(temp_pdf_dir, pattern = "\\.pdf$", full.names = TRUE)
cat(sprintf("Total PDFs in 1961: %d\n", length(pdfs)))

# Benchmark text extraction on 10 PDFs
t1 <- Sys.time()
n_bench <- min(10, length(pdfs))
for (i in 1:n_bench) {
  pages <- pdftools::pdf_text(pdfs[i])
  txt <- paste(pages, collapse = "\n\n")
}
bench_time <- as.numeric(difftime(Sys.time(), t1, units = "secs"))
per_pdf_time <- bench_time / n_bench
cat(sprintf("Extracted %d PDFs in %.2f seconds (%.3f seconds/PDF).\n", n_bench, bench_time, per_pdf_time))
cat(sprintf("Estimated time for all %d PDFs in 1961: %.1f seconds (%.2f minutes).\n",
            length(pdfs), per_pdf_time * length(pdfs), (per_pdf_time * length(pdfs)) / 60))
