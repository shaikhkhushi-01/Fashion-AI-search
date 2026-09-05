import { explainRecommendation } from "./explainability.js";

const STYLE_FIELDS = [
  "category",
  "gender",
  "color",
  "style",
  "occasion",
  "material",
  "fit",
  "pattern"
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function buildStylistQuery(profile) {
  const parts = [
    profile.occasion,
    profile.style,
    profile.gender,
    profile.color,
    profile.material,
    profile.fit,
    profile.category,
    profile.pattern,
    profile.comfort,
    profile.coverage
  ];

  return parts
    .filter(value => String(value ?? "").trim())
    .join(" ");
}

function fieldTokens(value) {
  return new Set(tokenize(value));
}

function profileMatchScore(product, profile) {
  let score = 0;
  let matched = 0;
  let requested = 0;

  for (const field of STYLE_FIELDS) {
    const requestedValue = normalize(profile[field]);

    if (!requestedValue) {
      continue;
    }

    requested += 1;

    const productTokens = fieldTokens(product[field]);
    const requestedTokens = fieldTokens(requestedValue);

    const overlap = [...requestedTokens].filter(token =>
      productTokens.has(token)
    );

    if (overlap.length > 0) {
      matched += 1;
      score += Math.min(1, overlap.length / requestedTokens.size);
    }
  }

  if (requested === 0) {
    return 0;
  }

  return score / requested;
}

function comfortScore(product, profile) {
  const comfort = normalize(profile.comfort);

  if (!comfort) {
    return 0;
  }

  const productText = [
    product.description,
    product.material,
    product.fit,
    product.style,
    product.tags
  ]
    .map(normalize)
    .join(" ");

  const comfortTokens = tokenize(comfort);

  if (comfortTokens.length === 0) {
    return 0;
  }

  const matches = comfortTokens.filter(token =>
    productText.includes(token)
  );

  return matches.length / comfortTokens.length;
}

function coverageScore(product, profile) {
  const coverage = normalize(profile.coverage);

  if (!coverage) {
    return 0;
  }

  const text = [
    product.description,
    product.style,
    product.fit,
    product.category,
    product.tags
  ]
    .map(normalize)
    .join(" ");

  const tokens = tokenize(coverage);

  if (tokens.length === 0) {
    return 0;
  }

  const matches = tokens.filter(token => text.includes(token));

  return matches.length / tokens.length;
}

function budgetScore(product, profile) {
  const budget = Number(profile.budget);
  const price = Number(product.price);

  if (!Number.isFinite(budget) || !Number.isFinite(price)) {
    return 0;
  }

  if (price <= budget) {
    return 1;
  }

  const excess = (price - budget) / Math.max(budget, 1);

  return Math.max(0, 1 - excess);
}

function stylistScore(product, profile) {
  const profileScore = profileMatchScore(product, profile);
  const comfort = comfortScore(product, profile);
  const coverage = coverageScore(product, profile);
  const budget = budgetScore(product, profile);

  return (
    profileScore * 0.55 +
    comfort * 0.15 +
    coverage * 0.10 +
    budget * 0.20
  );
}

function rankStylistRecommendations(products, profile, limit = 10) {
  const query = buildStylistQuery(profile);

  const ranked = products
    .map(product => ({
      product,
      score: stylistScore(product, profile)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map(item => {
    const explanation = explainRecommendation(
      query,
      item.product,
      item.score
    );

    return {
      ...item.product,
      stylistScore: Number(item.score.toFixed(6)),
      aiExplanation: explanation
    };
  });
}

function generateStylistResponse(products, profile, limit = 5) {
  const recommendations = rankStylistRecommendations(
    products,
    profile,
    limit
  );

  const query = buildStylistQuery(profile);

  return {
    query,
    profile: {
      occasion: profile.occasion ?? "",
      style: profile.style ?? "",
      gender: profile.gender ?? "",
      color: profile.color ?? "",
      material: profile.material ?? "",
      fit: profile.fit ?? "",
      category: profile.category ?? "",
      comfort: profile.comfort ?? "",
      coverage: profile.coverage ?? "",
      budget: profile.budget ?? ""
    },
    recommendations,
    count: recommendations.length
  };
}

export {
  normalize,
  tokenize,
  buildStylistQuery,
  profileMatchScore,
  comfortScore,
  coverageScore,
  budgetScore,
  stylistScore,
  rankStylistRecommendations,
  generateStylistResponse
};
