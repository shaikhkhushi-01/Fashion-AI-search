/*
=========================================================
FASHION AI DISCOVERY
DAY 7 - ADVANCED SEARCH + FILTERS
=========================================================
*/

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "@huggingface/transformers";

/*
=========================================================
PATH
=========================================================
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
=========================================================
APP
=========================================================
*/

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

/*
=========================================================
PORT
=========================================================
*/

const PORT =
  process.env.PORT || 10000;

/*
=========================================================
PRODUCT DATA
=========================================================
*/

const productsPath =
  path.join(
    __dirname,
    "../data/products.json"
  );

let products = [];

try {
  const raw =
    fs.readFileSync(
      productsPath,
      "utf8"
    );

  products =
    JSON.parse(raw);

  console.log(
    `Loaded ${products.length} products.`
  );
} catch (error) {
  console.error(
    "Unable to load products.json:",
    error
  );

  process.exit(1);
}

/*
=========================================================
AI MODEL
=========================================================
*/

let embeddingModel = null;

const MODEL_NAME =
  "Xenova/all-MiniLM-L6-v2";

/*
=========================================================
AI MODEL LOADING
=========================================================
*/

async function loadEmbeddingModel() {
  try {
    console.log(
      "Preparing AI semantic search model..."
    );

    embeddingModel =
      await pipeline(
        "feature-extraction",
        MODEL_NAME
      );

    console.log(
      "AI embedding model loaded."
    );
  } catch (error) {
    console.error(
      "AI model loading failed:",
      error
    );

    embeddingModel = null;
  }
}

/*
=========================================================
TEXT NORMALIZATION
=========================================================
*/

function normalizeText(
  value
) {
  return String(
    value ?? ""
  )
    .toLowerCase()
    .trim();
}

/*
=========================================================
PRODUCT TEXT
=========================================================
*/

function productToText(
  product
) {
  return [
    product.brand,
    product.name,
    product.category,
    product.gender,
    product.color,
    ...(product.material || []),
    ...(product.style || []),
    ...(product.occasion || []),
    ...(product.tags || []),
    product.description,
  ]
    .filter(Boolean)
    .join(" ");
}

/*
=========================================================
EMBEDDINGS
=========================================================
*/

let productEmbeddings = [];

/*
=========================================================
COSINE SIMILARITY
=========================================================
*/

function cosineSimilarity(
  a,
  b
) {
  if (
    !a ||
    !b ||
    a.length !== b.length
  ) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    dot +=
      a[i] * b[i];

    normA +=
      a[i] * a[i];

    normB +=
      b[i] * b[i];
  }

  if (
    normA === 0 ||
    normB === 0
  ) {
    return 0;
  }

  return (
    dot /
    (
      Math.sqrt(normA) *
      Math.sqrt(normB)
    )
  );
}

/*
=========================================================
CREATE EMBEDDINGS
=========================================================
*/

async function createProductEmbeddings() {
  if (!embeddingModel) {
    return;
  }

  console.log(
    `Creating AI embeddings for ${products.length} products...`
  );

  productEmbeddings = [];

  for (
    const product of products
  ) {
    try {
      const output =
        await embeddingModel(
          productToText(product),
          {
            pooling: "mean",
            normalize: true,
          }
        );

      productEmbeddings.push(
        Array.from(
          output.data
        )
      );
    } catch (error) {
      console.error(
        `Embedding failed for product ${product.id}:`,
        error
      );

      productEmbeddings.push(
        []
      );
    }
  }

  console.log(
    "AI product index ready."
  );
}

/*
=========================================================
FILTER HELPERS
=========================================================
*/

function arrayIncludes(
  array,
  value
) {
  if (!Array.isArray(array)) {
    return false;
  }

  const target =
    normalizeText(value);

  return array.some(
    (item) =>
      normalizeText(item) ===
      target
  );
}

function matchesAny(
  array,
  selectedValues
) {
  if (
    !selectedValues ||
    selectedValues.length === 0
  ) {
    return true;
  }

  if (!Array.isArray(array)) {
    return false;
  }

  return selectedValues.some(
    (value) =>
      arrayIncludes(
        array,
        value
      )
  );
}

/*
=========================================================
ADVANCED FILTERING
=========================================================
*/

function applyFilters(
  productList,
  filters = {}
) {
  const {
    minPrice,
    maxPrice,
    category,
    categories,
    color,
    colors,
    style,
    styles,
    gender,
    genders,
    occasion,
    occasions,
    availability,
  } = filters;

  const selectedCategories =
    Array.isArray(categories)
      ? categories
      : category
        ? [category]
        : [];

  const selectedColors =
    Array.isArray(colors)
      ? colors
      : color
        ? [color]
        : [];

  const selectedStyles =
    Array.isArray(styles)
      ? styles
      : style
        ? [style]
        : [];

  const selectedGenders =
    Array.isArray(genders)
      ? genders
      : gender
        ? [gender]
        : [];

  const selectedOccasions =
    Array.isArray(occasions)
      ? occasions
      : occasion
        ? [occasion]
        : [];

  return productList.filter(
    (product) => {

      const price =
        Number(product.price);

      if (
        minPrice !== undefined &&
        minPrice !== null &&
        minPrice !== "" &&
        price <
          Number(minPrice)
      ) {
        return false;
      }

      if (
        maxPrice !== undefined &&
        maxPrice !== null &&
        maxPrice !== "" &&
        price >
          Number(maxPrice)
      ) {
        return false;
      }

      if (
        !matchesAny(
          [product.category],
          selectedCategories
        )
      ) {
        return false;
      }

      if (
        !matchesAny(
          [product.color],
          selectedColors
        )
      ) {
        return false;
      }

      if (
        !matchesAny(
          product.style,
          selectedStyles
        )
      ) {
        return false;
      }

      if (
        !matchesAny(
          [product.gender],
          selectedGenders
        )
      ) {
        return false;
      }

      if (
        !matchesAny(
          product.occasion,
          selectedOccasions
        )
      ) {
        return false;
      }

      if (
        availability &&
        normalizeText(
          product.availability
        ) !==
          normalizeText(
            availability
          )
      ) {
        return false;
      }

      return true;
    }
  );
}

/*
=========================================================
SEARCH SCORE
=========================================================
*/

function keywordScore(
  query,
  product
) {
  if (!query) {
    return 0;
  }

  const q =
    normalizeText(query);

  const text =
    normalizeText(
      productToText(product)
    );

  const words =
    q
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 2
      );

  if (!words.length) {
    return 0;
  }

  let matched = 0;

  for (
    const word of words
  ) {
    if (
      text.includes(word)
    ) {
      matched++;
    }
  }

  return (
    matched /
    words.length
  );
}

/*
=========================================================
REASONS
=========================================================
*/

function generateReasons(
  product,
  query,
  semanticScore,
  filterScore
) {
  const reasons = [];

  const q =
    normalizeText(query);

  const productText =
    normalizeText(
      productToText(product)
    );

  if (
    q &&
    productText.includes(q)
  ) {
    reasons.push(
      "Strong match with your search description."
    );
  }

  if (
    semanticScore >= 0.7
  ) {
    reasons.push(
      "High semantic similarity to your request."
    );
  }

  if (
    keywordScore(
      query,
      product
    ) >= 0.5
  ) {
    reasons.push(
      "Several requested fashion attributes match."
    );
  }

  if (
    filterScore > 0
  ) {
    reasons.push(
      "Matches your selected filters."
    );
  }

  if (
    !reasons.length
  ) {
    reasons.push(
      "Recommended based on overall fashion relevance."
    );
  }

  return reasons;
}

/*
=========================================================
FORMAT RESULT
=========================================================
*/

function formatResult(
  product,
  score = 0,
  query = "",
  filterScore = 0
) {
  const matchScore =
    Math.round(
      Math.max(
        0,
        Math.min(
          100,
          score * 100
        )
      )
    );

  return {
    ...product,

    matchScore,

    reasons:
      generateReasons(
        product,
        query,
        score,
        filterScore
      ),
  };
}

/*
=========================================================
SORT
=========================================================
*/

function sortProducts(
  results,
  sort = "relevance"
) {
  const sorted =
    [...results];

  switch (
    normalizeText(sort)
  ) {

    case "price-low":
    case "price_asc":
    case "low":
      sorted.sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price)
      );
      break;

    case "price-high":
    case "price_desc":
    case "high":
      sorted.sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price)
      );
      break;

    case "name":
      sorted.sort(
        (a, b) =>
          String(a.name)
            .localeCompare(
              String(b.name)
            )
      );
      break;

    default:
      sorted.sort(
        (a, b) =>
          Number(b.matchScore) -
          Number(a.matchScore)
      );
  }

  return sorted;
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
      status: "online",
      service:
        "Fashion AI Discovery",
      version: "7.0.0",

      ai: {
        enabled:
          Boolean(
            embeddingModel
          ),

        model:
          MODEL_NAME,

        type:
          "semantic-embedding-search",
      },

      products:
        products.length,

      indexedProducts:
        productEmbeddings.length,

      advancedSearch:
        true,

      filters: [
        "price",
        "category",
        "color",
        "style",
        "gender",
        "occasion",
        "availability",
        "sort",
      ],
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
      success: true,

      products,

      count:
        products.length,
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

    const unique =
      (values) =>
        [
          ...new Set(
            values
              .filter(Boolean)
              .map(
                (value) =>
                  String(value)
                    .trim()
              )
          ),
        ].sort();

    const categories =
      unique(
        products.map(
          (p) =>
            p.category
        )
      );

    const colors =
      unique(
        products.map(
          (p) =>
            p.color
        )
      );

    const genders =
      unique(
        products.map(
          (p) =>
            p.gender
        )
      );

    const styles =
      unique(
        products.flatMap(
          (p) =>
            Array.isArray(
              p.style
            )
              ? p.style
              : []
        )
      );

    const occasions =
      unique(
        products.flatMap(
          (p) =>
            Array.isArray(
              p.occasion
            )
              ? p.occasion
              : []
        )
      );

    const materials =
      unique(
        products.flatMap(
          (p) =>
            Array.isArray(
              p.material
            )
              ? p.material
              : []
        )
      );

    const prices =
      products.map(
        (p) =>
          Number(p.price)
      );

    res.json({
      success: true,

      filters: {
        categories,
        colors,
        genders,
        styles,
        occasions,
        materials,

        price: {
          min:
            Math.min(
              ...prices
            ),

          max:
            Math.max(
              ...prices
            ),
        },
      },
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
  async (
    req,
    res
  ) => {

    try {

      const {
        query = "",

        minPrice,
        maxPrice,

        category,
        categories,

        color,
        colors,

        style,
        styles,

        gender,
        genders,

        occasion,
        occasions,

        availability,

        sort = "relevance",

        limit = 20,
      } =
        req.body || {};

      const cleanQuery =
        String(
          query || ""
        ).trim();

      /*
      -----------------------------------------------
      FILTER PRODUCTS FIRST
      -----------------------------------------------
      */

      const filteredProducts =
        applyFilters(
          products,
          {
            minPrice,
            maxPrice,
            category,
            categories,
            color,
            colors,
            style,
            styles,
            gender,
            genders,
            occasion,
            occasions,
            availability,
          }
        );

      /*
      -----------------------------------------------
      AI SEARCH
      -----------------------------------------------
      */

      let scoredResults = [];

      let queryEmbedding = null;

      if (
        cleanQuery &&
        embeddingModel
      ) {

        const output =
          await embeddingModel(
            cleanQuery,
            {
              pooling: "mean",
              normalize: true,
            }
          );

        queryEmbedding =
          Array.from(
            output.data
          );
      }

      for (
        const product of filteredProducts
      ) {

        const originalIndex =
          products.findIndex(
            (item) =>
              item.id ===
              product.id
          );

        const semanticScore =
          queryEmbedding &&
          productEmbeddings[
            originalIndex
          ]?.length
            ? Math.max(
                0,
                cosineSimilarity(
                  queryEmbedding,
                  productEmbeddings[
                    originalIndex
                  ]
                )
              )
            : 0;

        const keywords =
          keywordScore(
            cleanQuery,
            product
          );

        /*
        AI ranking:
        70% semantic
        30% keyword
        */

        let score =
          cleanQuery
            ? (
                semanticScore *
                  0.7 +
                keywords *
                  0.3
              )
            : 0.5;

        /*
        Filter match bonus
        */

        let filterScore = 0;

        if (
          category ||
          categories?.length
        ) {
          filterScore += 0.05;
        }

        if (
          color ||
          colors?.length
        ) {
          filterScore += 0.05;
        }

        if (
          style ||
          styles?.length
        ) {
          filterScore += 0.05;
        }

        if (
          gender ||
          genders?.length
        ) {
          filterScore += 0.03;
        }

        if (
          occasion ||
          occasions?.length
        ) {
          filterScore += 0.05;
        }

        if (
          minPrice !== undefined ||
          maxPrice !== undefined
        ) {
          filterScore += 0.05;
        }

        score +=
          filterScore;

        score =
          Math.min(
            1,
            score
          );

        scoredResults.push(
          formatResult(
            product,
            score,
            cleanQuery,
            filterScore
          )
        );
      }

      /*
      -----------------------------------------------
      SORT
      -----------------------------------------------
      */

      scoredResults =
        sortProducts(
          scoredResults,
          sort
        );

      /*
      -----------------------------------------------
      LIMIT
      -----------------------------------------------
      */

      const safeLimit =
        Math.min(
          50,
          Math.max(
            1,
            Number(limit) || 20
          )
        );

      const finalResults =
        scoredResults.slice(
          0,
          safeLimit
        );

      /*
      -----------------------------------------------
      RESPONSE
      -----------------------------------------------
      */

      res.json({
        success: true,

        query:
          cleanQuery,

        filters: {
          minPrice:
            minPrice ?? null,

          maxPrice:
            maxPrice ?? null,

          categories:
            categories ||
            (category
              ? [category]
              : []),

          colors:
            colors ||
            (color
              ? [color]
              : []),

          styles:
            styles ||
            (style
              ? [style]
              : []),

          genders:
            genders ||
            (gender
              ? [gender]
              : []),

          occasions:
            occasions ||
            (occasion
              ? [occasion]
              : []),

          availability:
            availability ||
            null,
        },

        sort,

        total:
          finalResults.length,

        totalBeforeLimit:
          scoredResults.length,

        results:
          finalResults,
      });

    } catch (error) {

      console.error(
        "Advanced search error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Advanced AI search failed.",
      });
    }
  }
);

/*
=========================================================
AI STYLIST
=========================================================
*/

app.post(
  "/api/stylist",
  async (
    req,
    res
  ) => {

    try {

      const {
        occasion = "",
        style = "",
        comfort = "",
        color = "",
        coverage = "",
        description = "",
      } =
        req.body || {};

      const query =
        [
          occasion,
          style,
          comfort,
          color,
          coverage,
          description,
        ]
          .filter(Boolean)
          .join(" ");

      const searchResponse =
        await fetch(
          `http://localhost:${PORT}/api/search`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                query,

                occasion:
                  occasion || undefined,

                style:
                  style || undefined,

                color:
                  color || undefined,

                limit: 10,
              }),
          }
        );

      const data =
        await searchResponse.json();

      res.json({
        success: true,

        query,

        recommendations:
          data.results || [],
      });

    } catch (error) {

      console.error(
        "AI Stylist error:",
        error
      );

      res.status(500).json({
        success: false,

        error:
          "AI Stylist failed.",
      });
    }
  }
);

/*
=========================================================
START
=========================================================
*/

async function startServer() {

  console.log(
    "Starting Fashion AI Discovery..."
  );

  await loadEmbeddingModel();

  await createProductEmbeddings();

  app.listen(
    PORT,
    () => {

      console.log(
        `Fashion AI Discovery running on port ${PORT}`
      );

      console.log(
        `AI indexed products: ${productEmbeddings.length}`
      );
    }
  );
}

startServer();
