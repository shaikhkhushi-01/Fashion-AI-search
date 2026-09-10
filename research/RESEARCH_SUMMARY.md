# Fashion AI Discovery Research Summary

## Research Question

Can combining semantic, lexical, attribute and personalized signals improve fashion retrieval compared with conventional keyword-based search?

## Research Objective

Fashion search systems often depend on exact keyword matching, which can fail when users express preferences using natural language.

This project investigates a research-oriented fashion retrieval pipeline that combines multiple retrieval and ranking signals:

- Semantic similarity
- Lexical matching
- Attribute matching
- Budget constraints
- Metadata signals
- Candidate fusion
- Personalized ranking
- Explainable recommendations

The objective is to evaluate whether combining complementary retrieval signals can produce more robust ranking behaviour than relying on a single retrieval strategy.

## System Architecture

The current research pipeline follows:

Query Understanding
→ Semantic Retrieval
→ Lexical Retrieval
→ Attribute Matching
→ Candidate Fusion
→ Learning-to-Rank
→ Personalization
→ Explainability
→ Evaluation

The production semantic retrieval component uses:

- Model: `Xenova/all-MiniLM-L6-v2`
- Runtime: Transformers.js
- Backend: Node.js
- Representation: normalized embeddings
- Similarity: cosine similarity

The production retrieval system uses hybrid candidate generation and ranking.

## Dataset

The current research benchmark contains:

- Products: 10
- Evaluation queries: 41
- Evaluation cutoff: K = 5

The dataset is intentionally small and curated for controlled experimentation.

The results should therefore be interpreted as an experimental validation of the implemented methodology rather than as evidence of general performance on large-scale fashion search benchmarks.

## Evaluation Metrics

The evaluation framework measures:

- Precision@5
- Recall@5
- F1@5
- Mean Reciprocal Rank
- NDCG@5
- Average Precision

The primary ranking metrics considered in the research analysis are MRR and NDCG@5.

## Baseline Comparison

The evaluated retrieval systems include:

- Keyword baseline
- Category baseline
- Price baseline
- Popularity baseline
- Lexical retrieval
- Attribute retrieval
- Semantic retrieval
- Hybrid retrieval

### Aggregate Results

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

The hybrid system obtains the highest aggregate MRR and NDCG@5 among the evaluated production systems.

Compared with semantic retrieval, hybrid retrieval improves:

- MRR by approximately 0.0488
- NDCG@5 by approximately 0.0538

The corresponding relative improvements are approximately:

- 5.20% for MRR
- 5.85% for NDCG@5

These improvements indicate that combining multiple retrieval signals can substantially improve ranking quality over semantic retrieval alone on the current benchmark.

The lexical system also performs strongly, demonstrating that lexical matching remains an important component for this dataset.

## Controlled Ablation Study

A controlled ablation experiment was implemented using a fixed production-style hybrid candidate pool.

The candidate generation procedure uses semantic and lexical retrieval with reciprocal rank fusion.

The ablation experiment then changes the ranking signals while keeping candidate generation controlled.

Evaluated configurations:

- Lexical-only
- Lexical + Budget
- Semantic-only
- Lexical + Attributes
- Semantic + Attributes
- Full Hybrid

### Ablation Results

| Configuration | MRR | NDCG@5 |
|---|---:|---:|
| Lexical-only | 0.9878 | 0.9747 |
| Lexical + Budget | 0.9878 | 0.9747 |
| Full Hybrid | 0.9878 | ~0.9745 |
| Semantic + Attributes | 0.9878 | ~0.9654 |
| Lexical + Attributes | ~0.9756 | ~0.9590 |
| Semantic-only | 0.9390 | 0.9207 |

The controlled experiment produces an important finding: lexical-only retrieval is essentially tied with full hybrid on MRR and is marginally higher on NDCG@5 in this small benchmark.

Therefore, the result does not justify claiming that the hybrid system universally outperforms lexical retrieval.

Instead, the stronger conclusion is that:

1. Hybrid retrieval substantially improves over semantic-only retrieval.
2. Lexical retrieval is a very strong signal for the current curated dataset.
3. The full hybrid architecture reaches ranking quality comparable to the strongest lexical configuration.
4. Different retrieval signals contribute complementary behaviour, but their value depends on the evaluation distribution.

The difference between lexical-only and full-hybrid NDCG@5 is approximately 0.0002, which is negligible at the scale of this benchmark.

## Statistical Evaluation

The research pipeline includes paired statistical comparison across evaluation queries.

The statistical methodology uses:

- Confidence level: 95%
- Bootstrap iterations: 2,000
- Comparison unit: paired evaluation query
- Effect size: standardized paired mean difference
- Relative improvement: mean difference divided by comparison-system mean

Statistical comparisons are generated for:

- Hybrid vs Lexical
- Hybrid vs Semantic
- Hybrid vs Keyword
- Hybrid vs Category

Bootstrap confidence intervals are calculated from paired query-level metric differences.

The statistical analysis is stored separately in:

`backend/evaluation-results/statistical-analysis-report.json`

This allows the point estimates and uncertainty analysis to be inspected independently from the implementation code.

## Interpretation of Statistical Results

The statistical analysis should be interpreted together with the controlled ablation results.

The hybrid system shows a clear point-estimate advantage over semantic retrieval on the current benchmark.

However, the comparison between hybrid and lexical retrieval is much closer.

Because the lexical-only and full-hybrid configurations produce almost identical MRR and NDCG@5, the current benchmark does not provide strong evidence that adding hybrid ranking signals produces a meaningful improvement over lexical retrieval.

This is an important research observation rather than a failure of the experiment.

It suggests that the current evaluation queries are strongly aligned with explicit lexical product attributes and therefore favour lexical matching.

A larger and more diverse benchmark would be required to determine whether semantic and hybrid signals provide consistent advantages for more ambiguous or compositional fashion queries.

## Reproducibility

The experiment is designed to be deterministic.

The reproducibility manifest records:

- Dataset size
- Evaluation query count
- Evaluation cutoff
- Dataset hash
- Experiment fingerprint
- Node.js version
- Operating system
- Architecture
- Experiment configuration

The current benchmark contains:

- Dataset size: 10 products
- Evaluation cases: 41
- K: 5
- Deterministic execution: true

The experiment fingerprint and dataset hash allow future runs to verify whether the underlying experimental setup has changed.

## Robustness Testing

The robustness evaluation includes edge cases such as:

- Empty queries
- Whitespace-only queries
- Short queries
- Case variations
- Unknown queries
- Numeric queries
- Emoji-containing queries
- Long queries
- Common fashion queries

The current robustness benchmark contains 15 test cases.

All 15 cases completed successfully with zero failed cases.

This indicates that the retrieval pipeline handles the evaluated malformed and edge-case inputs without producing invalid output structures.

Robustness testing should be considered a software reliability evaluation rather than evidence of semantic correctness for every edge case.

## Learning-to-Rank Component

The project also contains a pairwise logistic ranking component.

Current experiment configuration:

- Training pairs: 9
- Epochs: 1,000
- Learning rate: 0.05
- L2 regularization: 0.001
- Final loss: approximately 0.00227

The ranking component provides a research direction for learning ranking weights from preference data rather than relying entirely on manually selected weights.

The current experiment is small and should therefore be treated as a proof-of-concept rather than a production-scale learned ranking model.

## Explainability

The recommendation pipeline generates explanations based on matched user preferences and product attributes.

Examples of explanation signals include:

- Style alignment
- Occasion suitability
- Colour matching
- Comfort preference
- Overall fashion-query compatibility

The objective is to make recommendations more interpretable rather than returning only an opaque relevance score.

## Research Figures

The experiment pipeline generates reproducible figures from the evaluation artifacts.

Available figures:

- `research/figures/baseline-comparison.png`
- `research/figures/ablation-study.png`
- `research/figures/statistical-comparison.png`

The figures are generated automatically from experiment outputs rather than manually entering result values.

## Main Findings

The current experiments support five main observations.

### 1. Semantic retrieval provides strong ranking quality

Semantic retrieval achieves:

- MRR: 0.9390
- NDCG@5: 0.9207

This demonstrates that embedding-based retrieval can provide strong performance for natural-language fashion queries.

### 2. Lexical retrieval remains extremely competitive

Lexical retrieval achieves:

- MRR: 0.9593
- NDCG@5: 0.9311

In the controlled ablation experiment, lexical-only retrieval reaches approximately the same MRR and NDCG@5 as the full hybrid configuration.

This indicates that explicit product attributes and lexical relationships remain highly informative for the current dataset.

### 3. Hybrid retrieval improves substantially over semantic-only retrieval

The hybrid system achieves:

- MRR: 0.9878
- NDCG@5: 0.9745

The improvement over semantic-only retrieval is substantial on the current benchmark.

This supports the hypothesis that combining complementary retrieval signals can improve ranking quality when compared with a purely semantic approach.

### 4. The benchmark exposes an important dataset effect

The current queries are relatively well aligned with explicit fashion attributes.

As a result, lexical retrieval performs exceptionally well.

This suggests that future experiments should include more difficult query types such as:

- Indirect descriptions
- Compositional preferences
- Synonyms
- Style descriptions
- Occasion-based descriptions
- Context-dependent queries
- Queries containing implicit attributes
- Queries requiring semantic generalization

### 5. The current results are promising but not generalizable

The benchmark contains only 10 products and 41 evaluation queries.

Therefore, the reported metrics should not be interpreted as representative of large-scale fashion retrieval performance.

The primary contribution of the current experiment is the reproducible evaluation framework and controlled comparison methodology.

## Limitations

The current study has several limitations.

### Dataset Size

The dataset contains only 10 products.

A larger product catalogue is required to evaluate retrieval behaviour at realistic scale.

### Evaluation Set Size

The benchmark contains 41 queries.

A substantially larger query set would provide more reliable estimates of ranking performance.

### Query Distribution

The current queries are curated and may not represent real-world user search behaviour.

### Limited Product Diversity

The current catalogue does not capture the full diversity of fashion products, brands, styles, materials, occasions and price ranges.

### No Human Relevance Judgments

The current relevance labels are curated rather than collected from a large population of human evaluators.

### No Online Evaluation

The current study does not evaluate click-through rate, conversion rate, dwell time, add-to-cart behaviour or user satisfaction.

### Model Scale

The current semantic encoder is a compact general-purpose sentence embedding model.

Larger domain-specific fashion encoders may produce stronger semantic representations.

## Threats to Validity

The high aggregate scores should be interpreted carefully.

A small benchmark can produce high metric values when the evaluation queries and catalogue are closely aligned.

In particular, the strong lexical results indicate that the current benchmark may favour explicit attribute matching.

The conclusions should therefore be framed as observations from the controlled benchmark rather than universal claims about fashion search.

## Future Research

The next research directions are:

1. Expand the product catalogue substantially.
2. Create a larger and more diverse evaluation-query benchmark.
3. Collect human relevance judgments.
4. Introduce difficult semantic and compositional queries.
5. Compare additional embedding models.
6. Evaluate domain-specific fashion encoders.
7. Investigate multimodal image-text retrieval.
8. Add vision-language models for fashion understanding.
9. Train ranking models using larger preference datasets.
10. Evaluate personalization under cold-start conditions.
11. Perform cross-domain and cross-catalogue evaluation.
12. Add online evaluation with user interaction signals.
13. Study retrieval latency and scalability at larger catalogue sizes.
14. Perform statistical significance testing across larger benchmarks.
15. Investigate failure cases through systematic error analysis.

## Research Contribution

The current project goes beyond implementing a basic search interface.

It provides an end-to-end experimental framework containing:

- Semantic retrieval
- Lexical retrieval
- Attribute-aware retrieval
- Hybrid candidate fusion
- Learning-to-rank
- Personalization
- Explainability
- Baseline comparison
- Controlled ablation
- Robustness testing
- Statistical comparison
- Bootstrap confidence intervals
- Reproducibility metadata
- Automated research figures
- Automated GitHub Actions validation

The main research contribution is the construction of a reproducible framework for studying how different retrieval signals interact in natural-language fashion search.

## Conclusion

The current experiments provide evidence that semantic and hybrid retrieval can produce strong ranking quality for natural-language fashion search.

The hybrid system substantially improves over semantic-only retrieval on the current benchmark.

At the same time, the controlled ablation reveals that lexical retrieval is exceptionally strong for the current query distribution and is effectively tied with the full hybrid system.

This result motivates a more challenging future benchmark rather than supporting an unconditional claim that hybrid retrieval is superior.

The next stage of the research is therefore to scale the dataset, diversify the query distribution, introduce human relevance judgments and evaluate stronger semantic and multimodal retrieval models.

The current implementation provides the infrastructure required to perform those experiments reproducibly.
