# Fashion AI Discovery

Fashion AI Discovery is an AI-first fashion search and recommendation system designed to study whether combining semantic, lexical, attribute and personalized signals can improve fashion retrieval compared with conventional keyword-based search.

## Research Question

Can combining semantic, lexical, attribute and personalized signals improve fashion retrieval compared with conventional keyword-based search?

## Research Hypothesis

A retrieval pipeline that combines semantic similarity with lexical relevance, attribute matching, budget constraints and ranking signals should provide more robust retrieval quality than relying on a single retrieval strategy.

## Research Architecture

Query Understanding
→ Semantic Retrieval
→ Lexical Retrieval
→ Attribute Matching
→ Candidate Fusion
→ Learning-to-Rank
→ Personalization
→ Explainability
→ Evaluation

## System Overview

The system contains the following components:

- Natural-language query understanding
- Semantic retrieval using transformer embeddings
- Lexical retrieval
- Attribute-aware retrieval
- Hybrid candidate generation
- Reciprocal Rank Fusion
- Learning-to-rank
- Budget-aware hard constraints
- Personalized ranking
- AI stylist recommendations
- Explainable recommendations
- Evaluation and error analysis
- Robustness testing
- Reproducible research artifacts

## Semantic Retrieval

Semantic retrieval uses the `Xenova/all-MiniLM-L6-v2` sentence-transformer model through Transformers.js.

The system:

1. Converts product text into embeddings
2. Converts the user query into an embedding
3. Applies mean pooling
4. Normalizes embeddings
5. Computes cosine similarity
6. Uses semantic similarity as a retrieval signal

This enables retrieval based on semantic meaning rather than exact keyword overlap.

## Hybrid Retrieval

The production retrieval system combines multiple signals:

- Semantic similarity: 0.45
- Lexical relevance: 0.20
- Attribute matching: 0.20
- Budget matching: 0.10
- Metadata quality: 0.05

Semantic and lexical candidate lists are combined using Reciprocal Rank Fusion before final reranking.

Hard budget constraints are applied before candidate fusion.

The production weights were retained after held-out evaluation because local weight tuning did not produce a measurable improvement on the held-out test set.

## Learning-to-Rank

The project includes a pairwise logistic ranking model using retrieval signals as ranking features.

The ranking features include:

- Semantic similarity
- Lexical relevance
- Attribute matching
- Budget compatibility
- Metadata relevance
- Fusion score

The model is trained using pairwise preferences derived from relevance information.

## Personalization

The recommendation pipeline supports query-driven and preference-driven ranking.

Personalization can incorporate signals such as:

- Category
- Gender
- Color
- Style
- Occasion
- Material
- Price range

## AI Stylist

The AI Stylist layer converts user preferences and natural-language requests into structured fashion search signals and generates recommendations.

## Explainability

The recommendation pipeline exposes supporting retrieval signals that can be used to explain why products were selected or ranked for a query.

## Multimodal Retrieval

The repository includes image retrieval, visual client and multimodal fusion components as an extensible foundation for future vision-language retrieval experiments.

## Experimental Setup

The current research benchmark uses:

- Dataset size: 407 products (current repository catalogue)
- Evaluation queries: 250 (benchmark artifact; current catalogue and benchmark are versioned separately)
- Evaluation cutoff: K = 5
- Validation queries: 200
- Held-out test queries: 50
- Weight configurations evaluated: 28
- Deterministic dataset generation
- Paired evaluation queries
- Bootstrap statistical analysis
- 2,000 bootstrap iterations
- 95% confidence intervals

The dataset is a controlled synthetic benchmark intended for system evaluation and reproducible experimentation rather than broad real-world generalization.

## Dataset

The current repository dataset contains 407 deterministically generated fashion products across multiple categories, genders, colors, materials, styles and occasions.

The evaluation benchmark contains 250 natural-language fashion queries with relevance annotations.

The dataset generation process is deterministic so that experiments can be reproduced from the same configuration.

## Baselines

The evaluation compares the following retrieval systems:

| System | Description |
|---|---|
| Keyword | Conventional keyword-based retrieval |
| Category | Category-oriented baseline |
| Price | Price-oriented retrieval |
| Popularity | Popularity-based retrieval |
| Lexical | Lexical relevance scoring |
| Attribute | Attribute matching |
| Semantic | Transformer embedding retrieval |
| Hybrid | Combined semantic, lexical, attribute and ranking signals |

## Main Evaluation Results

The latest recorded evaluation on the benchmark artifact produced the following results:

| System | Precision@5 | Recall@5 | F1@5 | MRR | NDCG@5 | MAP |
|---|---:|---:|---:|---:|---:|---:|
| Keyword | 0.9128 | 0.3803 | 0.5369 | 0.9531 | 0.9137 | 0.7314 |
| Category | 0.9504 | 0.3960 | 0.5591 | 0.9672 | 0.9548 | 0.7518 |
| Price | 0.0360 | 0.0150 | 0.0212 | 0.0622 | 0.0360 | 0.0579 |
| Popularity | 0.0440 | 0.0183 | 0.0259 | 0.0812 | 0.0392 | 0.0530 |
| Lexical | 0.9104 | 0.3793 | 0.5355 | 1.0000 | 0.9728 | 0.7416 |
| Attribute | 0.0440 | 0.0183 | 0.0259 | 0.0812 | 0.0392 | 0.0530 |
| Semantic | 0.7064 | 0.2943 | 0.4155 | 0.8723 | 0.7947 | 0.5569 |
| Hybrid | 0.7384 | 0.3077 | 0.4344 | 0.8540 | 0.8710 | 0.5508 |

The latest benchmark shows that lexical and category-based retrieval remain strong baselines on the current curated dataset.

Hybrid retrieval improves NDCG@5 relative to semantic retrieval, but does not outperform the strongest lexical and category baselines on the aggregate benchmark metrics.

## Statistical Analysis

Statistical comparisons use paired evaluation queries and bootstrap confidence intervals with 2,000 iterations.

The comparison direction is:

Hybrid − Comparison System

### Hybrid vs Semantic

Precision@5 difference:

0.0320

95% confidence interval:

[-0.0144, 0.0800]

MRR difference:

-0.0183

95% confidence interval:

[-0.0723, 0.0334]

NDCG@5 difference:

0.0763

95% confidence interval:

[0.0282, 0.1259]

The NDCG@5 interval excludes zero, providing evidence that hybrid retrieval improves this ranking metric relative to semantic retrieval on the current benchmark.

The Precision@5 and MRR intervals cross zero.

### Hybrid vs Keyword

Precision@5 difference:

-0.1744

95% confidence interval:

[-0.2200, -0.1304]

MRR difference:

-0.0992

95% confidence interval:

[-0.1424, -0.0562]

NDCG@5 difference:

-0.0427

95% confidence interval:

[-0.0822, -0.0014]

The current benchmark therefore provides evidence that hybrid retrieval performs below keyword retrieval on these aggregate metrics.

### Hybrid vs Category

Precision@5 difference:

-0.2120

95% confidence interval:

[-0.2592, -0.1640]

MRR difference:

-0.1133

95% confidence interval:

[-0.1528, -0.0729]

NDCG@5 difference:

-0.0838

95% confidence interval:

[-0.1239, -0.0423]

The category baseline also outperforms the current hybrid configuration on the evaluated metrics.

### Hybrid vs Lexical

Precision@5 difference:

-0.1720

95% confidence interval:

[-0.2096, -0.1328]

MRR difference:

-0.1460

95% confidence interval:

[-0.1796, -0.1116]

NDCG@5 difference:

-0.1018

95% confidence interval:

[-0.1353, -0.0683]

The current statistical analysis does not support a claim that hybrid retrieval outperforms lexical retrieval on the current benchmark.

## Ablation Study

The ablation study evaluates different combinations of retrieval signals.

| Configuration | Precision@5 | Recall@5 | F1@5 | MRR | NDCG@5 |
|---|---:|---:|---:|---:|---:|
| Lexical-only | 0.7656 | 0.3190 | 0.4504 | 0.8830 | 0.9035 |
| Lexical-budget | 0.7656 | 0.3190 | 0.4504 | 0.8830 | 0.9035 |
| Full-hybrid | 0.7384 | 0.3077 | 0.4344 | 0.8490 | 0.8710 |
| Semantic-attributes | 0.7096 | 0.2957 | 0.4174 | 0.8373 | 0.8342 |
| Lexical-attributes | 0.6984 | 0.2910 | 0.4108 | 0.8090 | 0.8310 |
| Semantic-only | 0.6712 | 0.2797 | 0.3948 | 0.8398 | 0.7593 |

The ablation results show that lexical retrieval is highly competitive on the current benchmark.

The full hybrid configuration improves NDCG@5 relative to semantic-only retrieval but does not exceed lexical-only retrieval in the controlled ablation.

This indicates that the contribution of individual signals is metric-dependent and that the current benchmark is not sufficient to establish universal superiority of the hybrid configuration.

## Weight Tuning

A controlled weight-search experiment evaluated 28 hybrid configurations.

The search was performed using a validation split of 200 queries, followed by evaluation on a held-out test split of 50 queries.

The best validation configuration used approximately:

- Semantic: 0.5294
- Lexical: 0.2353
- Attribute: 0.0588
- Budget: 0.1176
- Metadata: 0.0588

The tuned configuration produced a small validation improvement.

However, the held-out test results were unchanged:

| Metric | Production | Tuned |
|---|---:|---:|
| Precision@5 | 0.896 | 0.896 |
| MRR | 0.980 | 0.980 |
| NDCG@5 | 0.9509 | 0.9509 |

Therefore, the tuned configuration was not promoted to production.

This experiment suggests that the observed validation improvement did not demonstrate measurable generalization to the held-out queries.

## Robustness

The robustness evaluation contains 15 test cases.

Results:

- Successful cases: 15
- Failed cases: 0
- Success rate: 100%

The robustness suite evaluates edge cases including:

- Empty queries
- Whitespace-only queries
- Very short queries
- Case variations
- Spacing variations
- Budget queries
- Repeated characters
- Special characters
- Unrelated queries

The results demonstrate stable behavior across the current robustness test set.

## Reproducibility

The research pipeline records:

- Dataset size
- Evaluation query count
- Evaluation cutoff
- Deterministic execution status
- Dataset hash
- Experiment fingerprint
- Runtime environment
- Model information
- Evaluation results
- Ablation results
- Baseline comparisons
- Robustness results
- Statistical analysis

The current reproducibility benchmark reports deterministic execution.

The research artifact records the dataset hash:

`564b0d515265c5c22baac085098dd3bb397ece49b4d97fa50a5b058a537a621`

The experiment fingerprint is:

`fac2446d622c4d1ae78dc5d7d395285f05a17dcdcffd31113699c19e25f60d5a`

## Error Analysis

The evaluation framework supports per-query inspection of retrieval results.

This enables analysis of:

- Relevant items ranked too low
- Semantic mismatches
- Lexical mismatches
- Attribute failures
- Budget constraint failures
- Ranking disagreements
- Cases where hybrid retrieval differs from individual retrieval strategies

Per-query analysis is important because aggregate metrics alone cannot explain why a retrieval system succeeds or fails.

## Research Findings

The current experiments provide several observations.

First, lexical retrieval is a very strong baseline on the current curated dataset.

Second, semantic retrieval provides a different retrieval signal and achieves meaningful ranking performance, but performs below the strongest lexical and category baselines on the current benchmark.

Third, hybrid retrieval improves NDCG@5 relative to semantic retrieval, demonstrating complementary ranking behavior.

Fourth, the current hybrid configuration does not outperform the strongest lexical and category baselines on aggregate benchmark metrics.

Fifth, local weight tuning produces a small validation improvement but does not improve the held-out test results.

These findings suggest that hybrid retrieval remains a promising research direction, but stronger claims require larger, more diverse and human-judged datasets.

## Limitations

The current evaluation has several limitations:

- The dataset is synthetic and curated rather than a large public fashion benchmark.
- The benchmark contains 250 evaluation queries.
- Relevance labels are generated rather than obtained from large-scale human judgments.
- The current embedding model is relatively lightweight.
- The evaluation does not represent a large real-world fashion catalogue.
- Online user interaction metrics are not currently available.
- Personalization evaluation is not based on a large real-world user dataset.
- Multimodal retrieval components provide an experimental foundation but are not yet validated at large scale.
- Results should not be interpreted as evidence of universal superiority of hybrid retrieval.

## Future Research

Future work will investigate:

- Larger public fashion datasets
- Stronger domain-specific embedding models
- Vision-language models
- Multimodal image-text retrieval
- Query-image fusion
- User-level ranking models
- Cold-start personalization
- Human relevance judgments
- Larger evaluation benchmarks
- Online A/B evaluation
- Calibration and uncertainty analysis
- Larger-scale statistical validation
- Human preference studies

## Reproducible Research Artifacts

The evaluation pipeline generates machine-readable research artifacts including:

- Baseline comparison reports
- Statistical analysis reports
- Ablation reports
- Robustness reports
- Ranking model results
- Reproducibility manifests
- Research figures

These artifacts are intended to make experiments inspectable and reproducible.

## Conclusion

Fashion AI Discovery demonstrates an end-to-end experimental retrieval pipeline combining semantic search, lexical retrieval, attribute matching, candidate fusion, ranking, personalization and explainability.

The latest benchmark shows that hybrid retrieval provides complementary behavior to semantic retrieval and improves NDCG@5 relative to semantic-only retrieval.

However, lexical and category-based retrieval remain stronger baselines on the current curated dataset, and local weight tuning did not improve held-out performance.

The current evidence therefore supports hybrid retrieval as a promising research direction rather than establishing universal superiority.

The next research stage is to evaluate the approach on larger datasets with human relevance judgments while investigating stronger embedding models, multimodal retrieval, personalization and improved ranking methods.

## Technology Stack

- Node.js
- Express
- Transformers.js
- Hugging Face Transformers
- JavaScript
- Python
- Matplotlib
- GitHub Actions
- GitHub Pages
- Render
- HTML
- CSS

## Live Demo

https://shaikhkhushi-01.github.io/Fashion-AI-search/

## Backend API

https://fashion-ai-search-lj6s.onrender.com
