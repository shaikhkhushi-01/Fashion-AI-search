import fs from "fs";
import path from "path";
import {
  runAblationStudy,
  compareAblationResults
} from "../services/ablation.js";
import {
  products,
  evaluationCases
} from "./evaluation-cases.js";

const results = runAblationStudy(
  products,
  evaluationCases,
  5
);

const comparison = compareAblationResults(results);

const output = {
  experiment: "fashion-retrieval-ablation",
  k: 5,
  datasetSize: products.length,
  evaluationQueries: evaluationCases.length,
  configurations: results,
  comparison
};

const outputDirectory = path.resolve(
  "evaluation-results"
);

fs.mkdirSync(outputDirectory, {
  recursive: true
});

fs.writeFileSync(
  path.join(
    outputDirectory,
    "ablation-report.json"
  ),
  JSON.stringify(output, null, 2)
);

console.log(
  JSON.stringify(comparison, null, 2)
);
