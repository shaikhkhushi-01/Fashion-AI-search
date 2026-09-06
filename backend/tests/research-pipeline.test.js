import assert from "node:assert/strict";
import {
  evaluateRanking,
  evaluateSystem,
  runResearchPipeline
} from "../services/researchPipeline.js";

const products = [
  {
    id: 1,
    name: "Black Formal Shirt",
    category: "shirt",
    color: "black",
    style: "formal"
  },
  {
    id: 2,
    name: "Blue Casual Shirt",
    category: "shirt",
    color: "blue",
    style: "casual"
  },
  {
    id: 3,
    name: "Black Formal Trousers",
    category: "trousers",
    color: "black",
    style: "formal"
  }
];

const evaluationCases = [
  {
    query: "black formal shirt",
    relevantProductIds: [1]
  }
];

const ranking = (items) => [
  { product: items[0], score: 0.95 },
  { product: items[2], score: 0.7 },
  { product: items[1], score: 0.2 }
];

const rows = evaluateSystem(
  products,
  evaluationCases,
  ranking,
  3
);

assert.equal(rows.length, 1);
assert.equal(rows[0].metrics.reciprocalRank, 1);
assert.equal(rows[0].metrics.recallAtK, 1);

const result = runResearchPipeline({
  products,
  evaluationCases,
  systems: {
    baseline: ranking
  },
  k: 3
});

assert.ok(result.summaries.baseline);
assert.ok(result.errors.baseline);
assert.ok(result.report);

console.log("Research pipeline tests completed");
