# Fashion AI Discovery — Research Protocol

## Benchmark
The canonical benchmark is 407 catalogue products, 250 evaluation queries, K=5, with 200 validation and 50 held-out test queries. Historical 10-product/41-query results remain separate artifacts and must not be mixed into the current result.

## Baselines
Every main comparison should use the same queries and cutoff: Keyword, Category, Lexical, BM25, Semantic, Hybrid, and multimodal text→image when image coverage permits. BM25 is implemented in backend/services/bm25.js.

## Human evaluation
Synthetic and human labels are separate. Human judgments use 0–4 graded relevance with at least three independent annotators. Agreement is computed before aggregation. No human result is reported until real annotations exist.

## Multimodal evaluation
The executable multimodal path uses CLIP-style image/text embeddings through Transformers.js, default model Xenova/clip-vit-base-patch32. Report text-only, text→image, fused text+visual, valid-image count, skipped-image count, model identifier and latency.

## Statistics
Primary metrics: MRR, NDCG@5, MAP. Secondary: Precision@5, Recall@5, F1@5. Report paired bootstrap 95% confidence intervals and effect sizes.

## Tuning
Tune weights only on validation queries. Promote a tuned configuration only if it improves the held-out test set.

## Claim discipline
Distinguish synthetic benchmark observations, human-judged evidence, engineering reliability and generalization. High curated scores are not evidence of real-world superiority.
