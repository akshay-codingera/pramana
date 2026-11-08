library(reticulate)
cat("Installing torch in isolated Python environment...\n")
py_install(c("torch", "transformers", "scikit-learn"), pip = TRUE)
cat("PyTorch installation finished.\n")
