const API_BASE_URL =
  "https://fashion-ai-search-lj6s.onrender.com";


/* =========================================================
   DOM
========================================================= */

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


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
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


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        AI is searching fashion...
      </h3>

      <p>
        Understanding your request and ranking relevant products.
      </p>

    </div>

  `;

}


/* =========================================================
   EMPTY
========================================================= */

function showEmpty() {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        Start your fashion search.
      </h3>

      <p>
        Try something like "minimal black shirt for summer under ₹3000".
      </p>

    </div>

  `;

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        Search temporarily unavailable.
      </h3>

      <p>
        ${escapeHTML(message)}
      </p>

    </div>

  `;

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function renderProduct(product) {

  const score =
    Number(
      product.relevanceScore || 0
    );


  const percentage =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          score * 100
        )
      )
    );


  const price =
    Number(product.price);


  const formattedPrice =
    Number.isFinite(price)
      ? price.toLocaleString(
          "en-IN"
        )
      : product.price;


  const matchedFields =
    Array.isArray(
      product.matchedFields
    )
      ? product.matchedFields
      : [];


  return `

    <article class="product-card">

      <div class="product-image">

        <span
          style="
            display:flex;
            width:100%;
            height:100%;
            align-items:center;
            justify-content:center;
            color:#777;
            font-size:13px;
          "
        >
          Fashion Product
        </span>

      </div>


      <div class="product-content">

        <span class="product-brand">

          ${escapeHTML(
            product.brand
          )}

        </span>


        <h3 class="product-title">

          ${escapeHTML(
            product.name
          )}

        </h3>


        <p class="product-description">

          ${escapeHTML(
            product.description
          )}

        </p>


        <div class="product-price">

          ${escapeHTML(
            product.currency || "₹"
          )}

          ${escapeHTML(
            formattedPrice
          )}

        </div>


        <div class="product-meta">

          <div class="product-meta-item">

            <span class="product-meta-label">
              Category
            </span>

            ${escapeHTML(
              product.category
            )}

          </div>


          <div class="product-meta-item">

            <span class="product-meta-label">
              Colour
            </span>

            ${escapeHTML(
              product.color
            )}

          </div>


          <div class="product-meta-item">

            <span class="product-meta-label">
              Material
            </span>

            ${escapeHTML(
              Array.isArray(
                product.material
              )
                ? product.material.join(", ")
                : product.material || "—"
            )}

          </div>


          <div class="product-meta-item">

            <span class="product-meta-label">
              AI Score
            </span>

            ${percentage}%

          </div>

        </div>


        ${
          matchedFields.length
            ? `

              <div class="product-reason">

                <strong>
                  AI Match
                </strong>

                <br>

                ${escapeHTML(
                  matchedFields.join(
                    " • "
                  )
                )}

              </div>

            `
            : ""
        }


        <div class="stylist-score">

          <div class="stylist-score-header">

            <span>
              AI relevance
            </span>

            <strong>
              ${percentage}%
            </strong>

          </div>


          <div class="stylist-score-bar">

            <div
              class="stylist-score-fill"
              style="
                width:${percentage}%;
              "
            ></div>

          </div>

        </div>


        <button
          class="product-button"
          type="button"
          onclick="selectProduct(${Number(product.id)})"
        >
          View Product
        </button>

      </div>

    </article>

  `;

}


/* =========================================================
   RENDER
========================================================= */

function renderProducts(
  products
) {

  if (
    !Array.isArray(products) ||
    !products.length
  ) {

    resultsContainer.innerHTML = `

      <div class="no-results">

        <h3>
          No matching fashion found.
        </h3>

        <p>
          Try describing the style, colour, occasion or budget differently.
        </p>

      </div>

    `;

    return;

  }


  resultsContainer.innerHTML =
    products
      .map(
        product =>
          renderProduct(
            product
          )
      )
      .join("");

}


/* =========================================================
   AI SEARCH REQUEST
========================================================= */

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


/* =========================================================
   RUN SEARCH
========================================================= */

async function runSearch() {

  const query =
    searchInput.value.trim();


  if (!query) {

    showEmpty();

    return;

  }


  showLoading();


  try {

    const data =
      await searchFashion(
        query
      );


    renderProducts(
      data.results
    );


    console.log(
      "AI understood query:",
      data.understoodQuery
    );


    console.log(
      "AI search response:",
      data
    );

  } catch (error) {

    console.error(
      "Search error:",
      error
    );


    showError(
      error.message
    );

  }

}


/* =========================================================
   PRODUCT
========================================================= */

function selectProduct(
  productId
) {

  console.log(
    "Selected product:",
    productId
  );

}


/* =========================================================
   SEARCH BUTTON
========================================================= */

if (searchButton) {

  searchButton.addEventListener(
    "click",
    runSearch
  );

}


/* =========================================================
   ENTER KEY
========================================================= */

if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        runSearch();

      }

    }
  );

}


/* =========================================================
   SEARCH HINTS
========================================================= */

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


/* =========================================================
   INITIAL STATE
========================================================= */

showEmpty();
