# scripts/inspect_2024_parquet.R
library(nanoparquet)

df <- read_parquet("result/dataset_audit/sample_2024_metadata.parquet")
cat("Rows in 2024 metadata:", nrow(df), "\n")
cat("Disposal nature breakdown for 2024:\n")
disp_tab <- sort(table(df$disposal_nature, useNA = "always"), decreasing = TRUE)
print(head(disp_tab, 25))
