/*
=========================================================
FASHION AI DISCOVERY
DAY 7 FRONTEND
ADVANCED SEARCH + FILTERS
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
  document.getElementById(
    "searchInput"
  );

const searchButton =
  document.getElementById(
    "searchButton"
  );

const resultsContainer =
  document.getElementById(
    "results"
  );

const resultCount =
  document.getElementById(
    "resultCount"
  );

const searchSummary =
  document.getElementById(
    "searchSummary"
  );

const stylistButton =
  document.getElementById(
    "stylistButton"
  );

/*
=========================================================
FILTER DOM
=========================================================
*/

const categoryFilter =
  document.getElementById(
    "categoryFilter"
  );

const colorFilter =
  document.getElementById(
    "colorFilter"
  );

const styleFilter =
  document.getElementById(
    "styleFilter"
  );

const genderFilter =
  document.getElementById(
    "genderFilter"
  );

const occasionFilter =
  document.getElementById(
    "occasionFilter"
  );

const minPrice =
  document.getElementById(
    "minPrice"
  );

const maxPrice =
  document.getElementById(
    "maxPrice"
  );

const sortFilter =
  document.getElementById(
    "sortFilter"
  );

const clearFiltersButton =
  document.getElementById(
    "clearFilters"
  );

/*
=========================================================
STATE
=========================================================
*/

let allProducts = [];

let filterData = {};

/*
=========================================================
ESCAPE HTML
=========================================================
*/

function escapeHTML(
  value
) {

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
PRICE
=========================================================
*/

function formatPrice(
  price
) {

  const number =
    Number(price);

  if (
    !Number.isFinite(number)
  ) {
    return escapeHTML(
      price || ""
    );
  }

  return number.toLocaleString(
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

      <div class="visual-fashion">

        <span>
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
  message =
    "AI is searching..."
) {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <div class="loading-spinner"></div>

      <h3>
        ${escapeHTML(
          message
        )}
      </h3>

      <p>
        Finding the most relevant fashion products.
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

function showError(
  message
) {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        Search unavailable
      </h3>

      <p>
        ${escapeHTML(
          message
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
        No products match your filters.
      </h3>

      <p>
        Try changing the price, category, colour,
        style or occasion.
      </p>

    </div>
  `;

  resultCount.textContent =
    "0 matches";
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
          product.matchScore
        ) || 0
      )
    );

  const reasons =
    Array.isArray(
      product.reasons
    )
      ? product.reasons
      : [];

  const material =
    Array.isArray(
      product.material
    )
      ? product.material
      : [];

  const styles =
    Array.isArray(
      product.style
    )
      ? product.style
      : [];

  const occasions =
    Array.isArray(
      product.occasion
    )
      ? product.occasion
      : [];

  return `

    <article class="product-card">

      <div class="product-image-wrap">

        ${productVisual(
          product
        )}

        <div class="ai-match-badge">
          ${score}% AI MATCH
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
            material.length
              ? `
                <div class="product-meta-item">
                  <span>Material</span>
                  <strong>
                    ${escapeHTML(
                      material.join(", ")
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
              AI relevance
            </span>

            <strong>
              ${score}%
            </strong>

          </div>

          <div class="match-score-bar">

            <div
              class="match-score-fill"
              style="width:${score}%"
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

  resultsContainer.innerHTML =
    products
      .map(
        createProductCard
      )
      .join("");

  resultCount.textContent =
    `${products.length} matches`;

  if (query) {

    searchSummary.textContent =
      `AI results for "${query}"`;
  }
}

/*
=========================================================
GET FILTER VALUES
=========================================================
*/

function getFilterValues() {

  return {
    query:
      searchInput?.value.trim() ||
      "",

    minPrice:
      minPrice?.value || "",

    maxPrice:
      maxPrice?.value || "",

    category:
      categoryFilter?.value || "",

    color:
      colorFilter?.value || "",

    style:
      styleFilter?.value || "",

    gender:
      genderFilter?.value || "",

    occasion:
      occasionFilter?.value || "",

    sort:
      sortFilter?.value ||
      "relevance",
  };
}

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

async function loadProducts() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/api/products`
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Could not load products."
      );
    }

    allProducts =
      data.products || [];

  } catch (error) {

    console.error(
      "Products error:",
      error
    );
  }
}

/*
=========================================================
LOAD FILTER OPTIONS
=========================================================
*/

async function loadFilterOptions() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/api/filters`
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        "Unable to load filters."
      );
    }

    filterData =
      data.filters || {};

    populateSelect(
      categoryFilter,
      filterData.categories
    );

    populateSelect(
      colorFilter,
      filterData.colors
    );

    populateSelect(
      styleFilter,
      filterData.styles
    );

    populateSelect(
      genderFilter,
      filterData.genders
    );

    populateSelect(
      occasionFilter,
      filterData.occasions
    );

  } catch (error) {

    console.error(
      "Filter loading error:",
      error
    );
  }
}

/*
=========================================================
POPULATE SELECT
=========================================================
*/

function populateSelect(
  select,
  values
) {

  if (
    !select ||
    !Array.isArray(values)
  ) {
    return;
  }

  const currentValue =
    select.value;

  const label =
    select.dataset.label ||
    "All";

  select.innerHTML = `
    <option value="">
      ${escapeHTML(label)}
    </option>
  `;

  values.forEach(
    (value) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        value;

      option.textContent =
        value;

      select.appendChild(
        option
      );
    }
  );

  if (
    values.includes(
      currentValue
    )
  ) {
    select.value =
      currentValue;
  }
}

/*
=========================================================
ADVANCED SEARCH
=========================================================
*/

async function runAdvancedSearch() {

  const filters =
    getFilterValues();

  const hasQuery =
    Boolean(
      filters.query
    );

  const hasFilters =
    Boolean(
      filters.minPrice ||
      filters.maxPrice ||
      filters.category ||
      filters.color ||
      filters.style ||
      filters.gender ||
      filters.occasion
    );

  if (
    !hasQuery &&
    !hasFilters
  ) {

    renderProducts(
      allProducts.slice(0, 6)
    );

    resultCount.textContent =
      "AI catalogue ready";

    searchSummary.textContent =
      `${allProducts.length} products available for AI discovery.`;

    return;
  }

  showLoading(
    "AI is combining your search with advanced filters..."
  );

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/api/search`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              filters
            ),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Advanced search failed."
      );
    }

    const results =
      data.results || [];

    if (
      !results.length
    ) {

      showNoResults();

      return;
    }

    renderProducts(
      results,
      filters.query
    );

    searchSummary.textContent =
      `${results.length} products found using AI + advanced filters.`;

    document
      .getElementById(
        "results-section"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",
        block:
          "start",
      });

  } catch (error) {

    console.error(
      "Advanced search error:",
      error
    );

    showError(
      error.message
    );
  }
}

/*
=========================================================
CLEAR FILTERS
=========================================================
*/

function clearFilters() {

  if (searchInput) {
    searchInput.value =
      "";
  }

  if (categoryFilter) {
    categoryFilter.value =
      "";
  }

  if (colorFilter) {
    colorFilter.value =
      "";
  }

  if (styleFilter) {
    styleFilter.value =
      "";
  }

  if (genderFilter) {
    genderFilter.value =
      "";
  }

  if (occasionFilter) {
    occasionFilter.value =
      "";
  }

  if (minPrice) {
    minPrice.value =
      "";
  }

  if (maxPrice) {
    maxPrice.value =
      "";
  }

  if (sortFilter) {
    sortFilter.value =
      "relevance";
  }

  renderProducts(
    allProducts.slice(0, 6)
  );

  resultCount.textContent =
    "AI catalogue ready";

  searchSummary.textContent =
    `${allProducts.length} products available for AI discovery.`;
}

/*
=========================================================
STYLIST
=========================================================
*/

async function runAIStylist() {

  const occasion =
    document.getElementById(
      "stylistOccasion"
    )?.value || "";

  const style =
    document.getElementById(
      "stylistStyle"
    )?.value || "";

  const comfort =
    document.getElementById(
      "stylistComfort"
    )?.value || "";

  const color =
    document.getElementById(
      "stylistColor"
    )?.value || "";

  const coverage =
    document.getElementById(
      "stylistCoverage"
    )?.value || "";

  const description =
    document.getElementById(
      "stylistDescription"
    )?.value
      ?.trim() || "";

  const hasInput =
    [
      occasion,
      style,
      comfort,
      color,
      coverage,
      description,
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
    "Building your personalised look..."
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

          body:
            JSON.stringify({
              occasion,
              style,
              comfort,
              color,
              coverage,
              description,
            }),
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
      data.recommendations ||
      [];

    if (
      !recommendations.length
    ) {

      showNoResults();

      return;
    }

    renderProducts(
      recommendations,
      data.query ||
        description
    );

    searchSummary.textContent =
      "Personalised recommendations generated by AI Stylist.";

  } catch (error) {

    console.error(
      "Stylist error:",
      error
    );

    showError(
      error.message
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
EVENTS
=========================================================
*/

searchButton?.addEventListener(
  "click",
  runAdvancedSearch
);

searchInput?.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Enter"
    ) {
      runAdvancedSearch();
    }
  }
);

[
  categoryFilter,
  colorFilter,
  styleFilter,
  genderFilter,
  occasionFilter,
  minPrice,
  maxPrice,
  sortFilter,
].forEach(
  (element) => {

    element?.addEventListener(
      "change",
      runAdvancedSearch
    );
  }
);

clearFiltersButton?.addEventListener(
  "click",
  clearFilters
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
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          if (
            searchInput
          ) {

            searchInput.value =
              button.textContent.trim();
          }

          runAdvancedSearch();
        }
      );
    }
  );

/*
=========================================================
INITIALIZE
=========================================================
*/

async function initialize() {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <div class="loading-spinner"></div>

      <h3>
        Connecting to Fashion AI...
      </h3>

      <p>
        Loading products and advanced filters.
      </p>

    </div>
  `;

  await Promise.all([
    loadProducts(),
    loadFilterOptions(),
  ]);

  if (
    allProducts.length
  ) {

    renderProducts(
      allProducts.slice(0, 6)
    );

    resultCount.textContent =
      "AI catalogue ready";

    searchSummary.textContent =
      `${allProducts.length} products available for AI discovery.`;

  } else {

    showError(
      "Could not load the fashion catalogue."
    );
  }
}

initialize();
