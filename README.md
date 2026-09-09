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

## Experimental Setup

The current evaluation uses:

- Dataset size: 10 products
- Evaluation queries: 41
- Evaluation cutoff: K = 5
- Deterministic execution
- Paired evaluation queries
- Bootstrap statistical analysis
- 2,000 bootstrap iterations
- 95% confidence intervals

The benchmark is a small curated evaluation set intended for controlled experimentation and system validation rather than broad generalization.

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

| System | MRR | NDCG@5 |
|---|---:|---:|
| Keyword | 0.9085 | 0.9053 |
| Category | 0.9065 | 0.9070 |
| Price | 0.3446 | 0.3282 |
| Popularity | 0.3446 | 0.3299 |
| Lexical | 0.9593 | 0.9311 |
| Attribute | 0.3446 | 0.3299 |
| Semantic | 0.9390 | 0.9207 |
| Hybrid | 0.9878 | 0.9745 |

The hybrid system achieves the highest MRR and NDCG@5 among the evaluated production systems.

## Statistical Analysis

Statistical comparisons use paired evaluation queries and deterministic bootstrap confidence intervals with 2,000 iterations.

The comparison direction is:

Hybrid − Comparison System

### Hybrid vs Semantic

MRR difference:

0.0488

95% confidence interval:

[0.0122, 0.0976]

NDCG@5 difference:

0.0538

95% confidence interval:

[0.0247, 0.0869]

Both intervals exclude zero, providing evidence of improved ranking quality for the hybrid system on this benchmark.

### Hybrid vs Keyword

MRR difference:

0.0793

95% confidence interval:

[0.0122, 0.1463]

NDCG@5 difference:

0.0692

95% confidence interval:

[0.0307, 0.1126]

Both intervals exclude zero, providing evidence of improved ranking quality for the hybrid system on this benchmark.

### Hybrid vs Lexical

MRR difference:

0.0285

95% confidence interval:

[-0.0203, 0.0854]

NDCG@5 difference:

0.0433

95% confidence interval:

[0.0119, 0.0798]

The MRR interval crosses zero, so the MRR improvement over lexical retrieval is not established by this analysis.

The NDCG@5 interval is above zero, indicating evidence of improved ranking quality on this metric.

## Ablation Study

The ablation study evaluates the effect of individual ranking signals while keeping the production hybrid candidate pool fixed.

| Configuration | MRR | NDCG@5 |
|---|---:|---:|
| Lexical-only | 0.9878 | 0.9747 |
| Lexical-budget | 0.9878 | 0.9747 |
| Semantic-attributes | 0.9878 | 0.9654 |
| Lexical-attributes | 0.9756 | 0.9590 |
| Full-hybrid | 0.9878 | 0.9745 |
| Semantic-only | 0.9390 | 0.9207 |

The controlled ablation shows that semantic retrieval alone performs below the stronger combined configurations.

The lexical-only configuration is extremely competitive on this small benchmark and slightly exceeds the full-hybrid configuration on NDCG@5 while producing the same MRR.

This indicates that the contribution of hybrid reranking is metric-dependent and that the current benchmark is not sufficient to establish universal superiority over lexical retrieval.

## Robustness

The robustness evaluation contains 15 test cases.

Results:

- Successful cases: 15
- Failed cases: 0
- Success rate: 100%

The robustness evaluation is intended to validate system stability across the current edge-case test set.

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

The generated research artifacts are stored through the project evaluation pipeline.

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

The current experiments provide three main observations.

First, semantic retrieval substantially improves over weaker non-semantic baselines on ranking-oriented metrics, but semantic retrieval alone does not achieve the strongest performance.

Second, combining retrieval and ranking signals produces strong performance and improves over semantic and keyword baselines on the current benchmark.

Third, lexical retrieval remains highly competitive. The controlled ablation therefore does not justify claiming that hybrid retrieval universally outperforms lexical retrieval.

These findings motivate evaluation on larger and more diverse datasets.

## Limitations

The current evaluation has several limitations:

- The dataset contains only 10 products.
- The benchmark contains only 41 evaluation queries.
- The evaluation is curated rather than based on a large public benchmark.
- Statistical confidence intervals are based on the current evaluation cases.
- No human relevance judgments are currently used.
- Online user interaction metrics are not yet available.
- The current semantic encoder is relatively lightweight.
- The results should not be interpreted as evidence of general performance across large-scale fashion catalogues.

## Future Research

Future work will investigate:

- Larger public fashion datasets
- Stronger embedding models
- Vision-language models
- Multimodal image-text retrieval
- Query-image fusion
- User-level ranking models
- Cold-start personalization
- Human relevance judgments
- Larger evaluation benchmarks
- Online A/B evaluation
- Calibration and uncertainty analysis
- Statistical significance across larger query collections

## Reproducible Research Artifacts

The evaluation pipeline generates machine-readable research artifacts including:

- Baseline comparison reports
- Statistical analysis reports
- Ablation reports
- Robustness reports
- Ranking model results
- Reproducibility manifests

These artifacts are intended to make experiments inspectable and reproducible.

## Conclusion

Fashion AI Discovery demonstrates a complete experimental retrieval pipeline that combines semantic search, lexical retrieval, attribute matching, candidate fusion, ranking and personalization.

On the current curated benchmark, hybrid retrieval achieves strong ranking performance and shows evidence of improvement over semantic and keyword baselines.

However, the results also demonstrate that lexical retrieval remains highly competitive. The current evidence therefore supports the hybrid approach as a promising research direction rather than establishing universal superiority.

The next research stage is to scale the evaluation to larger datasets and human-judged benchmarks while studying multimodal retrieval, personalization and stronger ranking models.

## Technology Stack

- Node.js
- Express
- Transformers.js
- Hugging Face Transformers
- JavaScript
- GitHub Actions
- GitHub Pages
- Render
- HTML
- CSS

## Live Demo

https://shaikhkhushi-01.github.io/Fashion-AI-search/

## Backend API

https://fashion-ai-search-lj6s.onrender.com
