const API_BASE_URL =
  "https://fashion-ai-search-lj6s.onrender.com";

/* =====================================================
   DOM ELEMENTS
===================================================== */

const resultsContainer =
  document.getElementById("results");

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");

const stylistButton =
  document.getElementById("stylistButton");


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(text) {

  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =====================================================
   LOADING
===================================================== */

function showLoading(message = "Finding the best matches...") {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        ${escapeHTML(message)}
      </h3>

      <p>
        ABAIRA AI is analysing the collection.
      </p>

    </div>

  `;

}


/* =====================================================
   NO RESULTS
===================================================== */

function showNoResults() {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        No matching products found.
      </h3>

      <p>
        Try another fashion description.
      </p>

    </div>

  `;

}


/* =====================================================
   ERROR
===================================================== */

function showError(message) {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        Something went wrong.
      </h3>

      <p>
        ${escapeHTML(message)}
      </p>

    </div>

  `;

}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts(productList) {

  if (
    !Array.isArray(productList) ||
    productList.length === 0
  ) {

    showNoResults();

    return;

  }


  resultsContainer.innerHTML =
    productList
      .map(product => {

        const price =
          Number(product.price);


        const formattedPrice =
          Number.isNaN(price)
            ? product.price || ""
            : price.toLocaleString("en-IN");


        return `

          <article class="product-card">

            <div class="product-image">

              <span>
                ${escapeHTML(
                  product.category || "Fashion"
                )}
              </span>

            </div>


            <div class="product-content">

              <span class="product-brand">

                ${escapeHTML(
                  product.brand || ""
                )}

              </span>


              <h3>

                ${escapeHTML(
                  product.name || ""
                )}

              </h3>


              <p>

                ${escapeHTML(
                  product.description || ""
                )}

              </p>


              <div class="product-price">

                ${escapeHTML(
                  product.currency || "₹"
                )}

                ${formattedPrice}

              </div>


              ${
                product.explanation
                  ? `
                    <div class="product-match">

                      ${escapeHTML(
                        product.explanation
                      )}

                    </div>
                  `
                  : ""
              }

            </div>

          </article>

        `;

      })
      .join("");

}


/* =====================================================
   SEARCH API
===================================================== */

async function searchFashion(query) {

  const response =
    await fetch(
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
      data.error ||
      "Search failed."
    );

  }


  return data.results || [];

}


/* =====================================================
   RUN SEARCH
===================================================== */

async function runSearch() {

  const query =
    searchInput.value.trim();


  if (!query) {

    showNoResults();

    return;

  }


  showLoading(
    "Searching fashion..."
  );


  try {

    const results =
      await searchFashion(query);


    renderProducts(results);

  }

  catch (error) {

    console.error(
      "Search error:",
      error
    );


    showError(
      "Unable to connect to the fashion AI backend."
    );

  }

}


/* =====================================================
   AI STYLIST API
===================================================== */

async function runAIStylist() {

  const occasion =
    document
      .getElementById("stylistOccasion")
      ?.value
      .trim() || "";


  const style =
    document
      .getElementById("stylistStyle")
      ?.value
      .trim() || "";


  const comfort =
    document
      .getElementById("stylistComfort")
      ?.value
      .trim() || "";


  const color =
    document
      .getElementById("stylistColor")
      ?.value
      .trim() || "";


  const coverage =
    document
      .getElementById("stylistCoverage")
      ?.value
      .trim() || "";


  const description =
    document
      .getElementById("stylistDescription")
      ?.value
      .trim() || "";


  const hasPreferences =
    [
      occasion,
      style,
      comfort,
      color,
      coverage,
      description
    ].some(Boolean);


  if (!hasPreferences) {

    alert(
      "Please tell ABAIRA what kind of style you are looking for."
    );

    return;

  }


  showLoading(
    "Your AI Stylist is creating your recommendations..."
  );


  try {

    const response =
      await fetch(
        `${API_BASE_URL}/api/stylist`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
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


    renderProducts(
      data.recommendations || []
    );


    document
      .getElementById("discover")
      ?.scrollIntoView({
        behavior: "smooth"
      });


  }

  catch (error) {

    console.error(
      "AI Stylist error:",
      error
    );


    showError(
      "Unable to connect to the AI Stylist."
    );

  }

}


/* =====================================================
   SEARCH BUTTON
===================================================== */

if (searchButton) {

  searchButton.addEventListener(
    "click",
    runSearch
  );

}


/* =====================================================
   ENTER KEY SEARCH
===================================================== */

if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        runSearch();

      }

    }
  );

}


/* =====================================================
   AI STYLIST BUTTON
===================================================== */

if (stylistButton) {

  stylistButton.addEventListener(
    "click",
    runAIStylist
  );

}


/* =====================================================
   SEARCH HINT BUTTONS
===================================================== */

document
  .querySelectorAll(".search-hints button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const query =
          button.textContent.trim();


        searchInput.value =
          query;


        runSearch();

      }
    );

  });


/* =====================================================
   INITIAL STATE
===================================================== */

resultsContainer.innerHTML = `

  <div class="no-results">

    <h3>
      Start discovering fashion.
    </h3>

    <p>
      Search for a style, occasion, colour,
      material or budget above.
    </p>

  </div>

`;
