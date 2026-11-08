pkgs <- c("torch", "glmnet", "text2vec", "quanteda", "tokenizers", "yardstick", "caret", "reticulate")
installed <- rownames(installed.packages())
res <- data.frame(Package = pkgs, Installed = pkgs %in% installed)
print(res)

if ("reticulate" %in% installed) {
  library(reticulate)
  cat("\nChecking Python via reticulate:\n")
  py_avail <- py_available(initialize = TRUE)
  cat("Python available:", py_avail, "\n")
  if (py_avail) {
    cat("Python config:\n")
    print(py_config())
  }
}
