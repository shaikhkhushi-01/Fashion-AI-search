import assert from "node:assert/strict";
import {
  percentile,
  summarizeLatency,
  compareLatency,
  memorySnapshot
} from "../services/performance.js";

const summary = summarizeLatency([10, 20, 30, 40, 50]);

assert.equal(summary.count, 5);
assert.equal(summary.min, 10);
assert.equal(summary.max, 50);
assert.equal(percentile([10, 20, 30, 40, 50], 0.5), 30);

const comparison = compareLatency(100, 80);

assert.equal(comparison.improvement, 20);
assert.equal(comparison.regression, 0);

const memory = memorySnapshot();

assert.ok(memory.rss > 0);
assert.ok(memory.heapUsed > 0);

console.log("Performance tests completed");
