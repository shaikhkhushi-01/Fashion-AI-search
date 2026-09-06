function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function arrayValues(value) {
  if (Array.isArray(value)) {
    return value.map(normalize).filter(Boolean);
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [normalize(value)].filter(Boolean);
}

function numberValues(value) {
  if (Array.isArray(value)) {
    return value
      .map(Number)
      .filter(Number.isFinite);
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? [number]
    : [];
}

function normalizeProfile(profile = {}) {
  return {
    preferredColors: arrayValues(
      profile.preferredColors
    ),
    preferredStyles: arrayValues(
      profile.preferredStyles
    ),
    preferredCategories: arrayValues(
      profile.preferredCategories
    ),
    preferredOccasions: arrayValues(
      profile.preferredOccasions
    ),
    preferredMaterials: arrayValues(
      profile.preferredMaterials
    ),
    preferredGenders: arrayValues(
      profile.preferredGenders
    ),
    dislikedColors: arrayValues(
      profile.dislikedColors
    ),
    dislikedStyles: arrayValues(
      profile.dislikedStyles
    ),
    budgetRange: numberValues(
      profile.budgetRange
    ),
    likedProducts: arrayValues(
      profile.likedProducts
    ),
    dislikedProducts: arrayValues(
      profile.dislikedProducts
    ),
    recentProducts: arrayValues(
      profile.recentProducts
    ),
    searchHistory: Array.isArray(
      profile.searchHistory
    )
      ? profile.searchHistory
          .map(normalize)
          .filter(Boolean)
      : []
  };
}

function overlapScore(preferences, value) {
  const values = arrayValues(value);

  if (!preferences.length || !values.length) {
    return 0;
  }

  const matches = values.filter(value =>
    preferences.includes(value)
  ).length;

  return Math.min(
    matches / preferences.length,
    1
  );
}

function preferenceFieldScore(
  preferences,
  value
) {
  if (!preferences.length) {
    return 0;
  }

  return overlapScore(
    preferences,
    value
  );
}

function dislikePenalty(
  preferences,
  value
) {
  if (!preferences.length) {
    return 0;
  }

  const values = arrayValues(value);

  return values.some(value =>
    preferences.includes(value)
  )
    ? 1
    : 0;
}

function budgetPreferenceScore(
  product,
  profile
) {
  const range =
    profile.budgetRange;

  if (range.length < 2) {
    return 0;
  }

  const price = Number(product?.price);

  if (!Number.isFinite(price)) {
    return 0;
  }

  const min = Math.min(
    range[0],
    range[1]
  );

  const max = Math.max(
    range[0],
    range[1]
  );

  if (price >= min && price <= max) {
    return 1;
  }

  if (price < min) {
    return Math.max(
      0,
      1 - (min - price) / Math.max(min, 1)
    );
  }

  return Math.max(
    0,
    1 - (price - max) / Math.max(max, 1)
  );
}

function interactionScore(
  product,
  profile
) {
  const id = normalize(product?.id);

  if (!id) {
    return 0;
  }

  if (
    profile.likedProducts.includes(id)
  ) {
    return 1;
  }

  if (
    profile.dislikedProducts.includes(id)
  ) {
    return -1;
  }

  if (
    profile.recentProducts.includes(id)
  ) {
    return 0.25;
  }

  return 0;
}

function searchHistoryScore(
  product,
  profile
) {
  if (!profile.searchHistory.length) {
    return 0;
  }

  const text = [
    product?.name,
    product?.category,
    product?.color,
    product?.style,
    product?.occasion,
    product?.material
  ]
    .map(normalize)
    .join(" ");

  const matches =
    profile.searchHistory.filter(
      query =>
        query &&
        text.includes(query)
    ).length;

  return Math.min(
    matches /
      profile.searchHistory.length,
    1
  );
}

function calculatePersonalizationScore(
  product,
  profileInput = {}
) {
  const profile =
    normalizeProfile(profileInput);

  const color =
    preferenceFieldScore(
      profile.preferredColors,
      product?.color
    );

  const style =
    preferenceFieldScore(
      profile.preferredStyles,
      product?.style
    );

  const category =
    preferenceFieldScore(
      profile.preferredCategories,
      product?.category
    );

  const occasion =
    preferenceFieldScore(
      profile.preferredOccasions,
      product?.occasion
    );

  const material =
    preferenceFieldScore(
      profile.preferredMaterials,
      product?.material
    );

  const gender =
    preferenceFieldScore(
      profile.preferredGenders,
      product?.gender
    );

  const budget =
    budgetPreferenceScore(
      product,
      profile
    );

  const interaction =
    interactionScore(
      product,
      profile
    );

  const history =
    searchHistoryScore(
      product,
      profile
    );

  const dislikedColor =
    dislikePenalty(
      profile.dislikedColors,
      product?.color
    );

  const dislikedStyle =
    dislikePenalty(
      profile.dislikedStyles,
      product?.style
    );

  const positive =
    color * 0.15 +
    style * 0.15 +
    category * 0.15 +
    occasion * 0.1 +
    material * 0.08 +
    gender * 0.05 +
    budget * 0.12 +
    Math.max(interaction, 0) * 0.1 +
    history * 0.1;

  const negative =
    dislikedColor * 0.12 +
    dislikedStyle * 0.08 +
    Math.abs(
      Math.min(interaction, 0)
    ) * 0.2;

  return Math.max(
    0,
    Math.min(
      1,
      positive - negative
    )
  );
}

function personalizeResults(
  products,
  profile,
  queryScores = new Map()
) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products
    .map((product, index) => {
      const personalization =
        calculatePersonalizationScore(
          product,
          profile
        );

      const queryScore =
        Number(
          queryScores.get(
            String(product.id)
          )
        ) || 0;

      const finalScore =
        queryScore * 0.65 +
        personalization * 0.35;

      return {
        ...product,
        personalizationScore:
          personalization,
        finalPersonalizedScore:
          finalScore,
        _index: index
      };
    })
    .sort((a, b) => {
      if (
        b.finalPersonalizedScore !==
        a.finalPersonalizedScore
      ) {
        return (
          b.finalPersonalizedScore -
          a.finalPersonalizedScore
        );
      }

      return a._index - b._index;
    })
    .map(product => {
      const result = {
        ...product
      };

      delete result._index;

      return result;
    });
}

function learnPreferenceFromProduct(
  profileInput,
  product,
  weight = 1
) {
  const profile =
    normalizeProfile(profileInput);

  const safeWeight =
    Math.max(
      0,
      Math.min(
        Number(weight) || 1,
        10
      )
    );

  const addWeighted =
    (collection, value) => {
      if (!value) {
        return;
      }

      const normalized =
        normalize(value);

      for (
        let index = 0;
        index < safeWeight;
        index += 1
      ) {
        collection.push(
          normalized
        );
      }
    };

  addWeighted(
    profile.preferredColors,
    product?.color
  );

  addWeighted(
    profile.preferredStyles,
    product?.style
  );

  addWeighted(
    profile.preferredCategories,
    product?.category
  );

  addWeighted(
    profile.preferredOccasions,
    product?.occasion
  );

  addWeighted(
    profile.preferredMaterials,
    product?.material
  );

  return normalizeProfile(profile);
}

function buildPersonalizedFeed(
  products,
  profile
) {
  return personalizeResults(
    products,
    profile
  );
}

export {
  normalizeProfile,
  overlapScore,
  preferenceFieldScore,
  dislikePenalty,
  budgetPreferenceScore,
  interactionScore,
  searchHistoryScore,
  calculatePersonalizationScore,
  personalizeResults,
  learnPreferenceFromProduct,
  buildPersonalizedFeed
};
