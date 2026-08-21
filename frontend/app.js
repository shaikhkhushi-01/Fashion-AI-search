const API_BASE_URL =
  "https://YOUR-RENDER-BACKEND.onrender.com";

const resultsContainer =
  document.getElementById("results");

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// =========================================================
// LOADING
// =========================================================

function showLoading() {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        AI is searching fashion...
      </h3>

      <p>
        Understanding your request and
        finding semantically relevant products.
      </p>

    </div>

  `;

}


// =========================================================
// NO RESULTS
// =========================================================

function showNoResults() {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        No relevant fashion found.
      </h3>

      <p>
        Try describing the style, occasion,
        colour or budget differently.
      </p>

    </div>

  `;

}


// =========================================================
// RENDER PRODUCTS
// =========================================================

function renderProducts(products) {

  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {

    showNoResults();

    return;
  }


  resultsContainer.innerHTML =
    products
      .map(product => {

        const score =
          Number(
            product.ai_match_score || 0
          );


        const material =
          Array.isArray(product.material)
            ? product.material.join(", ")
            : product.material || "";


        const style =
          Array.isArray(product.style)
            ? product.style.join(", ")
            : product.style || "";


        const occasion =
          Array.isArray(product.occasion)
            ? product.occasion.join(", ")
            : product.occasion || "";


        return `

          <article
            class="product-card"
          >

            <div
              class="product-image"
            >

              <span>
                ${escapeHTML(
                  product.category || "Fashion"
                )}
              </span>

            </div>


            <div
              class="product-content"
            >

              <span
                class="product-brand"
              >
                ${escapeHTML(
                  product.brand
                )}
              </span>


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
                class="product-meta"
              >

                <div
                  class="product-meta-item"
                >

                  <span
                    class="product-meta-label"
                  >
                    Colour
                  </span>

                  ${escapeHTML(
                    product.color
                  )}

                </div>


                <div
                  class="product-meta-item"
                >

                  <span
                    class="product-meta-label"
                  >
                    Material
                  </span>

                  ${escapeHTML(
                    material
                  )}

                </div>


                <div
                  class="product-meta-item"
                >

                  <span
                    class="product-meta-label"
                  >
                    Style
                  </span>

                  ${escapeHTML(
                    style
                  )}

                </div>


                <div
                  class="product-meta-item"
                >

                  <span
                    class="product-meta-label"
                  >
                    Occasion
                  </span>

                  ${escapeHTML(
                    occasion
                  )}

                </div>

              </div>


              <div
                class="product-price"
              >

                ₹${Number(
                  product.price || 0
                ).toLocaleString("en-IN")}

              </div>


              <div
                class="stylist-score"
              >

                <div
                  class="stylist-score-header"
                >

                  <span>
                    AI Match
                  </span>

                  <strong>
                    ${score.toFixed(0)}%
                  </strong>

                </div>


                <div
                  class="stylist-score-bar"
                >

                  <div
                    class="stylist-score-fill"
                    style="
                      width:${Math.min(
                        score,
                        100
                      )}%;
                    "
                  ></div>

                </div>

              </div>


              <div
                class="product-reason"
              >

                <strong>
                  AI reasoning
                </strong>

                <br>

                ${escapeHTML(
                  product.ai_reason
                )}

              </div>


              <button
                class="product-button"
                type="button"
                onclick="viewProduct(${product.id})"
              >
                View Product
              </button>

            </div>

          </article>

        `;

      })
      .join("");

}


// =========================================================
// AI SEARCH
// =========================================================

async function searchFashion(query) {

  const cleanQuery =
    String(query || "").trim();


  if (!cleanQuery) {

    showNoResults();

    return;

  }


  showLoading();


  try {

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

            query:
              cleanQuery,

            limit: 10

          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.detail ||
        "AI search failed."
      );

    }


    renderProducts(
      data.results || []
    );


  } catch (error) {

    console.error(
      "Fashion AI Search Error:",
      error
    );


    resultsContainer.innerHTML = `

      <div class="no-results">

        <h3>
          AI search is unavailable.
        </h3>

        <p>
          Please check that the
          Fashion AI backend is running.
        </p>

      </div>

    `;

  }

}


// =========================================================
// SEARCH BUTTON
// =========================================================

searchButton.addEventListener(
  "click",
  () => {

    searchFashion(
      searchInput.value
    );

  }
);


// =========================================================
// ENTER KEY
// =========================================================

searchInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      searchFashion(
        searchInput.value
      );

    }

  }
);


// =========================================================
// SEARCH HINTS
// =========================================================

document
  .querySelectorAll(
    ".search-hints button"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const query =
          button.textContent.trim();


        searchInput.value =
          query;


        searchFashion(
          query
        );

      }
    );

  });


// =========================================================
// PRODUCT ACTION
// =========================================================

function viewProduct(id) {

  const product =
    Number(id);


  alert(
    `Fashion product #${product} selected.`
  );

}


// =========================================================
// INITIAL STATE
// =========================================================

resultsContainer.innerHTML = `

  <div class="no-results">

    <h3>
      AI Fashion Discovery
    </h3>

    <p>
      Describe what you want to wear
      and let the AI find relevant fashion.
    </p>

  </div>

`;
