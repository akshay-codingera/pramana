# scripts/inspect_sample_parquet.R
library(nanoparquet)

df <- read_parquet("result/dataset_audit/sample_1950_metadata.parquet")
cat("Rows in 1950 metadata:", nrow(df), "\n")
cat("Columns found (", ncol(df), "):\n", sep="")
print(colnames(df))

cat("\nDisposal nature breakdown for 1950:\n")
print(table(df$disposal_nature, useNA = "always"))

cat("\nSample record:\n")
for (col in colnames(df)) {
  val <- df[[col]][1]
  cat(sprintf("  %s: %s\n", col, substr(as.character(val), 1, 80)))
}
