/*
=========================================================
FASHION AI DISCOVERY
DAY 11 — ABLATION STUDY RUNNER
=========================================================
*/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  retrieveWithExperiment,
  describeExperiments
} from "../services/ablation.js";

import {
  evaluateDataset
} from "../services/evaluation.js";

import evaluationCases from "./evaluation-cases.js";


/*
=========================================================
ES MODULE PATH SETUP
=========================================================
*/

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


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
CONFIG
=========================================================
*/

const K_VALUES = [
  1,
  3,
  5,
  10
];

const LIMIT = 10;


/*
=========================================================
RUN ONE EXPERIMENT
=========================================================
*/

function evaluateExperiment(
  experimentKey
) {
  return evaluateDataset({

    cases:
      evaluationCases,

    retrieve:
      (query) =>
        retrieveWithExperiment(
          products,
          query,
          experimentKey,
          {
            limit:
              LIMIT,

            minScore:
              0
          }
        ),

    kValues:
      K_VALUES
  });
}


/*
=========================================================
MAIN
=========================================================
*/

console.log("");

console.log(
  "=================================================="
);

console.log(
  "FASHION AI DISCOVERY — DAY 11 ABLATION STUDY"
);

console.log(
  "=================================================="
);

console.log("");

console.log(
  `Products : ${products.length}`
);

console.log(
  `Queries  : ${evaluationCases.length}`
);

console.log(
  `K values : ${K_VALUES.join(", ")}`
);

console.log("");


const experimentDefinitions =
  describeExperiments();


const experiments = {};


for (
  const experiment
  of experimentDefinitions
) {

  console.log(
    `Running: ${experiment.name}`
  );

  experiments[
    experiment.key
  ] =
    evaluateExperiment(
      experiment.key
    );
}


console.log("");

console.log(
  "=================================================="
);

console.log(
  "COMPARISON"
);

console.log(
  "=================================================="
);

console.log("");


/*
=========================================================
PRINT COMPARISON TABLE
=========================================================
*/

for (
  const experiment
  of experimentDefinitions
) {

  const result =
    experiments[
      experiment.key
    ];

  console.log(
    `\n${experiment.name}`
  );

  console.log(
    `  P@5   : ${result.aggregate["@5"].precision}`
  );

  console.log(
    `  R@5   : ${result.aggregate["@5"].recall}`
  );

  console.log(
    `  F1@5  : ${result.aggregate["@5"].f1}`
  );

  console.log(
    `  MRR@5 : ${result.aggregate["@5"].mrr}`
  );

  console.log(
    `  NDCG@5: ${result.aggregate["@5"].ndcg}`
  );
}


/*
=========================================================
FIND BEST SYSTEM
=========================================================
*/

function findBestExperiment(
  metric
) {
  let best = null;

  for (
    const experiment
    of experimentDefinitions
  ) {

    const value =
      experiments[
        experiment.key
      ]
        .aggregate["@5"]
        [metric];

    if (
      !best ||
      value > best.value
    ) {
      best = {

        key:
          experiment.key,

        name:
          experiment.name,

        value
      };
    }
  }

  return best;
}


const bestByMetric = {

  precision:
    findBestExperiment(
      "precision"
    ),

  recall:
    findBestExperiment(
      "recall"
    ),

  f1:
    findBestExperiment(
      "f1"
    ),

  mrr:
    findBestExperiment(
      "mrr"
    ),

  ndcg:
    findBestExperiment(
      "ndcg"
    )
};


/*
=========================================================
FULL REPORT
=========================================================
*/

const report = {

  project:
    "Fashion AI Discovery",

  study:
    "Day 11 — Baseline and Ablation Study",

  timestamp:
    new Date().toISOString(),

  dataset: {

    totalProducts:
      products.length,

    totalQueries:
      evaluationCases.length
  },

  methodology: {

    rankingLimit:
      LIMIT,

    kValues:
      K_VALUES,

    relevanceScale: {

      3:
        "Highly relevant",

      2:
        "Relevant",

      1:
        "Weakly relevant",

      0:
        "Irrelevant"
    }
  },

  experiments:
    experimentDefinitions.map(
      (experiment) => ({

        key:
          experiment.key,

        name:
          experiment.name,

        description:
          experiment.description,

        aggregate:
          experiments[
            experiment.key
          ].aggregate
      })
    ),

  bestSystems:
    bestByMetric,

  detailedResults:
    Object.fromEntries(
      Object.entries(
        experiments
      ).map(
        ([key, value]) => [
          key,
          value.queries
        ]
      )
    )
};


/*
=========================================================
SAVE OUTPUT
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


const outputPath =
  path.join(
    outputDirectory,
    "day11-ablation-report.json"
  );


fs.writeFileSync(
  outputPath,
  JSON.stringify(
    report,
    null,
    2
  ),
  "utf8"
);


/*
=========================================================
FINAL OUTPUT
=========================================================
*/

console.log("");

console.log(
  "=================================================="
);

console.log(
  "DAY 11 COMPLETE"
);

console.log(
  "=================================================="
);

console.log("");

console.log(
  `Report saved to: ${outputPath}`
);

console.log("");

console.log(
  "Best systems at @5:"
);

console.log(
  `Precision : ${bestByMetric.precision.name}`
);

console.log(
  `Recall    : ${bestByMetric.recall.name}`
);

console.log(
  `F1        : ${bestByMetric.f1.name}`
);

console.log(
  `MRR       : ${bestByMetric.mrr.name}`
);

console.log(
  `NDCG      : ${bestByMetric.ndcg.name}`
);

console.log("");
