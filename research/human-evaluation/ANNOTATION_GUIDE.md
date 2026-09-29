# Human Annotation Guide — Fashion AI

## Goal
Judge how relevant the product is to the query, not which retrieval system produced it.

## Scale
- 0 — Irrelevant: does not satisfy the request.
- 1 — Weak: related product/category, but misses important constraints.
- 2 — Relevant: generally satisfies the request with some mismatch or missing detail.
- 3 — Good: satisfies the main intent and most constraints.
- 4 — Excellent: direct, highly suitable match with the requested attributes, occasion, style and budget.

## Rules
1. Judge each query-product pair independently.
2. Treat explicit constraints such as category, colour, material, occasion and budget as important.
3. Do not infer unavailable attributes.
4. If a query is ambiguous, use its ordinary fashion-shopping interpretation consistently.
5. Do not compare products against each other.
6. Do not change scores to improve system results.
7. Do not expose system/model names or ranking scores.

## Quality control
At least 3 independent annotations are required for every evaluated query-product pair. Keep raw judgments unchanged. Agreement is computed before aggregation.

## Privacy
Use pseudonymous IDs such as a01. Do not commit names, emails, phone numbers or other personal information.
