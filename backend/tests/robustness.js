/**
 * DAY 12 — ROBUSTNESS TEST RUNNER
 *
 * Runs edge-case, corrupted-data and performance
 * experiments against the real Fashion AI retrieval engine.
 */

const fs = require("fs");
const path = require("path");

const {
  runRobustnessEvaluation
} = require("../services/robustness");

/* =========================================================
   PATHS
   ========================================================= */

const PRODUCTS_PATH = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "products.json"
);

const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "evaluation-results"
);

const OUTPUT_PATH = path.join(
  OUTPUT_DIR,
  "day12-robustness-report.json"
);

/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

function loadProducts() {
  if (!fs.existsSync(PRODUCTS_PATH)) {
    throw new Error(
      `Products file not found: ${PRODUCTS_PATH}`
    );
  }

  const raw = fs.readFileSync(
    PRODUCTS_PATH,
    "utf8"
  );

  const products = JSON.parse(raw);

  if (!Array.isArray(products)) {
    throw new Error(
      "products.json must contain an array."
    );
  }

  return products;
}

/* =========================================================
   PRINT HELPERS
   ========================================================= */

function format(value) {
  return Number.isFinite(value)
    ? value.toFixed(3)
    : "N/A";
}

function printHeader(title) {
  console.log("\n");
  console.log("=".repeat(72));
  console.log(title);
  console.log("=".repeat(72));
}

function printQueryResults(cases) {
  console.log(
    "\nQuery Robustness:"
  );

  console.log(
    "ID".padEnd(26) +
    "TYPE".padEnd(20) +
    "RESULTS".padEnd(10) +
    "LATENCY".padEnd(12) +
    "STATUS"
  );

  console.log("-".repeat(80));

  for (const item of cases) {
    console.log(
      item.id.padEnd(26) +
      item.queryType.padEnd(20) +
      String(item.resultCount).padEnd(10) +
      `${format(item.latencyMs)}ms`.padEnd(12) +
      (item.passed ? "PASS" : "FAIL")
    );
  }
}

/* =========================================================
   MAIN
   ========================================================= */

function main() {
  try {
    const products = loadProducts();

    printHeader(
      "DAY 12 — ROBUSTNESS + PERFORMANCE EVALUATION"
    );

    console.log(
      `Products loaded: ${products.length}`
    );

    const report =
      runRobustnessEvaluation(products);

    /* -----------------------------------------------------
       CATALOGUE
       ----------------------------------------------------- */

    printHeader(
      "1. CATALOGUE DATA QUALITY"
    );

    console.log(
      `Total products: ${report.catalogue.totalProducts}`
    );

    console.log(
      `Unique products: ${report.catalogue.uniqueProducts}`
    );

    console.log(
      `Duplicate IDs: ${report.catalogue.duplicateCount}`
    );

    console.log(
      `Invalid products: ${report.catalogue.invalidProductCount}`
    );

    console.log(
      "Missing optional fields:"
    );

    console.table(
      report.catalogue.missingFieldCounts
    );

    /* -----------------------------------------------------
       QUERY ROBUSTNESS
       ----------------------------------------------------- */

    printHeader(
      "2. QUERY ROBUSTNESS"
    );

    console.log(
      `Cases: ${report.queryRobustness.totalCases}`
    );

    console.log(
      `Passed: ${report.queryRobustness.passedCases}`
    );

    console.log(
      `Failed: ${report.queryRobustness.failedCases}`
    );

    console.log(
      `Pass rate: ${(
        report.queryRobustness.passRate * 100
      ).toFixed(2)}%`
    );

    printQueryResults(
      report.queryRobustness.cases
    );

    /* -----------------------------------------------------
       INCOMPLETE DATA
       ----------------------------------------------------- */

    printHeader(
      "3. INCOMPLETE / CORRUPTED DATA"
    );

    console.log(
      `Cases: ${report.incompleteDataRobustness.totalCases}`
    );

    console.log(
      `Passed: ${report.incompleteDataRobustness.passedCases}`
    );

    console.log(
      `Pass rate: ${(
        report.incompleteDataRobustness.passRate * 100
      ).toFixed(2)}%`
    );

    console.table(
      report.incompleteDataRobustness.cases.map(
        (item) => ({
          id: item.id,
          query: item.query,
          results: item.resultCount,
          latencyMs: item.latencyMs,
          passed: item.passed
        })
      )
    );

    /* -----------------------------------------------------
       DUPLICATES
       ----------------------------------------------------- */

    printHeader(
      "4. DUPLICATE PRODUCT HANDLING"
    );

    console.log(
      `Original catalogue size: ${report.duplicateHandling.originalProducts}`
    );

    console.log(
      `Duplicated catalogue size: ${report.duplicateHandling.duplicatedProducts}`
    );

    console.log(
      `Duplicate IDs detected: ${report.duplicateHandling.duplicateIdsDetected.join(", ") || "None"}`
    );

    console.log(
      `Returned results: ${report.duplicateHandling.returnedResults}`
    );

    console.log(
      `Unique returned results: ${report.duplicateHandling.uniqueReturnedResults}`
    );

    console.log(
      `Duplicate results returned: ${report.duplicateHandling.duplicateResultsReturned}`
    );

    /* -----------------------------------------------------
       PERFORMANCE
       ----------------------------------------------------- */

    printHeader(
      "5. RETRIEVAL PERFORMANCE"
    );

    console.log(
      `Iterations: ${report.performance.iterations}`
    );

    console.log(
      `Average latency: ${format(report.performance.averageLatencyMs)} ms`
    );

    console.log(
      `P50 latency: ${format(report.performance.p50LatencyMs)} ms`
    );

    console.log(
      `P95 latency: ${format(report.performance.p95LatencyMs)} ms`
    );

    console.log(
      `Minimum latency: ${format(report.performance.minLatencyMs)} ms`
    );

    console.log(
      `Maximum latency: ${format(report.performance.maxLatencyMs)} ms`
    );

    console.log(
      `Errors: ${report.performance.errors}`
    );

    /* -----------------------------------------------------
       FINAL
       ----------------------------------------------------- */

    printHeader(
      "6. FINAL ROBUSTNESS STATUS"
    );

    console.log(
      `Status: ${report.overall.status}`
    );

    console.log(
      `Passed: ${report.overall.passed}`
    );

    /* -----------------------------------------------------
       SAVE REPORT
       ----------------------------------------------------- */

    fs.mkdirSync(
      OUTPUT_DIR,
      { recursive: true }
    );

    fs.writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(
        report,
        null,
        2
      ),
      "utf8"
    );

    console.log(
      `\nReport saved to: ${OUTPUT_PATH}`
    );

    /*
     * Important:
     * Do not fail deployment only because the
     * research robustness benchmark found an issue.
     *
     * The benchmark reports scientific results.
     */

    process.exit(0);
  } catch (error) {
    console.error(
      "\nDAY 12 ROBUSTNESS TEST FAILED"
    );

    console.error(
      error?.stack || error
    );

    process.exit(1);
  }
}

main();
