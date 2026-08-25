/*
=========================================================
FASHION AI DISCOVERY
DAY 4
PERSONALIZATION + AI STYLIST ENGINE
=========================================================
*/

"use strict";

/*
=========================================================
NORMALIZATION
=========================================================
*/

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function arrayValues(value) {
  if (Array.isArray(value)) {
    return value.map(normalize).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [normalize(value)];
  }

  return [];
}

/*
=========================================================
USER PROFILE NORMALIZATION
=========================================================
*/

function normalizeProfile(profile = {}) {
  return {
    gender: normalize(profile.gender),

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

    dislikedColors: arrayValues(
      profile.dislikedColors
    ),

    dislikedStyles: arrayValues(
      profile.dislikedStyles
    ),

    budget:
      Number.isFinite(
        Number(profile.budget)
      )
        ? Number(profile.budget)
        : null,

    likedProductIds: Array.isArray(
      profile.likedProductIds
    )
      ? profile.likedProductIds.map(Number)
      : [],

    dislikedProductIds: Array.isArray(
      profile.dislikedProductIds
    )
      ? profile.dislikedProductIds.map(Number)
      : []
  };
}

/*
=========================================================
OVERLAP
=========================================================
*/

function overlapScore(
  productValues,
  profileValues
) {
  if (
    !productValues.length ||
    !profileValues.length
  ) {
    return 0;
  }

  const matches =
    productValues.filter(
      (value) =>
        profileValues.includes(
          normalize(value)
        )
    );

  return matches.length;
}

/*
=========================================================
PERSONALIZATION SCORE
=========================================================
*/

function calculatePersonalizationScore(
  product,
  rawProfile = {}
) {
  const profile =
    normalizeProfile(rawProfile);

  let score = 0;

  const reasons = [];

  /*
  -------------------------------------------------------
  GENDER
  -------------------------------------------------------
  */

  if (
    profile.gender &&
    normalize(product.gender) !==
      profile.gender &&
    normalize(product.gender) !==
      "unisex"
  ) {
    score -= 15;
  }

  /*
  -------------------------------------------------------
  COLOR
  -------------------------------------------------------
  */

  const productColor =
    normalize(product.color);

  if (
    profile.preferredColors.includes(
      productColor
    )
  ) {
    score += 15;

    reasons.push(
      `Matches your preferred ${product.color} colour`
    );
  }

  if (
    profile.dislikedColors.includes(
      productColor
    )
  ) {
    score -= 25;

    reasons.push(
      `Avoids a colour you usually dislike`
    );
  }

  /*
  -------------------------------------------------------
  STYLE
  -------------------------------------------------------
  */

  const styles =
    arrayValues(product.style);

  const styleMatches =
    overlapScore(
      styles,
      profile.preferredStyles
    );

  if (styleMatches > 0) {
    score +=
      Math.min(
        20,
        styleMatches * 10
      );

    reasons.push(
      `Matches your preferred style`
    );
  }

  const dislikedStyleMatches =
    overlapScore(
      styles,
      profile.dislikedStyles
    );

  if (dislikedStyleMatches > 0) {
    score -=
      dislikedStyleMatches * 15;

    reasons.push(
      `Contains a style you marked as less preferred`
    );
  }

  /*
  -------------------------------------------------------
  CATEGORY
  -------------------------------------------------------
  */

  if (
    profile.preferredCategories.includes(
      normalize(product.category)
    )
  ) {
    score += 12;

    reasons.push(
      `Matches your preferred category`
    );
  }

  /*
  -------------------------------------------------------
  OCCASION
  -------------------------------------------------------
  */

  const occasions =
    arrayValues(product.occasion);

  const occasionMatches =
    overlapScore(
      occasions,
      profile.preferredOccasions
    );

  if (occasionMatches > 0) {
    score +=
      Math.min(
        15,
        occasionMatches * 7
      );

    reasons.push(
      `Suitable for your preferred occasion`
    );
  }

  /*
  -------------------------------------------------------
  MATERIAL
  -------------------------------------------------------
  */

  const materials =
    arrayValues(product.material);

  if (
    overlapScore(
      materials,
      profile.preferredMaterials
    ) > 0
  ) {
    score += 8;

    reasons.push(
      `Matches your preferred material`
    );
  }

  /*
  -------------------------------------------------------
  BUDGET
  -------------------------------------------------------
  */

  const price =
    Number(product.price);

  if (
    Number.isFinite(
      profile.budget
    ) &&
    Number.isFinite(price)
  ) {
    if (
      price <= profile.budget
    ) {
      score += 15;

      reasons.push(
        "Fits within your preferred budget"
      );
    } else {
      const difference =
        price -
        profile.budget;

      const percentage =
        difference /
        profile.budget;

      if (percentage <= 0.15) {
        score += 3;

        reasons.push(
          "Slightly above your preferred budget"
        );
      } else {
        score -= 12;
      }
    }
  }

  /*
  -------------------------------------------------------
  LIKED PRODUCTS
  -------------------------------------------------------
  */

  if (
    profile.likedProductIds.includes(
      Number(product.id)
    )
  ) {
    score += 25;

    reasons.push(
      "You previously liked this product"
    );
  }

  /*
  -------------------------------------------------------
  DISLIKED PRODUCTS
  -------------------------------------------------------
  */

  if (
    profile.dislikedProductIds.includes(
      Number(product.id)
    )
  ) {
    score -= 50;

    reasons.push(
      "You previously disliked this product"
    );
  }

  return {
    score,
    reasons
  };
}

/*
=========================================================
PERSONALIZED RANKING
=========================================================
*/

function personalizeProducts(
  products = [],
  profile = {},
  limit = 12
) {
  const safeProducts =
    Array.isArray(products)
      ? products
      : [];

  const ranked =
    safeProducts.map(
      (product) => {

        const result =
          calculatePersonalizationScore(
            product,
            profile
          );

        return {
          ...product,

          personalizationScore:
            Math.round(
              result.score
            ),

          personalizationReasons:
            result.reasons
        };
      }
    );

  ranked.sort(
    (a, b) =>
      b.personalizationScore -
      a.personalizationScore
  );

  return ranked
    .slice(
      0,
      Math.max(
        1,
        Number(limit) || 12
      )
    );
}

/*
=========================================================
AI STYLIST QUERY
=========================================================
*/

function buildStylistQuery(
  stylist = {}
) {
  const parts = [];

  const fields = [
    ["occasion", stylist.occasion],
    ["style", stylist.style],
    ["comfort", stylist.comfort],
    ["color", stylist.color],
    ["coverage", stylist.coverage],
    ["budget", stylist.budget],
    ["description", stylist.description]
  ];

  for (
    const [label, value]
    of fields
  ) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {
      parts.push(
        `${label}: ${String(value).trim()}`
      );
    }
  }

  return parts.join(", ");
}

/*
=========================================================
CREATE PROFILE FROM STYLIST
=========================================================
*/

function profileFromStylist(
  stylist = {}
) {
  const profile = {
    preferredColors: [],
    preferredStyles: [],
    preferredCategories: [],
    preferredOccasions: [],
    preferredMaterials: [],
    dislikedColors: [],
    dislikedStyles: [],
    budget: null,
    likedProductIds: [],
    dislikedProductIds: []
  };

  if (stylist.color) {
    profile.preferredColors =
      arrayValues(
        stylist.color
      );
  }

  if (stylist.style) {
    profile.preferredStyles =
      arrayValues(
        stylist.style
      );
  }

  if (stylist.occasion) {
    profile.preferredOccasions =
      arrayValues(
        stylist.occasion
      );
  }

  if (stylist.budget) {
    const budget =
      Number(stylist.budget);

    if (
      Number.isFinite(budget)
    ) {
      profile.budget =
        budget;
    }
  }

  return profile;
}

/*
=========================================================
EXPORTS
=========================================================
*/

export {
  normalizeProfile,
  calculatePersonalizationScore,
  personalizeProducts,
  buildStylistQuery,
  profileFromStylist
};
