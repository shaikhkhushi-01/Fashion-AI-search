/*
=========================================================
FASHION AI DISCOVERY
DAY 1 - EVALUATION RUNNER
=========================================================
*/

import {
  searchProducts
} from "../services/aiSearch.js";

import {
  evaluateQuery,
  aggregateMetrics
} from "../services/evaluation.js";

import {
  evaluationCases
} from "./evaluation-cases.js";

console.log(
  "\n=========================================="
);

console.log(
  "FASHION AI - BASELINE EVALUATION"
);

console.log(
  "==========================================\n"
);

const evaluations = [];

for (
  const testCase of
  evaluationCases
) {

  const search =
    searchProducts(
      testCase.query,
      {
        limit: 5
      }
    );

  const metrics =
    evaluateQuery(
      search.results,
      testCase
    );

  evaluations.push(
    metrics
  );

  const top =
    search.results[0];

  console.log(
    `${testCase.id} | ${testCase.query}`
  );

  console.log(
    `Top result: ${
      top
        ? `${top.name} (${top.matchScore}%)`
        : "None"
    }`
  );

  console.log(
    `P@5: ${metrics.precisionAt5}`
  );

  console.log(
    `R@5: ${metrics.recallAt5}`
  );

  console.log(
    `Hit@5: ${metrics.hitAt5}`
  );

  console.log(
    `RR: ${metrics.reciprocalRank}`
  );

  console.log(
    "------------------------------------------"
  );
}

const finalMetrics =
  aggregateMetrics(
    evaluations
  );

console.log(
  "\n=========================================="
);

console.log(
  "AGGREGATE RESULTS"
);

console.log(
  "=========================================="
);

console.table(
  finalMetrics
);

console.log(
  "\nBaseline evaluation completed.\n"
);
