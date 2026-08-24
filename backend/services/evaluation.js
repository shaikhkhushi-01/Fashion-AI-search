/*
=========================================================
FASHION AI DISCOVERY
DAY 8
EVALUATION ENGINE
=========================================================

Purpose:
- Search quality evaluation
- Precision / Recall / F1
- Edge-case evaluation
- Query benchmark
- AI recommendation quality
=========================================================
*/

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalize);
}

/*
=========================================================
PRODUCT MATCHING
=========================================================
*/

function productMatchesExpected(product, expected) {
  if (!product || !expected) {
    return false;
  }

  const category = normalize(product.category);
  const color = normalize(product.color);
  const brand = normalize(product.brand);

  const styles = normalizeArray(product.style);
  const occasions = normalizeArray(product.occasion);
  const tags = normalizeArray(product.tags);
  const materials = normalizeArray(product.material);

  const expectedCategory =
    normalize(expected.category);

  const expectedColor =
    normalize(expected.color);

  const expectedStyle =
    normalize(expected.style);

  const expectedOccasion =
    normalize(expected.occasion);

  const expectedMaterial =
    normalize(expected.material);

  const expectedBrand =
    normalize(expected.brand);

  if (
    expectedCategory &&
    category !== expectedCategory
  ) {
    return false;
  }

  if (
    expectedColor &&
    color !== expectedColor
  ) {
    return false;
  }

  if (
    expectedStyle &&
    !styles.includes(expectedStyle) &&
    !tags.includes(expectedStyle)
  ) {
    return false;
  }

  if (
    expectedOccasion &&
    !occasions.includes(expectedOccasion) &&
    !tags.includes(expectedOccasion)
  ) {
    return false;
  }

  if (
    expectedMaterial &&
    !materials.includes(expectedMaterial) &&
    !tags.includes(expectedMaterial)
  ) {
    return false;
  }

  if (
    expectedBrand &&
    brand !== expectedBrand
  ) {
    return false;
  }

  return true;
}

/*
=========================================================
PRECISION
=========================================================
*/

function calculatePrecision(
  returnedProducts,
  expected
) {
  if (
    !Array.isArray(returnedProducts) ||
    returnedProducts.length === 0
  ) {
    return 0;
  }

  const relevant =
    returnedProducts.filter(
      (product) =>
        productMatchesExpected(
          product,
          expected
        )
    ).length;

  return relevant / returnedProducts.length;
}

/*
=========================================================
RECALL
=========================================================
*/

function calculateRecall(
  returnedProducts,
  allProducts,
  expected
) {
  if (
    !Array.isArray(allProducts) ||
    allProducts.length === 0
  ) {
    return 0;
  }

  const expectedProducts =
    allProducts.filter(
      (product) =>
        productMatchesExpected(
          product,
          expected
        )
    );

  if (
    expectedProducts.length === 0
  ) {
    return 0;
  }

  const returnedIds =
    new Set(
      returnedProducts.map(
        (product) =>
          product.id
      )
    );

  const found =
    expectedProducts.filter(
      (product) =>
        returnedIds.has(product.id)
    ).length;

  return found / expectedProducts.length;
}

/*
=========================================================
F1 SCORE
=========================================================
*/

function calculateF1(
  precision,
  recall
) {
  if (
    precision + recall === 0
  ) {
    return 0;
  }

  return (
    2 *
    (precision * recall) /
    (precision + recall)
  );
}

/*
=========================================================
TOP RESULT ACCURACY
=========================================================
*/

function calculateTopResultAccuracy(
  results,
  expected
) {
  if (
    !Array.isArray(results) ||
    results.length === 0
  ) {
    return 0;
  }

  return productMatchesExpected(
    results[0],
    expected
  )
    ? 1
    : 0;
}

/*
=========================================================
MATCH SCORE QUALITY
=========================================================
*/

function calculateAverageMatchScore(
  results
) {
  if (
    !Array.isArray(results) ||
    results.length === 0
  ) {
    return 0;
  }

  const scores =
    results
      .map(
        (product) =>
          Number(
            product.matchScore
          )
      )
      .filter(
        (score) =>
          Number.isFinite(score)
      );

  if (
    scores.length === 0
  ) {
    return 0;
  }

  return (
    scores.reduce(
      (sum, score) =>
        sum + score,
      0
    ) /
    scores.length
  );
}

/*
=========================================================
QUERY EVALUATION
=========================================================
*/

function evaluateQuery({
  query,
  results,
  allProducts,
  expected,
}) {
  const precision =
    calculatePrecision(
      results,
      expected
    );

  const recall =
    calculateRecall(
      results,
      allProducts,
      expected
    );

  const f1 =
    calculateF1(
      precision,
      recall
    );

  const topResultAccuracy =
    calculateTopResultAccuracy(
      results,
      expected
    );

  const averageMatchScore =
    calculateAverageMatchScore(
      results
    );

  return {
    query,

    returnedResults:
      Array.isArray(results)
        ? results.length
        : 0,

    precision:
      Number(
        precision.toFixed(3)
      ),

    recall:
      Number(
        recall.toFixed(3)
      ),

    f1:
      Number(
        f1.toFixed(3)
      ),

    topResultAccuracy,

    averageMatchScore:
      Number(
        averageMatchScore.toFixed(2)
      ),
  };
}

/*
=========================================================
FULL EVALUATION
=========================================================
*/

function evaluateDataset({
  testCases,
  allProducts,
  searchFunction,
}) {
  const results = [];

  for (
    const testCase of testCases
  ) {
    try {
      const searchResults =
        searchFunction(
          testCase.query
        );

      const evaluation =
        evaluateQuery({
          query:
            testCase.query,

          results:
            searchResults,

          allProducts,

          expected:
            testCase.expected,
        });

      results.push({
        ...evaluation,

        status:
          evaluation.f1 >= 0.5
            ? "PASS"
            : "REVIEW",
      });

    } catch (error) {
      results.push({
        query:
          testCase.query,

        returnedResults: 0,

        precision: 0,

        recall: 0,

        f1: 0,

        topResultAccuracy: 0,

        averageMatchScore: 0,

        status: "ERROR",

        error:
          error.message,
      });
    }
  }

  const average =
    (key) => {
      if (
        results.length === 0
      ) {
        return 0;
      }

      return Number(
        (
          results.reduce(
            (sum, item) =>
              sum +
              Number(
                item[key] || 0
              ),
            0
          ) /
          results.length
        ).toFixed(3)
      );
    };

  return {
    totalQueries:
      results.length,

    passedQueries:
      results.filter(
        (item) =>
          item.status === "PASS"
      ).length,

    reviewQueries:
      results.filter(
        (item) =>
          item.status === "REVIEW"
      ).length,

    averagePrecision:
      average("precision"),

    averageRecall:
      average("recall"),

    averageF1:
      average("f1"),

    averageTopResultAccuracy:
      average(
        "topResultAccuracy"
      ),

    averageMatchScore:
      average(
        "averageMatchScore"
      ),

    results,
  };
}

/*
=========================================================
EDGE CASE VALIDATION
=========================================================
*/

function validateSearchInput(
  query
) {
  const normalized =
    normalize(query);

  if (!normalized) {
    return {
      valid: false,
      reason:
        "Search query is empty.",
    };
  }

  if (
    normalized.length < 2
  ) {
    return {
      valid: false,
      reason:
        "Search query is too short.",
    };
  }

  if (
    normalized.length > 300
  ) {
    return {
      valid: false,
      reason:
        "Search query is too long.",
    };
  }

  return {
    valid: true,
    query: normalized,
  };
}

/*
=========================================================
SAFE SCORE
=========================================================
*/

function safeMatchScore(
  score
) {
  const number =
    Number(score);

  if (
    !Number.isFinite(number)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      number
    )
  );
}

/*
=========================================================
EXPORT
=========================================================
*/

export {
  normalize,

  productMatchesExpected,

  calculatePrecision,

  calculateRecall,

  calculateF1,

  calculateTopResultAccuracy,

  calculateAverageMatchScore,

  evaluateQuery,

  evaluateDataset,

  validateSearchInput,

  safeMatchScore,
};
