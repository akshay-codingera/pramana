# tests/test_model_manual.R
source("engine/model.R")

cases <- read.csv("result/cases_clean (1).csv", stringsAsFactors = FALSE)
labels_df <- read.csv("result/cases_25_labels.csv", stringsAsFactors = FALSE)

# Match cases with labels
merged <- merge(cases, labels_df, by = "id")
cat("Loaded", nrow(merged), "cases for model training.\n")

model <- train_legal_model(merged$clean_text, merged$true_label)
cat("Model trained! Vocab size:", length(model$vocab_obj$vocab), "\n")
cat("Class priors:\n")
print(model$class_priors)

# Predict on first 3 cases
for (i in 1:3) {
  pred <- predict_document(model, merged$clean_text[i])
  cat(sprintf("\nCase %d (True: %s) -> Predicted: %s (P(ACC): %.4f, P(REJ): %.4f, Conf: %.4f)\n",
              merged$id[i], merged$true_label[i], pred$predicted_class,
              pred$probabilities["ACCEPTED"], pred$probabilities["REJECTED"], pred$confidence))
  cat("Top active features:\n")
  print(head(pred$active_features[, c("term", "weight", "contribution")], 5))
}
