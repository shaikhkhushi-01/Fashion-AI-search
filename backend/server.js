import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";

import {
  normalizeProfile,
  personalizeProducts
} from "./services/personalization.js";

import {
  buildDiscoveryResult,
  getFilterValues,
  buildSearchSuggestions
} from "./services/catalogDiscovery.js";

import {
  searchProducts
} from "./services/aiSearch.js";

import {
  evaluateDataset
} from "./services/evaluation.js";

import { evaluationCases } from "./tests/evaluation-cases.js";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const execFileAsync =
  promisify(execFile);

const app =
  express();

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

app.use(
  cors({
    origin: CORS_ORIGIN
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

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

let products = [];

const productsPath =
  path.join(
    __dirname,
    "..",
    "data",
    "products.json"
  );

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

function getProducts() {
  return products;
}

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

async function performSearch(
  query,
  options = {}
) {
  const normalizedQuery =
    String(
      query ?? ""
    ).trim();

  const filteredProducts =
    Array.isArray(
      options.products
    )
      ? options.products
      : products;

  const limit =
    normalizeLimit(
      options.limit
    );

  if (
    !normalizedQuery
  ) {
    let results =
      filteredProducts.map(
        product => ({
          ...product,
          matchScore: 50,
          score: 50,
          hybridScore: 0.5,
          reasons: [
            "Matches your selected filters."
          ]
        })
      );

    const sort =
      options.sort ||
      "relevance";

    if (
      normalizeText(
        sort
      ) === "price-low" ||
      normalizeText(
        sort
      ) === "price-asc"
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
      ) === "price-high" ||
      normalizeText(
        sort
      ) === "price-desc"
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
      limit
    );
  }

  let results =
    await searchProducts(
      filteredProducts,
      normalizedQuery,
      {
        limit,
        minScore:
          options.minScore ??
          MINIMUM_SEARCH_SCORE
      }
    );

  if (
    !Array.isArray(results)
  ) {
    results = [];
  }

  switch (
    normalizeText(
      options.sort ||
        "relevance"
    )
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
            b.score ??
            0
          ) -
          Number(
            a.hybridScore ??
            a.matchScore ??
            a.score ??
            0
          )
      );
      break;
  }

  return results.slice(
    0,
    limit
  );
}

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

app.post(
  "/api/search",
  async (req, res) => {
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

      const filteredProducts =
        applyFilters(
          products,
          filters
        );

      const results =
        await performSearch(
          query,
          {
            products:
              filteredProducts,
            sort,
            limit:
              normalizedLimit,
            minScore:
              MINIMUM_SEARCH_SCORE
          }
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

app.post(
  "/api/filter",
  (req, res) => {
    try {
      const body =
        req.body || {};

      const filters = {
        category:
          body.category || "",
        gender:
          body.gender || "",
        color:
          body.color || "",
        style:
          body.style || "",
        occasion:
          body.occasion || "",
        material:
          body.material || "",
        minPrice:
          body.minPrice ?? "",
        maxPrice:
          body.maxPrice ?? ""
      };

      const limit =
        normalizeLimit(
          body.limit
        );

      let results =
        applyFilters(
          products,
          filters
        ).map(
          product => ({
            ...product,
            matchScore: 50,
            score: 50,
            hybridScore: 0.5,
            reasons: [
              "Matches your selected filters."
            ]
          })
        );

      const sort =
        normalizeText(
          body.sort ||
            "relevance"
        );

      if (
        sort === "price-low" ||
        sort === "price-asc"
      ) {
        results.sort(
          (a, b) =>
            Number(a.price || 0) -
            Number(b.price || 0)
        );
      }

      if (
        sort === "price-high" ||
        sort === "price-desc"
      ) {
        results.sort(
          (a, b) =>
            Number(b.price || 0) -
            Number(a.price || 0)
        );
      }

      if (
        sort === "newest"
      ) {
        results.sort(
          (a, b) =>
            Number(b.id || 0) -
            Number(a.id || 0)
        );
      }

      results =
        results.slice(
          0,
          limit
        );

      res.json({
        filters: body,

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

app.post(
  "/api/recommendations",
  async (req, res) => {
    try {
      const {
        query = "",
        preferences = {},
        limit = 12
      } = req.body || {};

      const profile =
        normalizeProfile(
          preferences
        );

      const filters = {
        category:
          preferences.category || "",
        gender:
          preferences.gender || "",
        color:
          preferences.color || "",
        style:
          preferences.style || "",
        occasion:
          preferences.occasion || "",
        material:
          preferences.material || "",
        minPrice:
          preferences.minPrice || "",
        maxPrice:
          preferences.maxPrice || ""
      };

      const filteredProducts =
        applyFilters(
          products,
          filters
        );

      const candidates =
        await performSearch(
          query,
          {
            products:
              filteredProducts,
            sort:
              "relevance",
            limit:
              50
          }
        );

      const queryScores = {};

      for (
        const product of candidates
      ) {
        const rawScore =
          product.semanticScore ??
          product.similarity ??
          product.relevanceScore ??
          product.ai_match_score ??
          product.hybridScore ??
          product.matchScore ??
          0;

        let score =
          Number(rawScore);

        if (
          score > 1
        ) {
          score /=
            100;
        }

        queryScores[
          product.id
        ] =
          Math.max(
            0,
            Math.min(
              1,
              score
            )
          );
      }

      const recommendations =
        personalizeProducts(
          candidates,
          profile,
          {
            limit,
            queryScores,
            queryWeight:
              query
                ? 0.55
                : 0.25,
            personalizationWeight:
              query
                ? 0.45
                : 0.75
          }
        );

      res.json({
        status:
          "completed",

        query:
          String(
            query ?? ""
          ),

        preferences:
          profile,

        count:
          recommendations.length,

        recommendations
      });
    } catch (error) {
      console.error(
        "Recommendation error:",
        error
      );

      res.status(500).json({
        status:
          "failed",

        error:
          "Personalized recommendation failed.",

        recommendations: []
      });
    }
  }
);

app.post(
  "/api/stylist",
  async (req, res) => {
    try {
      const request =
        req.body || {};

      const query =
        buildStylistQuery(
          request
        );

      const results =
        await performSearch(
          query,
          {
            products:
              products,
            sort:
              "relevance",
            limit:
              12
          }
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

async function runEvaluation() {
  const evaluationQueries =
    evaluationCases.map(
      item => ({
        query:
          item.query,

        relevant:
          item.relevant ||
          item.relevance ||
          [],

        relevance:
          item.relevance || {}
      })
    );

  const predictionMap =
    new Map();

  for (
    const item of evaluationQueries
  ) {
    const results =
      await searchProducts(
        products,
        item.query,
        {
          limit: 10,
          minScore: 0
        }
      );

    predictionMap.set(
      item.query,
      Array.isArray(results)
        ? results.map(
            product =>
              product.id
          )
        : []
    );
  }

  return evaluateDataset(
    evaluationQueries,
    query =>
      predictionMap.get(
        query
      ) || [],
    {
      k: 5
    }
  );
}

app.get(
  "/api/evaluation",
  async (req, res) => {
    try {
      const report =
        await runEvaluation();

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

app.get(
  "/api/evaluation/edge-cases",
  async (req, res) => {
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
        [];

      for (
        const query of cases
      ) {
        const startedAt =
          Date.now();

        let output = [];

        try {
          output =
            await searchProducts(
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

        results.push({
          query,

          resultCount:
            Array.isArray(
              output
            )
              ? output.length
              : 0,

          durationMs:
            Date.now() -
            startedAt,

          validArray:
            Array.isArray(
              output
            )
        });
      }

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

app.post(
  "/api/ai-search",
  async (req, res) => {
    try {
      const query =
        String(
          req.body?.query ?? ""
        ).trim();

      const limit =
        normalizeLimit(
          req.body?.limit
        );

      if (!query) {
        return res.status(400).json({
          success:
            false,

          error:
            "Search query is required.",

          results: []
        });
      }

      const filters = {
        category:
          req.body?.category || "",
        gender:
          req.body?.gender || "",
        color:
          req.body?.color || "",
        style:
          req.body?.style || "",
        occasion:
          req.body?.occasion || "",
        material:
          req.body?.material || "",
        minPrice:
          req.body?.minPrice ?? "",
        maxPrice:
          req.body?.maxPrice ?? ""
      };

      const filteredProducts =
        applyFilters(
          products,
          filters
        );

      const results =
        await performSearch(
          query,
          {
            products:
              filteredProducts,
            sort:
              "relevance",
            limit,
            minScore:
              MINIMUM_SEARCH_SCORE
          }
        );

      return res.json({
        success:
          true,

        query,

        filters,

        results,

        count:
          results.length,

        model:
          MODEL_NAME,

        retrieval:
          "hybrid",

        gateway:
          "node",

        ai_backend:
          "transformers.js"
      });
    } catch (error) {
      console.error(
        "AI search error:",
        error
      );

      return res.status(503).json({
        success:
          false,

        error:
          "AI search service is unavailable.",

        results: []
      });
    }
  }
);

app.post(
  "/api/discovery",
  (req, res) => {
    try {
      const body =
        req.body || {};

      const currentProducts =
        getProducts();

      const result =
        buildDiscoveryResult(
          currentProducts,
          {
            query:
              body.query || "",

            category:
              body.category || "",

            gender:
              body.gender || "",

            color:
              body.color || "",

            style:
              body.style || "",

            occasion:
              body.occasion || "",

            material:
              body.material || "",

            minPrice:
              body.minPrice ?? "",

            maxPrice:
              body.maxPrice ?? "",

            sort:
              body.sort ||
              "relevance",

            page:
              body.page || 1,

            pageSize:
              body.pageSize || 12
          }
        );

      res.json({
        status:
          "completed",

        ...result
      });
    } catch (error) {
      console.error(
        "Discovery error:",
        error
      );

      res.status(500).json({
        status:
          "failed",

        items: [],

        pagination: {
          page: 1,
          pageSize: 12,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false
        }
      });
    }
  }
);

app.get(
  "/api/discovery/filters",
  (req, res) => {
    try {
      const currentProducts =
        getProducts();

      res.json({
        status:
          "completed",

        filters:
          getFilterValues(
            currentProducts
          )
      });
    } catch (error) {
      console.error(
        "Filter metadata error:",
        error
      );

      res.status(500).json({
        status:
          "failed",

        filters: {
          categories: [],
          genders: [],
          colors: [],
          styles: [],
          occasions: [],
          materials: []
        }
      });
    }
  }
);

app.get(
  "/api/discovery/suggestions",
  (req, res) => {
    try {
      const currentProducts =
        getProducts();

      const suggestions =
        buildSearchSuggestions(
          currentProducts,
          req.query.q || "",
          req.query.limit || 8
        );

      res.json({
        status:
          "completed",

        suggestions
      });
    } catch (error) {
      console.error(
        "Suggestion error:",
        error
      );

      res.status(500).json({
        status:
          "failed",

        suggestions: []
      });
    }
  }
);

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
