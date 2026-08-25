/*
=========================================================
FASHION AI DISCOVERY
DAY 4 FRONTEND
PERSONALIZATION + AI STYLIST
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
DOM
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

let userProfile = {
  gender: "",

  preferredColors: [],

  preferredStyles: [],

  preferredCategories: [],

  preferredOccasions: [],

  preferredMaterials: [],

  dislikedColors: [],

  dislikedStyles: [],

  budget: null,

  likedProductIds: [],

  dislikedProductIds: []
};

/*
=========================================================
ESCAPE
=========================================================
*/

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

/*
=========================================================
ARRAY
=========================================================
*/

function safeArray(value) {

  if (
    Array.isArray(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return [
      value
    ];
  }

  return [];
}

/*
=========================================================
PRICE
=========================================================
*/

function formatPrice(
  price
) {

  const value =
    Number(price);

  if (
    !Number.isFinite(value)
  ) {
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
PRODUCT VISUAL
=========================================================
*/

function productVisual(
  product
) {

  return `
    <div class="product-visual">

      <div class="visual-grid"></div>

      <div class="visual-content">

        <span class="visual-label">
          FASHION AI
        </span>

        <strong>
          ${escapeHTML(
            product.category ||
            "Fashion"
          )}
        </strong>

        <small>
          ${escapeHTML(
            product.name ||
            "Fashion Product"
          )}
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

function showLoading(
  message
) {

  if (
    !resultsContainer
  ) {
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
        Fashion AI is analysing your preferences.
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

  if (
    !resultsContainer
  ) {
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
          "Something went wrong."
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

  if (
    !resultsContainer
  ) {
    return;
  }

  resultsContainer.innerHTML = `
    <div class="no-results">

      <h3>
        No strong matches found.
      </h3>

      <p>
        Try changing your style, colour,
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
    Number(product.id);

  const liked =
    userProfile.likedProductIds
      .includes(productId);

  const disliked =
    userProfile.dislikedProductIds
      .includes(productId);

  return `
    <article class="product-card">

      <div class="product-image-wrap">

        ${productVisual(
          product
        )}

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
            product.color
              ? `
                <div class="product-meta-item">

                  <span>
                    Colour
                  </span>

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

                  <span>
                    Material
                  </span>

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

                  <span>
                    Style
                  </span>

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

                  <span>
                    Occasion
                  </span>

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
                  Why AI recommended this
                </strong>

                <ul>

                  ${reasons
                    .slice(0, 3)
                    .map(
                      (reason) =>
                        `
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
              AI relevance
            </span>

            <strong>
              ${Math.round(score)}%
            </strong>

          </div>

          <div class="match-score-bar">

            <div
              class="match-score-fill"
              style="width:${Math.round(
                score
              )}%"
            ></div>

          </div>

        </div>

        <div class="product-feedback">

          <button
            type="button"
            class="feedback-btn ${
              liked
                ? "active"
                : ""
            }"
            onclick="likeProduct(${productId})"
          >
            ♥ Like
          </button>

          <button
            type="button"
            class="feedback-btn ${
              disliked
                ? "active"
                : ""
            }"
            onclick="dislikeProduct(${productId})"
          >
            ✕ Not for me
          </button>

        </div>

      </div>

    </article>
  `;
}

/*
=========================================================
RENDER
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

  resultsContainer.innerHTML =
    products
      .map(
        createProductCard
      )
      .join("");

  if (resultCount) {

    resultCount.textContent =
      `${products.length} AI matches`;
  }

  if (
    searchSummary
  ) {

    searchSummary.textContent =
      query
        ? `AI recommendations for "${query}"`
        : "Personalised fashion recommendations";
  }
}

/*
=========================================================
API
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

    if (
      !response.ok
    ) {

      throw new Error(
        data.error ||
        `Request failed (${response.status})`
      );
    }

    return data;

  } finally {

    clearTimeout(
      timeout
    );
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
RUN SEARCH
=========================================================
*/

async function runSearch() {

  if (
    isSearching
  ) {
    return;
  }

  const query =
    searchInput
      ? searchInput.value.trim()
      : "";

  if (!query) {

    await loadPersonalizedRecommendations();

    return;
  }

  isSearching =
    true;

  if (
    searchButton
  ) {
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

    renderProducts(
      results,
      query
    );

  } catch (error) {

    console.error(
      "Search error:",
      error
    );

    showError(
      error.message
    );

  } finally {

    isSearching =
      false;

    if (
      searchButton
    ) {
      searchButton.disabled =
        false;
    }
  }
}

/*
=========================================================
PERSONALIZED RECOMMENDATIONS
=========================================================
*/

async function loadPersonalizedRecommendations() {

  showLoading(
    "Creating your personalised fashion feed..."
  );

  try {

    const data =
      await apiRequest(
        "/api/recommendations",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              profile:
                userProfile,

              limit: 12
            })
        }
      );

    const results =
      Array.isArray(
        data.results
      )
        ? data.results
        : [];

    renderProducts(
      results
    );

    if (
      searchSummary
    ) {

      searchSummary.textContent =
        "Personalised recommendations based on your fashion profile.";
    }

  } catch (error) {

    console.error(
      "Personalization error:",
      error
    );

    showError(
      error.message
    );
  }
}

/*
=========================================================
LIKE
=========================================================
*/

function likeProduct(
  productId
) {

  const id =
    Number(productId);

  if (
    !userProfile
      .likedProductIds
      .includes(id)
  ) {

    userProfile
      .likedProductIds
      .push(id);
  }

  userProfile
    .dislikedProductIds =
      userProfile
        .dislikedProductIds
        .filter(
          (item) =>
            item !== id
        );

  saveProfile();

  loadPersonalizedRecommendations();
}

/*
=========================================================
DISLIKE
=========================================================
*/

function dislikeProduct(
  productId
) {

  const id =
    Number(productId);

  if (
    !userProfile
      .dislikedProductIds
      .includes(id)
  ) {

    userProfile
      .dislikedProductIds
      .push(id);
  }

  userProfile
    .likedProductIds =
      userProfile
        .likedProductIds
        .filter(
          (item) =>
            item !== id
        );

  saveProfile();

  loadPersonalizedRecommendations();
}

/*
=========================================================
PROFILE STORAGE
=========================================================
*/

function saveProfile() {

  try {

    localStorage.setItem(
      "fashionAIProfile",
      JSON.stringify(
        userProfile
      )
    );

  } catch (error) {

    console.warn(
      "Could not save profile:",
      error
    );
  }
}

function loadProfile() {

  try {

    const saved =
      localStorage.getItem(
        "fashionAIProfile"
      );

    if (!saved) {
      return;
    }

    const parsed =
      JSON.parse(
        saved
      );

    if (
      parsed &&
      typeof parsed ===
        "object"
    ) {

      userProfile = {
        ...userProfile,
        ...parsed
      };
    }

  } catch (error) {

    console.warn(
      "Could not load profile:",
      error
    );
  }
}

/*
=========================================================
STYLIST
=========================================================
*/

async function runAIStylist() {

  const getValue =
    (id) =>
      $(id)?.value?.trim() ||
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

  const budget =
    getValue(
      "stylistBudget"
    );

  const hasInput =
    [
      occasion,
      style,
      comfort,
      color,
      coverage,
      description,
      budget
    ].some(Boolean);

  if (!hasInput) {

    alert(
      "Please describe the look you want."
    );

    return;
  }

  if (
    stylistButton
  ) {

    stylistButton.disabled =
      true;

    stylistButton.textContent =
      "AI is styling...";
  }

  showLoading(
    "Building your personalised look..."
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
              description,
              budget
            })
        }
      );

    const recommendations =
      Array.isArray(
        data.recommendations
      )
        ? data.recommendations
        : [];

    renderProducts(
      recommendations,
      data.query ||
        description
    );

    if (
      searchSummary
    ) {

      searchSummary.textContent =
        "AI Stylist created a personalised fashion selection for you.";
    }

  } catch (error) {

    console.error(
      "AI Stylist error:",
      error
    );

    showError(
      error.message
    );

  } finally {

    if (
      stylistButton
    ) {

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

            if (
              searchInput
            ) {

              searchInput.value =
                button
                  .textContent
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
}

/*
=========================================================
BACKEND CHECK
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
      "Backend unavailable:",
      error
    );

    return false;
  }
}

/*
=========================================================
INIT
=========================================================
*/

async function initialize() {

  console.log(
    "Fashion AI Discovery Day 4 starting..."
  );

  loadProfile();

  setupEvents();

  const backendOnline =
    await checkBackend();

  if (
    !backendOnline
  ) {

    showError(
      "Fashion AI backend is unavailable."
    );

    return;
  }

  try {

    await loadProducts();

    await loadPersonalizedRecommendations();

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
