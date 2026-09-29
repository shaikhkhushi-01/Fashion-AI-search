# Human Relevance Evaluation

Use a 0–4 graded relevance scale: 0 irrelevant, 1 weak, 2 relevant, 3 good match, 4 excellent/direct match.

Protocol:
1. Use at least 3 independent annotators per query-product pair.
2. Randomize product order and hide system identity.
3. Store raw judgments as JSONL.
4. Compute inter-rater agreement before aggregation.
5. Aggregate graded relevance and evaluate MRR, NDCG@5 and MAP.
6. Keep human labels separate from the synthetic benchmark.

Record shape:
{"queryId":"q001","productId":"p123","annotatorId":"a01","relevance":4}

Do not commit personally identifying annotator information. The repository must never fabricate human labels.
