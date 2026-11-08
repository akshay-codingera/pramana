# ==============================================================================
# PRAMANA — Indian Supreme Court Verdict Prediction Research
# Script: R/dataset_inspection.R
# Objective: Comprehensive inspection of 77-year corpus (1950-2026)
# Author: Senior Data Engineer / ML Research Scientist
# ==============================================================================

suppressPackageStartupMessages({
  library(nanoparquet)
  library(dplyr)
  library(stringr)
  library(stringi)
  library(ggplot2)
  library(jsonlite)
})

cat("====================================================================\n")
cat("Starting Phase 1: Comprehensive Dataset Inspection in R\n")
cat("====================================================================\n\n")

# Ensure output directories exist
dir.create("reports/figures", recursive = TRUE, showWarnings = FALSE)
dir.create("reports/tables", recursive = TRUE, showWarnings = FALSE)

# ------------------------------------------------------------------------------
# 1. PARQUET METADATA AUDIT (1950 - 2026)
# ------------------------------------------------------------------------------
parquet_dir <- "data/source/metadata_parquet"
parquet_files <- list.files(parquet_dir, pattern = "\\.parquet$", full.names = TRUE, recursive = TRUE)

cat(sprintf("Found %d metadata Parquet files across available years.\n", length(parquet_files)))

if (length(parquet_files) == 0) {
  stop("No metadata Parquet files found in data/source/metadata_parquet.")
}

cat("Reading and aggregating metadata across all years...\n")

meta_list <- list()
for (i in seq_along(parquet_files)) {
  pf <- parquet_files[i]
  df_year <- read_parquet(pf)
  meta_list[[i]] <- df_year
}

all_meta <- do.call(rbind, meta_list)
total_records <- nrow(all_meta)
cat(sprintf("Successfully ingested %d total records across %d columns.\n\n", total_records, ncol(all_meta)))

# ------------------------------------------------------------------------------
# 2. MISSING VALUES ANALYSIS
# ------------------------------------------------------------------------------
cat("Computing missing value profiles across all metadata columns...\n")

cols <- colnames(all_meta)
missing_summary <- data.frame(
  Column = cols,
  Total_Records = total_records,
  Missing_Count = sapply(cols, function(col) {
    v <- all_meta[[col]]
    sum(is.na(v) | v == "" | str_trim(as.character(v)) == "")
  }),
  stringsAsFactors = FALSE
)

missing_summary$Missing_Pct <- round(100 * missing_summary$Missing_Count / total_records, 2)
missing_summary$Valid_Count <- total_records - missing_summary$Missing_Count
missing_summary$Valid_Pct <- round(100 * missing_summary$Valid_Count / total_records, 2)
missing_summary <- missing_summary[order(-missing_summary$Missing_Pct), ]
row.names(missing_summary) <- NULL

write.csv(missing_summary, "reports/tables/missing_values_summary.csv", row.names = FALSE)
cat("Saved: reports/tables/missing_values_summary.csv\n")
print(missing_summary[, c("Column", "Missing_Count", "Missing_Pct", "Valid_Pct")])
cat("\n")

# Visualization: Missing Data Distribution
p_missing <- ggplot(missing_summary, aes(x = reorder(Column, Missing_Pct), y = Missing_Pct)) +
  geom_bar(stat = "identity", fill = "#c0392b", width = 0.7) +
  geom_text(aes(label = sprintf("%.1f%%", Missing_Pct)), hjust = -0.1, size = 3.5, color = "#2c3e50") +
  coord_flip(ylim = c(0, 105)) +
  labs(
    title = "Metadata Missingness Across 43,578 Indian Supreme Court Judgments",
    subtitle = "Analysis of NA and empty string values across all fields (1950–2026)",
    x = "Metadata Field",
    y = "Missing Percentage (%)",
    caption = "Source: PRAMANA Dataset Inspection Pipeline"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    plot.title = element_text(face = "bold", size = 14),
    axis.text = element_text(color = "#34495e"),
    panel.grid.minor = element_blank()
  )

ggsave("reports/figures/missing_data_distribution.png", p_missing, width = 10, height = 6, dpi = 300)
cat("Saved: reports/figures/missing_data_distribution.png\n\n")

# ------------------------------------------------------------------------------
# 3. VERDICT & DISPOSAL LABELS LANDSCAPE
# ------------------------------------------------------------------------------
cat("Analyzing raw verdict / disposal nature labels...\n")

raw_disposals <- as.character(all_meta$disposal_nature)
raw_disposals[is.na(raw_disposals) | str_trim(raw_disposals) == ""] <- "<MISSING / UNSPECIFIED>"

disposal_freq <- as.data.frame(table(raw_disposals), stringsAsFactors = FALSE)
colnames(disposal_freq) <- c("Raw_Disposal_Nature", "Frequency")
disposal_freq$Percentage <- round(100 * disposal_freq$Frequency / total_records, 2)
disposal_freq <- disposal_freq[order(-disposal_freq$Frequency), ]
row.names(disposal_freq) <- NULL

write.csv(disposal_freq, "reports/tables/verdict_labels_summary.csv", row.names = FALSE)
cat("Saved: reports/tables/verdict_labels_summary.csv\n")
cat("Top 15 Raw Outcomes:\n")
print(head(disposal_freq, 15))
cat("\n")

# Categorize outcomes into substantive vs procedural
all_meta$outcome_category <- case_when(
  grepl("allowed|quashed|set aside", all_meta$disposal_nature, ignore.case = TRUE) ~ "ALLOWED (Appeals / Petitions)",
  grepl("dismissed|rejected", all_meta$disposal_nature, ignore.case = TRUE) ~ "DISMISSED (Appeals / Petitions)",
  grepl("partly|partially|modified", all_meta$disposal_nature, ignore.case = TRUE) ~ "PARTIALLY ALLOWED / MODIFIED",
  grepl("remand", all_meta$disposal_nature, ignore.case = TRUE) ~ "REMANDED",
  grepl("withdrawn", all_meta$disposal_nature, ignore.case = TRUE) ~ "WITHDRAWN",
  grepl("disposed", all_meta$disposal_nature, ignore.case = TRUE) ~ "DISPOSED OF (Non-merits / Consent)",
  grepl("infructuous", all_meta$disposal_nature, ignore.case = TRUE) ~ "INFRUCTUOUS",
  is.na(all_meta$disposal_nature) | str_trim(all_meta$disposal_nature) == "" ~ "UNSPECIFIED / MISSING",
  TRUE ~ "OTHER MISCELLANEOUS"
)

cat_freq <- as.data.frame(table(all_meta$outcome_category), stringsAsFactors = FALSE)
colnames(cat_freq) <- c("Category", "Count")
cat_freq$Percentage <- round(100 * cat_freq$Count / total_records, 2)
cat_freq <- cat_freq[order(-cat_freq$Count), ]

# Visualization: Verdict Distribution (Top Categories)
p_verdict <- ggplot(head(cat_freq, 8), aes(x = reorder(Category, Count), y = Count)) +
  geom_bar(stat = "identity", fill = "#2980b9", width = 0.65) +
  geom_text(aes(label = sprintf("%s (%.1f%%)", format(Count, big.mark=","), Percentage)), 
            hjust = -0.05, size = 3.6, color = "#2c3e50") +
  coord_flip(ylim = c(0, max(cat_freq$Count) * 1.25)) +
  labs(
    title = "Categorical Distribution of Judicial Outcomes (1950–2026)",
    subtitle = sprintf("Substantive balance: %d Allowed vs %d Dismissed", 
                       sum(all_meta$outcome_category == "ALLOWED (Appeals / Petitions)"),
                       sum(all_meta$outcome_category == "DISMISSED (Appeals / Petitions)")),
    x = "Judicial Outcome Category",
    y = "Number of Judgments",
    caption = "Source: Supreme Court of India Metadata (PRAMANA Inspection)"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    plot.title = element_text(face = "bold", size = 14),
    panel.grid.minor = element_blank()
  )

ggsave("reports/figures/verdict_distribution.png", p_verdict, width = 10, height = 6, dpi = 300)
cat("Saved: reports/figures/verdict_distribution.png\n\n")

# ------------------------------------------------------------------------------
# 4. TEMPORAL DISTRIBUTION (CASES PER YEAR)
# ------------------------------------------------------------------------------
cat("Analyzing temporal distribution across 1950–2026...\n")

all_meta$numeric_year <- suppressWarnings(as.numeric(all_meta$year))
all_meta <- all_meta[!is.na(all_meta$numeric_year), ]

cases_by_year <- all_meta %>%
  group_by(numeric_year) %>%
  summarise(
    Total_Cases = n(),
    Allowed_Cases = sum(outcome_category == "ALLOWED (Appeals / Petitions)"),
    Dismissed_Cases = sum(outcome_category == "DISMISSED (Appeals / Petitions)"),
    Other_Cases = n() - (Allowed_Cases + Dismissed_Cases)
  ) %>%
  arrange(numeric_year)

write.csv(cases_by_year, "reports/tables/cases_by_year.csv", row.names = FALSE)
cat("Saved: reports/tables/cases_by_year.csv\n")

p_year <- ggplot(cases_by_year, aes(x = numeric_year, y = Total_Cases)) +
  geom_area(fill = "#3498db", alpha = 0.4) +
  geom_line(color = "#2980b9", size = 1) +
  geom_point(color = "#1b4f72", size = 1.5) +
  scale_x_continuous(breaks = seq(1950, 2026, by = 10)) +
  labs(
    title = "Supreme Court of India Judgment Volume (1950–2026)",
    subtitle = sprintf("Evolution across 77 judicial terms | Total Judgments: %d", total_records),
    x = "Judicial Year",
    y = "Number of Judgments Delivered",
    caption = "Source: PRAMANA Master Ingestion Audit"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    plot.title = element_text(face = "bold", size = 14),
    panel.grid.minor = element_blank()
  )

ggsave("reports/figures/cases_per_year.png", p_year, width = 11, height = 5.5, dpi = 300)
cat("Saved: reports/figures/cases_per_year.png\n\n")

# ------------------------------------------------------------------------------
# 5. DUPLICATE AND CASE IDENTITY ANALYSIS
# ------------------------------------------------------------------------------
cat("Auditing duplicate cases, connected matters, and identifiers...\n")

unique_cnr <- n_distinct(all_meta$cnr[!is.na(all_meta$cnr) & all_meta$cnr != ""])
unique_case_id <- n_distinct(all_meta$case_id[!is.na(all_meta$case_id) & all_meta$case_id != ""])
unique_citations <- n_distinct(all_meta$citation[!is.na(all_meta$citation) & all_meta$citation != ""])
unique_titles <- n_distinct(all_meta$title[!is.na(all_meta$title) & all_meta$title != ""])

dup_cnr_count <- sum(duplicated(all_meta$cnr[!is.na(all_meta$cnr) & all_meta$cnr != ""]))
dup_case_id_count <- sum(duplicated(all_meta$case_id[!is.na(all_meta$case_id) & all_meta$case_id != ""]))

dup_summary <- data.frame(
  Identifier = c("CNR (Case Record Number)", "Case ID (e.g. 1950 INSC 25)", "Citation", "Case Title"),
  Total_Populated = c(
    sum(!is.na(all_meta$cnr) & all_meta$cnr != ""),
    sum(!is.na(all_meta$case_id) & all_meta$case_id != ""),
    sum(!is.na(all_meta$citation) & all_meta$citation != ""),
    sum(!is.na(all_meta$title) & all_meta$title != "")
  ),
  Unique_Values = c(unique_cnr, unique_case_id, unique_citations, unique_titles),
  Duplicate_Rows = c(dup_cnr_count, dup_case_id_count, 
                     sum(duplicated(all_meta$citation[!is.na(all_meta$citation) & all_meta$citation != ""])),
                     sum(duplicated(all_meta$title[!is.na(all_meta$title) & all_meta$title != ""]))),
  stringsAsFactors = FALSE
)

write.csv(dup_summary, "reports/tables/duplicate_analysis.csv", row.names = FALSE)
cat("Saved: reports/tables/duplicate_analysis.csv\n")
print(dup_summary)
cat("\n")

# ------------------------------------------------------------------------------
# 6. DOCUMENT LENGTH & LEXICAL DISTRIBUTION
# ------------------------------------------------------------------------------
cat("Inspecting extracted judgment texts and computing length statistics...\n")

txt_files <- list.files("data/processed/extracted_text", pattern = "\\.txt$", recursive = TRUE, full.names = TRUE)
cat(sprintf("Analyzing %d available extracted judgment texts across historical and modern eras...\n", length(txt_files)))

doc_stats <- list()
sample_size <- length(txt_files)

for (i in seq_along(txt_files)) {
  tf <- txt_files[i]
  content <- paste(readLines(tf, warn = FALSE, encoding = "UTF-8"), collapse = "\n")
  
  n_char <- nchar(content)
  n_words <- stri_count_words(content)
  n_tokens_est <- round(n_words * 1.33)
  n_paras <- length(strsplit(content, "\n\\s*\n")[[1]])
  
  # Check year from path
  yr_match <- str_extract(tf, "year=\\d{4}")
  doc_year <- ifelse(!is.na(yr_match), as.numeric(gsub("year=", "", yr_match)), NA)
  
  doc_stats[[i]] <- data.frame(
    file = basename(tf),
    year = doc_year,
    chars = n_char,
    words = n_words,
    tokens = n_tokens_est,
    paragraphs = n_paras,
    stringsAsFactors = FALSE
  )
}

df_docs <- do.call(rbind, doc_stats)

length_quantiles <- data.frame(
  Metric = c("Min", "10th Pct", "25th Pct (Q1)", "Median", "Mean", "75th Pct (Q3)", "90th Pct", "95th Pct", "99th Pct", "Max"),
  Words = c(
    min(df_docs$words),
    quantile(df_docs$words, 0.10),
    quantile(df_docs$words, 0.25),
    median(df_docs$words),
    round(mean(df_docs$words)),
    quantile(df_docs$words, 0.75),
    quantile(df_docs$words, 0.90),
    quantile(df_docs$words, 0.95),
    quantile(df_docs$words, 0.99),
    max(df_docs$words)
  ),
  Tokens_Est = c(
    min(df_docs$tokens),
    quantile(df_docs$tokens, 0.10),
    quantile(df_docs$tokens, 0.25),
    median(df_docs$tokens),
    round(mean(df_docs$tokens)),
    quantile(df_docs$tokens, 0.75),
    quantile(df_docs$tokens, 0.90),
    quantile(df_docs$tokens, 0.95),
    quantile(df_docs$tokens, 0.99),
    max(df_docs$tokens)
  ),
  Characters = c(
    min(df_docs$chars),
    quantile(df_docs$chars, 0.10),
    quantile(df_docs$chars, 0.25),
    median(df_docs$chars),
    round(mean(df_docs$chars)),
    quantile(df_docs$chars, 0.75),
    quantile(df_docs$chars, 0.90),
    quantile(df_docs$chars, 0.95),
    quantile(df_docs$chars, 0.99),
    max(df_docs$chars)
  ),
  stringsAsFactors = FALSE
)

write.csv(length_quantiles, "reports/tables/document_length_summary.csv", row.names = FALSE)
cat("Saved: reports/tables/document_length_summary.csv\n")
print(length_quantiles)
cat("\n")

# Visualization: Document Length Distribution
median_words <- median(df_docs$words)
p_length <- ggplot(df_docs, aes(x = words)) +
  geom_histogram(bins = 40, fill = "#16a085", color = "#0e6655", alpha = 0.8) +
  geom_vline(xintercept = median_words, color = "#c0392b", linetype = "dashed", size = 1) +
  geom_vline(xintercept = 512, color = "#d35400", linetype = "dotted", size = 1) +
  annotate("text", x = median_words + 400, y = 80, 
           label = sprintf("Median: %d words", round(median_words)), 
           color = "#c0392b", fontface = "bold", hjust = 0) +
  annotate("text", x = 512, y = 110, 
           label = "Standard 512-Token Cutoff", 
           color = "#d35400", fontface = "bold", angle = 90, vjust = -0.5) +
  scale_x_continuous(limits = c(0, quantile(df_docs$words, 0.98)), breaks = seq(0, 15000, 2000)) +
  labs(
    title = "Distribution of Document Lengths in Indian Supreme Court Judgments",
    subtitle = sprintf("Analysis of %d judgments | Truncation discarding risk illustrated at 512 tokens", nrow(df_docs)),
    x = "Document Length (Words)",
    y = "Number of Judgments",
    caption = "Source: Extracted PRAMANA Corpus Text"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    plot.title = element_text(face = "bold", size = 14),
    panel.grid.minor = element_blank()
  )

ggsave("reports/figures/document_length_distribution.png", p_length, width = 10, height = 5.5, dpi = 300)
cat("Saved: reports/figures/document_length_distribution.png\n\n")

# ------------------------------------------------------------------------------
# 7. VERDICT LEAKAGE & DISPOSITION CLAUSE POSITIONAL ANALYSIS
# ------------------------------------------------------------------------------
cat("Empirically investigating verdict leakage positions across legal texts...\n")

# Sample 300 documents to inspect keyword occurrences across deciles
leakage_terms <- c(
  "appeal.*allowed", "appeals.*allowed", "petition.*allowed", 
  "appeal.*dismissed", "appeals.*dismissed", "petition.*dismissed",
  "impugned order.*set aside", "order accordingly", "find no merit"
)

pattern <- paste0("(", paste(leakage_terms, collapse = "|"), ")")

decile_hits <- numeric(10)
names(decile_hits) <- paste0((0:9)*10, "-", (1:10)*10, "%")

sampled_docs <- sample(txt_files, min(300, length(txt_files)))

for (tf in sampled_docs) {
  content <- tolower(paste(readLines(tf, warn = FALSE, encoding = "UTF-8"), collapse = " "))
  total_len <- nchar(content)
  if (total_len < 100) next
  
  # Find match positions
  matches <- str_locate_all(content, pattern)[[1]]
  if (nrow(matches) > 0) {
    for (m in 1:nrow(matches)) {
      rel_pos <- matches[m, 1] / total_len
      decile <- min(10, floor(rel_pos * 10) + 1)
      decile_hits[decile] <- decile_hits[decile] + 1
    }
  }
}

df_leakage <- data.frame(
  Decile = factor(names(decile_hits), levels = names(decile_hits)),
  Occurrences = as.numeric(decile_hits),
  Percentage = round(100 * as.numeric(decile_hits) / sum(decile_hits), 2)
)

write.csv(df_leakage, "reports/tables/verdict_leakage_positions.csv", row.names = FALSE)
cat("Saved: reports/tables/verdict_leakage_positions.csv\n")
print(df_leakage)
cat("\n")

p_leakage <- ggplot(df_leakage, aes(x = Decile, y = Percentage)) +
  geom_bar(stat = "identity", fill = ifelse(df_leakage$Decile == "90-100%", "#e74c3c", "#7f8c8d"), width = 0.65) +
  geom_text(aes(label = sprintf("%.1f%%", Percentage)), vjust = -0.5, size = 3.6, fontface = "bold") +
  scale_y_continuous(limits = c(0, max(df_leakage$Percentage) * 1.2)) +
  labs(
    title = "Empirical Evidence of Verdict Leakage Across Document Depth",
    subtitle = "Relative positional frequency of operative disposition phrases across 10 document deciles",
    x = "Document Depth (Decile Range)",
    y = "Percentage of Disposition Phrase Occurrences (%)",
    caption = "PRAMANA Legal Leakage Audit | Critical proof for pre-decision disposition masking"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    plot.title = element_text(face = "bold", size = 14),
    panel.grid.minor = element_blank()
  )

ggsave("reports/figures/verdict_leakage_position.png", p_leakage, width = 10, height = 5.5, dpi = 300)
cat("Saved: reports/figures/verdict_leakage_position.png\n\n")

cat("====================================================================\n")
cat("Phase 1 Dataset Inspection Completed Successfully!\n")
cat("Reports, summary tables, and figures have been written to disk.\n")
cat("====================================================================\n")
