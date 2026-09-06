import assert from "assert";
import {
  sanitizeQuery,
  sanitizeProduct,
  sanitizeProducts,
  detectQueryRisk,
  validateProduct,
  validateRankingOutput
} from "../services/robustness.js";

const product = sanitizeProduct({
  id: 1,
  name: "Black Formal Shirt",
  price: "1999",
  rating: "4.5",
  tags: "formal"
});

assert.strictEqual(
  product.id,
  1
);

assert.strictEqual(
  product.price,
  1999
);

assert.strictEqual(
  product.rating,
  4.5
);

assert.deepStrictEqual(
  product.tags,
  ["formal"]
);

assert.strictEqual(
  sanitizeQuery("  BLACK   SHIRT  "),
  "black shirt"
);

assert.strictEqual(
  sanitizeQuery("<script>alert(1)</script>"),
  "script alert(1) /script"
);

const validProduct =
  validateProduct({
    id: 1,
    name: "Shirt",
    price: 1000
  });

assert.strictEqual(
  validProduct.valid,
  true
);

const invalidProduct =
  validateProduct({
    name: "Shirt",
    price: "invalid"
  });

assert.strictEqual(
  invalidProduct.valid,
  false
);

const risk =
  detectQueryRisk("");

assert.strictEqual(
  risk.empty,
  true
);

const products =
  sanitizeProducts([
    {
      id: 1,
      name: "Shirt",
      price: 1000
    },
    null,
    {
      id: 2,
      name: "Shoes",
      price: 2000
    }
  ]);

assert.strictEqual(
  products.length,
  2
);

const ranking =
  validateRankingOutput([
    {
      id: 1,
      score: 0.9
    },
    {
      id: 2,
      score: 0.7
    },
    {
      id: 3,
      score: 0.2
    }
  ]);

assert.strictEqual(
  ranking.valid,
  true
);

console.log("Robustness tests passed");
