import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
const PYTHON_AI_URL =
  process.env.PYTHON_AI_URL ||
  "http://127.0.0.1:8000";

import {
  searchProducts
} from "./services/aiSearch.js";

import {
  evaluateDataset
} from "./services/evaluation.js";

import evaluationCases from "./tests/evaluation-cases.js";

/*
=========================================================
PATH CONFIGURATION
=========================================================
*/

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const execFileAsync =
  promisify(execFile);

/*
=========================================================
APPLICATION
=========================================================
*/

const app =
  express();

/*
=========================================================
ENVIRONMENT CONFIGURATION
=========================================================
*/

const PORT =
  Number(process.env.PORT) || 10000;

const NODE_ENV =
  process.env.NODE_ENV || "development";

const APP_VERSION =
  process.env.APP_VERSION ||
  "day-13-reproducible";

const MODEL_NAME =
  process.env.MODEL_NAME ||
  "Xenova/all-MiniLM-L6-v2";

const DEFAULT_SEARCH_LIMIT =
  Number(
    process.env.DEFAULT_SEARCH_LIMIT
  ) || 10;

const MAX_SEARCH_LIMIT =
  Number(
    process.env.MAX_SEARCH_LIMIT
  ) || 50;

const MINIMUM_SEARCH_SCORE =
  Number(
    process.env.MINIMUM_SEARCH_SCORE
  ) || 0;

const ENABLE_REQUEST_LOGGING =
  process.env.ENABLE_REQUEST_LOGGING !==
  "false";

const CORS_ORIGIN =
  process.env.CORS_ORIGIN || "*";

/*
=========================================================
CORS
=========================================================
*/

app.use(
  cors({
    origin: CORS_ORIGIN
  })
);

/*
=========================================================
JSON BODY
=========================================================
*/

app.use(
  express.json({
    limit: "1mb"
  })
);

/*
=========================================================
REQUEST LOGGING
=========================================================
*/

if (ENABLE_REQUEST_LOGGING) {
  app.use(
    (req, res, next) => {
      const startedAt =
        Date.now();

      res.on(
        "finish",
        () => {
          const duration =
            Date.now() -
            startedAt;

          console.log(
            `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
          );
        }
      );

      next();
    }
  );
}

/*
=========================================================
PRODUCT DATA
=========================================================
*/

let products = [];

const productsPath =
  path.join(
    __dirname,
    "..",
    "data",
    "products.json"
  );

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

function loadProducts() {
  try {
    if (
      !fs.existsSync(
        productsPath
      )
    ) {
      console.error(
        `Product dataset not found at: ${productsPath}`
      );

      products = [];

      return;
    }

    const rawData =
      fs.readFileSync(
        productsPath,
        "utf-8"
      );

    const parsed =
      JSON.parse(
        rawData
      );

    if (
      Array.isArray(parsed)
    ) {
      products =
        parsed;
    } else if (
      parsed &&
      Array.isArray(
        parsed.products
      )
    ) {
      products =
        parsed.products;
    } else {
      console.error(
        "products.json does not contain a valid product array."
      );

      products = [];
    }

    console.log(
      `Loaded ${products.length} products`
    );
  } catch (error) {
    console.error(
      "Unable to load products.json:",
      error
    );

    products = [];
  }
}

loadProducts();

/*
=========================================================
STARTUP VALIDATION
=========================================================
*/

function validateStartup() {
  const errors = [];
  const warnings = [];

  const nodeMajor =
    Number(
      process.versions.node
        .split(".")[0]
    );

  if (
    !Number.isFinite(nodeMajor) ||
    nodeMajor < 18
  ) {
    errors.push(
      `Node.js 18+ required. Current version: ${process.versions.node}`
    );
  }

  if (
    !Array.isArray(products)
  ) {
    errors.push(
      "Product dataset is not an array."
    );
  } else if (
    products.length === 0
  ) {
    errors.push(
      "Product dataset is empty."
    );
  }

  const ids =
    new Set();

  for (
    const product of products
  ) {
    if (
      !product ||
      typeof product !== "object"
    ) {
      errors.push(
        "Invalid product object detected."
      );

      continue;
    }

    if (
      product.id === undefined ||
      product.id === null
    ) {
      errors.push(
        "Product without ID detected."
      );

      continue;
    }

    const id =
      String(product.id);

    if (
      ids.has(id)
    ) {
      errors.push(
        `Duplicate product ID detected: ${id}`
      );
    }

    ids.add(id);

    if (
      !product.name ||
      typeof product.name !==
        "string"
    ) {
      warnings.push(
        `Product ${id} has no valid name.`
      );
    }
  }

  if (
    DEFAULT_SEARCH_LIMIT <= 0
  ) {
    errors.push(
      "DEFAULT_SEARCH_LIMIT must be greater than 0."
    );
  }

  if (
    MAX_SEARCH_LIMIT <
    DEFAULT_SEARCH_LIMIT
  ) {
    errors.push(
      "MAX_SEARCH_LIMIT must be >= DEFAULT_SEARCH_LIMIT."
    );
  }

  if (
    NODE_ENV === "production" &&
    CORS_ORIGIN === "*"
  ) {
    warnings.push(
      "CORS_ORIGIN is '*' in production."
    );
  }

  if (
    warnings.length
  ) {
    console.warn(
      "\nStartup warnings:"
    );

    for (
      const warning of warnings
    ) {
      console.warn(
        `- ${warning}`
      );
    }
  }

  if (
    errors.length
  ) {
    console.error(
      "\nStartup validation failed:"
    );

    for (
      const error of errors
    ) {
      console.error(
        `- ${error}`
      );
    }

    return false;
  }

  console.log(
    "\nStartup validation passed."
  );

  return true;
}

const startupValid =
  validateStartup();

/*
=========================================================
TEXT HELPERS
=========================================================
*/

function normalizeText(
  value
) {
  return String(
    value ?? ""
  )
    .toLowerCase()
    .trim();
}

function safeArray(
  value
) {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return [value];
  }

  return [];
}

/*
=========================================================
LIMIT
=========================================================
*/

function normalizeLimit(
  value
) {
  let limit =
    Number(value);

  if (
    !Number.isFinite(limit)
  ) {
    limit =
      DEFAULT_SEARCH_LIMIT;
  }

  limit =
    Math.trunc(limit);

  return Math.max(
    1,
    Math.min(
      limit,
      MAX_SEARCH_LIMIT
    )
  );
}

/*
=========================================================
FILTER MATCHING
=========================================================
*/

function matchesFilter(
  product,
  filters = {}
) {
  if (
    filters.category &&
    normalizeText(
      product.category
    ) !==
      normalizeText(
        filters.category
      )
  ) {
    return false;
  }

  if (
    filters.gender &&
    normalizeText(
      product.gender
    ) !==
      normalizeText(
        filters.gender
      )
  ) {
    return false;
  }

  if (
    filters.color &&
    normalizeText(
      product.color
    ) !==
      normalizeText(
        filters.color
      )
  ) {
    return false;
  }

  if (
    filters.style
  ) {
    const styles =
      safeArray(
        product.style
      ).map(
        normalizeText
      );

    if (
      !styles.includes(
        normalizeText(
          filters.style
        )
      )
    ) {
      return false;
    }
  }

  if (
    filters.occasion
  ) {
    const occasions =
      safeArray(
        product.occasion
      ).map(
        normalizeText
      );

    if (
      !occasions.includes(
        normalizeText(
          filters.occasion
        )
      )
    ) {
      return false;
    }
  }

  if (
    filters.material
  ) {
    const materials =
      safeArray(
        product.material
      ).map(
        normalizeText
      );

    if (
      !materials.includes(
        normalizeText(
          filters.material
        )
      )
    ) {
      return false;
    }
  }

  if (
    filters.minPrice !==
      undefined &&
    filters.minPrice !==
      null &&
    filters.minPrice !== ""
  ) {
    const min =
      Number(
        filters.minPrice
      );

    if (
      Number.isFinite(min) &&
      Number(product.price) <
        min
    ) {
      return false;
    }
  }

  if (
    filters.maxPrice !==
      undefined &&
    filters.maxPrice !==
      null &&
    filters.maxPrice !== ""
  ) {
    const max =
      Number(
        filters.maxPrice
      );

    if (
      Number.isFinite(max) &&
      Number(product.price) >
        max
    ) {
      return false;
    }
  }

  return true;
}

/*
=========================================================
FILTER PRODUCTS
=========================================================
*/

function applyFilters(
  items,
  filters = {}
) {
  return items.filter(
    product =>
      matchesFilter(
        product,
        filters
      )
  );
}

/*
=========================================================
SEARCH
=========================================================
*/

function performSearch(
  query = "",
  filters = {},
  sort = "relevance",
  limit
) {
  const filteredProducts =
    applyFilters(
      products,
      filters
    );

  const normalizedQuery =
    String(
      query ?? ""
    ).trim();

  /*
  -------------------------------------------------------
  NO QUERY
  -------------------------------------------------------
  */

  if (
    !normalizedQuery
  ) {
    let results =
      filteredProducts.map(
        product => ({
          ...product,

          matchScore: 50,

          score: 50,

          reasons: [
            "Matches your selected filters."
          ]
        })
      );

    if (
      normalizeText(
        sort
      ) === "price-low"
    ) {
      results.sort(
        (a, b) =>
          Number(a.price || 0) -
          Number(b.price || 0)
      );
    }

    if (
      normalizeText(
        sort
      ) === "price-high"
    ) {
      results.sort(
        (a, b) =>
          Number(b.price || 0) -
          Number(a.price || 0)
      );
    }

    if (
      normalizeText(
        sort
      ) === "newest"
    ) {
      results.sort(
        (a, b) =>
          Number(b.id || 0) -
          Number(a.id || 0)
      );
    }

    return results.slice(
      0,
      normalizeLimit(limit)
    );
  }

  /*
  -------------------------------------------------------
  HYBRID AI SEARCH
  -------------------------------------------------------
  */

  let results =
    searchProducts(
      filteredProducts,
      normalizedQuery,
      {
        limit:
          normalizeLimit(limit),

        minScore:
          MINIMUM_SEARCH_SCORE
      }
    );

  /*
  -------------------------------------------------------
  SORTING
  -------------------------------------------------------
  */

  switch (
    normalizeText(sort)
  ) {
    case "price-low":
    case "price-asc":
      results.sort(
        (a, b) =>
          Number(a.price || 0) -
          Number(b.price || 0)
      );
      break;

    case "price-high":
    case "price-desc":
      results.sort(
        (a, b) =>
          Number(b.price || 0) -
          Number(a.price || 0)
      );
      break;

    case "newest":
      results.sort(
        (a, b) =>
          Number(b.id || 0) -
          Number(a.id || 0)
      );
      break;

    case "relevance":
    default:
      results.sort(
        (a, b) =>
          Number(
            b.hybridScore ??
            b.matchScore ??
            0
          ) -
          Number(
            a.hybridScore ??
            a.matchScore ??
            0
          )
      );
      break;
  }

  return results.slice(
    0,
    normalizeLimit(limit)
  );
}

/*
=========================================================
STYLIST
=========================================================
*/

function buildStylistQuery(
  body = {}
) {
  const parts = [];

  if (
    body.occasion
  ) {
    parts.push(
      body.occasion
    );
  }

  if (
    body.style
  ) {
    parts.push(
      body.style
    );
  }

  if (
    body.comfort
  ) {
    parts.push(
      body.comfort
    );
  }

  if (
    body.color
  ) {
    parts.push(
      body.color
    );
  }

  if (
    body.coverage
  ) {
    parts.push(
      body.coverage
    );
  }

  if (
    body.description
  ) {
    parts.push(
      body.description
    );
  }

  return parts
    .filter(Boolean)
    .join(" ");
}

function stylistReasons(
  product,
  request
) {
  const reasons = [];

  const productStyle =
    safeArray(
      product.style
    ).map(
      normalizeText
    );

  const productOccasion =
    safeArray(
      product.occasion
    ).map(
      normalizeText
    );

  const requestedStyle =
    normalizeText(
      request.style
    );

  const requestedOccasion =
    normalizeText(
      request.occasion
    );

  const requestedColor =
    normalizeText(
      request.color
    );

  if (
    requestedStyle &&
    productStyle.some(
      value =>
        value.includes(
          requestedStyle
        )
    )
  ) {
    reasons.push(
      "Style aligns with your preference."
    );
  }

  if (
    requestedOccasion &&
    productOccasion.some(
      value =>
        value.includes(
          requestedOccasion
        )
    )
  ) {
    reasons.push(
      "Suitable for the selected occasion."
    );
  }

  if (
    requestedColor &&
    normalizeText(
      product.color
    ).includes(
      requestedColor
    )
  ) {
    reasons.push(
      "Colour matches your preference."
    );
  }

  if (
    request.comfort &&
    normalizeText(
      product.description
    ).includes(
      normalizeText(
        request.comfort
      )
    )
  ) {
    reasons.push(
      "Comfort preference is reflected in the product."
    );
  }

  if (
    !reasons.length
  ) {
    reasons.push(
      "Recommended based on overall fashion-query compatibility."
    );
  }

  return reasons.slice(
    0,
    4
  );
}

/*
=========================================================
HEALTH
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status:
        startupValid
          ? "ok"
          : "degraded",

      service:
        "Fashion AI Discovery",

      version:
        APP_VERSION,

      environment:
        NODE_ENV,

      products:
        products.length,

      model:
        MODEL_NAME,

      retrieval:
        "hybrid",

      timestamp:
        new Date().toISOString()
    });
  }
);

/*
=========================================================
READINESS
=========================================================
*/

app.get(
  "/api/ready",
  (req, res) => {
    const ready =
      startupValid &&
      products.length > 0;

    res
      .status(
        ready ? 200 : 503
      )
      .json({
        ready,

        startupValidation:
          startupValid,

        datasetLoaded:
          products.length > 0,

        productCount:
          products.length,

        timestamp:
          new Date().toISOString()
      });
  }
);

/*
=========================================================
VERSION
=========================================================
*/

app.get(
  "/api/version",
  (req, res) => {
    res.json({
      application:
        "Fashion AI Discovery",

      version:
        APP_VERSION,

      environment:
        NODE_ENV,

      node:
        process.version,

      model:
        MODEL_NAME,

      retrieval:
        "hybrid",

      timestamp:
        new Date().toISOString()
    });
  }
);

/*
=========================================================
MANIFEST
=========================================================
*/

app.get(
  "/api/manifest",
  (req, res) => {
    let datasetSize =
      null;

    let datasetModifiedAt =
      null;

    try {
      if (
        fs.existsSync(
          productsPath
        )
      ) {
        const stats =
          fs.statSync(
            productsPath
          );

        datasetSize =
          stats.size;

        datasetModifiedAt =
          stats.mtime.toISOString();
      }
    } catch (error) {
      console.error(
        "Manifest metadata error:",
        error
      );
    }

    res.json({
      manifestVersion:
        "1.0.0",

      generatedAt:
        new Date().toISOString(),

      application: {
        name:
          "Fashion AI Discovery",

        version:
          APP_VERSION,

        environment:
          NODE_ENV
      },

      runtime: {
        node:
          process.version,

        platform:
          process.platform,

        architecture:
          process.arch
      },

      model: {
        name:
          MODEL_NAME
      },

      retrieval: {
        type:
          "hybrid",

        defaultSearchLimit:
          DEFAULT_SEARCH_LIMIT,

        maxSearchLimit:
          MAX_SEARCH_LIMIT,

        minimumSearchScore:
          MINIMUM_SEARCH_SCORE
      },

      dataset: {
        path:
          productsPath,

        productCount:
          products.length,

        sizeBytes:
          datasetSize,

        modifiedAt:
          datasetModifiedAt
      }
    });
  }
);

/*
=========================================================
PRODUCTS
=========================================================
*/

app.get(
  "/api/products",
  (req, res) => {
    res.json({
      products,

      count:
        products.length
    });
  }
);

/*
=========================================================
FILTERS
=========================================================
*/

app.get(
  "/api/filters",
  (req, res) => {
    const uniqueValues =
      values =>
        [
          ...new Set(
            values
              .filter(Boolean)
              .map(String)
          )
        ].sort();

    const prices =
      products
        .map(
          product =>
            Number(
              product.price
            )
        )
        .filter(
          Number.isFinite
        );

    res.json({
      categories:
        uniqueValues(
          products.map(
            product =>
              product.category
          )
        ),

      genders:
        uniqueValues(
          products.map(
            product =>
              product.gender
          )
        ),

      colors:
        uniqueValues(
          products.map(
            product =>
              product.color
          )
        ),

      styles:
        uniqueValues(
          products.flatMap(
            product =>
              safeArray(
                product.style
              )
          )
        ),

      occasions:
        uniqueValues(
          products.flatMap(
            product =>
              safeArray(
                product.occasion
              )
          )
        ),

      materials:
        uniqueValues(
          products.flatMap(
            product =>
              safeArray(
                product.material
              )
          )
        ),

      priceRange: {
        min:
          prices.length
            ? Math.min(
                ...prices
              )
            : 0,

        max:
          prices.length
            ? Math.max(
                ...prices
              )
            : 0
      }
    });
  }
);

/*
=========================================================
SEARCH API
=========================================================
*/

app.post(
  "/api/search",
  (req, res) => {
    try {
      const body =
        req.body || {};

      const {
        query = "",
        category = "",
        gender = "",
        color = "",
        style = "",
        occasion = "",
        material = "",
        minPrice = "",
        maxPrice = "",
        sort = "relevance",
        limit
      } = body;

      const filters = {
        category,
        gender,
        color,
        style,
        occasion,
        material,
        minPrice,
        maxPrice
      };

      const normalizedLimit =
        normalizeLimit(
          limit
        );

      const results =
        performSearch(
          query,
          filters,
          sort,
          normalizedLimit
        );

      res.json({
        query:
          String(
            query ?? ""
          ),

        filters,

        sort,

        limit:
          normalizedLimit,

        count:
          results.length,

        results,

        model:
          MODEL_NAME,

        retrieval:
          "hybrid",

        timestamp:
          new Date().toISOString()
      });
    } catch (error) {
      console.error(
        "Search error:",
        error
      );

      res.status(500).json({
        error:
          "Search failed.",

        results: []
      });
    }
  }
);

/*
=========================================================
FILTER API
=========================================================
*/

app.post(
  "/api/filter",
  (req, res) => {
    try {
      const filters =
        req.body || {};

      const limit =
        normalizeLimit(
          filters.limit
        );

      const results =
        performSearch(
          "",
          filters,
          filters.sort ||
            "relevance",
          limit
        );

      res.json({
        filters,

        count:
          results.length,

        results
      });
    } catch (error) {
      console.error(
        "Filter error:",
        error
      );

      res.status(500).json({
        error:
          "Filtering failed.",

        results: []
      });
    }
  }
);

/*
=========================================================
RECOMMENDATIONS
=========================================================
*/

app.post(
  "/api/recommendations",
  (req, res) => {
    try {
      const {
        query = "",
        preferences = {}
      } =
        req.body || {};

      const filters = {
        category:
          preferences.category ||
          "",

        gender:
          preferences.gender ||
          "",

        color:
          preferences.color ||
          "",

        style:
          preferences.style ||
          "",

        occasion:
          preferences.occasion ||
          "",

        material:
          preferences.material ||
          "",

        minPrice:
          preferences.minPrice ||
          "",

        maxPrice:
          preferences.maxPrice ||
          ""
      };

      const results =
        performSearch(
          query,
          filters,
          "relevance",
          12
        );

      res.json({
        query,

        preferences,

        recommendations:
          results
      });
    } catch (error) {
      console.error(
        "Recommendation error:",
        error
      );

      res.status(500).json({
        error:
          "Recommendation service failed.",

        recommendations: []
      });
    }
  }
);

/*
=========================================================
DAY 9 - AI STYLIST
=========================================================
*/

app.post(
  "/api/stylist",
  (req, res) => {
    try {
      const request =
        req.body || {};

      const query =
        buildStylistQuery(
          request
        );

      const results =
        performSearch(
          query,
          {},
          "relevance",
          12
        );

      const enriched =
        results.map(
          product => ({
            ...product,

            stylistReasons:
              stylistReasons(
                product,
                request
              )
          })
        );

      res.json({
        status:
          "completed",

        query,

        request,

        count:
          enriched.length,

        recommendations:
          enriched,

        timestamp:
          new Date().toISOString()
      });
    } catch (error) {
      console.error(
        "Stylist error:",
        error
      );

      res.status(500).json({
        status:
          "failed",

        error:
          "Stylist recommendation failed.",

        recommendations: []
      });
    }
  }
);

/*
=========================================================
RESEARCH EVALUATION
=========================================================
*/

function runEvaluation() {
  const evaluationQueries =
    evaluationCases.map(
      item => ({
        query:
          item.query,

        relevance:
          item.relevance
      })
    );

  return evaluateDataset(
    evaluationQueries,
    (query) =>
      searchProducts(
        products,
        query,
        {
          limit: 10,

          minScore: 0
        }
      ),
    {
      kValues: [
        1,
        3,
        5,
        10
      ]
    }
  );
}

/*
=========================================================
EVALUATION API
=========================================================
*/

app.get(
  "/api/evaluation",
  (req, res) => {
    try {
      const report =
        runEvaluation();

      res.json({
        status:
          "completed",

        ...report
      });
    } catch (error) {
      console.error(
        "Evaluation error:",
        error
      );

      res.status(500).json({
        status:
          "failed",

        error:
          "Evaluation could not be completed."
      });
    }
  }
);

/*
=========================================================
EDGE CASE EVALUATION
=========================================================
*/

app.get(
  "/api/evaluation/edge-cases",
  (req, res) => {
    try {
      const cases = [
        "",
        " ",
        "shirt",
        "black shirt",
        "BLACK SHIRT",
        "summer dress",
        "comfortable sneakers",
        "formal office outfit",
        "wedding outfit",
        "white sneakers",
        "xyzabc",
        "123456",
        "👗 fashion",
        "a ".repeat(100)
      ];

      const results =
        cases.map(
          query => {
            const startedAt =
              Date.now();

            let output = [];

            try {
              output =
                searchProducts(
                  products,
                  query,
                  {
                    limit: 10,
                    minScore: 0
                  }
                );
            } catch {
              output = [];
            }

            return {
              query,

              resultCount:
                output.length,

              durationMs:
                Date.now() -
                startedAt,

              validArray:
                Array.isArray(
                  output
                )
            };
          }
        );

      const failures =
        results.filter(
          item =>
            !item.validArray
        );

      res.json({
        status:
          failures.length
            ? "failed"
            : "completed",

        totalCases:
          results.length,

        failures:
          failures.length,

        results
      });
    } catch (error) {
      console.error(
        "Edge-case evaluation error:",
        error
      );

      res.status(500).json({
        status:
          "failed",

        error:
          "Edge-case evaluation failed."
      });
    }
  }
);

/*
=========================================================
DAY 12 - ROBUSTNESS
=========================================================
*/

app.get(
  "/api/robustness",
  async (req, res) => {
    try {
      const testFile =
        path.join(
          __dirname,
          "tests",
          "robustness.js"
        );

      if (
        !fs.existsSync(
          testFile
        )
      ) {
        return res.status(404).json({
          status:
            "failed",

          error:
            "Robustness test file not found."
        });
      }

      const {
        stdout,
        stderr
      } =
        await execFileAsync(
          process.execPath,
          [testFile],
          {
            cwd:
              __dirname,

            timeout:
              120000,

            maxBuffer:
              5 *
              1024 *
              1024
          }
        );

      let report =
        null;

      const reportPath =
        path.join(
          __dirname,
          "evaluation-results",
          "day12-robustness-report.json"
        );

      if (
        fs.existsSync(
          reportPath
        )
      ) {
        try {
          report =
            JSON.parse(
              fs.readFileSync(
                reportPath,
                "utf-8"
              )
            );
        } catch (error) {
          console.error(
            "Unable to read robustness report:",
            error
          );
        }
      }

      res.json({
        status:
          "completed",

        report,

        output:
          stdout
            ? stdout.slice(
                -12000
              )
            : null,

        warnings:
          stderr
            ? stderr.slice(
                -5000
              )
            : null,

        timestamp:
          new Date().toISOString()
      });
    } catch (error) {
      console.error(
        "Robustness execution error:",
        error
      );

      res.status(500).json({
        status:
          "failed",

        error:
          error.message,

        stdout:
          error.stdout
            ? error.stdout.slice(
                -8000
              )
            : null,

        stderr:
          error.stderr
            ? error.stderr.slice(
                -5000
              )
            : null
      });
    }
  }
);

/*
=========================================================
API ERROR FOR INVALID JSON
=========================================================
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
        SyntaxError &&
      error.status === 400 &&
      "body" in error
    ) {
      return res.status(400).json({
        error:
          "Invalid JSON request body."
      });
    }

    next(error);
  }
);

/*
=========================================================
404
=========================================================
*/

app.use(
  (req, res) => {
    res.status(404).json({
      error:
        "Endpoint not found",

      path:
        req.originalUrl
    });
  }
);

/*
=========================================================
GLOBAL ERROR HANDLER
=========================================================
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Unhandled server error:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    res.status(500).json({
      error:
        "Internal server error."
    });
  }
);

/*
=========================================================
SERVER START
=========================================================
*/

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "\n========================================================="
    );

    console.log(
      "Fashion AI Discovery API"
    );

    console.log(
      "DAY 13 - REPRODUCIBLE DEPLOYMENT"
    );

    console.log(
      "========================================================="
    );

    console.log(
      `Environment: ${NODE_ENV}`
    );

    console.log(
      `Version: ${APP_VERSION}`
    );

    console.log(
      `Port: ${PORT}`
    );

    console.log(
      `Products: ${products.length}`
    );

    console.log(
      `Model: ${MODEL_NAME}`
    );

    console.log(
      "Retrieval: Hybrid"
    );

    console.log(
      `Dataset: ${productsPath}`
    );

    console.log(
      `Startup validation: ${
        startupValid
          ? "PASS"
          : "FAIL"
      }`
    );

    console.log(
      "=========================================================\n"
    );
  }
);

app.post(
  "/api/ai-search",
  async (req, res) => {
    try {
      const query =
        String(
          req.body?.query ?? ""
        ).trim();

      const limit =
        Math.max(
          1,
          Math.min(
            Number(
              req.body?.limit || 10
            ),
            50
          )
        );

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Search query is required.",
          results: []
        });
      }

      const response =
        await fetch(
          `${PYTHON_AI_URL}/api/semantic-search`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              query,
              limit
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        return res.status(
          response.status
        ).json(data);
      }

      return res.json({
        ...data,
        gateway: "node",
        ai_backend: "python_fastapi"
      });
    } catch (error) {
      console.error(
        "Python AI search error:",
        error
      );

      return res.status(503).json({
        success: false,
        error:
          "Python AI service is unavailable.",
        results: []
      });
    }
  }
);
