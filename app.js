/*
=========================================================
FASHION AI DISCOVERY
DAY 9 - PRODUCTION FRONTEND
=========================================================
*/

"use strict";

/* ========================================================
   API
======================================================== */

const API_BASE_URL = "https://fashion-ai-search-lj6s.onrender.com";

/* ========================================================
   DOM HELPERS
======================================================== */

function $(id) {
  return document.getElementById(id);
}

/* ========================================================
   STATE
======================================================== */

let searchInput = null;
let searchButton = null;
let resultsContainer = null;
let resultCount = null;
let searchSummary = null;
let stylistButton = null;

let allProducts = [];
let currentResults = [];
let currentQuery = "";
let isSearching = false;

/* ========================================================
   HTML ESCAPE
======================================================== */

function escapeHTML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ========================================================
   ARRAY NORMALIZER
======================================================== */

function safeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

/* ========================================================
   PRICE FORMAT
======================================================== */

function formatPrice(price) {
  const value = Number(price);

  if (!Number.isFinite(value)) {
    return escapeHTML(price || "");
  }

  return value.toLocaleString("en-IN");
}

/* ========================================================
   PRODUCT VISUAL
======================================================== */

function productVisual(product) {
  const category = String(product.category || "Fashion");
  const name = String(product.name || "Fashion Product");

  return (
    '<div class="product-visual">' +
      '<div class="visual-grid"></div>' +

      '<div class="visual-content">' +

        '<span class="visual-label">' +
          'FASHION AI' +
        '</span>' +

        '<strong>' +
          escapeHTML(category) +
        '</strong>' +

        '<small>' +
          escapeHTML(name) +
        '</small>' +

      '</div>' +
    '</div>'
  );
}

/* ========================================================
   LOADING
======================================================== */

function showLoading(message) {
  if (!resultsContainer) {
    return;
  }

  resultsContainer.innerHTML =
    '<div class="no-results">' +

      '<div class="loading-spinner"></div>' +

      '<h3>' +
        escapeHTML(message || "AI is working...") +
      '</h3>' +

      '<p>' +
        'Fashion AI is analysing your request.' +
      '</p>' +

    '</div>';

  if (resultCount) {
    resultCount.textContent = "AI working";
  }
}

/* ========================================================
   ERROR
======================================================== */

function showError(message) {
  if (!resultsContainer) {
    return;
  }

  resultsContainer.innerHTML =
    '<div class="no-results">' +

      '<h3>AI service unavailable</h3>' +

      '<p>' +
        escapeHTML(
          message || "Something went wrong. Please try again."
        ) +
      '</p>' +

    '</div>';

  if (resultCount) {
    resultCount.textContent = "Error";
  }
}

/* ========================================================
   NO RESULTS
======================================================== */

function showNoResults() {
  if (!resultsContainer) {
    return;
  }

  resultsContainer.innerHTML =
    '<div class="no-results">' +

      '<h3>No strong fashion matches found.</h3>' +

      '<p>' +
        'Try another colour, style, occasion or budget.' +
      '</p>' +

    '</div>';

  if (resultCount) {
    resultCount.textContent = "0 matches";
  }
}

/* ========================================================
   PRODUCT CARD
======================================================== */

function createProductCard(product) {
  const rawScore =
    product.matchScore != null
      ? product.matchScore
      : product.score != null
        ? product.score
        : 0;

  let score = Number(rawScore);

  if (!Number.isFinite(score)) {
    score = 0;
  }

  score = Math.max(0, Math.min(100, score));

  const reasons = safeArray(product.reasons);
  const styles = safeArray(product.style);
  const occasions = safeArray(product.occasion);
  const materials = safeArray(product.material);

  let colorHTML = "";
  let materialHTML = "";
  let styleHTML = "";
  let occasionHTML = "";
  let reasonsHTML = "";

  if (product.color) {
    colorHTML =
      '<div class="product-meta-item">' +
        '<span>Colour</span>' +
        '<strong>' +
          escapeHTML(product.color) +
        '</strong>' +
      '</div>';
  }

  if (materials.length) {
    materialHTML =
      '<div class="product-meta-item">' +
        '<span>Material</span>' +
        '<strong>' +
          escapeHTML(materials.slice(0, 2).join(", ")) +
        '</strong>' +
      '</div>';
  }

  if (styles.length) {
    styleHTML =
      '<div class="product-meta-item">' +
        '<span>Style</span>' +
        '<strong>' +
          escapeHTML(styles.slice(0, 2).join(", ")) +
        '</strong>' +
      '</div>';
  }

  if (occasions.length) {
    occasionHTML =
      '<div class="product-meta-item">' +
        '<span>Occasion</span>' +
        '<strong>' +
          escapeHTML(occasions.slice(0, 2).join(", ")) +
        '</strong>' +
      '</div>';
  }

  if (reasons.length) {
    let reasonItems = "";

    reasons.slice(0, 3).forEach(function(reason) {
      reasonItems +=
        '<li>' +
          escapeHTML(reason) +
        '</li>';
    });

    reasonsHTML =
      '<div class="product-reason">' +

        '<strong>Why AI selected this</strong>' +

        '<ul>' +
          reasonItems +
        '</ul>' +

      '</div>';
  }

  return (
    '<article class="product-card">' +

      '<div class="product-image-wrap">' +

        productVisual(product) +

        '<div class="ai-match-badge">' +
          Math.round(score) +
          '% AI MATCH' +
        '</div>' +

      '</div>' +

      '<div class="product-content">' +

        '<div class="product-top">' +

          '<span class="product-brand">' +
            escapeHTML(product.brand || "FASHION") +
          '</span>' +

          '<span class="product-category">' +
            escapeHTML(product.category || "Fashion") +
          '</span>' +

        '</div>' +

        '<h3 class="product-title">' +
          escapeHTML(product.name || "Fashion Product") +
        '</h3>' +

        '<p class="product-description">' +
          escapeHTML(product.description || "") +
        '</p>' +

        '<div class="product-price">' +
          '₹' +
          formatPrice(product.price) +
        '</div>' +

        '<div class="product-meta">' +
          colorHTML +
          materialHTML +
          styleHTML +
          occasionHTML +
        '</div>' +

        reasonsHTML +

        '<div class="match-score">' +

          '<div class="match-score-header">' +

            '<span>AI relevance</span>' +

            '<strong>' +
              Math.round(score) +
              '%' +
            '</strong>' +

          '</div>' +

          '<div class="match-score-bar">' +

            '<div class="match-score-fill" ' +
              'style="width:' +
              Math.round(score) +
              '%">' +
            '</div>' +

          '</div>' +

        '</div>' +

      '</div>' +

    '</article>'
  );
}

/* ========================================================
   RENDER PRODUCTS
======================================================== */

function renderProducts(products, query) {
  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {
    showNoResults();
    return;
  }

  currentResults = products;

  if (resultsContainer) {
    resultsContainer.innerHTML = products
      .map(createProductCard)
      .join("");
  }

  if (resultCount) {
    resultCount.textContent =
      products.length + " AI matches";
  }

  if (searchSummary && query) {
    searchSummary.textContent =
      'AI-ranked results for "' +
      query +
      '"';
  }
}

/* ========================================================
   API REQUEST
======================================================== */

async function apiRequest(endpoint, options) {
  const controller = new AbortController();

  const timeout = setTimeout(function() {
    controller.abort();
  }, 30000);

  try {
    const requestOptions = options || {};

    const response = await fetch(
      API_BASE_URL + endpoint,
      {
        ...requestOptions,
        signal: controller.signal
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Request failed (" +
        response.status +
        ")"
      );
    }

    return data;

  } finally {
    clearTimeout(timeout);
  }
}

/* ========================================================
   LOAD PRODUCTS
======================================================== */

async function loadProducts() {
  try {
    const data = await apiRequest("/api/products");

    if (Array.isArray(data.products)) {
      allProducts = data.products;
    } else if (Array.isArray(data)) {
      allProducts = data;
    } else {
      allProducts = [];
    }

    return allProducts;

  } catch (error) {
    console.error(
      "Product loading error:",
      error
    );

    throw error;
  }
}

/* ========================================================
   AI SEARCH
======================================================== */

async function searchFashion(query) {
  return apiRequest(
    "/api/search",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        query: query
      })
    }
  );
}

/* ========================================================
   RUN SEARCH
======================================================== */

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

    if (allProducts.length) {
      renderProducts(
        allProducts.slice(0, 6)
      );

      if (searchSummary) {
        searchSummary.textContent =
          allProducts.length +
          " products available for AI discovery.";
      }
    }

    return;
  }

  isSearching = true;
  currentQuery = query;

  if (searchButton) {
    searchButton.disabled = true;
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

    renderProducts(
      results,
      query
    );

    if (
      data.budget &&
      searchSummary
    ) {
      searchSummary.textContent =
        'AI-ranked results for "' +
        query +
        '" · budget detected: ₹' +
        formatPrice(data.budget);
    }

    const resultsSection =
      $("results-section");

    if (resultsSection) {
      resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

  } catch (error) {
    console.error(
      "AI Search Error:",
      error
    );

    if (error.name === "AbortError") {
      showError(
        "AI request timed out. Please try again."
      );
    } else {
      showError(
        error.message ||
        "AI search failed."
      );
    }

  } finally {
    isSearching = false;

    if (searchButton) {
      searchButton.disabled = false;
    }
  }
}

/* ========================================================
   AI STYLIST
======================================================== */

async function runAIStylist() {
  function getValue(id) {
    const element = $(id);

    if (!element) {
      return "";
    }

    return element.value
      ? element.value.trim()
      : "";
  }

  const occasion = getValue("stylistOccasion");
  const style = getValue("stylistStyle");
  const comfort = getValue("stylistComfort");
  const color = getValue("stylistColor");
  const coverage = getValue("stylistCoverage");
  const description = getValue("stylistDescription");

  const hasInput = [
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
    const data =
      await apiRequest(
        "/api/stylist",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            occasion: occasion,
            style: style,
            comfort: comfort,
            color: color,
            coverage: coverage,
            description: description
          })
        }
      );

    const recommendations =
      Array.isArray(data.recommendations)
        ? data.recommendations
        : [];

    if (!recommendations.length) {
      showNoResults();
      return;
    }

    renderProducts(
      recommendations,
      data.query || description
    );

    if (searchSummary) {
      searchSummary.textContent =
        "Personalised recommendations generated by Fashion AI Stylist.";
    }

    const resultsSection =
      $("results-section");

    if (resultsSection) {
      resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

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

/* ========================================================
   SEARCH HINTS
======================================================== */

function setupSearchHints() {
  const buttons =
    document.querySelectorAll(
      ".search-hints button"
    );

  buttons.forEach(function(button) {
    button.addEventListener(
      "click",
      function() {

        if (searchInput) {
          searchInput.value =
            button.textContent.trim();
        }

        runSearch();
      }
    );
  });
}

/* ========================================================
   EVENTS
======================================================== */

function setupEvents() {
  if (searchButton) {
    searchButton.addEventListener(
      "click",
      runSearch
    );
  }

  if (searchInput) {
    searchInput.addEventListener(
      "keydown",
      function(event) {

        if (event.key === "Enter") {
          event.preventDefault();
          runSearch();
        }

      }
    );
  }

  if (stylistButton) {
    stylistButton.addEventListener(
      "click",
      runAIStylist
    );
  }

  setupSearchHints();
}

/* ========================================================
   HEALTH CHECK
======================================================== */

async function checkBackend() {
  try {
    const data =
      await apiRequest("/api/health");

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

/* ========================================================
   INITIALIZE
======================================================== */

async function initialize() {
  console.log(
    "Fashion AI Discovery starting..."
  );

  searchInput = $("searchInput");
  searchButton = $("searchButton");
  resultsContainer = $("results");
  resultCount = $("resultCount");
  searchSummary = $("searchSummary");
  stylistButton = $("stylistButton");

  if (resultsContainer) {
    resultsContainer.innerHTML =
      '<div class="no-results">' +

        '<div class="loading-spinner"></div>' +

        '<h3>Connecting to Fashion AI...</h3>' +

        '<p>' +
          'Loading the intelligent fashion catalogue.' +
        '</p>' +

      '</div>';
  }

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

      renderProducts(
        allProducts.slice(0, 6)
      );

      if (resultCount) {
        resultCount.textContent =
          "AI catalogue ready";
      }

      if (searchSummary) {
        searchSummary.textContent =
          allProducts.length +
          " products available for AI discovery.";
      }

    } else {
      showNoResults();
    }

  } catch (error) {
    showError(
      "Could not load the fashion catalogue."
    );
  }
}

/* ========================================================
   START
======================================================== */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

} else {

  initialize();

}
