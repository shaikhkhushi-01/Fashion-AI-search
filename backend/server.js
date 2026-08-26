/*
=========================================================
FASHION AI DISCOVERY
DAY 7 - ADVANCED SEARCH + HYBRID FILTERING
=========================================================
*/

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  runEvaluation,
  runEdgeCaseTests
} from "./evaluation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/*
=========================================================
PRODUCT DATA
=========================================================
*/

let products = [];

const productsPath = path.join(
  __dirname,
  "products.json"
);

try {
  const rawData = fs.readFileSync(
    productsPath,
    "utf-8"
  );

  const parsed = JSON.parse(rawData);

  if (Array.isArray(parsed)) {
    products = parsed;
  } else if (Array.isArray(parsed.products)) {
    products = parsed.products;
  } else {
    products = [];
  }

  console.log(
    `Loaded ${products.length} products`
  );

} catch (error) {

  console.error(
    "Unable to load products.json:",
    error
  );

  products = [];
}

/*
=========================================================
TEXT HELPERS
=========================================================
*/

function normalizeText(value) {

  return String(value || "")
    .toLowerCase()
    .trim();
}

function tokenize(value) {

  return normalizeText(value)
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function safeArray(value) {

  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return [value];
  }

  return [];
}

/*
=========================================================
SYNONYMS
=========================================================
*/

const synonyms = {

  tshirt: [
    "tshirt",
    "t-shirt",
    "tee"
  ],

  shirt: [
    "shirt",
    "shirts"
  ],

  trouser: [
    "trouser",
    "trousers",
    "pants"
  ],

  sneaker: [
    "sneaker",
    "sneakers",
    "shoe",
    "shoes"
  ],

  casual: [
    "casual",
    "everyday",
    "relaxed"
  ],

  formal: [
    "formal",
    "office",
    "professional"
  ],

  summer: [
    "summer",
    "warm",
    "hot"
  ],

  comfortable: [
    "comfortable",
    "comfort",
    "soft",
    "relaxed"
  ],

  cheap: [
    "cheap",
    "affordable",
    "budget",
    "low"
  ],

  premium: [
    "premium",
    "luxury",
    "expensive"
  ]
};

/*
=========================================================
QUERY EXPANSION
=========================================================
*/

function expandQuery(query) {

  const tokens = tokenize(query);

  const expanded = new Set(tokens);

  for (const token of tokens) {

    for (const values of Object.values(
      synonyms
    )) {

      if (values.includes(token)) {

        values.forEach(
          value =>
            expanded.add(
              normalizeText(value)
            )
        );
      }
    }
  }

  return [...expanded];
}

/*
=========================================================
PRODUCT TEXT
=========================================================
*/

function productText(product) {

  return [
    product.brand,
    product.name,
    product.category,
    product.gender,
    product.color,
    ...safeArray(product.material),
    ...safeArray(product.style),
    ...safeArray(product.occasion),
    ...safeArray(product.tags),
    product.description
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");
}

/*
=========================================================
RELEVANCE SCORING
=========================================================
*/

function calculateRelevance(
  product,
  query
) {

  const queryTokens =
    expandQuery(query);

  if (!queryTokens.length) {
    return 0;
  }

  const name =
    normalizeText(product.name);

  const brand =
    normalizeText(product.brand);

  const category =
    normalizeText(product.category);

  const color =
    normalizeText(product.color);

  const style =
    safeArray(product.style)
      .map(normalizeText);

  const occasion =
    safeArray(product.occasion)
      .map(normalizeText);

  const material =
    safeArray(product.material)
      .map(normalizeText);

  const tags =
    safeArray(product.tags)
      .map(normalizeText);

  const description =
    normalizeText(product.description);

  const fullText =
    productText(product);

  let score = 0;

  for (const token of queryTokens) {

    if (name.includes(token)) {
      score += 22;
    }

    if (brand.includes(token)) {
      score += 18;
    }

    if (category.includes(token)) {
      score += 18;
    }

    if (color.includes(token)) {
      score += 16;
    }

    if (style.some(
      item => item.includes(token)
    )) {
      score += 14;
    }

    if (occasion.some(
      item => item.includes(token)
    )) {
      score += 14;
    }

    if (material.some(
      item => item.includes(token)
    )) {
      score += 12;
    }

    if (tags.some(
      item => item.includes(token)
    )) {
      score += 10;
    }

    if (description.includes(token)) {
      score += 6;
    }

    if (fullText.includes(token)) {
      score += 2;
    }
  }

  /*
  Phrase-level bonus
  */

  const normalizedQuery =
    normalizeText(query);

  if (
    normalizedQuery &&
    name.includes(normalizedQuery)
  ) {
    score += 25;
  }

  /*
  Product-level quality bonus
  */

  if (
    normalizeText(
      product.availability
    ) === "in stock"
  ) {
    score += 4;
  }

  return Math.min(
    100,
    Math.round(score)
  );
}

/*
=========================================================
MATCH REASONS
=========================================================
*/

function getReasons(
  product,
  query
) {

  const reasons = [];

  const q =
    normalizeText(query);

  const name =
    normalizeText(product.name);

  const category =
    normalizeText(product.category);

  const color =
    normalizeText(product.color);

  const styles =
    safeArray(product.style)
      .map(normalizeText);

  const occasions =
    safeArray(product.occasion)
      .map(normalizeText);

  const materials =
    safeArray(product.material)
      .map(normalizeText);

  const tokens =
    expandQuery(q);

  if (
    name &&
    tokens.some(
      token => name.includes(token)
    )
  ) {
    reasons.push(
      "Product name matches your search intent."
    );
  }

  if (
    category &&
    tokens.some(
      token => category.includes(token)
    )
  ) {
    reasons.push(
      `Category matches: ${product.category}.`
    );
  }

  if (
    color &&
    tokens.some(
      token => color.includes(token)
    )
  ) {
    reasons.push(
      `Colour matches: ${product.color}.`
    );
  }

  if (
    styles.some(
      style =>
        tokens.some(
          token =>
            style.includes(token)
        )
    )
  ) {
    reasons.push(
      "Style matches your request."
    );
  }

  if (
    occasions.some(
      occasion =>
        tokens.some(
          token =>
            occasion.includes(token)
        )
    )
  ) {
    reasons.push(
      "Occasion matches your request."
    );
  }

  if (
    materials.some(
      material =>
        tokens.some(
          token =>
            material.includes(token)
        )
    )
  ) {
    reasons.push(
      "Material preference matches."
    );
  }

  if (!reasons.length) {

    reasons.push(
      "Strong overall semantic/textual match."
    );
  }

  return reasons.slice(0, 4);
}

/*
=========================================================
ADVANCED FILTERING
=========================================================
*/

function matchesFilter(
  product,
  filters
) {

  /*
  Category
  */

  if (
    filters.category &&
    normalizeText(
      product.category
    ) !== normalizeText(
      filters.category
    )
  ) {
    return false;
  }

  /*
  Gender
  */

  if (
    filters.gender &&
    normalizeText(
      product.gender
    ) !== normalizeText(
      filters.gender
    )
  ) {
    return false;
  }

  /*
  Colour
  */

  if (
    filters.color &&
    normalizeText(
      product.color
    ) !== normalizeText(
      filters.color
    )
  ) {
    return false;
  }

  /*
  Style
  */

  if (filters.style) {

    const productStyles =
      safeArray(product.style)
        .map(normalizeText);

    if (
      !productStyles.includes(
        normalizeText(filters.style)
      )
    ) {
      return false;
    }
  }

  /*
  Occasion
  */

  if (filters.occasion) {

    const productOccasions =
      safeArray(product.occasion)
        .map(normalizeText);

    if (
      !productOccasions.includes(
        normalizeText(filters.occasion)
      )
    ) {
      return false;
    }
  }

  /*
  Material
  */

  if (filters.material) {

    const productMaterials =
      safeArray(product.material)
        .map(normalizeText);

    if (
      !productMaterials.includes(
        normalizeText(filters.material)
      )
    ) {
      return false;
    }
  }

  /*
  Minimum price
  */

  if (
    filters.minPrice !== undefined &&
    filters.minPrice !== null &&
    filters.minPrice !== ""
  ) {

    const min =
      Number(filters.minPrice);

    if (
      Number.isFinite(min) &&
      Number(product.price) < min
    ) {
      return false;
    }
  }

  /*
  Maximum price
  */

  if (
    filters.maxPrice !== undefined &&
    filters.maxPrice !== null &&
    filters.maxPrice !== ""
  ) {

    const max =
      Number(filters.maxPrice);

    if (
      Number.isFinite(max) &&
      Number(product.price) > max
    ) {
      return false;
    }
  }

  return true;
}

/*
=========================================================
SORTING
=========================================================
*/

function sortResults(
  results,
  sort
) {

  const output =
    [...results];

  switch (normalizeText(sort)) {

    case "price-low":
    case "price-asc":

      output.sort(
        (a, b) =>
          Number(a.price || 0) -
          Number(b.price || 0)
      );

      break;

    case "price-high":
    case "price-desc":

      output.sort(
        (a, b) =>
          Number(b.price || 0) -
          Number(a.price || 0)
      );

      break;

    case "newest":

      output.sort(
        (a, b) =>
          Number(b.id || 0) -
          Number(a.id || 0)
      );

      break;

    case "relevance":
    default:

      output.sort(
        (a, b) =>
          Number(b.matchScore || 0) -
          Number(a.matchScore || 0)
      );

      break;
  }

  return output;
}

/*
=========================================================
SEARCH ENGINE
=========================================================
*/

function performSearch(
  query,
  filters = {},
  sort = "relevance"
) {

  let candidates =
    products.filter(
      product =>
        matchesFilter(
          product,
          filters
        )
    );

  const hasQuery =
    normalizeText(query).length > 0;

  if (hasQuery) {

    candidates =
      candidates.map(
        product => {

          const matchScore =
            calculateRelevance(
              product,
              query
            );

          return {
            ...product,
            matchScore,
            score: matchScore,
            reasons:
              getReasons(
                product,
                query
              )
          };
        }
      );

  } else {

    candidates =
      candidates.map(
        product => ({
          ...product,
          matchScore: 50,
          score: 50,
          reasons: [
            "Matches your selected filters."
          ]
        })
      );
  }

  /*
  Remove very weak results
  only when a query exists.
  */

  if (hasQuery) {

    const strong =
      candidates.filter(
        product =>
          product.matchScore >= 5
      );

    candidates =
      strong.length
        ? strong
        : candidates;
  }

  return sortResults(
    candidates,
    sort
  );
}

/*
=========================================================
HEALTH
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      status: "ok",
      service:
        "Fashion AI Discovery",
      version:
        "day-7-advanced-search",
      products:
        products.length,
      timestamp:
        new Date().toISOString()
    });
  }
);

/*
=========================================================
ALL PRODUCTS
=========================================================
*/

app.get(
  "/api/products",
  (req, res) => {

    res.json({
      products
    });
  }
);

/*
=========================================================
FILTER OPTIONS
=========================================================
*/

app.get(
  "/api/filters",
  (req, res) => {

    const uniqueValues =
      values =>
        [
          ...new Set(
            values
              .filter(Boolean)
              .map(String)
          )
        ].sort();

    const categories =
      uniqueValues(
        products.map(
          p => p.category
        )
      );

    const genders =
      uniqueValues(
        products.map(
          p => p.gender
        )
      );

    const colors =
      uniqueValues(
        products.map(
          p => p.color
        )
      );

    const styles =
      uniqueValues(
        products.flatMap(
          p => safeArray(p.style)
        )
      );

    const occasions =
      uniqueValues(
        products.flatMap(
          p => safeArray(p.occasion)
        )
      );

    const materials =
      uniqueValues(
        products.flatMap(
          p => safeArray(p.material)
        )
      );

    const prices =
      products
        .map(
          p => Number(p.price)
        )
        .filter(
          Number.isFinite
        );

    res.json({

      categories,

      genders,

      colors,

      styles,

      occasions,

      materials,

      priceRange: {
        min:
          prices.length
            ? Math.min(...prices)
            : 0,

        max:
          prices.length
            ? Math.max(...prices)
            : 0
      }
    });
  }
);

/*
=========================================================
ADVANCED SEARCH
=========================================================
*/

app.post(
  "/api/search",
  (req, res) => {

    try {

      const {
        query = "",
        category = "",
        gender = "",
        color = "",
        style = "",
        occasion = "",
        material = "",
        minPrice = "",
        maxPrice = "",
        sort = "relevance"
      } = req.body || {};

      const filters = {

        category,

        gender,

        color,

        style,

        occasion,

        material,

        minPrice,

        maxPrice
      };

      const results =
        performSearch(
          query,
          filters,
          sort
        );

      res.json({

        query,

        filters,

        sort,

        count:
          results.length,

        results
      });

    } catch (error) {

      console.error(
        "Search error:",
        error
      );

      res.status(500).json({

        error:
          "Search failed.",

        results: []
      });
    }
  }
);

/*
=========================================================
FILTER-ONLY SEARCH
=========================================================
*/

app.post(
  "/api/filter",
  (req, res) => {

    try {

      const filters =
        req.body || {};

      const results =
        performSearch(
          "",
          filters,
          filters.sort ||
            "relevance"
        );

      res.json({

        filters,

        count:
          results.length,

        results
      });

    } catch (error) {

      console.error(
        "Filter error:",
        error
      );

      res.status(500).json({

        error:
          "Filtering failed.",

        results: []
      });
    }
  }
);

/*
=========================================================
RECOMMENDATIONS
=========================================================
*/

app.post(
  "/api/recommendations",
  (req, res) => {

    try {

      const {
        query = "",
        preferences = {}
      } = req.body || {};

      const filters = {

        category:
          preferences.category ||
          "",

        gender:
          preferences.gender ||
          "",

        color:
          preferences.color ||
          "",

        style:
          preferences.style ||
          "",

        occasion:
          preferences.occasion ||
          "",

        material:
          preferences.material ||
          "",

        minPrice:
          preferences.minPrice ||
          "",

        maxPrice:
          preferences.maxPrice ||
          ""
      };

      const results =
        performSearch(
          query,
          filters,
          "relevance"
        );

      res.json({

        query,

        preferences,

        recommendations:
          results.slice(0, 12)
      });

    } catch (error) {

      console.error(
        "Recommendation error:",
        error
      );

      res.status(500).json({

        error:
          "Recommendation service failed.",

        recommendations: []
      });
    }
  }
);

/*
=========================================================
404 HANDLER
=========================================================
*/

app.use(
  (req, res) => {

    res.status(404).json({

      error:
        "Endpoint not found",

      path:
        req.originalUrl
    });
  }
);

/*
=========================================================
SERVER
=========================================================
*/

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Fashion AI Discovery Day 7 running on port ${PORT}`
    );

    console.log(
      `Products available: ${products.length}`
    );
  }
);
