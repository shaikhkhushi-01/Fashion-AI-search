import assert from "assert";
import {
  multimodalScore,
  rankMultimodal,
  explainMultimodalScore
} from "../services/multimodalFusion.js";

const products = [
  {
    id: 1,
    semanticScore: 0.9,
    visualScore: 0.95,
    lexicalScore: 0.8,
    attributeScore: 0.9
  },
  {
    id: 2,
    semanticScore: 0.4,
    visualScore: 0.3,
    lexicalScore: 0.5,
    attributeScore: 0.4
  }
];

const score =
  multimodalScore(
    products[0]
  );

assert.ok(score > 0.8);

const ranked =
  rankMultimodal(
    products
  );

assert.strictEqual(
  ranked[0].id,
  1
);

const explanation =
  explainMultimodalScore(
    products[0]
  );

assert.ok(
  explanation.length >= 2
);

console.log(
  "Multimodal fusion tests passed"
);
