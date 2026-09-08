import assert from "assert";

import {
  getRank,
  classifyError,
  analyzeQuery,
  buildErrorCategories,
  compareRankings,
  classifyQueryIntent,
  analyzeByIntent
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
  categories[
    "late-relevant-result"
  ]
);

const baseline =
  new Map([
    [
      "black shirt",
      ["2", "3", "4"]
    ],
    [
      "white sneakers",
      ["3", "4", "2"]
    ],
    [
      "linen shirt",
      ["5", "6", "7"]
    ]
  ]);

const improved =
  new Map([
    [
      "black shirt",
      ["1", "2", "3"]
    ],
    [
      "white sneakers",
      ["4", "2", "1"]
    ],
    [
      "linen shirt",
      ["5", "6", "7"]
    ]
  ]);

const cases = [
  {
    query: "black shirt",
    relevant: ["1"]
  },
  {
    query: "white sneakers",
    relevant: ["4"]
  },
  {
    query: "linen shirt",
    relevant: ["8"]
  }
];

const comparison =
  compareRankings(
    cases,
    baseline,
    improved,
    3
  );

assert.strictEqual(
  comparison.recovered.length,
  1
);

assert.strictEqual(
  comparison.regressed.length,
  0
);

assert.strictEqual(
  comparison.unchanged.length,
  2
);

assert.ok(
  comparison.recoveryRate >
    0
);

assert.strictEqual(
  comparison.regressionRate,
  0
);

const intents =
  classifyQueryIntent(
    "black linen shirt for summer under 3000"
  );

assert.ok(
  intents.includes("color")
);

assert.ok(
  intents.includes("material")
);

assert.ok(
  intents.includes("occasion")
);

assert.ok(
  intents.includes("budget")
);

const intentCases = [
  {
    query:
      "black shirt for office",
    relevant: ["1"]
  },
  {
    query:
      "white sneakers for travel",
    relevant: ["2"]
  },
  {
    query:
      "linen shirt under 3000",
    relevant: ["3"]
  }
];

const intentRankings =
  new Map([
    [
      "black shirt for office",
      ["1", "2", "3"]
    ],
    [
      "white sneakers for travel",
      ["2", "3", "1"]
    ],
    [
      "linen shirt under 3000",
      ["4", "5", "3"]
    ]
  ]);

const intentReport =
  analyzeByIntent(
    intentCases,
    intentRankings,
    3
  );

assert.ok(
  intentReport.category
);

assert.ok(
  intentReport.occasion
);

assert.ok(
  intentReport.budget
);

console.log(
  "Error analysis tests passed"
);
