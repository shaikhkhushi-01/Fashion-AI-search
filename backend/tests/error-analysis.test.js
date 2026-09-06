import assert from "assert";
import {
  getRank,
  classifyError,
  analyzeQuery,
  buildErrorCategories
} from "../services/errorAnalysis.js";

const ranked = [
  "3",
  "2",
  "1",
  "4"
];

const relevant = [
  "1"
];

assert.strictEqual(
  getRank(
    ranked,
    relevant
  ),
  3
);

assert.strictEqual(
  classifyError(
    ranked,
    relevant,
    5
  ),
  "late-relevant-result"
);

const report =
  analyzeQuery(
    "black shirt",
    ranked,
    relevant,
    5
  );

assert.strictEqual(
  report.rank,
  3
);

const categories =
  buildErrorCategories(
    [report]
  );

assert.ok(
  categories["late-relevant-result"]
);

console.log(
  "Error analysis tests passed"
);
