/*
=========================================================
FASHION AI DISCOVERY
DAY 5 - HYBRID RETRIEVAL FRONTEND
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

/*
=========================================================
ESCAPE
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
  const value = Number(price);

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
ARRAY
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
VISUAL
=========================================================
*/

function productVisual(product) {
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
  message = "AI is working..."
) {
  if (!resultsContainer) {
    return;
  }

  resultsContainer.innerHTML = `
    <div class="no-results">

      <div class="loading-spinner"></div>

      <h3>
        ${escapeHTML(message)}
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
        Fashion AI unavailable
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
  const score = Math.max(
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
      product.style ||
      product.styles
    );

  const occasions =
    safeArray(
      product.occasion ||
      product.occasions
    );

  const materials =
    safeArray(
      product.material ||
      product.materials
    );

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
                  <span>Colour</span>
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
                    .slice(0, 3)
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
              Hybrid relevance
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
    !products.length
  ) {
    showNoResults();
    return;
  }

  currentResults =
    products;

  resultsContainer.innerHTML =
    products
      .map(createProductCard)
      .join("");

  if (resultCount) {
    resultCount.textContent =
      `${products.length} AI matches`;
  }

  if (
    searchSummary &&
    query
  ) {
    searchSummary.textContent =
      `Hybrid AI results for "${query}"`;
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
  if (isSearching) {
    return;
  }

  const query =
    searchInput
      ? searchInput.value.trim()
      : "";

  if (!query) {
    if (allProducts.length) {
      renderProducts(
        allProducts.slice(0, 6)
      );
    }

    return;
  }

  isSearching = true;

  if (searchButton) {
    searchButton.disabled =
      true;
  }

  currentQuery =
    query;

  showLoading(
    "Finding the best fashion matches..."
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

    if (
      data.budget &&
      searchSummary
    ) {
      searchSummary.textContent =
        `Hybrid AI results for "${query}" · budget: ₹${formatPrice(
          data.budget
        )}`;
    }

    document
      .getElementById(
        "results-section"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  } catch (error) {
    console.error(
      "AI Search Error:",
      error
    );

    showError(
      error.name ===
        "AbortError"
        ? "Request timed out. Please try again."
        : error.message
    );
  } finally {
    isSearching = false;

    if (searchButton) {
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
              occasion: "",
              style: "",
              comfort: "",
              color: "",
              coverage: "",
              description: ""
            })
        }
      );

    const results =
      Array.isArray(
        data.results
      )
        ? data.results
        : [];

    if (results.length) {
      renderProducts(
        results,
        "personalized fashion"
      );
    }
  } catch (error) {
    /*
    Recommendation failure should NOT
    break the complete website.
    */
    console.warn(
      "Personalization unavailable:",
      error.message
    );
  }
}

/*
=========================================================
AI STYLIST
=========================================================
*/

async function runAIStylist() {
  const value =
    (id) =>
      $(id)?.value?.trim() || "";

  const occasion =
    value("stylistOccasion");

  const style =
    value("stylistStyle");

  const comfort =
    value("stylistComfort");

  const color =
    value("stylistColor");

  const coverage =
    value("stylistCoverage");

  const description =
    value(
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
      "Please describe your desired look."
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
    "Building your personalised recommendations..."
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

    renderProducts(
      recommendations,
      data.query ||
        description
    );
  } catch (error) {
    console.error(
      "AI Stylist error:",
      error
    );

    showError(
      error.message ||
      "AI Stylist failed."
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
                button.textContent.trim();
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
HEALTH
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
    "Fashion AI Discovery Day 5 starting..."
  );

  setupEvents();

  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="no-results">

        <div class="loading-spinner"></div>

        <h3>
          Connecting to Fashion AI...
        </h3>

        <p>
          Loading the fashion catalogue.
        </p>

      </div>
    `;
  }

  const backendOnline =
    await checkBackend();

  if (!backendOnline) {
    showError(
      "Fashion AI backend is unavailable."
    );

    return;
  }

  try {
    await loadProducts();

    if (allProducts.length) {
      renderProducts(
        allProducts.slice(0, 6)
      );

      if (resultCount) {
        resultCount.textContent =
          "AI catalogue ready";
      }

      if (searchSummary) {
        searchSummary.textContent =
          `${allProducts.length} products available for AI discovery.`;
      }
    } else {
      showNoResults();
    }

    /*
    This endpoint now exists in Day 5 backend.
    If it fails, the catalogue still works.
    */
    await loadPersonalizedRecommendations();

    console.log(
      "Fashion AI Discovery Day 5 ready."
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
