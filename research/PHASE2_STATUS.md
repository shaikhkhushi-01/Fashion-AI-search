# Phase 2 — Dataset & Benchmark Status

## Implemented

- Canonical benchmark contract: 407 products, 250 queries, K=5.
- Deterministic validation/held-out split: 200/50.
- BM25 integrated into the same benchmark runner as lexical, semantic and hybrid retrieval.
- Difficulty challenge set: 30 compositional/indirect-style/synonym/multi-constraint queries.
- Image coverage audit checks common image fields before attempting multimodal evaluation.
- Machine-readable benchmark report written to `evaluation-results/benchmark-v1-report.json`.

## Label discipline

The 250-query benchmark remains **synthetic-curated**. The difficult-query set intentionally has no relevance labels. Human judgments are a Phase 3 task and are not inferred by the benchmark runner.

## Important limitation

The current canonical catalogue contains no supported image field, so the multimodal branch is expected to report `blocked-pending-image-assets` until image assets are attached to products. This is an audit result, not a multimodal score.

## Execution

Run:

`node backend/tests/research-benchmark-v1.js`

The runner fails fast if the catalogue/query counts drift from the canonical benchmark. It produces validation and held-out metrics for BM25, lexical, semantic and hybrid retrieval, plus the image/multimodal audit.

## Phase 2 exit criterion

Phase 2 is complete when the runner executes successfully, the report is inspected, and the held-out split is kept untouched for tuning. Human annotation and final multimodal claims remain Phase 3/4 work.
