import { spawnSync } from "node:child_process";

const tests = [
  ["dataset", "Dataset quality"],
  ["query-understanding", "Query understanding"],
  ["semantic-test", "Semantic retrieval"],
  ["hybrid-test", "Hybrid retrieval"],
  ["train-ranker", "Learning-to-rank training"],
  ["ranker-inference", "Ranker inference"],
  ["personalization-test", "Personalization"],
  ["catalog-discovery-test", "Catalog discovery"],
  ["discovery-pagination-test", "Discovery pagination"],
  ["stylist-test", "AI Stylist"],
  ["explainability-test", "Explainability"],
  ["reproducibility-test", "Reproducibility unit"],
  ["reproducibility", "Reproducibility benchmark"],
  ["evaluation-test", "Evaluation metrics"],
  ["evaluate", "Evaluation benchmark"],
  ["robustness-test", "Robustness unit"],
  ["robustness", "Robustness benchmark"],
  ["ablation-test", "Ablation unit"],
  ["ablation", "Ablation benchmark"],
  ["semantic-client-test", "Semantic client"],
  ["hybrid-pipeline-test", "Hybrid pipeline"],
  ["ranker-pipeline-test", "Ranker pipeline"],
  ["personalization-v2-test", "Personalization V2"],
  ["image-retrieval-test", "Image retrieval"],
  ["visual-client-test", "Visual client"],
  ["multimodal-fusion-test", "Multimodal fusion"],
  ["explainability-v2-test", "Explainability V2"],
  ["dataset-split-test", "Dataset split"],
  ["baseline-test", "Baselines"],
  ["error-analysis-test", "Error analysis"],
  ["statistics-test", "Statistics"],
  ["research-report-test", "Research report"],
  ["performance-test", "Performance"],
  ["research-pipeline-test", "Research pipeline"],
  ["project-manifest-test", "Project manifest"],
  ["weight-tuning", "Hybrid weight tuning"]
];

const results = [];

for (const [script, label] of tests) {
  process.stdout.write(`\n=== ${label} ===\n`);

  const result = spawnSync(
    "npm",
    ["run", script],
    {
      stdio: "inherit",
      shell: false
    }
  );

  const passed = result.status === 0;

  results.push({
    script,
    label,
    passed
  });
}

const passed = results.filter(result => result.passed);
const failed = results.filter(result => !result.passed);

console.log("\n======================================");
console.log(" Fashion AI Research Test Summary");
console.log("======================================");

for (const result of results) {
  console.log(
    `${result.passed ? "PASS" : "FAIL"}  ${result.label}  (${result.script})`
  );
}

console.log("--------------------------------------");
console.log(`Passed: ${passed.length}`);
console.log(`Failed: ${failed.length}`);
console.log("======================================");

if (failed.length > 0) {
  console.log("\nFailed tests:");

  for (const result of failed) {
    console.log(`- ${result.label}: npm run ${result.script}`);
  }

  process.exit(1);
}

process.exit(0);
