import assert from "assert";
import {
  shuffle,
  splitDataset,
  createSplitManifest
} from "../services/datasetSplit.js";

const items =
  Array.from(
    { length: 20 },
    (_, index) => ({
      id: index + 1
    })
  );

const first =
  shuffle(
    items,
    "research-seed"
  );

const second =
  shuffle(
    items,
    "research-seed"
  );

assert.deepStrictEqual(
  first,
  second
);

const split =
  splitDataset(
    items,
    {
      train: 0.7,
      validation: 0.15,
      test: 0.15
    },
    "research-seed"
  );

assert.strictEqual(
  split.train.length +
    split.validation.length +
    split.test.length,
  20
);

const manifest =
  createSplitManifest(
    items,
    split,
    "research-seed"
  );

assert.strictEqual(
  manifest.total,
  20
);

console.log(
  "Dataset split tests passed"
);
