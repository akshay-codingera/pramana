# PRAMANA — CHAPTER 8: MODEL ARCHITECTURE & MATHEMATICAL FORMULATION
## Hierarchical Chunk-Based Document Modeling, Bidirectional GRU, Additive Attention & Parameter Auditing

**Core Neural Implementation**: `engine/hierarchical_nn.py` (PyTorch)  
**R Integration Bridge**: `R/hierarchical_model.R` (via `reticulate`)  
**Theoretical Paradigm**: Hierarchical Attention Networks for Long Document Classification (Yang et al., 2016; Malik et al., ACL 2021)  
**Trained Weights File**: `engine/models/hierarchical_bigru_weights.pt` (SHA-256: `A70A70F2827B3DC35CA38561F6051192458A4971EDA174C9E7AA904E1A90830D`)  

---

## 1. Architectural Motivation

Standard language model architectures encounter insurmountable computational scaling limits on legal opinions:
1. **Quadratic Self-Attention Bottleneck**: Standard Transformer self-attention scales as $\mathcal{O}(L^2)$ where $L$ is sequence length. For an average Indian Supreme Court judgment of $L \approx 4,800$ tokens, self-attention requires evaluating $\approx 23 \times 10^6$ pairwise attention weights per layer.
2. **Loss of Non-Linear Legal Semantics**: While modern long-context Transformers (e.g., Longformer, BigBird, or FlashAttention) accommodate longer inputs, they require massive GPU memory clusters unavailable in standard academic or public judicial environments.
3. **Hierarchical Document Structure**: Legal opinions naturally decompose hierarchically: words form sentences, sentences form legal arguments (chunks), and argument sequences form the final judicial disposition.

PRAMANA implements a two-tier **Hierarchical Chunk-Based Neural Network (HAN-style)** with Bidirectional Recurrent Units and Additive Attention:

```
[Input Document Text D] (Up to 32 Chunks x 512 Tokens)
       │
       ▼
 [Achlioptas Projection] (Vocabulary V = 5,000 -> Dimension 256)
       │
       ▼  Tensor: (Batch, Num_Chunks=32, Input_Dim=256)
┌─────────────────────────────────────────────────────────────┐
│ 1. Chunk Dense Encoder                                      │
│    Linear(256 -> 128) -> LayerNorm(128) -> ReLU -> Drop(0.3)│
└─────────────────────────────────────────────────────────────┘
       │
       ▼  Tensor: (Batch, Num_Chunks=32, Emb_Dim=128)
┌─────────────────────────────────────────────────────────────┐
│ 2. Narrative BiGRU Modeler                                  │
│    GRU(input=128, hidden=64, bidirectional=True)            │
│    Forward GRU (dim 64) || Backward GRU (dim 64) -> Dim 128 │
└─────────────────────────────────────────────────────────────┘
       │
       ▼  Tensor: (Batch, Num_Chunks=32, Hidden=128)
┌─────────────────────────────────────────────────────────────┐
│ 3. Additive Self-Attention Pooling (Bahdanau-Style)         │
│    u_k = tanh(W_a * h_k + b_a)                              │
│    alpha_k = softmax(u_k^T * v_a)                           │
│    d = sum(alpha_k * h_k)                                   │
└─────────────────────────────────────────────────────────────┘
       │
       ▼  Tensor: (Batch, Doc_Vector_Dim=128)
┌─────────────────────────────────────────────────────────────┐
│ 4. Calibrated Classification Head                           │
│    Dropout(0.3) -> Linear(128 -> 32) -> ReLU -> Linear(32->1│
└─────────────────────────────────────────────────────────────┘
       │
       ▼  Scalar Logit z in R
[Sigmoid Activation] -> P(ALLOWED | D) in [0.0, 1.0]
```

---

## 2. Complete Mathematical Formulation

Let document $D$ be partitioned into an ordered sequence of $K$ pre-decision masked chunks:
$$D = \{c_1, c_2, \dots, c_K\}, \quad 1 \le K \le K_{\max} = 32$$

### Stage 1: Chunk Representation & Dense Encoding
Each chunk $c_k$ is first mapped via Achlioptas random projection into a normalized vector $x_k \in \mathbb{R}^{256}$. The dense encoder projects $x_k$ into latent chunk space:
$$z_k = \text{LayerNorm}(W_e x_k + b_e) \in \mathbb{R}^{128}$$
$$e_k = \text{Dropout}(\text{ReLU}(z_k), \, p = 0.3) \in \mathbb{R}^{128}$$
where $W_e \in \mathbb{R}^{128 \times 256}$ and $b_e \in \mathbb{R}^{128}$.

### Stage 2: Sequential Narrative Modeling (Bidirectional GRU)
Appellate opinions follow a chronological argumentation sequence: lower court rulings precede appellant contentions, followed by respondent rebuttals and Court reasoning. To capture bidirectional narrative dependencies, a BiGRU processes the chunk sequence $\{e_1, e_2, \dots, e_K\}$:

$$\vec{h}_k = \text{GRU}_{fwd}(e_k, \vec{h}_{k-1}), \quad \vec{h}_k \in \mathbb{R}^{64}$$
$$\overleftarrow{h}_k = \text{GRU}_{bwd}(e_k, \overleftarrow{h}_{k+1}), \quad \overleftarrow{h}_k \in \mathbb{R}^{64}$$

The forward and backward hidden representations are concatenated to form the complete contextual chunk representation:
$$h_k = [\vec{h}_k \,\|\, \overleftarrow{h}_k] \in \mathbb{R}^{128}$$

### Stage 3: Additive Self-Attention Pooling (Bahdanau Mechanism)
Not all passages in a 30-page judgment contribute equally to the final disposition. Factual recitations are often neutral, whereas statutory interpretations carry decisive weight. Instead of unweighted average pooling, an additive self-attention mechanism assigns a learned scalar weight $\alpha_k$ to each chunk:

$$u_k = \tanh(W_a h_k + b_a) \in \mathbb{R}^{64}$$
$$s_k = v_a^\top u_k \in \mathbb{R}$$

where $W_a \in \mathbb{R}^{64 \times 128}$, $b_a \in \mathbb{R}^{64}$, and $v_a \in \mathbb{R}^{64}$ is the learned attention context vector.

When sequence padding is present (for documents with $K < 32$ chunks), a binary padding mask $M \in \{0, 1\}^K$ is applied:
$$s_k^{masked} = \begin{cases} s_k & \text{if } M_k = 1 \\ -10^9 & \text{if } M_k = 0 \end{cases}$$

Normalized attention coefficients are computed via Softmax:
$$\alpha_k = \frac{\exp(s_k^{masked})}{\sum_{j=1}^K \exp(s_j^{masked})}, \quad \sum_{k=1}^K \alpha_k = 1.0$$

The single, fixed-dimensional document narrative vector $d \in \mathbb{R}^{128}$ is computed as:
$$d = \sum_{k=1}^K \alpha_k h_k \in \mathbb{R}^{128}$$

### Stage 4: Calibrated Outcome Classification Head
The pooled document vector $d$ is passed through a two-layer multi-layer perceptron (MLP) with dropout regularization:
$$\tilde{d} = \text{Dropout}(d, \, p = 0.3)$$
$$h_{cls} = \text{ReLU}(W_{c1} \tilde{d} + b_{c1}) \in \mathbb{R}^{32}$$
$$\text{logit } z = W_{c2} h_{cls} + b_{c2} \in \mathbb{R}$$

The predicted probability of appeal allowance is generated via the logistic sigmoid function:
$$\hat{y} = P(\text{ALLOWED} \mid D) = \sigma(z) = \frac{1}{1 + e^{-z}}$$

The binary ruling $\hat{Y}$ is assigned via the standard decision threshold:
$$\hat{Y} = \begin{cases} \text{ALLOWED} (1) & \text{if } \hat{y} \ge 0.50 \\ \text{DISMISSED} (0) & \text{if } \hat{y} < 0.50 \end{cases}$$

---

## 3. Detailed Parameter Count Audit

An exact parameter tally of the neural architecture implemented in `engine/hierarchical_nn.py`:

| Sub-Module / Layer | Operation & Dimensions | Weight Matrix Shape | Bias Vector Shape | Total Parameters |
| :--- | :--- | :---: | :---: | :---: |
| **Chunk Encoder** | Linear Projection ($256 \rightarrow 128$) | $(128, 256)$ | $(128,)$ | 32,896 |
| **Chunk Encoder** | Layer Normalization ($128$) | $(128,)$ [gamma] | $(128,)$ [beta] | 256 |
| **Forward GRU** | 3 Gates (Reset, Update, New) | $(3 \times 64, 128) + (3 \times 64, 64)$ | $(3 \times 64,) + (3 \times 64,)$ | 37,248 |
| **Backward GRU** | 3 Gates (Reset, Update, New) | $(3 \times 64, 128) + (3 \times 64, 64)$ | $(3 \times 64,) + (3 \times 64,)$ | 37,248 |
| **Attention Projection**| Linear ($128 \rightarrow 64$) | $(64, 128)$ | $(64,)$ | 8,256 |
| **Attention Context** | Linear ($64 \rightarrow 1$, no bias) | $(1, 64)$ | None | 64 |
| **Classifier Dense 1**| Linear ($128 \rightarrow 32$) | $(32, 128)$ | $(32,)$ | 4,128 |
| **Classifier Dense 2**| Linear ($32 \rightarrow 1$) | $(1, 32)$ | $(1,)$ | 33 |
| **TOTAL PARAMETERS** | — | — | — | **120,129** |

### Parameter Efficiency Assessment
With only **120,129 trainable parameters**, PRAMANA achieves full document modeling with remarkable parameter efficiency. Compared to standard legal Transformers (e.g., InLegalBERT with 110,000,000 parameters):
- PRAMANA requires **less than 0.11% of the parameter capacity** of BERT.
- It trains comfortably on standard CPU hardware without out-of-memory errors.
- It demonstrates strong resilience against catastrophic overfitting on long text.

---

## 4. Objective Function: Binary Cross-Entropy with Logits

The model is optimized using `torch.nn.BCEWithLogitsLoss()`, which combines numerical stabilization via the log-sum-exp trick:

$$\mathcal{L}(z, y) = - \left[ y \log \sigma(z) + (1 - y) \log (1 - \sigma(z)) \right]$$
$$\mathcal{L}(z, y) = \max(z, 0) - z \cdot y + \log\left(1 + e^{-|z|}\right)$$

This formulation eliminates numerical underflow and overflow issues during backpropagation through long recurrent sequences.
