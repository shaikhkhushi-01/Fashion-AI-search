import { keywordBaseline, categoryBaseline, priceBaseline, popularityBaseline } from "./baselines.js";
import { analyzeDataset } from "./errorAnalysis.js";
import { summarizeMetric, compareMetricSamples } from "./statistics.js";
import { generateResearchReport } from "./researchReport.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function idOf(product) {
  return normalize(product?.id ?? product?.productId);
}

function buildRankingMap(products, rankingFunction, query) {
  const ranked = rankingFunction(products, query);

  return ranked.map((item, index) => {
    const product = item.product ?? item;
    const score = Number(item.score ?? item.relevance ?? 0);

    return {
      product,
      id: idOf(product),
      score: Number.isFinite(score) ? score : 0,
      rank: index + 1
    };
  });
}

function relevantIds(testCase) {
  return new Set(
    (testCase.relevantProductIds ?? testCase.relevantIds ?? [])
      .map(normalize)
  );
}

function reciprocalRank(ranked, relevant) {
  for (let i = 0; i < ranked.length; i += 1) {
    if (relevant.has(ranked[i].id)) {
      return 1 / (i + 1);
    }
  }

  return 0;
}

function precisionAtK(ranked, relevant, k = 5) {
  const top = ranked.slice(0, k);

  if (!top.length) {
    return 0;
  }

  const hits = top.filter(item => relevant.has(item.id)).length;

  return hits / top.length;
}

function recallAtK(ranked, relevant, k = 5) {
  if (!relevant.size) {
    return 0;
  }

  const hits = ranked
    .slice(0, k)
    .filter(item => relevant.has(item.id))
    .length;

  return hits / relevant.size;
}

function evaluateRanking(ranked, testCase, k = 5) {
  const relevant = relevantIds(testCase);
  const precision = precisionAtK(ranked, relevant, k);
  const recall = recallAtK(ranked, relevant, k);

  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);

  return {
    precisionAtK: precision,
    recallAtK: recall,
    f1AtK: f1,
    reciprocalRank: reciprocalRank(ranked, relevant)
  };
}

function evaluateSystem(products, cases, rankingFunction, k = 5) {
  const rows = [];

  for (const testCase of cases) {
    const ranked = buildRankingMap(
      products,
      rankingFunction,
      testCase.query
    );

    rows.push({
      query: testCase.query,
      ranking: ranked,
      metrics: evaluateRanking(ranked, testCase, k)
    });
  }

  return rows;
}

function aggregate(rows) {
  const precision = rows.map(row => row.metrics.precisionAtK);
  const recall = rows.map(row => row.metrics.recallAtK);
  const f1 = rows.map(row => row.metrics.f1AtK);
  const mrr = rows.map(row => row.metrics.reciprocalRank);

  return {
    precisionAtK: summarizeMetric(precision),
    recallAtK: summarizeMetric(recall),
    f1AtK: summarizeMetric(f1),
    mrr: summarizeMetric(mrr)
  };
}

function runResearchPipeline({
  products,
  evaluationCases,
  systems,
  k = 5
}) {
  const systemResults = {};
  const summaries = {};

  for (const [name, rankingFunction] of Object.entries(systems)) {
    const rows = evaluateSystem(
      products,
      evaluationCases,
      rankingFunction,
      k
    );

    systemResults[name] = rows;
    summaries[name] = aggregate(rows);
  }

  const errors = {};

for (const [name, rows] of Object.entries(systemResults)) {
  const rankings = new Map(
    rows.map(row => [
      row.query,
      row.ranking.map(item => item.id)
    ])
  );

  const cases = evaluationCases.map(testCase => ({
    query: testCase.query,
    relevantIds: Array.from(
      relevantIds(testCase)
    )
  }));

  errors[name] = analyzeDataset(
    cases,
    rankings,
    k
  );
}

  const report = generateResearchReport({
  dataset: {
    size: products.length,
    testQueries: evaluationCases.length
  },
  evaluation: summaries,
  ablation: [],
  robustness: {},
  errors,
  statistics: {}
});

  return {
    configuration: {
      k,
      queries: evaluationCases.length,
      catalogueSize: products.length
    },
    systems: systemResults,
    summaries,
    errors,
    report
  };
}

export {
  normalize,
  buildRankingMap,
  precisionAtK,
  recallAtK,
  reciprocalRank,
  evaluateRanking,
  evaluateSystem,
  aggregate,
  runResearchPipeline
};
