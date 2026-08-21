/*
=========================================================
FASHION AI DISCOVERY
DAY 2 FRONTEND
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
FORMAT PRICE
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

  const category =
    String(
      product.category ||
      "Fashion"
    );

  const name =
    String(
      product.name ||
      "Fashion"
    );

  const visualText =
    `${category} / ${name}`;

  return `
    <div class="product-visual">

      <div class="visual-grid"></div>

      <div class="visual-fashion">

        <span>
          FASHION AI
        </span>

        <strong>
          ${escapeHTML(
            category
          )}
        </strong>

        <small>
          ${escapeHTML(
            name
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
        Converting your request into a
        semantic representation.
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
        AI search unavailable
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
        No strong fashion matches found.
      </h3>

      <p>
        Try describing the colour, style,
        occasion or budget differently.
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

  const matchScore =
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

  const occasions =
    Array.isArray(
      product.occasion
    )
      ? product.occasion
      : [];

  const styles =
    Array.isArray(
      product.style
    )
      ? product.style
      : [];

  const material =
    Array.isArray(
      product.material
    )
      ? product.material
      : [];

  return `

    <article
      class="product-card"
    >

      <div class="product-image-wrap">

        ${productVisual(
          product
        )}

        <div class="ai-match-badge">
          ${matchScore}% AI MATCH
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


        <h3
          class="product-title"
        >
          ${escapeHTML(
            product.name ||
            "Fashion Product"
          )}
        </h3>


        <p
          class="product-description"
        >
          ${escapeHTML(
            product.description ||
            ""
          )}
        </p>


        <div class="product-price">

          ${formatPrice(
            product.price
          )}

          <span>
            INR
          </span>

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
                      styles.slice(0, 2).join(", ")
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
                      occasions.slice(0, 2).join(", ")
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

          <div
            class="match-score-header"
          >

            <span>
              AI relevance
            </span>

            <strong>
              ${matchScore}%
            </strong>

          </div>

          <div
            class="match-score-bar"
          >

            <div
              class="match-score-fill"
              style="
                width:${matchScore}%;
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
        (product) =>
          createProductCard(
            product
          )
      )
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
GET ALL PRODUCTS
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

    if (
      !response.ok
    ) {
      throw new Error(
        data.error ||
        "Unable to load products."
      );
    }

    allProducts =
      data.products || [];

  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );
  }
}

/*
=========================================================
AI SEARCH API
=========================================================
*/

async function searchFashion(
  query
) {

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
          JSON.stringify({
            query,
          }),
      }
    );

  const data =
    await response.json();

  if (
    !response.ok
  ) {
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

    if (
      allProducts.length
    ) {
      renderProducts(
        allProducts
      );
    }

    return;
  }

  showLoading(
    "Understanding your fashion request..."
  );

  try {

    const data =
      await searchFashion(
        query
      );

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

    const budget =
      data.budget;

    if (
      budget
    ) {

      searchSummary.textContent =
        `AI-ranked results for "${query}" · budget detected: ₹${formatPrice(
          budget
        )}`;

    }

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
      "AI Search Error:",
      error
    );

    showError(
      error.message ||
      "Please try again."
    );
  }
}

/*
=========================================================
STYLIST API
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
      .value;

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
      description,
    ].some(Boolean);


  if (!hasInput) {

    alert(
      "Please describe at least one part of your desired look."
    );

    return;
  }


  stylistButton.disabled =
    true;

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


    if (
      !response.ok
    ) {

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
      "Personalised recommendations generated by the AI Stylist";


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
      "AI Stylist error:",
      error
    );

    showError(
      error.message ||
      "AI Stylist could not complete the request."
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

    if (
      event.key ===
      "Enter"
    ) {
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
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          searchInput.value =
            button.textContent.trim();

          runSearch();
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
        Loading the intelligent fashion catalogue.
      </p>

    </div>

  `;

  await loadProducts();


  if (
    allProducts.length
  ) {

    renderProducts(
      allProducts
        .slice(0, 6)
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
