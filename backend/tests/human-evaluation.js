import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { summarizeHumanLabels, validateHumanJudgments } from "../services/humanEvaluation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "..", "..");
const inputPath = process.argv[2] || path.join(repoRoot, "research", "human-evaluation", "judgments.jsonl");
const outputPath = process.argv[3] || path.join(repoRoot, "evaluation-results", "human-evaluation-summary.json");

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("Judgment file not found: " + filePath);
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error("Invalid JSON on line " + (index + 1) + ": " + error.message); }
  });
}

function main() {
  const records = readJsonl(inputPath);
  const validation = validateHumanJudgments(records, { minAnnotationsPerPair: 3, exactAnnotationsPerPair: 3 });
  const summary = {
    protocol: "human-evaluation-v1",
    source: path.relative(repoRoot, inputPath),
    validation,
    summary: summarizeHumanLabels(records),
    generatedAt: new Date().toISOString()
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main();