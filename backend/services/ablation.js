import {
  precisionAtK,
  recallAtK,
  f1AtK,
  mrr,
  ndcgAtK
} from "./evaluation.js";

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

  return Number.isFinite(number)
    ? number
    : fallback;
}

function textOf(product = {}) {
  return [
    product.name,
    product.brand,
    product.category,
    product.gender,
    product.color,
    product.style,
    product.occasion,
    product.material,
    product.fit,
    product.pattern,
    product.description,
    Array.isArray(product.tags)
      ? product.tags.join(" ")
      : product.tags
  ]
    .map(normalize)
    .join(" ");
}

function lexicalScore(product = {}, query = "") {
  const queryTokens = tokenize(query);

  if (!queryTokens.length) {
    return 0;
  }

  const text = textOf(product);

  const matched = queryTokens.filter(token =>
    text.includes(token)
  );

  return matched.length / queryTokens.length;
}

function attributeScore(product = {}, query = "") {
  const fields = [
    product.category,
    product.gender,
    product.color,
    product.style,
    product.occasion,
    product.material,
    product.fit,
    product.pattern
  ];

  const queryTokens = tokenize(query);

  if (!queryTokens.length) {
    return 0;
  }

  let matches = 0;

  for (const field of fields) {
    const fieldTokens = tokenize(field);

    if (
      queryTokens.some(token =>
        fieldTokens.includes(token)
      )
    ) {
      matches += 1;
    }
  }

  return Math.min(matches / 4, 1);
}

function budgetScore(product = {}, query = "") {
  const match = normalize(query).match(
    /(?:under|below|less than|upto|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i
  );

  if (!match) {
    return 1;
  }

  const budget = safeNumber(match[1]);
  const price = safeNumber(product.price);

  if (
    budget <= 0 ||
    price < 0
  ) {
    return 0;
  }

  if (price <= budget) {
    return 1;
  }

  return Math.max(
    0,
    1 - (price - budget) / budget
  );
}

function semanticScore(product = {}) {
  const values = [
    product.semanticScore,
    product.semantic_similarity,
    product.similarity,
    product.embeddingScore,
    product.vectorScore
  ];

  for (const value of values) {
    const score = safeNumber(value, -1);

    if (score >= 0) {
      return Math.max(
        0,
        Math.min(1, score)
      );
    }
  }

  return 0;
}

function scoreProduct(
  product = {},
  query = "",
  configuration = {}
) {
  let score = 0;
  let totalWeight = 0;

  if (configuration.lexical) {
    score +=
      lexicalScore(product, query) *
      0.35;

    totalWeight += 0.35;
  }

  if (configuration.semantic) {
    score +=
      semanticScore(product) *
      0.45;

    totalWeight += 0.45;
  }

  if (configuration.attributes) {
    score +=
      attributeScore(product, query) *
      0.15;

    totalWeight += 0.15;
  }

  if (configuration.budget) {
    score +=
      budgetScore(product, query) *
      0.05;

    totalWeight += 0.05;
  }

  if (totalWeight === 0) {
    return 0;
  }

  return score / totalWeight;
}

function rankProducts(
  products = [],
  query = "",
  configuration = {}
) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products
    .map((product, index) => ({
      product,
      index,
      score: scoreProduct(
        product,
        query,
        configuration
      )
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.index - b.index;
    })
    .map(item => item.product);
}

function resolveRelevantIds(testCase = {}) {
  if (
    Array.isArray(
      testCase.relevantIds
    )
  ) {
    return testCase.relevantIds.map(
      String
    );
  }

  if (
    Array.isArray(
      testCase.relevantProductIds
    )
  ) {
    return testCase.relevantProductIds.map(
      String
    );
  }

  if (
    Array.isArray(
      testCase.relevant
    )
  ) {
    return testCase.relevant.map(
      String
    );
  }

  return [];
}

function evaluateRanking(
  rankedProducts = [],
  relevantIds = [],
  k = 5
) {
  const safeRankedProducts =
    Array.isArray(rankedProducts)
      ? rankedProducts
      : [];

  const relevant =
    Array.isArray(relevantIds)
      ? relevantIds.map(String)
      : [];

  const safeK = Math.max(
    1,
    Math.floor(
      safeNumber(k, 5)
    )
  );

  const rankedIds =
    safeRankedProducts
      .slice(0, safeK)
      .map(product =>
        String(product.id)
      );

  const precision =
    precisionAtK(
      rankedIds,
      relevant,
      safeK
    );

  const recall =
    recallAtK(
      rankedIds,
      relevant,
      safeK
    );

  const f1 =
    f1AtK(
      rankedIds,
      relevant,
      safeK
    );

  const reciprocal = mrr([rankedIds], [relevant]);

  const ndcg =
    ndcgAtK(
      rankedIds,
      relevant,
      safeK
    );

  return {
    precisionAtK: safeNumber(
      precision
    ),
    recallAtK: safeNumber(
      recall
    ),
    f1AtK: safeNumber(
      f1
    ),
    mrr: safeNumber(
      reciprocal
    ),
    ndcgAtK: safeNumber(
      ndcg
    )
  };
}

function mean(values = []) {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + safeNumber(value),
      0
    ) / values.length
  );
}

function aggregate(results = []) {
  const metrics =
    Array.isArray(results)
      ? results
      : [];

  return {
    precisionAtK: mean(
      metrics.map(
        item =>
          item.precisionAtK
      )
    ),
    recallAtK: mean(
      metrics.map(
        item =>
          item.recallAtK
      )
    ),
    f1AtK: mean(
      metrics.map(
        item =>
          item.f1AtK
      )
    ),
    mrr: mean(
      metrics.map(
        item =>
          item.mrr
      )
    ),
    ndcgAtK: mean(
      metrics.map(
        item =>
          item.ndcgAtK
      )
    )
  };
}

function runConfiguration(
  products = [],
  evaluationCases = [],
  configuration = {},
  k = 5
) {
  const safeProducts =
    Array.isArray(products)
      ? products
      : [];

  const safeCases =
    Array.isArray(evaluationCases)
      ? evaluationCases
      : [];

  const results =
    safeCases.map(testCase => {
      const query = String(
        testCase?.query ?? ""
      );

      const ranked =
        rankProducts(
          safeProducts,
          query,
          configuration
        );

      const relevantIds =
        resolveRelevantIds(
          testCase
        );

      const metrics =
        evaluateRanking(
          ranked,
          relevantIds,
          k
        );

      return {
        query,
        metrics
      };
    });

  return {
    configuration,
    queries: results,
    aggregate: aggregate(
      results.map(
        item => item.metrics
      )
    )
  };
}

function runAblationStudy(
  products = [],
  evaluationCases = [],
  k = 5
) {
  const configurations = [
    {
      name: "lexical-only",
      lexical: true,
      semantic: false,
      attributes: false,
      budget: false
    },
    {
      name: "semantic-only",
      lexical: false,
      semantic: true,
      attributes: false,
      budget: false
    },
    {
      name: "lexical-attributes",
      lexical: true,
      semantic: false,
      attributes: true,
      budget: false
    },
    {
      name: "lexical-budget",
      lexical: true,
      semantic: false,
      attributes: false,
      budget: true
    },
    {
      name: "semantic-attributes",
      lexical: false,
      semantic: true,
      attributes: true,
      budget: false
    },
    {
      name: "full-hybrid",
      lexical: true,
      semantic: true,
      attributes: true,
      budget: true
    }
  ];

  return configurations.map(
    configuration =>
      runConfiguration(
        products,
        evaluationCases,
        configuration,
        k
      )
  );
}

function compareAblationResults(
  results = []
) {
  if (!Array.isArray(results)) {
    return [];
  }

  return [...results]
    .sort((a, b) => {
      const aScore =
        safeNumber(
          a?.aggregate?.ndcgAtK
        );

      const bScore =
        safeNumber(
          b?.aggregate?.ndcgAtK
        );

      return bScore - aScore;
    })
    .map((result, index) => ({
      rank: index + 1,
      configuration:
        result?.configuration?.name ??
        "unknown",
      precisionAtK:
        safeNumber(
          result?.aggregate?.precisionAtK
        ),
      recallAtK:
        safeNumber(
          result?.aggregate?.recallAtK
        ),
      f1AtK:
        safeNumber(
          result?.aggregate?.f1AtK
        ),
      mrr:
        safeNumber(
          result?.aggregate?.mrr
        ),
      ndcgAtK:
        safeNumber(
          result?.aggregate?.ndcgAtK
        )
    }));
}

export {
  lexicalScore,
  attributeScore,
  budgetScore,
  semanticScore,
  rankProducts,
  evaluateRanking,
  runConfiguration,
  runAblationStudy,
  compareAblationResults
};
