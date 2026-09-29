import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { rankBm25 } from "../services/bm25.js";
import { lexicalScore, hybridRetrieve } from "../services/hybridRetrieval.js";
import { getSemanticScoreMap, getModelName } from "../services/semanticSearch.js";
import { evaluationCases } from "./evaluation-cases.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "..", "..");
const products = JSON.parse(fs.readFileSync(path.join(repoRoot, "data", "products.json"), "utf8"));
const QUERY_COUNT = 100;
const CANDIDATES_PER_QUERY = 10;

function lexicalRank(query) {
  return products.map((product, index) => ({ product, score: lexicalScore(query, product), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.product);
}

function seededHash(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function blindedOrder(queryId, productIds) {
  return [...productIds].sort((a, b) => seededHash(queryId + "::" + a) - seededHash(queryId + "::" + b) || String(a).localeCompare(String(b), undefined, { numeric: true }));
}

function rrfTopIds(lists) {
  const scores = new Map();
  for (const list of lists) {
    list.slice(0, CANDIDATES_PER_QUERY).forEach((product, index) => {
      const id = String(product.id);
      scores.set(id, (scores.get(id) || 0) + 1 / (60 + index + 1));
    });
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { numeric: true }))
    .slice(0, CANDIDATES_PER_QUERY)
    .map(([id]) => id);
}

function publicProduct(product, candidateIndex) {
  return {
    candidateId: "c" + String(candidateIndex + 1).padStart(2, "0"),
    productId: String(product.id),
    name: product.name ?? "",
    brand: product.brand ?? "",
    category: product.category ?? "",
    gender: product.gender ?? "",
    color: product.color ?? "",
    material: product.material ?? "",
    style: product.style ?? "",
    occasion: product.occasion ?? "",
    price: product.price ?? null,
    description: product.description ?? "",
    image: product.image ?? product.imageUrl ?? product.image_url ?? product.thumbnail ?? null
  };
}

async function main() {
  if (products.length !== 407) throw new Error("Expected 407 catalog products; found " + products.length);
  if (evaluationCases.length !== 250) throw new Error("Expected 250 evaluation queries; found " + evaluationCases.length);

  const queries = evaluationCases.slice(0, QUERY_COUNT);
  const taskRows = [];
  const systemMetadata = {
    systemsUsedForCandidateGeneration: ["bm25", "lexical", "semantic", "hybrid"],
    semanticModel: getModelName(),
    candidateSelection: "top-10 per system, union by product id, deterministic reciprocal-rank fusion, final 10",
    displayOrder: "deterministic seeded randomization by queryId/productId",
    relevanceLabels: "not included; human annotators must assign 0-4",
    syntheticBenchmarkLabels: "not exported to annotators"
  };

  for (let i = 0; i < queries.length; i += 1) {
    const query = queries[i].query;
    const bm25 = rankBm25(products, query);
    const lexical = lexicalRank(query);
    const semanticScores = await getSemanticScoreMap(products, query);
    const semantic = products.map((product, index) => ({ product, score: semanticScores?.get(String(product.id)) ?? 0, index }))
      .sort((a, b) => b.score - a.score || a.index - b.index).map(item => item.product);
    const hybrid = hybridRetrieve(products, query, { limit: CANDIDATES_PER_QUERY, candidateLimit: CANDIDATES_PER_QUERY, lexicalLimit: CANDIDATES_PER_QUERY, semanticLimit: CANDIDATES_PER_QUERY }).results.map(item => item.product);
    const ids = rrfTopIds([bm25, lexical, semantic, hybrid]);
    const productById = new Map(products.map(product => [String(product.id), product]));
    const orderedIds = blindedOrder("q" + String(i + 1).padStart(3, "0"), ids);
    const candidates = orderedIds.map((id, index) => publicProduct(productById.get(id), index));

    taskRows.push({
      queryId: "q" + String(i + 1).padStart(3, "0"),
      query,
      candidates,
      annotation: { annotatorId: "", relevance: null }
    });
  }

  const outputDir = path.join(repoRoot, "research", "human-evaluation");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "annotation-task-v1.json"), JSON.stringify({
    version: "v1",
    status: "ready-for-human-annotation",
    protocol: "human-evaluation-v1",
    queryCount: taskRows.length,
    candidatesPerQuery: CANDIDATES_PER_QUERY,
    systemMetadata,
    tasks: taskRows
  }, null, 2));
  fs.writeFileSync(path.join(outputDir, "annotation-task-v1.jsonl"), taskRows.map(row => JSON.stringify(row)).join("\n") + "\n");
  console.log(JSON.stringify({ status: "created", queryCount: taskRows.length, candidatesPerQuery: CANDIDATES_PER_QUERY, output: "research/human-evaluation/annotation-task-v1.jsonl" }, null, 2));
}

main().catch(error => { console.error(error); process.exit(1); });