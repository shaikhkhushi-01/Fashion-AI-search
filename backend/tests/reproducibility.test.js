import assert from "assert";
import {
  datasetFingerprint,
  createExperimentFingerprint,
  stableStringify
} from "../services/reproducibility.js";

const products = [
  {
    id: 1,
    name: "Black Shirt",
    price: 1999
  },
  {
    id: 2,
    name: "Blue Sneakers",
    price: 2999
  }
];

const cases = [
  {
    query: "black shirt",
    relevantIds: [1]
  }
];

const configuration = {
  k: 5
};

const hashA =
  datasetFingerprint(products);

const hashB =
  datasetFingerprint(products);

assert.strictEqual(hashA, hashB);

const experimentA =
  createExperimentFingerprint({
    experiment: "test",
    products,
    evaluationCases: cases,
    configuration
  });

const experimentB =
  createExperimentFingerprint({
    experiment: "test",
    products,
    evaluationCases: cases,
    configuration
  });

assert.strictEqual(
  experimentA,
  experimentB
);

assert.notStrictEqual(
  stableStringify({ a: 1, b: 2 }),
  stableStringify({ a: 1, b: 3 })
);

console.log(
  "Reproducibility tests passed"
);
