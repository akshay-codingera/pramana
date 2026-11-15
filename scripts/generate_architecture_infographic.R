# generate_architecture_infographic.R
# Creates a publication-grade technical architectural infographic for PRAMANA v3 Deep Reversal Network

suppressPackageStartupMessages({
  library(ggplot2)
  library(grid)
})

out_dir <- "D:/Projects/pramana-github/reports/model_optimization/figures"
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

png(file.path(out_dir, "pramana_v3_architecture_infographic.png"), width = 2800, height = 1800, res = 300)

grid.newpage()

# Background canvas
grid.rect(gp = gpar(fill = "#f8fafc", col = NA))

# Theme colors
c_navy    <- "#1b365d"
c_blue    <- "#2563eb"
c_sky     <- "#0284c7"
c_green   <- "#059669"
c_amber   <- "#d97706"
c_slate   <- "#475569"
c_dark    <- "#0f172a"
c_card    <- "#ffffff"
c_border  <- "#cbd5e1"
c_red     <- "#dc2626"

# Helper for drawing rounded-like cards
draw_card <- function(x, y, w, h, fill = c_card, border = c_border, title = "", subtitle = "") {
  grid.rect(x = x, y = y, width = w, height = h, 
            gp = gpar(fill = fill, col = border, lwd = 1.5))
  if (nchar(title) > 0) {
    grid.text(title, x = x, y = y + h/2 - 0.035, 
              gp = gpar(fontface = "bold", fontsize = 10, col = c_dark, fontfamily = "serif"))
  }
  if (nchar(subtitle) > 0) {
    grid.text(subtitle, x = x, y = y + h/2 - 0.07, 
              gp = gpar(fontsize = 8, col = c_slate, fontfamily = "serif"))
  }
}

# Header Banner
grid.rect(x = 0.5, y = 0.95, width = 0.96, height = 0.065, gp = gpar(fill = c_navy, col = NA))
grid.text("PRAMANA v3: DEEP MULTI-VIEW REVERSAL NETWORK ARCHITECTURE", 
          x = 0.5, y = 0.958, gp = gpar(fontface = "bold", fontsize = 13, col = "#ffffff", fontfamily = "serif"))
grid.text("Dual-Sided 64-Chunk Context Window (32,768 Tokens) | Explicit Reversal Turn Gradient (\u0394h) | Tri-View Fusion", 
          x = 0.5, y = 0.938, gp = gpar(fontsize = 9, col = "#93c5fd", fontfamily = "serif"))

# Column 1: Input Document & Dual Chunking (x = 0.16)
draw_card(0.16, 0.52, 0.22, 0.70, title = "1. INGESTION & DUAL CHUNKING", 
          subtitle = "Full Supreme Court Appeal (Up to 60k words)")

grid.rect(x = 0.16, y = 0.73, width = 0.18, height = 0.13, gp = gpar(fill = "#e0f2fe", col = c_sky, lwd = 1))
grid.text("20 Head Chunks (9,000w)\nLower Court Recitation\nTrial & High Court Conviction", 
          x = 0.16, y = 0.73, gp = gpar(fontsize = 8, col = "#0369a1", fontfamily = "serif"))

grid.text("... Middle Chunks Compressed ...\n(Skipped in >64-chunk appeals)", 
          x = 0.16, y = 0.61, gp = gpar(fontsize = 7.5, fontface = "italic", col = "#64748b", fontfamily = "serif"))

grid.rect(x = 0.16, y = 0.44, width = 0.18, height = 0.15, gp = gpar(fill = "#fef3c7", col = c_amber, lwd = 1))
grid.text("44 Tail Chunks (19,800w)\nSupreme Court Analysis\nPrecedent Interpretation\nRatio Decidendi Holding", 
          x = 0.16, y = 0.44, gp = gpar(fontsize = 8, col = "#b45309", fontfamily = "serif"))

grid.rect(x = 0.16, y = 0.26, width = 0.18, height = 0.08, gp = gpar(fill = "#fee2e2", col = c_red, lwd = 1))
grid.text("Pre-Decision Masking Anchor\n(Regex backward severing)", 
          x = 0.16, y = 0.26, gp = gpar(fontsize = 7.5, fontface = "bold", col = c_red, fontfamily = "serif"))

# Column 2: Embedding & Recurrent Encoding (x = 0.42)
draw_card(0.42, 0.52, 0.22, 0.70, title = "2. EMBEDDING & TEMPORAL GRU", 
          subtitle = "Hierarchical Recurrent Representation")

grid.rect(x = 0.42, y = 0.73, width = 0.18, height = 0.11, gp = gpar(fill = "#f1f5f9", col = c_slate, lwd = 1))
grid.text("12,000 Legal N-Gram Prior\nAchlioptas Random Projection\n(12,000 -> 256 Dims)", 
          x = 0.42, y = 0.73, gp = gpar(fontsize = 7.5, fontface = "bold", col = c_dark, fontfamily = "serif"))

grid.rect(x = 0.42, y = 0.56, width = 0.18, height = 0.09, gp = gpar(fill = "#f1f5f9", col = c_slate, lwd = 1))
grid.text("Chunk Dense Encoder\nLinear(256 -> 160) + LayerNorm", 
          x = 0.42, y = 0.56, gp = gpar(fontsize = 7.5, col = c_dark, fontfamily = "serif"))

grid.rect(x = 0.42, y = 0.38, width = 0.18, height = 0.14, gp = gpar(fill = "#eff6ff", col = c_blue, lwd = 1.2))
grid.text("Bidirectional GRU\n(64 Hidden x 2 Dirs = 128 Dims)\nCaptures Forward Argumentation\n& Backward Holding Flow", 
          x = 0.42, y = 0.38, gp = gpar(fontsize = 8, fontface = "bold", col = c_navy, fontfamily = "serif"))

grid.rect(x = 0.42, y = 0.24, width = 0.18, height = 0.07, gp = gpar(fill = "#f8fafc", col = c_slate, lty = "dashed"))
grid.text("Depth Weighting: \u03b3 = 0.6785", 
          x = 0.42, y = 0.24, gp = gpar(fontsize = 7.5, fontface = "italic", col = c_slate, fontfamily = "serif"))

# Column 3: Multi-View Reversal Mechanism (x = 0.68)
draw_card(0.68, 0.52, 0.22, 0.70, title = "3. MULTI-VIEW & REVERSAL", 
          subtitle = "Decoupling High Court from Supreme Court")

grid.rect(x = 0.68, y = 0.75, width = 0.18, height = 0.08, gp = gpar(fill = "#dbeafe", col = c_blue, lwd = 1))
grid.text("View 1: Attention Vector\ndoc_vec = \u03a3 \u03b1_k h_k  (128 dim)", 
          x = 0.68, y = 0.75, gp = gpar(fontsize = 8, fontface = "bold", col = c_navy, fontfamily = "serif"))

grid.rect(x = 0.68, y = 0.62, width = 0.18, height = 0.08, gp = gpar(fill = "#f0fdf4", col = c_green, lwd = 1))
grid.text("View 2: Head Pole (Lower Court)\nh_head = 1/4 \u03a3 h_k (k=1..4)", 
          x = 0.68, y = 0.62, gp = gpar(fontsize = 8, col = "#15803d", fontfamily = "serif"))

grid.rect(x = 0.68, y = 0.49, width = 0.18, height = 0.08, gp = gpar(fill = "#fef3c7", col = c_amber, lwd = 1))
grid.text("View 3: Tail Pole (Supreme Court)\nh_tail = 1/8 \u03a3 h_k (k=K-7..K)", 
          x = 0.68, y = 0.49, gp = gpar(fontsize = 8, col = "#b45309", fontfamily = "serif"))

grid.rect(x = 0.68, y = 0.33, width = 0.19, height = 0.14, gp = gpar(fill = "#ecfdf5", col = c_green, lwd = 2))
grid.text("REVERSAL TURN GRADIENT\n\u0394h = h_tail - h_head\n\n\u0394h > 0 \u2192 Explicit Reversal (ALLOWED)\n\u0394h \u2264 0 \u2192 Affirmation (DISMISSED)", 
          x = 0.68, y = 0.33, gp = gpar(fontsize = 8, fontface = "bold", col = "#047857", fontfamily = "serif"))

# Column 4: Calibrated Decision & Routing (x = 0.90)
draw_card(0.90, 0.52, 0.17, 0.70, title = "4. CALIBRATED ROUTING", 
          subtitle = "Breaking 90% Barrier")

grid.rect(x = 0.90, y = 0.74, width = 0.14, height = 0.09, gp = gpar(fill = "#f8fafc", col = c_dark, lwd = 1))
grid.text("Fusion Layer (384 Dims)\nz = [doc_vec || \u0394h || h_tail]", 
          x = 0.90, y = 0.74, gp = gpar(fontsize = 7.5, fontface = "bold", col = c_dark, fontfamily = "serif"))

grid.rect(x = 0.90, y = 0.58, width = 0.14, height = 0.11, gp = gpar(fill = "#f1f5f9", col = c_slate, lwd = 1))
grid.text("Classification Head\nLayerNorm + Dropout(0.2)\n+ ReLU + Linear(384 \u2192 1)", 
          x = 0.90, y = 0.58, gp = gpar(fontsize = 7.5, col = c_dark, fontfamily = "serif"))

grid.rect(x = 0.90, y = 0.39, width = 0.14, height = 0.12, gp = gpar(fill = "#d1fae5", col = c_green, lwd = 1.5))
grid.text("Autonomous Mode\n\u03c4 \u2265 0.50 (83.5% Docket)\n90.08% ACCURACY\n(0.9009 F1)", 
          x = 0.90, y = 0.39, gp = gpar(fontsize = 8, fontface = "bold", col = "#065f46", fontfamily = "serif"))

grid.rect(x = 0.90, y = 0.23, width = 0.14, height = 0.11, gp = gpar(fill = "#fee2e2", col = c_red, lwd = 1))
grid.text("Judicial Review Routing\n\u03c4 < 0.50 (16.5% Docket)\nBorderline Coin-Flips\nSplit Bench Advisory", 
          x = 0.90, y = 0.23, gp = gpar(fontsize = 7.5, col = "#991b1b", fontfamily = "serif"))

# Connecting Arrows
grid.lines(x = c(0.27, 0.31), y = c(0.52, 0.52), arrow = arrow(length = unit(0.12, "inches"), type = "closed"), gp = gpar(fill = c_dark, col = c_dark, lwd = 2))
grid.lines(x = c(0.53, 0.57), y = c(0.52, 0.52), arrow = arrow(length = unit(0.12, "inches"), type = "closed"), gp = gpar(fill = c_dark, col = c_dark, lwd = 2))
grid.lines(x = c(0.79, 0.815), y = c(0.52, 0.52), arrow = arrow(length = unit(0.12, "inches"), type = "closed"), gp = gpar(fill = c_dark, col = c_dark, lwd = 2))

# Footer
grid.rect(x = 0.5, y = 0.05, width = 0.96, height = 0.05, gp = gpar(fill = "#ffffff", col = c_border, lwd = 1))
grid.text("PRAMANA Research Platform | Supreme Court of India 77-Year Longitudinal Evaluation (N = 5,132 Held-Out Cases) | https://github.com/akshay-codingera/pramana.git", 
          x = 0.5, y = 0.05, gp = gpar(fontsize = 8, fontface = "italic", col = c_slate, fontfamily = "serif"))

dev.off()

cat("Successfully generated pramana_v3_architecture_infographic.png\n")
