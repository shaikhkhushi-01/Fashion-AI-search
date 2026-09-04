"use strict";

/*
=========================================================
FASHION AI DISCOVERY
DAY 11 — BASELINE + ABLATION ENGINE
=========================================================

Experiments:

1. Keyword Only
2. Semantic Only
3. Attribute Only
4. Hybrid Without Budget
5. Full Hybrid

All systems use the SAME evaluation benchmark.

This makes comparison scientifically fair.
=========================================================
*/

const {
  tokenize,
  keywordScore,
  attributeScore,
  budgetScore,
  metadataScore,
  calculateHybridScore
} = require("./aiSearch");


/*
=========================================================
UTILITY
=========================================================
*/

function clamp(value) {
  return Math.max(
    0,
    Math.min(1, Number(value) || 0)
  );
}


function round(value, digits = 4) {
  return Number(
    Number(value).toFixed(digits)
  );
}


/*
=========================================================
SEMANTIC SCORE
=========================================================

Uses the same semantic fields supported by the
existing retrieval engine.

If no real semantic score exists,
the existing engine's conservative fallback
is used.
=========================================================
*/

function semanticScore(
  query,
  product
) {
  const possibleScores = [
    product.semanticScore,
    product.semantic_similarity,
    product.similarity,
    product.embeddingScore,
    product.vectorScore
  ];

  for (const value of possibleScores) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      if (number > 1) {
        return clamp(
          number / 100
        );
      }

      return clamp(number);
    }
  }

  /*
  Fallback mirrors the current retrieval engine.
  */

  return clamp(
    keywordScore(
      tokenize(query),
      product
    ) * 0.75
  );
}


/*
=========================================================
KEYWORD BASELINE
=========================================================
*/

function keywordOnlyScore(
  query,
  product
) {
  return keywordScore(
    tokenize(query),
    product
  );
}


/*
=========================================================
ATTRIBUTE BASELINE
=========================================================
*/

function attributeOnlyScore(
  query,
  product
) {
  return attributeScore(
    query,
    product
  );
}


/*
=========================================================
SEMANTIC BASELINE
=========================================================
*/

function semanticOnlyScore(
  query,
  product
) {
  return semanticScore(
    query,
    product
  );
}


/*
=========================================================
HYBRID WITHOUT BUDGET
=========================================================

Removes budget component.

Original:

semantic      45%
keyword       20%
attributes    20%
budget        10%
metadata       5%

Redistribution:

semantic      50%
keyword       22%
attributes    22%
metadata       6%

Weights sum to 100%.
=========================================================
*/

function hybridWithoutBudgetScore(
  query,
  product
) {
  const semantic =
    semanticScore(
      query,
      product
    );

  const keyword =
    keywordOnlyScore(
      query,
      product
    );

  const attributes =
    attributeOnlyScore(
      query,
      product
    );

  const metadata =
    metadataScore(
      product
    );

  const finalScore =
    semantic * 0.50 +
    keyword * 0.22 +
    attributes * 0.22 +
    metadata * 0.06;

  return clamp(
    finalScore
  );
}


/*
=========================================================
FULL HYBRID
=========================================================

Uses the exact existing hybrid engine score.
=========================================================
*/

function fullHybridScore(
  query,
  product
) {
  return calculateHybridScore(
    query,
    product
  ).finalScore;
}


/*
=========================================================
EXPERIMENT DEFINITIONS
=========================================================
*/

const EXPERIMENTS = {

  keyword_only: {
    name:
      "Keyword Only",

    description:
      "Lexical keyword matching without semantic or attribute ranking.",

    score:
      keywordOnlyScore
  },

  semantic_only: {
    name:
      "Semantic Only",

    description:
      "Semantic similarity without keyword, attribute, budget or metadata signals.",

    score:
      semanticOnlyScore
  },

  attribute_only: {
    name:
      "Attribute Only",

    description:
      "Fashion attribute matching without semantic or keyword ranking.",

    score:
      attributeOnlyScore
  },

  hybrid_without_budget: {
    name:
      "Hybrid Without Budget",

    description:
      "Hybrid retrieval with the budget signal removed.",

    score:
      hybridWithoutBudgetScore
  },

  full_hybrid: {
    name:
      "Full Hybrid",

    description:
      "Complete hybrid retrieval using semantic, keyword, attribute, budget and metadata signals.",

    score:
      fullHybridScore
  }
};


/*
=========================================================
GENERIC RETRIEVAL
=========================================================
*/

function retrieveWithExperiment(
  products,
  query,
  experimentKey,
  options = {}
) {
  if (!Array.isArray(products)) {
    return [];
  }

  const experiment =
    EXPERIMENTS[
      experimentKey
    ];

  if (!experiment) {
    throw new Error(
      `Unknown experiment: ${experimentKey}`
    );
  }

  const limit =
    Math.max(
      1,
      Number(
        options.limit || 10
      )
    );

  const minScore =
    Number.isFinite(
      Number(options.minScore)
    )
      ? Number(options.minScore)
      : 0;

  return products
    .map((product) => {

      const score =
        clamp(
          experiment.score(
            query,
            product
          )
        );

      return {
        ...product,

        experimentScore:
          round(score),

        matchScore:
          Math.round(
            score * 100
          )
      };
    })

    .filter(
      (product) =>
        product.experimentScore >=
        minScore
    )

    .sort(
      (a, b) =>
        b.experimentScore -
        a.experimentScore
    )

    .slice(
      0,
      limit
    );
}


/*
=========================================================
RUN ALL EXPERIMENTS
=========================================================
*/

function runAllExperiments(
  products,
  query,
  options = {}
) {
  const results = {};

  for (
    const experimentKey
    of Object.keys(EXPERIMENTS)
  ) {
    results[experimentKey] =
      retrieveWithExperiment(
        products,
        query,
        experimentKey,
        options
      );
  }

  return results;
}


/*
=========================================================
EXPERIMENT SUMMARY
=========================================================
*/

function describeExperiments() {
  return Object.entries(
    EXPERIMENTS
  ).map(
    ([key, value]) => ({
      key,
      name: value.name,
      description:
        value.description
    })
  );
}


/*
=========================================================
EXPORTS
=========================================================
*/

module.exports = {
  EXPERIMENTS,
  semanticScore,
  keywordOnlyScore,
  attributeOnlyScore,
  semanticOnlyScore,
  hybridWithoutBudgetScore,
  fullHybridScore,
  retrieveWithExperiment,
  runAllExperiments,
  describeExperiments
};
