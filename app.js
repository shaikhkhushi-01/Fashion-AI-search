/*
=========================================================
FASHION AI DISCOVERY
DAY 8 - USER PERSONALIZATION
=========================================================
Features:
- Natural language fashion search
- Semantic/hybrid backend search
- User preference profile
- Personalized ranking
- Search history
- Interaction learning
- Budget preference
- Style preference
- Colour preference
- Occasion preference
- Category preference
- Explainable personalization
- Local persistence
=========================================================
*/

"use strict";

/*
=========================================================
CONFIG
=========================================================
*/

const API_BASE_URL =
  "https://fashion-ai-search-lj6s.onrender.com";

const STORAGE_KEY =
  "fashion_ai_user_profile_v8";

const MAX_HISTORY =
  30;

const MAX_INTERACTIONS =
  100;

/*
=========================================================
DOM HELPERS
=========================================================
*/

const $ = (id) =>
  document.getElementById(id);

const searchInput =
  $("searchInput");

const searchButton =
  $("searchButton");

const resultsContainer =
  $("results");

const resultCount =
  $("resultCount");

const searchSummary =
  $("searchSummary");

const stylistButton =
  $("stylistButton");

/*
=========================================================
STATE
=========================================================
*/

let allProducts = [];

let currentResults = [];

let currentQuery = "";

let isSearching = false;

let userProfile =
  loadUserProfile();

/*
=========================================================
DEFAULT USER PROFILE
=========================================================
*/

function createDefaultProfile() {

  return {

    version: 1,

    preferences: {

      styles: [],

      colors: [],

      occasions: [],

      categories: [],

      materials: [],

      budget: null

    },

    searchHistory: [],

    interactions: {

      views: {},

      likes: {},

      clicks: {},

      searches: {}

    },

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };
}

/*
=========================================================
LOAD PROFILE
=========================================================
*/

function loadUserProfile() {

  try {

    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {

      return createDefaultProfile();
    }

    const parsed =
      JSON.parse(raw);

    const defaults =
      createDefaultProfile();

    return {

      ...defaults,

      ...parsed,

      preferences: {

        ...defaults.preferences,

        ...(parsed.preferences || {})

      },

      interactions: {

        ...defaults.interactions,

        ...(parsed.interactions || {})

      },

      searchHistory:
        Array.isArray(
          parsed.searchHistory
        )
          ? parsed.searchHistory
          : []

    };

  } catch (error) {

    console.warn(
      "Could not load user profile:",
      error
    );

    return createDefaultProfile();
  }
}

/*
=========================================================
SAVE PROFILE
=========================================================
*/

function saveUserProfile() {

  try {

    userProfile.updatedAt =
      new Date().toISOString();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(userProfile)
    );

  } catch (error) {

    console.warn(
      "Could not save user profile:",
      error
    );
  }
}

/*
=========================================================
HTML ESCAPE
=========================================================
*/

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/*
=========================================================
PRICE
=========================================================
*/

function formatPrice(price) {

  const value =
    Number(price);

  if (!Number.isFinite(value)) {

    return escapeHTML(
      price || ""
    );
  }

  return value.toLocaleString(
    "en-IN"
  );
}

/*
=========================================================
ARRAY NORMALIZER
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

    return value
      .split(",")
      .map(
        item => item.trim()
      )
      .filter(Boolean);
  }

  return [];
}

/*
=========================================================
NORMALIZE TEXT
=========================================================
*/

function normalizeText(value) {

  return String(
    value || ""
  )
    .toLowerCase()
    .trim();
}

/*
=========================================================
TOKENIZE
=========================================================
*/

function tokenize(value) {

  return normalizeText(value)
    .replace(
      /[^a-z0-9\s-]/g,
      " "
    )
    .split(/\s+/)
    .filter(
      token => token.length > 1
    );
}

/*
=========================================================
PRODUCT TEXT
=========================================================
*/

function productText(product) {

  return [

    product.name,

    product.brand,

    product.category,

    product.description,

    product.color,

    product.colour,

    product.style,

    product.occasion,

    product.material,

    product.gender

  ]
    .flatMap(
      value => safeArray(value)
    )
    .join(" ");
}

/*
=========================================================
PRODUCT VISUAL
=========================================================
*/

function productVisual(product) {

  const category =
    String(
      product.category ||
      "Fashion"
    );

  const name =
    String(
      product.name ||
      "Fashion Product"
    );

  return `
    <div class="product-visual">

      <div class="visual-grid"></div>

      <div class="visual-content">

        <span class="visual-label">
          FASHION AI
        </span>

        <strong>
          ${escapeHTML(category)}
        </strong>

        <small>
          ${escapeHTML(name)}
        </small>

      </div>

    </div>
  `;
}

/*
=========================================================
PERSONALIZATION SCORE
=========================================================
*/

function calculatePersonalizationScore(
  product
) {

  const preferences =
    userProfile.preferences;

  let score = 0;

  let matchedSignals = 0;

  let totalSignals = 0;

  const text =
    normalizeText(
      productText(product)
    );

  /*
  -------------------------
  STYLE
  -------------------------
  */

  if (
    preferences.styles.length
  ) {

    totalSignals++;

    const matched =
      preferences.styles.some(
        style =>
          text.includes(
            normalizeText(style)
          )
      );

    if (matched) {

      score += 20;

      matchedSignals++;
    }
  }

  /*
  -------------------------
  COLOR
  -------------------------
  */

  if (
    preferences.colors.length
  ) {

    totalSignals++;

    const productColor =
      normalizeText(
        product.color ||
        product.colour
      );

    const matched =
      preferences.colors.some(
        color =>
          productColor.includes(
            normalizeText(color)
          ) ||
          text.includes(
            normalizeText(color)
          )
      );

    if (matched) {

      score += 18;

      matchedSignals++;
    }
  }

  /*
  -------------------------
  OCCASION
  -------------------------
  */

  if (
    preferences.occasions.length
  ) {

    totalSignals++;

    const matched =
      preferences.occasions.some(
        occasion =>
          text.includes(
            normalizeText(
              occasion
            )
          )
      );

    if (matched) {

      score += 18;

      matchedSignals++;
    }
  }

  /*
  -------------------------
  CATEGORY
  -------------------------
  */

  if (
    preferences.categories.length
  ) {

    totalSignals++;

    const category =
      normalizeText(
        product.category
      );

    const matched =
      preferences.categories.some(
        item =>
          category.includes(
            normalizeText(item)
          )
      );

    if (matched) {

      score += 15;

      matchedSignals++;
    }
  }

  /*
  -------------------------
  MATERIAL
  -------------------------
  */

  if (
    preferences.materials.length
  ) {

    totalSignals++;

    const matched =
      preferences.materials.some(
        material =>
          text.includes(
            normalizeText(material)
          )
      );

    if (matched) {

      score += 10;

      matchedSignals++;
    }
  }

  /*
  -------------------------
  BUDGET
  -------------------------
  */

  if (
    Number.isFinite(
      Number(
        preferences.budget
      )
    )
  ) {

    totalSignals++;

    const productPrice =
      Number(
        product.price
      );

    const budget =
      Number(
        preferences.budget
      );

    if (
      Number.isFinite(
        productPrice
      )
    ) {

      if (
        productPrice <=
        budget
      ) {

        score += 12;

        matchedSignals++;

      } else {

        const difference =
          productPrice -
          budget;

        const penalty =
          Math.min(
            12,
            (difference /
              Math.max(
                budget,
                1
              )) * 12
          );

        score -= penalty;
      }
    }
  }

  /*
  -------------------------
  INTERACTION SIGNAL
  -------------------------
  */

  const productId =
    getProductId(product);

  const interactions =
    userProfile.interactions;

  const views =
    Number(
      interactions.views[
        productId
      ] || 0
    );

  const likes =
    Number(
      interactions.likes[
        productId
      ] || 0
    );

  const clicks =
    Number(
      interactions.clicks[
        productId
      ] || 0
    );

  score +=
    Math.min(
      10,
      views * 1
    );

  score +=
    Math.min(
      15,
      likes * 5
    );

  score +=
    Math.min(
      8,
      clicks * 2
    );

  /*
  -------------------------
  NORMALIZED SCORE
  -------------------------
  */

  const normalized =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    );

  return {

    score:
      normalized,

    matchedSignals,

    totalSignals

  };
}

/*
=========================================================
PRODUCT ID
=========================================================
*/

function getProductId(product) {

  return String(
    product.id ??
    product.productId ??
    product.sku ??
    product.name ??
    Math.random()
  );
}

/*
=========================================================
PERSONALIZED RANKING
=========================================================
*/

function personalizeResults(
  products
) {

  if (
    !Array.isArray(products)
  ) {

    return [];
  }

  return products
    .map(
      (product, index) => {

        const baseScore =
          Number(
            product.matchScore ??
            product.score ??
            product.relevanceScore ??
            0
          );

        const safeBaseScore =
          Number.isFinite(
            baseScore
          )
            ? Math.max(
                0,
                Math.min(
                  100,
                  baseScore
                )
              )
            : 0;

        const personalization =
          calculatePersonalizationScore(
            product
          );

        /*
        Research-oriented weighted
        hybrid ranking.

        70% retrieval score
        30% personalization
        */

        const finalScore =
          (
            safeBaseScore * 0.70
          ) +
          (
            personalization.score *
            0.30
          );

        return {

          ...product,

          originalMatchScore:
            safeBaseScore,

          personalizationScore:
            personalization.score,

          finalPersonalizedScore:
            finalScore,

          personalizationSignals:
            personalization,

          originalRank:
            index + 1

        };
      }
    )
    .sort(
      (
        a,
        b
      ) =>
        b.finalPersonalizedScore -
        a.finalPersonalizedScore
    );
}

/*
=========================================================
PERSONALIZATION EXPLANATION
=========================================================
*/

function getPersonalizationExplanation(
  product
) {

  const signals =
    product.personalizationSignals;

  if (!signals) {

    return "";
  }

  const reasons = [];

  const preferences =
    userProfile.preferences;

  const text =
    normalizeText(
      productText(product)
    );

  if (
    preferences.styles.some(
      style =>
        text.includes(
          normalizeText(style)
        )
    )
  ) {

    reasons.push(
      "matches your preferred style"
    );
  }

  const productColor =
    normalizeText(
      product.color ||
      product.colour
    );

  if (
    preferences.colors.some(
      color =>
        productColor.includes(
          normalizeText(color)
        )
    )
  ) {

    reasons.push(
      "matches your colour preference"
    );
  }

  if (
    Number.isFinite(
      Number(
        preferences.budget
      )
    ) &&
    Number(
      product.price
    ) <=
      Number(
        preferences.budget
      )
  ) {

    reasons.push(
      "fits your preferred budget"
    );
  }

  if (
    preferences.categories.some(
      category =>
        normalizeText(
          product.category
        ).includes(
          normalizeText(
            category
          )
        )
    )
  ) {

    reasons.push(
      "matches your preferred category"
    );
  }

  if (!reasons.length) {

    return "Personalized using your search and interaction history.";
  }

  return (
    "Personalized because it " +
    reasons.join(", ") +
    "."
  );
}

/*
=========================================================
LOADING
=========================================================
*/

function showLoading(
  message
) {

  if (!resultsContainer) {

    return;
  }

  resultsContainer.innerHTML = `

    <div class="no-results">

      <div class="loading-spinner"></div>

      <h3>
        ${escapeHTML(
          message ||
          "AI is working..."
        )}
      </h3>

      <p>
        Fashion AI is analysing your request.
      </p>

    </div>
  `;

  if (resultCount) {

    resultCount.textContent =
      "AI working";
  }
}

/*
=========================================================
ERROR
=========================================================
*/

function showError(
  message
) {

  if (!resultsContainer) {

    return;
  }

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        AI service unavailable
      </h3>

      <p>
        ${escapeHTML(
          message ||
          "Something went wrong. Please try again."
        )}
      </p>

    </div>
  `;

  if (resultCount) {

    resultCount.textContent =
      "Error";
  }
}

/*
=========================================================
NO RESULTS
=========================================================
*/

function showNoResults() {

  if (!resultsContainer) {

    return;
  }

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        No strong fashion matches found.
      </h3>

      <p>
        Try another colour, style,
        occasion or budget.
      </p>

    </div>
  `;

  if (resultCount) {

    resultCount.textContent =
      "0 matches";
  }
}

/*
=========================================================
PRODUCT CARD
=========================================================
*/

function createProductCard(
  product
) {

  const score =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          product.finalPersonalizedScore ??
          product.matchScore ??
          product.score ??
          0
        )
      )
    );

  const reasons =
    safeArray(
      product.reasons
    );

  const styles =
    safeArray(
      product.style
    );

  const occasions =
    safeArray(
      product.occasion
    );

  const materials =
    safeArray(
      product.material
    );

  const productId =
    getProductId(product);

  const personalizationText =
    getPersonalizationExplanation(
      product
    );

  return `

    <article
      class="product-card"
      data-product-id="${escapeHTML(productId)}"
    >

      <div class="product-image-wrap">

        ${productVisual(product)}

        <div class="ai-match-badge">
          ${Math.round(score)}% AI MATCH
        </div>

      </div>

      <div class="product-content">

        <div class="product-top">

          <span class="product-brand">
            ${escapeHTML(
              product.brand ||
              "FASHION"
            )}
          </span>

          <span class="product-category">
            ${escapeHTML(
              product.category ||
              "Fashion"
            )}
          </span>

        </div>

        <h3 class="product-title">
          ${escapeHTML(
            product.name ||
            "Fashion Product"
          )}
        </h3>

        <p class="product-description">
          ${escapeHTML(
            product.description ||
            ""
          )}
        </p>

        <div class="product-price">
          ₹${formatPrice(
            product.price
          )}
        </div>

        <div class="product-meta">

          ${
            product.color ||
            product.colour
              ? `
                <div class="product-meta-item">

                  <span>
                    Colour
                  </span>

                  <strong>
                    ${escapeHTML(
                      product.color ||
                      product.colour
                    )}
                  </strong>

                </div>
              `
              : ""
          }

          ${
            materials.length
              ? `
                <div class="product-meta-item">

                  <span>
                    Material
                  </span>

                  <strong>
                    ${escapeHTML(
                      materials
                        .slice(
                          0,
                          2
                        )
                        .join(", ")
                    )}
                  </strong>

                </div>
              `
              : ""
          }

          ${
            styles.length
              ? `
                <div class="product-meta-item">

                  <span>
                    Style
                  </span>

                  <strong>
                    ${escapeHTML(
                      styles
                        .slice(
                          0,
                          2
                        )
                        .join(", ")
                    )}
                  </strong>

                </div>
              `
              : ""
          }

          ${
            occasions.length
              ? `
                <div class="product-meta-item">

                  <span>
                    Occasion
                  </span>

                  <strong>
                    ${escapeHTML(
                      occasions
                        .slice(
                          0,
                          2
                        )
                        .join(", ")
                    )}
                  </strong>

                </div>
              `
              : ""
          }

        </div>

        ${
          reasons.length
            ? `
              <div class="product-reason">

                <strong>
                  Why AI selected this
                </strong>

                <ul>

                  ${reasons
                    .slice(
                      0,
                      3
                    )
                    .map(
                      reason => `
                        <li>
                          ${escapeHTML(
                            reason
                          )}
                        </li>
                      `
                    )
                    .join("")}

                </ul>

              </div>
            `
            : ""
        }

        <div
          class="product-reason personalization-reason"
        >

          <strong>
            ✨ Personalization
          </strong>

          <p>
            ${escapeHTML(
              personalizationText
            )}
          </p>

        </div>

        <div class="match-score">

          <div class="match-score-header">

            <span>
              Personalized relevance
            </span>

            <strong>
              ${Math.round(score)}%
            </strong>

          </div>

          <div class="match-score-bar">

            <div
              class="match-score-fill"
              style="width:${Math.round(score)}%"
            ></div>

          </div>

        </div>

        <button
          class="personalization-like"
          data-like-product="${escapeHTML(productId)}"
          type="button"
        >
          ♡ Prefer this style
        </button>

      </div>

    </article>
  `;
}

/*
=========================================================
RENDER PRODUCTS
=========================================================
*/

function renderProducts(
  products,
  query = "",
  personalize = true
) {

  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {

    showNoResults();

    return;
  }

  let finalProducts =
    products;

  if (personalize) {

    finalProducts =
      personalizeResults(
        products
      );
  }

  currentResults =
    finalProducts;

  resultsContainer.innerHTML =
    finalProducts
      .map(
        createProductCard
      )
      .join("");

  if (resultCount) {

    resultCount.textContent =
      `${finalProducts.length} personalized matches`;
  }

  if (
    searchSummary &&
    query
  ) {

    searchSummary.textContent =
      `Personalized AI results for "${query}"`;
  }

  setupProductInteractions();
}

/*
=========================================================
API REQUEST
=========================================================
*/

async function apiRequest(
  endpoint,
  options = {}
) {

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      30000
    );

  try {

    const response =
      await fetch(
        `${API_BASE_URL}${endpoint}`,
        {

          ...options,

          signal:
            controller.signal

        }
      );

    let data = {};

    try {

      data =
        await response.json();

    } catch {

      data = {};

    }

    if (!response.ok) {

      throw new Error(
        data.error ||
        `Request failed (${response.status})`
      );
    }

    return data;

  } finally {

    clearTimeout(timeout);
  }
}

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

async function loadProducts() {

  const data =
    await apiRequest(
      "/api/products"
    );

  allProducts =
    Array.isArray(
      data.products
    )
      ? data.products
      : [];

  return allProducts;
}

/*
=========================================================
AI SEARCH
=========================================================
*/

async function searchFashion(
  query
) {

  return apiRequest(
    "/api/search",
    {

      method:
        "POST",

      headers: {

        "Content-Type":
          "application/json"

      },

      body:
        JSON.stringify({
          query
        })

    }
  );
}

/*
=========================================================
SEARCH HISTORY
=========================================================
*/

function recordSearch(
  query
) {

  const cleanQuery =
    normalizeText(query);

  if (!cleanQuery) {

    return;
  }

  userProfile.searchHistory =
    userProfile.searchHistory.filter(
      item =>
        normalizeText(
          item.query
        ) !== cleanQuery
    );

  userProfile.searchHistory.unshift({

    query: cleanQuery,

    timestamp:
      new Date().toISOString()

  });

  userProfile.searchHistory =
    userProfile.searchHistory.slice(
      0,
      MAX_HISTORY
    );

  userProfile.interactions.searches[
    cleanQuery
  ] =
    Number(
      userProfile.interactions
        .searches[
          cleanQuery
        ] || 0
    ) + 1;

  /*
  Automatically learn basic preferences
  from repeated searches.
  */

  learnPreferencesFromQuery(
    query
  );

  saveUserProfile();
}

/*
=========================================================
LEARN FROM QUERY
=========================================================
*/

function learnPreferencesFromQuery(
  query
) {

  const tokens =
    tokenize(query);

  const fashionVocabulary = {

    styles: [

      "casual",
      "formal",
      "streetwear",
      "oversized",
      "minimal",
      "boho",
      "vintage",
      "ethnic",
      "party",
      "smart",
      "sporty",
      "summer",
      "winter",
      "western",
      "traditional"

    ],

    colors: [

      "black",
      "white",
      "red",
      "blue",
      "green",
      "pink",
      "yellow",
      "purple",
      "brown",
      "beige",
      "grey",
      "gray",
      "orange",
      "maroon",
      "navy"

    ],

    occasions: [

      "college",
      "office",
      "wedding",
      "party",
      "date",
      "travel",
      "gym",
      "festival",
      "casual",
      "work"

    ],

    categories: [

      "shirt",
      "tshirt",
      "t-shirt",
      "dress",
      "jeans",
      "trousers",
      "pants",
      "kurta",
      "saree",
      "top",
      "skirt",
      "jacket",
      "hoodie",
      "sweater",
      "blazer",
      "shoes",
      "sneakers"

    ]

  };

  Object.entries(
    fashionVocabulary
  ).forEach(
    (
      [
        type,
        vocabulary
      ]
    ) => {

      vocabulary.forEach(
        word => {

          if (
            tokens.includes(word)
          ) {

            addPreference(
              type,
              word
            );
          }

        }
      );

    }
  );
}

/*
=========================================================
ADD PREFERENCE
=========================================================
*/

function addPreference(
  type,
  value
) {

  if (
    !userProfile.preferences[type]
  ) {

    userProfile.preferences[type] =
      [];
  }

  const clean =
    normalizeText(value);

  const exists =
    userProfile.preferences[
      type
    ].some(
      item =>
        normalizeText(item) ===
        clean
    );

  if (!exists) {

    userProfile.preferences[
      type
    ].push(value);

    userProfile.preferences[
      type
    ] =
      userProfile.preferences[
        type
      ].slice(
        -10
      );
  }
}

/*
=========================================================
INTERACTION TRACKING
=========================================================
*/

function trackProductView(
  product
) {

  const id =
    getProductId(product);

  userProfile.interactions.views[id] =
    Number(
      userProfile.interactions.views[id] ||
      0
    ) + 1;

  saveUserProfile();
}

/*
=========================================================
LIKE PRODUCT
=========================================================
*/

function likeProduct(
  product
) {

  const id =
    getProductId(product);

  userProfile.interactions.likes[id] =
    Number(
      userProfile.interactions.likes[id] ||
      0
    ) + 1;

  /*
  Learn product attributes.
  */

  const productStyles =
    safeArray(
      product.style
    );

  const productColors =
    safeArray(
      product.color ||
      product.colour
    );

  const productCategories =
    safeArray(
      product.category
    );

  const productOccasions =
    safeArray(
      product.occasion
    );

  productStyles.forEach(
    style =>
      addPreference(
        "styles",
        style
      )
  );

  productColors.forEach(
    color =>
      addPreference(
        "colors",
        color
      )
  );

  productCategories.forEach(
    category =>
      addPreference(
        "categories",
        category
      )
  );

  productOccasions.forEach(
    occasion =>
      addPreference(
        "occasions",
        occasion
      )
  );

  saveUserProfile();

  showPersonalizationToast(
    "Preference learned ✨"
  );

  /*
  Re-rank current results.
  */

  if (
    currentResults.length
  ) {

    renderProducts(
      currentResults,
      currentQuery,
      true
    );
  }
}

/*
=========================================================
CLICK TRACKING
=========================================================
*/

function trackProductClick(
  product
) {

  const id =
    getProductId(product);

  userProfile.interactions.clicks[id] =
    Number(
      userProfile.interactions.clicks[id] ||
      0
    ) + 1;

  saveUserProfile();
}

/*
=========================================================
PRODUCT INTERACTIONS
=========================================================
*/

function setupProductInteractions() {

  document
    .querySelectorAll(
      "[data-product-id]"
    )
    .forEach(
      card => {

        const id =
          card.dataset.productId;

        const product =
          currentResults.find(
            item =>
              getProductId(item) ===
              id
          );

        if (!product) {

          return;
        }

        trackProductView(
          product
        );

        const likeButton =
          card.querySelector(
            "[data-like-product]"
          );

        likeButton?.addEventListener(
          "click",
          event => {

            event.preventDefault();

            likeProduct(
              product
            );

            likeButton.textContent =
              "✓ Preference saved";

            likeButton.disabled =
              true;

          }
        );

        card.addEventListener(
          "click",
          event => {

            if (
              event.target.closest(
                "[data-like-product]"
              )
            ) {

              return;
            }

            trackProductClick(
              product
            );

          }
        );

      }
    );
}

/*
=========================================================
PERSONALIZED SEARCH
=========================================================
*/

async function runSearch() {

  if (isSearching) {

    return;
  }

  const query =
    searchInput
      ? searchInput.value.trim()
      : "";

  if (!query) {

    currentQuery = "";

    if (
      allProducts.length
    ) {

      renderProducts(
        allProducts.slice(
          0,
          12
        ),
        "",
        true
      );

      if (searchSummary) {

        searchSummary.textContent =
          `${allProducts.length} products available. Personalized ranking is active.`;
      }

    }

    return;
  }

  isSearching =
    true;

  if (searchButton) {

    searchButton.disabled =
      true;
  }

  currentQuery =
    query;

  recordSearch(
    query
  );

  showLoading(
    "Understanding your fashion request..."
  );

  try {

    const data =
      await searchFashion(
        query
      );

    const results =
      Array.isArray(
        data.results
      )
        ? data.results
        : [];

    if (!results.length) {

      showNoResults();

      return;
    }

    renderProducts(
      results,
      query,
      true
    );

    if (
      data.budget &&
      searchSummary
    ) {

      searchSummary.textContent =
        `Personalized AI results for "${query}" · budget detected: ₹${formatPrice(data.budget)}`;
    }

    document
      .getElementById(
        "results-section"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",
        block:
          "start"
      });

  } catch (error) {

    console.error(
      "AI Search Error:",
      error
    );

    showError(
      error.name ===
        "AbortError"
        ? "AI request timed out. Please try again."
        : error.message
    );

  } finally {

    isSearching =
      false;

    if (searchButton) {

      searchButton.disabled =
        false;
    }
  }
}

/*
=========================================================
AI STYLIST
=========================================================
*/

async function runAIStylist() {

  const getValue =
    id =>
      $(id)
        ?.value
        ?.trim() ||
      "";

  const occasion =
    getValue(
      "stylistOccasion"
    );

  const style =
    getValue(
      "stylistStyle"
    );

  const comfort =
    getValue(
      "stylistComfort"
    );

  const color =
    getValue(
      "stylistColor"
    );

  const coverage =
    getValue(
      "stylistCoverage"
    );

  const description =
    getValue(
      "stylistDescription"
    );

  const hasInput =
    [
      occasion,
      style,
      comfort,
      color,
      coverage,
      description
    ].some(Boolean);

  if (!hasInput) {

    alert(
      "Please describe at least one part of your desired look."
    );

    return;
  }

  /*
  Learn stylist preferences.
  */

  if (style) {

    addPreference(
      "styles",
      style
    );
  }

  if (color) {

    addPreference(
      "colors",
      color
    );
  }

  if (occasion) {

    addPreference(
      "occasions",
      occasion
    );
  }

  if (description) {

    learnPreferencesFromQuery(
      description
    );
  }

  saveUserProfile();

  if (stylistButton) {

    stylistButton.disabled =
      true;

    stylistButton.textContent =
      "AI is styling...";
  }

  showLoading(
    "Building your personalised fashion recommendations..."
  );

  try {

    const data =
      await apiRequest(
        "/api/stylist",
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              occasion,

              style,

              comfort,

              color,

              coverage,

              description

            })

        }
      );

    const recommendations =
      Array.isArray(
        data.recommendations
      )
        ? data.recommendations
        : [];

    if (
      !recommendations.length
    ) {

      showNoResults();

      return;
    }

    renderProducts(
      recommendations,
      data.query ||
      description,
      true
    );

    if (searchSummary) {

      searchSummary.textContent =
        "Personalized recommendations generated using your AI Stylist preferences.";
    }

    document
      .getElementById(
        "results-section"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",
        block:
          "start"
      });

  } catch (error) {

    console.error(
      "AI Stylist error:",
      error
    );

    showError(
      error.message ||
      "AI Stylist could not complete the request."
    );

  } finally {

    if (stylistButton) {

      stylistButton.disabled =
        false;

      stylistButton.textContent =
        "Find My AI Matches";
    }
  }
}

/*
=========================================================
SEARCH HINTS
=========================================================
*/

function setupSearchHints() {

  document
    .querySelectorAll(
      ".search-hints button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            if (searchInput) {

              searchInput.value =
                button.textContent
                  .trim();
            }

            runSearch();

          }
        );

      }
    );
}

/*
=========================================================
PERSONALIZATION PANEL
=========================================================
*/

function createPersonalizationPanel() {

  if (
    document.getElementById(
      "personalization-panel"
    )
  ) {

    return;
  }

  const panel =
    document.createElement(
      "div"
    );

  panel.id =
    "personalization-panel";

  panel.innerHTML = `

    <div
      id="personalization-overlay"
      class="personalization-overlay"
    ></div>

    <aside
      class="personalization-drawer"
    >

      <button
        type="button"
        id="close-personalization"
        class="personalization-close"
      >
        ×
      </button>

      <div class="personalization-header">

        <span>
          FASHION AI
        </span>

        <h2>
          Your Style Profile
        </h2>

        <p>
          Fashion AI learns from your preferences
          to improve future recommendations.
        </p>

      </div>

      <div class="personalization-section">

        <h3>
          Preferred styles
        </h3>

        <div
          id="profile-styles"
          class="profile-tags"
        ></div>

      </div>

      <div class="personalization-section">

        <h3>
          Preferred colours
        </h3>

        <div
          id="profile-colors"
          class="profile-tags"
        ></div>

      </div>

      <div class="personalization-section">

        <h3>
          Preferred occasions
        </h3>

        <div
          id="profile-occasions"
          class="profile-tags"
        ></div>

      </div>

      <div class="personalization-section">

        <h3>
          Preferred categories
        </h3>

        <div
          id="profile-categories"
          class="profile-tags"
        ></div>

      </div>

      <div class="personalization-section">

        <h3>
          Budget
        </h3>

        <input
          id="profile-budget"
          type="number"
          min="0"
          placeholder="e.g. 2500"
        />

        <button
          type="button"
          id="save-budget"
          class="profile-save"
        >
          Save Budget
        </button>

      </div>

      <div class="personalization-stats">

        <div>
          <strong
            id="profile-search-count"
          >
            0
          </strong>

          <span>
            Searches
          </span>
        </div>

        <div>
          <strong
            id="profile-interaction-count"
          >
            0
          </strong>

          <span>
            Interactions
          </span>
        </div>

        <div>
          <strong
            id="profile-preference-count"
          >
            0
          </strong>

          <span>
            Preferences
          </span>
        </div>

      </div>

      <button
        type="button"
        id="reset-profile"
        class="profile-reset"
      >
        Reset Personalization
      </button>

    </aside>
  `;

  document.body.appendChild(
    panel
  );

  injectPersonalizationStyles();

  setupPersonalizationEvents();

  renderProfile();
}

/*
=========================================================
PROFILE TAG RENDER
=========================================================
*/

function renderProfileTags(
  elementId,
  type
) {

  const container =
    document.getElementById(
      elementId
    );

  if (!container) {

    return;
  }

  const values =
    userProfile.preferences[
      type
    ] || [];

  if (!values.length) {

    container.innerHTML = `
      <span class="profile-empty">
        Not learned yet
      </span>
    `;

    return;
  }

  container.innerHTML =
    values
      .map(
        value => `
          <button
            type="button"
            class="profile-tag"
            data-remove-preference="${escapeHTML(type)}"
            data-remove-value="${escapeHTML(value)}"
          >
            ${escapeHTML(value)}
            <span>×</span>
          </button>
        `
      )
      .join("");
}

/*
=========================================================
RENDER PROFILE
=========================================================
*/

function renderProfile() {

  renderProfileTags(
    "profile-styles",
    "styles"
  );

  renderProfileTags(
    "profile-colors",
    "colors"
  );

  renderProfileTags(
    "profile-occasions",
    "occasions"
  );

  renderProfileTags(
    "profile-categories",
    "categories"
  );

  const budgetInput =
    document.getElementById(
      "profile-budget"
    );

  if (budgetInput) {

    budgetInput.value =
      userProfile.preferences.budget ||
      "";
  }

  const searchCount =
    userProfile.searchHistory.length;

  const interactions =
    Object.values(
      userProfile.interactions
        .views
    ).reduce(
      (
        total,
        value
      ) =>
        total +
        Number(value || 0),
      0
    );

  const preferenceCount =
    Object.values(
      userProfile.preferences
    )
      .filter(
        value =>
          Array.isArray(value)
      )
      .reduce(
        (
          total,
          value
        ) =>
          total +
          value.length,
        0
      ) +
    (
      userProfile.preferences
        .budget
        ? 1
        : 0
    );

  const searchElement =
    document.getElementById(
      "profile-search-count"
    );

  const interactionElement =
    document.getElementById(
      "profile-interaction-count"
    );

  const preferenceElement =
    document.getElementById(
      "profile-preference-count"
    );

  if (searchElement) {

    searchElement.textContent =
      searchCount;
  }

  if (interactionElement) {

    interactionElement.textContent =
      interactions;
  }

  if (preferenceElement) {

    preferenceElement.textContent =
      preferenceCount;
  }
}

/*
=========================================================
PROFILE EVENTS
=========================================================
*/

function setupPersonalizationEvents() {

  document
    .getElementById(
      "close-personalization"
    )
    ?.addEventListener(
      "click",
      closePersonalization
    );

  document
    .getElementById(
      "personalization-overlay"
    )
    ?.addEventListener(
      "click",
      closePersonalization
    );

  document
    .getElementById(
      "save-budget"
    )
    ?.addEventListener(
      "click",
      () => {

        const input =
          document.getElementById(
            "profile-budget"
          );

        const budget =
          Number(
            input?.value
          );

        if (
          Number.isFinite(
            budget
          ) &&
          budget > 0
        ) {

          userProfile.preferences.budget =
            budget;

        } else {

          userProfile.preferences.budget =
            null;
        }

        saveUserProfile();

        renderProfile();

        showPersonalizationToast(
          "Budget preference saved."
        );

        if (
          currentResults.length
        ) {

          renderProducts(
            currentResults,
            currentQuery,
            true
          );
        }

      }
    );

  document
    .getElementById(
      "reset-profile"
    )
    ?.addEventListener(
      "click",
      () => {

        const confirmed =
          confirm(
            "Reset all learned fashion preferences?"
          );

        if (!confirmed) {

          return;
        }

        userProfile =
          createDefaultProfile();

        saveUserProfile();

        renderProfile();

        showPersonalizationToast(
          "Personalization reset."
        );

        if (
          allProducts.length
        ) {

          renderProducts(
            allProducts.slice(
              0,
              12
            ),
            "",
            true
          );
        }

      }
    );

  document.addEventListener(
    "click",
    event => {

      const tag =
        event.target.closest(
          "[data-remove-preference]"
        );

      if (!tag) {

        return;
      }

      const type =
        tag.dataset
          .removePreference;

      const value =
        tag.dataset
          .removeValue;

      if (
        !userProfile.preferences[
          type
        ]
      ) {

        return;
      }

      userProfile.preferences[
        type
      ] =
        userProfile.preferences[
          type
        ].filter(
          item =>
            normalizeText(
              item
            ) !==
            normalizeText(
              value
            )
        );

      saveUserProfile();

      renderProfile();

      if (
        currentResults.length
      ) {

        renderProducts(
          currentResults,
          currentQuery,
          true
        );
      }

    }
  );
}

/*
=========================================================
OPEN PROFILE
=========================================================
*/

function openPersonalization() {

  createPersonalizationPanel();

  renderProfile();

  document
    .getElementById(
      "personalization-panel"
    )
    ?.classList.add(
      "active"
    );
}

/*
=========================================================
CLOSE PROFILE
=========================================================
*/

function closePersonalization() {

  document
    .getElementById(
      "personalization-panel"
    )
    ?.classList.remove(
      "active"
    );
}

/*
=========================================================
PERSONALIZATION TOAST
=========================================================
*/

function showPersonalizationToast(
  message
) {

  let toast =
    document.getElementById(
      "personalization-toast"
    );

  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "personalization-toast";

    document.body.appendChild(
      toast
    );
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    2200
  );
}

/*
=========================================================
INJECT PERSONALIZATION CSS
=========================================================
*/

function injectPersonalizationStyles() {

  if (
    document.getElementById(
      "day8-personalization-css"
    )
  ) {

    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "day8-personalization-css";

  style.textContent = `

    .personalization-overlay {

      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      opacity: 0;
      pointer-events: none;
      transition: .25s ease;
      z-index: 9998;

    }

    .personalization-drawer {

      position: fixed;
      top: 0;
      right: 0;
      width: min(420px, 92vw);
      height: 100vh;
      background: #fff;
      z-index: 9999;
      transform: translateX(100%);
      transition: .3s ease;
      overflow-y: auto;
      padding: 32px;
      box-sizing: border-box;
      box-shadow: -15px 0 40px rgba(0,0,0,.15);

    }

    #personalization-panel.active
    .personalization-overlay {

      opacity: 1;
      pointer-events: auto;

    }

    #personalization-panel.active
    .personalization-drawer {

      transform: translateX(0);

    }

    .personalization-close {

      position: absolute;
      right: 18px;
      top: 15px;
      border: 0;
      background: transparent;
      font-size: 30px;
      cursor: pointer;

    }

    .personalization-header {

      padding-right: 35px;
      margin-bottom: 28px;

    }

    .personalization-header span {

      font-size: 11px;
      letter-spacing: 2px;
      font-weight: 700;

    }

    .personalization-header h2 {

      margin: 8px 0;
      font-size: 28px;

    }

    .personalization-header p {

      color: #666;
      line-height: 1.6;

    }

    .personalization-section {

      margin-bottom: 24px;

    }

    .personalization-section h3 {

      font-size: 14px;
      margin-bottom: 10px;

    }

    .profile-tags {

      display: flex;
      flex-wrap: wrap;
      gap: 8px;

    }

    .profile-tag {

      border: 1px solid #ddd;
      background: #fafafa;
      border-radius: 20px;
      padding: 8px 12px;
      cursor: pointer;

    }

    .profile-tag span {

      margin-left: 5px;

    }

    .profile-empty {

      font-size: 13px;
      color: #999;

    }

    #profile-budget {

      width: 100%;
      box-sizing: border-box;
      border: 1px solid #ddd;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 10px;

    }

    .profile-save {

      border: 0;
      padding: 11px 16px;
      border-radius: 8px;
      cursor: pointer;

    }

    .personalization-stats {

      display: grid;
      grid-template-columns:
        repeat(3, 1fr);
      gap: 8px;
      margin: 25px 0;

    }

    .personalization-stats div {

      background: #f6f6f6;
      padding: 14px 8px;
      text-align: center;
      border-radius: 10px;

    }

    .personalization-stats strong {

      display: block;
      font-size: 20px;

    }

    .personalization-stats span {

      display: block;
      margin-top: 4px;
      font-size: 11px;
      color: #777;

    }

    .profile-reset {

      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 8px;
      cursor: pointer;

    }

    .personalization-like {

      margin-top: 12px;
      border: 1px solid #ddd;
      background: transparent;
      padding: 9px 12px;
      border-radius: 8px;
      cursor: pointer;

    }

    .personalization-reason {

      margin-top: 14px;

    }

    .personalization-reason p {

      margin: 7px 0 0;
      font-size: 13px;
      line-height: 1.5;

    }

    #personalization-toast {

      position: fixed;
      left: 50%;
      bottom: 25px;
      transform:
        translate(-50%, 20px);
      opacity: 0;
      background: #111;
      color: white;
      padding: 12px 18px;
      border-radius: 30px;
      z-index: 10000;
      transition: .25s ease;
      pointer-events: none;

    }

    #personalization-toast.show {

      opacity: 1;
      transform:
        translate(-50%, 0);

    }

  `;

  document.head.appendChild(
    style
  );
}

/*
=========================================================
CREATE PROFILE BUTTON
=========================================================
*/

function createProfileButton() {

  if (
    document.getElementById(
      "open-personalization"
    )
  ) {

    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.id =
    "open-personalization";

  button.type =
    "button";

  button.textContent =
    "✦ My Style Profile";

  button.style.cssText = `

    position: fixed;
    right: 22px;
    bottom: 22px;
    z-index: 5000;
    border: none;
    border-radius: 30px;
    padding: 13px 18px;
    cursor: pointer;
    background: #111;
    color: white;
    font-weight: 600;
    box-shadow: 0 8px 25px rgba(0,0,0,.2);

  `;

  button.addEventListener(
    "click",
    openPersonalization
  );

  document.body.appendChild(
    button
  );
}

/*
=========================================================
SEARCH HINTS
=========================================================
*/

function setupSearchEvents() {

  searchButton?.addEventListener(
    "click",
    runSearch
  );

  searchInput?.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        runSearch();
      }

    }
  );
}

/*
=========================================================
HEALTH CHECK
=========================================================
*/

async function checkBackend() {

  try {

    const data =
      await apiRequest(
        "/api/health"
      );

    console.log(
      "Fashion AI backend:",
      data
    );

    return true;

  } catch (error) {

    console.error(
      "Backend health check failed:",
      error
    );

    return false;
  }
}

/*
=========================================================
INITIALIZE
=========================================================
*/

async function initialize() {

  console.log(
    "Fashion AI Discovery Day 8 starting..."
  );

  setupSearchEvents();

  setupSearchHints();

  createPersonalizationPanel();

  createProfileButton();

  if (resultsContainer) {

    resultsContainer.innerHTML = `

      <div class="no-results">

        <div class="loading-spinner"></div>

        <h3>
          Loading Fashion AI...
        </h3>

        <p>
          Preparing personalized discovery.
        </p>

      </div>

    `;
  }

  const backendOnline =
    await checkBackend();

  if (!backendOnline) {

    showError(
      "Fashion AI backend is currently unavailable."
    );

    return;
  }

  try {

    await loadProducts();

    if (
      allProducts.length
    ) {

      renderProducts(
        allProducts.slice(
          0,
          12
        ),
        "",
        true
      );

      if (resultCount) {

        resultCount.textContent =
          "Personalized catalogue ready";
      }

      if (searchSummary) {

        searchSummary.textContent =
          `${allProducts.length} products available · personalization active`;
      }

    } else {

      showNoResults();
    }

    console.log(
      "Fashion AI Discovery Day 8 ready."
    );

  } catch (error) {

    console.error(
      "Initialization error:",
      error
    );

    showError(
      "Could not load the fashion catalogue."
    );
  }
}

/*
=========================================================
START
=========================================================
*/

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

} else {

  initialize();
}
