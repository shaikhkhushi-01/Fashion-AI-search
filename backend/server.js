const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());

/* ================= PRODUCTS ================= */

const productsPath = path.join(
  __dirname,
  "..",
  "data",
  "products.json"
);

let products = [];

try {
  products = JSON.parse(
    fs.readFileSync(productsPath, "utf-8")
  );

  console.log(
    `Loaded ${products.length} products.`
  );

} catch (error) {

  console.error(
    "Could not load products.json:",
    error.message
  );

  products = [];
}


/* ================= HELPERS ================= */

function normalize(value) {

  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}


function normalizeArray(value) {

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => String(item))
    .filter(Boolean);

}


/* ================= PRODUCT TEXT ================= */

function productToText(product) {

  const occasion =
    normalizeArray(product.occasion);

  const style =
    normalizeArray(product.style);

  const tags =
    normalizeArray(product.tags);

  const material =
    normalizeArray(product.material);

  const sizes =
    normalizeArray(product.sizes);

  return [

    `Brand: ${product.brand || ""}`,

    `Product: ${product.name || ""}`,

    `Category: ${product.category || ""}`,

    `Gender: ${product.gender || ""}`,

    `Price: ${product.price || ""} ${
      product.currency || ""
    }`,

    `Color: ${product.color || ""}`,

    `Material: ${material.join(", ")}`,

    `Occasions: ${occasion.join(", ")}`,

    `Style: ${style.join(", ")}`,

    `Sizes: ${sizes.join(", ")}`,

    `Tags: ${tags.join(", ")}`,

    `Availability: ${
      product.availability || ""
    }`,

    `Description: ${
      product.description || ""
    }`

  ]
    .join(". ")
    .replace(/\s+/g, " ")
    .trim();

}


/* ================= TOKENIZER ================= */

function tokenize(text) {

  return normalize(text)
    .split(/\s+/)
    .filter(Boolean);

}


/* ================= PRODUCT SCORE ================= */

function scoreProduct(query, product) {

  const words =
    tokenize(query);

  const searchableText =
    normalize(
      productToText(product)
    );

  const name =
    normalize(product.name);

  const brand =
    normalize(product.brand);

  const category =
    normalize(product.category);

  const color =
    normalize(product.color);

  const material =
    normalizeArray(product.material);

  const style =
    normalizeArray(product.style);

  const occasion =
    normalizeArray(product.occasion);

  const tags =
    normalizeArray(product.tags);


  let score = 0;


  words.forEach(word => {

    /* General match */

    if (
      searchableText.includes(word)
    ) {

      score += 1;

    }


    /* Product name */

    if (
      name.includes(word)
    ) {

      score += 4;

    }


    /* Brand */

    if (
      brand.includes(word)
    ) {

      score += 3;

    }


    /* Category */

    if (
      category.includes(word)
    ) {

      score += 3;

    }


    /* Color */

    if (
      color.includes(word)
    ) {

      score += 3;

    }


    /* Material */

    if (
      material.some(item =>
        normalize(item).includes(word)
      )
    ) {

      score += 3;

    }


    /* Style */

    if (
      style.some(item =>
        normalize(item).includes(word)
      )
    ) {

      score += 2;

    }


    /* Occasion */

    if (
      occasion.some(item =>
        normalize(item).includes(word)
      )
    ) {

      score += 2;

    }


    /* Tags */

    if (
      tags.some(item =>
        normalize(item).includes(word)
      )
    ) {

      score += 2;

    }

  });


  return score;

}


/* ================= SEARCH ================= */

function searchProducts(
  query,
  productList
) {

  if (
    !query ||
    !Array.isArray(productList)
  ) {

    return [];

  }


  return productList

    .map(product => ({

      ...product,

      score:
        scoreProduct(
          query,
          product
        )

    }))

    .filter(
      product =>
        product.score > 0
    )

    .sort(
      (a, b) =>
        b.score - a.score
    );

}


/* ================= HEALTH CHECK ================= */

app.get(
  "/",
  (req, res) => {

    res.json({

      status: "online",

      service:
        "Global Fashion AI Backend",

      products:
        products.length,

      message:
        "ABAIRA Fashion Discovery API is running."

    });

  }
);


/* ================= PRODUCT API ================= */

app.get(
  "/api/products",
  (req, res) => {

    res.json({

      count:
        products.length,

      products

    });

  }
);


/* ================= SEARCH API ================= */

app.post(
  "/api/search",
  (req, res) => {

    try {

      const query =
        String(
          req.body?.query || ""
        ).trim();


      if (!query) {

        return res.status(400).json({

          error:
            "Search query is required."

        });

      }


      const results =
        searchProducts(
          query,
          products
        );


      res.json({

        query,

        count:
          results.length,

        results:
          results.slice(0, 20)

      });

    }

    catch (error) {

      console.error(
        "Search error:",
        error
      );

      res.status(500).json({

        error:
          "Search failed."

      });

    }

  }
);


/* ================= SERVER ================= */

app.listen(
  PORT,
  () => {

    console.log(
      `Fashion AI Backend running on port ${PORT}`
    );

  }
);
