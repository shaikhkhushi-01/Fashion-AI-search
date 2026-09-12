import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hybridRetrieve } from "../services/hybridRetrieval.js";
import { evaluationCases } from "./evaluation-cases.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, "..");

const productsPath = path.join(backendDir, "data", "products.json");
const outputDir = path.join(backendDir, "evaluation-results");
const outputPath = path.join(outputDir, "hybrid-weight-tuning-report.json");

const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

const baselineWeights = {
  semantic: 0.45,
  lexical: 0.2,
  attribute: 0.2,
  budget: 0.1,
  metadata: 0.05
};

const testCases = evaluationCases.filter((_, index) => index % 5 === 0);
const validationCases = evaluationCases.filter((_, index) => index % 5 !== 0);

const clamp = value => Math.max(0, Math.min(1, value));

const normalizeWeights = weights => {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return { ...baselineWeights };
  }

  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [
      key,
      value / total
    ])
  );
};

const generateCandidates = () => {
  const candidates = [];
  const deltas = [-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15];

  candidates.push(normalizeWeights(baselineWeights));

  for (const signal of Object.keys(baselineWeights)) {
    for (const delta of deltas) {
      if (delta === 0) {
        continue;
      }

      candidates.push(
        normalizeWeights({
          ...baselineWeights,
          [signal]: clamp(baselineWeights[signal] + delta)
        })
      );
    }
  }

  return candidates.filter(
    (weights, index, array) =>
      index ===
      array.findIndex(
        candidate =>
          JSON.stringify(candidate) === JSON.stringify(weights)
      )
  );
};

const dcg = values =>
  values.reduce(
    (sum, value, index) =>
      sum + ((2 ** value) - 1) / Math.log2(index + 2),
    0
  );

const ndcgAt5 = (rankedIds, relevance) => {
  const actual = rankedIds
    .slice(0, 5)
    .map(id => Number(relevance[String(id)] || 0));

  const ideal = Object.values(relevance)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 5);

  const idealDcg = dcg(ideal);

  if (idealDcg === 0) {
    return 0;
  }

  return dcg(actual) / idealDcg;
};

const mrr = (rankedIds, relevant) => {
  const relevantSet = new Set(relevant.map(Number));

  for (let index = 0; index < rankedIds.length; index += 1) {
    if (relevantSet.has(Number(rankedIds[index]))) {
      return 1 / (index + 1);
    }
  }

  return 0;
};

const precisionAt5 = (rankedIds, relevant) => {
  const relevantSet = new Set(relevant.map(Number));
  const hits = rankedIds
    .slice(0, 5)
    .filter(id => relevantSet.has(Number(id))).length;

  return hits / 5;
};

const evaluateWeights = async (weights, cases) => {
  let precision = 0;
  let reciprocalRank = 0;
  let ndcg = 0;

  for (const evaluationCase of cases) {
    const results = await hybridRetrieve(
      evaluationCase.query,
      products,
      {
        limit: 20,
        weights
      }
    );

    const rankedIds = results.map(product => Number(product.id));

    precision += precisionAt5(
      rankedIds,
      evaluationCase.relevant
    );

    reciprocalRank += mrr(
      rankedIds,
      evaluationCase.relevant
    );

    ndcg += ndcgAt5(
      rankedIds,
      evaluationCase.relevance
    );
  }

  const count = cases.length;

  return {
    precisionAt5: precision / count,
    mrr: reciprocalRank / count,
    ndcgAt5: ndcg / count
  };
};

const candidates = generateCandidates();

console.log(`Products: ${products.length}`);
console.log(`Evaluation cases: ${evaluationCases.length}`);
console.log(`Validation cases: ${validationCases.length}`);
console.log(`Held-out test cases: ${testCases.length}`);
console.log(`Weight configurations: ${candidates.length}`);

let best = null;
const validationResults = [];

for (let index = 0; index < candidates.length; index += 1) {
  const weights = candidates[index];

  console.log(
    `\nConfiguration ${index + 1}/${candidates.length}`
  );

  const metrics = await evaluateWeights(
    weights,
    validationCases
  );

  const result = {
    weights,
    ...metrics
  };

  validationResults.push(result);

  const score =
    metrics.ndcgAt5 * 0.5 +
    metrics.mrr * 0.3 +
    metrics.precisionAt5 * 0.2;

  if (
    !best ||
    score > best.selectionScore
  ) {
    best = {
      ...result,
      selectionScore: score
    };
  }

  console.log(
    `NDCG@5=${metrics.ndcgAt5.toFixed(4)} MRR=${metrics.mrr.toFixed(4)} Precision@5=${metrics.precisionAt5.toFixed(4)}`
  );
}

console.log("\nBest validation configuration:");
console.log(JSON.stringify(best, null, 2));

const baselineValidation = await evaluateWeights(
  baselineWeights,
  validationCases
);

const baselineTest = await evaluateWeights(
  baselineWeights,
  testCases
);

const tunedTest = await evaluateWeights(
  best.weights,
  testCases
);

const report = {
  experiment: "hybrid-weight-tuning",
  methodology: {
    totalEvaluationCases: evaluationCases.length,
    validationCases: validationCases.length,
    heldOutTestCases: testCases.length,
    splitMethod: "deterministic index modulo 5",
    validationRule: "four cases validation for every one held-out test case",
    selectionObjective: "0.5*NDCG@5 + 0.3*MRR + 0.2*Precision@5",
    weightSearchMethod: "deterministic local perturbation around production baseline",
    productionBaselineWeights: baselineWeights
  },
  datasetSize: products.length,
  configurationsEvaluated: candidates.length,
  bestValidationConfiguration: best,
  baselineValidation,
  heldOutComparison: {
    baseline: {
      weights: baselineWeights,
      metrics: baselineTest
    },
    tuned: {
      weights: best.weights,
      metrics: tunedTest
    },
    delta: {
      precisionAt5:
        tunedTest.precisionAt5 -
        baselineTest.precisionAt5,
      mrr:
        tunedTest.mrr -
        baselineTest.mrr,
      ndcgAt5:
        tunedTest.ndcgAt5 -
        baselineTest.ndcgAt5
    }
  },
  validationResults
};

fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(
  outputPath,
  JSON.stringify(report, null, 2)
);

console.log(`\nReport written to ${outputPath}`);

if (
  !Number.isFinite(tunedTest.ndcgAt5) ||
  !Number.isFinite(tunedTest.mrr) ||
  !Number.isFinite(tunedTest.precisionAt5)
) {
  process.exit(1);
}

process.exit(0);
