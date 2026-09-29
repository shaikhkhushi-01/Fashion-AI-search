# Phase 5 Talk Track

## Opening
“My project studies whether fashion retrieval benefits from combining semantic understanding with precise lexical and attribute signals.”

## Problem
“Fashion queries are not always clean keywords. A user may describe colour, style, occasion, material and budget together. A retrieval system therefore needs both semantic flexibility and attribute precision.”

## Method
“I compare lexical and semantic retrieval with a hybrid pipeline. Candidate lists are fused, then attribute and budget signals participate in ranking. I evaluate the systems under a fixed benchmark protocol.”

## Evaluation
“The canonical benchmark contains 407 products and 250 queries, split into 200 validation queries and 50 held-out queries. I use MRR, NDCG@5 and MAP as primary metrics, with paired bootstrap confidence intervals.”

## Research Integrity
“I keep synthetic-curated labels separate from human judgments. Human evidence is not claimed until independent annotations are actually collected and agreement is measured.”

## Interpretation
“The important result is not simply a high retrieval score. The benchmark shows where lexical matching is already strong, where semantic retrieval adds a different signal, and why held-out and human evaluation are necessary before claiming generalization.”

## Future Work
“The next experiment is to collect blinded human relevance judgments, expand difficult compositional queries, and evaluate text-image retrieval once the catalogue has verified image assets.”

## Closing
“My goal is to turn a working fashion search system into a reproducible research platform where retrieval hypotheses can be tested under controlled and increasingly realistic evidence.”
