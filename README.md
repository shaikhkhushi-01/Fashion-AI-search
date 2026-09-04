# Fashion AI Discovery

An AI-powered fashion discovery and recommendation system combining
semantic retrieval, keyword matching, attribute reasoning,
budget-aware ranking, personalization and explainable recommendations.

---

## Overview

Fashion search is often treated as a keyword-matching problem.

This project explores a more intelligent fashion discovery pipeline where
natural-language user queries are converted into structured retrieval
signals and ranked against a fashion catalogue.

The system combines:

- semantic similarity
- keyword relevance
- fashion attribute matching
- budget awareness
- metadata signals
- hybrid ranking
- personalization
- AI stylist recommendations
- evaluation metrics
- ablation experiments
- robustness testing
- reproducibility checks

The goal is not to build a full ecommerce clone.

The primary focus is the AI search and recommendation layer.

---

## Research Pipeline

```text
User Query
    |
    v
Query Understanding
    |
    v
Semantic Retrieval
    |
    +---- Keyword Retrieval
    |
    +---- Attribute Matching
    |
    +---- Budget Matching
    |
    +---- Metadata Signals
    |
    v
Hybrid Candidate Ranking
    |
    v
Personalization
    |
    v
AI Stylist / Explanation
    |
    v
Ranked Fashion Results
