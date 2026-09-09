# Fashion AI Discovery Research Summary

## Research Question

Can combining semantic, lexical, attribute and personalized signals improve fashion retrieval compared with conventional keyword-based search?

## Problem

Traditional fashion search systems often depend heavily on lexical matching. This can fail when users describe their desired products using natural language that does not exactly match catalogue text.

Examples include:

- elegant outfit for a wedding
- comfortable clothes for summer
- casual black outfit
- affordable office wear
- minimal outfit for dinner

The research problem is to determine whether combining semantic understanding with lexical and structured product signals can improve retrieval quality.

## Proposed Approach

The system implements a multi-stage retrieval architecture:

Query Understanding
→ Semantic Retrieval
→ Lexical Retrieval
→ Attribute Matching
→ Candidate Fusion
→ Learning-to-Rank
→ Personalization
→ Explainability

Semantic retrieval uses the Xenova/all-MiniLM-L6-v2 model through Transformers.js.

Semantic and lexical candidates are combined using Reciprocal Rank Fusion.

The final ranking incorporates semantic similarity, lexical relevance, attribute matching, budget compatibility and metadata quality.

## Experimental Setup

Dataset size: 10 products

Evaluation queries: 41

Evaluation cutoff: K = 5

Evaluation metrics:

- Precision@5
- Recall@5
- F1@5
- MRR
- NDCG@5
- MAP

Statistical methodology:

- Paired evaluation queries
- Deterministic bootstrap
- 2,000 bootstrap iterations
- 95% confidence intervals
- Standardized paired mean-difference effect size

## Main Results

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

## Statistical Findings

### Hybrid vs Semantic

MRR difference: +0.0488

95% CI: [0.0122, 0.0976]

NDCG@5 difference: +0.0538

95% CI: [0.0247, 0.0869]

Both confidence intervals exclude zero.

### Hybrid vs Keyword

MRR difference: +0.0793

95% CI: [0.0122, 0.1463]

NDCG@5 difference: +0.0692

95% CI: [0.0307, 0.1126]

Both confidence intervals exclude zero.

### Hybrid vs Lexical

MRR difference: +0.0285

95% CI: [-0.0203, 0.0854]

NDCG@5 difference: +0.0433

95% CI: [0.0119, 0.0798]

The MRR interval crosses zero.

The NDCG@5 interval does not cross zero.

Therefore, the evidence for improvement over lexical retrieval is metric-dependent.

## Ablation Study

The ablation experiment keeps the production hybrid candidate pool fixed while changing ranking signals.

| Configuration | MRR | NDCG@5 |
|---|---:|---:|
| Lexical-only | 0.9878 | 0.9747 |
| Lexical-budget | 0.9878 | 0.9747 |
| Semantic-attributes | 0.9878 | 0.9654 |
| Lexical-attributes | 0.9756 | 0.9590 |
| Full-hybrid | 0.9878 | 0.9745 |
| Semantic-only | 0.9390 | 0.9207 |

The results show that semantic retrieval alone performs below the strongest combined configurations.

Lexical retrieval remains highly competitive on the current benchmark.

The controlled experiment therefore does not support a universal claim that hybrid reranking always outperforms lexical retrieval.

## Robustness

The robustness evaluation contains 15 cases.

Successful cases: 15

Failed cases: 0

Success rate: 100%

This validates stable execution across the current robustness test set.

## Reproducibility

The experimental pipeline records:

- Dataset size
- Evaluation query count
- Evaluation cutoff
- Dataset hash
- Experiment fingerprint
- Runtime environment
- Deterministic execution status
- Model information
- Baseline results
- Ablation results
- Robustness results
- Statistical analysis

Machine-readable experiment artifacts are generated automatically.

## Research Interpretation

The experiments provide evidence that semantic retrieval can contribute useful ranking information when combined with other retrieval signals.

The strongest evidence in the current benchmark is the improvement of hybrid retrieval over semantic and keyword baselines.

The lexical baseline remains competitive, demonstrating that semantic retrieval should not automatically be assumed to outperform strong lexical matching.

The results therefore motivate a larger investigation rather than a claim of universal superiority.

## Limitations

The current study has important limitations.

The dataset contains only 10 products and the evaluation contains 41 queries.

The benchmark is curated rather than a large public dataset.

No human relevance judgments are currently available.

The statistical analysis is therefore limited to the current query set.

The results should not be generalized to large-scale commercial fashion search systems.

## Future Research

Future experiments should investigate:

1. Larger public fashion datasets
2. Human relevance judgments
3. Stronger embedding models
4. Vision-language models
5. Multimodal image-text retrieval
6. Query-image fusion
7. User-level ranking
8. Cold-start personalization
9. Online evaluation
10. Larger statistical benchmarks

## Research Contribution

The project provides an end-to-end experimental framework for studying fashion retrieval.

The contribution is not a claim that one retrieval method universally solves fashion search.

Instead, the system provides a reproducible environment for comparing:

- lexical retrieval
- semantic retrieval
- structured attribute matching
- hybrid candidate fusion
- ranking models
- personalization

The evaluation and ablation infrastructure allows future experiments to measure the contribution of individual components.

## Conclusion

Fashion AI Discovery demonstrates a reproducible research-oriented fashion retrieval pipeline.

The current benchmark shows strong performance from hybrid retrieval and evidence of improvement over semantic and keyword baselines.

At the same time, the competitive lexical baseline highlights the importance of controlled comparisons and prevents unsupported claims about universal superiority.

The next stage is to scale the benchmark, introduce human judgments and investigate multimodal and personalized retrieval.
