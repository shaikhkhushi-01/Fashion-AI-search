/*
=========================================================
FASHION AI DISCOVERY
DAY 1 - EVALUATION FOUNDATION
=========================================================
*/

function normalize(value) {

  return String(value ?? "")
    .toLowerCase()
    .trim();
}

/*
=========================================================
RELEVANCE
=========================================================
*/

export function isRelevant(
  product,
  expected
) {

  if (!product) {
    return false;
  }

  const expectedIds =
    Array.isArray(
      expected.productIds
    )
      ? expected.productIds
      : [];

  if (
    expectedIds.includes(
      product.id
    )
  ) {
    return true;
  }

  const expectedCategories =
    Array.isArray(
      expected.categories
    )
      ? expected.categories
      : [];

  if (
    expectedCategories.length &&
    expectedCategories.some(
      (category) =>
        normalize(
          product.category
        ) ===
        normalize(category)
    )
  ) {

    return true;
  }

  return false;
}

/*
=========================================================
PRECISION@K
=========================================================
*/

export function precisionAtK(
  results,
  expected,
  k = 5
) {

  const topK =
    results.slice(
      0,
      k
    );

  if (!topK.length) {
    return 0;
  }

  const relevant =
    topK.filter(
      (product) =>
        isRelevant(
          product,
          expected
        )
    ).length;

  return (
    relevant /
    topK.length
  );
}

/*
=========================================================
RECALL@K
=========================================================
*/

export function recallAtK(
  results,
  expected,
  k = 5
) {

  const expectedIds =
    Array.isArray(
      expected.productIds
    )
      ? expected.productIds
      : [];

  if (
    !expectedIds.length
  ) {
    return 0;
  }

  const topK =
    results.slice(
      0,
      k
    );

  const retrieved =
    topK.filter(
      (product) =>
        expectedIds.includes(
          product.id
        )
    ).length;

  return (
    retrieved /
    expectedIds.length
  );
}

/*
=========================================================
HIT RATE
=========================================================
*/

export function hitAtK(
  results,
  expected,
  k = 5
) {

  return results
    .slice(0, k)
    .some(
      (product) =>
        isRelevant(
          product,
          expected
        )
    )
    ? 1
    : 0;
}

/*
=========================================================
MRR
=========================================================
*/

export function reciprocalRank(
  results,
  expected
) {

  const index =
    results.findIndex(
      (product) =>
        isRelevant(
          product,
          expected
        )
    );

  if (index === -1) {
    return 0;
  }

  return 1 /
    (index + 1);
}

/*
=========================================================
QUERY EVALUATION
=========================================================
*/

export function evaluateQuery(
  results,
  expected
) {

  return {
    precisionAt5:
      precisionAtK(
        results,
        expected,
        5
      ),

    recallAt5:
      recallAtK(
        results,
        expected,
        5
      ),

    hitAt5:
      hitAtK(
        results,
        expected,
        5
      ),

    reciprocalRank:
      reciprocalRank(
        results,
        expected
      )
  };
}

/*
=========================================================
AGGREGATE METRICS
=========================================================
*/

export function aggregateMetrics(
  evaluations
) {

  if (
    !evaluations.length
  ) {

    return {
      queries: 0,
      precisionAt5: 0,
      recallAt5: 0,
      hitAt5: 0,
      meanReciprocalRank: 0
    };
  }

  const total =
    evaluations.length;

  const sum = (
    key
  ) =>
    evaluations.reduce(
      (value, item) =>
        value +
        Number(
          item[key] || 0
        ),
      0
    );

  return {

    queries:
      total,

    precisionAt5:
      Number(
        (
          sum("precisionAt5") /
          total
        ).toFixed(4)
      ),

    recallAt5:
      Number(
        (
          sum("recallAt5") /
          total
        ).toFixed(4)
      ),

    hitAt5:
      Number(
        (
          sum("hitAt5") /
          total
        ).toFixed(4)
      ),

    meanReciprocalRank:
      Number(
        (
          sum("reciprocalRank") /
          total
        ).toFixed(4)
      )
  };
}
