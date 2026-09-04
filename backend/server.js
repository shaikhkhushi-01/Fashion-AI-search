/*
=========================================================
FASHION AI DISCOVERY
DAY 13 - REPRODUCIBLE DEPLOYMENT + ROBUST API
=========================================================
*/

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  runEvaluation,
  runEdgeCaseTests
} from "./evaluation.js";

/*
=========================================================
PATH CONFIGURATION
=========================================================
*/

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

/*
=========================================================
APPLICATION
=========================================================
*/

const app = express();

/*
=========================================================
ENVIRONMENT CONFIGURATION
=========================================================
*/

const PORT =
  Number(process.env.PORT) || 10000;

const NODE_ENV =
  process.env.NODE_ENV ||
  "development";

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

/*
=========================================================
CORS
=========================================================
*/

const CORS_ORIGIN =
  process.env.CORS_ORIGIN || "*";

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

/*
 IMPORTANT:
 products.json lives in:
 data/products.json

 server.js lives in:
 backend/server.js

 Therefore:
 ../data/products.json
*/

const productsPath =
  path.join(
    __dirname,
    "..",
    "data",
    "products.json"
  );

/*
=========================================================
LOAD PRODUCT DATA
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
      JSON.parse(rawData);

    if (
      Array.isArray(parsed)
    ) {

      products = parsed;

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

  /*
  Node version
  */

  const nodeMajor =
    Number(
      process.versions.node
        .split(".")[0]
    );

  if (
    !Number.isFinite(
      nodeMajor
    ) ||
    nodeMajor < 18
  ) {

    errors.push(
      `Node.js 18+ required. Current version: ${process.versions.node}`
    );
  }

  /*
  Product dataset
  */

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

  /*
  Duplicate IDs
  */

  const ids =
    new Set();

  for (
    const product of products
  ) {

    if (
      !product ||
      typeof product !==
        "object"
    ) {

      errors.push(
        "Invalid product object detected."
      );

      continue;
    }

    if (
      product.id ===
        undefined ||
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

    /*
    Name validation
    */

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

  /*
  Configuration
  */

  if (
    !Number.isFinite(PORT) ||
    PORT <= 0 ||
    PORT > 65535
  ) {

    errors.push(
      `Invalid PORT: ${PORT}`
    );
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

  /*
  Production CORS warning
  */

  if (
    NODE_ENV ===
      "production" &&
    CORS_ORIGIN === "*"
  ) {

    warnings.push(
      "CORS_ORIGIN is '*' in production."
    );
  }

  /*
  Print warnings
  */

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

  /*
  Print errors
  */

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

function normalizeText(value) {

  return String(
    value || ""
  )
    .toLowerCase()
    .trim();
}

function tokenize(value) {

  return normalizeText(value)
    .replace(
      /[^\p{L}\p{N}\s-]/gu,
      " "
    )
    .split(/\s+/)
    .filter(Boolean);
}

function safeArray(value) {

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
SYNONYMS
=========================================================
*/

const synonyms = {

  tshirt: [
    "tshirt",
    "t-shirt",
    "tee"
  ],

  shirt: [
    "shirt",
    "shirts"
  ],

  trouser: [
    "trouser",
    "trousers",
    "pants"
  ],

  sneaker: [
    "sneaker",
    "sneakers",
    "shoe",
    "shoes"
  ],

  casual: [
    "casual",
    "everyday",
    "relaxed"
  ],

  formal: [
    "formal",
    "office",
    "professional"
  ],

  summer: [
    "summer",
    "warm",
    "hot"
  ],

  comfortable: [
    "comfortable",
    "comfort",
    "soft",
    "relaxed"
  ],

  cheap: [
    "cheap",
    "affordable",
    "budget",
    "low"
  ],

  premium: [
    "premium",
    "luxury",
    "expensive"
  ]
};

/*
=========================================================
QUERY EXPANSION
=========================================================
*/

function expandQuery(query) {

  const tokens =
    tokenize(query);

  const expanded =
    new Set(tokens);

  for (
    const token of tokens
  ) {

    for (
      const values of
        Object.values(
          synonyms
        )
    ) {

      if (
        values.includes(token)
      ) {

        values.forEach(
          value =>
            expanded.add(
              normalizeText(
                value
              )
            )
        );
      }
    }
  }

  return [
    ...expanded
  ];
}

/*
=========================================================
PRODUCT TEXT
=========================================================
*/

function productText(product) {

  return [

    product.brand,

    product.name,

    product.category,

    product.gender,

    product.color,

    ...safeArray(
      product.material
    ),

    ...safeArray(
      product.style
    ),

    ...safeArray(
      product.occasion
    ),

    ...safeArray(
      product.tags
    ),

    product.description

  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");
}

/*
=========================================================
RELEVANCE SCORING
=========================================================
*/

function calculateRelevance(
  product,
  query
) {

  const queryTokens =
    expandQuery(query);

  if (
    !queryTokens.length
  ) {

    return 0;
  }

  const name =
    normalizeText(
      product.name
    );

  const brand =
    normalizeText(
      product.brand
    );

  const category =
    normalizeText(
      product.category
    );

  const color =
    normalizeText(
      product.color
    );

  const style =
    safeArray(
      product.style
    )
      .map(normalizeText);

  const occasion =
    safeArray(
      product.occasion
    )
      .map(normalizeText);

  const material =
    safeArray(
      product.material
    )
      .map(normalizeText);

  const tags =
    safeArray(
      product.tags
    )
      .map(normalizeText);

  const description =
    normalizeText(
      product.description
    );

  const fullText =
    productText(product);

  let score = 0;

  for (
    const token of queryTokens
  ) {

    if (
      name.includes(token)
    ) {

      score += 22;
    }

    if (
      brand.includes(token)
    ) {

      score += 18;
    }

    if (
      category.includes(token)
    ) {

      score += 18;
    }

    if (
      color.includes(token)
    ) {

      score += 16;
    }

    if (
      style.some(
        item =>
          item.includes(token)
      )
    ) {

      score += 14;
    }

    if (
      occasion.some(
        item =>
          item.includes(token)
      )
    ) {

      score += 14;
    }

    if (
      material.some(
        item =>
          item.includes(token)
      )
    ) {

      score += 12;
    }

    if (
      tags.some(
        item =>
          item.includes(token)
      )
    ) {

      score += 10;
    }

    if (
      description.includes(token)
    ) {

      score += 6;
    }

    if (
      fullText.includes(token)
    ) {

      score += 2;
    }
  }

  /*
  Phrase-level bonus
  */

  const normalizedQuery =
    normalizeText(query);

  if (
    normalizedQuery &&
    name.includes(
      normalizedQuery
    )
  ) {

    score += 25;
  }

  /*
  Availability bonus
  */

  if (
    normalizeText(
      product.availability
    ) === "in stock"
  ) {

    score += 4;
  }

  return Math.min(
    100,
    Math.round(score)
  );
}

/*
=========================================================
MATCH REASONS
=========================================================
*/

function getReasons(
  product,
  query
) {

  const reasons = [];

  const q =
    normalizeText(query);

  const name =
    normalizeText(
      product.name
    );

  const category =
    normalizeText(
      product.category
    );

  const color =
    normalizeText(
      product.color
    );

  const styles =
    safeArray(
      product.style
    )
      .map(normalizeText);

  const occasions =
    safeArray(
      product.occasion
    )
      .map(normalizeText);

  const materials =
    safeArray(
      product.material
    )
      .map(normalizeText);

  const tokens =
    expandQuery(q);

  if (
    name &&
    tokens.some(
      token =>
        name.includes(token)
    )
  ) {

    reasons.push(
      "Product name matches your search intent."
    );
  }

  if (
    category &&
    tokens.some(
      token =>
        category.includes(token)
    )
  ) {

    reasons.push(
      `Category matches: ${product.category}.`
    );
  }

  if (
    color &&
    tokens.some(
      token =>
        color.includes(token)
    )
  ) {

    reasons.push(
      `Colour matches: ${product.color}.`
    );
  }

  if (
    styles.some(
      style =>
        tokens.some(
          token =>
            style.includes(token)
        )
    )
  ) {

    reasons.push(
      "Style matches your request."
    );
  }

  if (
    occasions.some(
      occasion =>
        tokens.some(
          token =>
            occasion.includes(token)
        )
    )
  ) {

    reasons.push(
      "Occasion matches your request."
    );
  }

  if (
    materials.some(
      material =>
        tokens.some(
          token =>
            material.includes(token)
        )
    )
  ) {

    reasons.push(
      "Material preference matches."
    );
  }

  if (
    !reasons.length
  ) {

    reasons.push(
      "Strong overall semantic/textual match."
    );
  }

  return reasons.slice(
    0,
    4
  );
}

/*
=========================================================
ADVANCED FILTERING
=========================================================
*/

function matchesFilter(
  product,
  filters
) {

  /*
  Category
  */

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

  /*
  Gender
  */

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

  /*
  Colour
  */

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

  /*
  Style
  */

  if (
    filters.style
  ) {

    const productStyles =
      safeArray(
        product.style
      )
        .map(normalizeText);

    if (
      !productStyles.includes(
        normalizeText(
          filters.style
        )
      )
    ) {

      return false;
    }
  }

  /*
  Occasion
  */

  if (
    filters.occasion
  ) {

    const productOccasions =
      safeArray(
        product.occasion
      )
        .map(normalizeText);

    if (
      !productOccasions.includes(
        normalizeText(
          filters.occasion
        )
      )
    ) {

      return false;
    }
  }

  /*
  Material
  */

  if (
    filters.material
  ) {

    const productMaterials =
      safeArray(
        product.material
      )
        .map(normalizeText);

    if (
      !productMaterials.includes(
        normalizeText(
          filters.material
        )
      )
    ) {

      return false;
    }
  }

  /*
  Minimum price
  */

  if (
    filters.minPrice !==
      undefined &&
    filters.minPrice !==
      null &&
    filters.minPrice !==
      ""
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

  /*
  Maximum price
  */

  if (
    filters.maxPrice !==
      undefined &&
    filters.maxPrice !==
      null &&
    filters.maxPrice !==
      ""
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
SORTING
=========================================================
*/

function sortResults(
  results,
  sort
) {

  const output =
    [...results];

  switch (
    normalizeText(sort)
  ) {

    case "price-low":

    case "price-asc":

      output.sort(
        (a, b) =>
          Number(
            a.price || 0
          ) -
          Number(
            b.price || 0
          )
      );

      break;

    case "price-high":

    case "price-desc":

      output.sort(
        (a, b) =>
          Number(
            b.price || 0
          ) -
          Number(
            a.price || 0
          )
      );

      break;

    case "newest":

      output.sort(
        (a, b) =>
          Number(
            b.id || 0
          ) -
          Number(
            a.id || 0
          )
      );

      break;

    case "relevance":

    default:

      output.sort(
        (a, b) =>
          Number(
            b.matchScore || 0
          ) -
          Number(
            a.matchScore || 0
          )
      );

      break;
  }

  return output;
}

/*
=========================================================
SEARCH LIMIT NORMALIZATION
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
SEARCH ENGINE
=========================================================
*/

function performSearch(
  query,
  filters = {},
  sort = "relevance"
) {

  let candidates =
    products.filter(
      product =>
        matchesFilter(
          product,
          filters
        )
    );

  const hasQuery =
    normalizeText(
      query
    ).length > 0;

  if (
    hasQuery
  ) {

    candidates =
      candidates.map(
        product => {

          const matchScore =
            calculateRelevance(
              product,
              query
            );

          return {

            ...product,

            matchScore,

            score:
              matchScore,

            reasons:
              getReasons(
                product,
                query
              )
          };
        }
      );

  } else {

    candidates =
      candidates.map(
        product => ({

          ...product,

          matchScore: 50,

          score: 50,

          reasons: [
            "Matches your selected filters."
          ]

        })
      );
  }

  /*
  Remove extremely weak
  results only when there
  are stronger alternatives.
  */

  if (
    hasQuery
  ) {

    const strong =
      candidates.filter(
        product =>
          product.matchScore >= 5
      );

    candidates =
      strong.length
        ? strong
        : candidates;
  }

  return sortResults(
    candidates,
    sort
  );
}

/*
=========================================================
DATASET HASH
=========================================================
*/

function getDatasetHash() {

  try {

    const crypto =
      awaitImportCrypto();

    return crypto;

  } catch {

    return null;
  }
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
      Array.isArray(
        products
      ) &&
      products.length > 0;

    res.status(
      ready
        ? 200
        : 503
    );

    res.json({

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

      dataset: {

        path:
          productsPath,

        productCount:
          products.length,

        sizeBytes:
          datasetSize,

        modifiedAt:
          datasetModifiedAt
      },

      retrieval: {

        defaultSearchLimit:
          DEFAULT_SEARCH_LIMIT,

        maxSearchLimit:
          MAX_SEARCH_LIMIT,

        minimumSearchScore:
          MINIMUM_SEARCH_SCORE
      }
    });
  }
);

/*
=========================================================
ALL PRODUCTS
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
FILTER OPTIONS
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

    const categories =
      uniqueValues(
        products.map(
          p => p.category
        )
      );

    const genders =
      uniqueValues(
        products.map(
          p => p.gender
        )
      );

    const colors =
      uniqueValues(
        products.map(
          p => p.color
        )
      );

    const styles =
      uniqueValues(
        products.flatMap(
          p =>
            safeArray(
              p.style
            )
        )
      );

    const occasions =
      uniqueValues(
        products.flatMap(
          p =>
            safeArray(
              p.occasion
            )
        )
      );

    const materials =
      uniqueValues(
        products.flatMap(
          p =>
            safeArray(
              p.material
            )
        )
      );

    const prices =
      products
        .map(
          p =>
            Number(
              p.price
            )
        )
        .filter(
          Number.isFinite
        );

    res.json({

      categories,

      genders,

      colors,

      styles,

      occasions,

      materials,

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
ADVANCED SEARCH
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
          sort
        ).slice(
          0,
          normalizedLimit
        );

      res.json({

        query,

        filters,

        sort,

        limit:
          normalizedLimit,

        count:
          results.length,

        results,

        model:
          MODEL_NAME,

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
FILTER-ONLY SEARCH
=========================================================
*/

app.post(
  "/api/filter",
  (req, res) => {

    try {

      const filters =
        req.body || {};

      const results =
        performSearch(
          "",
          filters,
          filters.sort ||
            "relevance"
        );

      const limit =
        normalizeLimit(
          filters.limit
        );

      res.json({

        filters,

        count:
          Math.min(
            results.length,
            limit
          ),

        results:
          results.slice(
            0,
            limit
          )
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
          "relevance"
        );

      res.json({

        query,

        preferences,

        recommendations:
          results.slice(
            0,
            12
          )
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
DAY 8 - EVALUATION
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
DAY 8 - EDGE CASES
=========================================================
*/

app.get(
  "/api/evaluation/edge-cases",
  (req, res) => {

    try {

      const report =
        runEdgeCaseTests();

      res.json({

        status:
          "completed",

        ...report
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
          "Edge-case tests failed."
      });
    }
  }
);

/*
=========================================================
404 HANDLER
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
