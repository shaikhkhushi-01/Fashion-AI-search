# MBZUAI Research Presentation — Fashion AI Discovery

## 1. Research Question
Can combining semantic, lexical, attribute and ranking signals improve fashion retrieval compared with conventional search?

## 2. Motivation
Fashion queries are often natural-language, multi-attribute and ambiguous. Exact keyword matching can miss semantic intent, while semantic retrieval can lose precise product attributes.

## 3. Proposed Research System
Query Understanding → Semantic Retrieval + Lexical Retrieval → Candidate Fusion → Attribute/Budget-aware Ranking → Evaluation

Primary semantic model: `Xenova/all-MiniLM-L6-v2`.

## 4. Experimental Design
- Canonical catalogue: 407 products
- Query benchmark: 250 queries
- Validation/test split: 200 / 50
- Cutoff: K=5
- Baselines: BM25, lexical, semantic, hybrid
- Primary metrics: MRR, NDCG@5, MAP
- Secondary metrics: Precision@5, Recall@5, F1@5
- Uncertainty: paired bootstrap, 2,000 iterations, 95% CI

## 5. Current Evidence
The repository contains both historical and canonical-v1 artifacts. The historical 10-product/41-query results must not be mixed with the canonical 407-product/250-query benchmark.

The current research position is deliberately conservative:
- lexical retrieval is a strong baseline on the curated benchmark;
- hybrid retrieval shows complementary behaviour versus semantic retrieval;
- held-out evaluation is required before making generalization claims;
- human relevance judgments are still required for human-validated conclusions;
- multimodal claims require verified image assets and executable text-image evaluation.

## 6. Research Contribution
The strongest contribution is the reproducible experimental framework:
- deterministic benchmark split;
- multiple retrieval baselines;
- validation-only tuning;
- held-out testing;
- statistical uncertainty analysis;
- blinded human-evaluation infrastructure;
- difficult-query analysis;
- explicit claim boundaries.

## 7. Limitations
- Synthetic/curated relevance labels.
- No completed human annotation evidence yet.
- Current image coverage blocks a full multimodal benchmark.
- Curated query distribution may favour lexical attribute matching.
- No online user study or production-scale deployment evaluation.

## 8. Proposed Next Research Step
Collect real human relevance judgments, validate inter-rater agreement, compare human-grounded retrieval quality, expand difficult/compositional queries, and then evaluate multimodal text-image retrieval when image assets are available.

## 9. Closing Statement
This project is positioned as a reproducible research prototype rather than a claim of universal retrieval superiority. The next stage is to test whether the observed retrieval behaviour survives human judgments, harder queries and multimodal evidence.
