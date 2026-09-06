function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function relevanceValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function binaryRelevance(value, threshold = 1) {
  return relevanceValue(value) >= threshold ? 1 : 0;
}

function precisionAtK(predicted, relevant, k = 5) {
  const predictions = predicted.slice(0, k);
  if (!predictions.length) return 0;

  const relevantSet = new Set(relevant.map(String));
  const hits = predictions.filter(item => relevantSet.has(String(item))).length;

  return hits / predictions.length;
}

function recallAtK(predicted, relevant, k = 5) {
  if (!relevant.length) return 0;

  const predictions = predicted.slice(0, k);
  const relevantSet = new Set(relevant.map(String));
  const hits = predictions.filter(item => relevantSet.has(String(item))).length;

  return hits / relevantSet.size;
}

function f1AtK(predicted, relevant, k = 5) {
  const precision = precisionAtK(predicted, relevant, k);
  const recall = recallAtK(predicted, relevant, k);

  if (precision + recall === 0) return 0;

  return (2 * precision * recall) / (precision + recall);
}

function reciprocalRank(predicted, relevant) {
  const relevantSet = new Set(relevant.map(String));

  for (let index = 0; index < predicted.length; index += 1) {
    if (relevantSet.has(String(predicted[index]))) {
      return 1 / (index + 1);
    }
  }

  return 0;
}

function mrr(predictions, relevantLists) {
  if (!relevantLists.length) return 0;

  const scores = predictions.map((prediction, index) => {
    return reciprocalRank(prediction, relevantLists[index] || []);
  });

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function dcgAtK(predicted, relevanceMap, k = 5) {
  return predicted
    .slice(0, k)
    .reduce((sum, productId, index) => {
      const relevance = relevanceValue(relevanceMap[String(productId)]);

      if (relevance <= 0) {
        return sum;
      }

      return sum + ((2 ** relevance) - 1) / Math.log2(index + 2);
    }, 0);
}

function ndcgAtK(predicted, relevanceMap, k = 5) {
  const actual = dcgAtK(predicted, relevanceMap, k);

  const ideal = Object.values(relevanceMap)
    .map(relevanceValue)
    .sort((a, b) => b - a)
    .slice(0, k);

  const idealDcg = ideal.reduce((sum, relevance, index) => {
    return sum + ((2 ** relevance) - 1) / Math.log2(index + 2);
  }, 0);

  if (idealDcg === 0) return 0;

  return actual / idealDcg;
}

function averagePrecision(predicted, relevant) {
  if (!relevant.length) return 0;

  const relevantSet = new Set(relevant.map(String));
  let hits = 0;
  let score = 0;

  predicted.forEach((item, index) => {
    if (relevantSet.has(String(item))) {
      hits += 1;
      score += hits / (index + 1);
    }
  });

  return score / relevantSet.size;
}

function evaluateQuery(predicted, relevant, relevanceMap = {}, k = 5) {
  return {
    precisionAtK: precisionAtK(predicted, relevant, k),
    recallAtK: recallAtK(predicted, relevant, k),
    f1AtK: f1AtK(predicted, relevant, k),
    reciprocalRank: reciprocalRank(predicted, relevant),
    ndcgAtK: ndcgAtK(predicted, relevanceMap, k),
    averagePrecision: averagePrecision(predicted, relevant)
  };
}

function mean(values) {
  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function aggregateMetrics(results) {
  return {
    precisionAtK: mean(results.map(item => item.precisionAtK)),
    recallAtK: mean(results.map(item => item.recallAtK)),
    f1AtK: mean(results.map(item => item.f1AtK)),
    mrr: mean(results.map(item => item.reciprocalRank)),
    ndcgAtK: mean(results.map(item => item.ndcgAtK)),
    map: mean(results.map(item => item.averagePrecision))
  };
}

function evaluateDataset(cases, predictor, options = {}) {
  const k = Number(options.k || 5);
  const queryResults = [];

  for (const testCase of cases) {
    const predicted = predictor(testCase.query, testCase);

    const result = evaluateQuery(
      predicted,
      testCase.relevant || [],
      testCase.relevance || {},
      k
    );

    queryResults.push({
      query: testCase.query,
      predicted: predicted.slice(0, k),
      relevant: testCase.relevant || [],
      metrics: result
    });
  }

  const metrics = aggregateMetrics(
    queryResults.map(item => item.metrics)
  );

  return {
    k,
    queries: queryResults,
    metrics
  };
}

function compareSystems(cases, systems, options = {}) {
  const results = {};

  for (const [name, predictor] of Object.entries(systems)) {
    results[name] = evaluateDataset(cases, predictor, options);
  }

  return results;
}

function formatMetric(value) {
  return Number(Number(value).toFixed(4));
}

function createEvaluationReport(results) {
  const systems = {};

  for (const [name, result] of Object.entries(results)) {
    systems[name] = {
      precisionAtK: formatMetric(result.metrics.precisionAtK),
      recallAtK: formatMetric(result.metrics.recallAtK),
      f1AtK: formatMetric(result.metrics.f1AtK),
      mrr: formatMetric(result.metrics.mrr),
      ndcgAtK: formatMetric(result.metrics.ndcgAtK),
      map: formatMetric(result.metrics.map)
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    systems,
    queryCount: Object.values(results)[0]?.queries?.length || 0,
    k: Object.values(results)[0]?.k || 5
  };
}

export {
  precisionAtK,
  recallAtK,
  f1AtK,
  reciprocalRank,
  mrr,
  ndcgAtK,
  averagePrecision,
  evaluateQuery,
  evaluateDataset,
  aggregateMetrics,
  compareSystems,
  createEvaluationReport
};
