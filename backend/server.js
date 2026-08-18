const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(cors());
app.use(express.json({ limit: "5mb" }));


/* =====================================================
   PRODUCTS
===================================================== */

const productsPath = path.join(
  __dirname,
  "..",
  "data",
  "products.json"
);

let products = [];

try {
  products = JSON.parse(
    fs.readFileSync(productsPath, "utf8")
  );

  if (!Array.isArray(products)) {
    products = [];
  }

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


/* =====================================================
   NORMALIZATION HELPERS
===================================================== */

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
    .map(item => normalize(item))
    .filter(Boolean);

}


/* =====================================================
   PRODUCT → SEARCH TEXT
===================================================== */

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


/* =====================================================
   TOKENIZER
===================================================== */

function tokenize(text) {

  return normalize(text)
    .split(/\s+/)
    .filter(Boolean);

}


/* =====================================================
   QUERY UNDERSTANDING
===================================================== */

function understandQuery(query) {

  const text = normalize(query);

  const tokens = tokenize(text);

  const result = {

    query: text,

    tokens,

    category: [],

    colors: [],

    occasions: [],

    styles: [],

    materials: [],

    genders: [],

    priceMax: null,

    priceMin: null

  };


  /* ---------------- CATEGORY ---------------- */

  const categories = [

    "dress",
    "dresses",
    "shirt",
    "shirts",
    "tshirt",
    "t-shirt",
    "jeans",
    "trouser",
    "trousers",
    "pants",
    "skirt",
    "skirts",
    "jacket",
    "coat",
    "abaya",
    "burqa",
    "hijab",
    "saree",
    "sari",
    "kurta",
    "kurti",
    "top",
    "tops",
    "hoodie",
    "sweater",
    "blazer",
    "suit",
    "shorts",
    "clothing"
  ];

  result.category =
    categories.filter(item =>
      text.includes(item)
    );


  /* ---------------- COLORS ---------------- */

  const colors = [

    "black",
    "white",
    "red",
    "blue",
    "navy",
    "green",
    "olive",
    "pink",
    "purple",
    "yellow",
    "orange",
    "brown",
    "beige",
    "cream",
    "grey",
    "gray",
    "maroon",
    "gold",
    "silver"

  ];

  result.colors =
    colors.filter(color =>
      text.includes(color)
    );


  /* ---------------- OCCASIONS ---------------- */

  const occasions = [

    "wedding",
    "party",
    "casual",
    "formal",
    "office",
    "work",
    "evening",
    "summer",
    "winter",
    "travel",
    "beach",
    "festive",
    "festival",
    "daily",
    "everyday",
    "date",
    "college"

  ];

  result.occasions =
    occasions.filter(occasion =>
      text.includes(occasion)
    );


  /* ---------------- STYLE ---------------- */

  const styles = [

    "elegant",
    "minimal",
    "minimalist",
    "modern",
    "classic",
    "luxury",
    "modest",
    "oversized",
    "slim",
    "relaxed",
    "streetwear",
    "vintage",
    "traditional",
    "trendy",
    "simple",
    "comfortable"

  ];

  result.styles =
    styles.filter(style =>
      text.includes(style)
    );


  /* ---------------- MATERIAL ---------------- */

  const materials = [

    "cotton",
    "silk",
    "linen",
    "wool",
    "denim",
    "velvet",
    "chiffon",
    "polyester",
    "leather",
    "satin"

  ];

  result.materials =
    materials.filter(material =>
      text.includes(material)
    );


  /* ---------------- GENDER ---------------- */

  const genders = [

    "men",
    "man",
    "women",
    "woman",
    "women's",
    "men's",
    "unisex",
    "kids",
    "children"

  ];

  result.genders =
    genders.filter(gender =>
      text.includes(gender)
    );


  /* ---------------- PRICE ---------------- */

  const pricePatterns = [

    /under\s+(\d+)/i,
    /below\s+(\d+)/i,
    /less\s+than\s+(\d+)/i,
    /upto\s+(\d+)/i,
    /up\s+to\s+(\d+)/i,
    /within\s+(\d+)/i,
    /budget\s+(\d+)/i

  ];

  for (const pattern of pricePatterns) {

    const match =
      text.match(pattern);

    if (match) {

      result.priceMax =
        Number(match[1]);

      break;

    }

  }


  /* Example:
     "between 2000 and 5000"
  */

  const rangeMatch =
    text.match(
      /between\s+(\d+)\s+and\s+(\d+)/i
    );

  if (rangeMatch) {

    result.priceMin =
      Number(rangeMatch[1]);

    result.priceMax =
      Number(rangeMatch[2]);

  }


  return result;

}


/* =====================================================
   SCORE HELPERS
===================================================== */

function containsValue(
  productValue,
  requestedValues
) {

  if (
    !requestedValues.length
  ) {

    return false;

  }

  const productText =
    normalize(
      Array.isArray(productValue)
        ? productValue.join(" ")
        : productValue
    );

  return requestedValues.some(
    value =>
      productText.includes(
        normalize(value)
      )
  );

}


/* =====================================================
   PRODUCT SCORE
===================================================== */

function scoreProduct(
  query,
  product
) {

  const queryInfo =
    understandQuery(query);

  const words =
    queryInfo.tokens;

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

  const description =
    normalize(product.description);

  const material =
    normalizeArray(product.material);

  const style =
    normalizeArray(product.style);

  const occasion =
    normalizeArray(product.occasion);

  const tags =
    normalizeArray(product.tags);

  let score = 0;

  let matchedFields = [];


  /* =================================================
     GENERAL TOKEN MATCH
  ================================================= */

  words.forEach(word => {

    if (
      searchableText.includes(word)
    ) {

      score += 1;

    }


    if (
      name.includes(word)
    ) {

      score += 5;

      if (!matchedFields.includes("name")) {
        matchedFields.push("name");
      }

    }


    if (
      brand.includes(word)
    ) {

      score += 4;

      if (!matchedFields.includes("brand")) {
        matchedFields.push("brand");
      }

    }


    if (
      category.includes(word)
    ) {

      score += 4;

      if (!matchedFields.includes("category")) {
        matchedFields.push("category");
      }

    }


    if (
      color.includes(word)
    ) {

      score += 4;

      if (!matchedFields.includes("color")) {
        matchedFields.push("color");
      }

    }


    if (
      description.includes(word)
    ) {

      score += 1;

    }


    if (
      material.some(item =>
        item.includes(word)
      )
    ) {

      score += 3;

      if (!matchedFields.includes("material")) {
        matchedFields.push("material");
      }

    }


    if (
      style.some(item =>
        item.includes(word)
      )
    ) {

      score += 3;

      if (!matchedFields.includes("style")) {
        matchedFields.push("style");
      }

    }


    if (
      occasion.some(item =>
        item.includes(word)
      )
    ) {

      score += 3;

      if (!matchedFields.includes("occasion")) {
        matchedFields.push("occasion");
      }

    }


    if (
      tags.some(item =>
        item.includes(word)
      )
    ) {

      score += 2;

    }

  });


  /* =================================================
     STRUCTURED QUERY MATCHING
  ================================================= */


  /* CATEGORY */

  if (
    containsValue(
      product.category,
      queryInfo.category
    )
  ) {

    score += 8;

    matchedFields.push("requested-category");

  }


  /* COLOR */

  if (
    containsValue(
      product.color,
      queryInfo.colors
    )
  ) {

    score += 8;

    matchedFields.push("requested-color");

  }


  /* OCCASION */

  if (
    containsValue(
      product.occasion,
      queryInfo.occasions
    )
  ) {

    score += 7;

    matchedFields.push("requested-occasion");

  }


  /* STYLE */

  if (
    containsValue(
      product.style,
      queryInfo.styles
    )
  ) {

    score += 7;

    matchedFields.push("requested-style");

  }


  /* MATERIAL */

  if (
    containsValue(
      product.material,
      queryInfo.materials
    )
  ) {

    score += 6;

    matchedFields.push("requested-material");

  }


  /* GENDER */

  if (
    containsValue(
      product.gender,
      queryInfo.genders
    )
  ) {

    score += 5;

    matchedFields.push("requested-gender");

  }


  /* =================================================
     PRICE MATCH
  ================================================= */

  const productPrice =
    Number(product.price);


  if (
    queryInfo.priceMax !== null &&
    !Number.isNaN(productPrice)
  ) {

    if (
      productPrice <=
      queryInfo.priceMax
    ) {

      score += 8;

      matchedFields.push(
        "within-budget"
      );

    } else {

      score -= 5;

    }

  }


  if (
    queryInfo.priceMin !== null &&
    !Number.isNaN(productPrice)
  ) {

    if (
      productPrice >=
      queryInfo.priceMin
    ) {

      score += 5;

      matchedFields.push(
        "above-minimum-budget"
      );

    } else {

      score -= 3;

    }

  }


  return {

    score,

    matchedFields,

    queryInfo

  };

}


/* =====================================================
   SEARCH PRODUCTS
===================================================== */

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

    .map(product => {

      const scoring =
        scoreProduct(
          query,
          product
        );

      return {

        ...product,

        score:
          scoring.score,

        matchedFields:
          scoring.matchedFields

      };

    })

    .filter(
      product =>
        product.score > 0
    )

    .sort(
      (a, b) =>
        b.score - a.score
    );

}


/* =====================================================
   RECOMMENDATION EXPLANATION
===================================================== */

function createExplanation(
  product,
  queryInfo
) {

  const reasons = [];


  if (
    containsValue(
      product.category,
      queryInfo.category
    )
  ) {

    reasons.push(
      `matches the ${queryInfo.category[0]} category`
    );

  }


  if (
    containsValue(
      product.color,
      queryInfo.colors
    )
  ) {

    reasons.push(
      `matches your ${queryInfo.colors[0]} colour preference`
    );

  }


  if (
    containsValue(
      product.occasion,
      queryInfo.occasions
    )
  ) {

    reasons.push(
      `fits a ${queryInfo.occasions[0]} occasion`
    );

  }


  if (
    containsValue(
      product.style,
      queryInfo.styles
    )
  ) {

    reasons.push(
      `matches your ${queryInfo.styles[0]} style`
    );

  }


  if (
    containsValue(
      product.material,
      queryInfo.materials
    )
  ) {

    reasons.push(
      `uses ${queryInfo.materials[0]} material`
    );

  }


  const price =
    Number(product.price);


  if (
    queryInfo.priceMax !== null &&
    !Number.isNaN(price) &&
    price <= queryInfo.priceMax
  ) {

    reasons.push(
      `falls within your budget`
    );

  }


  if (!reasons.length) {

    return "This product was ranked highly because its details are relevant to your search.";

  }


  if (reasons.length === 1) {

    return `Recommended because it ${reasons[0]}.`;

  }


  return `Recommended because it ${reasons
    .slice(0, -1)
    .join(", ")} and ${reasons[reasons.length - 1]}.`;

}


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get(
  "/",
  (req, res) => {

    res.json({

      status: "online",

      service:
        "Global Fashion AI Search",

      products:
        products.length,

      endpoints: [

        "GET /",

        "GET /api/products",

        "POST /api/search",

        "POST /api/stylist"

      ],

      message:
        "Fashion AI Discovery API is running."

    });

  }
);


/* =====================================================
   PRODUCTS API
===================================================== */

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


/* =====================================================
   SEARCH API
===================================================== */

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


      const queryInfo =
        understandQuery(query);


      const results =
        searchProducts(
          query,
          products
        );


      const finalResults =
        results
          .slice(0, 20)
          .map(product => ({

            ...product,

            explanation:
              createExplanation(
                product,
                queryInfo
              )

          }));


      res.json({

        success: true,

        query,

        understoodQuery:
          queryInfo,

        count:
          finalResults.length,

        results:
          finalResults

      });

    }

    catch (error) {

      console.error(
        "Search error:",
        error
      );

      res.status(500).json({

        success: false,

        error:
          "Search failed."

      });

    }

  }
);


/* =====================================================
   AI STYLIST API
===================================================== */

/* ================= AI STYLIST ================= */

function calculateStylistScore(product, preferences) {

  let score = 0;

  const occasion = normalize(preferences.occasion);
  const style = normalize(preferences.style);
  const comfort = normalize(preferences.comfort);
  const color = normalize(preferences.color);
  const coverage = normalize(preferences.coverage);
  const description = normalize(preferences.description);

  const productOccasions =
    normalizeArray(product.occasion)
      .map(normalize);

  const productStyles =
    normalizeArray(product.style)
      .map(normalize);

  const productTags =
    normalizeArray(product.tags)
      .map(normalize);

  const productMaterial =
    normalizeArray(product.material)
      .map(normalize);

  const productColor =
    normalize(product.color);

  const productDescription =
    normalize(product.description);

  /* ---------- OCCASION ---------- */

  if (occasion) {

    if (
      productOccasions.some(item =>
        item.includes(occasion) ||
        occasion.includes(item)
      )
    ) {
      score += 25;
    }

    if (
      productTags.some(item =>
        item.includes(occasion)
      )
    ) {
      score += 10;
    }
  }


  /* ---------- STYLE ---------- */

  if (style) {

    if (
      productStyles.some(item =>
        item.includes(style) ||
        style.includes(item)
      )
    ) {
      score += 25;
    }

    if (
      productTags.some(item =>
        item.includes(style)
      )
    ) {
      score += 10;
    }
  }


  /* ---------- COLOR ---------- */

  if (color) {

    if (
      productColor.includes(color) ||
      color.includes(productColor)
    ) {
      score += 20;
    }
  }


  /* ---------- COMFORT ---------- */

  if (comfort) {

    const comfortText = [
      productDescription,
      ...productStyles,
      ...productTags,
      ...productMaterial
    ].join(" ");

    if (
      comfortText.includes(comfort)
    ) {
      score += 15;
    }

    if (
      comfort === "comfortable" &&
      (
        comfortText.includes("soft") ||
        comfortText.includes("relaxed") ||
        comfortText.includes("lightweight") ||
        comfortText.includes("breathable")
      )
    ) {
      score += 15;
    }
  }


  /* ---------- COVERAGE ---------- */

  if (coverage) {

    const coverageText = [
      productDescription,
      ...productTags
    ].join(" ");

    if (
      coverageText.includes(coverage)
    ) {
      score += 15;
    }
  }


  /* ---------- DESCRIPTION ---------- */

  if (description) {

    const descriptionScore =
      scoreProduct(
        description,
        product
      );

    score += Math.min(
      descriptionScore * 2,
      20
    );
  }


  return Math.min(
    score,
    100
  );
}


/* ================= STYLIST SEARCH ================= */

function stylistSearch(
  preferences,
  productList
) {

  if (
    !Array.isArray(productList)
  ) {
    return [];
  }


  return productList

    .map(product => {

      const matchScore =
        calculateStylistScore(
          product,
          preferences
        );


      return {
        ...product,

        matchScore,

        stylistScore:
          matchScore
      };

    })

    .filter(
      product =>
        product.matchScore > 0
    )

    .sort(
      (a, b) =>
        b.matchScore -
        a.matchScore
    );
}


/* ================= STYLIST API ================= */

app.post(
  "/api/stylist",
  (req, res) => {

    try {

      const preferences = {

        occasion:
          String(
            req.body?.occasion || ""
          ).trim(),

        style:
          String(
            req.body?.style || ""
          ).trim(),

        comfort:
          String(
            req.body?.comfort || ""
          ).trim(),

        color:
          String(
            req.body?.color || ""
          ).trim(),

        coverage:
          String(
            req.body?.coverage || ""
          ).trim(),

        description:
          String(
            req.body?.description || ""
          ).trim()

      };


      const hasPreferences =
        Object.values(
          preferences
        ).some(Boolean);


      if (!hasPreferences) {

        return res.status(400).json({

          error:
            "At least one styling preference is required."

        });

      }


      const results =
        stylistSearch(
          preferences,
          products
        );


      res.json({

        success: true,

        preferences,

        count:
          results.length,

        recommendations:
          results.slice(0, 10)

      });

    }

    catch (error) {

      console.error(
        "Stylist error:",
        error
      );

      res.status(500).json({

        error:
          "AI Stylist failed."

      });

    }

  }
);

/* =====================================================
   404
===================================================== */

app.use(
  (req, res) => {

    res.status(404).json({

      error:
        "Endpoint not found."

    });

  }
);


/* =====================================================
   SERVER
===================================================== */

app.listen(
  PORT,
  () => {

    console.log(
      `Fashion AI Backend running on port ${PORT}`
    );

  }
);
