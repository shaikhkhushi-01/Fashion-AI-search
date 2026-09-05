function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function arrayValues(value) {
  if (Array.isArray(value)) {
    return value.map(normalize).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map(normalize)
      .filter(Boolean);
  }

  return [];
}

function numberArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(Number)
    .filter(Number.isFinite);
}

function normalizeProfile(profile = {}) {
  return {
    gender: normalize(profile.gender),
    preferredColors: arrayValues(profile.preferredColors),
    preferredStyles: arrayValues(profile.preferredStyles),
    preferredCategories: arrayValues(profile.preferredCategories),
    preferredOccasions: arrayValues(profile.preferredOccasions),
    preferredMaterials: arrayValues(profile.preferredMaterials),
    dislikedColors: arrayValues(profile.dislikedColors),
    dislikedStyles: arrayValues(profile.dislikedStyles),
    budget: Number.isFinite(Number(profile.budget))
      ? Number(profile.budget)
      : null,
    likedProductIds: numberArray(profile.likedProductIds),
    dislikedProductIds: numberArray(profile.dislikedProductIds),
    searchHistory: Array.isArray(profile.searchHistory)
      ? profile.searchHistory
          .map(item => ({
            query: String(item?.query ?? "").trim(),
            timestamp: item?.timestamp ?? null
          }))
          .filter(item => item.query)
          .slice(-20)
      : [],
    preferenceWeights:
      profile.preferenceWeights &&
      typeof profile.preferenceWeights === "object"
        ? profile.preferenceWeights
        : {}
  };
}

function valuesForProduct(product, field) {
  return arrayValues(product?.[field]);
}

function overlapScore(productValues, profileValues) {
  const productSet = new Set(productValues.map(normalize));
  const profileSet = new Set(profileValues.map(normalize));

  if (!productSet.size || !profileSet.size) {
    return 0;
  }

  let matches = 0;

  for (const value of productSet) {
    if (profileSet.has(value)) {
      matches += 1;
    }
  }

  return Math.min(1, matches / profileSet.size);
}

function fieldPreferenceScore(product, profile, field) {
  return overlapScore(
    valuesForProduct(product, field),
    profile[`preferred${field[0].toUpperCase()}${field.slice(1)}s`] || []
  );
}

function dislikedPreferenceScore(product, profile, field) {
  return overlapScore(
    valuesForProduct(product, field),
    profile[`disliked${field[0].toUpperCase()}${field.slice(1)}s`] || []
  );
}

function genderScore(product, profile) {
  if (!profile.gender) {
    return 0.5;
  }

  const gender = normalize(product.gender);

  if (!gender) {
    return 0.5;
  }

  if (gender === profile.gender || gender === "unisex") {
    return 1;
  }

  return 0;
}

function budgetScore(product, profile) {
  const budget = Number(profile.budget);
  const price = Number(product.price);

  if (!Number.isFinite(budget) || !Number.isFinite(price) || budget <= 0) {
    return 0.5;
  }

  if (price <= budget) {
    const ratio = price / budget;
    return Math.min(1, 0.8 + (1 - ratio) * 0.2);
  }

  const excess = (price - budget) / budget;

  return Math.max(0, 0.8 - excess);
}

function interactionScore(product, profile) {
  const id = Number(product.id);

  if (profile.dislikedProductIds.includes(id)) {
    return 0;
  }

  if (profile.likedProductIds.includes(id)) {
    return 1;
  }

  return 0.5;
}

function preferenceStrength(profile, field, value) {
  const weights = profile.preferenceWeights?.[field];

  if (!weights || typeof weights !== "object") {
    return 0;
  }

  return Number(weights[normalize(value)]) || 0;
}

function learnedPreferenceScore(product, profile) {
  const fields = [
    ["color", product.color],
    ["style", product.style],
    ["category", product.category],
    ["occasion", product.occasion],
    ["material", product.material]
  ];

  let total = 0;
  let count = 0;

  for (const [field, value] of fields) {
    const values = arrayValues(value);

    for (const item of values) {
      const strength = preferenceStrength(profile, field, item);

      if (strength > 0) {
        total += Math.min(1, strength);
        count += 1;
      }
    }
  }

  if (!count) {
    return 0;
  }

  return Math.min(1, total / count);
}

function calculatePersonalizationScore(product, rawProfile = {}) {
  const profile = normalizeProfile(rawProfile);

  const color = fieldPreferenceScore(product, profile, "color");
  const style = fieldPreferenceScore(product, profile, "style");
  const category = fieldPreferenceScore(product, profile, "category");
  const occasion = fieldPreferenceScore(product, profile, "occasion");
  const material = fieldPreferenceScore(product, profile, "material");

  const dislikedColor = dislikedPreferenceScore(product, profile, "color");
  const dislikedStyle = dislikedPreferenceScore(product, profile, "style");

  const gender = genderScore(product, profile);
  const budget = budgetScore(product, profile);
  const interaction = interactionScore(product, profile);
  const learned = learnedPreferenceScore(product, profile);

  const rawScore =
    color * 0.16 +
    style * 0.16 +
    category * 0.16 +
    occasion * 0.12 +
    material * 0.08 +
    gender * 0.08 +
    budget * 0.10 +
    interaction * 0.06 +
    learned * 0.08 -
    dislikedColor * 0.15 -
    dislikedStyle * 0.15;

  const score = Math.max(0, Math.min(1, rawScore));

  const reasons = [];

  if (color > 0) {
    reasons.push("Matches your preferred colour");
  }

  if (style > 0) {
    reasons.push("Matches your preferred style");
  }

  if (category > 0) {
    reasons.push("Matches categories you explore");
  }

  if (occasion > 0) {
    reasons.push("Fits your preferred occasions");
  }

  if (material > 0) {
    reasons.push("Matches your preferred material");
  }

  if (gender === 1) {
    reasons.push("Matches your profile");
  }

  if (budget >= 0.8) {
    reasons.push("Fits your usual budget");
  }

  if (interaction === 1) {
    reasons.push("Related to products you liked");
  }

  if (learned > 0) {
    reasons.push("Reflects your learned preferences");
  }

  if (dislikedColor > 0) {
    reasons.push("Reduced because of a disliked colour");
  }

  if (dislikedStyle > 0) {
    reasons.push("Reduced because of a disliked style");
  }

  return {
    score,
    reasons: reasons.slice(0, 6),
    features: {
      color,
      style,
      category,
      occasion,
      material,
      gender,
      budget,
      interaction,
      learned,
      dislikedColor,
      dislikedStyle
    }
  };
}

function extractProductPreferences(product) {
  return {
    category: arrayValues(product.category),
    color: arrayValues(product.color),
    style: arrayValues(product.style),
    occasion: arrayValues(product.occasion),
    material: arrayValues(product.material)
  };
}

function learnFromProduct(profile, product, strength = 1) {
  const normalized = normalizeProfile(profile);
  const attributes = extractProductPreferences(product);

  if (!normalized.preferenceWeights) {
    normalized.preferenceWeights = {};
  }

  for (const [field, values] of Object.entries(attributes)) {
    if (!normalized.preferenceWeights[field]) {
      normalized.preferenceWeights[field] = {};
    }

    for (const value of values) {
      const current =
        Number(normalized.preferenceWeights[field][value]) || 0;

      normalized.preferenceWeights[field][value] = Math.min(
        10,
        current + strength
      );
    }
  }

  return normalized;
}

function learnFromSearch(profile, query, products = []) {
  const normalized = normalizeProfile(profile);
  const cleanQuery = String(query ?? "").trim();

  if (!cleanQuery) {
    return normalized;
  }

  normalized.searchHistory.push({
    query: cleanQuery,
    timestamp: new Date().toISOString()
  });

  normalized.searchHistory =
    normalized.searchHistory.slice(-20);

  const queryTokens = new Set(
    normalize(cleanQuery)
      .split(/[^a-z0-9]+/)
      .filter(token => token.length > 2)
  );

  for (const product of products.slice(0, 5)) {
    const searchable = [
      product.name,
      product.category,
      product.color,
      product.style,
      product.occasion,
      product.material,
      product.description
    ]
      .map(normalize)
      .join(" ");

    const matched = [...queryTokens].filter(token =>
      searchable.includes(token)
    );

    if (matched.length > 0) {
      learnFromProduct(normalized, product, 0.5);
    }
  }

  return normalized;
}

function personalizeProducts(
  products = [],
  profile = {},
  options = {}
) {
  const limit = Math.max(
    1,
    Number(options.limit ?? 12)
  );

  const queryScores = options.queryScores || {};
  const queryWeight = Number.isFinite(Number(options.queryWeight))
    ? Number(options.queryWeight)
    : 0.55;

  const personalizationWeight = Number.isFinite(
    Number(options.personalizationWeight)
  )
    ? Number(options.personalizationWeight)
    : 0.45;

  const ranked = products
    .map(product => {
      const personalization =
        calculatePersonalizationScore(
          product,
          profile
        );

      const queryScore = Math.max(
        0,
        Math.min(
          1,
          Number(
            queryScores[product.id] ??
              product.semanticScore ??
              product.similarity ??
              product.relevanceScore ??
              0
          ) || 0
        )
      );

      const finalScore =
        queryScore * queryWeight +
        personalization.score * personalizationWeight;

      return {
        ...product,
        personalizationScore: Number(
          personalization.score.toFixed(6)
        ),
        personalizedScore: Number(
          finalScore.toFixed(6)
        ),
        personalizationReasons:
          personalization.reasons,
        personalizationFeatures:
          personalization.features
      };
    })
    .sort((a, b) => {
      if (b.personalizedScore !== a.personalizedScore) {
        return b.personalizedScore - a.personalizedScore;
      }

      return (
        Number(b.personalizationScore) -
        Number(a.personalizationScore)
      );
    });

  return ranked.slice(0, limit);
}

function buildPersonalizedFeed(
  products = [],
  profile = {},
  limit = 12
) {
  return personalizeProducts(
    products,
    profile,
    {
      limit,
      queryWeight: 0.35,
      personalizationWeight: 0.65
    }
  );
}

function profileFromStylist(stylist = {}) {
  const profile = {
    gender: stylist.gender ?? "",
    preferredColors: [],
    preferredStyles: [],
    preferredCategories: [],
    preferredOccasions: [],
    preferredMaterials: [],
    dislikedColors: [],
    dislikedStyles: [],
    budget: null,
    likedProductIds: [],
    dislikedProductIds: [],
    searchHistory: [],
    preferenceWeights: {}
  };

  if (stylist.color) {
    profile.preferredColors = arrayValues(stylist.color);
  }

  if (stylist.style) {
    profile.preferredStyles = arrayValues(stylist.style);
  }

  if (stylist.category) {
    profile.preferredCategories = arrayValues(stylist.category);
  }

  if (stylist.occasion) {
    profile.preferredOccasions = arrayValues(stylist.occasion);
  }

  if (stylist.material) {
    profile.preferredMaterials = arrayValues(stylist.material);
  }

  if (stylist.budget !== undefined) {
    const budget = Number(stylist.budget);

    if (Number.isFinite(budget)) {
      profile.budget = budget;
    }
  }

  return profile;
}

export {
  normalize,
  arrayValues,
  normalizeProfile,
  overlapScore,
  genderScore,
  budgetScore,
  interactionScore,
  learnedPreferenceScore,
  calculatePersonalizationScore,
  extractProductPreferences,
  learnFromProduct,
  learnFromSearch,
  personalizeProducts,
  buildPersonalizedFeed,
  profileFromStylist
};
