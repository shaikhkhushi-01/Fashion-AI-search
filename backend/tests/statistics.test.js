import assert from "node:assert/strict";

import {
  mean,
  variance,
  standardDeviation,
  standardError,
  bootstrapMean,
  bootstrapDifference,
  compareMetricSamples,
  summarizeMetric
} from "../services/statistics.js";

const values = [1, 2, 3, 4, 5];

assert.equal(mean(values), 3);

assert.equal(
  variance(values),
  2.5
);

assert.equal(
  Number(
    standardDeviation(values)
      .toFixed(6)
  ),
  Number(
    Math.sqrt(2.5)
      .toFixed(6)
  )
);

assert.ok(
  standardError(values) > 0
);

const bootstrap =
  bootstrapMean(
    values,
    200,
    42
  );

assert.equal(
  bootstrap.mean,
  3
);

assert.ok(
  bootstrap.lower <=
    bootstrap.mean
);

assert.ok(
  bootstrap.upper >=
    bootstrap.mean
);

const difference =
  bootstrapDifference(
    [0.8, 0.7, 0.9],
    [0.6, 0.5, 0.7],
    200,
    42
  );

assert.equal(
  Number(
    difference.mean.toFixed(6)
  ),
  0.2
);

assert.ok(
  difference.lower <=
    difference.mean
);

assert.ok(
  difference.upper >=
    difference.mean
);

const comparison =
  compareMetricSamples(
    [0.8, 0.7, 0.9],
    [0.6, 0.5, 0.7]
  );

assert.equal(
  comparison.samples.length,
  3
);

assert.equal(
  Number(
    comparison.meanDifference
      .toFixed(6)
  ),
  0.2
);

assert.ok(
  Number.isFinite(
    comparison.effectSize
  )
);

assert.ok(
  Number.isFinite(
    comparison.relativeImprovement
  )
);

assert.ok(
  comparison.confidenceInterval95
    .lower <=
    comparison.meanDifference
);

assert.ok(
  comparison.confidenceInterval95
    .upper >=
    comparison.meanDifference
);

const summary =
  summarizeMetric(values);

assert.equal(
  summary.mean,
  3
);

assert.equal(
  summary.samples,
  5
);

assert.ok(
  summary.confidenceInterval95
    .lower <= 3
);

assert.ok(
  summary.confidenceInterval95
    .upper >= 3
);

console.log(
  "Statistics tests passed"
);
