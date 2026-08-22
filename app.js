```javascript
/*
=========================================================
FASHION AI DISCOVERY
FRONTEND APPLICATION
=========================================================

Backend:
https://fashion-ai-search-lj6s.onrender.com

API:
GET  /api/health
GET  /api/products
POST /api/search
POST /api/stylist
=========================================================
*/

"use strict";

/*
=========================================================
CONFIGURATION
=========================================================
*/

const API_BASE_URL =
  "https://fashion-ai-search-lj6s.onrender.com";

/*
=========================================================
DOM HELPERS
=========================================================
*/

function getElement(id) {
  return document.getElementById(id);
}

const searchInput =
  getElement("searchInput");

const searchButton =
  getElement("searchButton");

const resultsContainer =
  getElement("results");

const resultCount =
  getElement("resultCount");

const searchSummary =
  getElement("searchSummary");

const stylistButton =
  getElement("stylistButton");

const resultsSection =
  getElement("results-section");

/*
=========================================================
STATE
=========================================================
*/

let allProducts = [];

let currentQuery = "";

let isSearching = false;

let isStyling = false;


/*
=========================================================
SAFE TEXT
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
PRICE FORMAT
=========================================================
*/

function formatPrice(price) {

  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return "Price unavailable";
  }

  const number =
    Number(price);

  if (
    !Number.isFinite(number)
  ) {
    return escapeHTML(price);
  }

  return `₹${number.toLocaleString("en-IN")}`;
}


/*
=========================================================
ARRAY NORMALIZER
=========================================================
*/

function toArray(value) {

  if (Array.isArray(value)) {
    return value;
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  return [value];
}


/*
=========================================================
API ERROR READER
=========================================================
*/

async function getJSON(response) {

  let data = null;

  try {

    data =
      await response.json();

  } catch {

    throw new Error(
      `Server returned HTTP ${response.status}.`
    );
  }

  if (!response.ok) {

    const message =
      data?.error ||
      data?.message ||
      `Request failed with HTTP ${response.status}.`;

    throw new Error(message);
  }

  return data;
}


/*
=========================================================
SCROLL TO RESULTS
=========================================================
*/

function scrollToResults() {

  const target =
    resultsSection ||
    resultsContainer;

  if (!target) {
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/*
=========================================================
PRODUCT VISUAL
=========================================================
*/

function productVisual(product) {

  const category =
    product?.category ||
    "Fashion";

  const name =
    product?.name ||
    "Fashion Product";

  const brand =
    product?.brand ||
    "Fashion AI";

  return `
    <div class="product-visual">

      <div class="visual-grid"></div>

      <div class="visual-fashion">

        <span>
          FASHION AI
        </span>

        <strong>
          ${escapeHTML(category)}
        </strong>

        <small>
          ${escapeHTML(name)}
        </small>

        <em>
          ${escapeHTML(brand)}
        </em>

      </div>

    </div>
  `;
}


/*
=========================================================
IMAGE SUPPORT
=========================================================
*/

function getProductImage(product) {

  return (
    product?.image ||
    product?.imageUrl ||
    product?.image_url ||
    product?.thumbnail ||
    product?.photo ||
    product?.images?.[0] ||
    ""
  );
}


function productMedia(product) {

  const image =
    getProductImage(product);

  if (!image) {
    return productVisual(product);
  }

  return `
    <div class="product-image-wrap">

      <img
        class="product-image"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(
          product?.name || "Fashion product"
        )}"
        loading="lazy"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
      >

      <div
        class="product-fallback"
        style="display:none;"
      >
        ${productVisual(product)}
      </div>

    </div>
  `;
}


/*
=========================================================
LOADING STATE
=========================================================
*/

function showLoading(
  message = "AI is searching..."
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
        Fashion AI is analysing your request
        against the product catalogue.
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
ERROR STATE
=========================================================
*/

function showError(message) {

  if (!resultsContainer) {
    return;
  }

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        Fashion AI temporarily unavailable
      </h3>

      <p>
        ${escapeHTML(
          message ||
          "Something went wrong. Please try again."
        )}
      </p>

      <button
        type="button"
        class="product-button"
        onclick="window.location.reload()"
      >
        Try Again
      </button>

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

function showNoResults(query = "") {

  if (!resultsContainer) {
    return;
  }

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        No strong fashion matches found.
      </h3>

      <p>
        ${
          query
            ? `Nothing closely matched "${escapeHTML(query)}".`
            : "Try another fashion request."
        }
      </p>

      <p>
        Try describing the colour, style,
        occasion, material or budget.
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
MATCH SCORE
=========================================================
*/

function getMatchScore(product) {

  const possibleValues = [

    product?.matchScore,

    product?.match_score,

    product?.score,

    product?.similarity,

    product?.relevance

  ];

  let score = 0;

  for (
    const value of possibleValues
  ) {

    const number =
      Number(value);

    if (
      Number.isFinite(number)
    ) {

      score = number;

      break;
    }
  }

  /*
    Similarity models often return
    values between 0 and 1.
  */

  if (
    score > 0 &&
    score <= 1
  ) {
    score *= 100;
  }

  /*
    Some APIs return 0-1000.
  */

  if (score > 100) {
    score = 100;
  }

  return Math.round(
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    )
  );
}


/*
=========================================================
PRODUCT CARD
=========================================================
*/

function createProductCard(product) {

  const matchScore =
    getMatchScore(product);

  const reasons =
    toArray(
      product?.reasons ||
      product?.reason ||
      product?.matchReasons
    );

  const occasion =
    toArray(product?.occasion);

  const style =
    toArray(product?.style);

  const material =
    toArray(product?.material);

  const color =
    product?.color ||
    product?.colour;

  const tags =
    toArray(product?.tags);


  return `

    <article
      class="product-card"
      data-product-id="${escapeHTML(
        product?.id ||
        product?._id ||
        product?.productId ||
        ""
      )}"
    >

      ${productMedia(product)}


      <div class="product-content">

        <div class="product-top">

          <span class="product-brand">
            ${escapeHTML(
              product?.brand ||
              "FASHION"
            )}
          </span>

          <span class="product-category">
            ${escapeHTML(
              product?.category ||
              "Fashion"
            )}
          </span>

        </div>


        <h3 class="product-title">

          ${escapeHTML(
            product?.name ||
            product?.title ||
            "Fashion Product"
          )}

        </h3>


        ${
          product?.description
            ? `
              <p class="product-description">
                ${escapeHTML(
                  product.description
                )}
              </p>
            `
            : ""
        }


        <div class="product-price">

          ${formatPrice(
            product?.price
          )}

        </div>


        <div class="product-meta">

          ${
            color
              ? `
                <div class="product-meta-item">

                  <span class="product-meta-label">
                    Colour
                  </span>

                  <strong>
                    ${escapeHTML(color)}
                  </strong>

                </div>
              `
              : ""
          }


          ${
            material.length
              ? `
                <div class="product-meta-item">

                  <span class="product-meta-label">
                    Material
                  </span>

                  <strong>
                    ${escapeHTML(
                      material
                        .slice(0, 3)
                        .join(", ")
                    )}
                  </strong>

                </div>
              `
              : ""
          }


          ${
            style.length
              ? `
                <div class="product-meta-item">

                  <span class="product-meta-label">
                    Style
                  </span>

                  <strong>
                    ${escapeHTML(
                      style
                        .slice(0, 3)
                        .join(", ")
                    )}
                  </strong>

                </div>
              `
              : ""
          }


          ${
            occasion.length
              ? `
                <div class="product-meta-item">

                  <span class="product-meta-label">
                    Occasion
                  </span>

                  <strong>
                    ${escapeHTML(
                      occasion
                        .slice(0, 3)
                        .join(", ")
                    )}
                  </strong>

                </div>
              `
              : ""
          }


          ${
            tags.length
              ? `
                <div class="product-meta-item">

                  <span class="product-meta-label">
                    Tags
                  </span>

                  <strong>
                    ${escapeHTML(
                      tags
                        .slice(0, 3)
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
                      reason => `
                        <li>
                          ${escapeHTML(
                            typeof reason === "object"
                              ? (
                                  reason.text ||
                                  reason.reason ||
                                  JSON.stringify(reason)
                                )
                              : reason
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


        ${
          matchScore > 0
            ? `

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

            `
            : ""
        }

      </div>

    </article>

  `;
}


/*
=========================================================
NORMALIZE PRODUCT RESPONSE
=========================================================
*/

function extractProducts(data) {

  if (Array.isArray(data)) {
    return data;
  }

  if (!data) {
    return [];
  }

  if (Array.isArray(data.products)) {
    return data.products;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (Array.isArray(data.recommendations)) {
    return data.recommendations;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (
    data.data &&
    Array.isArray(data.data.products)
  ) {
    return data.data.products;
  }

  if (
    data.data &&
    Array.isArray(data.data.results)
  ) {
    return data.data.results;
  }

  return [];
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

  if (!resultsContainer) {
    return;
  }

  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {

    showNoResults(query);

    return;
  }


  resultsContainer.innerHTML =
    products
      .map(product =>
        createProductCard(product)
      )
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
      `AI-ranked results for "${query}"`;
  }
}


/*
=========================================================
LOAD PRODUCT CATALOGUE
=========================================================
*/

async function loadProducts() {

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

  const data =
    await getJSON(response);

  allProducts =
    extractProducts(data);

  return allProducts;
}


/*
=========================================================
HEALTH CHECK
=========================================================
*/

async function checkBackendHealth() {

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

    const data =
      await getJSON(response);

    console.log(
      "Fashion AI backend:",
      data
    );

    return data;

  } catch (error) {

    console.error(
      "Backend health check failed:",
      error
    );

    return null;
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
            query: query
          })
      }
    );

  return getJSON(response);
}


/*
=========================================================
RUN AI SEARCH
=========================================================
*/

async function runSearch() {

  if (
    isSearching ||
    isStyling
  ) {
    return;
  }

  const query =
    searchInput?.value
      ?.trim() || "";


  if (!query) {

    if (
      allProducts.length
    ) {

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
    }

    return;
  }


  currentQuery =
    query;

  isSearching =
    true;


  if (searchButton) {

    searchButton.disabled =
      true;

    searchButton.textContent =
      "Searching...";
  }


  showLoading(
    "Understanding your fashion request..."
  );


  try {

    const data =
      await searchFashion(query);


    console.log(
      "AI SEARCH RESPONSE:",
      data
    );


    const results =
      extractProducts(data);


    if (
      !results.length
    ) {

      showNoResults(query);

      return;
    }


    renderProducts(
      results,
      query
    );


    /*
    Budget detected by backend.
    */

    const budget =
      data?.budget ||
      data?.filters?.budget ||
      data?.parsedQuery?.budget;


    if (
      budget &&
      searchSummary
    ) {

      searchSummary.textContent =
        `AI-ranked results for "${query}" · budget detected: ${formatPrice(budget)}`;
    }


    scrollToResults();


  } catch (error) {

    console.error(
      "AI SEARCH ERROR:",
      error
    );


    showError(
      error?.message ||
      "AI search failed. Please try again."
    );


  } finally {

    isSearching =
      false;


    if (searchButton) {

      searchButton.disabled =
        false;

      searchButton.textContent =
        "Search";
    }
  }
}


/*
=========================================================
AI STYLIST
=========================================================
*/

async function runAIStylist() {

  if (
    isSearching ||
    isStyling
  ) {
    return;
  }


  const occasion =
    getElement(
      "stylistOccasion"
    )?.value
      ?.trim() || "";


  const style =
    getElement(
      "stylistStyle"
    )?.value
      ?.trim() || "";


  const comfort =
    getElement(
      "stylistComfort"
    )?.value
      ?.trim() || "";


  const color =
    getElement(
      "stylistColor"
    )?.value
      ?.trim() || "";


  const coverage =
    getElement(
      "stylistCoverage"
    )?.value
      ?.trim() || "";


  const description =
    getElement(
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
      description
    ].some(Boolean);


  if (!hasInput) {

    alert(
      "Please describe at least one part of your desired look."
    );

    return;
  }


  isStyling =
    true;


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
      await getJSON(response);


    console.log(
      "AI STYLIST RESPONSE:",
      data
    );


    const recommendations =
      extractProducts(data);


    if (
      !recommendations.length
    ) {

      showNoResults(
        description ||
        "your requested style"
      );

      return;
    }


    renderProducts(
      recommendations,
      description ||
      "your personalised style"
    );


    if (searchSummary) {

      searchSummary.textContent =
        "Personalised recommendations generated by Fashion AI Stylist.";
    }


    scrollToResults();


  } catch (error) {

    console.error(
      "AI STYLIST ERROR:",
      error
    );


    showError(
      error?.message ||
      "AI Stylist could not complete the request."
    );


  } finally {

    isStyling =
      false;


    if (stylistButton) {

      stylistButton.disabled =
        false;

      stylistButton.innerHTML =
        `<span>✦</span> Find My AI Matches`;
    }
  }
}


/*
=========================================================
EVENT — SEARCH BUTTON
=========================================================
*/

searchButton?.addEventListener(
  "click",
  runSearch
);


/*
=========================================================
EVENT — ENTER KEY
=========================================================
*/

searchInput?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      runSearch();
    }
  }
);


/*
=========================================================
EVENT — AI STYLIST
=========================================================
*/

stylistButton?.addEventListener(
  "click",
  runAIStylist
);


/*
=========================================================
SEARCH HINT BUTTONS
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

        const text =
          button.textContent
            .trim();

        if (
          searchInput
        ) {

          searchInput.value =
            text;
        }

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

  console.log(
    "Starting Fashion AI frontend..."
  );


  if (
    resultsContainer
  ) {

    resultsContainer.innerHTML = `

      <div class="no-results">

        <div class="loading-spinner"></div>

        <h3>
          Connecting to Fashion AI...
        </h3>

        <p>
          Loading the intelligent fashion catalogue.
        </p>

      </div>

    `;
  }


  /*
  Check backend first.
  */

  await checkBackendHealth();


  /*
  Load products.
  */

  try {

    await loadProducts();


    console.log(
      `Loaded ${allProducts.length} products from AI backend.`
    );


    if (
      allProducts.length
    ) {

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

      showError(
        "The AI backend is online, but no products were returned."
      );
    }


  } catch (error) {

    console.error(
      "INITIALIZATION ERROR:",
      error
    );


    showError(
      error?.message ||
      "Could not connect to the Fashion AI backend."
    );
  }
}


/*
=========================================================
START APPLICATION
=========================================================
*/

document.addEventListener(
  "DOMContentLoaded",
  initialize
);
```
