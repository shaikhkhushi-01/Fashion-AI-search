import assert from "node:assert/strict";

import {
  normalizeProfile,
  calculatePersonalizationScore,
  learnFromProduct,
  learnFromSearch,
  personalizeProducts,
  buildPersonalizedFeed
} from "../services/personalization.js";

const products = [
  {
    id: 1,
    name: "Black Formal Cotton Shirt",
    category: "shirt",
    gender: "men",
    color: "black",
    style: "formal",
    occasion: "office",
    material: "cotton",
    price: 1800,
    description: "Comfortable cotton formal shirt"
  },
  {
    id: 2,
    name: "Blue Casual Shirt",
    category: "shirt",
    gender: "men",
    color: "blue",
    style: "casual",
    occasion: "college",
    material: "cotton",
    price: 1400,
    description: "Casual cotton shirt"
  },
  {
    id: 3,
    name: "Red Party Dress",
    category: "dress",
    gender: "women",
    color: "red",
    style: "party",
    occasion: "party",
    material: "polyester",
    price: 3200,
    description: "Party dress"
  }
];

const profile = normalizeProfile({
  gender: "men",
  preferredColors: ["black"],
  preferredStyles: ["formal"],
  preferredCategories: ["shirt"],
  preferredOccasions: ["office"],
  preferredMaterials: ["cotton"],
  dislikedColors: ["red"],
  dislikedStyles: ["party"],
  budget: 2500,
  likedProductIds: [1],
  dislikedProductIds: [3]
});

const score1 = calculatePersonalizationScore(
  products[0],
  profile
);

const score3 = calculatePersonalizationScore(
  products[2],
  profile
);

assert.ok(score1.score > score3.score);
assert.ok(score1.reasons.length > 0);
assert.ok(score1.features);

const learnedProfile = learnFromProduct(
  profile,
  products[0],
  1
);

assert.ok(
  learnedProfile.preferenceWeights.color.black > 0
);

const searchedProfile = learnFromSearch(
  learnedProfile,
  "black formal shirt for office",
  products
);

assert.equal(
  searchedProfile.searchHistory.length,
  1
);

const ranked = personalizeProducts(
  products,
  profile,
  {
    limit: 3,
    queryScores: {
      1: 0.8,
      2: 0.6,
      3: 0.7
    }
  }
);

assert.equal(ranked.length, 3);
assert.equal(ranked[0].id, 1);
assert.ok(
  ranked[0].personalizedScore >=
  ranked[1].personalizedScore
);

const feed = buildPersonalizedFeed(
  products,
  profile,
  2
);

assert.equal(feed.length, 2);
assert.equal(feed[0].id, 1);

console.log("Personalization tests passed");
