import assert from "assert";
import fs from "fs";
import path from "path";

import {
  runAblationStudy,
  compareAblationResults
} from "../services/ablation.js";

import {
  evaluationCases
} from "./evaluation-cases.js";

const products =
  JSON.parse(
    fs.readFileSync(
      path.resolve(
        "data/products.json"
      ),
      "utf8"
    )
  );

const results =
  await runAblationStudy(
    products,
    evaluationCases,
    5
  );

assert.strictEqual(
  results.length,
  6
);

for (
  const result of results
) {
  assert.ok(
    Number.isFinite(
      result.aggregate
        .precisionAtK
    )
  );

  assert.ok(
    Number.isFinite(
      result.aggregate
        .recallAtK
    )
  );

  assert.ok(
    Number.isFinite(
      result.aggregate
        .f1AtK
    )
  );

  assert.ok(
    Number.isFinite(
      result.aggregate
        .mrr
    )
  );

  assert.ok(
    Number.isFinite(
      result.aggregate
        .ndcgAtK
    )
  );

  assert.strictEqual(
    result.queries.length,
    evaluationCases.length
  );
}

const comparison =
  compareAblationResults(
    results
  );

assert.strictEqual(
  comparison.length,
  6
);

for (
  let index = 1;
  index < comparison.length;
  index += 1
) {
  assert.ok(
    comparison[
      index - 1
    ].ndcgAtK >=
      comparison[
        index
      ].ndcgAtK
  );
}

const semantic =
  results.find(
    result =>
      result.configuration
        .name ===
      "semantic-only"
  );

const hybrid =
  results.find(
    result =>
      result.configuration
        .name ===
      "full-hybrid"
  );

assert.ok(
  semantic
);

assert.ok(
  hybrid
);

assert.ok(
  semantic.aggregate
    .ndcgAtK > 0
);

assert.ok(
  hybrid.aggregate
    .ndcgAtK > 0
);

console.log(
  "Ablation tests passed"
);
