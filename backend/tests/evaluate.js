/**
 * ============================================================
 * DAY 10 — RUN EVALUATION
 * ============================================================
 *
 * Usage:
 *
 * node tests/evaluate.js
 *
 * Output:
 *
 * - Console metrics
 * - Per-query metrics
 * - JSON evaluation report
 *
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

const {
  evaluateDataset
} = require("../services/evaluation");

const testCases =
  require("./evaluation-cases");


/* ============================================================
   CONFIG
============================================================ */

const K_VALUES = [
  1,
  3,
  5,
  10
];


const OUTPUT_DIR =
  path.join(
    __dirname,
    "..",
    "evaluation-results"
  );


/* ============================================================
   DIRECTORY
============================================================ */

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(
    OUTPUT_DIR,
    {
      recursive: true
    }
  );
}


/* ============================================================
   EVALUATION
============================================================ */

const reports = {};


console.log("");
console.log(
  "============================================================"
);

console.log(
  "FASHION AI DISCOVERY — DAY 10 EVALUATION"
);

console.log(
  "============================================================"
);

console.log("");

console.log(
  `Evaluation queries: ${testCases.length}`
);

console.log(
  `K values: ${K_VALUES.join(", ")}`
);

console.log("");


/* ============================================================
   RUN EACH K
============================================================ */

K_VALUES.forEach((k) => {

  const report =
    evaluateDataset(
      testCases,
      k
    );

  reports[`k${k}`] =
    report;


  console.log(
    `-------------------- K=${k} --------------------`
  );

  console.log(
    `Precision@${k}: ${
      report.aggregate.precisionAtK
    }`
  );

  console.log(
    `Recall@${k}: ${
      report.aggregate.recallAtK
    }`
  );

  console.log(
    `F1@${k}: ${
      report.aggregate.f1AtK
    }`
  );

  console.log(
    `MRR@${k}: ${
      report.aggregate.mrrAtK
    }`
  );

  console.log(
    `NDCG@${k}: ${
      report.aggregate.ndcgAtK
    }`
  );

  console.log("");

});


/* ============================================================
   SAVE JSON
============================================================ */

const output = {

  evaluationVersion:
    "day-10-v1",

  generatedAt:
    new Date().toISOString(),

  dataset: {
    queryCount:
      testCases.length
  },

  kValues:
    K_VALUES,

  reports

};


const outputPath =
  path.join(
    OUTPUT_DIR,
    "evaluation-report.json"
  );


fs.writeFileSync(
  outputPath,
  JSON.stringify(
    output,
    null,
    2
  )
);


console.log(
  "============================================================"
);

console.log(
  "Evaluation completed successfully."
);

console.log(
  `Report saved to: ${outputPath}`
);

console.log(
  "============================================================"
);

console.log("");
