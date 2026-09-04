/**
 * DAY 13 — APPLICATION CONFIGURATION
 *
 * Centralizes environment configuration so that
 * local development, CI and deployment use the
 * same configuration interface.
 */

const path = require("path");

function parseInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function parseFloatValue(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

const config = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: parseInteger(
    process.env.PORT,
    3000
  ),

  host:
    process.env.HOST ||
    "0.0.0.0",

  modelName:
    process.env.MODEL_NAME ||
    "Xenova/all-MiniLM-L6-v2",

  dataPath:
    process.env.DATA_PATH ||
    path.join(
      __dirname,
      "..",
      "data",
      "products.json"
    ),

  defaultSearchLimit: parseInteger(
    process.env.DEFAULT_SEARCH_LIMIT,
    10
  ),

  maxSearchLimit: parseInteger(
    process.env.MAX_SEARCH_LIMIT,
    50
  ),

  minimumSearchScore: parseFloatValue(
    process.env.MINIMUM_SEARCH_SCORE,
    0
  ),

  corsOrigin:
    process.env.CORS_ORIGIN ||
    "*",

  enableRequestLogging:
    process.env.ENABLE_REQUEST_LOGGING !==
    "false",

  version:
    process.env.APP_VERSION ||
    "day-13-reproducible"
};

module.exports = config;
