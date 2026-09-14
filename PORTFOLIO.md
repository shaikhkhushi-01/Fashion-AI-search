# Fashion AI Discovery

## One-Line Summary

Fashion AI Discovery is an AI-first fashion search and recommendation system that studies how semantic retrieval, lexical relevance, attribute matching, ranking and personalization can work together for natural-language fashion discovery.

## Problem

Traditional fashion search often depends heavily on exact keywords and catalogue metadata. Users, however, describe what they want in natural language, such as a black formal shirt for office wear under a specific budget.

The project investigates whether a retrieval pipeline can better handle these queries by combining multiple signals instead of relying on a single search strategy.

## Research Question

Can combining semantic, lexical, attribute and personalized signals improve fashion retrieval compared with conventional keyword-based search?

## Research Hypothesis

Combining complementary retrieval signals should provide more robust ranking behavior than relying on one retrieval strategy alone.

## Dataset

The current benchmark contains:

- 1,000 deterministically generated fashion products
- 250 natural-language evaluation queries
- Relevance annotations for evaluation
- Multiple product categories, genders, colors, materials, styles and occasions
- A validation split of 200 queries
- A held-out test split of 50 queries

The dataset is a controlled synthetic benchmark for reproducible experimentation. It is not presented as a substitute for a large human-judged fashion benchmark.

## Method

The system follows an end-to-end retrieval and recommendation pipeline:

Query Understanding
→ Semantic Retrieval
→ Lexical Retrieval
→ Attribute Matching
→ Candidate Fusion
→ Learning-to-Rank
→ Personalization
→ Explainability
→ Evaluation

### Semantic Retrieval

Product and query text are represented using `Xenova/all-MiniLM-L6-v2` through Transformers.js. Mean-pooled normalized embeddings are compared using cosine similarity.

### Hybrid Retrieval

The production retrieval configuration combines:

- Semantic similarity: 0.45
- Lexical relevance: 0.20
- Attribute matching: 0.20
- Budget matching: 0.10
- Metadata quality: 0.05

Semantic and lexical candidate lists are combined using Reciprocal Rank Fusion before final reranking. Budget constraints are applied before candidate fusion.

### Learning-to-Rank

The project includes a pairwise logistic ranking model using semantic, lexical, attribute, budget, metadata and fusion signals as ranking features.

The ranking experiment uses leave-one-query-out cross-validation and reports Precision@5, MRR, NDCG@5 and pairwise accuracy.

## Baselines

The evaluation compares keyword, category, price, popularity, lexical, attribute, semantic and hybrid retrieval strategies.

The strongest baselines on the current curated benchmark are lexical and category-based retrieval.

## Main Results

| System | Precision@5 | Recall@5 | F1@5 | MRR | NDCG@5 | MAP |
|---|---:|---:|---:|---:|---:|---:|
| Keyword | 0.9128 | 0.3803 | 0.5369 | 0.9531 | 0.9137 | 0.7314 |
| Category | 0.9504 | 0.3960 | 0.5591 | 0.9672 | 0.9548 | 0.7518 |
| Lexical | 0.9104 | 0.3793 | 0.5355 | 1.0000 | 0.9728 | 0.7416 |
| Semantic | 0.7064 | 0.2943 | 0.4155 | 0.8723 | 0.7947 | 0.5569 |
| Hybrid | 0.7384 | 0.3077 | 0.4344 | 0.8540 | 0.8710 | 0.5508 |

The hybrid system improves NDCG@5 relative to semantic retrieval, but does not outperform the strongest lexical and category baselines on the aggregate benchmark.

## Statistical Evidence

Paired evaluation queries were used with 2,000 bootstrap iterations and 95% confidence intervals.

For hybrid versus semantic retrieval, the NDCG@5 difference was +0.0763 with a 95% confidence interval of [0.0282, 0.1259]. The interval excludes zero, supporting an improvement in this metric on the current benchmark.

For hybrid versus keyword retrieval, the NDCG@5 difference was -0.0427 with a 95% confidence interval of [-0.0822, -0.0014]. The current benchmark therefore does not support a claim that hybrid retrieval is better than keyword retrieval.

## Ablation

The ablation study shows that lexical retrieval is highly competitive on the current benchmark. The full hybrid configuration improves over semantic-only retrieval in NDCG@5 but does not exceed lexical-only retrieval.

This result is important because it prevents the project from making an unsupported claim of universal hybrid superiority.

## Weight Tuning

A controlled search evaluated 28 hybrid configurations using a 200-query validation split and a 50-query held-out test split.

The best validation configuration produced a small improvement, but the held-out results were unchanged:

| Metric | Production | Tuned |
|---|---:|---:|
| Precision@5 | 0.896 | 0.896 |
| MRR | 0.980 | 0.980 |
| NDCG@5 | 0.9509 | 0.9509 |

The tuned weights were therefore not promoted to production.

## Robustness and Reproducibility

The robustness suite contains 15 edge-case tests with 15 successful cases and 0 failures.

The research pipeline records dataset size, evaluation configuration, deterministic execution status, dataset hash, experiment fingerprint, runtime environment and generated research artifacts.

The current dataset hash is `564b0d515265c5c22baac085098dd3bb397ece49b4d97fa50a5b058a537a621`.

## What I Learned

The main lesson from the project is that adding more AI signals does not automatically improve retrieval quality. Strong baselines, controlled experiments, held-out evaluation and honest negative results are necessary before claiming an improvement.

The project also demonstrates how an applied AI system can be structured as a research experiment rather than only as a product prototype.

## Limitations

- The dataset is synthetic and curated.
- Relevance labels are generated rather than collected from large-scale human judgments.
- The benchmark contains 250 evaluation queries.
- The embedding model is lightweight.
- Online user interaction data is not available.
- Personalization is not validated on a large real-world user dataset.
- Multimodal retrieval components are an experimental foundation rather than a large-scale validated result.

## Future Work

The next research direction is to evaluate the system on larger public fashion datasets with human relevance judgments and investigate stronger domain-specific embeddings, vision-language retrieval, multimodal query-image fusion, user-level ranking, cold-start personalization, calibration and online A/B evaluation.

## Technical Stack

Node.js · Express · Transformers.js · Hugging Face Transformers · JavaScript · Python · Matplotlib · GitHub Actions · GitHub Pages · Render

## Live System

Frontend: https://shaikhkhushi-01.github.io/Fashion-AI-search/

Backend API: https://fashion-ai-search-lj6s.onrender.com

## Portfolio Story

Problem → Research Question → Dataset → Method → Baselines → Experiments → Results → Limitations → Future Work

This is the recommended structure for presenting the project in a research-focused portfolio, interview or graduate-school application.
