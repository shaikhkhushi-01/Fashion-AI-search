/**
 * DAY 13 — REPRODUCIBILITY CHECK
 *
 * Verifies that the application environment and dataset
 * can be described deterministically.
 */

const fs = require("fs");
const path = require("path");

const {
  validateStartup
} = require("../startup");

const {
  createManifest
} = require("../manifest");

const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "evaluation-results"
);

const OUTPUT_PATH = path.join(
  OUTPUT_DIR,
  "day13-reproducibility-manifest.json"
);

function main() {
  console.log(
    "\n============================================================"
  );

  console.log(
    "DAY 13 — REPRODUCIBILITY CHECK"
  );

  console.log(
    "============================================================"
  );

  const validation =
    validateStartup();

  console.log(
    `Node.js: ${validation.node.version}`
  );

  console.log(
    `Dataset products: ${validation.dataset.totalProducts}`
  );

  console.log(
    `Unique product IDs: ${validation.dataset.uniqueProductIds}`
  );

  console.log(
    `Dataset validation: ${
      validation.dataset.passed
        ? "PASS"
        : "FAIL"
    }`
  );

  console.log(
    `Configuration validation: ${
      validation.configuration.passed
        ? "PASS"
        : "FAIL"
    }`
  );

  if (!validation.passed) {
    console.error(
      "\nValidation errors:"
    );

    for (const error of validation.errors) {
      console.error(
        `- ${error}`
      );
    }

    process.exit(1);
  }

  const manifest =
    createManifest();

  fs.mkdirSync(
    OUTPUT_DIR,
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      manifest,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `\nDataset SHA-256: ${manifest.dataset.sha256}`
  );

  console.log(
    `Manifest saved: ${OUTPUT_PATH}`
  );

  console.log(
    "\nREPRODUCIBILITY CHECK: PASS"
  );

  process.exit(0);
}

main();
