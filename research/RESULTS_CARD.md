# Main Research Result Card

Current benchmark: 407 products, 250 queries, 200/50 validation/test split, K=5. Labels are synthetic-curated; human labels are pending.

The latest recorded benchmark shows that lexical and category baselines are strong on the curated data. Hybrid retrieval improves NDCG@5 relative to semantic retrieval, but does not outperform the strongest lexical/category baselines on aggregate metrics.

The next evidence gate is real human relevance judgments, a larger and more diverse query distribution, BM25 and multimodal baselines under the same protocol, held-out evaluation, uncertainty estimates, and systematic error analysis.

Until those evidence gates are met, describe the project as a reproducible research prototype rather than a validated general-purpose fashion retrieval model.
