```javascript
/*
=========================================================
FASHION AI DISCOVERY
DAY 9 - PRODUCTION FRONTEND
=========================================================
*/

const API_BASE_URL =
  "https://fashion-ai-search-lj6s.onrender.com";

/*
=========================================================
DOM
=========================================================
*/

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");

const resultsContainer =
  document.getElementById("results");

const resultCount =
  document.getElementById("resultCount");

const searchSummary =
  document.getElementById("searchSummary");

const stylistButton =
  document.getElementById("stylistButton");

const healthStatus =
  document.getElementById("healthStatus");

const healthText =
  document.getElementById("healthText");

const categoryFilter =
  document.getElementById("categoryFilter");

const sortFilter =
  document.getElementById("sortFilter");

const clearFiltersButton =
  document.getElementById("clearFilters");

const retryButton =
  document.getElementById("retryButton");

/*
=========================================================
STATE
=========================================================
*/

let allProducts = [];

let currentProducts = [];

let currentQuery = "";

let isSearching = false;

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
  const number = Number(price);

  if (!Number.isFinite(number)) {
    return escapeHTML(price || "");
  }

  return number.toLocaleString("en-IN");
}

/*
=========================================================
PRODUCT VISUAL
=========================================================
*/

function productVisual(product) {
  const category =
    String(product.category || "Fashion");

  const name =
    String(product.name || "Fashion Product");

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

function showLoading(message = "AI is searching...") {
  resultsContainer.innerHTML = `
    <div class="state-card">

      <div class="loading-spinner"></div>

      <h3>
        ${escapeHTML(message)}
      </h3>

      <p>
        AI is analysing your request and ranking
        the most relevant fashion products.
      </p>

    </div>
  `;

  resultCount.textContent = "Working...";
}

/*
=========================================================
ERROR
=========================================================
*/

function showError(message) {
  resultsContainer.innerHTML = `
    <div class="state-card error-state">

      <div class="state-icon">
        !
      </div>

      <h3>
        Something went wrong
      </h3>

      <p>
        ${escapeHTML(
          message ||
          "The fashion AI service could not complete this request."
        )}
      </p>

      <button
        class="secondary-button"
        id="internalRetryButton"
        type="button"
      >
        Try Again
      </button>

    </div>
  `;

  resultCount.textContent = "Error";

  document
    .getElementById("internalRetryButton")
    ?.addEventListener(
      "click",
      () => {
        if (currentQuery) {
          runSearch();
        } else {
          loadProducts();
        }
      }
    );
}

/*
=========================================================
NO RESULTS
=========================================================
*/

function showNoResults() {
  resultsContainer.innerHTML = `
    <div class="state-card">

      <div class="state-icon">
        ?
      </div>

      <h3>
        No strong matches found
      </h3>

      <p>
        Try another colour, occasion, style,
        category or budget.
      </p>

    </div>
  `;

  resultCount.textContent = "0 matches";
}

/*
=========================================================
PRODUCT CARD
=========================================================
*/

function createProductCard(product) {
  const matchScore = Math.max(
    0,
    Math.min(
      100,
      Number(product.matchScore) || 0
    )
  );

  const reasons =
    Array.isArray(product.reasons)
      ? product.reasons
      : [];

  const occasions =
    Array.isArray(product.occasion)
      ? product.occasion
      : [];

  const styles =
    Array.isArray(product.style)
      ? product.style
      : [];

  const materials =
    Array.isArray(product.material)
      ? product.material
      : [];

  const tags =
    Array.isArray(product.tags)
      ? product.tags
      : [];

  return `
    <article class="product-card">

      <div class="product-image-wrap">

        ${productVisual(product)}

        <div class="ai-match-badge">
          ${matchScore}% AI MATCH
        </div>

      </div>

      <div class="product-content">

        <div class="product-top">

          <span class="product-brand">
            ${escapeHTML(
              product.brand || "FASHION"
            )}
          </span>

          <span class="product-category">
            ${escapeHTML(
              product.category || "Fashion"
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
            product.description || ""
          )}
        </p>

        <div class="product-price">
          ₹${formatPrice(product.price)}
          <span>
            ${escapeHTML(
              product.currency || "INR"
            )}
          </span>
        </div>

        <div class="product-meta">

          ${
            product.color
              ? `
                <div class="product-meta-item">
                  <span>Colour</span>
                  <strong>
                    ${escapeHTML(product.color)}
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
                      materials.join(", ")
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

        </div>

        ${
          tags.length
            ? `
              <div class="tag-list">

                ${tags
                  .slice(0, 4)
                  .map(
                    tag => `
                      <span class="tag">
                        ${escapeHTML(tag)}
                      </span>
                    `
                  )
                  .join("")}

              </div>
            `
            : ""
        }

        ${
          occasions.length
            ? `
              <div class="occasion-row">
                ${escapeHTML(
                  occasions
                    .slice(0, 3)
                    .join(" · ")
                )}
              </div>
            `
            : ""
        }

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
                      reason => `
                        <li>
                          ${escapeHTML(reason)}
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
              ${matchScore}%
            </strong>

          </div>

          <div class="match-score-bar">

            <div
              class="match-score-fill"
              style="width:${matchScore}%"
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

function renderProducts(products, query = "") {
  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {
    showNoResults();
    return;
  }

  currentProducts = products;

  resultsContainer.innerHTML =
    products
      .map(createProductCard)
      .join("");

  resultCount.textContent =
    `${products.length} AI matches`;

  if (query) {
    searchSummary.textContent =
      `AI-ranked results for "${query}"`;
  }
}

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

async function loadProducts() {
  showLoading(
    "Loading the fashion catalogue..."
  );

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/products`,
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        `Product API returned ${response.status}`
      );
    }

    const data =
      await response.json();

    allProducts =
      Array.isArray(data.products)
        ? data.products
        : [];

    currentProducts =
      [...allProducts];

    populateCategoryFilter();

    if (allProducts.length) {
      renderProducts(
        allProducts.slice(0, 6)
      );

      resultCount.textContent =
        "AI catalogue ready";

      searchSummary.textContent =
        `${allProducts.length} products available for AI discovery.`;
    } else {
      showNoResults();
    }

  } catch (error) {
    console.error(
      "Product loading error:",
      error
    );

    showError(
      "Could not connect to the fashion catalogue."
    );
  }
}

/*
=========================================================
HEALTH CHECK
=========================================================
*/

async function checkAPIHealth() {
  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/health`,
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          }
        }
      );

    if (!response.ok) {
      throw new Error("API unavailable");
    }

    const data =
      await response.json();

    if (healthStatus) {
      healthStatus.className =
        "status-dot online";
    }

    if (healthText) {
      healthText.textContent =
        data.ai?.enabled
          ? "AI Engine Online"
          : "API Online";
    }

  } catch (error) {
    console.error(
      "Health check failed:",
      error
    );

    if (healthStatus) {
      healthStatus.className =
        "status-dot offline";
    }

    if (healthText) {
      healthText.textContent =
        "AI temporarily unavailable";
    }
  }
}

/*
=========================================================
CATEGORY FILTER
=========================================================
*/

function populateCategoryFilter() {
  if (!categoryFilter) {
    return;
  }

  const categories =
    [
      ...new Set(
        allProducts
          .map(
            product =>
              product.category
          )
          .filter(Boolean)
      )
    ]
      .sort();

  categoryFilter.innerHTML = `
    <option value="all">
      All categories
    </option>

    ${categories
      .map(
        category => `
          <option value="${escapeHTML(
            category
          )}">
            ${escapeHTML(category)}
          </option>
        `
      )
      .join("")}
  `;
}

/*
=========================================================
FILTER + SORT
=========================================================
*/

function applyFilters() {
  let products =
    [...currentProducts];

  const category =
    categoryFilter?.value || "all";

  const sort =
    sortFilter?.value || "relevance";

  if (category !== "all") {
    products =
      products.filter(
        product =>
          String(
            product.category
          ).toLowerCase() ===
          category.toLowerCase()
      );
  }

  if (sort === "price-low") {
    products.sort(
      (a, b) =>
        Number(a.price || 0) -
        Number(b.price || 0)
    );
  }

  if (sort === "price-high") {
    products.sort(
      (a, b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );
  }

  if (sort === "name") {
    products.sort(
      (a, b) =>
        String(a.name || "")
          .localeCompare(
            String(b.name || "")
          )
    );
  }

  if (sort === "relevance") {
    products.sort(
      (a, b) =>
        Number(b.matchScore || 0) -
        Number(a.matchScore || 0)
    );
  }

  if (!products.length) {
    showNoResults();
    return;
  }

  resultsContainer.innerHTML =
    products
      .map(createProductCard)
      .join("");

  resultCount.textContent =
    `${products.length} matches`;
}

/*
=========================================================
CLEAR FILTERS
=========================================================
*/

function clearFilters() {
  if (categoryFilter) {
    categoryFilter.value = "all";
  }

  if (sortFilter) {
    sortFilter.value = "relevance";
  }

  if (currentProducts.length) {
    renderProducts(
      currentProducts,
      currentQuery
    );
  }
}

/*
=========================================================
AI SEARCH
=========================================================
*/

async function searchFashion(query) {
  const response =
    await fetch(
      `${API_BASE_URL}/api/search`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        body:
          JSON.stringify({
            query
          })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      "AI search failed."
    );
  }

  return data;
}

/*
=========================================================
RUN SEARCH
=========================================================
*/

async function runSearch() {
  const query =
    searchInput?.value.trim() || "";

  if (!query) {
    currentQuery = "";

    if (allProducts.length) {
      currentProducts =
        [...allProducts];

      renderProducts(
        allProducts.slice(0, 6)
      );

      searchSummary.textContent =
        `${allProducts.length} products available for AI discovery.`;
    }

    return;
  }

  if (isSearching) {
    return;
  }

  isSearching = true;

  currentQuery = query;

  if (searchButton) {
    searchButton.disabled = true;
    searchButton.textContent =
      "Searching...";
  }

  showLoading(
    "Understanding your fashion request..."
  );

  try {
    const data =
      await searchFashion(query);

    const results =
      Array.isArray(data.results)
        ? data.results
        : [];

    if (!results.length) {
      showNoResults();
      return;
    }

    currentProducts =
      [...results];

    renderProducts(
      results,
      query
    );

    if (data.budget) {
      searchSummary.textContent =
        `AI-ranked results for "${query}" · budget ₹${formatPrice(
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
      error.message ||
      "Please try again."
    );

  } finally {
    isSearching = false;

    if (searchButton) {
      searchButton.disabled = false;
      searchButton.textContent =
        "Search with AI";
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
      document
        .getElementById(id)
        ?.value
        .trim() || "";

  const occasion =
    getValue("stylistOccasion");

  const style =
    getValue("stylistStyle");

  const comfort =
    getValue("stylistComfort");

  const color =
    getValue("stylistColor");

  const coverage =
    getValue("stylistCoverage");

  const description =
    getValue("stylistDescription");

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
    stylistButton.disabled = true;
    stylistButton.textContent =
      "AI is styling...";
  }

  showLoading(
    "Building your personalised fashion recommendations..."
  );

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/stylist`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
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

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "AI Stylist failed."
      );
    }

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

    currentProducts =
      [...recommendations];

    renderProducts(
      recommendations,
      data.query ||
      description
    );

    searchSummary.textContent =
      "Personalised recommendations generated by AI Stylist";

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
      "AI Stylist error:",
      error
    );

    showError(
      error.message ||
      "AI Stylist could not complete the request."
    );

  } finally {
    if (stylistButton) {
      stylistButton.disabled = false;
      stylistButton.textContent =
        "Find My AI Matches";
    }
  }
}

/*
=========================================================
EVENTS
=========================================================
*/

searchButton?.addEventListener(
  "click",
  runSearch
);

searchInput?.addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter") {
      runSearch();
    }
  }
);

stylistButton?.addEventListener(
  "click",
  runAIStylist
);

categoryFilter?.addEventListener(
  "change",
  applyFilters
);

sortFilter?.addEventListener(
  "change",
  applyFilters
);

clearFiltersButton?.addEventListener(
  "click",
  clearFilters
);

retryButton?.addEventListener(
  "click",
  () => {
    loadProducts();
    checkAPIHealth();
  }
);

/*
=========================================================
SEARCH HINTS
=========================================================
*/

document
  .querySelectorAll(
    ".search-hints button"
  )
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        if (!searchInput) {
          return;
        }

        searchInput.value =
          button.textContent.trim();

        runSearch();
      }
    );
  });

/*
=========================================================
INITIALIZE
=========================================================
*/

async function initialize() {
  await checkAPIHealth();
  await loadProducts();
}

initialize();
```
