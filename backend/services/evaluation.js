/**
 * ============================================================
 * FASHION AI DISCOVERY
 * DAY 10 — RESEARCH-GRADE EVALUATION FRAMEWORK
 * ============================================================
 *
 * Metrics:
 * - Precision@K
 * - Recall@K
 * - F1@K
 * - MRR@K
 * - NDCG@K
 *
 * Supports:
 * - Binary relevance
 * - Graded relevance
 * - Per-query evaluation
 * - Aggregate evaluation
 * - Baseline comparison
 * ============================================================
 */


/* ============================================================
   UTILITY FUNCTIONS
============================================================ */

function normalizeId(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}


function unique(values) {
  return [...new Set(values)];
}


/* ============================================================
   RELEVANCE
============================================================ */

/**
 * Convert a relevance object into a normalized map.
 *
 * Example:
 *
 * {
 *   "1": 3,
 *   "2": 2,
 *   "3": 0
 * }
 */
function normalizeRelevance(relevance) {
  const map = {};

  if (!relevance) {
    return map;
  }

  if (Array.isArray(relevance)) {
    relevance.forEach((item) => {
      if (typeof item === "object") {
        const id = normalizeId(
          item.id ?? item.productId
        );

        const score = Number(
          item.relevance ?? item.score ?? 1
        );

        if (id !== null) {
          map[id] = score;
        }
      } else {
        map[normalizeId(item)] = 1;
      }
    });

    return map;
  }

  if (typeof relevance === "object") {
    Object.entries(relevance).forEach(
      ([id, score]) => {
        map[normalizeId(id)] = Number(score);
      }
    );
  }

  return map;
}


/**
 * Relevant means relevance > 0.
 */
function isRelevant(score) {
  return Number(score) > 0;
}


/* ============================================================
   PRECISION@K
============================================================ */

/**
 * Precision@K
 *
 * Precision@K =
 * relevant retrieved items / K
 *
 * We use min(K, retrieved length) when the result list
 * contains fewer than K items.
 */
function precisionAtK(retrieved, relevance, k) {
  const ranking = retrieved
    .map(normalizeId)
    .filter(Boolean)
    .slice(0, k);

  if (ranking.length === 0) {
    return 0;
  }

  const relevantRetrieved = ranking.filter(
    (id) => isRelevant(relevance[id])
  ).length;

  return relevantRetrieved / ranking.length;
}


/* ============================================================
   RECALL@K
============================================================ */

/**
 * Recall@K
 *
 * Recall@K =
 * relevant retrieved items / all relevant items
 */
function recallAtK(retrieved, relevance, k) {
  const ranking = retrieved
    .map(normalizeId)
    .filter(Boolean)
    .slice(0, k);

  const relevantIds = Object.entries(relevance)
    .filter(([, score]) => isRelevant(score))
    .map(([id]) => id);

  if (relevantIds.length === 0) {
    return 0;
  }

  const hits = ranking.filter(
    (id) => isRelevant(relevance[id])
  ).length;

  return hits / relevantIds.length;
}


/* ============================================================
   F1@K
============================================================ */

function f1AtK(retrieved, relevance, k) {
  const precision = precisionAtK(
    retrieved,
    relevance,
    k
  );

  const recall = recallAtK(
    retrieved,
    relevance,
    k
  );

  if (precision + recall === 0) {
    return 0;
  }

  return (
    2 *
    precision *
    recall
  ) / (
    precision + recall
  );
}


/* ============================================================
   MRR@K
============================================================ */

/**
 * Mean Reciprocal Rank for one query.
 *
 * RR =
 * 1 / rank of first relevant result
 */
function reciprocalRankAtK(
  retrieved,
  relevance,
  k
) {
  const ranking = retrieved
    .map(normalizeId)
    .filter(Boolean)
    .slice(0, k);

  for (let i = 0; i < ranking.length; i++) {
    if (isRelevant(relevance[ranking[i]])) {
      return 1 / (i + 1);
    }
  }

  return 0;
}


/* ============================================================
   NDCG@K
============================================================ */

/**
 * Discounted cumulative gain.
 *
 * DCG =
 * Σ ((2^rel - 1) / log2(rank + 1))
 */
function dcgAtK(retrieved, relevance, k) {
  const ranking = retrieved
    .map(normalizeId)
    .filter(Boolean)
    .slice(0, k);

  let dcg = 0;

  ranking.forEach((id, index) => {
    const rel = Number(
      relevance[id] || 0
    );

    const rank = index + 1;

    dcg += (
      (Math.pow(2, rel) - 1) /
      Math.log2(rank + 1)
    );
  });

  return dcg;
}


/**
 * Ideal DCG.
 */
function idealDcgAtK(relevance, k) {
  const scores = Object.values(relevance)
    .map(Number)
    .filter((score) => score > 0)
    .sort((a, b) => b - a)
    .slice(0, k);

  let idcg = 0;

  scores.forEach((rel, index) => {
    const rank = index + 1;

    idcg += (
      (Math.pow(2, rel) - 1) /
      Math.log2(rank + 1)
    );
  });

  return idcg;
}


/**
 * Normalized Discounted Cumulative Gain.
 */
function ndcgAtK(retrieved, relevance, k) {
  const dcg = dcgAtK(
    retrieved,
    relevance,
    k
  );

  const idcg = idealDcgAtK(
    relevance,
    k
  );

  if (idcg === 0) {
    return 0;
  }

  return dcg / idcg;
}


/* ============================================================
   SINGLE QUERY EVALUATION
============================================================ */

function evaluateQuery({
  query,
  retrieved,
  relevance,
  k = 5
}) {
  const normalizedRelevance =
    normalizeRelevance(relevance);

  const ranking = retrieved
    .map(normalizeId)
    .filter(Boolean);

  const precision =
    precisionAtK(
      ranking,
      normalizedRelevance,
      k
    );

  const recall =
    recallAtK(
      ranking,
      normalizedRelevance,
      k
    );

  const f1 =
    f1AtK(
      ranking,
      normalizedRelevance,
      k
    );

  const rr =
    reciprocalRankAtK(
      ranking,
      normalizedRelevance,
      k
    );

  const ndcg =
    ndcgAtK(
      ranking,
      normalizedRelevance,
      k
    );

  const relevantRetrieved =
    ranking
      .slice(0, k)
      .filter(
        (id) =>
          isRelevant(
            normalizedRelevance[id]
          )
      );

  return {
    query,

    k,

    retrievedCount:
      ranking.length,

    relevantCount:
      Object.values(normalizedRelevance)
        .filter(isRelevant)
        .length,

    relevantRetrievedCount:
      relevantRetrieved.length,

    precisionAtK:
      Number(precision.toFixed(6)),

    recallAtK:
      Number(recall.toFixed(6)),

    f1AtK:
      Number(f1.toFixed(6)),

    reciprocalRank:
      Number(rr.toFixed(6)),

    ndcgAtK:
      Number(ndcg.toFixed(6)),

    retrievedTopK:
      ranking.slice(0, k),

    relevantRetrievedIds:
      relevantRetrieved
  };
}


/* ============================================================
   AGGREGATION
============================================================ */

function mean(values) {
  if (!values.length) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + Number(value || 0),
      0
    ) / values.length
  );
}


function aggregateResults(results) {
  if (!results.length) {
    return {
      queryCount: 0,
      precisionAtK: 0,
      recallAtK: 0,
      f1AtK: 0,
      mrrAtK: 0,
      ndcgAtK: 0
    };
  }

  return {
    queryCount: results.length,

    precisionAtK:
      Number(
        mean(
          results.map(
            (item) =>
              item.precisionAtK
          )
        ).toFixed(6)
      ),

    recallAtK:
      Number(
        mean(
          results.map(
            (item) =>
              item.recallAtK
          )
        ).toFixed(6)
      ),

    f1AtK:
      Number(
        mean(
          results.map(
            (item) =>
              item.f1AtK
          )
        ).toFixed(6)
      ),

    mrrAtK:
      Number(
        mean(
          results.map(
            (item) =>
              item.reciprocalRank
          )
        ).toFixed(6)
      ),

    ndcgAtK:
      Number(
        mean(
          results.map(
            (item) =>
              item.ndcgAtK
          )
        ).toFixed(6)
      )
  };
}


/* ============================================================
   DATASET EVALUATION
============================================================ */

function evaluateDataset(
  cases,
  k = 5
) {
  const results = cases.map(
    (testCase) => {

      const retrieved =
        testCase.retrieved ||
        testCase.results ||
        testCase.ranking ||
        [];

      const relevance =
        testCase.relevance ||
        testCase.relevant ||
        {};

      return evaluateQuery({
        query:
          testCase.query,

        retrieved,

        relevance,

        k
      });
    }
  );

  return {
    metadata: {
      evaluationVersion:
        "day-10-v1",

      metricK:
        k,

      generatedAt:
        new Date().toISOString()
    },

    aggregate:
      aggregateResults(results),

    queries:
      results
  };
}


/* ============================================================
   MODEL / SYSTEM COMPARISON
============================================================ */

function compareSystems(
  systems,
  cases,
  k = 5
) {
  const comparison = {};

  Object.entries(systems).forEach(
    ([name, resolver]) => {

      const evaluatedCases =
        cases.map((testCase) => {

          const retrieved =
            resolver(testCase);

          return {
            ...testCase,
            retrieved
          };
        });

      const evaluation =
        evaluateDataset(
          evaluatedCases,
          k
        );

      comparison[name] =
        evaluation.aggregate;
    }
  );

  return comparison;
}


/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  normalizeRelevance,

  precisionAtK,

  recallAtK,

  f1AtK,

  reciprocalRankAtK,

  dcgAtK,

  idealDcgAtK,

  ndcgAtK,

  evaluateQuery,

  aggregateResults,

  evaluateDataset,

  compareSystems
};
