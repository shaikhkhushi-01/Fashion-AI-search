/*
=========================================================
FASHION AI DISCOVERY
DAY 13 - REPRODUCIBILITY CHECK
=========================================================
*/

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

import { searchProducts } from "../services/aiSearch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR =
  path.join(__dirname, "..", "..");

const DATASET_PATH =
  path.join(
    ROOT_DIR,
    "data",
    "products.json"
  );

const RESULTS_DIR =
  path.join(
    __dirname,
    "..",
    "evaluation-results"
  );

const REPORT_PATH =
  path.join(
    RESULTS_DIR,
    "day13-reproducibility-report.json"
  );

const TEST_QUERIES = [
  "black shirt",
  "summer dress",
  "comfortable casual clothes",
  "formal office outfit",
  "wedding outfit",
  "white sneakers"
];

function sha256File(filePath) {
  const buffer =
    fs.readFileSync(filePath);

  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
}

function loadProducts() {
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(
      `Dataset not found: ${DATASET_PATH}`
    );
  }

  const raw =
    fs.readFileSync(
      DATASET_PATH,
      "utf8"
    );

  const parsed =
    JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Dataset must be a JSON array."
    );
  }

  return parsed;
}

function productId(product) {
  return String(
    product?.id ??
    product?._id ??
    product?.product_id ??
    ""
  );
}

function getRanking(products, query) {
  const results =
    searchProducts(
      products,
      query,
      {
        limit: 10,
        minScore: 0
      }
    );

  return results.map(
    product => ({
      id: productId(product),

      score:
        Number(
          product.matchScore ??
          product.hybridScore ??
          product.score ??
          0
        )
    })
  );
}

function compareRankings(
  first,
  second
) {
  return (
    JSON.stringify(first) ===
    JSON.stringify(second)
  );
}

function runDeterminismCheck(products) {
  const checks = [];

  for (
    const query of TEST_QUERIES
  ) {
    const first =
      getRanking(
        products,
        query
      );

    const second =
      getRanking(
        products,
        query
      );

    checks.push({
      query,

      deterministic:
        compareRankings(
          first,
          second
        ),

      firstRanking:
        first,

      secondRanking:
        second
    });
  }

  return checks;
}

function checkUniqueIds(products) {
  const ids =
    products.map(productId);

  const unique =
    new Set(ids);

  return {
    totalIds:
      ids.length,

    uniqueIds:
      unique.size,

    duplicates:
      ids.filter(
        (id, index) =>
          id &&
          ids.indexOf(id) !== index
      )
  };
}

function main() {
  console.log(
    "\n========================================================="
  );

  console.log(
    "DAY 13 — REPRODUCIBILITY CHECK"
  );

  console.log(
    "=========================================================\n"
  );

  const products =
    loadProducts();

  const datasetHash =
    sha256File(
      DATASET_PATH
    );

  console.log(
    `Dataset size: ${products.length}`
  );

  console.log(
    `Dataset SHA-256: ${datasetHash}`
  );

  const idCheck =
    checkUniqueIds(
      products
    );

  const determinism =
    runDeterminismCheck(
      products
    );

  const deterministicFailures =
    determinism.filter(
      item =>
        !item.deterministic
    );

  const reproducible =
    deterministicFailures.length === 0;

  const report = {
    experiment:
      "Day 13 — Reproducibility Check",

    version:
      "day-13",

    timestamp:
      new Date().toISOString(),

    runtime: {
      node:
        process.version,

      platform:
        process.platform,

      architecture:
        process.arch
    },

    dataset: {
      path:
        DATASET_PATH,

      productCount:
        products.length,

      sha256:
        datasetHash,

      idCheck
    },

    search: {
      queryCount:
        TEST_QUERIES.length,

      queries:
        TEST_QUERIES
    },

    determinism: {
      reproducible,

      totalTests:
        determinism.length,

      failures:
        deterministicFailures.length,

      checks:
        determinism
    },

    overallPass:
      reproducible &&
      idCheck.duplicates.length === 0
  };

  fs.mkdirSync(
    RESULTS_DIR,
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      report,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    "\n--- Reproducibility Results ---"
  );

  for (
    const check of determinism
  ) {
    console.log(
      `${check.deterministic ? "PASS" : "FAIL"} | ${check.query}`
    );
  }

  console.log(
    `\nDuplicate IDs: ${idCheck.duplicates.length}`
  );

  console.log(
    `Overall: ${
      report.overallPass
        ? "PASS"
        : "FAIL"
    }`
  );

  console.log(
    `\nReport saved to: ${REPORT_PATH}`
  );

  if (!report.overallPass) {
    process.exitCode = 1;
  }
}

main();
