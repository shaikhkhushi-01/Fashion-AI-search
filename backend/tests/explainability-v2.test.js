import assert from "assert";
import {
  buildWhySelected,
  explainRankedResults,
  explanationForUser
} from "../services/explainabilityV2.js";

const product = {
  id: 1,
  name: "Black Formal Shirt",
  semanticScore: 0.91,
  visualScore: 0.84,
  lexicalScore: 0.8,
  attributeScore: 0.9,
  personalizationScore: 0.76,
  rankingScore: 0.88
};

const explanation =
  buildWhySelected(
    product,
    "black formal shirt"
  );

assert.strictEqual(
  explanation.productId,
  1
);

assert.ok(
  explanation.signals.length > 0
);

assert.ok(
  explanation.summary.length > 0
);

const ranked =
  explainRankedResults(
    [product],
    "black formal shirt"
  );

assert.strictEqual(
  ranked.length,
  1
);

const userText =
  explanationForUser(
    product,
    "black formal shirt"
  );

assert.ok(
  userText.length > 0
);

console.log(
  "Explainability V2 tests passed"
);
