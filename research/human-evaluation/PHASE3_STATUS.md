# Phase 3A — Human Evaluation Infrastructure

Status: **COMPLETE (infrastructure)**

## Implemented

- 0–4 graded relevance rubric.
- Blinded annotation manifest and JSONL template.
- Annotation guide with independent-judgment rules.
- Strict judgment validation: required IDs, relevance range 0–4, duplicate-annotator rejection, and exactly 3 independent annotations per query-product pair.
- Pair-level aggregation using majority relevance and mean relevance.
- Fleiss' kappa agreement calculation.
- JSONL evaluation runner writing `evaluation-results/human-evaluation-summary.json`.

## Run after real annotation

```bash
node backend/tests/human-evaluation.js
```

Input: `research/human-evaluation/judgments.jsonl`

The repository intentionally does **not** contain fabricated human judgments. The input must come from actual blinded annotations.

## Phase 3B handoff

1. Preserve raw JSONL labels unchanged.
2. Run the evaluator.
3. Inspect coverage and Fleiss' kappa.
4. Use aggregated human labels as relevance ground truth for final retrieval comparisons.

## Claim discipline

Do not report human agreement, human relevance, or human-validated ranking performance until real annotations have been collected and evaluated.