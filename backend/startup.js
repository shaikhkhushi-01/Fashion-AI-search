/**
 * DAY 13 — STARTUP VALIDATION
 *
 * Performs deterministic checks before the API starts.
 */

const fs = require("fs");
const path = require("path");

const config = require("./config");

function validateNodeVersion() {
  const major = Number(
    process.versions.node.split(".")[0]
  );

  if (!Number.isFinite(major)) {
    throw new Error(
      "Unable to determine Node.js version."
    );
  }

  if (major < 18) {
    throw new Error(
      `Node.js 18+ is required. Current version: ${process.versions.node}`
    );
  }

  return {
    passed: true,
    version: process.versions.node
  };
}

function loadProducts() {
  const dataPath = path.resolve(
    config.dataPath
  );

  if (!fs.existsSync(dataPath)) {
    throw new Error(
      `Product dataset not found: ${dataPath}`
    );
  }

  const raw = fs.readFileSync(
    dataPath,
    "utf8"
  );

  let products;

  try {
    products = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Invalid products JSON: ${error.message}`
    );
  }

  if (!Array.isArray(products)) {
    throw new Error(
      "products.json must contain an array."
    );
  }

  return {
    products,
    dataPath
  };
}

function validateProducts(products) {
  const errors = [];
  const warnings = [];

  const ids = new Set();

  for (let index = 0; index < products.length; index++) {
    const product = products[index];

    if (
      !product ||
      typeof product !== "object"
    ) {
      errors.push(
        `Product at index ${index} is not an object.`
      );

      continue;
    }

    if (
      product.id === undefined ||
      product.id === null
    ) {
      errors.push(
        `Product at index ${index} is missing id.`
      );
    } else {
      const id = String(product.id);

      if (ids.has(id)) {
        errors.push(
          `Duplicate product id detected: ${id}`
        );
      }

      ids.add(id);
    }

    if (
      !product.name ||
      typeof product.name !== "string"
    ) {
      errors.push(
        `Product ${product.id ?? index} is missing a valid name.`
      );
    }

    if (
      product.category === undefined ||
      product.category === null
    ) {
      warnings.push(
        `Product ${product.id ?? index} has no category.`
      );
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    totalProducts: products.length,
    uniqueProductIds: ids.size
  };
}

function validateConfiguration() {
  const errors = [];
  const warnings = [];

  if (
    !Number.isInteger(config.port) ||
    config.port <= 0 ||
    config.port > 65535
  ) {
    errors.push(
      `Invalid PORT: ${config.port}`
    );
  }

  if (
    config.defaultSearchLimit <= 0
  ) {
    errors.push(
      "DEFAULT_SEARCH_LIMIT must be greater than 0."
    );
  }

  if (
    config.maxSearchLimit <
    config.defaultSearchLimit
  ) {
    errors.push(
      "MAX_SEARCH_LIMIT must be >= DEFAULT_SEARCH_LIMIT."
    );
  }

  if (
    config.corsOrigin === "*"
  ) {
    warnings.push(
      "CORS_ORIGIN is currently '*'. Restrict this in production if required."
    );
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

function validateStartup() {
  const node = validateNodeVersion();

  const {
    products,
    dataPath
  } = loadProducts();

  const productValidation =
    validateProducts(products);

  const configuration =
    validateConfiguration();

  const errors = [
    ...productValidation.errors,
    ...configuration.errors
  ];

  const warnings = [
    ...productValidation.warnings,
    ...configuration.warnings
  ];

  return {
    passed: errors.length === 0,

    node,

    dataset: {
      path: dataPath,
      ...productValidation
    },

    configuration,

    errors,

    warnings,

    timestamp:
      new Date().toISOString()
  };
}

function assertStartupValid() {
  const result =
    validateStartup();

  if (!result.passed) {
    console.error(
      "\nStartup validation failed."
    );

    for (const error of result.errors) {
      console.error(
        `- ${error}`
      );
    }

    throw new Error(
      "Application startup validation failed."
    );
  }

  if (
    result.warnings.length > 0
  ) {
    console.warn(
      "\nStartup warnings:"
    );

    for (const warning of result.warnings) {
      console.warn(
        `- ${warning}`
      );
    }
  }

  return result;
}

module.exports = {
  validateNodeVersion,
  loadProducts,
  validateProducts,
  validateConfiguration,
  validateStartup,
  assertStartupValid
};
