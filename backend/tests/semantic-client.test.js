import assert from "assert";
import {
  buildSemanticScoreMap,
  extractSemanticResults
} from "../services/semanticClient.js";

const payload = {
  results: [
    {
      id: 1,
      score: 0.92
    },
    {
      product_id: 2,
      similarity: 0.71
    },
    {
      id: 3,
      semanticScore: 1.4
    }
  ]
};

const results =
  extractSemanticResults(payload);

assert.strictEqual(
  results.length,
  3
);

const map =
  buildSemanticScoreMap(payload);

assert.strictEqual(
  map.get("1"),
  0.92
);

assert.strictEqual(
  map.get("2"),
  0.71
);

assert.strictEqual(
  map.get("3"),
  1
);

console.log(
  "Semantic client tests passed"
);
