# Phase 3B — Human Evaluation

Status: **IMPLEMENTED / READY FOR REAL ANNOTATION**

## Infrastructure

- Deterministic candidate-task generator: `backend/tests/build-human-annotation-task.js`
- 100 protocol queries × 10 candidates/query
- Candidate pools generated from BM25, lexical, semantic, and hybrid retrieval
- Deterministic candidate fusion and blinded display order
- Retrieval system names and scores are not exported to annotators
- No synthetic relevance labels are exported
- Raw annotation ingestion is handled by `backend/tests/human-evaluation.js`

## Generate task

```bash
node backend/tests/build-human-annotation-task.js
```

Expected outputs:

- `research/human-evaluation/annotation-task-v1.json`
- `research/human-evaluation/annotation-task-v1.jsonl`

## Real-world requirement

This phase cannot truthfully produce human judgments without human annotators. The repository therefore contains **zero fabricated human annotations**.

For every query-product pair, collect exactly 3 independent 0–4 judgments. Save the raw records to:

`research/human-evaluation/judgments.jsonl`

Then run:

```bash
node backend/tests/human-evaluation.js
```

## Evidence boundary

Until real judgments are collected:

- human agreement = pending
- Fleiss' kappa = pending
- human-grounded relevance labels = pending
- human-validated retrieval metrics = pending

The candidate generator itself is reproducible research infrastructure, not evidence of human performance.
