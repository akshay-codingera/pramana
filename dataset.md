# Supreme Court of India Judgment Dataset (1950–2026)

## 1. Overview & Provenance

The primary dataset powering **PRAMANA** comprises the complete official judgments delivered by the Supreme Court of India across a 77-year span (1950 to 2026). The corpus was compiled from official court law reports (Supreme Court Reports / SCR) and structured public court databases.

Bulk distribution structure:
- **Annual Parquet Metadata**: `data/source/metadata_parquet/year=YYYY/metadata.parquet`
- **Annual TAR Archives**: `data/source/english_archives/year=YYYY/english.tar`
- **Annual Index Files**: `data/source/indexes/year=YYYY/english.index.json`

---

## 2. Statistical Inventory & Reconciled Figures

The empirical inventory established during the technical audit:

| Dimension | Count | Details |
| :--- | :---: | :--- |
| **Historical Range** | 77 Years | 1950 through 2026 (Continuous coverage) |
| **Total Cataloged Records** | **43,578** | Validated across 77 annual Parquet tables |
| **Core Metadata Completeness** | **100.00%** | 0.00% missing values for `case_id`, `citation`, `cnr`, `year` |
| **Procedural Exclusions** | 7,287 | Withdrawn, transferred, settled, infructuous orders |
| **Missing Disposal Nature** | 2,058 | Unlabelled motion/administrative orders |
| **Substantive Binary Cohort** | **34,233** | **17,238 ALLOWED (50.35%)** vs **16,995 DISMISSED (49.65%)** |
| **Extracted Text Files on Disk** | **30,477** | Pre-decision masked `.txt` files (~285 MB text) |
| **Unique Judgment Stems** | **29,795** | Master judgment text bodies |
| **Connected / Batch Petitions** | **5,181** | Common judgments resolving multiple joined appeals |

### Grouped Benchmark Partition (Zero-Leakage Cohort: 34,224 Cases)
To prevent cross-split leakage of connected appeals sharing citations or facts, cases were grouped by canonical citation:
- **Training Set (70%)**: 23,930 cases (12,049 Allowed / 11,881 Dismissed)
- **Validation Set (15%)**: 5,162 cases (2,602 Allowed / 2,560 Dismissed)
- **Held-Out Test Set (15%)**: 5,132 cases (2,586 Allowed / 2,546 Dismissed)
- **Total**: $23,930 + 5,162 + 5,132 = \mathbf{34,224}$ cases.

---

## 3. Label Extraction & Legal Semantics

Appellate judgments in the Supreme Court of India differ significantly from trial court rulings. Binary outcomes are defined as follows:

1. **`ALLOWED` (Label 1)**:
   - Includes: *Appeal Allowed*, *Petition Allowed*, *Impugned Judgment Set Aside*, *Reversed*, *Conviction Quashed / Acquitted*, *Remanded with Directions*.
   - **Legal Semantic**: The Supreme Court found substantive legal or constitutional error in the subordinate High Court or Tribunal order and granted relief.
2. **`DISMISSED` (Label 0)**:
   - Includes: *Appeal Dismissed*, *Special Leave Petition Dismissed*, *Impugned Judgment Affirmed*, *Conviction Upheld*, *No Ground for Interference*.
   - **Legal Semantic**: The Supreme Court confirmed the validity of the lower court ruling.
3. **Excluded Categories**:
   - Matters marked *Withdrawn*, *Disposed of as Infructuous*, or *Referred to Larger Bench* do not determine the substantive merits and are excluded to avoid label noise.

---

## 4. Pre-Decision Masking & Integrity Protocol

To prevent trivial label leakage:
- Operative decree phrases (e.g., *"appeal is hereby allowed"*, *"we find no merit in this appeal"*) and publisher headnotes are excised prior to feature embedding.
- The pipeline processes the narrative, statutory arguments, and evidentiary assessments leading up to the decision.
