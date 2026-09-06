import assert from "assert";
import {
  runAblationStudy,
  compareAblationResults
} from "../services/ablation.js";
import {
  products,
  evaluationCases
} from "./evaluation-cases.js";

const results = runAblationStudy(
  products,
  evaluationCases,
  5
);

assert.strictEqual(
  results.length,
  6
);

for (const result of results) {
  assert.ok(
    Number.isFinite(result.aggregate.precisionAtK)
  );

  assert.ok(
    Number.isFinite(result.aggregate.recallAtK)
  );

  assert.ok(
    Number.isFinite(result.aggregate.f1AtK)
  );

  assert.ok(
    Number.isFinite(result.aggregate.mrr)
  );

  assert.ok(
    Number.isFinite(result.aggregate.ndcgAtK)
  );

  assert.strictEqual(
    result.queries.length,
    evaluationCases.length
  );
}

const comparison =
  compareAblationResults(results);

assert.strictEqual(
  comparison.length,
  6
);

for (let index = 1; index < comparison.length; index += 1) {
  assert.ok(
    comparison[index - 1].ndcgAtK >=
      comparison[index].ndcgAtK
  );
}

console.log("Ablation tests passed");
