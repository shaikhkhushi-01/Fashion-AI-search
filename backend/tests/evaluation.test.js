import assert from "assert";
import {
  precisionAtK,
  recallAtK,
  f1AtK,
  reciprocalRank,
  ndcgAtK,
  evaluateQuery,
  evaluateDataset
} from "../services/evaluation.js";

const predicted = ["1", "2", "3", "4", "5"];
const relevant = ["1", "3"];

assert.strictEqual(precisionAtK(predicted, relevant, 5), 0.4);
assert.strictEqual(recallAtK(predicted, relevant, 5), 1);
assert.strictEqual(
  Number(f1AtK(predicted, relevant, 5).toFixed(6)),
  0.571429
);
assert.strictEqual(reciprocalRank(predicted, relevant), 1);

const relevance = {
  "1": 3,
  "2": 0,
  "3": 2,
  "4": 0,
  "5": 0
};

const ndcg = ndcgAtK(predicted, relevance, 5);

assert(ndcg > 0);
assert(ndcg <= 1);

const queryResult = evaluateQuery(
  predicted,
  relevant,
  relevance,
  5
);

assert(queryResult.precisionAtK >= 0);
assert(queryResult.recallAtK >= 0);
assert(queryResult.f1AtK >= 0);
assert(queryResult.ndcgAtK >= 0);

const dataset = [
  {
    query: "test",
    relevant: ["1"],
    relevance: {
      "1": 3,
      "2": 0
    }
  }
];

const evaluation = evaluateDataset(
  dataset,
  () => ["1", "2"],
  {
    k: 2
  }
);

assert.strictEqual(evaluation.queries.length, 1);
assert.strictEqual(evaluation.metrics.precisionAtK, 0.5);
assert.strictEqual(evaluation.metrics.recallAtK, 1);

console.log("Evaluation metrics test passed");
