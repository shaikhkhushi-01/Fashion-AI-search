# Phase 3B — Human Annotation Handoff

## What 3B does

Phase 3B collects **real human relevance judgments** for the blinded candidate set produced by `annotation-task-v1`.

## Build the annotation task

```bash
node backend/tests/build-human-annotation-task.js
```

This reads the canonical 407-product catalog and 250-query evaluation set, selects the first 100 protocol queries, generates candidate pools from BM25, lexical, semantic, and hybrid retrieval, merges candidates deterministically, and hides retrieval-system identity and scores.

Outputs:
- `research/human-evaluation/annotation-task-v1.jsonl` — line-oriented task file for annotation.
- `research/human-evaluation/annotation-task-v1.json` — complete task manifest.

## Annotator workflow

For each query, inspect the 10 blinded products and assign one relevance score per product:
- 0 = irrelevant
- 1 = weak
- 2 = relevant
- 3 = good
- 4 = excellent/direct match

Do not rank the products against each other. Judge each query-product pair independently. Do not infer missing attributes.

Each query-product pair must receive exactly 3 independent annotations. Use pseudonymous IDs such as `a01`, `a02`, and `a03`.

## Raw judgment format

Store one JSON object per annotation:

```json
{"queryId":"q001","query":"...","productId":"...","annotatorId":"a01","relevance":3}
```

Do not add names, email addresses, phone numbers, or other PII. Do not copy candidate scores or system names into the judgment file.

## Handoff to evaluator

After all three annotators have completed the task, save the raw judgments as:

`research/human-evaluation/judgments.jsonl`

Then run:

```bash
node backend/tests/human-evaluation.js
```

The evaluator will reject missing/invalid labels, duplicate annotator judgments, and incomplete three-annotator coverage.

## Important evidence boundary

The candidate-generation task is reproducible infrastructure. It is **not** a human result. Human agreement and human-validated retrieval metrics remain pending until real annotations are collected.