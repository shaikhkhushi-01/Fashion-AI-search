import { cohensKappa } from "./research-human-eval.js";
import { trainAGMR, rankWithAGMR } from "./research-method.js";
import fs from "node:fs";

const read = p => JSON.parse(fs.readFileSync(p, "utf8"));
const key = r => r.query_id + "::" + r.product_id;

export function validateHumanStudy(a, b) {
  const ma = new Map((a.rows || []).map(r => [key(r), Number(r.label)]));
  const mb = new Map((b.rows || []).map(r => [key(r), Number(r.label)]));
  const common = [...ma.keys()].filter(k => mb.has(k)).sort();
  const labelsA = common.map(k => ma.get(k));
  const labelsB = common.map(k => mb.get(k));
  return {
    commonLabels: common.length,
    annotatorA: ma.size,
    annotatorB: mb.size,
    cohensKappa: cohensKappa(labelsA, labelsB),
    complete: common.length > 0 && common.length === ma.size && common.length === mb.size
  };
}

export function runHeldOutAGMR({ rows = [], testGroups = [] } = {}) {
  const training = rows.filter(r => r.split !== "test");
  const test = rows.filter(r => r.split === "test");
  const trained = trainAGMR(training);
  const ranked = testGroups.map(g => rankWithAGMR(g, trained.weights));
  return { trainingSamples: trained.samples, testLabels: test.length, weights: trained.weights, ranked };
}

if (process.argv[1]?.endsWith("research-validation.js")) {
  const aPath = process.argv[2], bPath = process.argv[3];
  if (!aPath || !bPath) throw new Error("Usage: node research-validation.js annotatorA.json annotatorB.json");
  const result = validateHumanStudy(read(aPath), read(bPath));
  console.log(JSON.stringify(result, null, 2));
  if (!result.complete) process.exitCode = 2;
}
