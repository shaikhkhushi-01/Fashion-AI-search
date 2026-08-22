/*
=========================================================
FASHION AI DISCOVERY
DAY 3 FRONTEND
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
PRODUCT IMAGE
=========================================================
*/

function productVisual(product) {

  const image =
    product.image ||
    product.imageUrl ||
    product.imageURL ||
    product.thumbnail ||
    product.photo ||
    "";

  if (image) {

    return `
      <img
        class="product-image"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(
          product.name || "Fashion product"
        )}"
        loading="lazy"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      >

      <div
        class="product-visual"
        style="display:none;"
      >

        <div class="visual-grid"></div>

        <div class="visual-fashion">

          <span>
            FASHION AI
          </span>

          <strong>
            ${escapeHTML(
              product.category || "Fashion"
            )}
          </strong>

          <small>
            ${escapeHTML(
              product.name || "Product"
            )}
          </small>

        </div>

      </div>
    `;
  }

  return `
    <div class="product-visual">

      <div class="visual-grid"></div>

      <div class="visual-fashion">

        <span>
          FASHION AI
        </span>

        <strong>
          ${escapeHTML(
            product.category || "Fashion"
          )}
        </strong>

        <small>
          ${escapeHTML(
            product.name || "Fashion Product"
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

function showLoading(message) {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <div class="loading-spinner"></div>

      <h3>
        ${escapeHTML(
          message ||
          "AI is searching..."
        )}
      </h3>

      <p>
        Understanding your fashion request.
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
        AI search unavailable
      </h3>

      <p>
        ${escapeHTML(
          message ||
          "Something went wrong."
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
        Try another colour, style,
        occasion or budget.
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

function createProductCard(product) {

  const matchScore =
    Math.max(
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
            product.description ||
            "AI-selected fashion product."
          )}
        </p>


        <div class="product-price">

          ₹${formatPrice(product.price)}

          <span>
            INR
          </span>

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
                  Why AI selected this
                </strong>

                <ul>

                  ${reasons
                    .slice(0, 3)
                    .map(
                      reason => `
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
GET PRODUCTS
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
    Array.isArray(data.products)
      ? data.products
      : [];

}


/*
=========================================================
SEARCH API
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
            "application/json"
        },

        body: JSON.stringify({
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
    searchInput.value.trim();


  if (!query) {

    if (allProducts.length) {

      renderProducts(
        allProducts
      );

      searchSummary.textContent =
        `${allProducts.length} products available for AI discovery.`;
    }

    return;
  }


  searchButton.disabled = true;

  searchButton.textContent =
    "AI searching...";


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


    renderProducts(
      results,
      query
    );


    if (data.budget) {

      searchSummary.textContent =
        `AI-ranked results for "${query}" · budget detected: ₹${formatPrice(data.budget)}`;
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

    searchButton.disabled = false;

    searchButton.textContent =
      "Search with AI";
  }
}


/*
=========================================================
AI STYLIST
=========================================================
*/

async function runAIStylist() {

  const occasion =
    document
      .getElementById(
        "stylistOccasion"
      )
      .value;


  const style =
    document
      .getElementById(
        "stylistStyle"
      )
      .value;


  const comfort =
    document
      .getElementById(
        "stylistComfort"
      )
      .value;


  const color =
    document
      .getElementById(
        "stylistColor"
      )
      .value
      .trim();


  const coverage =
    document
      .getElementById(
        "stylistCoverage"
      )
      .value;


  const description =
    document
      .getElementById(
        "stylistDescription"
      )
      .value
      .trim();


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


  stylistButton.disabled = true;

  stylistButton.textContent =
    "AI is styling your look...";


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
              "application/json"
          },

          body: JSON.stringify({
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
      data.recommendations || [];


    if (!recommendations.length) {

      showNoResults();

      return;
    }


    renderProducts(
      recommendations,
      data.query ||
      description
    );


    searchSummary.textContent =
      "Personalised recommendations generated by the AI Stylist";


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
      "AI Stylist Error:",
      error
    );


    showError(
      error.message ||
      "AI Stylist could not complete the request."
    );


  } finally {

    stylistButton.disabled = false;

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

        searchInput.value =
          button.textContent.trim();

        runSearch();
      }
    );
  });


/*
=========================================================
BACKEND HEALTH CHECK
=========================================================
*/

async function checkBackend() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/api/health`
      );


    if (!response.ok) {
      throw new Error(
        "Backend unavailable"
      );
    }


    const data =
      await response.json();


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

  showLoading(
    "Connecting to Fashion AI..."
  );


  const backendOnline =
    await checkBackend();


  if (!backendOnline) {

    showError(
      "Fashion AI backend is currently unavailable. Please try again in a moment."
    );

    return;
  }


  try {

    await loadProducts();


    if (!allProducts.length) {

      showError(
        "The AI catalogue is empty."
      );

      return;
    }


    renderProducts(
      allProducts.slice(0, 6)
    );


    resultCount.textContent =
      "AI catalogue ready";


    searchSummary.textContent =
      `${allProducts.length} products available for AI discovery.`;


    console.log(
      `Fashion AI ready. ${allProducts.length} products loaded.`
    );


  } catch (error) {

    console.error(
      "Initialization error:",
      error
    );


    showError(
      error.message ||
      "Could not load the fashion catalogue."
    );
  }
}


initialize();
