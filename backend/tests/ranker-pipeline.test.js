import assert from "assert";
import {
  rankWithLearningModel,
  combineHybridAndRanker
} from "../services/rankerPipeline.js";

const products = [
  {
    id: 1,
    name: "Black Formal Shirt",
    category: "shirt",
    gender: "women",
    color: "black",
    style: "formal",
    occasion: "office",
    material: "cotton",
    price: 1999,
    semanticScore: 0.9,
    hybridScore: 0.91
  },
  {
    id: 2,
    name: "Blue Casual Shirt",
    category: "shirt",
    gender: "women",
    color: "blue",
    style: "casual",
    occasion: "college",
    material: "cotton",
    price: 1499,
    semanticScore: 0.4,
    hybridScore: 0.45
  },
  {
    id: 3,
    name: "Black Hoodie",
    category: "hoodie",
    gender: "women",
    color: "black",
    style: "casual",
    occasion: "travel",
    material: "cotton",
    price: 1799,
    semanticScore: 0.3,
    hybridScore: 0.31
  }
];

const model = {
  weights: [
    0.3,
    0.2,
    0.2,
    0.1,
    0.1,
    0.1
  ],
  bias: 0
};

const ranked =
  rankWithLearningModel(
    products,
    "black formal shirt for office",
    model
  );

assert.strictEqual(
  ranked.length,
  3
);

assert.ok(
  Number.isFinite(
    ranked[0].rankingScore
  )
);

const finalRanked =
  combineHybridAndRanker(
    products,
    "black formal shirt for office",
    model
  );

assert.strictEqual(
  finalRanked.length,
  3
);

for (
  let index = 1;
  index < finalRanked.length;
  index += 1
) {
  assert.ok(
    finalRanked[index - 1].finalScore >=
      finalRanked[index].finalScore
  );
}

console.log(
  "Ranker pipeline tests passed"
);
