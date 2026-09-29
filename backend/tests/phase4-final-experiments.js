import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { rankBm25 } from "../services/bm25.js";
import { lexicalScore, hybridRetrieve } from "../services/hybridRetrieval.js";
import { getSemanticScoreMap, getModelName } from "../services/semanticSearch.js";
import { evaluateQuery } from "../services/evaluation.js";
import { evaluationCases } from "./evaluation-cases.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "..");
const products = JSON.parse(fs.readFileSync(path.join(repoRoot, "data", "products.json"), "utf8"));

const K = 5;
const EXPECTED_PRODUCTS = 407;
const EXPECTED_QUERIES = 250;
const VALIDATION_COUNT = 200;
const TEST_COUNT = 50;
const BOOTSTRAP_ITERATIONS = 2000;
const SEED = 20260929;

function ids(items) {
  return items.map(item => String(item?.id));
}

function lexicalRank(query) {
  return products
    .map((product, index) => ({ product, score: lexicalScore(query, product), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => String(item.product.id));
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function metricVector(predicted, testCase) {
  const result = evaluateQuery(predicted, testCase.relevant || [], testCase.relevance || {}, K);
  return {
    mrr: result.reciprocalRank,
    ndcgAt5: result.ndcgAtK,
    map: result.averagePrecision,
    precisionAt5: result.precisionAtK,
    recallAt5: result.recallAtK,
    f1At5: result.f1AtK
  };
}

function aggregateRows(rows) {
  const keys = ["mrr", "ndcgAt5", "map", "precisionAt5", "recallAt5", "f1At5"];
  return Object.fromEntries(keys.map(key => [key, mean(rows.map(row => row[key]))]));
}

function makePrng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function bootstrapDelta(baseline, candidate, metric, iterations = BOOTSTRAP_ITERATIONS, seed = SEED) {
  if (baseline.length !== candidate.length || !baseline.length) {
    throw new Error("Bootstrap inputs must have equal non-zero length.");
  }
  const random = makePrng(seed);
  const deltas = new Array(iterations);
  for (let b = 0; b < iterations; b += 1) {
    let sum = 0;
    for (let i = 0; i < baseline.length; i += 1) {
      const index = Math.floor(random() * baseline.length);
      sum += candidate[index][metric] - baseline[index][metric];
    }
    deltas[b] = sum / baseline.length;
  }
  deltas.sort((a, b) => a - b);
  const low = deltas[Math.floor(iterations * 0.025)];
  const high = deltas[Math.floor(iterations * 0.975) - 1];
  const observed = mean(candidate.map(r => r[metric])) - mean(baseline.map(r => r[metric]));
  const sd = Math.sqrt(mean(deltas.map(value => (value - mean(deltas)) ** 2)));
  return {
    observedDelta: observed,
    ci95: [low, high],
    standardizedEffect: sd ? observed / sd : 0,
    iterations
  };
}

function pairedComparison(baselineRows, candidateRows) {
  const metrics = ["mrr", "ndcgAt5", "map", "precisionAt5", "recallAt5", "f1At5"];
  return Object.fromEntries(metrics.map(metric => [
    metric,
    bootstrapDelta(baselineRows, candidateRows, metric)
  ]));
}

function makeHybrid(productsWithScores, query, weights) {
  return hybridRetrieve(productsWithScores, query, {
    limit: products.length,
    candidateLimit: products.length,
    lexicalLimit: products.length,
    semanticLimit: products.length,
    semanticWeight: weights.semantic,
    lexicalWeight: weights.lexical,
    attributeWeight: weights.attribute,
    budgetWeight: weights.budget,
    metadataWeight: weights.metadata
  }).results.map(item => String(item.product.id));
}

function candidateWeights() {
  const values = [0.35, 0.45, 0.55, 0.65];
  return values.map(semantic => ({
    semantic,
    lexical: 0.20,
    attribute: 0.20,
    budget: 0.10,
    metadata: Number((1 - semantic - 0.20 - 0.20 - 0.10).toFixed(4))
  })).filter(weights => weights.metadata >= 0);
}

function imageField(product) {
  return product?.image ?? product?.imageUrl ?? product?.image_url ?? product?.thumbnail ?? null;
}

async function buildSemanticScores(cases) {
  const cache = new Map();
  for (const testCase of cases) {
    cache.set(testCase.query, await getSemanticScoreMap(products, testCase.query));
  }
  return cache;
}

async function evaluateSystems(cases, semanticCache, hybridWeights) {
  const systems = {};
  const definitions = {
    bm25: query => ids(rankBm25(products, query)),
    lexical: query => lexicalRank(query),
    semantic: query => products
      .map((product, index) => ({ product, score: semanticCache.get(query)?.get(String(product.id)) ?? 0, index }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(item => String(item.product.id)),
    hybrid: (query) => makeHybrid(products.map(product => ({
      ...product,
      semanticScore: semanticCache.get(query)?.get(String(product.id)) ?? 0
    })), query, hybridWeights)
  };

  for (const [name, predictor] of Object.entries(definitions)) {
    const rows = cases.map(testCase => metricVector(predictor(testCase.query), testCase));
    systems[name] = { metrics: aggregateRows(rows), rows };
  }
  return systems;
}

function selectBestValidationConfig(results) {
  return [...results].sort((a, b) =>
    b.metrics.ndcgAt5 - a.metrics.ndcgAt5 ||
    b.metrics.mrr - a.metrics.mrr ||
    b.metrics.map - a.metrics.map
  )[0];
}

function challengeSummary(challengeCases, predictor, semanticCache, weights) {
  const rows = challengeCases.map(testCase => {
    const predicted = makeHybrid(products.map(product => ({
      ...product,
      semanticScore: semanticCache.get(testCase.query)?.get(String(product.id)) ?? 0
    })), testCase.query, weights);
    const metrics = metricVector(predicted, testCase);
    return { query: testCase.query, ...metrics, topK: predicted.slice(0, K) };
  });
  return {
    queryCount: rows.length,
    metrics: aggregateRows(rows),
    zeroHitQueries: rows.filter(row => row.recallAt5 === 0).map(row => row.query),
    rows
  };
}

async function loadHumanEvidence() {
  const file = path.join(repoRoot, "research", "human-evaluation", "judgments.jsonl");
  if (!fs.existsSync(file)) return { status: "pending", reason: "judgments.jsonl not present" };
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const expected = 100 * 10 * 3;
  if (lines.length !== expected) {
    return { status: "pending", reason: `expected ${expected} judgments, found ${lines.length}` };
  }
  return { status: "available", annotationCount: lines.length, source: "real-human-judgments-file" };
}

async function main() {
  if (products.length !== EXPECTED_PRODUCTS) throw new Error(`Expected ${EXPECTED_PRODUCTS} products, found ${products.length}`);
  if (evaluationCases.length !== EXPECTED_QUERIES) throw new Error(`Expected ${EXPECTED_QUERIES} queries, found ${evaluationCases.length}`);

  const validationCases = evaluationCases.slice(0, VALIDATION_COUNT);
  const heldOutCases = evaluationCases.slice(VALIDATION_COUNT, VALIDATION_COUNT + TEST_COUNT);
  const challengePath = path.join(repoRoot, "..", "research", "difficult-queries-v1.json");
  const challengeCases = fs.existsSync(challengePath) ? JSON.parse(fs.readFileSync(challengePath, "utf8")).queries ?? [] : [];

  const semanticCache = await buildSemanticScores([...validationCases, ...heldOutCases, ...challengeCases]);

  const validationConfigs = [];
  for (const weights of candidateWeights()) {
    const systems = await evaluateSystems(validationCases, semanticCache, weights);
    validationConfigs.push({ weights, metrics: systems.hybrid.metrics });
  }
  const selected = selectBestValidationConfig(validationConfigs);

  const validationSystems = await evaluateSystems(validationCases, semanticCache, selected.weights);
  const heldOutSystems = await evaluateSystems(heldOutCases, semanticCache, selected.weights);

  const comparisons = {};
  for (const baseline of ["bm25", "lexical", "semantic"]) {
    comparisons[baseline] = pairedComparison(heldOutSystems[baseline].rows, heldOutSystems.hybrid.rows);
  }

  const humanEvidence = await loadHumanEvidence();
  const challenge = challengeCases.length
    ? challengeSummary(challengeCases, null, semanticCache, selected.weights)
    : { queryCount: 0, metrics: {}, zeroHitQueries: [], rows: [] };

  const report = {
    metadata: {
      benchmarkId: "fashion-ai-benchmark-v1",
      products: products.length,
      validationQueries: validationCases.length,
      heldOutTestQueries: heldOutCases.length,
      k: K,
      bootstrapIterations: BOOTSTRAP_ITERATIONS,
      confidenceLevel: 0.95,
      randomSeed: SEED,
      semanticModel: getModelName(),
      generatedAt: new Date().toISOString()
    },
    protocol: {
      tuningSplit: "validation-only",
      heldOutTouchedByTuning: false,
      selectionMetric: "NDCG@5, then MRR, then MAP",
      humanEvidenceStatus: humanEvidence.status,
      multimodalStatus: products.some(imageField) ? "image-assets-present-review-required" : "blocked-pending-image-assets"
    },
    validation: {
      selectedWeights: selected.weights,
      candidates: validationConfigs,
      systems: validationSystems
    },
    heldOutTest: {
      systems: heldOutSystems,
      pairedBootstrapComparisons: comparisons
    },
    difficultQueries: challenge,
    humanEvidence,
    claimBoundary: {
      humanValidatedResults: humanEvidence.status === "available" ? "available-for-separate-human-analysis" : "pending-real-annotations",
      multimodalScores: products.some(imageField) ? "requires-runtime-validation" : "not-computable-with-current-catalog",
      generalization: "not established by this benchmark alone"
    }
  };

  const outputDir = path.join(repoRoot, "evaluation-results");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "phase4-final-experiments.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    status: "complete",
    selectedWeights: selected.weights,
    heldOutMetrics: Object.fromEntries(Object.entries(heldOutSystems).map(([name, value]) => [name, value.metrics])),
    humanEvidence: humanEvidence.status,
    output: "evaluation-results/phase4-final-experiments.json"
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
