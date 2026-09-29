# Phase 4 — Final Experiments & Analysis

## Status: IMPLEMENTED — READY FOR RUNTIME

Phase 4 adds the final experiment protocol without fabricating empirical results.

### Implemented
- Validation-only hyperparameter selection for hybrid retrieval.
- Explicit untouched 50-query held-out test split.
- Same K=5 metrics across BM25, lexical, semantic and hybrid.
- Paired bootstrap 95% confidence intervals with 2,000 iterations.
- Paired effect-size calculation for held-out system comparisons.
- Difficult-query/challenge-set analysis with zero-hit tracking.
- Human-evidence gate: real `judgments.jsonl` is detected but never synthesized.
- Multimodal claim boundary remains blocked when the canonical catalog has no image assets.
- Machine-readable final report: `evaluation-results/phase4-final-experiments.json`.

### Runtime
```bash
node backend/tests/phase4-final-experiments.js
```

### Selection rule
Hybrid weights are selected using validation NDCG@5, then MRR, then MAP. The 50 held-out queries are evaluated only after selection.

### Claim discipline
This phase creates the experiment machinery and report. It does not claim a winner, human agreement, multimodal performance, or real-world superiority without corresponding evidence.

### Phase 4 completion criterion
Run the experiment successfully, inspect the generated report, and retain the held-out results as final evidence. If human annotations are later supplied, run the human-evidence analysis separately and keep those results explicitly labeled as human-judged.
