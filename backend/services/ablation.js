import {
  precisionAtK,
  recallAtK,
  f1AtK,
  mrr,
  ndcgAtK
} from "./evaluation.js";

import {
  getSemanticScoreMap
} from "./semanticSearch.js";

import {
  hybridRetrieve
} from "./hybridRetrieval.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function textOf(product) {
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

function lexicalScore(product, query) {
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

function attributeScore(product, query) {
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

function budgetScore(product, query) {
  const match = normalize(query).match(
    /(?:under|below|less than|upto|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i
  );

  if (!match) {
    return 1;
  }

  const budget = Number(match[1]);
  const price = Number(product.price);

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(budget)
  ) {
    return 0;
  }

  if (price <= budget) {
    return 1;
  }

  const difference = price - budget;

  return Math.max(
    0,
    1 - difference / Math.max(budget, 1)
  );
}

function semanticScore(product) {
  const values = [
    product.semanticScore,
    product.semantic_similarity,
    product.similarity,
    product.embeddingScore,
    product.vectorScore
  ];

  for (const value of values) {
    const score = Number(value);

    if (Number.isFinite(score)) {
      return Math.max(
        0,
        Math.min(1, score)
      );
    }
  }

  return 0;
}

function scoreRerankedItem(
  item,
  configuration
) {
  const signals = item.signals || {};

  const weights = {
    semantic: 0.45,
    lexical: 0.20,
    attributes: 0.20,
    budget: 0.10,
    metadata: 0.05
  };

  let score = 0;
  let totalWeight = 0;

  if (configuration.semantic) {
    score +=
      Number(signals.semantic || 0) *
      weights.semantic;

    totalWeight += weights.semantic;
  }

  if (configuration.lexical) {
    score +=
      Number(signals.lexical || 0) *
      weights.lexical;

    totalWeight += weights.lexical;
  }

  if (configuration.attributes) {
    score +=
      Number(signals.attribute || 0) *
      weights.attributes;

    totalWeight += weights.attributes;
  }

  if (configuration.budget) {
    score +=
      Number(signals.budget || 0) *
      weights.budget;

    totalWeight += weights.budget;
  }

  if (configuration.metadata) {
    score +=
      Number(signals.metadata || 0) *
      weights.metadata;

    totalWeight += weights.metadata;
  }

  if (!totalWeight) {
    return 0;
  }

  return Number(
    (score / totalWeight).toFixed(6)
  );
}

function rankProducts(
  products,
  query,
  configuration
) {
  const retrieval = hybridRetrieve(
    products,
    query,
    {
      limit: products.length,
      candidateLimit: products.length,
      lexicalLimit: products.length,
      semanticLimit: products.length,
      rrfK: 60
    }
  );

  return retrieval.results
    .map((item, index) => ({
      product: item.product,
      score: scoreRerankedItem(
        item,
        configuration
      ),
      index
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.index - b.index;
    })
    .map(item => item.product);
}

function getRelevantIds(testCase) {
  const values =
    testCase.relevant ??
    testCase.relevantIds ??
    testCase.relevantProductIds ??
    [];

  return Array.isArray(values)
    ? values.map(String)
    : [];
}

function getRelevanceMap(testCase) {
  if (
    testCase.relevance &&
    typeof testCase.relevance === "object" &&
    !Array.isArray(testCase.relevance)
  ) {
    return Object.fromEntries(
      Object.entries(testCase.relevance).map(
        ([id, value]) => [
          String(id),
          Number(value) || 0
        ]
      )
    );
  }

  const relevantIds =
    getRelevantIds(testCase);

  return Object.fromEntries(
    relevantIds.map(id => [String(id), 1])
  );
}

function evaluateRanking(
  rankedProducts,
  testCase,
  k = 5
) {
  const rankedIds =
    rankedProducts
      .slice(0, k)
      .map(product => String(product.id));

  const relevant =
    getRelevantIds(testCase);

  const relevanceMap =
    getRelevanceMap(testCase);

  return {
    precisionAtK: precisionAtK(
      rankedIds,
      relevant,
      k
    ),
    recallAtK: recallAtK(
      rankedIds,
      relevant,
      k
    ),
    f1AtK: f1AtK(
      rankedIds,
      relevant,
      k
    ),
    mrr: mrr(
      [rankedIds],
      [relevant]
    ),
    ndcgAtK: ndcgAtK(
      rankedIds,
      relevanceMap,
      k
    )
  };
}

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

function aggregate(results) {
  return {
    precisionAtK: mean(
      results.map(
        item => item.precisionAtK
      )
    ),
    recallAtK: mean(
      results.map(
        item => item.recallAtK
      )
    ),
    f1AtK: mean(
      results.map(
        item => item.f1AtK
      )
    ),
    mrr: mean(
      results.map(
        item => item.mrr
      )
    ),
    ndcgAtK: mean(
      results.map(
        item => item.ndcgAtK
      )
    )
  };
}

function runConfiguration(
  products,
  evaluationCases,
  configuration,
  k = 5
) {
  const results =
    evaluationCases.map(testCase => {
      const ranked =
        rankProducts(
          products,
          testCase.query,
          configuration
        );

      return {
        query: testCase.query,
        metrics:
          evaluateRanking(
            ranked,
            testCase,
            k
          )
      };
    });

  return {
    configuration,
    methodology:
      "fixed-production-hybrid-candidate-pool-reranking",
    candidateGeneration: {
      method: "semantic-lexical-rrf",
      rrfK: 60
    },
    queries: results,
    aggregate:
      aggregate(
        results.map(
          item => item.metrics
        )
      )
  };
}

async function runAblationStudy(
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
      budget: false,
      metadata: false
    },
    {
      name: "semantic-only",
      lexical: false,
      semantic: true,
      attributes: false,
      budget: false,
      metadata: false
    },
    {
      name: "lexical-attributes",
      lexical: true,
      semantic: false,
      attributes: true,
      budget: false,
      metadata: false
    },
    {
      name: "lexical-budget",
      lexical: true,
      semantic: false,
      attributes: false,
      budget: true,
      metadata: false
    },
    {
      name: "semantic-attributes",
      lexical: false,
      semantic: true,
      attributes: true,
      budget: false,
      metadata: false
    },
    {
      name: "full-hybrid",
      lexical: true,
      semantic: true,
      attributes: true,
      budget: true,
      metadata: true
    }
  ];

  const semanticProductsByQuery =
    new Map();

  for (const testCase of evaluationCases) {
    const scoreMap =
      await getSemanticScoreMap(
        products,
        testCase.query
      );

    const enrichedProducts =
      products.map(product => ({
        ...product,
        semanticScore:
          Number(
            scoreMap.get(
              String(product.id)
            ) ?? 0
          )
      }));

    semanticProductsByQuery.set(
      testCase.query,
      enrichedProducts
    );
  }

  return configurations.map(
    configuration =>
      runConfiguration(
        semanticProductsByQuery.get(
          evaluationCases[0]?.query
        ) || products,
        evaluationCases,
        configuration,
        k
      )
  );
}

function compareAblationResults(
  results
) {
  const fullHybrid =
    results.find(
      result =>
        result.configuration.name ===
        "full-hybrid"
    );

  const baseline =
    fullHybrid?.aggregate ??
    {
      precisionAtK: 0,
      recallAtK: 0,
      f1AtK: 0,
      mrr: 0,
      ndcgAtK: 0
    };

  const ranked =
    [...results]
      .sort(
        (a, b) =>
          b.aggregate.ndcgAtK -
          a.aggregate.ndcgAtK
      );

  return ranked.map(
    (result, index) => ({
      rank: index + 1,
      configuration:
        result.configuration.name,
      precisionAtK:
        result.aggregate.precisionAtK,
      recallAtK:
        result.aggregate.recallAtK,
      f1AtK:
        result.aggregate.f1AtK,
      mrr:
        result.aggregate.mrr,
      ndcgAtK:
        result.aggregate.ndcgAtK,
      ndcgDeltaVsFullHybrid:
        result.aggregate.ndcgAtK -
        baseline.ndcgAtK,
      mrrDeltaVsFullHybrid:
        result.aggregate.mrr -
        baseline.mrr
    })
  );
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
