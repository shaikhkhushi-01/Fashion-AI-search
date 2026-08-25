/*
=========================================================
FASHION AI DISCOVERY
DAY 3 RANKING TESTS
=========================================================
*/

import assert from "node:assert/strict";

import {
  rankProducts,
  calculateRankingScore,
  rankWithAblation
} from "../services/ranking.js";

const products = [
  {
    id: 1,
    brand: "NOVA",
    name: "Black Minimal Cotton Shirt",
    category: "Shirts",
    gender: "Unisex",
    color: "Black",
    material: ["Cotton"],
    style: [
      "Minimal",
      "Casual"
    ],
    occasion: [
      "College",
      "Everyday"
    ],
    price: 1999,
    availability: "In Stock",
    tags: [
      "black",
      "minimal",
      "college",
      "comfortable"
    ],
    description:
      "Black cotton shirt for college and everyday casual wear."
  },

  {
    id: 2,
    brand: "FORM",
    name: "Elegant Summer Dress",
    category: "Dresses",
    gender: "Women",
    color: "Cream",
    material: ["Cotton"],
    style: [
      "Elegant",
      "Relaxed"
    ],
    occasion: [
      "Summer",
      "Date"
    ],
    price: 3299,
    availability: "In Stock",
    tags: [
      "summer",
      "elegant"
    ],
    description:
      "Cream cotton summer dress."
  }
];

/*
=========================================================
TEST 1
=========================================================
*/

const ranked =
  rankProducts(
    products,
    "black minimal shirt for college"
  );

assert.equal(
  ranked[0].id,
  1,
  "Relevant black shirt should rank first."
);

/*
=========================================================
TEST 2
=========================================================
*/

assert.ok(
  ranked[0].matchScore >
    ranked[1].matchScore,
  "Best product should have higher score."
);

/*
=========================================================
TEST 3
=========================================================
*/

assert.ok(
  Array.isArray(
    ranked[0].reasons
  ),
  "Ranking should provide explanations."
);

/*
=========================================================
TEST 4
=========================================================
*/

assert.ok(
  ranked[0].rankingComponents,
  "Ranking components must be exposed."
);

/*
=========================================================
TEST 5
=========================================================
*/

const directScore =
  calculateRankingScore(
    "black shirt",
    products[0]
  );

assert.ok(
  directScore.score >= 0 &&
    directScore.score <= 1,
  "Score must remain between 0 and 1."
);

/*
=========================================================
TEST 6 — ABLATION
=========================================================
*/

const ablation =
  rankWithAblation(
    products,
    "black minimal shirt",
    ["semantic"]
  );

assert.equal(
  ablation.length,
  products.length,
  "Ablation must return all candidates."
);

console.log(
  "All Day 3 ranking tests passed."
);
