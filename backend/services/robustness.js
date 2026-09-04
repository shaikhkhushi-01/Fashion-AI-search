/**
 * DAY 12 — ROBUSTNESS + PERFORMANCE ENGINE
 *
 * Tests the fashion retrieval system against:
 * - empty queries
 * - whitespace queries
 * - noisy queries
 * - spelling variations
 * - ambiguous queries
 * - budget edge cases
 * - missing product attributes
 * - duplicate products
 * - extreme result limits
 * - retrieval latency
 */

const {
  tokenize,
  searchProducts
} = require("./aiSearch");

/* =========================================================
   BASIC UTILITIES
   ========================================================= */

function safeString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function normalizeQuery(query) {
  return safeString(query)
    .trim()
    .replace(/\s+/g, " ");
}

function uniqueProductIds(products) {
  const seen = new Set();
  const duplicates = [];

  for (const product of products) {
    const id = safeString(product?.id);

    if (!id) {
      continue;
    }

    if (seen.has(id)) {
      duplicates.push(id);
    } else {
      seen.add(id);
    }
  }

  return {
    uniqueCount: seen.size,
    duplicateIds: [...new Set(duplicates)]
  };
}

/* =========================================================
   PRODUCT DATA ROBUSTNESS
   ========================================================= */

const OPTIONAL_FIELDS = [
  "description",
  "color",
  "style",
  "occasion",
  "material",
  "gender",
  "fit",
  "pattern",
  "fabric",
  "tags"
];

function inspectProduct(product) {
  const missingFields = [];

  for (const field of OPTIONAL_FIELDS) {
    const value = product?.[field];

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      missingFields.push(field);
    }
  }

  return {
    id: product?.id ?? null,
    name: product?.name ?? null,
    missingFields
  };
}

function inspectCatalogue(products) {
  const safeProducts = Array.isArray(products)
    ? products
    : [];

  const duplicateInfo = uniqueProductIds(safeProducts);

  const invalidProducts = [];
  const missingFieldCounts = {};

  for (const product of safeProducts) {
    if (!product || typeof product !== "object") {
      invalidProducts.push(product);
      continue;
    }

    if (
      product.id === undefined ||
      product.id === null ||
      product.name === undefined ||
      product.name === null
    ) {
      invalidProducts.push(product);
    }

    const inspection = inspectProduct(product);

    for (const field of inspection.missingFields) {
      missingFieldCounts[field] =
        (missingFieldCounts[field] || 0) + 1;
    }
  }

  return {
    totalProducts: safeProducts.length,
    uniqueProducts: duplicateInfo.uniqueCount,
    duplicateIds: duplicateInfo.duplicateIds,
    duplicateCount: duplicateInfo.duplicateIds.length,
    invalidProductCount: invalidProducts.length,
    missingFieldCounts
  };
}

/* =========================================================
   QUERY ROBUSTNESS
   ========================================================= */

function classifyQuery(query) {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return "empty";
  }

  if (normalized.length <= 2) {
    return "very_short";
  }

  if (/^[^a-zA-Z0-9]+$/.test(normalized)) {
    return "symbols_only";
  }

  if (normalized.length > 150) {
    return "very_long";
  }

  if (/[!?.,]{3,}/.test(normalized)) {
    return "punctuation_heavy";
  }

  if (/\d/.test(normalized)) {
    return "contains_numbers";
  }

  if (/\b(cheap|under|below|less than|budget|max|maximum)\b/i.test(normalized)) {
    return "budget_query";
  }

  return "normal";
}

function queryComplexity(query) {
  const normalized = normalizeQuery(query);
  const tokens = tokenize(normalized);

  return {
    characters: normalized.length,
    tokens: tokens.length,
    uniqueTokens: new Set(tokens).size,
    averageTokenLength:
      tokens.length > 0
        ? Number(
            (
              tokens.reduce(
                (sum, token) => sum + token.length,
                0
              ) / tokens.length
            ).toFixed(2)
          )
        : 0
  };
}

/* =========================================================
   SAFE SEARCH
   ========================================================= */

function safeSearch(products, query, options = {}) {
  const start = process.hrtime.bigint();

  const normalizedQuery = normalizeQuery(query);

  let results = [];
  let error = null;

  try {
    if (!normalizedQuery) {
      results = [];
    } else {
      results = searchProducts(
        Array.isArray(products) ? products : [],
        normalizedQuery,
        {
          limit: Math.min(
            Math.max(Number(options.limit) || 10, 1),
            50
          ),
          minScore:
            options.minScore !== undefined
              ? Number(options.minScore)
              : 0
        }
      );

      if (!Array.isArray(results)) {
        results = [];
      }
    }
  } catch (err) {
    error = err?.message || String(err);
    results = [];
  }

  const end = process.hrtime.bigint();

  const latencyMs =
    Number(end - start) / 1_000_000;

  const ids = results
    .map((product) => safeString(product?.id))
    .filter(Boolean);

  const uniqueIds = new Set(ids);

  return {
    query: normalizedQuery,
    queryType: classifyQuery(normalizedQuery),
    complexity: queryComplexity(normalizedQuery),
    resultCount: results.length,
    uniqueResultCount: uniqueIds.size,
    duplicateResultCount:
      results.length - uniqueIds.size,
    latencyMs: Number(latencyMs.toFixed(3)),
    error,
    results
  };
}

/* =========================================================
   EDGE CASE TEST SUITE
   ========================================================= */

const ROBUSTNESS_CASES = [
  {
    id: "empty_query",
    query: "",
    expectation: "no_crash"
  },
  {
    id: "whitespace_query",
    query: "     ",
    expectation: "no_crash"
  },
  {
    id: "very_short_query",
    query: "x",
    expectation: "no_crash"
  },
  {
    id: "symbols_only",
    query: "!!!???",
    expectation: "no_crash"
  },
  {
    id: "mixed_case",
    query: "BLACK DRESS",
    expectation: "returns_results"
  },
  {
    id: "extra_spaces",
    query: "black    evening    dress",
    expectation: "returns_results"
  },
  {
    id: "punctuation_noise",
    query: "black!!! evening??? dress...",
    expectation: "no_crash"
  },
  {
    id: "budget_low",
    query: "dress under 2000",
    expectation: "budget_handling"
  },
  {
    id: "budget_medium",
    query: "dress under 5000",
    expectation: "budget_handling"
  },
  {
    id: "budget_high",
    query: "dress under 15000",
    expectation: "budget_handling"
  },
  {
    id: "ambiguous_query",
    query: "something nice",
    expectation: "no_crash"
  },
  {
    id: "minimal_style",
    query: "minimal comfortable",
    expectation: "returns_results"
  },
  {
    id: "occasion_query",
    query: "wedding outfit",
    expectation: "returns_results"
  },
  {
    id: "travel_query",
    query: "comfortable travel clothes",
    expectation: "returns_results"
  },
  {
    id: "long_query",
    query:
      "I am looking for a comfortable elegant minimal outfit for an evening event that is suitable for travel and preferably available in black or dark colors under 8000",
    expectation: "returns_results"
  },
  {
    id: "nonsense_query",
    query: "qzxv blorpt fashion xyz",
    expectation: "no_crash"
  }
];

/* =========================================================
   CORRUPTED / INCOMPLETE DATA TEST
   ========================================================= */

function createCorruptedProducts(products) {
  const safeProducts = Array.isArray(products)
    ? products
    : [];

  return [
    ...safeProducts,
    {
      id: "robustness-missing-fields",
      name: "Incomplete Product"
    },
    {
      id: "robustness-null-fields",
      name: "Null Attribute Product",
      description: null,
      color: null,
      style: null,
      occasion: null,
      material: null,
      gender: null
    },
    {
      id: "robustness-array-tags",
      name: "Array Tag Product",
      category: "Shirts",
      tags: ["minimal", "cotton"],
      color: "White"
    },
    {
      id: "robustness-empty-fields",
      name: "Empty Attribute Product",
      category: "",
      description: "",
      color: "",
      style: "",
      occasion: ""
    }
  ];
}

/* =========================================================
   DUPLICATE TEST
   ========================================================= */

function createDuplicateProducts(products) {
  const safeProducts = Array.isArray(products)
    ? products
    : [];

  if (safeProducts.length === 0) {
    return [];
  }

  return [
    ...safeProducts,
    safeProducts[0],
    safeProducts[0],
    safeProducts[1] || safeProducts[0]
  ];
}

/* =========================================================
   PERFORMANCE BENCHMARK
   ========================================================= */

function performanceBenchmark(products, iterations = 20) {
  const queries = [
    "black dress",
    "comfortable casual outfit",
    "minimal clothing",
    "wedding outfit",
    "summer cotton",
    "travel clothes",
    "formal office outfit",
    "black elegant dress"
  ];

  const latencies = [];
  let totalResults = 0;
  let errors = 0;

  const safeIterations = Math.max(
    1,
    Number(iterations) || 20
  );

  for (let i = 0; i < safeIterations; i++) {
    const query =
      queries[i % queries.length];

    const result = safeSearch(
      products,
      query,
      {
        limit: 10,
        minScore: 0
      }
    );

    latencies.push(result.latencyMs);
    totalResults += result.resultCount;

    if (result.error) {
      errors++;
    }
  }

  const sorted = [...latencies].sort(
    (a, b) => a - b
  );

  const sum = latencies.reduce(
    (a, b) => a + b,
    0
  );

  const percentile = (values, p) => {
    if (!values.length) {
      return 0;
    }

    const index =
      Math.ceil((p / 100) * values.length) - 1;

    return values[
      Math.max(0, Math.min(index, values.length - 1))
    ];
  };

  return {
    iterations: safeIterations,
    averageLatencyMs:
      Number((sum / latencies.length).toFixed(3)),
    minLatencyMs:
      Number(Math.min(...latencies).toFixed(3)),
    maxLatencyMs:
      Number(Math.max(...latencies).toFixed(3)),
    p50LatencyMs:
      Number(percentile(sorted, 50).toFixed(3)),
    p95LatencyMs:
      Number(percentile(sorted, 95).toFixed(3)),
    totalResults,
    errors
  };
}

/* =========================================================
   FULL ROBUSTNESS EVALUATION
   ========================================================= */

function runRobustnessEvaluation(products) {
  const safeProducts = Array.isArray(products)
    ? products
    : [];

  const catalogue = inspectCatalogue(
    safeProducts
  );

  const queryResults = [];

  for (const testCase of ROBUSTNESS_CASES) {
    const result = safeSearch(
      safeProducts,
      testCase.query,
      {
        limit: 10,
        minScore: 0
      }
    );

    const passed =
      result.error === null &&
      result.duplicateResultCount === 0;

    queryResults.push({
      ...testCase,
      passed,
      resultCount: result.resultCount,
      uniqueResultCount:
        result.uniqueResultCount,
      duplicateResultCount:
        result.duplicateResultCount,
      latencyMs: result.latencyMs,
      queryType: result.queryType,
      complexity: result.complexity,
      error: result.error
    });
  }

  const corruptedProducts =
    createCorruptedProducts(safeProducts);

  const corruptedResults = [];

  for (const testCase of [
    {
      id: "missing_fields_search",
      query: "minimal cotton shirt"
    },
    {
      id: "corrupted_budget_search",
      query: "dress under 5000"
    },
    {
      id: "corrupted_empty_search",
      query: "comfortable clothes"
    }
  ]) {
    const result = safeSearch(
      corruptedProducts,
      testCase.query,
      {
        limit: 10,
        minScore: 0
      }
    );

    corruptedResults.push({
      ...testCase,
      passed:
        result.error === null &&
        result.duplicateResultCount === 0,
      resultCount: result.resultCount,
      latencyMs: result.latencyMs,
      error: result.error
    });
  }

  const duplicateProducts =
    createDuplicateProducts(safeProducts);

  const duplicateSearch =
    safeSearch(
      duplicateProducts,
      "black dress",
      {
        limit: 20,
        minScore: 0
      }
    );

  const performance =
    performanceBenchmark(
      safeProducts,
      20
    );

  const passedQueries =
    queryResults.filter(
      (item) => item.passed
    ).length;

  const failedQueries =
    queryResults.length - passedQueries;

  const passedCorrupted =
    corruptedResults.filter(
      (item) => item.passed
    ).length;

  const overallPassed =
    failedQueries === 0 &&
    passedCorrupted === corruptedResults.length &&
    performance.errors === 0;

  return {
    metadata: {
      experiment: "day12-robustness",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    },

    catalogue,

    queryRobustness: {
      totalCases: queryResults.length,
      passedCases: passedQueries,
      failedCases: failedQueries,
      passRate:
        queryResults.length > 0
          ? Number(
              (
                passedQueries /
                queryResults.length
              ).toFixed(4)
            )
          : 0,
      cases: queryResults
    },

    incompleteDataRobustness: {
      totalCases: corruptedResults.length,
      passedCases: passedCorrupted,
      passRate:
        corruptedResults.length > 0
          ? Number(
              (
                passedCorrupted /
                corruptedResults.length
              ).toFixed(4)
            )
          : 0,
      cases: corruptedResults
    },

    duplicateHandling: {
      originalProducts: safeProducts.length,
      duplicatedProducts:
        duplicateProducts.length,
      duplicateIdsDetected:
        uniqueProductIds(duplicateProducts)
          .duplicateIds,
      returnedResults:
        duplicateSearch.resultCount,
      uniqueReturnedResults:
        duplicateSearch.uniqueResultCount,
      duplicateResultsReturned:
        duplicateSearch.duplicateResultCount,
      note:
        "Duplicate catalogue entries are detected and reported. Retrieval itself does not silently mutate the catalogue."
    },

    performance,

    overall: {
      passed: overallPassed,
      status: overallPassed
        ? "ROBUST"
        : "NEEDS_IMPROVEMENT"
    }
  };
}

/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
  normalizeQuery,
  classifyQuery,
  queryComplexity,
  inspectProduct,
  inspectCatalogue,
  safeSearch,
  createCorruptedProducts,
  createDuplicateProducts,
  performanceBenchmark,
  runRobustnessEvaluation,
  ROBUSTNESS_CASES
};
