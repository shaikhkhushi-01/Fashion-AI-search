import { cohensKappa } from "./research-human-eval.js";
import fs from "node:fs";

const read = p => JSON.parse(fs.readFileSync(p, "utf8"));
const key = r => r.query_id + "::" + r.product_id;

export function validateHumanStudy(a, b) {
  const ma = new Map((a.rows || []).map(r => [key(r), Number(r.label)]));
  const mb = new Map((b.rows || []).map(r => [key(r), Number(r.label)]));
  const common = [...ma.keys()].filter(k => mb.has(k)).sort();
  const labelsA = common.map(k => ma.get(k));
  const labelsB = common.map(k => mb.get(k));
  const expectedQueries = Math.max(Number(a.task_count || 0), Number(b.task_count || 0));
  const expectedPairs = expectedQueries * Number(a.candidates_per_query || 5);
  return {
    schemaA: a.schema || null,
    schemaB: b.schema || null,
    annotatorA: a.annotator_id || null,
    annotatorB: b.annotator_id || null,
    commonLabels: common.length,
    annotatorA: ma.size,
    annotatorB: mb.size,
    expectedPairs,
    expectedQueries,
    complete: expectedPairs > 0 && ma.size === expectedPairs && mb.size === expectedPairs && common.length === expectedPairs,
    cohensKappa: cohensKappa(labelsA, labelsB)
  };
}

if (process.argv[1]?.endsWith("research-validation.js")) {
  const aPath = process.argv[2], bPath = process.argv[3];
  if (!aPath || !bPath) throw new Error("Usage: node research-validation.js annotatorA.json annotatorB.json");
  const result = validateHumanStudy(read(aPath), read(bPath));
  console.log(JSON.stringify(result, null, 2));
  if (!result.complete) process.exitCode = 2;
}
