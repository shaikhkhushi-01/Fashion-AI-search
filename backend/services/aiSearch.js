import { hybridRetrieve } from "./hybridRetrieval.js";
import { getSemanticScoreMap } from "./semanticSearch.js";

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
    Array.isArray(product.tags) ? product.tags.join(" ") : product.tags
  ]
    .map(normalize)
    .join(" ");
}

function keywordScore(query, product) {
  const tokens = tokenize(query);
  if (!tokens.length) return 0;

  const text = textOf(product);
  let matched = 0;

  for (const token of tokens) {
    if (text.includes(token)) matched += 1;
  }

  return matched / tokens.length;
}

function attributeScore(query, product) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return 0;

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

  let matchedFields = 0;

  for (const field of fields) {
    const fieldTokens = tokenize(field);

    if (queryTokens.some(token => fieldTokens.includes(token))) {
      matchedFields += 1;
    }
  }

  return Math.min(matchedFields / 4, 1);
}

function budgetScore(query, product) {
  const match = normalize(query).match(
    /(?:under|below|less than|upto|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i
  );

  if (!match) return 1;

  const budget = Number(match[1]);
  const price = Number(product.price);

  if (!Number.isFinite(price) || !Number.isFinite(budget)) {
    return 0;
  }

  if (price <= budget) return 1;

  return Math.max(
    0,
    1 - (price - budget) / Math.max(budget, 1)
  );
}

function metadataScore(product) {
  const fields = [
    product.name,
    product.category,
    product.brand,
    product.description
  ];

  const available = fields.filter(
    value => String(value ?? "").trim().length > 0
  ).length;

  return available / fields.length;
}

function getSemanticScore(product, semanticScores) {
  const id = String(product.id);

  if (semanticScores && semanticScores.has(id)) {
    const score = Number(semanticScores.get(id));

    if (Number.isFinite(score)) {
      return Math.max(0, Math.min(1, score));
    }
  }

  const fallbackValues = [
    product.semanticScore,
    product.semantic_similarity,
    product.similarity,
    product.embeddingScore,
    product.vectorScore
  ];

  for (const value of fallbackValues) {
    const score = Number(value);

    if (Number.isFinite(score)) {
      return Math.max(0, Math.min(1, score));
    }
  }

  return 0;
}

function buildSemanticScores(products, query) {
  return getSemanticScoreMap(products, query);
}

function hybridScore(product, query, semanticScores) {
  const semantic = getSemanticScore(product, semanticScores);
  const lexical = keywordScore(query, product);
  const attributes = attributeScore(query, product);
  const budget = budgetScore(query, product);
  const metadata = metadataScore(product);

  return (
    semantic * 0.45 +
    lexical * 0.25 +
    attributes * 0.15 +
    budget * 0.10 +
    metadata * 0.05
  );
}

function searchProductsSync(products, query, options = {}) {
  const semanticScores = options.semanticScores ?? new Map();

  const scored = products
    .map((product, index) => {
      const semantic = getSemanticScore(product, semanticScores);
      const lexical = keywordScore(query, product);
      const attributes = attributeScore(query, product);
      const budget = budgetScore(query, product);
      const metadata = metadataScore(product);

      return {
        product,
        index,
        score: hybridScore(product, query, semanticScores),
        signals: {
          semantic,
          lexical,
          attributes,
          budget,
          metadata
        }
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    });

  const limit = Number(options.limit ?? scored.length);

  return {
    results: scored.slice(0, limit).map((item, index) => ({
      ...item.product,
      hybridScore: Number(item.score.toFixed(6)),
      semanticScore: Number(item.signals.semantic.toFixed(6)),
      hybridSignals: item.signals,
      rank: index + 1
    })),
    semanticScores
  };
}

async function searchProducts(products, query, options = {}) {
  const semanticScores = await buildSemanticScores(products, query);

  const result = searchProductsSync(products, query, {
    ...options,
    semanticScores
  });

  return result;
}

async function searchProductsWithHybrid(products, query, options = {}) {
  const semanticScores = await buildSemanticScores(products, query);

  const result = hybridRetrieve(products, query, {
    ...options,
    semanticScores,
    limit: options.limit ?? products.length
  });

  return {
    ...result,
    results: result.results.map((item, index) => ({
      ...item.product,
      hybridScore: Number(
        Number(item.score ?? item.fusionScore ?? 0).toFixed(6)
      ),
      semanticScore: Number(
        getSemanticScore(item.product, semanticScores).toFixed(6)
      ),
      hybridSignals: item.signals ?? {},
      hybridSources: item.sources ?? [],
      rank: index + 1
    }))
  };
}

export {
  keywordScore,
  attributeScore,
  budgetScore,
  metadataScore,
  getSemanticScore,
  hybridScore,
  searchProductsSync,
  searchProducts,
  searchProductsWithHybrid
};
