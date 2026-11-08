# scripts/audit_phase5_temporal_split.R
# Phase 5: Temporal Generalization Audit & Chronological Partitioning Plan

suppressPackageStartupMessages({
  library(data.table)
  library(dplyr)
  library(stringr)
})

WORKSPACE <- "D:/Projects/pramana"
setwd(WORKSPACE)

cat("====================================================================\n")
cat("PHASE 5: TEMPORAL GENERALIZATION READINESS AUDIT\n")
cat("====================================================================\n\n")

# Load all 34,233 cases from splits
tr <- fread("data/splits/grouped_train.csv")
va <- fread("data/splits/grouped_val.csv")
te <- fread("data/splits/grouped_test.csv")
all_cases <- rbind(tr, va, te)

cat(sprintf("Total Substantive Binary Cohort: %d cases\n\n", nrow(all_cases)))

# Annual distribution and class balance
annual_dist <- all_cases %>%
  group_by(year) %>%
  summarise(
    total_cases = n(),
    allowed_cases = sum(target_binary == 1),
    dismissed_cases = sum(target_binary == 0),
    allowed_pct = round(sum(target_binary == 1) / n() * 100, 2),
    .groups = "drop"
  ) %>%
  arrange(year)

dir.create("reports/audit_data", recursive = TRUE, showWarnings = FALSE)
write.csv(annual_dist, "reports/audit_data/temporal_distribution_by_year.csv", row.names = FALSE)

cat("Sample of Annual Case Volumes and Allowed Ratios:\n")
print(head(annual_dist, 10))
cat("...\n")
print(tail(annual_dist, 10))
cat("\n")

# Propose Chronological Splits
# Candidate Partition A:
#   Train: 1950 - 2015 (Historical Foundation to Pre-Insolvency Reforms)
#   Val:   2016 - 2020 (Five-Year Tuning Buffer)
#   Test:  2021 - 2026 (Contemporary Five-Year Deployment Horizon)

pA_train <- all_cases %>% filter(year >= 1950 & year <= 2015)
pA_val   <- all_cases %>% filter(year >= 2016 & year <= 2020)
pA_test  <- all_cases %>% filter(year >= 2021 & year <= 2026)

# Verify zero citation / group overlap between chronological splits
ov_tv <- intersect(pA_train$group_id, pA_val$group_id)
ov_tt <- intersect(pA_train$group_id, pA_test$group_id)
ov_vt <- intersect(pA_val$group_id, pA_test$group_id)

cat("Proposed Chronological Partition Scheme (Candidate A):\n")
cat(sprintf("  Train (1950–2015): %d cases (Allowed: %d [%.2f%%]) - %.2f%%\n",
            nrow(pA_train), sum(pA_train$target_binary == 1), 
            mean(pA_train$target_binary == 1) * 100,
            nrow(pA_train) / nrow(all_cases) * 100))
cat(sprintf("  Val   (2016–2020): %d cases (Allowed: %d [%.2f%%]) - %.2f%%\n",
            nrow(pA_val), sum(pA_val$target_binary == 1), 
            mean(pA_val$target_binary == 1) * 100,
            nrow(pA_val) / nrow(all_cases) * 100))
cat(sprintf("  Test  (2021–2026): %d cases (Allowed: %d [%.2f%%]) - %.2f%%\n",
            nrow(pA_test), sum(pA_test$target_binary == 1), 
            mean(pA_test$target_binary == 1) * 100,
            nrow(pA_test) / nrow(all_cases) * 100))

cat("\nChronological Group Overlap Check:\n")
cat(sprintf("  Cross-era group overlap Train <-> Val: %d\n", length(ov_tv)))
cat(sprintf("  Cross-era group overlap Train <-> Test: %d\n", length(ov_tt)))
cat(sprintf("  Cross-era group overlap Val <-> Test: %d\n", length(ov_vt)))

# Summary table for report
chrono_summary <- data.frame(
  Split = c("Train (Historical)", "Validation (Buffer)", "Held-Out Test (Contemporary)"),
  Years = c("1950–2015 (66 yrs)", "2016–2020 (5 yrs)", "2021–2026 (6 yrs)"),
  Total_Cases = c(nrow(pA_train), nrow(pA_val), nrow(pA_test)),
  Allowed_Cases = c(sum(pA_train$target_binary == 1), sum(pA_val$target_binary == 1), sum(pA_test$target_binary == 1)),
  Dismissed_Cases = c(sum(pA_train$target_binary == 0), sum(pA_val$target_binary == 0), sum(pA_test$target_binary == 0)),
  Allowed_Ratio = c(sprintf("%.2f%%", mean(pA_train$target_binary == 1) * 100),
                    sprintf("%.2f%%", mean(pA_val$target_binary == 1) * 100),
                    sprintf("%.2f%%", mean(pA_test$target_binary == 1) * 100)),
  Cohort_Pct = c(sprintf("%.2f%%", nrow(pA_train) / nrow(all_cases) * 100),
                 sprintf("%.2f%%", nrow(pA_val) / nrow(all_cases) * 100),
                 sprintf("%.2f%%", nrow(pA_test) / nrow(all_cases) * 100)),
  stringsAsFactors = FALSE
)

write.csv(chrono_summary, "reports/audit_data/chronological_split_proposal.csv", row.names = FALSE)
cat("\nSaved: reports/audit_data/chronological_split_proposal.csv\n")
print(chrono_summary)
cat("====================================================================\n")
