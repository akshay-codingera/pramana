# scripts/analyze_s3_inventory.R
# Preflight analysis of AWS S3 inventory for Indian Supreme Court Judgments

# Handle UTF-16LE or UTF-8
con <- file("s3_tar_inventory.txt", encoding = "UTF-16LE")
lines <- tryCatch(readLines(con, warn = FALSE), error = function(e) {
  close(con)
  readLines("s3_tar_inventory.txt", warn = FALSE, encoding = "UTF-8")
})
try(close(con), silent = TRUE)

records <- list()

for (line in lines) {
  # Regex for AWS CLI ls output: date time size path
  m <- regexec("^\\s*([0-9-]+\\s+[0-9:]+)\\s+([0-9]+)\\s+(.+)$", line)
  matches <- regmatches(line, m)[[1]]
  if (length(matches) == 4) {
    timestamp <- matches[2]
    size_bytes <- as.numeric(matches[3])
    path <- matches[4]
    
    # Extract year
    year_match <- regmatches(path, regexec("year=([0-9]{4})", path))[[1]]
    year <- if (length(year_match) >= 2) year_match[2] else NA_character_
    
    # Categorize
    type <- if (grepl("english", path, ignore.case = TRUE) && grepl("\\.tar$", path)) {
      "english_tar"
    } else if ((grepl("regional", path, ignore.case = TRUE) || grepl("part-", path)) && grepl("\\.tar$", path)) {
      "regional_tar"
    } else if (grepl("\\.json$", path)) {
      "index_json"
    } else {
      "other"
    }
    
    records[[length(records) + 1]] <- data.frame(
      timestamp = timestamp,
      size_bytes = size_bytes,
      path = path,
      year = year,
      type = type,
      stringsAsFactors = FALSE
    )
  }
}

df <- do.call(rbind, records)

cat("================================================================\n")
cat("AWS S3 DATASET INVENTORY PREFLIGHT SUMMARY\n")
cat("Source: s3://indian-supreme-court-judgments/\n")
cat("================================================================\n\n")

cat(sprintf("Total S3 objects listed in data/tar/: %d\n", nrow(df)))
cat(sprintf("Years spanned: %s to %s (%d distinct years)\n\n",
            min(df$year, na.rm=TRUE), max(df$year, na.rm=TRUE), length(unique(df$year[!is.na(df$year)]))))

# Breakdown by type
summary_by_type <- aggregate(
  cbind(count = size_bytes, size_gb = size_bytes / (1024^3)) ~ type,
  data = df,
  FUN = function(x) c(count = length(x), sum_gb = sum(x) / (1024^3))
)

# Clean print
type_summary <- data.frame(
  Archive_Type = unique(df$type),
  File_Count = sapply(unique(df$type), function(t) sum(df$type == t)),
  Total_Size_MB = sapply(unique(df$type), function(t) round(sum(df$size_bytes[df$type == t]) / (1024^2), 2)),
  Total_Size_GB = sapply(unique(df$type), function(t) round(sum(df$size_bytes[df$type == t]) / (1024^3), 2)),
  stringsAsFactors = FALSE
)

print(type_summary)

total_tar_bytes <- sum(df$size_bytes)
cat(sprintf("\nTotal Size of ALL TAR archives + indexes: %.2f GB (%s bytes)\n",
            total_tar_bytes / (1024^3), format(total_tar_bytes, big.mark = ",")))

english_tar_bytes <- sum(df$size_bytes[df$type == "english_tar"])
regional_tar_bytes <- sum(df$size_bytes[df$type == "regional_tar"])
index_bytes <- sum(df$size_bytes[df$type == "index_json"])

cat(sprintf("  -> English TAR Archives:  %.2f GB (%d archives)\n",
            english_tar_bytes / (1024^3), sum(df$type == "english_tar")))
cat(sprintf("  -> Regional TAR Archives: %.2f GB (%d archives)\n",
            regional_tar_bytes / (1024^3), sum(df$type == "regional_tar")))
cat(sprintf("  -> Index JSON Files:      %.2f MB (%d files)\n",
            index_bytes / (1024^2), sum(df$type == "index_json")))

# Year by year breakdown for English
eng_df <- df[df$type == "english_tar", ]
eng_df$size_mb <- round(eng_df$size_bytes / (1024^2), 1)
cat("\nEnglish Archives sample by decades:\n")
cat("1950s total English size:", round(sum(eng_df$size_bytes[eng_df$year >= "1950" & eng_df$year < "1960"]) / (1024^2), 1), "MB\n")
cat("1980s total English size:", round(sum(eng_df$size_bytes[eng_df$year >= "1980" & eng_df$year < "1990"]) / (1024^2), 1), "MB\n")
cat("2000s total English size:", round(sum(eng_df$size_bytes[eng_df$year >= "2000" & eng_df$year < "2010"]) / (1024^2), 1), "MB\n")
cat("2020s total English size:", round(sum(eng_df$size_bytes[eng_df$year >= "2020" & eng_df$year < "2030"]) / (1024^2), 1), "MB\n")

# Save detailed manifest
dir.create("result/dataset_audit", recursive = TRUE, showWarnings = FALSE)
write.csv(df, "result/dataset_audit/s3_tar_inventory_parsed.csv", row.names = FALSE)
cat("\nDetailed archive inventory saved to result/dataset_audit/s3_tar_inventory_parsed.csv\n")
