import { getSemanticScoreMap } from "./semanticSearch.js";

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(/\s+/)
    .filter(Boolean);
}

function valuesOf(value) {
  if (Array.isArray(value)) {
    return value.map(item => normalize(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(item => normalize(item))
      .filter(Boolean);
  }

  return [];
}

function productText(product) {
  return [
    product?.name,
    product?.brand,
    product?.category,
    product?.description,
    product?.color,
    product?.style,
    product?.occasion,
    product?.material,
    product?.gender,
    product?.fit,
    product?.pattern,
    product?.fabric,
    ...valuesOf(product?.tags)
  ]
    .map(normalize)
    .filter(Boolean)
    .join(" ");
}

function keywordScore(queryTokens, product) {
  if (!queryTokens.length) {
    return 0;
  }

  const textTokens = new Set(
    tokenize(productText(product))
  );

  let matches = 0;

  for (const token of queryTokens) {
    if (textTokens.has(token)) {
      matches += 1;
    }
  }

  return matches / queryTokens.length;
}

function attributeScore(queryTokens, product) {
  if (!queryTokens.length) {
    return 0;
  }

  const attributes = [
    product?.category,
    product?.color,
    product?.style,
    product?.occasion,
    product?.material,
    product?.gender,
    product?.fit,
    product?.pattern,
    product?.fabric,
    ...valuesOf(product?.tags)
  ];

  const attributeTokens = new Set(
    attributes
      .flatMap(value => tokenize(value))
      .filter(Boolean)
  );

  let matches = 0;

  for (const token of queryTokens) {
    if (attributeTokens.has(token)) {
      matches += 1;
    }
  }

  return matches / queryTokens.length;
}

function budgetScore(product, options = {}) {
  const budget = Number(options.budget);

  if (!Number.isFinite(budget) || budget <= 0) {
    return 1;
  }

  const price = Number(
    product?.price ??
    product?.discountedPrice ??
    product?.salePrice
  );

  if (!Number.isFinite(price) || price <= 0) {
    return 0;
  }

  if (price <= budget) {
    return 1;
  }

  const difference = price - budget;

  return Math.max(
    0,
    1 - difference / budget
  );
}

function metadataScore(product) {
  let score = 0;
  let total = 0;

  const fields = [
    product?.name,
    product?.brand,
    product?.category,
    product?.description,
    product?.color,
    product?.style,
    product?.occasion,
    product?.material,
    product?.gender,
    product?.fit,
    product?.pattern,
    product?.fabric
  ];

  for (const field of fields) {
    total += 1;

    if (
      field !== undefined &&
      field !== null &&
      String(field).trim()
    ) {
      score += 1;
    }
  }

  return total ? score / total : 0;
}

function getWeights(options = {}) {
  return {
    semantic: Number(options.semanticWeight ?? 0.45),
    keyword: Number(options.keywordWeight ?? 0.2),
    attribute: Number(options.attributeWeight ?? 0.2),
    budget: Number(options.budgetWeight ?? 0.1),
    metadata: Number(options.metadataWeight ?? 0.05)
  };
}

async function searchProducts(
  products,
  query,
  options = {}
) {
  if (
    !Array.isArray(products) ||
    !products.length
  ) {
    return [];
  }

  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  const limit = Math.max(
    1,
    Math.min(
      Number(options.limit) || 10,
      100
    )
  );

  const minScore = Number(
    options.minScore ?? 0
  );

  const queryTokens =
    tokenize(normalizedQuery);

  let semanticScores;

  try {
    semanticScores =
      await getSemanticScoreMap(
        products,
        normalizedQuery
      );
  } catch {
    semanticScores = new Map();
  }

  const weights =
    getWeights(options);

  const results = products
    .map(product => {
      const id = String(
        product?.id ?? ""
      );

      const semantic = Math.max(
        0,
        Math.min(
          1,
          Number(
            semanticScores.get(id) ?? 0
          )
        )
      );

      const keyword =
        keywordScore(
          queryTokens,
          product
        );

      const attribute =
        attributeScore(
          queryTokens,
          product
        );

      const budget =
        budgetScore(
          product,
          options
        );

      const metadata =
        metadataScore(product);

      const score =
        semantic * weights.semantic +
        keyword * weights.keyword +
        attribute * weights.attribute +
        budget * weights.budget +
        metadata * weights.metadata;

      return {
        ...product,
        score: Number(
          score.toFixed(6)
        ),
        semanticScore: Number(
          semantic.toFixed(6)
        ),
        keywordScore: Number(
          keyword.toFixed(6)
        ),
        attributeScore: Number(
          attribute.toFixed(6)
        ),
        budgetScore: Number(
          budget.toFixed(6)
        ),
        metadataScore: Number(
          metadata.toFixed(6)
        )
      };
    })
    .filter(
      product =>
        product.score >= minScore
    )
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(0, limit)
    .map(
      (product, index) => ({
        ...product,
        rank: index + 1
      })
    );

  return results;
}

export {
  searchProducts,
  keywordScore,
  attributeScore,
  budgetScore,
  metadataScore
};
