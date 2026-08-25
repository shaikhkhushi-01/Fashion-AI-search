/*
=========================================================
FASHION AI DISCOVERY
AI SEARCH SERVICE
DAY 3 INTEGRATION
=========================================================
*/

"use strict";

import {
  rankProducts,
  extractBudget,
  RANKING_VERSION
} from "./ranking.js";

/*
=========================================================
TEXT NORMALIZATION
=========================================================
*/

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}

/*
=========================================================
SAFE ARRAY
=========================================================
*/

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
PRODUCT SEARCH TEXT
=========================================================
*/

function searchableText(product) {

  return [
    product.name,
    product.brand,
    product.category,
    product.gender,
    product.color,

    ...safeArray(
      product.material
    ),

    ...safeArray(
      product.style
    ),

    ...safeArray(
      product.occasion
    ),

    ...safeArray(
      product.tags
    ),

    product.description
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/*
=========================================================
BASIC CANDIDATE RETRIEVAL
=========================================================
*/

function retrieveCandidates(
  products,
  query
) {

  const normalizedQuery =
    normalize(query);

  if (!normalizedQuery) {
    return products;
  }

  const queryWords =
    normalizedQuery
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 1
      );

  const scored =
    products.map(
      (product, index) => {

        const text =
          searchableText(
            product
          );

        let matches = 0;

        for (
          const word
          of queryWords
        ) {

          if (
            text.includes(word)
          ) {
            matches++;
          }
        }

        return {
          product,
          matches,
          index
        };
      }
    );

  /*
    Keep all products with at least
    one lexical signal.

    If none match, return entire
    catalogue so ranking can still
    make a decision.
  */

  const candidates =
    scored
      .filter(
        (item) =>
          item.matches > 0
      )
      .sort(
        (a, b) =>
          b.matches -
          a.matches ||
          a.index -
            b.index
      )
      .map(
        (item) =>
          item.product
      );

  return candidates.length
    ? candidates
    : products;
}

/*
=========================================================
MAIN SEARCH
=========================================================
*/

function searchProducts(
  products,
  query,
  options = {}
) {

  if (
    !Array.isArray(products)
  ) {
    return {
      results: [],
      budget: null,
      rankingVersion:
        RANKING_VERSION
    };
  }

  const cleanQuery =
    normalize(query);

  if (!cleanQuery) {

    return {
      results:
        products.slice(
          0,
          options.limit || 20
        ),

      budget: null,

      rankingVersion:
        RANKING_VERSION
    };
  }

  const budget =
    extractBudget(
      cleanQuery
    );

  const candidates =
    retrieveCandidates(
      products,
      cleanQuery
    );

  const ranked =
    rankProducts(
      candidates,
      cleanQuery,
      {
        budget
      }
    );

  const limit =
    Number(
      options.limit || 20
    );

  return {
    results:
      ranked.slice(
        0,
        Math.max(
          1,
          Math.min(
            100,
            limit
          )
        )
      ),

    budget,

    totalCandidates:
      candidates.length,

    rankingVersion:
      RANKING_VERSION
  };
}

/*
=========================================================
EXPORT
=========================================================
*/

export {
  searchProducts,
  retrieveCandidates
};
