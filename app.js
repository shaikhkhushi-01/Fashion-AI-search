const API_BASE_URL =
  "https://fashion-ai-search-lj6s.onrender.com";

const resultsContainer =
  document.getElementById("results");

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");


/* ================= HTML SAFETY ================= */

function escapeHTML(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* ================= BACKEND SEARCH ================= */

async function searchFashion(query) {

  try {

    resultsContainer.innerHTML = `
      <div class="search-loading">
        <div class="loading-spinner"></div>
        <p>Finding the best fashion matches...</p>
      </div>
    `;


    const response = await fetch(
      `${API_BASE_URL}/api/search`,
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


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error || "Search failed"
      );

    }


    return data.results || [];


  } catch (error) {

    console.error(
      "Fashion search error:",
      error
    );


    resultsContainer.innerHTML = `
      <div class="no-results">

        <h3>
          Search temporarily unavailable
        </h3>

        <p>
          Please try again in a moment.
        </p>

      </div>
    `;


    return [];

  }

}


/* ================= RENDER PRODUCTS ================= */

function renderProducts(productList) {

  if (!productList.length) {

    resultsContainer.innerHTML = `

      <div class="no-results">

        <h3>
          No matching products found
        </h3>

        <p>
          Try describing the style, color,
          occasion, material or budget differently.
        </p>

      </div>

    `;

    return;

  }


  resultsContainer.innerHTML =
    productList
      .map(product => {

        const price =
          product.price !== undefined &&
          product.price !== null
            ? Number(product.price).toLocaleString(
                "en-IN"
              )
            : "Price unavailable";


        const currency =
          product.currency || "₹";


        const brand =
          escapeHTML(
            product.brand || "Unknown Brand"
          );


        const name =
          escapeHTML(
            product.name || "Fashion Product"
          );


        const category =
          escapeHTML(
            product.category || ""
          );


        const color =
          escapeHTML(
            product.color || ""
          );


        const material =
          Array.isArray(product.material)
            ? product.material.join(", ")
            : product.material || "";


        const description =
          escapeHTML(
            product.description ||
            "No description available."
          );


        return `

          <article class="product-card">

            <div class="product-image">

              <div class="product-placeholder">

                <span>AI</span>

              </div>

            </div>


            <div class="product-content">

              <div class="product-top">

                <span class="product-brand">
                  ${brand}
                </span>

                ${
                  product.score
                    ? `
                      <span class="match-score">
                        ${Math.min(
                          99,
                          Math.max(
                            70,
                            70 + product.score * 2
                          )
                        )}% Match
                      </span>
                    `
                    : ""
                }

              </div>


              <h3>
                ${name}
              </h3>


              <p class="product-category">
                ${category}
              </p>


              <p class="product-description">
                ${description}
              </p>


              <div class="product-details">

                ${
                  color
                    ? `
                      <span>
                        Color: ${color}
                      </span>
                    `
                    : ""
                }

                ${
                  material
                    ? `
                      <span>
                        Material:
                        ${escapeHTML(material)}
                      </span>
                    `
                    : ""
                }

              </div>


              <div class="product-bottom">

                <div class="product-price">

                  ${currency}${price}

                </div>


                <button
                  class="view-product"
                  type="button"
                  onclick="viewProduct(${product.id})"
                >

                  View Product

                </button>

              </div>

            </div>

          </article>

        `;

      })
      .join("");

}


/* ================= SEARCH ================= */

async function runSearch() {

  const query =
    searchInput.value.trim();


  if (!query) {

    searchInput.focus();

    return;

  }


  searchButton.disabled = true;


  const results =
    await searchFashion(query);


  renderProducts(results);


  searchButton.disabled = false;

}


/* ================= VIEW PRODUCT ================= */

function viewProduct(productId) {

  console.log(
    "Selected product:",
    productId
  );

  /*
    Later we will connect this
    to the actual brand/product URL.
  */

}


/* ================= SEARCH BUTTON ================= */

if (searchButton) {

  searchButton.addEventListener(
    "click",
    runSearch
  );

}


/* ================= ENTER SEARCH ================= */

if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        event.preventDefault();

        runSearch();

      }

    }
  );

}


/* ================= SEARCH HINTS ================= */

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


/* ================= INITIAL STATE ================= */

resultsContainer.innerHTML = `

  <div class="search-empty">

    <div class="empty-icon">
      AI
    </div>

    <h3>
      What are you looking for?
    </h3>

    <p>
      Describe any fashion item, style,
      color, occasion or budget.
    </p>

  </div>

`;
