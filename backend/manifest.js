/**
 * DAY 13 — RESEARCH / REPRODUCIBILITY MANIFEST
 *
 * Captures the configuration and dataset information
 * needed to reproduce experiments.
 */

const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const config = require("./config");

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");

  const fileBuffer =
    fs.readFileSync(filePath);

  hash.update(fileBuffer);

  return hash.digest("hex");
}

function getDatasetMetadata() {
  const dataPath = path.resolve(
    config.dataPath
  );

  if (!fs.existsSync(dataPath)) {
    return {
      exists: false,
      path: dataPath
    };
  }

  const stats =
    fs.statSync(dataPath);

  let products = [];

  try {
    products = JSON.parse(
      fs.readFileSync(
        dataPath,
        "utf8"
      )
    );
  } catch {
    products = [];
  }

  return {
    exists: true,

    path: dataPath,

    sizeBytes: stats.size,

    modifiedAt:
      stats.mtime.toISOString(),

    sha256:
      sha256File(dataPath),

    productCount:
      Array.isArray(products)
        ? products.length
        : 0
  };
}

function getPackageMetadata() {
  const packagePath =
    path.join(
      __dirname,
      "package.json"
    );

  if (!fs.existsSync(packagePath)) {
    return null;
  }

  const packageJson =
    JSON.parse(
      fs.readFileSync(
        packagePath,
        "utf8"
      )
    );

  return {
    name: packageJson.name,
    version: packageJson.version,
    engines: packageJson.engines || null
  };
}

function createManifest() {
  return {
    manifestVersion: "1.0.0",

    generatedAt:
      new Date().toISOString(),

    runtime: {
      node:
        process.version,

      platform:
        process.platform,

      architecture:
        process.arch
    },

    application: {
      version:
        config.version,

      environment:
        config.nodeEnv,

      model:
        config.modelName
    },

    retrieval: {
      defaultSearchLimit:
        config.defaultSearchLimit,

      maxSearchLimit:
        config.maxSearchLimit,

      minimumSearchScore:
        config.minimumSearchScore
    },

    dataset:
      getDatasetMetadata(),

    package:
      getPackageMetadata(),

    reproducibility: {
      deterministicDatasetHash:
        getDatasetMetadata().sha256 || null,

      note:
        "Use the dataset SHA-256 together with the application version and experiment reports to identify the exact dataset state used for evaluation."
    }
  };
}

module.exports = {
  sha256File,
  getDatasetMetadata,
  getPackageMetadata,
  createManifest
};
