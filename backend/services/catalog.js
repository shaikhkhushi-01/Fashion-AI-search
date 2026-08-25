/*
=========================================================
FASHION AI DISCOVERY
DAY 1 - PRODUCT CATALOG SERVICE
=========================================================
*/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.resolve(
  __dirname,
  "../../data/products.json"
);

let productsCache = null;

/*
=========================================================
NORMALIZATION
=========================================================
*/

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value
      .map(normalizeText)
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(normalizeText)
      .filter(Boolean);
  }

  return [];
}

/*
=========================================================
PRODUCT VALIDATION
=========================================================
*/

function normalizeProduct(product, index) {
  return {
    id:
      product.id ??
      index + 1,

    brand:
      String(product.brand ?? "Unknown"),

    name:
      String(product.name ?? "Fashion Product"),

    category:
      String(product.category ?? "Fashion"),

    gender:
      String(product.gender ?? "Unisex"),

    color:
      String(product.color ?? ""),

    material:
      normalizeArray(product.material),

    style:
      normalizeArray(product.style),

    occasion:
      normalizeArray(product.occasion),

    sizes:
      normalizeArray(product.sizes),

    price:
      Number(product.price) || 0,

    currency:
      String(product.currency ?? "INR"),

    availability:
      String(
        product.availability ??
        "Unknown"
      ),

    tags:
      normalizeArray(product.tags),

    description:
      String(
        product.description ?? ""
      )
  };
}

/*
=========================================================
LOAD CATALOG
=========================================================
*/

export function loadCatalog({
  forceReload = false
} = {}) {

  if (
    productsCache &&
    !forceReload
  ) {
    return productsCache;
  }

  if (!fs.existsSync(DATA_PATH)) {

    throw new Error(
      `Product dataset not found at: ${DATA_PATH}`
    );
  }

  const raw =
    fs.readFileSync(
      DATA_PATH,
      "utf8"
    );

  const parsed =
    JSON.parse(raw);

  if (!Array.isArray(parsed)) {

    throw new Error(
      "products.json must contain an array."
    );
  }

  productsCache =
    parsed.map(
      normalizeProduct
    );

  return productsCache;
}

/*
=========================================================
CATALOG STATS
=========================================================
*/

export function getCatalogStats() {

  const products =
    loadCatalog();

  const categories =
    new Set(
      products.map(
        (product) =>
          product.category
      )
    );

  const brands =
    new Set(
      products.map(
        (product) =>
          product.brand
      )
    );

  const colors =
    new Set(
      products.map(
        (product) =>
          product.color
      )
    );

  const prices =
    products
      .map(
        (product) =>
          product.price
      )
      .filter(
        Number.isFinite
      );

  const averagePrice =
    prices.length
      ? prices.reduce(
          (sum, price) =>
            sum + price,
          0
        ) / prices.length
      : 0;

  return {
    totalProducts:
      products.length,

    uniqueBrands:
      brands.size,

    uniqueCategories:
      categories.size,

    uniqueColors:
      colors.size,

    minimumPrice:
      prices.length
        ? Math.min(...prices)
        : 0,

    maximumPrice:
      prices.length
        ? Math.max(...prices)
        : 0,

    averagePrice:
      Math.round(
        averagePrice
      )
  };
}

/*
=========================================================
FILTER CATALOG
=========================================================
*/

export function filterCatalog(filters = {}) {

  let products =
    loadCatalog();

  const {
    category,
    brand,
    color,
    gender,
    minPrice,
    maxPrice,
    availability
  } = filters;

  if (category) {

    const value =
      normalizeText(
        category
      );

    products =
      products.filter(
        (product) =>
          normalizeText(
            product.category
          ) === value
      );
  }

  if (brand) {

    const value =
      normalizeText(
        brand
      );

    products =
      products.filter(
        (product) =>
          normalizeText(
            product.brand
          ) === value
      );
  }

  if (color) {

    const value =
      normalizeText(
        color
      );

    products =
      products.filter(
        (product) =>
          normalizeText(
            product.color
          ) === value
      );
  }

  if (gender) {

    const value =
      normalizeText(
        gender
      );

    products =
      products.filter(
        (product) =>
          normalizeText(
            product.gender
          ) === value ||
          normalizeText(
            product.gender
          ) === "unisex"
      );
  }

  if (
    Number.isFinite(
      Number(minPrice)
    )
  ) {

    products =
      products.filter(
        (product) =>
          product.price >=
          Number(minPrice)
      );
  }

  if (
    Number.isFinite(
      Number(maxPrice)
    )
  ) {

    products =
      products.filter(
        (product) =>
          product.price <=
          Number(maxPrice)
      );
  }

  if (availability) {

    const value =
      normalizeText(
        availability
      );

    products =
      products.filter(
        (product) =>
          normalizeText(
            product.availability
          ) === value
      );
  }

  return products;
}

/*
=========================================================
PUBLIC API
=========================================================
*/

export function getProducts() {
  return loadCatalog();
}

export function reloadCatalog() {
  productsCache = null;
  return loadCatalog();
}
