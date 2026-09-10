# Fashion AI Discovery Research Portfolio

## Research Focus

This project investigates whether combining semantic, lexical, attribute and personalized signals can improve natural-language fashion retrieval compared with conventional keyword-based search.

## Research Pipeline

The implemented research pipeline follows:

Query Understanding
→ Semantic Retrieval
→ Lexical Retrieval
→ Attribute Matching
→ Candidate Fusion
→ Learning-to-Rank
→ Personalization
→ Explainability
→ Evaluation

## Core Research Components

| Component | Implementation |
|---|---|
| Semantic Retrieval | Transformers.js with `Xenova/all-MiniLM-L6-v2` |
| Lexical Retrieval | Lexical relevance scoring |
| Attribute Matching | Fashion attribute compatibility |
| Candidate Fusion | Semantic + lexical reciprocal rank fusion |
| Ranking | Hybrid weighted ranking and pairwise logistic ranking |
| Personalization | User preference signals |
| Explainability | Preference and attribute-based explanations |
| Evaluation | Precision@K, Recall@K, F1@K, MRR, NDCG@K, AP |
| Statistical Analysis | Paired bootstrap confidence intervals |
| Robustness | Edge-case retrieval evaluation |
| Reproducibility | Dataset hash and experiment fingerprint |
| Figures | Automated matplotlib generation |

## Experimental Benchmark

| Property | Value |
|---|---:|
| Products | 10 |
| Evaluation Queries | 41 |
| Evaluation Cutoff | K = 5 |
| Bootstrap Iterations | 2,000 |
| Confidence Level | 95% |
| Deterministic Evaluation | Yes |

## Baseline Results

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

## Controlled Ablation

The ablation experiment uses a fixed production-style semantic-lexical candidate pool and changes the ranking signals applied during reranking.

| Configuration | MRR | NDCG@5 |
|---|---:|---:|
| Lexical-only | 0.9878 | 0.9747 |
| Lexical + Budget | 0.9878 | 0.9747 |
| Full Hybrid | 0.9878 | ~0.9745 |
| Semantic + Attributes | 0.9878 | ~0.9654 |
| Lexical + Attributes | ~0.9756 | ~0.9590 |
| Semantic-only | 0.9390 | 0.9207 |

## Main Findings

The hybrid system produces strong ranking quality and substantially improves over semantic-only retrieval on the current benchmark.

The semantic-to-hybrid improvement is approximately:

- MRR: +0.0488
- NDCG@5: +0.0538

The controlled ablation also reveals that lexical retrieval is exceptionally strong for the current evaluation distribution.

Lexical-only retrieval and full hybrid retrieval have identical MRR and nearly identical NDCG@5.

The difference in NDCG@5 between lexical-only and full hybrid is approximately 0.0002.

Therefore, the current experiments do not support the claim that hybrid retrieval universally outperforms lexical retrieval.

Instead, the evidence indicates that lexical signals are highly informative for explicit fashion attributes while semantic and hybrid retrieval provide complementary capabilities for natural-language search.

## Statistical Evidence

Statistical comparisons are performed at the paired evaluation-query level.

The analysis uses:

- 95% confidence intervals
- 2,000 bootstrap iterations
- Paired query-level differences
- Standardized paired mean differences
- Relative improvement measurements

The generated statistical report is available at:

`backend/evaluation-results/statistical-analysis-report.json`

## Robustness Evidence

The robustness evaluation contains 15 edge-case queries.

Results:

- Successful cases: 15
- Failed cases: 0
- Success rate: 100%

These results demonstrate implementation robustness for the evaluated edge cases.

They should not be interpreted as evidence of universal semantic correctness.

## Reproducibility Evidence

The experiment records:

- Dataset size
- Evaluation query count
- Evaluation cutoff
- Dataset hash
- Experiment fingerprint
- Node.js version
- Operating system
- Architecture
- Deterministic execution status

This information is stored in:

`backend/evaluation-results/reproducibility-manifest.json`

## Research Artifacts

### Baseline Evaluation

`backend/evaluation-results/baseline-comparison-report.json`

Contains comparative retrieval metrics across keyword, category, price, popularity, lexical, attribute, semantic and hybrid systems.

### Controlled Ablation

`backend/evaluation-results/ablation-report.json`

Contains the controlled ranking-signal ablation experiment.

### Statistical Analysis

`backend/evaluation-results/statistical-analysis-report.json`

Contains paired bootstrap comparisons and uncertainty estimates.

### Robustness

`backend/evaluation-results/robustness-report.json`

Contains edge-case evaluation results.

### Ranking Model

`backend/evaluation-results/ranker-model.json`

Contains the pairwise logistic ranking experiment.

### Reproducibility

`backend/evaluation-results/reproducibility-manifest.json`

Contains experiment and dataset reproducibility metadata.

## Research Figures

Automated figures are generated from the experiment artifacts.

- `backend/research-results/figures/baseline-comparison.png`
- `backend/research-results/figures/ablation-study.png`
- `backend/research-results/figures/statistical-comparison.png`

The figure-generation pipeline is reproducible and runs through GitHub Actions.

## Research Interpretation

The current benchmark provides evidence that combining retrieval signals can produce strong ranking performance, particularly compared with semantic-only retrieval.

However, the strongest lexical configuration performs essentially identically to the full hybrid configuration.

This finding is important because it demonstrates that the value of a hybrid architecture cannot be established solely from aggregate metrics on a small curated benchmark.

A larger and more diverse benchmark is required to determine whether hybrid retrieval provides consistent gains for ambiguous, compositional and semantically complex fashion queries.

## Limitations

The current evaluation has several limitations:

- Small product catalogue
- Small evaluation-query set
- Curated evaluation queries
- No large-scale human relevance dataset
- No online user evaluation
- Limited product diversity
- Compact semantic encoder
- No large-scale multimodal benchmark

The current results should therefore be interpreted as controlled experimental evidence rather than general claims about large-scale fashion retrieval.

## Future Research

Future experiments will investigate:

1. Larger fashion catalogues
2. Larger evaluation-query benchmarks
3. Human relevance judgments
4. More difficult semantic queries
5. Compositional fashion queries
6. Domain-specific embedding models
7. Vision-language retrieval
8. Image-text multimodal fusion
9. Larger preference datasets for ranking
10. Cold-start personalization
11. Cross-catalogue evaluation
12. Online user evaluation
13. Retrieval scalability
14. Larger statistical benchmarks
15. Systematic failure analysis

## Research Contribution

The project provides an end-to-end reproducible framework for studying natural-language fashion retrieval.

The contribution is not limited to a search interface.

The system integrates retrieval, ranking, personalization, explainability, evaluation, ablation, robustness testing, statistical analysis, reproducibility tracking and automated research visualization.

The controlled experiments also expose an important dataset-dependent result: strong lexical matching can remain competitive with a substantially more complex hybrid retrieval architecture when queries closely correspond to explicit product attributes.

## Conclusion

Fashion AI Discovery demonstrates a complete research workflow for evaluating natural-language fashion retrieval.

The experiments show that semantic retrieval provides strong ranking quality and that hybrid retrieval substantially improves over semantic-only retrieval on the current benchmark.

At the same time, controlled ablation shows that lexical retrieval is extremely competitive for the current query distribution.

The next research stage is therefore not simply to increase model complexity, but to construct a larger and more challenging evaluation benchmark capable of measuring semantic generalization, multimodal understanding and personalized retrieval.
