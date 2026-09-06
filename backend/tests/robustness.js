import fs from "fs";
import path from "path";
import {
  sanitizeProducts,
  runRobustnessChecks,
  benchmarkSearch,
  createRobustnessReport
} from "../services/robustness.js";
import { products } from "./evaluation-cases.js";

const catalogue = sanitizeProducts(products);

function searchProducts(query) {
  const normalized = String(query ?? "")
    .toLowerCase()
    .trim();

  if (!normalized) {
    return catalogue;
  }

  const tokens = normalized
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  return catalogue
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
        product.tags.join(" ")
      ]
        .join(" ")
        .toLowerCase();

      const matched = tokens.filter(
        token => text.includes(token)
      );

      return {
        ...product,
        score:
          tokens.length > 0
            ? matched.length / tokens.length
            : 0
      };
    })
    .filter(product => product.score > 0)
    .sort((a, b) => b.score - a.score);
}

const robustness =
  runRobustnessChecks(
    catalogue,
    searchProducts
  );

const benchmarkQueries = [
  "black formal shirt",
  "blue sneakers",
  "cotton hoodie",
  "dress for evening",
  "shirt under 3000"
];

const benchmark = benchmarkSearch(
  searchProducts,
  benchmarkQueries,
  100
);

const report =
  createRobustnessReport(
    robustness,
    benchmark
  );

const outputDirectory =
  path.resolve("evaluation-results");

fs.mkdirSync(outputDirectory, {
  recursive: true
});

fs.writeFileSync(
  path.join(
    outputDirectory,
    "robustness-report.json"
  ),
  JSON.stringify(report, null, 2)
);

console.log(
  JSON.stringify(
    {
      successRate:
        robustness.successRate,
      failedCases:
        robustness.failedCases,
      averageSearchMs:
        benchmark.averageMs,
      maxSearchMs:
        benchmark.maxMs
    },
    null,
    2
  )
);
