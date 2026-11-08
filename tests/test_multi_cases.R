# tests/test_multi_cases.R
source("engine/explainability.R")

cases <- read.csv("result/cases_clean (1).csv", stringsAsFactors = FALSE)
labels_df <- read.csv("result/cases_25_labels.csv", stringsAsFactors = FALSE)
merged <- merge(cases, labels_df, by = "id")
model <- train_legal_model(merged$clean_text, merged$true_label)

for (cid in 1:10) {
  res <- explain_judgment(model, merged$clean_text[cid], metadata = list(case_id = cid))
  orig_class <- res$baseline$predicted_class
  orig_p <- res$baseline$probabilities[orig_class]
  top_chunk <- res$loco$ranked_chunks[1, ]
  
  cat(sprintf("Case %02d (True: %s) -> Pred: %s (P: %.4f) | Top Chunk: %s (Delta P: %.6f, Role: %s) | CF: %s\n",
              cid, merged$true_label[cid], orig_class, orig_p,
              top_chunk$chunk_id, top_chunk$contribution, top_chunk$role,
              res$counterfactual$counterfactual_found))
  if (res$counterfactual$counterfactual_found) {
    cat(sprintf("   -> CF combo: [%s], flips to %s\n",
                paste(res$counterfactual$minimal_chunk_combination, collapse = ", "),
                res$counterfactual$counterfactual_class))
  }
}
