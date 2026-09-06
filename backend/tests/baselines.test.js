import assert from "assert";
import {
  keywordBaseline,
  categoryBaseline,
  popularityBaseline
} from "../services/baselines.js";

const products = [
  {
    id: 1,
    name: "Black Formal Shirt",
    category: "shirt",
    color: "black",
    style: "formal",
    rating: 4.8
  },
  {
    id: 2,
    name: "Blue Casual Hoodie",
    category: "hoodie",
    color: "blue",
    style: "casual",
    rating: 4.2
  }
];

const keyword =
  keywordBaseline(
    products,
    "black formal shirt"
  );

assert.strictEqual(
  keyword[0].id,
  1
);

const category =
  categoryBaseline(
    products,
    "shirt black"
  );

assert.strictEqual(
  category[0].id,
  1
);

const popular =
  popularityBaseline(
    products
  );

assert.strictEqual(
  popular[0].id,
  1
);

console.log(
  "Baseline tests passed"
);
