import assert from "node:assert/strict";

import {
  filterCatalogue,
  sortCatalogue,
  paginate,
  buildDiscoveryResult,
  getFilterValues,
  buildSearchSuggestions
} from "../services/catalogDiscovery.js";

const products = [
  {
    id: 1,
    name: "Black Formal Shirt",
    brand: "Urban",
    category: "shirt",
    gender: "men",
    color: "black",
    style: "formal",
    occasion: "office",
    material: "cotton",
    price: 1800,
    rating: 4.5
  },
  {
    id: 2,
    name: "Blue Casual Shirt",
    brand: "Daily",
    category: "shirt",
    gender: "men",
    color: "blue",
    style: "casual",
    occasion: "college",
    material: "cotton",
    price: 1400,
    rating: 4.1
  },
  {
    id: 3,
    name: "Red Party Dress",
    brand: "Style",
    category: "dress",
    gender: "women",
    color: "red",
    style: "party",
    occasion: "party",
    material: "polyester",
    price: 3200,
    rating: 4.8
  },
  {
    id: 4,
    name: "Black Slim Jeans",
    brand: "Urban",
    category: "jeans",
    gender: "men",
    color: "black",
    style: "casual",
    occasion: "college",
    material: "denim",
    price: 2200,
    rating: 4.3
  }
];

const filtered = filterCatalogue(
  products,
  {
    category: "shirt",
    color: "black",
    maxPrice: 2500
  }
);

assert.equal(filtered.length, 1);
assert.equal(filtered[0].id, 1);

const searched = filterCatalogue(
  products,
  {
    query: "formal black shirt"
  }
);

assert.ok(
  searched.some(product => product.id === 1)
);

const priceSorted = sortCatalogue(
  products,
  "price-low"
);

assert.equal(priceSorted[0].id, 2);

const ratingSorted = sortCatalogue(
  products,
  "rating"
);

assert.equal(ratingSorted[0].id, 3);

const page = paginate(
  products,
  1,
  2
);

assert.equal(page.items.length, 2);
assert.equal(
  page.pagination.totalPages,
  2
);

const discovery = buildDiscoveryResult(
  products,
  {
    gender: "men",
    page: 1,
    pageSize: 2,
    sort: "price-low"
  }
);

assert.equal(
  discovery.items.length,
  2
);

assert.equal(
  discovery.pagination.total,
  3
);

const filters =
  getFilterValues(products);

assert.ok(
  filters.categories.includes("shirt")
);

assert.ok(
  filters.colors.includes("black")
);

const suggestions =
  buildSearchSuggestions(
    products,
    "blac"
  );

assert.ok(
  suggestions.includes("black")
);

console.log("Catalog discovery tests passed");
