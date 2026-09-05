import assert from "node:assert/strict";
import {
  buildStylistQuery,
  profileMatchScore,
  stylistScore,
  rankStylistRecommendations,
  generateStylistResponse
} from "../services/aiStylist.js";

const products = [
  {
    id: 1,
    name: "Black Formal Shirt",
    category: "shirt",
    gender: "men",
    color: "black",
    style: "formal",
    occasion: "office",
    material: "cotton",
    fit: "regular",
    price: 1800,
    description: "Comfortable cotton formal shirt for office wear"
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
    fit: "regular",
    price: 1400,
    description: "Soft cotton casual shirt for everyday wear"
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
    fit: "slim",
    price: 3200,
    description: "Elegant party dress for evening occasions"
  }
];

const profile = {
  occasion: "office",
  style: "formal",
  gender: "men",
  color: "black",
  material: "cotton",
  fit: "regular",
  category: "shirt",
  comfort: "cotton comfortable",
  coverage: "",
  budget: 2500
};

const query = buildStylistQuery(profile);

assert.ok(query.includes("office"));
assert.ok(query.includes("formal"));
assert.ok(query.includes("black"));

const firstScore = profileMatchScore(products[0], profile);
const secondScore = profileMatchScore(products[1], profile);

assert.ok(firstScore > secondScore);

const productScore = stylistScore(products[0], profile);

assert.ok(Number.isFinite(productScore));
assert.ok(productScore >= 0);
assert.ok(productScore <= 1);

const ranked = rankStylistRecommendations(products, profile, 3);

assert.equal(ranked.length, 3);
assert.equal(ranked[0].id, 1);
assert.ok(ranked[0].stylistScore >= ranked[1].stylistScore);

const response = generateStylistResponse(products, profile, 2);

assert.equal(response.count, 2);
assert.equal(response.recommendations.length, 2);
assert.ok(response.recommendations[0].aiExplanation);
assert.ok(
  Array.isArray(response.recommendations[0].aiExplanation.reasons)
);

console.log("Stylist tests passed");
