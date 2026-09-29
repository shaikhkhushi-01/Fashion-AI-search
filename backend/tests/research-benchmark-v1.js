import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { rankBm25 } from "../services/bm25.js";
import { lexicalScore, hybridRetrieve } from "../services/hybridRetrieval.js";
import { getSemanticScoreMap, getModelName } from "../services/semanticSearch.js";
import { rankImagesByText, DEFAULT_MODEL as MULTIMODAL_MODEL } from "../services/multimodalRetrieval.js";
import { evaluateDataset } from "../services/evaluation.js";
import { evaluationCases } from "./evaluation-cases.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "..", "..");
const products = JSON.parse(fs.readFileSync(path.join(repoRoot, "data", "products.json"), "utf8"));

const K = 5;
const EXPECTED_PRODUCTS = 407;
const EXPECTED_QUERIES = 250;
const VALIDATION_COUNT = 200;
const TEST_COUNT = 50;

function ids(items) {
  return items.map(item => String(item?.id));
}

function lexicalRank(query) {
  return products
    .map((product, index) => ({ product, score: lexicalScore(query, product), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => String(item.product.id));
}

function semanticRank(query, enrichedProducts) {
  return enrichedProducts
    .map((product, index) => ({ product, score: Number(product.semanticScore ?? 0), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => String(item.product.id));
}

function makeCases(cases) {
  return cases.map(item => ({
    query: item.query,
    relevant: item.relevant || [],
    relevance: item.relevance || {}
  }));
}

function imageField(product) {
  return product?.image ?? product?.imageUrl ?? product?.image_url ?? product?.thumbnail ?? null;
}

function auditImages() {
  const withImages = products.filter(product => imageField(product));
  return {
    catalogProducts: products.length,
    productsWithImage: withImages.length,
    imageCoverage: products.length ? withImages.length / products.length : 0,
    imageFieldsChecked: ["image", "imageUrl", "image_url", "thumbnail"],
    status: withImages.length ? "available" : "blocked-pending-image-assets"
  };
}

async function runSystem(name, predictor, cases) {
  const started = Date.now();
  const result = evaluateDataset(cases, predictor, { k: K });
  return {
    system: name,
    elapsedMs: Date.now() - started,
    metrics: result.metrics,
    queryCount: result.queries.length
  };
}

async function main() {
  if (products.length !== EXPECTED_PRODUCTS) {
    throw new Error(`Catalog audit failed: expected ${EXPECTED_PRODUCTS} products, found ${products.length}`);
  }
  if (evaluationCases.length !== EXPECTED_QUERIES) {
    throw new Error(`Benchmark audit failed: expected ${EXPECTED_QUERIES} queries, found ${evaluationCases.length}`);
  }

  const validationCases = makeCases(evaluationCases.slice(0, VALIDATION_COUNT));
  const heldOutCases = makeCases(evaluationCases.slice(VALIDATION_COUNT, EXPECTED_QUERIES));
  const imageAudit = auditImages();

  const outputs = {
    metadata: {
      benchmarkId: "fashion-ai-benchmark-v1",
      catalogProducts: products.length,
      queries: evaluationCases.length,
      validationQueries: validationCases.length,
      heldOutTestQueries: heldOutCases.length,
      k: K,
      labels: "synthetic-curated",
      humanJudgments: "pending",
      semanticModel: getModelName(),
      multimodalModel: MULTIMODAL_MODEL,
      generatedAt: new Date().toISOString()
    },
    imageAudit,
    systems: {}
  };

  for (const [splitName, cases] of [["validation", validationCases], ["heldOutTest", heldOutCases]]) {
    outputs.systems[splitName] = {};

    outputs.systems[splitName].bm25 = await runSystem(
      "bm25",
      query => ids(rankBm25(products, query)),
      cases
    );

    outputs.systems[splitName].lexical = await runSystem(
      "lexical",
      query => lexicalRank(query),
      cases
    );

    const semanticCache = new Map();
    for (const testCase of cases) {
      semanticCache.set(testCase.query, await getSemanticScoreMap(products, testCase.query));
    }

    outputs.systems[splitName].semantic = await runSystem(
      "semantic",
      query => semanticRank(query, products.map(product => ({
        ...product,
        semanticScore: semanticCache.get(query)?.get(String(product.id)) ?? 0
      }))),
      cases
    );

    outputs.systems[splitName].hybrid = await runSystem(
      "hybrid",
      query => hybridRetrieve(
        products.map(product => ({
          ...product,
          semanticScore: semanticCache.get(query)?.get(String(product.id)) ?? 0
        })),
        query,
        { limit: products.length, candidateLimit: products.length, lexicalLimit: products.length, semanticLimit: products.length }
      ).results.map(item => String(item.product.id)),
      cases
    );
  }

  if (imageAudit.productsWithImage > 0) {
    const multimodalCases = [...validationCases, ...heldOutCases];
    const started = Date.now();
    const perQuery = [];
    for (const testCase of multimodalCases) {
      const ranked = await rankImagesByText(testCase.query, products, { skipErrors: true });
      perQuery.push({ query: testCase.query, validImageResults: ranked.length, topK: ids(ranked.slice(0, K)) });
    }
    outputs.multimodal = {
      status: "executed",
      elapsedMs: Date.now() - started,
      validImageResults: perQuery.reduce((sum, row) => sum + row.validImageResults, 0),
      queries: perQuery.length,
      results: perQuery
    };
  } else {
    outputs.multimodal = {
      status: "blocked-pending-image-assets",
      reason: "No supported image field exists in the canonical product catalogue.",
      model: MULTIMODAL_MODEL
    };
  }

  const outputDir = path.join(repoRoot, "evaluation-results");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "benchmark-v1-report.json"),
    JSON.stringify(outputs, null, 2)
  );

  console.log(JSON.stringify(outputs, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
