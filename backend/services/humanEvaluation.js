function parseRelevance(value) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4) return value;
  const labels = { irrelevant: 0, weak: 1, relevant: 2, good: 3, excellent: 4, perfect: 4 };
  const key = String(value ?? "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(labels, key) ? labels[key] : null;
}

function normalizeJudgment(value) {
  const parsed = parseRelevance(value);
  if (parsed === null) throw new Error("Invalid relevance judgment; expected integer 0-4.");
  return parsed;
}

function buildAgreementMatrix(judgments, categoryCount = 5) {
  return judgments.map(values => {
    const row = Array(categoryCount).fill(0);
    for (const value of values) row[normalizeJudgment(value)] += 1;
    return row;
  });
}

function fleissKappa(matrix) {
  if (!Array.isArray(matrix) || !matrix.length) return 0;
  const countsPerItem = matrix.map(row => row.reduce((sum, count) => sum + count, 0));
  const n = countsPerItem[0] || 0;
  if (n < 2 || countsPerItem.some(count => count !== n)) {
    throw new Error("Fleiss' kappa requires the same number of ratings for every item.");
  }
  const pa = matrix.map(row => {
    const total = row.reduce((sum, count) => sum + count, 0);
    return (row.reduce((sum, count) => sum + count * count, 0) - total) / (total * (total - 1));
  });
  const pBar = pa.reduce((sum, value) => sum + value, 0) / pa.length;
  const totals = Array.from(
    { length: matrix[0].length },
    (_, index) => matrix.reduce((sum, row) => sum + (row[index] || 0), 0)
  );
  const all = matrix.reduce((sum, row) => sum + row.reduce((x, count) => x + count, 0), 0);
  const pE = totals.reduce((sum, total) => sum + (total / all) ** 2, 0);
  return pE === 1 ? 1 : (pBar - pE) / (1 - pE);
}

function groupByPair(records = []) {
  const groups = new Map();
  for (const record of records) {
    const queryId = String(record?.queryId ?? "").trim();
    const productId = String(record?.productId ?? "").trim();
    if (!queryId || !productId) continue;
    const key = queryId + "::" + productId;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(normalizeJudgment(record.relevance));
  }
  return groups;
}

function validateHumanJudgments(records = [], { minAnnotationsPerPair = 3, exactAnnotationsPerPair = 3 } = {}) {
  if (!Array.isArray(records) || !records.length) throw new Error("No human judgments supplied.");
  const seen = new Set();
  const groups = new Map();

  for (const record of records) {
    const queryId = String(record?.queryId ?? "").trim();
    const productId = String(record?.productId ?? "").trim();
    const annotatorId = String(record?.annotatorId ?? "").trim();
    if (!queryId || !productId || !annotatorId) {
      throw new Error("Every judgment requires queryId, productId, and annotatorId.");
    }
    const relevance = parseRelevance(record.relevance);
    if (relevance === null) throw new Error(`Invalid relevance for ${queryId}/${productId}/${annotatorId}; expected integer 0-4.`);
    const key = queryId + "::" + productId + "::" + annotatorId;
    if (seen.has(key)) throw new Error(`Duplicate annotator judgment: ${key}`);
    seen.add(key);
    const pairKey = queryId + "::" + productId;
    if (!groups.has(pairKey)) groups.set(pairKey, []);
    groups.get(pairKey).push(relevance);
  }

  for (const [pairKey, values] of groups) {
    if (values.length < minAnnotationsPerPair) {
      throw new Error(`Insufficient independent annotations for ${pairKey}: found ${values.length}, need at least ${minAnnotationsPerPair}.`);
    }
    if (exactAnnotationsPerPair !== null && values.length !== exactAnnotationsPerPair) {
      throw new Error(`Expected exactly ${exactAnnotationsPerPair} annotations for ${pairKey}, found ${values.length}.`);
    }
  }

  return {
    valid: true,
    annotationCount: records.length,
    judgedPairs: groups.size,
    minAnnotationsPerPair: Math.min(...[...groups.values()].map(values => values.length)),
    maxAnnotationsPerPair: Math.max(...[...groups.values()].map(values => values.length))
  };
}

function majorityLabel(values) {
  if (!values.length) return null;
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

function aggregateJudgments(records = []) {
  const groups = groupByPair(records);
  const output = [];
  for (const [key, values] of groups) {
    const [queryId, productId] = key.split("::");
    output.push({
      queryId,
      productId,
      relevance: majorityLabel(values),
      meanRelevance: values.reduce((sum, value) => sum + value, 0) / values.length,
      annotationCount: values.length
    });
  }
  return output;
}

function summarizeHumanLabels(records = []) {
  const validation = validateHumanJudgments(records);
  const groups = groupByPair(records);
  const queryIds = new Set(records.map(record => String(record.queryId).trim()));
  const matrix = [...groups.values()];
  const means = matrix.map(values => values.reduce((sum, value) => sum + value, 0) / values.length);
  const agreementMatrix = buildAgreementMatrix(matrix);

  return {
    queryCount: queryIds.size,
    judgedPairs: groups.size,
    annotationCount: records.length,
    minAnnotationsPerPair: validation.minAnnotationsPerPair,
    maxAnnotationsPerPair: validation.maxAnnotationsPerPair,
    meanRelevance: means.length ? means.reduce((sum, value) => sum + value, 0) / means.length : 0,
    fleissKappa: fleissKappa(agreementMatrix),
    agreementMatrix,
    aggregated: aggregateJudgments(records)
  };
}

export {
  normalizeJudgment,
  buildAgreementMatrix,
  fleissKappa,
  groupByPair,
  majorityLabel,
  aggregateJudgments,
  validateHumanJudgments,
  summarizeHumanLabels
};
