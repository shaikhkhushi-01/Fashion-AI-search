function normalizeId(value) {
  return String(value);
}

function getRank(
  rankedIds,
  relevantIds
) {
  const relevant =
    new Set(
      relevantIds.map(
        normalizeId
      )
    );

  for (
    let index = 0;
    index < rankedIds.length;
    index += 1
  ) {
    if (
      relevant.has(
        normalizeId(
          rankedIds[index]
        )
      )
    ) {
      return index + 1;
    }
  }

  return null;
}

function classifyError(
  rankedIds,
  relevantIds,
  k = 5
) {
  const relevant =
    new Set(
      relevantIds.map(
        normalizeId
      )
    );

  const topK =
    rankedIds
      .slice(0, k)
      .map(normalizeId);

  const matched =
    topK.filter(
      id =>
        relevant.has(id)
    );

  if (!relevant.size) {
    return "no-label";
  }

  if (matched.length === 0) {
    return "complete-miss";
  }

  if (
    getRank(
      rankedIds,
      relevantIds
    ) > 1
  ) {
    return "late-relevant-result";
  }

  if (
    matched.length <
    Math.min(
      relevant.size,
      k
    )
  ) {
    return "partial-recall";
  }

  return "correct";
}

function analyzeQuery(
  query,
  rankedIds,
  relevantIds,
  k = 5
) {
  const rank =
    getRank(
      rankedIds,
      relevantIds
    );

  const classification =
    classifyError(
      rankedIds,
      relevantIds,
      k
    );

  return {
    query,
    rank,
    classification,
    topK:
      rankedIds.slice(0, k),
    relevantIds
  };
}

function analyzeDataset(
  evaluationCases,
  rankings,
  k = 5
) {
  const reports = [];

  for (
    const testCase of evaluationCases
  ) {
    const ranked =
      rankings.get(
        testCase.query
      ) || [];

    reports.push(
      analyzeQuery(
        testCase.query,
        ranked,
        testCase.relevantIds,
        k
      )
    );
  }

  const counts = {};

  for (const report of reports) {
    counts[report.classification] =
      (counts[report.classification] || 0) +
      1;
  }

  return {
    totalQueries: reports.length,
    counts,
    reports
  };
}

function buildErrorCategories(
  reports
) {
  const categories = {};

  for (const report of reports) {
    const category =
      report.classification;

    if (!categories[category]) {
      categories[category] = [];
    }

    categories[category].push(
      report.query
    );
  }

  return categories;
}

export {
  normalizeId,
  getRank,
  classifyError,
  analyzeQuery,
  analyzeDataset,
  buildErrorCategories
};
