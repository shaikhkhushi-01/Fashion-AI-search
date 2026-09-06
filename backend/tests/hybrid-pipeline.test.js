import assert from "assert";
import {
  rankHybrid
} from "../services/hybridPipeline.js";

const products = [
  {
    id: 1,
    name: "Black Formal Shirt",
    category: "shirt",
    color: "black",
    style: "formal",
    occasion: "office",
    price: 1999,
    semanticScore: 0.95
  },
  {
    id: 2,
    name: "Blue Casual Shirt",
    category: "shirt",
    color: "blue",
    style: "casual",
    occasion: "college",
    price: 1499,
    semanticScore: 0.4
  },
  {
    id: 3,
    name: "Black Hoodie",
    category: "hoodie",
    color: "black",
    style: "casual",
    occasion: "travel",
    price: 1799,
    semanticScore: 0.3
  }
];

const ranked =
  rankHybrid(
    products,
    "black formal shirt for office under 2500"
  );

assert.ok(
  ranked.length > 0
);

assert.strictEqual(
  ranked[0].id,
  1
);

for (
  let index = 1;
  index < ranked.length;
  index += 1
) {
  assert.ok(
    ranked[index - 1].hybridScore >=
      ranked[index].hybridScore
  );
}

console.log(
  "Hybrid pipeline tests passed"
);
