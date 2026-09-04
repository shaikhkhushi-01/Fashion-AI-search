/**
 * DAY 13 — DEPLOYMENT SMOKE TEST
 *
 * Validates that core application modules can load
 * and the dataset is readable.
 */

const fs = require("fs");
const path = require("path");

const {
  validateStartup
} = require("../startup");

function main() {
  console.log(
    "\n============================================================"
  );

  console.log(
    "DAY 13 — DEPLOYMENT SMOKE TEST"
  );

  console.log(
    "============================================================"
  );

  const checks = [];

  try {
    const startup =
      validateStartup();

    checks.push({
      name: "startup_validation",
      passed: startup.passed
    });
  } catch (error) {
    checks.push({
      name: "startup_validation",
      passed: false,
      error: error.message
    });
  }

  try {
    const aiSearch =
      require("../services/aiSearch");

    checks.push({
      name: "ai_search_module",
      passed:
        typeof aiSearch.searchProducts ===
        "function"
    });
  } catch (error) {
    checks.push({
      name: "ai_search_module",
      passed: false,
      error: error.message
    });
  }

  try {
    const evaluation =
      require("../services/evaluation");

    checks.push({
      name: "evaluation_module",
      passed:
        typeof evaluation.evaluateDataset ===
        "function"
    });
  } catch (error) {
    checks.push({
      name: "evaluation_module",
      passed: false,
      error: error.message
    });
  }

  try {
    const productsPath =
      path.join(
        __dirname,
        "..",
        "..",
        "data",
        "products.json"
      );

    const exists =
      fs.existsSync(productsPath);

    checks.push({
      name: "dataset_file",
      passed: exists
    });
  } catch (error) {
    checks.push({
      name: "dataset_file",
      passed: false,
      error: error.message
    });
  }

  console.log("");

  for (const check of checks) {
    console.log(
      `${check.passed ? "PASS" : "FAIL"}  ${check.name}`
    );

    if (check.error) {
      console.log(
        `      ${check.error}`
      );
    }
  }

  const allPassed =
    checks.every(
      (check) => check.passed
    );

  console.log("");

  console.log(
    `Overall: ${
      allPassed
        ? "PASS"
        : "FAIL"
    }`
  );

  process.exit(
    allPassed ? 0 : 1
  );
}

main();
