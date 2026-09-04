import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { searchProducts } from "../services/aiSearch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, "..", "..");
const PRODUCTS_PATH = path.join(PROJECT_ROOT, "data", "products.json");
const RESULTS_DIR = path.join(__dirname, "..", "evaluation-results");
const REPORT_PATH = path.join(RESULTS_DIR, "day12-robustness-report.json");

const WARMUP_RUNS = 2;
const BENCHMARK_RUNS = 10;
const SEARCH_LIMIT = 10;

function loadProducts() {
  if (!fs.existsSync(PRODUCTS_PATH)) {
    throw new Error(`Products dataset not found: ${PRODUCTS_PATH}`);
  }

  const raw = fs.readFileSync(PRODUCTS_PATH, "utf8");
  const products = JSON.parse(raw);

  if (!Array.isArray(products)) {
    throw new Error("Dataset must be a JSON array.");
  }

  return products;
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function getProductId(product) {
  return String(product?.id ?? product?._id ?? product?.product_id ?? "");
}

function validateResults(results) {
  const errors = [];

  if (!Array.isArray(results)) {
    return ["Search result is not an array."];
  }

  const ids = results.map(getProductId);

  const duplicateIds = ids.filter(
    (id, index) => id && ids.indexOf(id) !== index
  );

  if (duplicateIds.length > 0) {
    errors.push(
      `Duplicate result IDs detected: ${[
        ...new Set(duplicateIds)
      ].join(", ")}`
    );
  }

  for (const result of results) {
    if (!result || typeof result !== "object") {
      errors.push("Invalid result object detected.");
      continue;
    }

    if (!getProductId(result)) {
      errors.push("Result without product ID detected.");
    }

    if (result.matchScore !== undefined) {
      const score = Number(result.matchScore);

      if (!Number.isFinite(score)) {
        errors.push(`Invalid matchScore for product ${getProductId(result)}.`);
      }
    }
  }

  return errors;
}

function safeSearch(products, query, options = {}) {
  const start = performance.now();

  try {
    const results = searchProducts(products, query, {
      limit: SEARCH_LIMIT,
      minScore: 0,
      ...options
    });

    const latencyMs = performance.now() - start;

    return {
      success: true,
      query,
      latencyMs: Number(latencyMs.toFixed(3)),
      resultCount: Array.isArray(results) ? results.length : 0,
      validationErrors: validateResults(results),
      results
    };
  } catch (error) {
    return {
      success: false,
      query,
      latencyMs: Number((performance.now() - start).toFixed(3)),
      resultCount: 0,
      validationErrors: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function runEdgeCaseTests(products) {
  const cases = [
    {
      name: "empty_query",
      query: ""
    },
    {
      name: "whitespace_query",
      query: "     "
    },
    {
      name: "very_short_query",
      query: "a"
    },
    {
      name: "normal_query",
      query: "black shirt"
    },
    {
      name: "mixed_case_query",
      query: "BLACK SHIRT"
    },
    {
      name: "extra_spaces",
      query: "black    cotton     shirt"
    },
    {
      name: "punctuation_query",
      query: "black-shirt!!!"
    },
    {
      name: "numeric_query",
      query: "2000"
    },
    {
      name: "budget_query",
      query: "black shirt under 2500"
    },
    {
      name: "unknown_category",
      query: "quantum cyber jacket"
    },
    {
      name: "non_fashion_query",
      query: "football stadium"
    },
    {
      name: "unicode_query",
      query: "काला शर्ट"
    },
    {
      name: "long_query",
      query:
        "I am looking for a comfortable minimal black cotton shirt for casual everyday college travel use under 3000 rupees"
    }
  ];

  return cases.map((testCase) => {
    const result = safeSearch(products, testCase.query);

    return {
      name: testCase.name,
      query: testCase.query,
      success: result.success,
      latencyMs: result.latencyMs,
      resultCount: result.resultCount,
      validationErrors: result.validationErrors,
      error: result.error ?? null
    };
  });
}

function runOptionTests(products) {
  const tests = [
    {
      name: "zero_limit",
      options: {
        limit: 0
      }
    },
    {
      name: "negative_limit",
      options: {
        limit: -10
      }
    },
    {
      name: "large_limit",
      options: {
        limit: 100000
      }
    },
    {
      name: "minimum_score_zero",
      options: {
        minScore: 0
      }
    },
    {
      name: "high_minimum_score",
      options: {
        minScore: 0.99
      }
    }
  ];

  return tests.map((test) => {
    const result = safeSearch(
      products,
      "black shirt",
      test.options
    );

    return {
      name: test.name,
      options: test.options,
      success: result.success,
      latencyMs: result.latencyMs,
      resultCount: result.resultCount,
      validationErrors: result.validationErrors,
      error: result.error ?? null
    };
  });
}

function benchmarkQuery(products, query) {
  const latencies = [];

  for (let i = 0; i < WARMUP_RUNS; i += 1) {
    safeSearch(products, query);
  }

  for (let i = 0; i < BENCHMARK_RUNS; i += 1) {
    const result = safeSearch(products, query);

    if (result.success) {
      latencies.push(result.latencyMs);
    }
  }

  if (latencies.length === 0) {
    return {
      query,
      runs: BENCHMARK_RUNS,
      successfulRuns: 0,
      meanMs: null,
      minMs: null,
      maxMs: null
    };
  }

  const mean =
    latencies.reduce((sum, value) => sum + value, 0) /
    latencies.length;

  return {
    query,
    runs: BENCHMARK_RUNS,
    successfulRuns: latencies.length,
    meanMs: Number(mean.toFixed(3)),
    minMs: Number(Math.min(...latencies).toFixed(3)),
    maxMs: Number(Math.max(...latencies).toFixed(3))
  };
}

function runPerformanceBenchmark(products) {
  const queries = [
    "black shirt",
    "summer dress",
    "comfortable casual clothes",
    "formal office outfit",
    "wedding elegant outfit",
    "white sneakers",
    "winter coat",
    "traditional festive clothing"
  ];

  return queries.map((query) =>
    benchmarkQuery(products, query)
  );
}

function checkDeterminism(products) {
  const queries = [
    "black shirt",
    "summer dress",
    "formal outfit",
    "comfortable casual clothing"
  ];

  const results = [];

  for (const query of queries) {
    const first = safeSearch(products, query);
    const second = safeSearch(products, query);

    const firstIds = (first.results ?? []).map(getProductId);
    const secondIds = (second.results ?? []).map(getProductId);

    const deterministic =
      JSON.stringify(firstIds) === JSON.stringify(secondIds);

    results.push({
      query,
      deterministic,
      firstResultIds: firstIds,
      secondResultIds: secondIds
    });
  }

  return results;
}

function summarize(edgeCases, optionTests, benchmark, determinism) {
  const edgeFailures = edgeCases.filter(
    (item) =>
      !item.success ||
      item.validationErrors.length > 0
  );

  const optionFailures = optionTests.filter(
    (item) =>
      !item.success ||
      item.validationErrors.length > 0
  );

  const determinismFailures = determinism.filter(
    (item) => !item.deterministic
  );

  const successfulBenchmarks = benchmark.filter(
    (item) => item.successfulRuns > 0
  );

  const meanLatency =
    successfulBenchmarks.length > 0
      ? successfulBenchmarks.reduce(
          (sum, item) => sum + item.meanMs,
          0
        ) / successfulBenchmarks.length
      : null;

  return {
    edgeCaseTests: edgeCases.length,
    edgeCaseFailures: edgeFailures.length,
    optionTests: optionTests.length,
    optionFailures: optionFailures.length,
    determinismTests: determinism.length,
    determinismFailures: determinismFailures.length,
    benchmarkQueries: benchmark.length,
    meanBenchmarkLatencyMs:
      meanLatency === null
        ? null
        : Number(meanLatency.toFixed(3)),
    overallPass:
      edgeFailures.length === 0 &&
      optionFailures.length === 0 &&
      determinismFailures.length === 0 &&
      successfulBenchmarks.length === benchmark.length
  };
}

function main() {
  console.log("\n======================================");
  console.log("DAY 12 — ROBUSTNESS & PERFORMANCE");
  console.log("======================================\n");

  const products = loadProducts();

  console.log(`Dataset size: ${products.length}`);

  const edgeCases = runEdgeCaseTests(products);
  const optionTests = runOptionTests(products);
  const determinism = checkDeterminism(products);
  const benchmark = runPerformanceBenchmark(products);

  const summary = summarize(
    edgeCases,
    optionTests,
    benchmark,
    determinism
  );

  console.log("\n--- Edge Cases ---");

  for (const result of edgeCases) {
    console.log(
      `${result.success && result.validationErrors.length === 0 ? "PASS" : "FAIL"} | ` +
        `${result.name} | ` +
        `${result.resultCount} results | ` +
        `${result.latencyMs} ms`
    );
  }

  console.log("\n--- Option Tests ---");

  for (const result of optionTests) {
    console.log(
      `${result.success && result.validationErrors.length === 0 ? "PASS" : "FAIL"} | ` +
        `${result.name} | ` +
        `${result.resultCount} results`
    );
  }

  console.log("\n--- Determinism ---");

  for (const result of determinism) {
    console.log(
      `${result.deterministic ? "PASS" : "FAIL"} | ${result.query}`
    );
  }

  console.log("\n--- Performance ---");

  for (const result of benchmark) {
    console.log(
      `${result.query} | mean=${result.meanMs} ms | ` +
        `min=${result.minMs} ms | max=${result.maxMs} ms`
    );
  }

  console.log("\n--- Summary ---");
  console.log(summary);

  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const report = {
    experiment: "Day 12 — Robustness, Edge Cases and Performance",
    version: "day-12",
    timestamp: new Date().toISOString(),

    configuration: {
      datasetPath: PRODUCTS_PATH,
      datasetSize: products.length,
      warmupRuns: WARMUP_RUNS,
      benchmarkRuns: BENCHMARK_RUNS,
      searchLimit: SEARCH_LIMIT
    },

    summary,

    edgeCases,
    optionTests,
    determinism,
    performance: benchmark
  };

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log(
    `\nReport saved to: ${REPORT_PATH}`
  );

  if (!summary.overallPass) {
    console.error(
      "\nDay 12 robustness checks completed with failures."
    );

    process.exitCode = 1;
    return;
  }

  console.log(
    "\nDAY 12 ROBUSTNESS CHECKS PASSED."
  );
}

main();
