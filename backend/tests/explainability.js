import assert from "node:assert/strict";
import {
  attributeMatches,
  budgetMatch,
  explainRecommendation,
  explainRecommendations
} from "../services/explainability.js";

const product = {
  id: 1,
  name: "Black Formal Cotton Shirt",
  category: "shirt",
  gender: "men",
  color: "black",
  style: "formal",
  occasion: "office",
  material: "cotton",
  fit: "regular",
  price: 1800,
  description: "Comfortable cotton shirt for office wear"
};

const query = "black formal cotton shirt for office under 2500";

const matches = attributeMatches(query, product);

assert.ok(matches.length > 0);

const budget = budgetMatch(query, product);

assert.ok(budget);
assert.equal(budget.feature, "budget");

const explanation = explainRecommendation(
  query,
  product,
  0.91
);

assert.equal(explanation.productId, 1);
assert.equal(explanation.score, 0.91);
assert.ok(explanation.summary.length > 0);
assert.ok(explanation.reasons.length > 0);
assert.ok(explanation.matchedFeatures.length > 0);

const batch = explainRecommendations(
  query,
  [product],
  [0.91]
);

assert.equal(batch.length, 1);
assert.equal(batch[0].productId, 1);

console.log("Explainability tests passed");
