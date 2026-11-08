pkgs <- c('tidyverse', 'dplyr', 'readr', 'stringr', 'stringi', 'ggplot2', 'jsonlite', 'rmarkdown', 'knitr', 'quanteda', 'tokenizers', 'arrow', 'nanoparquet')
installed <- rownames(installed.packages())
res <- data.frame(Package = pkgs, Installed = pkgs %in% installed)
print(res)
