function normalizeId(value) {
  return String(value);
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
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

  const rank =
    getRank(
      rankedIds,
      relevantIds
    );

  if (
    rank !== null &&
    rank > 1
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

    const relevant =
      testCase.relevantIds ??
      testCase.relevantProductIds ??
      testCase.relevant ??
      [];

    reports.push(
      analyzeQuery(
        testCase.query,
        ranked,
        relevant,
        k
      )
    );
  }

  const counts = {};

  for (
    const report of reports
  ) {
    counts[
      report.classification
    ] =
      (
        counts[
          report.classification
        ] || 0
      ) + 1;
  }

  return {
    totalQueries:
      reports.length,
    counts,
    reports
  };
}

function buildErrorCategories(
  reports
) {
  const categories = {};

  for (
    const report of reports
  ) {
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

function compareRankings(
  evaluationCases,
  baselineRankings,
  improvedRankings,
  k = 5
) {
  const recovered = [];
  const regressed = [];
  const unchanged = [];

  for (
    const testCase of evaluationCases
  ) {
    const relevant =
      testCase.relevantIds ??
      testCase.relevantProductIds ??
      testCase.relevant ??
      [];

    const baseline =
      baselineRankings.get(
        testCase.query
      ) || [];

    const improved =
      improvedRankings.get(
        testCase.query
      ) || [];

    const baselineResult =
      analyzeQuery(
        testCase.query,
        baseline,
        relevant,
        k
      );

    const improvedResult =
      analyzeQuery(
        testCase.query,
        improved,
        relevant,
        k
      );

    const baselineRank =
      baselineResult.rank;

    const improvedRank =
      improvedResult.rank;

    const baselineSuccess =
      baselineRank !== null &&
      baselineRank <= k;

    const improvedSuccess =
      improvedRank !== null &&
      improvedRank <= k;

    if (
      !baselineSuccess &&
      improvedSuccess
    ) {
      recovered.push({
        query:
          testCase.query,
        baselineRank,
        improvedRank,
        baselineClassification:
          baselineResult.classification,
        improvedClassification:
          improvedResult.classification,
        topK:
          improvedResult.topK
      });

      continue;
    }

    if (
      baselineSuccess &&
      !improvedSuccess
    ) {
      regressed.push({
        query:
          testCase.query,
        baselineRank,
        improvedRank,
        baselineClassification:
          baselineResult.classification,
        improvedClassification:
          improvedResult.classification,
        topK:
          improvedResult.topK
      });

      continue;
    }

    unchanged.push({
      query:
        testCase.query,
      baselineRank,
      improvedRank,
      baselineClassification:
        baselineResult.classification,
      improvedClassification:
        improvedResult.classification
    });
  }

  return {
    totalQueries:
      evaluationCases.length,
    recovered,
    regressed,
    unchanged,
    recoveryRate:
      evaluationCases.length
        ? recovered.length /
          evaluationCases.length
        : 0,
    regressionRate:
      evaluationCases.length
        ? regressed.length /
          evaluationCases.length
        : 0
  };
}

function classifyQueryIntent(
  query
) {
  const text =
    normalizeText(query);

  const intents = [];

  if (
    /\b(under|below|less than|max|budget|affordable|cheap)\b/
      .test(text)
  ) {
    intents.push("budget");
  }

  if (
    /\b(for|office|college|travel|summer|winter|party|date|wedding|evening|casual|formal)\b/
      .test(text)
  ) {
    intents.push("occasion");
  }

  if (
    /\b(black|white|blue|cream|grey|gray|red|green|brown|beige)\b/
      .test(text)
  ) {
    intents.push("color");
  }

  if (
    /\b(cotton|linen|denim|leather|satin|wool|mesh)\b/
      .test(text)
  ) {
    intents.push("material");
  }

  if (
    /\b(minimal|classic|formal|casual|oversized|relaxed|elegant|streetwear|sporty|modern|luxury)\b/
      .test(text)
  ) {
    intents.push("style");
  }

  if (
    /\b(shirt|dress|trousers|jeans|sneakers|blazer|hoodie)\b/
      .test(text)
  ) {
    intents.push("category");
  }

  if (
    /\b(and|with|for|under|that|suitable|comfortable)\b/
      .test(text) &&
    intents.length >= 2
  ) {
    intents.push("compositional");
  }

  if (!intents.length) {
    intents.push("general");
  }

  return [
    ...new Set(intents)
  ];
}

function analyzeByIntent(
  evaluationCases,
  rankings,
  k = 5
) {
  const groups = {};

  for (
    const testCase of evaluationCases
  ) {
    const ranked =
      rankings.get(
        testCase.query
      ) || [];

    const relevant =
      testCase.relevantIds ??
      testCase.relevantProductIds ??
      testCase.relevant ??
      [];

    const result =
      analyzeQuery(
        testCase.query,
        ranked,
        relevant,
        k
      );

    const intents =
      classifyQueryIntent(
        testCase.query
      );

    for (
      const intent of intents
    ) {
      if (!groups[intent]) {
        groups[intent] = {
          queries: 0,
          correct: 0,
          partialRecall: 0,
          lateRelevant: 0,
          completeMiss: 0
        };
      }

      groups[intent].queries += 1;

      if (
        result.classification ===
        "correct"
      ) {
        groups[intent].correct += 1;
      }

      if (
        result.classification ===
        "partial-recall"
      ) {
        groups[intent].partialRecall += 1;
      }

      if (
        result.classification ===
        "late-relevant-result"
      ) {
        groups[intent].lateRelevant += 1;
      }

      if (
        result.classification ===
        "complete-miss"
      ) {
        groups[intent].completeMiss += 1;
      }
    }
  }

  for (
    const group of Object.values(
      groups
    )
  ) {
    group.successRate =
      group.queries
        ? group.correct /
          group.queries
        : 0;
  }

  return groups;
}

export {
  normalizeId,
  getRank,
  classifyError,
  analyzeQuery,
  analyzeDataset,
  buildErrorCategories,
  compareRankings,
  classifyQueryIntent,
  analyzeByIntent
};
