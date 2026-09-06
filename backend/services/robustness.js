function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [value];
}

function sanitizeQuery(query) {
  return normalize(query)
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 500)
    .trim();
}

function validateProduct(product) {
  if (!product || typeof product !== "object") {
    return {
      valid: false,
      issues: ["product-not-object"]
    };
  }

  const issues = [];

  if (product.id === undefined || product.id === null) {
    issues.push("missing-id");
  }

  if (!product.name) {
    issues.push("missing-name");
  }

  if (
    product.price !== undefined &&
    !Number.isFinite(Number(product.price))
  ) {
    issues.push("invalid-price");
  }

  if (
    product.rating !== undefined &&
    !Number.isFinite(Number(product.rating))
  ) {
    issues.push("invalid-rating");
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function sanitizeProduct(product) {
  const source =
    product && typeof product === "object"
      ? product
      : {};

  return {
    ...source,
    id: source.id ?? "",
    name: String(source.name ?? ""),
    brand: String(source.brand ?? ""),
    category: String(source.category ?? ""),
    gender: String(source.gender ?? ""),
    color: String(source.color ?? ""),
    style: String(source.style ?? ""),
    occasion: String(source.occasion ?? ""),
    material: String(source.material ?? ""),
    fit: String(source.fit ?? ""),
    pattern: String(source.pattern ?? ""),
    description: String(source.description ?? ""),
    tags: safeArray(source.tags),
    price: safeNumber(source.price, 0),
    rating: safeNumber(source.rating, 0)
  };
}

function sanitizeProducts(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products
    .filter(product => product !== null && product !== undefined)
    .map(sanitizeProduct);
}

function detectQueryRisk(query) {
  const normalized = sanitizeQuery(query);

  const signals = {
    empty: normalized.length === 0,
    veryShort: normalized.length > 0 && normalized.length < 3,
    veryLong: normalized.length > 300,
    repeatedCharacters: /(.)\1{5,}/.test(normalized),
    excessiveTokens: tokenize(normalized).length > 50,
    specialCharacters: /[^\w\s₹.,'-]/.test(normalized)
  };

  const riskCount = Object.values(signals)
    .filter(Boolean)
    .length;

  return {
    ...signals,
    riskCount,
    risky: riskCount >= 2
  };
}

function safeSearchQuery(query) {
  const sanitized = sanitizeQuery(query);

  if (!sanitized) {
    return {
      query: "",
      tokens: [],
      valid: false
    };
  }

  return {
    query: sanitized,
    tokens: tokenize(sanitized),
    valid: true
  };
}

function removeDuplicateProducts(products) {
  const seen = new Set();

  return products.filter(product => {
    const key = String(product?.id ?? "");

    if (!key) {
      return true;
    }

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function clampScore(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(1, number));
}

function validateRankingOutput(results) {
  if (!Array.isArray(results)) {
    return {
      valid: false,
      issues: ["ranking-output-not-array"]
    };
  }

  const issues = [];

  for (let index = 0; index < results.length; index += 1) {
    const item = results[index];

    if (!item || typeof item !== "object") {
      issues.push(`invalid-item-${index}`);
      continue;
    }

    if (
      item.score !== undefined &&
      !Number.isFinite(Number(item.score))
    ) {
      issues.push(`invalid-score-${index}`);
    }

    if (
      index > 0 &&
      Number.isFinite(Number(results[index - 1]?.score)) &&
      Number.isFinite(Number(item.score)) &&
      Number(results[index - 1].score) <
        Number(item.score)
    ) {
      issues.push(`unsorted-${index}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function runRobustnessChecks(products, searchFunction) {
  const queries = [
    "",
    " ",
    "shirt",
    "bl",
    "black formal shirt",
    "BLACK FORMAL SHIRT",
    "black   formal   shirt",
    "shirt under 2000",
    "shirt ₹2000",
    "xxxxxxxxxxxx",
    "a".repeat(100),
    "shirt !!! ??? ###",
    "women cotton casual shirt for college",
    "something completely unrelated to fashion",
    "shirt shirt shirt shirt shirt"
  ];

  const results = [];

  for (const rawQuery of queries) {
    const query = sanitizeQuery(rawQuery);
    const risk = detectQueryRisk(rawQuery);

    try {
      const output = searchFunction(query);

      const safeOutput = Array.isArray(output)
        ? output
        : [];

      results.push({
        query: rawQuery,
        sanitizedQuery: query,
        risk,
        success: true,
        resultCount: safeOutput.length,
        ranking: validateRankingOutput(safeOutput)
      });
    } catch (error) {
      results.push({
        query: rawQuery,
        sanitizedQuery: query,
        risk,
        success: false,
        resultCount: 0,
        error: String(error?.message ?? error)
      });
    }
  }

  const successful = results.filter(
    result => result.success
  );

  const failed = results.filter(
    result => !result.success
  );

  return {
    totalCases: results.length,
    successfulCases: successful.length,
    failedCases: failed.length,
    successRate:
      results.length > 0
        ? successful.length / results.length
        : 0,
    cases: results,
    datasetSize: Array.isArray(products)
      ? products.length
      : 0
  };
}

function benchmarkSearch(searchFunction, queries, iterations = 100) {
  const safeIterations = Math.max(
    1,
    Math.min(Number(iterations) || 1, 10000)
  );

  const timings = [];

  for (const query of queries) {
    const start = performance.now();

    for (let index = 0; index < safeIterations; index += 1) {
      searchFunction(query);
    }

    const elapsed = performance.now() - start;

    timings.push({
      query,
      iterations: safeIterations,
      totalMs: elapsed,
      averageMs: elapsed / safeIterations
    });
  }

  const averageMs =
    timings.length > 0
      ? timings.reduce(
          (sum, item) => sum + item.averageMs,
          0
        ) / timings.length
      : 0;

  const maxMs =
    timings.length > 0
      ? Math.max(
          ...timings.map(item => item.averageMs)
        )
      : 0;

  return {
    iterations: safeIterations,
    averageMs,
    maxMs,
    timings
  };
}

function createRobustnessReport(
  robustness,
  benchmark
) {
  return {
    experiment: "fashion-ai-robustness-performance",
    robustness,
    benchmark,
    generatedAt: new Date().toISOString()
  };
}

export {
  normalize,
  tokenize,
  safeNumber,
  safeArray,
  sanitizeQuery,
  validateProduct,
  sanitizeProduct,
  sanitizeProducts,
  detectQueryRisk,
  safeSearchQuery,
  removeDuplicateProducts,
  clampScore,
  validateRankingOutput,
  runRobustnessChecks,
  benchmarkSearch,
  createRobustnessReport
};
