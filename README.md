# Fashion AI Discovery

Fashion AI Discovery is an AI-oriented fashion search and recommendation system designed around natural-language product discovery.

## Research Question

Can combining semantic, lexical, attribute and personalized signals improve fashion retrieval compared with conventional keyword-based search?

## System Architecture

User Query
→ Query Understanding
→ Semantic Retrieval
→ Lexical Retrieval
→ Attribute Matching
→ Candidate Fusion
→ Learning-to-Rank
→ Personalization
→ Explainability
→ Evaluation

## Core Components

- Natural-language fashion query understanding
- Embedding-based semantic retrieval
- Lexical retrieval
- Attribute-aware retrieval
- Hybrid candidate fusion
- Learning-to-rank experimentation
- Personalized recommendations
- AI Stylist
- Explainable recommendations
- Multimodal retrieval infrastructure
- Baseline comparison
- Ablation experiments
- Error analysis
- Statistical analysis
- Dataset splitting
- Reproducibility
- Performance benchmarking

## Semantic Retrieval

Semantic retrieval uses the `Xenova/all-MiniLM-L6-v2` transformer encoder through Transformers.js.

Product and query representations are converted into normalized embeddings and compared using cosine similarity.

The deployed backend performs semantic retrieval directly in Node.js.

## Evaluation

The evaluation framework supports:

- Precision@K
- Recall@K
- F1@K
- MRR
- NDCG@K
- Average Precision
- Bootstrap confidence intervals
- Baseline comparison
- Ablation experiments
- Error analysis
- Statistical comparison

### Current Evaluation Results

On the project's curated evaluation set:

| Retrieval System | MRR | NDCG@5 |
|---|---:|---:|
| Lexical | 0.9593 | 0.9311 |
| Semantic | 0.9390 | 0.9207 |
| Hybrid | 0.9878 | 0.9745 |

The current results indicate that combining retrieval signals improves ranking quality on the project's evaluation queries compared with the individual lexical and semantic retrieval configurations.

These results are project-level experimental measurements and should not be interpreted as performance on a large-scale public fashion-search benchmark.

## Research Methodology

The system is evaluated against simpler retrieval strategies and progressively stronger retrieval configurations.

Experiments cover:

- Retrieval quality
- Baseline comparison
- Ablation analysis
- Personalization
- Robustness
- Reproducibility
- Computational performance
- Error analysis

Statistical analysis uses paired evaluation queries and bootstrap confidence intervals with 2,000 bootstrap iterations.

## Reproducibility

The project includes:

- Deterministic dataset splitting
- Experiment configuration
- Evaluation scripts
- Statistical analysis
- Research report generation
- Project file hashing
- Automated research-quality testing through GitHub Actions

## Backend

The Node.js backend provides:

- Query understanding
- Semantic retrieval
- Lexical retrieval
- Hybrid retrieval
- Ranking
- Personalization
- Evaluation
- Research utilities

Transformers.js is used for transformer-based embedding inference.

## Frontend

The frontend provides:

- Natural-language search
- AI relevance indicators
- Product discovery
- Advanced filters
- Personalized recommendations
- AI Stylist
- Recommendation explanations

## Research Limitations

The current system is a research prototype rather than a production-scale fashion search engine.

The current catalogue and evaluation set are relatively small and curated. Therefore, the reported metrics demonstrate the behaviour of the implemented retrieval systems on the project's evaluation data, but do not establish generalization to large commercial catalogues or real-world user traffic.

Future experiments should use larger and independently constructed datasets with stronger leakage controls and broader query coverage.

## Research Direction

Future work can investigate:

- Larger fashion datasets
- Stronger transformer encoders
- Vision-language models
- Learned multimodal fusion
- User-level ranking models
- Larger-scale retrieval benchmarks
- Online evaluation
- Human relevance judgments
- Cold-start personalization

## Links

Live application:

https://shaikhkhushi-01.github.io/Fashion-AI-search/

Repository:

https://github.com/shaikhkhushi-01/Fashion-AI-search
