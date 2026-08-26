/*
=========================================================
FASHION AI DISCOVERY
DAY 6 - PERSONALIZATION & USER PREFERENCES
=========================================================
*/

"use strict";

/*
=========================================================
API
=========================================================
*/

const API_BASE_URL =
  "https://fashion-ai-search-lj6s.onrender.com";

/*
=========================================================
DOM HELPERS
=========================================================
*/

const $ = (id) =>
  document.getElementById(id);

/*
=========================================================
DOM ELEMENTS
=========================================================
*/

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

let isSavingPreferences = false;

/*
=========================================================
STORAGE
=========================================================
*/

const PREFERENCES_STORAGE_KEY =
  "fashion_ai_user_preferences_v1";

/*
=========================================================
DEFAULT USER PROFILE
=========================================================
*/

const DEFAULT_PREFERENCES = {

  gender: "",

  categories: [],

  colors: [],

  styles: [],

  occasions: [],

  materials: [],

  minPrice: 0,

  maxPrice: 10000,

  budget: 10000

};

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
    return [value];
  }

  return [];
}

/*
=========================================================
PRICE FORMATTER
=========================================================
*/

function formatPrice(price) {

  const value =
    Number(price);

  if (!Number.isFinite(value)) {
    return escapeHTML(price || "");
  }

  return value.toLocaleString("en-IN");
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
LOADING
=========================================================
*/

function showLoading(message) {

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

function showError(message) {

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

function createProductCard(product) {

  const score =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          product.personalizedScore ??
          product.matchScore ??
          product.score ??
          0
        )
      )
    );

  const reasons =
    safeArray(
      product.personalizationReasons ||
      product.reasons
    );

  const styles =
    safeArray(product.style);

  const occasions =
    safeArray(product.occasion);

  const materials =
    safeArray(product.material);

  return `
    <article class="product-card">

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
          ₹${formatPrice(product.price)}
        </div>

        <div class="product-meta">

          ${
            product.color
              ? `
                <div class="product-meta-item">
                  <span>Colour</span>
                  <strong>
                    ${escapeHTML(
                      product.color
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
                  <span>Material</span>
                  <strong>
                    ${escapeHTML(
                      materials
                        .slice(0, 2)
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
                  <span>Style</span>
                  <strong>
                    ${escapeHTML(
                      styles
                        .slice(0, 2)
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
                  <span>Occasion</span>
                  <strong>
                    ${escapeHTML(
                      occasions
                        .slice(0, 2)
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
                    .slice(0, 4)
                    .map(
                      (reason) => `
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

        <div class="match-score">

          <div class="match-score-header">

            <span>
              Personalised relevance
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
  query = ""
) {

  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {

    showNoResults();

    return;
  }

  currentResults =
    products;

  if (resultsContainer) {

    resultsContainer.innerHTML =
      products
        .map(createProductCard)
        .join("");
  }

  if (resultCount) {

    resultCount.textContent =
      `${products.length} AI matches`;
  }

  if (
    searchSummary &&
    query
  ) {

    searchSummary.textContent =
      `AI-ranked results for "${query}"`;
  }
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
      () => controller.abort(),
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
SEARCH
=========================================================
*/

async function searchFashion(
  query
) {

  return apiRequest(
    "/api/search",
    {

      method: "POST",

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
PREFERENCES
=========================================================
*/

function normalizePreferences(
  preferences
) {

  const source =
    preferences || {};

  return {

    gender:
      String(
        source.gender || ""
      ),

    categories:
      safeArray(
        source.categories
      ),

    colors:
      safeArray(
        source.colors
      ),

    styles:
      safeArray(
        source.styles
      ),

    occasions:
      safeArray(
        source.occasions
      ),

    materials:
      safeArray(
        source.materials
      ),

    minPrice:
      Math.max(
        0,
        Number(
          source.minPrice ??
          0
        )
      ),

    maxPrice:
      Math.max(
        0,
        Number(
          source.maxPrice ??
          10000
        )
      ),

    budget:
      Math.max(
        0,
        Number(
          source.budget ??
          10000
        )
      )
  };
}

/*
=========================================================
LOAD SAVED PREFERENCES
=========================================================
*/

function loadPreferences() {

  try {

    const saved =
      localStorage.getItem(
        PREFERENCES_STORAGE_KEY
      );

    if (!saved) {

      return {
        ...DEFAULT_PREFERENCES
      };
    }

    return normalizePreferences(
      JSON.parse(saved)
    );

  } catch (error) {

    console.warn(
      "Could not load preferences:",
      error
    );

    return {
      ...DEFAULT_PREFERENCES
    };
  }
}

/*
=========================================================
SAVE PREFERENCES
=========================================================
*/

function savePreferences(
  preferences
) {

  const normalized =
    normalizePreferences(
      preferences
    );

  try {

    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(
        normalized
      )
    );

    return true;

  } catch (error) {

    console.error(
      "Preference storage error:",
      error
    );

    return false;
  }
}

/*
=========================================================
GET PREFERENCE INPUT
=========================================================
*/

function getPreferenceValue(
  id
) {

  return (
    $(id)?.value?.trim() ||
    ""
  );
}

/*
=========================================================
GET CHECKED VALUES
=========================================================
*/

function getCheckedValues(
  selector
) {

  return [
    ...document.querySelectorAll(
      selector
    )
  ]
    .filter(
      (element) =>
        element.checked
    )
    .map(
      (element) =>
        element.value.trim()
    )
    .filter(Boolean);
}

/*
=========================================================
COLLECT USER PREFERENCES
=========================================================
*/

function collectPreferences() {

  const preferences = {

    gender:
      getPreferenceValue(
        "preferenceGender"
      ),

    categories:
      getCheckedValues(
        'input[name="preferenceCategory"]'
      ),

    colors:
      getCheckedValues(
        'input[name="preferenceColor"]'
      ),

    styles:
      getCheckedValues(
        'input[name="preferenceStyle"]'
      ),

    occasions:
      getCheckedValues(
        'input[name="preferenceOccasion"]'
      ),

    materials:
      getCheckedValues(
        'input[name="preferenceMaterial"]'
      ),

    minPrice:
      Number(
        getPreferenceValue(
          "preferenceMinPrice"
        ) || 0
      ),

    maxPrice:
      Number(
        getPreferenceValue(
          "preferenceMaxPrice"
        ) || 10000
      ),

    budget:
      Number(
        getPreferenceValue(
          "preferenceBudget"
        ) || 10000
      )
  };

  return normalizePreferences(
    preferences
  );
}

/*
=========================================================
APPLY SAVED PREFERENCES TO UI
=========================================================
*/

function applyPreferencesToUI(
  preferences
) {

  const normalized =
    normalizePreferences(
      preferences
    );

  const gender =
    $("preferenceGender");

  if (gender) {

    gender.value =
      normalized.gender;
  }

  const minPrice =
    $("preferenceMinPrice");

  if (minPrice) {

    minPrice.value =
      normalized.minPrice;
  }

  const maxPrice =
    $("preferenceMaxPrice");

  if (maxPrice) {

    maxPrice.value =
      normalized.maxPrice;
  }

  const budget =
    $("preferenceBudget");

  if (budget) {

    budget.value =
      normalized.budget;
  }

  document
    .querySelectorAll(
      'input[name="preferenceCategory"]'
    )
    .forEach(
      (input) => {

        input.checked =
          normalized.categories
            .includes(
              input.value
            );
      }
    );

  document
    .querySelectorAll(
      'input[name="preferenceColor"]'
    )
    .forEach(
      (input) => {

        input.checked =
          normalized.colors
            .includes(
              input.value
            );
      }
    );

  document
    .querySelectorAll(
      'input[name="preferenceStyle"]'
    )
    .forEach(
      (input) => {

        input.checked =
          normalized.styles
            .includes(
              input.value
            );
      }
    );

  document
    .querySelectorAll(
      'input[name="preferenceOccasion"]'
    )
    .forEach(
      (input) => {

        input.checked =
          normalized.occasions
            .includes(
              input.value
            );
      }
    );

  document
    .querySelectorAll(
      'input[name="preferenceMaterial"]'
    )
    .forEach(
      (input) => {

        input.checked =
          normalized.materials
            .includes(
              input.value
            );
      }
    );
}

/*
=========================================================
PERSONALIZATION SCORE
=========================================================
*/

function calculatePersonalizationScore(
  product,
  preferences
) {

  const p =
    normalizePreferences(
      preferences
    );

  let score = 0;

  let totalWeight = 0;

  const reasons = [];

  /*
  -----------------------------------------------
  CATEGORY
  -----------------------------------------------
  */

  if (p.categories.length) {

    totalWeight += 20;

    if (
      p.categories
        .some(
          (value) =>
            String(
              product.category || ""
            ).toLowerCase() ===
            value.toLowerCase()
        )
    ) {

      score += 20;

      reasons.push(
        "Matches your preferred category"
      );
    }
  }

  /*
  -----------------------------------------------
  COLOR
  -----------------------------------------------
  */

  if (p.colors.length) {

    totalWeight += 15;

    if (
      p.colors
        .some(
          (value) =>
            String(
              product.color || ""
            ).toLowerCase() ===
            value.toLowerCase()
        )
    ) {

      score += 15;

      reasons.push(
        "Matches your preferred colour"
      );
    }
  }

  /*
  -----------------------------------------------
  STYLE
  -----------------------------------------------
  */

  if (p.styles.length) {

    totalWeight += 20;

    const productStyles =
      safeArray(
        product.style
      )
        .map(
          (x) =>
            String(x).toLowerCase()
        );

    const styleMatches =
      p.styles.filter(
        (style) =>
          productStyles.includes(
            String(style).toLowerCase()
          )
      );

    if (styleMatches.length) {

      score +=
        Math.min(
          20,
          styleMatches.length * 10
        );

      reasons.push(
        `Matches preferred style: ${styleMatches.join(", ")}`
      );
    }
  }

  /*
  -----------------------------------------------
  OCCASION
  -----------------------------------------------
  */

  if (p.occasions.length) {

    totalWeight += 15;

    const productOccasions =
      safeArray(
        product.occasion
      )
        .map(
          (x) =>
            String(x).toLowerCase()
        );

    const matches =
      p.occasions.filter(
        (occasion) =>
          productOccasions.includes(
            String(
              occasion
            ).toLowerCase()
          )
      );

    if (matches.length) {

      score +=
        Math.min(
          15,
          matches.length * 7.5
        );

      reasons.push(
        "Suitable for your preferred occasion"
      );
    }
  }

  /*
  -----------------------------------------------
  MATERIAL
  -----------------------------------------------
  */

  if (p.materials.length) {

    totalWeight += 10;

    const productMaterials =
      safeArray(
        product.material
      )
        .map(
          (x) =>
            String(x).toLowerCase()
        );

    const matches =
      p.materials.filter(
        (material) =>
          productMaterials.includes(
            String(
              material
            ).toLowerCase()
          )
      );

    if (matches.length) {

      score += 10;

      reasons.push(
        "Matches your preferred material"
      );
    }
  }

  /*
  -----------------------------------------------
  GENDER
  -----------------------------------------------
  */

  if (p.gender) {

    totalWeight += 10;

    const productGender =
      String(
        product.gender || ""
      ).toLowerCase();

    const preferredGender =
      p.gender.toLowerCase();

    if (
      productGender ===
        preferredGender ||
      productGender ===
        "unisex"
    ) {

      score += 10;

      reasons.push(
        "Matches your profile preference"
      );
    }
  }

  /*
  -----------------------------------------------
  BUDGET
  -----------------------------------------------
  */

  if (
    Number.isFinite(
      Number(product.price)
    )
  ) {

    totalWeight += 10;

    const price =
      Number(
        product.price
      );

    const minPrice =
      Number(
        p.minPrice
      );

    const maxPrice =
      Number(
        p.maxPrice
      );

    const budget =
      Number(
        p.budget
      );

    if (
      price >= minPrice &&
      price <= maxPrice &&
      price <= budget
    ) {

      score += 10;

      reasons.push(
        "Fits your preferred budget"
      );

    } else if (
      price <= budget
    ) {

      score += 6;

      reasons.push(
        "Within your maximum budget"
      );
    }
  }

  /*
  -----------------------------------------------
  FINAL SCORE
  -----------------------------------------------
  */

  if (!totalWeight) {

    return {
      score: 0,
      reasons: []
    };
  }

  return {

    score:
      Math.round(
        (score /
          totalWeight) *
          100
      ),

    reasons:
      [...new Set(
        reasons
      )]
  };
}

/*
=========================================================
PERSONALIZE PRODUCTS
=========================================================
*/

function personalizeProducts(
  products,
  preferences
) {

  if (
    !Array.isArray(
      products
    )
  ) {

    return [];
  }

  const normalized =
    normalizePreferences(
      preferences
    );

  return products
    .map(
      (product) => {

        const result =
          calculatePersonalizationScore(
            product,
            normalized
          );

        return {

          ...product,

          personalizedScore:
            result.score,

          personalizationReasons:
            result.reasons
        };
      }
    )
    .sort(
      (a, b) => {

        const scoreDifference =
          Number(
            b.personalizedScore
          ) -
          Number(
            a.personalizedScore
          );

        if (
          scoreDifference !== 0
        ) {

          return scoreDifference;
        }

        return (
          Number(
            a.price || 0
          ) -
          Number(
            b.price || 0
          )
        );
      }
    );
}

/*
=========================================================
PERSONALIZED HOME FEED
=========================================================
*/

function renderPersonalizedFeed() {

  if (!allProducts.length) {
    return;
  }

  const preferences =
    loadPreferences();

  const hasPreferences =
    preferences.gender ||
    preferences.categories.length ||
    preferences.colors.length ||
    preferences.styles.length ||
    preferences.occasions.length ||
    preferences.materials.length ||
    preferences.budget <
      10000 ||
    preferences.minPrice > 0;

  if (!hasPreferences) {

    renderProducts(
      allProducts.slice(0, 6)
    );

    if (searchSummary) {

      searchSummary.textContent =
        `${allProducts.length} products available. Set your preferences for personalised recommendations.`;
    }

    return;
  }

  const personalized =
    personalizeProducts(
      allProducts,
      preferences
    );

  renderProducts(
    personalized.slice(0, 8)
  );

  if (searchSummary) {

    searchSummary.textContent =
      "Personalised recommendations based on your preferences.";
  }

  if (resultCount) {

    resultCount.textContent =
      "Personalised feed";
  }
}

/*
=========================================================
SAVE USER PREFERENCES
=========================================================
*/

function saveUserPreferences() {

  if (isSavingPreferences) {
    return;
  }

  isSavingPreferences =
    true;

  try {

    const preferences =
      collectPreferences();

    const saved =
      savePreferences(
        preferences
      );

    if (!saved) {

      alert(
        "Could not save preferences on this device."
      );

      return;
    }

    applyPreferencesToUI(
      preferences
    );

    alert(
      "Your fashion preferences have been saved."
    );

    renderPersonalizedFeed();

  } finally {

    isSavingPreferences =
      false;
  }
}

/*
=========================================================
RESET USER PREFERENCES
=========================================================
*/

function resetUserPreferences() {

  try {

    localStorage.removeItem(
      PREFERENCES_STORAGE_KEY
    );

  } catch (error) {

    console.warn(
      "Could not clear preferences:",
      error
    );
  }

  applyPreferencesToUI(
    DEFAULT_PREFERENCES
  );

  renderPersonalizedFeed();

  alert(
    "Your fashion preferences have been reset."
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

    renderPersonalizedFeed();

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

    /*
    AI search result + user preference
    personalization reranking
    */

    const preferences =
      loadPreferences();

    const personalized =
      personalizeProducts(
        results,
        preferences
      );

    /*
    If no preferences exist,
    preserve original AI ranking.
    */

    const hasPreferences =
      preferences.gender ||
      preferences.categories.length ||
      preferences.colors.length ||
      preferences.styles.length ||
      preferences.occasions.length ||
      preferences.materials.length ||
      preferences.budget <
        10000 ||
      preferences.minPrice > 0;

    const finalResults =
      hasPreferences
        ? personalized
        : results;

    renderProducts(
      finalResults,
      query
    );

    if (
      data.budget &&
      searchSummary
    ) {

      searchSummary.textContent =
        `AI-ranked results for "${query}" · budget detected: ₹${formatPrice(data.budget)}`;
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
    (id) =>
      $(id)?.value?.trim() || "";

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

          method: "POST",

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

    if (!recommendations.length) {

      showNoResults();

      return;
    }

    const preferences =
      loadPreferences();

    const personalized =
      personalizeProducts(
        recommendations,
        preferences
      );

    renderProducts(
      personalized,
      data.query ||
      description
    );

    if (searchSummary) {

      searchSummary.textContent =
        "AI Stylist recommendations personalised to your profile.";
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
      (button) => {

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
PREFERENCE EVENTS
=========================================================
*/

function setupPreferenceEvents() {

  const saveButton =
    $("savePreferences");

  const resetButton =
    $("resetPreferences");

  saveButton?.addEventListener(
    "click",
    saveUserPreferences
  );

  resetButton?.addEventListener(
    "click",
    resetUserPreferences
  );

  /*
  Auto-save when user changes
  preferences.
  */

  document
    .querySelectorAll(
      ".preference-input"
    )
    .forEach(
      (input) => {

        input.addEventListener(
          "change",
          () => {

            const preferences =
              collectPreferences();

            savePreferences(
              preferences
            );

          }
        );
      }
    );
}

/*
=========================================================
EVENTS
=========================================================
*/

function setupEvents() {

  searchButton?.addEventListener(
    "click",
    runSearch
  );

  searchInput?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        runSearch();
      }
    }
  );

  stylistButton?.addEventListener(
    "click",
    runAIStylist
  );

  setupSearchHints();

  setupPreferenceEvents();
}

/*
=========================================================
BACKEND HEALTH
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
    "Fashion AI Discovery Day 6 starting..."
  );

  if (resultsContainer) {

    resultsContainer.innerHTML = `
      <div class="no-results">

        <div class="loading-spinner"></div>

        <h3>
          Connecting to Fashion AI...
        </h3>

        <p>
          Loading your personalised fashion experience.
        </p>

      </div>
    `;
  }

  /*
  Load saved profile first.
  */

  const preferences =
    loadPreferences();

  applyPreferencesToUI(
    preferences
  );

  setupEvents();

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

    if (allProducts.length) {

      renderPersonalizedFeed();

      console.log(
        "Fashion AI Discovery Day 6 ready."
      );

    } else {

      showNoResults();
    }

  } catch (error) {

    console.error(
      "Catalogue loading error:",
      error
    );

    showError(
      "Could not load the fashion catalogue."
    );
  }
}

/*
=========================================================
START APPLICATION
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
