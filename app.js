"use strict";

/*
=========================================================
FASHION AI DISCOVERY
DAY 1 FRONTEND
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


/*
=========================================================
STATE
=========================================================
*/

let products = [];

let searching = false;


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
PRICE
=========================================================
*/

function formatPrice(price) {

  const number =
    Number(price);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return "";
  }

  return number.toLocaleString(
    "en-IN"
  );
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

  const styles =
    Array.isArray(
      product.style
    )
      ? product.style
      : [];

  return `
    <article
      class="product-card"
    >

      <div
        class="product-image-wrap"
      >

        <div
          class="product-visual"
        >

          <div
            class="visual-grid"
          ></div>

          <div
            class="visual-content"
          >

            <span
              class="visual-label"
            >
              FASHION AI
            </span>

            <strong>
              ${escapeHTML(
                product.category
              )}
            </strong>

            <small>
              ${escapeHTML(
                product.name
              )}
            </small>

          </div>

        </div>

        <div
          class="ai-match-badge"
        >
          ${Math.round(score)}% MATCH
        </div>

      </div>


      <div
        class="product-content"
      >

        <div
          class="product-top"
        >

          <span
            class="product-brand"
          >
            ${escapeHTML(
              product.brand
            )}
          </span>

          <span
            class="product-category"
          >
            ${escapeHTML(
              product.category
            )}
          </span>

        </div>


        <h3
          class="product-title"
        >
          ${escapeHTML(
            product.name
          )}
        </h3>


        <p
          class="product-description"
        >
          ${escapeHTML(
            product.description
          )}
        </p>


        <div
          class="product-price"
        >
          ₹${formatPrice(
            product.price
          )}
        </div>


        <div
          class="product-meta"
        >

          <div
            class="product-meta-item"
          >

            <span>
              Colour
            </span>

            <strong>
              ${escapeHTML(
                product.color
              )}
            </strong>

          </div>


          <div
            class="product-meta-item"
          >

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

        </div>


        <div
          class="match-score"
        >

          <div
            class="match-score-header"
          >

            <span>
              AI relevance
            </span>

            <strong>
              ${Math.round(score)}%
            </strong>

          </div>


          <div
            class="match-score-bar"
          >

            <div
              class="match-score-fill"
              style="
                width:${Math.round(score)}%
              "
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
  items,
  query = ""
) {

  if (
    !items ||
    !items.length
  ) {

    resultsContainer.innerHTML = `
      <div class="no-results">

        <h3>
          No products found
        </h3>

        <p>
          Try another fashion description.
        </p>

      </div>
    `;

    resultCount.textContent =
      "0 matches";

    return;
  }


  resultsContainer.innerHTML =
    items
      .map(
        createProductCard
      )
      .join("");


  resultCount.textContent =
    `${items.length} matches`;


  if (query) {

    searchSummary.textContent =
      `Results for "${query}"`;
  }
}


/*
=========================================================
LOADING
=========================================================
*/

function showLoading() {

  resultsContainer.innerHTML = `
    <div class="no-results">

      <div
        class="loading-spinner"
      ></div>

      <h3>
        Fashion AI is working...
      </h3>

      <p>
        Analysing the catalogue.
      </p>

    </div>
  `;

  resultCount.textContent =
    "Working";
}


/*
=========================================================
API
=========================================================
*/

async function api(
  endpoint,
  options = {}
) {

  const response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      options
    );

  const data =
    await response.json();

  if (
    !response.ok
  ) {

    throw new Error(
      data.error ||
      "API request failed."
    );
  }

  return data;
}


/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

async function loadProducts() {

  const data =
    await api(
      "/api/products"
    );

  products =
    Array.isArray(
      data.products
    )
      ? data.products
      : [];

  renderProducts(
    products.slice(0, 6)
  );

  resultCount.textContent =
    "Catalogue ready";

  searchSummary.textContent =
    `${products.length} products available for discovery.`;
}


/*
=========================================================
SEARCH
=========================================================
*/

async function search() {

  if (searching) {
    return;
  }

  const query =
    searchInput.value.trim();

  if (!query) {

    renderProducts(
      products.slice(0, 6)
    );

    return;
  }

  searching = true;

  searchButton.disabled =
    true;

  showLoading();

  try {

    const data =
      await api(
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

    renderProducts(
      data.results,
      query
    );

  } catch (error) {

    console.error(
      error
    );

    resultsContainer.innerHTML = `
      <div class="no-results">

        <h3>
          Search unavailable
        </h3>

        <p>
          ${escapeHTML(
            error.message
          )}
        </p>

      </div>
    `;

    resultCount.textContent =
      "Error";

  } finally {

    searching = false;

    searchButton.disabled =
      false;
  }
}


/*
=========================================================
HINTS
=========================================================
*/

function setupHints() {

  document
    .querySelectorAll(
      ".search-hints button"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            searchInput.value =
              button.textContent.trim();

            search();
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

  searchButton.addEventListener(
    "click",
    search
  );


  searchInput.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        search();
      }
    }
  );


  setupHints();
}


/*
=========================================================
START
=========================================================
*/

async function initialize() {

  console.log(
    "Fashion AI Discovery starting..."
  );

  setupEvents();

  try {

    await api(
      "/api/health"
    );

    await loadProducts();

    console.log(
      "Fashion AI Discovery ready."
    );

  } catch (error) {

    console.error(
      "Initialization failed:",
      error
    );

    resultsContainer.innerHTML = `
      <div class="no-results">

        <h3>
          Backend connection failed
        </h3>

        <p>
          Make sure the Fashion AI backend
          is deployed and running.
        </p>

      </div>
    `;

    resultCount.textContent =
      "Offline";
  }
}


initialize();
