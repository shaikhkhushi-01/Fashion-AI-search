"use strict";

/*
=========================================================
FASHION AI DISCOVERY
DAY 10 — REAL SEARCH EVALUATION RUNNER
=========================================================
*/

const fs = require("fs");
const path = require("path");

const {
  searchProducts
} = require("../services/aiSearch");

const {
  evaluateDataset
} = require("../services/evaluation");

const evaluationCases =
  require("./evaluation-cases");


/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

const productsPath =
  path.join(
    __dirname,
    "..",
    "..",
    "data",
    "products.json"
  );


if (!fs.existsSync(productsPath)) {
  throw new Error(
    `Products file not found: ${productsPath}`
  );
}


const products =
  JSON.parse(
    fs.readFileSync(
      productsPath,
      "utf8"
    )
  );


if (!Array.isArray(products)) {
  throw new Error(
    "products.json must contain an array."
  );
}


/*
=========================================================
CONFIGURATION
=========================================================
*/

const K_VALUES = [
  1,
  3,
  5,
  10
];


/*
=========================================================
RUN REAL SEARCH ENGINE
=========================================================

This directly calls the existing hybrid retrieval
engine from services/aiSearch.js.
=========================================================
*/

function retrieve(query) {

  return searchProducts(
    products,
    query,
    {
      limit: 10,
      minScore: 0
    }
  );
}


/*
=========================================================
RUN EVALUATION
=========================================================
*/

console.log("");
console.log(
  "=============================================="
);

console.log(
  "FASHION AI DISCOVERY — DAY 10 EVALUATION"
);

console.log(
  "=============================================="
);

console.log("");

console.log(
  `Products: ${products.length}`
);

console.log(
  `Queries: ${evaluationCases.length}`
);

console.log(
  `K values: ${K_VALUES.join(", ")}`
);

console.log("");


const report =
  evaluateDataset({
    cases:
      evaluationCases,

    retrieve,

    kValues:
      K_VALUES
  });


/*
=========================================================
PRINT OVERALL METRICS
=========================================================
*/

console.log(
  "----------------------------------------------"
);

console.log(
  "OVERALL METRICS"
);

console.log(
  "----------------------------------------------"
);


for (const k of K_VALUES) {

  const metrics =
    report.aggregate[`@${k}`];

  console.log("");

  console.log(
    `@${k}`
  );

  console.log(
    `Precision : ${metrics.precision}`
  );

  console.log(
    `Recall    : ${metrics.recall}`
  );

  console.log(
    `F1        : ${metrics.f1}`
  );

  console.log(
    `MRR       : ${metrics.mrr}`
  );

  console.log(
    `NDCG      : ${metrics.ndcg}`
  );
}


/*
=========================================================
PER-QUERY SUMMARY
=========================================================
*/

console.log("");

console.log(
  "----------------------------------------------"
);

console.log(
  "PER-QUERY RESULTS"
);

console.log(
  "----------------------------------------------"
);

console.log("");


for (
  const result
  of report.queries
) {

  const top5 =
    result.retrievedIds
      .slice(0, 5)
      .join(", ");

  console.log(
    `${result.query}`
  );

  console.log(
    `  Retrieved: ${top5}`
  );

  console.log(
    `  P@5: ${result.metrics["@5"].precision}`
  );

  console.log(
    `  R@5: ${result.metrics["@5"].recall}`
  );

  console.log(
    `  MRR@5: ${result.metrics["@5"].mrr}`
  );

  console.log(
    `  NDCG@5: ${result.metrics["@5"].ndcg}`
  );

  console.log("");
}


/*
=========================================================
CREATE OUTPUT DIRECTORY
=========================================================
*/

const outputDirectory =
  path.join(
    __dirname,
    "..",
    "evaluation-results"
  );


fs.mkdirSync(
  outputDirectory,
  {
    recursive: true
  }
);


/*
=========================================================
FINAL REPORT
=========================================================
*/

const finalReport = {

  project:
    "Fashion AI Discovery",

  evaluation:
    "Day 10 — Hybrid Retrieval Evaluation",

  timestamp:
    new Date().toISOString(),

  dataset: {

    totalProducts:
      products.length,

    totalQueries:
      evaluationCases.length
  },

  methodology: {

    retrieval:
      "Hybrid semantic + keyword + attribute + budget + metadata",

    relevanceScale: {

      3:
        "Highly relevant",

      2:
        "Relevant",

      1:
        "Weakly relevant",

      0:
        "Irrelevant"
    },

    metrics: [
      "Precision@K",
      "Recall@K",
      "F1@K",
      "MRR@K",
      "NDCG@K"
    ],

    kValues:
      K_VALUES
  },

  aggregate:
    report.aggregate,

  queries:
    report.queries
};


/*
=========================================================
SAVE REPORT
=========================================================
*/

const outputPath =
  path.join(
    outputDirectory,
    "evaluation-report.json"
  );


fs.writeFileSync(
  outputPath,
  JSON.stringify(
    finalReport,
    null,
    2
  ),
  "utf8"
);


console.log(
  "=============================================="
);

console.log(
  "EVALUATION COMPLETE"
);

console.log(
  "=============================================="
);

console.log("");

console.log(
  `Report saved to: ${outputPath}`
);

console.log("");
