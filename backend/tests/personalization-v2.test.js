import assert from "assert";
import {
  normalizeProfile,
  calculatePersonalizationScore,
  personalizeResults,
  learnPreferenceFromProduct
} from "../services/personalizationV2.js";

const products = [
  {
    id: 1,
    name: "Black Formal Shirt",
    category: "shirt",
    color: "black",
    style: "formal",
    occasion: "office",
    material: "cotton",
    gender: "women",
    price: 1999
  },
  {
    id: 2,
    name: "Blue Casual Hoodie",
    category: "hoodie",
    color: "blue",
    style: "casual",
    occasion: "travel",
    material: "cotton",
    gender: "women",
    price: 2499
  }
];

const profile =
  normalizeProfile({
    preferredColors: ["black"],
    preferredStyles: ["formal"],
    preferredCategories: ["shirt"],
    preferredOccasions: ["office"],
    preferredMaterials: ["cotton"],
    preferredGenders: ["women"],
    budgetRange: [1500, 2500]
  });

const score =
  calculatePersonalizationScore(
    products[0],
    profile
  );

assert.ok(score > 0);

const ranked =
  personalizeResults(
    products,
    profile
  );

assert.strictEqual(
  ranked[0].id,
  1
);

const learned =
  learnPreferenceFromProduct(
    {},
    products[0]
  );

assert.ok(
  learned.preferredColors.includes(
    "black"
  )
);

assert.ok(
  learned.preferredStyles.includes(
    "formal"
  )
);

console.log(
  "Personalization V2 tests passed"
);
