/*
=========================================================
FASHION AI DISCOVERY
DAY 4 FRONTEND
AI STYLIST + PERSONALIZED RECOMMENDATIONS
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

/*
=========================================================
STATE
=========================================================
*/

let allProducts = [];

/*
=========================================================
HELPERS
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

function formatPrice(price) {
  const number = Number(price);

  if (!Number.isFinite(number)) {
    return escapeHTML(price || "");
  }

  return number.toLocaleString("en-IN");
}

function arrayValue(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  return [value];
}

/*
=========================================================
LOADING
=========================================================
*/

function showLoading(message) {
  resultsContainer.innerHTML = `
    <div class="no-results">
      <div class="loading-spinner"></div>

      <h3>
        ${escapeHTML(
          message || "AI is working..."
        )}
      </h3>

      <p>
        Fashion AI is analysing your preferences
        and ranking the most relevant products.
      </p>
    </div>
  `;

  resultCount.textContent =
    "AI working";
}

/*
=========================================================
ERROR
=========================================================
*/

function showError(message) {
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

  resultCount.textContent =
    "Error";
}

/*
=========================================================
NO RESULTS
=========================================================
*/

function showNoResults() {
  resultsContainer.innerHTML = `
    <div class="no-results">
      <h3>
        No strong fashion matches found.
      </h3>

      <p>
        Try changing the occasion, colour,
        style or description.
      </p>
    </div>
  `;

  resultCount.textContent =
    "0 matches";
}

/*
=========================================================
PRODUCT VISUAL
=========================================================
*/

function productVisual(product) {
  const category =
    product.category || "Fashion";

  const name =
    product.name || "Fashion Product";

  return `
    <div class="product-visual">
      <div class="visual-grid"></div>

      <div class="visual-fashion">
        <span>FASHION AI</span>

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
REASONS
=========================================================
*/

function renderReasons(reasons) {
  if (!Array.isArray(reasons)) {
    return "";
  }

  if (!reasons.length) {
    return "";
  }

  return `
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
                ${escapeHTML(reason)}
              </li>
            `
          )
          .join("")}
      </ul>

    </div>
  `;
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

  const styles =
    arrayValue(product.style);

  const occasions =
    arrayValue(product.occasion);

  const materials =
    arrayValue(product.material);

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

        ${renderReasons(product.reasons)}

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
RENDER
=========================================================
*/

function renderProducts(
  products,
  summary = ""
) {
  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {
    showNoResults();
    return;
  }

  resultsContainer.innerHTML =
    products
      .map(createProductCard)
      .join("");

  resultCount.textContent =
    `${products.length} AI matches`;

  if (summary) {
    searchSummary.textContent =
      summary;
  }
}

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

async function loadProducts() {
  const response =
    await fetch(
      `${API_BASE_URL}/api/products`
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Unable to load products."
    );
  }

  allProducts =
    data.products || [];
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
        },

        body: JSON.stringify({
          query,
        }),
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
RUN NORMAL SEARCH
=========================================================
*/

async function runSearch() {
  const query =
    searchInput?.value.trim();

  if (!query) {
    renderProducts(
      allProducts.slice(0, 6),
      `${allProducts.length} products available for AI discovery.`
    );

    return;
  }

  showLoading(
    "Understanding your fashion request..."
  );

  try {
    const data =
      await searchFashion(query);

    const results =
      data.results || [];

    if (!results.length) {
      showNoResults();
      return;
    }

    let summary =
      `AI-ranked results for "${query}"`;

    if (data.budget) {
      summary +=
        ` · budget detected: ₹${formatPrice(
          data.budget
        )}`;
    }

    renderProducts(
      results,
      summary
    );

    document
      .getElementById(
        "results-section"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  } catch (error) {
    console.error(
      "AI Search Error:",
      error
    );

    showError(
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
  const getValue = (id) =>
    document.getElementById(id)
      ?.value
      ?.trim() || "";

  const preferences = {
    occasion:
      getValue(
        "stylistOccasion"
      ),

    style:
      getValue(
        "stylistStyle"
      ),

    comfort:
      getValue(
        "stylistComfort"
      ),

    color:
      getValue(
        "stylistColor"
      ),

    coverage:
      getValue(
        "stylistCoverage"
      ),

    description:
      getValue(
        "stylistDescription"
      ),
  };

  const hasInput =
    Object.values(
      preferences
    ).some(Boolean);

  if (!hasInput) {
    alert(
      "Please provide at least one styling preference."
    );

    return;
  }

  stylistButton.disabled =
    true;

  stylistButton.textContent =
    "AI Stylist is thinking...";

  showLoading(
    "Building your personalised fashion look..."
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
          },

          body: JSON.stringify(
            preferences
          ),
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
      data.recommendations || [];

    if (!recommendations.length) {
      showNoResults();
      return;
    }

    const selected =
      recommendations[0];

    let summary =
      "✨ Personalised AI Stylist recommendations";

    if (data.preferences?.occasion) {
      summary +=
        ` · ${data.preferences.occasion}`;
    }

    if (data.preferences?.style) {
      summary +=
        ` · ${data.preferences.style}`;
    }

    if (data.budget) {
      summary +=
        ` · under ₹${formatPrice(
          data.budget
        )}`;
    }

    renderProducts(
      recommendations,
      summary
    );

    /*
    ================================================
    SHOW PERSONALIZATION INFO
    ================================================
    */

    if (selected) {
      console.log(
        "Top AI Stylist recommendation:",
        selected.name
      );

      console.log(
        "Match score:",
        selected.matchScore
      );

      console.log(
        "Reasons:",
        selected.reasons
      );
    }

    document
      .getElementById(
        "results-section"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  } catch (error) {
    console.error(
      "AI Stylist Error:",
      error
    );

    showError(
      error.message
    );
  } finally {
    stylistButton.disabled =
      false;

    stylistButton.textContent =
      "Find My AI Matches";
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
  (event) => {
    if (event.key === "Enter") {
      runSearch();
    }
  }
);

stylistButton?.addEventListener(
  "click",
  runAIStylist
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
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
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
  if (resultsContainer) {
    resultsContainer.innerHTML = `
      <div class="no-results">

        <div class="loading-spinner"></div>

        <h3>
          Connecting to Fashion AI...
        </h3>

        <p>
          Loading your intelligent fashion catalogue.
        </p>

      </div>
    `;
  }

  try {
    await loadProducts();

    renderProducts(
      allProducts.slice(0, 6),
      `${allProducts.length} products available for AI discovery.`
    );

    resultCount.textContent =
      "AI catalogue ready";
  } catch (error) {
    console.error(
      "Initialization error:",
      error
    );

    showError(
      "Could not connect to the Fashion AI backend."
    );
  }
}

initialize();
