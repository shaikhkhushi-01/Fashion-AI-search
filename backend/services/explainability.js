function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function collectProductAttributes(product) {
  const fields = [
    "category",
    "gender",
    "color",
    "style",
    "occasion",
    "material",
    "fit",
    "pattern",
    "brand"
  ];

  const attributes = {};

  for (const field of fields) {
    if (product[field] !== undefined && product[field] !== null) {
      attributes[field] = String(product[field]);
    }
  }

  return attributes;
}

function attributeMatches(query, product) {
  const queryTokens = new Set(tokenize(query));
  const attributes = collectProductAttributes(product);
  const matches = [];

  for (const [field, value] of Object.entries(attributes)) {
    const tokens = tokenize(value);

    if (tokens.some(token => queryTokens.has(token))) {
      matches.push({
        feature: field,
        value,
        reason: `${value} matches your search`
      });
    }
  }

  return matches;
}

function budgetMatch(query, product) {
  const price = Number(product.price);

  if (!Number.isFinite(price)) {
    return null;
  }

  const numbers = normalize(query).match(/\d+(?:\.\d+)?/g);

  if (!numbers || numbers.length === 0) {
    return null;
  }

  const budget = Number(numbers[numbers.length - 1]);

  if (!Number.isFinite(budget)) {
    return null;
  }

  if (price <= budget) {
    return {
      feature: "budget",
      value: price,
      reason: `Within your budget of ${budget}`
    };
  }

  return {
    feature: "budget",
    value: price,
    reason: `Price is above the detected budget of ${budget}`
  };
}

function scoreExplanation(score) {
  const value = Number(score);

  if (!Number.isFinite(value)) {
    return "Recommendation based on available product signals";
  }

  if (value >= 0.8) {
    return "Strong match for your search";
  }

  if (value >= 0.6) {
    return "Good match for your search";
  }

  if (value >= 0.4) {
    return "Moderate match for your search";
  }

  return "Partial match for your search";
}

function explainRecommendation(query, product, score = null) {
  const matches = attributeMatches(query, product);
  const budget = budgetMatch(query, product);

  if (budget) {
    matches.push(budget);
  }

  const reasons = matches
    .filter(item => !item.reason.includes("above the detected budget"))
    .map(item => item.reason);

  if (reasons.length === 0) {
    reasons.push(scoreExplanation(score));
  }

  return {
    productId: product.id,
    score: Number.isFinite(Number(score)) ? Number(score) : null,
    summary: reasons.slice(0, 4).join(", "),
    reasons: reasons.slice(0, 4),
    matchedFeatures: matches.slice(0, 6)
  };
}

function explainRecommendations(query, products, scores = []) {
  return products.map((product, index) => {
    const score = scores[index] ?? product.score ?? product.relevanceScore ?? null;

    return explainRecommendation(query, product, score);
  });
}

export {
  normalize,
  tokenize,
  collectProductAttributes,
  attributeMatches,
  budgetMatch,
  explainRecommendation,
  explainRecommendations
};
