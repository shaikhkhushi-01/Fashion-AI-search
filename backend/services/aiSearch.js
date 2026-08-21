const {
  pipeline,
  env
} = require("@xenova/transformers");

env.allowLocalModels = false;
env.allowRemoteModels = true;

let extractor = null;
let modelLoadingPromise = null;


/* =========================================================
   MODEL
========================================================= */

const MODEL_NAME =
  "Xenova/all-MiniLM-L6-v2";


async function getExtractor() {

  if (extractor) {
    return extractor;
  }

  if (!modelLoadingPromise) {

    console.log(
      "Loading AI embedding model..."
    );

    modelLoadingPromise =
      pipeline(
        "feature-extraction",
        MODEL_NAME
      );

  }

  extractor =
    await modelLoadingPromise;

  console.log(
    "AI embedding model loaded."
  );

  return extractor;
}


/* =========================================================
   NORMALIZATION
========================================================= */

function normalize(value) {

  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s₹-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}


/* =========================================================
   TOKENIZATION
========================================================= */

function tokenize(text) {

  return normalize(text)
    .split(/\s+/)
    .filter(Boolean);

}


/* =========================================================
   ARRAY NORMALIZATION
========================================================= */

function arrayText(value) {

  if (!Array.isArray(value)) {
    return normalize(value);
  }

  return value
    .map(item => normalize(item))
    .join(" ");

}


/* =========================================================
   PRODUCT TEXT
========================================================= */

function productToSearchText(product) {

  return [

    product.brand,

    product.name,

    product.category,

    product.gender,

    product.color,

    arrayText(product.material),

    arrayText(product.style),

    arrayText(product.occasion),

    arrayText(product.tags),

    arrayText(product.sizes),

    product.description,

    product.availability

  ]
    .filter(Boolean)
    .join(". ");

}


/* =========================================================
   EMBEDDING
========================================================= */

async function createEmbedding(text) {

  const model =
    await getExtractor();

  const output =
    await model(
      text,
      {
        pooling: "mean",
        normalize: true
      }
    );

  return Array.from(
    output.data
  );

}


/* =========================================================
   COSINE SIMILARITY
========================================================= */

function cosineSimilarity(a, b) {

  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
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

    dot += a[i] * b[i];

    normA += a[i] * a[i];

    normB += b[i] * b[i];

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


/* =========================================================
   FASHION INTENT
========================================================= */

function understandFashionQuery(query) {

  const text =
    normalize(query);

  const tokens =
    tokenize(text);


  const intent = {

    query,

    normalizedQuery: text,

    tokens,

    category: [],

    colors: [],

    materials: [],

    styles: [],

    occasions: [],

    genders: [],

    priceMin: null,

    priceMax: null

  };


  /* CATEGORY */

  const categoryMap = {

    dress: "Dresses",
    dresses: "Dresses",

    shirt: "Shirts",
    shirts: "Shirts",

    tshirt: "T-Shirts",
    "t-shirt": "T-Shirts",

    jeans: "Jeans",

    trouser: "Trousers",
    trousers: "Trousers",

    pants: "Pants",

    skirt: "Skirts",
    skirts: "Skirts",

    jacket: "Jackets",

    coat: "Coats",

    blazer: "Blazers",

    hoodie: "Hoodies",

    sweater: "Sweaters",

    kurta: "Kurtas",
    kurti: "Kurtis",

    saree: "Sarees",
    sari: "Sarees",

    abaya: "Abayas",

    hijab: "Hijabs",

    top: "Tops",
    tops: "Tops",

    sneakers: "Sneakers",

    shoes: "Shoes"

  };


  Object.keys(categoryMap)
    .forEach(keyword => {

      if (
        text.includes(keyword)
      ) {

        if (
          !intent.category.includes(
            categoryMap[keyword]
          )
        ) {

          intent.category.push(
            categoryMap[keyword]
          );

        }

      }

    });


  /* COLORS */

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


  intent.colors =
    colors.filter(
      color =>
        text.includes(color)
    );


  /* MATERIAL */

  const materials = [
    "cotton",
    "linen",
    "silk",
    "wool",
    "denim",
    "velvet",
    "chiffon",
    "polyester",
    "leather",
    "satin",
    "mesh"
  ];


  intent.materials =
    materials.filter(
      material =>
        text.includes(material)
    );


  /* STYLE */

  const styles = [
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
    "elegant",
    "comfortable"
  ];


  intent.styles =
    styles.filter(
      style =>
        text.includes(style)
    );


  /* OCCASION */

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


  intent.occasions =
    occasions.filter(
      occasion =>
        text.includes(occasion)
    );


  /* GENDER */

  const genders = [
    "men",
    "man",
    "women",
    "woman",
    "unisex",
    "kids",
    "children"
  ];


  intent.genders =
    genders.filter(
      gender =>
        text.includes(gender)
    );


  /* PRICE RANGE */

  const range =
    text.match(
      /between\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:and|-)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i
    );


  if (range) {

    intent.priceMin =
      Number(range[1]);

    intent.priceMax =
      Number(range[2]);

  }


  const max =
    text.match(
      /(?:under|below|less than|upto|up to|within|budget)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i
    );


  if (max) {

    intent.priceMax =
      Number(max[1]);

  }


  return intent;

}


/* =========================================================
   ATTRIBUTE MATCH
========================================================= */

function attributeMatch(
  product,
  intent
) {

  let score = 0;

  const reasons = [];


  const category =
    normalize(product.category);

  const color =
    normalize(product.color);

  const material =
    arrayText(product.material);

  const style =
    arrayText(product.style);

  const occasion =
    arrayText(product.occasion);

  const gender =
    normalize(product.gender);


  /* CATEGORY */

  if (
    intent.category.length &&
    intent.category.some(
      item =>
        category.includes(
          normalize(item)
        )
    )
  ) {

    score += 0.16;

    reasons.push(
      "category match"
    );

  }


  /* COLOR */

  if (
    intent.colors.some(
      item =>
        color.includes(item)
    )
  ) {

    score += 0.14;

    reasons.push(
      "colour match"
    );

  }


  /* MATERIAL */

  if (
    intent.materials.some(
      item =>
        material.includes(item)
    )
  ) {

    score += 0.12;

    reasons.push(
      "material match"
    );

  }


  /* STYLE */

  if (
    intent.styles.some(
      item =>
        style.includes(item)
    )
  ) {

    score += 0.12;

    reasons.push(
      "style match"
    );

  }


  /* OCCASION */

  if (
    intent.occasions.some(
      item =>
        occasion.includes(item)
    )
  ) {

    score += 0.12;

    reasons.push(
      "occasion match"
    );

  }


  /* GENDER */

  if (
    intent.genders.some(
      item =>
        gender.includes(item)
    )
  ) {

    score += 0.08;

    reasons.push(
      "gender match"
    );

  }


  /* PRICE */

  const price =
    Number(product.price);


  if (
    intent.priceMax !== null &&
    !Number.isNaN(price)
  ) {

    if (
      price <= intent.priceMax
    ) {

      score += 0.10;

      reasons.push(
        "within budget"
      );

    } else {

      score -= 0.10;

    }

  }


  if (
    intent.priceMin !== null &&
    !Number.isNaN(price)
  ) {

    if (
      price >= intent.priceMin
    ) {

      score += 0.05;

      reasons.push(
        "above minimum budget"
      );

    } else {

      score -= 0.05;

    }

  }


  return {

    score,

    reasons

  };

}


/* =========================================================
   BUILD PRODUCT INDEX
========================================================= */

async function buildProductIndex(
  products
) {

  console.log(
    `Creating AI embeddings for ${products.length} products...`
  );


  const indexedProducts = [];


  for (
    const product of products
  ) {

    const text =
      productToSearchText(
        product
      );

    const embedding =
      await createEmbedding(text);


    indexedProducts.push({

      ...product,

      _searchText: text,

      _embedding: embedding

    });

  }


  console.log(
    "AI product index ready."
  );


  return indexedProducts;

}


/* =========================================================
   AI SEARCH
========================================================= */

async function semanticSearch(
  query,
  indexedProducts,
  limit = 20
) {

  if (
    !query ||
    !Array.isArray(indexedProducts)
  ) {

    return [];

  }


  const intent =
    understandFashionQuery(
      query
    );


  const queryEmbedding =
    await createEmbedding(
      query
    );


  const results =
    indexedProducts.map(
      product => {

        const semanticScore =
          cosineSimilarity(
            queryEmbedding,
            product._embedding
          );


        const attribute =
          attributeMatch(
            product,
            intent
          );


        const finalScore =
          (
            semanticScore * 0.65
          ) +
          (
            attribute.score * 0.35
          );


        return {

          ...product,

          semanticScore:
            Number(
              semanticScore.toFixed(4)
            ),

          attributeScore:
            Number(
              attribute.score.toFixed(4)
            ),

          relevanceScore:
            Number(
              finalScore.toFixed(4)
            ),

          matchedFields:
            attribute.reasons

        };

      }
    );


  return results

    .filter(
      product =>
        product.relevanceScore > 0
    )

    .sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore
    )

    .slice(0, limit)

    .map(product => {

      const cleanProduct = {
        ...product
      };

      delete cleanProduct._embedding;
      delete cleanProduct._searchText;

      return cleanProduct;

    });

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

  getExtractor,

  createEmbedding,

  buildProductIndex,

  semanticSearch,

  understandFashionQuery,

  productToSearchText

};
