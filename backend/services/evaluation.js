"use strict";

/*
=========================================================
FASHION AI DISCOVERY
DAY 10 — RESEARCH EVALUATION ENGINE
=========================================================

Metrics:
1. Precision@K
2. Recall@K
3. F1@K
4. MRR@K
5. NDCG@K

This module evaluates ranked retrieval results
against human-curated relevance judgments.
=========================================================
*/


/*
=========================================================
NORMALIZATION
=========================================================
*/

function normalizeId(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}


/*
=========================================================
UNIQUE IDS
=========================================================
*/

function uniqueIds(values) {
  return [
    ...new Set(
      (values || [])
        .map(normalizeId)
        .filter(Boolean)
    )
  ];
}


/*
=========================================================
RELEVANCE NORMALIZATION
=========================================================
*/

function normalizeRelevance(value) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(3, score)
  );
}


/*
=========================================================
RELEVANCE MAP
=========================================================
*/

function buildRelevanceMap(relevance) {
  const map = new Map();

  if (!Array.isArray(relevance)) {
    return map;
  }

  for (const item of relevance) {
    if (!item) {
      continue;
    }

    const id = normalizeId(
      item.productId ?? item.id
    );

    if (!id) {
      continue;
    }

    map.set(
      id,
      normalizeRelevance(
        item.relevance
      )
    );
  }

  return map;
}


/*
=========================================================
RELEVANCE CHECK
=========================================================
*/

function isRelevant(
  productId,
  relevanceMap
) {
  return (
    normalizeRelevance(
      relevanceMap.get(
        normalizeId(productId)
      )
    ) > 0
  );
}


/*
=========================================================
PRECISION@K
=========================================================

Precision@K =
relevant retrieved items / K

If fewer than K results are returned,
the denominator is the number of retrieved
results actually available.
=========================================================
*/

function precisionAtK(
  retrievedIds,
  relevanceMap,
  k
) {
  const results =
    uniqueIds(retrievedIds)
      .slice(0, k);

  if (!results.length) {
    return 0;
  }

  const relevantCount =
    results.filter(
      (id) =>
        isRelevant(
          id,
          relevanceMap
        )
    ).length;

  return relevantCount / results.length;
}


/*
=========================================================
RECALL@K
=========================================================
*/

function recallAtK(
  retrievedIds,
  relevanceMap,
  k
) {
  const results =
    uniqueIds(retrievedIds)
      .slice(0, k);

  const relevantTotal =
    [...relevanceMap.values()]
      .filter(
        (score) =>
          score > 0
      ).length;

  if (!relevantTotal) {
    return 0;
  }

  const relevantRetrieved =
    results.filter(
      (id) =>
        isRelevant(
          id,
          relevanceMap
        )
    ).length;

  return (
    relevantRetrieved /
    relevantTotal
  );
}


/*
=========================================================
F1@K
=========================================================
*/

function f1AtK(
  retrievedIds,
  relevanceMap,
  k
) {
  const precision =
    precisionAtK(
      retrievedIds,
      relevanceMap,
      k
    );

  const recall =
    recallAtK(
      retrievedIds,
      relevanceMap,
      k
    );

  if (
    precision === 0 &&
    recall === 0
  ) {
    return 0;
  }

  return (
    2 *
    precision *
    recall
  ) /
  (
    precision +
    recall
  );
}


/*
=========================================================
MRR@K
=========================================================

Mean Reciprocal Rank for a single query.

Uses the first relevant result.
=========================================================
*/

function reciprocalRankAtK(
  retrievedIds,
  relevanceMap,
  k
) {
  const results =
    uniqueIds(retrievedIds)
      .slice(0, k);

  for (
    let index = 0;
    index < results.length;
    index++
  ) {
    if (
      isRelevant(
        results[index],
        relevanceMap
      )
    ) {
      return 1 / (index + 1);
    }
  }

  return 0;
}


/*
=========================================================
DCG@K
=========================================================

Uses graded relevance:

0 = irrelevant
1 = weakly relevant
2 = relevant
3 = highly relevant
=========================================================
*/

function dcgAtK(
  retrievedIds,
  relevanceMap,
  k
) {
  const results =
    uniqueIds(retrievedIds)
      .slice(0, k);

  let dcg = 0;

  for (
    let index = 0;
    index < results.length;
    index++
  ) {
    const relevance =
      normalizeRelevance(
        relevanceMap.get(
          results[index]
        )
      );

    if (index === 0) {
      dcg += relevance;
    } else {
      dcg +=
        relevance /
        Math.log2(index + 2);
    }
  }

  return dcg;
}


/*
=========================================================
IDEAL DCG@K
=========================================================
*/

function idealDcgAtK(
  relevanceMap,
  k
) {
  const relevanceScores =
    [...relevanceMap.values()]
      .map(normalizeRelevance)
      .sort(
        (a, b) =>
          b - a
      )
      .slice(0, k);

  let idcg = 0;

  for (
    let index = 0;
    index < relevanceScores.length;
    index++
  ) {
    const relevance =
      relevanceScores[index];

    if (index === 0) {
      idcg += relevance;
    } else {
      idcg +=
        relevance /
        Math.log2(index + 2);
    }
  }

  return idcg;
}


/*
=========================================================
NDCG@K
=========================================================
*/

function ndcgAtK(
  retrievedIds,
  relevanceMap,
  k
) {
  const dcg =
    dcgAtK(
      retrievedIds,
      relevanceMap,
      k
    );

  const idcg =
    idealDcgAtK(
      relevanceMap,
      k
    );

  if (idcg === 0) {
    return 0;
  }

  return dcg / idcg;
}


/*
=========================================================
SINGLE QUERY EVALUATION
=========================================================
*/

function evaluateQuery({
  query,
  retrievedIds,
  relevance,
  kValues = [1, 3, 5, 10]
}) {
  const relevanceMap =
    buildRelevanceMap(
      relevance
    );

  const metrics = {};

  for (const k of kValues) {
    metrics[`@${k}`] = {
      precision:
        Number(
          precisionAtK(
            retrievedIds,
            relevanceMap,
            k
          ).toFixed(4)
        ),

      recall:
        Number(
          recallAtK(
            retrievedIds,
            relevanceMap,
            k
          ).toFixed(4)
        ),

      f1:
        Number(
          f1AtK(
            retrievedIds,
            relevanceMap,
            k
          ).toFixed(4)
        ),

      mrr:
        Number(
          reciprocalRankAtK(
            retrievedIds,
            relevanceMap,
            k
          ).toFixed(4)
        ),

      ndcg:
        Number(
          ndcgAtK(
            retrievedIds,
            relevanceMap,
            k
          ).toFixed(4)
        )
    };
  }

  return {
    query,
    retrievedIds:
      uniqueIds(
        retrievedIds
      ),
    relevance,
    metrics
  };
}


/*
=========================================================
MEAN
=========================================================
*/

function mean(values) {
  const valid =
    values.filter(
      (value) =>
        Number.isFinite(
          Number(value)
        )
    );

  if (!valid.length) {
    return 0;
  }

  return (
    valid.reduce(
      (sum, value) =>
        sum + Number(value),
      0
    ) /
    valid.length
  );
}


/*
=========================================================
AGGREGATE QUERY RESULTS
=========================================================
*/

function aggregateResults(
  queryResults,
  kValues = [1, 3, 5, 10]
) {
  const aggregate = {};

  for (const k of kValues) {
    const key = `@${k}`;

    aggregate[key] = {
      precision:
        Number(
          mean(
            queryResults.map(
              (result) =>
                result.metrics[key]
                  ?.precision ?? 0
            )
          ).toFixed(4)
        ),

      recall:
        Number(
          mean(
            queryResults.map(
              (result) =>
                result.metrics[key]
                  ?.recall ?? 0
            )
          ).toFixed(4)
        ),

      f1:
        Number(
          mean(
            queryResults.map(
              (result) =>
                result.metrics[key]
                  ?.f1 ?? 0
            )
          ).toFixed(4)
        ),

      mrr:
        Number(
          mean(
            queryResults.map(
              (result) =>
                result.metrics[key]
                  ?.mrr ?? 0
            )
          ).toFixed(4)
        ),

      ndcg:
        Number(
          mean(
            queryResults.map(
              (result) =>
                result.metrics[key]
                  ?.ndcg ?? 0
            )
          ).toFixed(4)
        )
    };
  }

  return aggregate;
}


/*
=========================================================
EVALUATE DATASET
=========================================================
*/

function evaluateDataset({
  cases,
  retrieve,
  kValues = [1, 3, 5, 10]
}) {
  if (!Array.isArray(cases)) {
    throw new Error(
      "Evaluation cases must be an array."
    );
  }

  if (
    typeof retrieve !== "function"
  ) {
    throw new Error(
      "retrieve must be a function."
    );
  }

  const queryResults = [];

  for (const testCase of cases) {
    const query =
      String(
        testCase.query ?? ""
      ).trim();

    if (!query) {
      continue;
    }

    const retrieved =
      retrieve(
        query,
        testCase
      );

    const retrievedIds =
      Array.isArray(retrieved)
        ? retrieved.map(
            (item) =>
              typeof item === "object"
                ? item.id ??
                  item.productId
                : item
          )
        : [];

    queryResults.push(
      evaluateQuery({
        query,
        retrievedIds,
        relevance:
          testCase.relevance || [],
        kValues
      })
    );
  }

  return {
    totalQueries:
      queryResults.length,

    kValues,

    aggregate:
      aggregateResults(
        queryResults,
        kValues
      ),

    queries:
      queryResults
  };
}


/*
=========================================================
EXPORTS
=========================================================
*/

module.exports = {
  normalizeId,
  uniqueIds,
  normalizeRelevance,
  buildRelevanceMap,
  precisionAtK,
  recallAtK,
  f1AtK,
  reciprocalRankAtK,
  dcgAtK,
  idealDcgAtK,
  ndcgAtK,
  evaluateQuery,
  mean,
  aggregateResults,
  evaluateDataset
};
