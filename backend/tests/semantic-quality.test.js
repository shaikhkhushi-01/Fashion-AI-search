import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  semanticSearch,
  extractSemanticResults,
  buildSemanticScoreMap
} from "../services/semanticClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possiblePaths = [
  path.join(__dirname, "../data/products.json"),
  path.join(__dirname, "../data/products.js"),
  path.join(__dirname, "../products.json")
];

const dataPath = possiblePaths.find(file => fs.existsSync(file));

assert.ok(dataPath, "Product dataset not found");

const raw = fs.readFileSync(dataPath, "utf8");

let products;

try {
  products = JSON.parse(raw);
} catch {
  const modulePath = pathToFileURL(dataPath).href;
  const module = await import(modulePath);
  products = module.default ?? module.products;
}

assert.ok(Array.isArray(products), "Products must be an array");
assert.ok(products.length > 0, "Product dataset is empty");

const semanticUrl =
  process.env.SEMANTIC_API_URL ||
  "http://127.0.0.1:8000";

const healthResponse = await fetch(
  `${semanticUrl.replace(/\/$/, "")}/health`
);

assert.equal(
  healthResponse.ok,
  true,
  "Semantic API is not reachable"
);

const queries = [
  "comfortable outfit for university",
  "elegant clothes for a wedding",
  "relaxed everyday clothing",
  "professional office outfit"
];

const results = [];

for (const query of queries) {
  const payload = await semanticSearch(
    query,
    10,
    semanticUrl
  );

  const items = extractSemanticResults(payload);

  assert.ok(
    items.length > 0,
    `No semantic results returned for: ${query}`
  );

  const scoreMap = buildSemanticScoreMap(payload);

  assert.ok(
    scoreMap.size > 0,
    `No semantic scores returned for: ${query}`
  );

  const scores = [...scoreMap.values()];

  assert.ok(
    scores.every(score => Number.isFinite(score)),
    `Invalid semantic score for: ${query}`
  );

  assert.ok(
    scores.every(score => score >= 0 && score <= 1),
    `Semantic scores must be normalized between 0 and 1 for: ${query}`
  );

  const topScore = Math.max(...scores);

  results.push({
    query,
    resultCount: items.length,
    uniqueScoredProducts: scoreMap.size,
    topScore
  });
}

const distinctTopScores =
  new Set(
    results.map(item =>
      item.topScore.toFixed(4)
    )
  );

assert.ok(
  distinctTopScores.size > 1,
  "Semantic retrieval returned identical top scores for all test queries"
);

console.log("Semantic quality tests passed");
console.log(
  JSON.stringify(
    {
      semanticApi: semanticUrl,
      datasetSize: products.length,
      queries: results
    },
    null,
    2
  )
);
