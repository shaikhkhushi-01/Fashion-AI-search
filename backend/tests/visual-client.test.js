import assert from "assert";
import {
  extractVisualResults,
  buildVisualScoreMap
} from "../services/visualClient.js";

const payload = {
  results: [
    {
      id: 1,
      score: 0.91
    },
    {
      product_id: 2,
      similarity: 0.72
    }
  ]
};

const results =
  extractVisualResults(
    payload
  );

assert.strictEqual(
  results.length,
  2
);

const map =
  buildVisualScoreMap(
    payload
  );

assert.strictEqual(
  map.get("1"),
  0.91
);

assert.strictEqual(
  map.get("2"),
  0.72
);

console.log(
  "Visual client tests passed"
);
