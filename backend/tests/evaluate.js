import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  compareSystems,
  createEvaluationReport
} from "../services/evaluation.js";
import { products, evaluationCases } from "./evaluation-cases.js";
import { lexicalScore, attributeScore, budgetScore } from "../services/hybridRetrieval.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function tokenize(value) {
  return String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function baselineSearch(query) {
  const queryTokens = tokenize(query);

  return products
    .map(product => {
      const text = [
        product.name,
        product.brand,
        product.category,
        product.gender,
        product.color,
        product.style,
        product.occasion,
        product.material,
        product.description,
        product.tags
      ]
        .flatMap(value => tokenize(value))
        .join(" ");

      const matches = queryTokens.filter(token => text.includes(token)).length;

      return {
        id: product.id,
        score: matches / Math.max(queryTokens.length, 1)
      };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => String(item.id));
}

function lexicalSystem(query) {
  return products
    .map(product => ({
      id: product.id,
      score: lexicalScore(query, product)
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => String(item.id));
}

function attributeSystem(query) {
  return products
    .map(product => ({
      id: product.id,
      score: attributeScore(query, product)
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => String(item.id));
}

function hybridSystem(query) {
  return products
    .map(product => {
      const lexical = lexicalScore(query, product);
      const attribute = attributeScore(query, product);
      const budget = budgetScore(query, product);

      return {
        id: product.id,
        score:
          lexical * 0.5 +
          attribute * 0.35 +
          budget * 0.15
      };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => String(item.id));
}

const systems = {
  baseline: baselineSearch,
  lexical: lexicalSystem,
  attribute: attributeSystem,
  hybrid: hybridSystem
};

const results = compareSystems(
  evaluationCases,
  systems,
  {
    k: 5
  }
);

const report = createEvaluationReport(results);

const outputPath = path.join(
  __dirname,
  "..",
  "evaluation-results",
  "evaluation-report.json"
);

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true
});

fs.writeFileSync(
  outputPath,
  JSON.stringify(report, null, 2)
);

console.log(JSON.stringify(report, null, 2));
console.log(`Evaluation report written to ${outputPath}`);
