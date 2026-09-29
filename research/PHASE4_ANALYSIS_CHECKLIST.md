# Phase 4 — Analysis Checklist

Use `evaluation-results/phase4-final-experiments.json` as the machine-readable source.

## Required reporting
1. Validation-selected hybrid configuration.
2. Held-out MRR, NDCG@5, MAP, Precision@5, Recall@5 and F1@5 for every system.
3. Paired bootstrap 95% CIs and effect sizes for hybrid vs each baseline.
4. Difficult-query zero-hit count and per-query failure examples.
5. Runtime/latency observations from the benchmark runner when separately measured.
6. Human-judged metrics only after real annotations are validated.
7. Multimodal metrics only after image assets and executable text-image compatibility are verified.

## Interpretation rules
- Do not mix the historical 10-product/41-query benchmark with v1.
- Do not convert synthetic-curated labels into human evidence.
- Do not call a statistically uncertain difference a proven improvement.
- Do not generalize the curated benchmark to production performance.
