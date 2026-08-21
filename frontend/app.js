/* =========================================================
   FASHION AI DISCOVERY
   DAY 2 APPLICATION ENGINE
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE_URL =
  "https://fashion-ai-search-j6s.onrender.com";


const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  products: `${API_BASE_URL}/api/products`,
  search: `${API_BASE_URL}/api/search`
};


/* =========================================================
   DOM
========================================================= */

const searchForm =
  document.getElementById("searchForm");

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");

const searchStatus =
  document.getElementById("searchStatus");

const productGrid =
  document.getElementById("productGrid");

const loadingState =
  document.getElementById("loadingState");

const errorState =
  document.getElementById("errorState");

const errorMessage =
  document.getElementById("errorMessage");

const emptyState =
  document.getElementById("emptyState");

const retryButton =
  document.getElementById("retryButton");

const resultCount =
  document.getElementById("resultCount");

const resultsTitle =
  document.getElementById("resultsTitle");

const resultsSubtitle =
  document.getElementById("resultsSubtitle");

const productCount =
  document.getElementById("productCount");

const aiStatusButton =
  document.getElementById("aiStatusButton");

const engineStatus =
  document.getElementById("engineStatus");


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {

  products: [],

  results: [],

  currentQuery: "",

  activeFilter: "all",

  loading: false,

  apiOnline: false

};


/* =========================================================
   UTILITY
========================================================= */

function safeText(value, fallback = "") {

  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value);
}


function escapeHTML(value) {

  return safeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatPrice(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Price unavailable";
  }

  if (typeof value === "number") {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }
    ).format(value);

  }

  const stringValue =
    String(value);

  if (
    stringValue.includes("₹") ||
    stringValue.includes("$")
  ) {
    return stringValue;
  }

  return `₹${stringValue}`;
}


function getNumericPrice(value) {

  if (
    typeof value === "number"
  ) {
    return value;
  }

  const cleaned =
    String(value || "")
      .replace(/[^\d.]/g, "");

  const number =
    Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
}


/* =========================================================
   IMAGE HELPERS
========================================================= */

function getProductImage(product) {

  const possibleImages = [

    product.image,

    product.imageUrl,

    product.image_url,

    product.thumbnail,

    product.photo,

    product.photoUrl,

    product.photo_url,

    product.img,

    product.images?.[0],

    product.media?.[0]?.url,

    product.media?.[0]

  ];


  for (const image of possibleImages) {

    if (
      typeof image === "string" &&
      image.trim() !== ""
    ) {
      return image;
    }

  }


  return "";
}


/* =========================================================
   PRODUCT NORMALIZATION
========================================================= */

function normalizeProduct(product, index = 0) {

  if (!product || typeof product !== "object") {

    return {
      id: index,
      title: "Fashion Product",
      brand: "Fashion",
      description: "",
      price: 0,
      image: "",
      color: "",
      style: "",
      occasion: "",
      material: "",
      score: null,
      reason: ""
    };

  }


  const title =
    product.title ||
    product.name ||
    product.productName ||
    product.product_name ||
    "Fashion Product";


  const brand =
    product.brand ||
    product.brandName ||
    product.brand_name ||
    "Fashion";


  const description =
    product.description ||
    product.desc ||
    product.summary ||
    "";


  const price =
    product.price ??
    product.cost ??
    product.amount ??
    0;


  const score =
    product.score ??
    product.similarity ??
    product.similarity_score ??
    product.relevance ??
    product.matchScore ??
    product.match_score ??
    null;


  const reason =
    product.reason ||
    product.explanation ||
    product.matchReason ||
    product.match_reason ||
    "";


  return {

    ...product,

    id:
      product.id ??
      product._id ??
      product.product_id ??
      index,

    title,

    brand,

    description,

    price,

    image:
      getProductImage(product),

    color:
      product.color ||
      product.colour ||
      "",

    style:
      product.style ||
      product.category ||
      "",

    occasion:
      product.occasion ||
      "",

    material:
      product.material ||
      "",

    score,

    reason

  };

}


/* =========================================================
   API RESPONSE EXTRACTION
========================================================= */

function extractProducts(data) {

  if (!data) {
    return [];
  }


  if (Array.isArray(data)) {
    return data;
  }


  const possibleArrays = [

    data.products,

    data.results,

    data.items,

    data.data,

    data.matches,

    data.recommendations,

    data.data?.products,

    data.data?.results,

    data.data?.items,

    data.data?.matches

  ];


  for (
    const candidate
    of possibleArrays
  ) {

    if (Array.isArray(candidate)) {
      return candidate;
    }

  }


  return [];
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
  url,
  options = {}
) {

  const response =
    await fetch(
      url,
      {
        ...options,

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
      }
    );


  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  let data;


  if (
    contentType.includes(
      "application/json"
    )
  ) {

    data =
      await response.json();

  } else {

    const text =
      await response.text();

    try {

      data =
        JSON.parse(text);

    } catch {

      data = {
        message: text
      };

    }

  }


  if (!response.ok) {

    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }


  return data;
}


/* =========================================================
   HEALTH CHECK
========================================================= */

async function checkAPIHealth() {

  try {

    const data =
      await apiRequest(
        API_ENDPOINTS.health
      );


    state.apiOnline = true;


    aiStatusButton.textContent =
      "AI ONLINE";

    aiStatusButton.classList.add(
      "online"
    );


    engineStatus.classList.add(
      "online"
    );


    const products =
      extractProducts(data);


    const reportedCount =
      data?.productCount ??
      data?.products ??
      data?.indexedProducts ??
      null;


    if (
      typeof reportedCount === "number"
    ) {

      productCount.textContent =
        reportedCount;

    }


    return data;

  } catch (error) {

    console.warn(
      "API health check failed:",
      error
    );


    state.apiOnline = false;


    aiStatusButton.textContent =
      "API OFFLINE";


    engineStatus.classList.remove(
      "online"
    );


    return null;

  }

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

  try {

    const data =
      await apiRequest(
        API_ENDPOINTS.products
      );


    const rawProducts =
      extractProducts(data);


    state.products =
      rawProducts.map(
        normalizeProduct
      );


    productCount.textContent =
      state.products.length;


    return state.products;

  } catch (error) {

    console.error(
      "Product loading failed:",
      error
    );

    return [];

  }

}


/* =========================================================
   SEARCH API
========================================================= */

async function searchProducts(query) {

  const trimmedQuery =
    query.trim();


  if (!trimmedQuery) {

    showSearchMessage(
      "Type something like “black oversized shirt”."
    );

    return;

  }


  state.currentQuery =
    trimmedQuery;


  setLoading(true);


  hideError();

  hideEmpty();


  resultsTitle.textContent =
    "AI fashion matches";


  resultsSubtitle.textContent =
    `Results for “${trimmedQuery}”`;


  try {

    /*
      Main request.

      The backend may accept different
      parameter names. We send the
      standard "query" format first.
    */

    let data;


    try {

      data =
        await apiRequest(
          API_ENDPOINTS.search,
          {
            method: "POST",

            body: JSON.stringify({
              query: trimmedQuery
            })
          }
        );

    } catch (postError) {

      /*
        Fallback for APIs using GET.
      */

      console.warn(
        "POST search failed. Trying GET fallback.",
        postError
      );


      const encoded =
        encodeURIComponent(
          trimmedQuery
        );


      data =
        await apiRequest(
          `${API_ENDPOINTS.search}?query=${encoded}`
        );

    }


    const rawResults =
      extractProducts(data);


    state.results =
      rawResults.map(
        normalizeProduct
      );


    /*
      If search endpoint returns
      no results, perform local fallback
      against already loaded products.
    */

    if (
      state.results.length === 0 &&
      state.products.length > 0
    ) {

      state.results =
        localSearch(
          trimmedQuery,
          state.products
        );

    }


    renderResults();


    showSearchMessage(
      `${state.results.length} AI matches found.`
    );


  } catch (error) {

    console.error(
      "Search failed:",
      error
    );


    /*
      Local fallback keeps the UI
      usable even if the search endpoint
      is temporarily unavailable.
    */

    if (
      state.products.length > 0
    ) {

      state.results =
        localSearch(
          trimmedQuery,
          state.products
        );


      renderResults();


      if (
        state.results.length > 0
      ) {

        showSearchMessage(
          "Showing locally ranked matches."
        );

      } else {

        showError(
          error.message ||
          "Unable to search products."
        );

      }

    } else {

      showError(
        error.message ||
        "Unable to connect to the Fashion AI API."
      );

    }

  } finally {

    setLoading(false);

  }

}


/* =========================================================
   LOCAL SEMANTIC-LIKE FALLBACK
========================================================= */

function localSearch(
  query,
  products
) {

  const words =
    query
      .toLowerCase()
      .split(/\s+/)
      .filter(
        word => word.length > 1
      );


  const scored =
    products.map(
      product => {

        const searchable = [

          product.title,

          product.brand,

          product.description,

          product.color,

          product.style,

          product.occasion,

          product.material

        ]
          .join(" ")
          .toLowerCase();


        let score = 0;


        for (
          const word
          of words
        ) {

          if (
            searchable.includes(word)
          ) {

            score += 1;

          }

        }


        return {
          ...product,
          localScore: score
        };

      }
    );


  return scored
    .filter(
      product =>
        product.localScore > 0
    )
    .sort(
      (a, b) =>
        b.localScore -
        a.localScore
    );

}


/* =========================================================
   SCORE
========================================================= */

function getScore(product) {

  const value =
    product.score ??
    product.localScore ??
    null;


  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return null;

  }


  let number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {

    return null;

  }


  /*
    Convert 0–1 similarity
    to percentage.
  */

  if (
    number > 0 &&
    number <= 1
  ) {

    number *= 100;

  }


  /*
    If backend already returns
    percentage.
  */

  number =
    Math.max(
      0,
      Math.min(
        100,
        number
      )
    );


  return Math.round(number);

}


/* =========================================================
   AI REASON
========================================================= */

function getReason(
  product,
  score
) {

  if (
    product.reason
  ) {

    return product.reason;

  }


  if (
    score !== null
  ) {

    if (score >= 90) {

      return "Excellent semantic match for your fashion request.";

    }


    if (score >= 75) {

      return "Strong match based on your requested style.";

    }


    if (score >= 60) {

      return "Relevant match with several matching attributes.";

    }

  }


  return "Relevant fashion discovery based on your search.";
}


/* =========================================================
   IMAGE HTML
========================================================= */

function createImageHTML(
  product
) {

  if (!product.image) {

    return `
      <div class="image-fallback">
        FASHION IMAGE
      </div>
    `;

  }


  return `
    <img
      class="product-image"
      src="${escapeHTML(product.image)}"
      alt="${escapeHTML(product.title)}"
      loading="lazy"
      onerror="this.parentElement.innerHTML='<div class=&quot;image-fallback&quot;>FASHION IMAGE</div>'"
    />
  `;

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(
  product
) {

  const score =
    getScore(product);


  const price =
    formatPrice(
      product.price
    );


  const reason =
    getReason(
      product,
      score
    );


  const color =
    product.color ||
    "—";


  const style =
    product.style ||
    "—";


  const occasion =
    product.occasion ||
    "—";


  const material =
    product.material ||
    "—";


  return `

    <article
      class="product-card"
      data-price="${getNumericPrice(product.price)}"
    >

      ${
        score !== null
          ? `
            <div class="ai-score">
              ${score}% AI MATCH
            </div>
          `
          : ""
      }


      <div class="product-image-wrapper">

        ${createImageHTML(product)}

      </div>


      <div class="product-content">

        <div class="product-brand">
          ${escapeHTML(product.brand)}
        </div>


        <h3 class="product-title">
          ${escapeHTML(product.title)}
        </h3>


        ${
          product.description
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
          ${escapeHTML(price)}
        </div>


        <div class="product-meta">

          <div class="meta-item">
            <span>Colour</span>
            ${escapeHTML(color)}
          </div>

          <div class="meta-item">
            <span>Style</span>
            ${escapeHTML(style)}
          </div>

          <div class="meta-item">
            <span>Occasion</span>
            ${escapeHTML(occasion)}
          </div>

          <div class="meta-item">
            <span>Material</span>
            ${escapeHTML(material)}
          </div>

        </div>


        <div class="ai-reason">

          <strong>AI insight:</strong>

          ${escapeHTML(reason)}

        </div>


        <button
          type="button"
          class="product-button"
          data-product-id="${escapeHTML(product.id)}"
        >
          View Product
        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   FILTER RESULTS
========================================================= */

function getFilteredResults() {

  if (
    state.activeFilter === "all"
  ) {

    return state.results;

  }


  if (
    state.activeFilter === "low"
  ) {

    return state.results.filter(
      product =>
        getNumericPrice(
          product.price
        ) < 2000
    );

  }


  if (
    state.activeFilter === "high"
  ) {

    return state.results.filter(
      product =>
        getNumericPrice(
          product.price
        ) >= 2000
    );

  }


  return state.results;

}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults() {

  const results =
    getFilteredResults();


  productGrid.innerHTML = "";


  resultCount.textContent =
    `${results.length} ${
      results.length === 1
        ? "result"
        : "results"
    }`;


  if (
    state.results.length === 0
  ) {

    showEmpty(
      "No fashion matches found.",
      "Try a broader search such as black shirt, summer dress, or sneakers."
    );

    return;

  }


  hideEmpty();


  if (
    results.length === 0
  ) {

    productGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✦</div>
        <h3>No products in this filter</h3>
        <p>
          Try another filter or return to All.
        </p>
      </div>
    `;

    return;

  }


  productGrid.innerHTML =
    results
      .map(createProductCard)
      .join("");


  attachProductButtons();

}


/* =========================================================
   PRODUCT BUTTONS
========================================================= */

function attachProductButtons() {

  const buttons =
    document.querySelectorAll(
      ".product-button"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.productId;


          const product =
            state.results.find(
              item =>
                String(item.id) ===
                String(id)
            );


          if (!product) {
            return;
          }


          if (
            product.url ||
            product.link
          ) {

            window.open(
              product.url ||
              product.link,
              "_blank",
              "noopener,noreferrer"
            );

            return;

          }


          alert(
            `${product.title}\n\n${formatPrice(product.price)}`
          );

        }
      );

    }
  );

}


/* =========================================================
   UI STATES
========================================================= */

function setLoading(isLoading) {

  state.loading =
    isLoading;


  if (isLoading) {

    loadingState.classList.remove(
      "hidden"
    );

    productGrid.innerHTML = "";

    emptyState.classList.add(
      "hidden"
    );

    errorState.classList.add(
      "hidden"
    );

    searchButton.classList.add(
      "loading"
    );

    searchButton.textContent =
      "Searching...";

    return;

  }


  loadingState.classList.add(
    "hidden"
  );

  searchButton.classList.remove(
    "loading"
  );

  searchButton.textContent =
    "Search";

}


function showEmpty(
  title,
  description
) {

  emptyState.classList.remove(
    "hidden"
  );


  const heading =
    emptyState.querySelector("h3");


  const paragraph =
    emptyState.querySelector("p");


  if (heading) {
    heading.textContent =
      title;
  }


  if (paragraph) {
    paragraph.textContent =
      description;
  }

}


function hideEmpty() {

  emptyState.classList.add(
    "hidden"
  );

}


function showError(
  message
) {

  errorMessage.textContent =
    message;


  errorState.classList.remove(
    "hidden"
  );


  productGrid.innerHTML = "";

}


function hideError() {

  errorState.classList.add(
    "hidden"
  );

}


function showSearchMessage(
  message
) {

  searchStatus.textContent =
    message;

}


/* =========================================================
   FILTER EVENTS
========================================================= */

function setupFilters() {

  const filters =
    document.querySelectorAll(
      ".filter"
    );


  filters.forEach(
    filter => {

      filter.addEventListener(
        "click",
        () => {

          filters.forEach(
            item =>
              item.classList.remove(
                "active"
              )
          );


          filter.classList.add(
            "active"
          );


          state.activeFilter =
            filter.dataset.filter;


          renderResults();

        }
      );

    }
  );

}


/* =========================================================
   SUGGESTION EVENTS
========================================================= */

function setupSuggestions() {

  const suggestions =
    document.querySelectorAll(
      ".suggestion"
    );


  suggestions.forEach(
    suggestion => {

      suggestion.addEventListener(
        "click",
        () => {

          const query =
            suggestion.dataset.query;


          searchInput.value =
            query;


          searchProducts(
            query
          );


          document
            .getElementById("results")
            .scrollIntoView({
              behavior: "smooth"
            });

        }
      );

    }
  );

}


/* =========================================================
   SEARCH FORM
========================================================= */

function setupSearch() {

  searchForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      searchProducts(
        searchInput.value
      );

    }
  );


  searchInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        searchProducts(
          searchInput.value
        );

      }

    }
  );

}


/* =========================================================
   RETRY
========================================================= */

function setupRetry() {

  retryButton.addEventListener(
    "click",
    async () => {

      hideError();

      await checkAPIHealth();

      await loadProducts();


      if (
        state.currentQuery
      ) {

        await searchProducts(
          state.currentQuery
        );

      }

    }
  );

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeApp() {

  console.log(
    "Fashion AI Discovery initializing..."
  );


  console.log(
    "API:",
    API_BASE_URL
  );


  setupSearch();

  setupSuggestions();

  setupFilters();

  setupRetry();


  /*
    Check backend first.
  */

  await checkAPIHealth();


  /*
    Load available products.
  */

  const products =
    await loadProducts();


  /*
    Show initial products if
    backend returned products.
  */

  if (
    products.length > 0
  ) {

    state.results =
      products;


    productCount.textContent =
      products.length;

  }


  console.log(
    "Fashion AI Discovery ready."
  );

}


/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);
