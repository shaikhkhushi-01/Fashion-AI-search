# Fashion AI Discovery

> AI-powered fashion discovery using hybrid retrieval, personalization, AI styling, evaluation, ablation studies, robustness testing, and reproducibility checks.

## Overview

Fashion AI Discovery is an AI-first fashion discovery platform designed to help users find relevant clothing through natural-language queries instead of relying only on traditional keyword search.

The system combines:

- semantic-style retrieval
- keyword matching
- fashion attribute matching
- budget awareness
- metadata relevance
- personalized ranking
- AI stylist recommendations
- research-oriented evaluation
- ablation experiments
- robustness testing
- reproducibility checks

The project is designed as a research-oriented prototype rather than a conventional ecommerce clone.

---

# Research Motivation

Traditional fashion search often depends heavily on exact keyword matching.

For example:

> "comfortable black outfit for college under 3000"

contains several different information signals:

- comfort
- color
- occasion
- style
- budget
- category

A useful fashion discovery system should understand these signals together.

This project therefore investigates a hybrid retrieval pipeline that combines multiple relevance signals instead of relying on a single ranking mechanism.

---

# System Architecture

```text
User Query
    |
    v
Query Normalization
    |
    v
Fashion Attribute Extraction
    |
    +--------------------+
    |                    |
    v                    v
Keyword Retrieval    Semantic Signal
    |                    |
    +---------+----------+
              |
              v
       Attribute Matching
              |
              v
        Budget Matching
              |
              v
       Metadata Relevance
              |
              v
       Hybrid Ranking
              |
              v
      Personalized Results
              |
              v
        AI Stylist Layer
