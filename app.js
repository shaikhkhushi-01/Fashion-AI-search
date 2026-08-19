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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Search failed"
      );
    }

    console.log("AI Search Results:", data);

    return Array.isArray(data.results)
      ? data.results
      : [];

  } catch (error) {
    console.error(
      "Fashion AI search error:",
      error
    );

    resultsContainer.innerHTML = `
      <div class="no-results">
        <h3>Search service unavailable.</h3>
        <p>
          Please try again in a moment.
        </p>
      </div>
    `;

    return [];
  }
}

/* =====================================================
   AI STYLIST
===================================================== */

async function runAIStylist() {

  const occasion =
    document.getElementById("stylistOccasion")?.value.trim() || "";

  const style =
    document.getElementById("stylistStyle")?.value.trim() || "";

  const comfort =
    document.getElementById("stylistComfort")?.value.trim() || "";

  const color =
    document.getElementById("stylistColor")?.value.trim() || "";

  const coverage =
    document.getElementById("stylistCoverage")?.value.trim() || "";

  const description =
    document.getElementById("stylistDescription")?.value.trim() || "";


  /* ---------- VALIDATION ---------- */

  if (
    !occasion &&
    !style &&
    !comfort &&
    !color &&
    !coverage &&
    !description
  ) {

    resultsContainer.innerHTML = `
      <div class="no-results">

        <h3>
          Tell us what you're looking for.
        </h3>

        <p>
          Choose at least one preference.
        </p>

      </div>
    `;

    return;
  }


  /* ---------- LOADING ---------- */

  resultsContainer.innerHTML = `
    <div class="stylist-loading">

      <div class="loading-spinner"></div>

      <h3>
        AI Stylist is finding your perfect match...
      </h3>

      <p>
        Analysing style, occasion, comfort and colour preferences.
      </p>

    </div>
  `;


  /* ---------- REQUEST ---------- */

  const preferences = {

    occasion,
    style,
    comfort,
    color,
    coverage,
    description

  };


  try {

    const response =
      await fetch(
        `${API_BASE_URL}/api/stylist`,
        {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body:
            JSON.stringify(
              preferences
            )

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI Stylist request failed."
      );

    }


    console.log(
      "AI Stylist response:",
      data
    );


    renderStylistResults(
      data.recommendations || [],
      preferences
    );

  }

  catch (error) {

    console.error(
      "AI Stylist error:",
      error
    );


    resultsContainer.innerHTML = `

      <div class="no-results">

        <h3>
          AI Stylist is temporarily unavailable.
        </h3>

        <p>
          Please try again in a moment.
        </p>

      </div>

    `;

  }

}


/* =====================================================
   RENDER STYLIST RESULTS
===================================================== */

function renderStylistResults(
  results,
  preferences
) {

  if (
    !Array.isArray(results) ||
    !results.length
  ) {

    resultsContainer.innerHTML = `

      <div class="no-results">

        <h3>
          No close matches found.
        </h3>

        <p>
          Try changing your style, colour or occasion.
        </p>

      </div>

    `;

    return;

  }


  resultsContainer.innerHTML = `

    <div class="stylist-results-header">

      <div>

        <span class="eyebrow">
          AI STYLIST
        </span>

        <h2>
          Your personalised collection
        </h2>

        <p>
          Ranked according to your preferences.
        </p>

      </div>

      <span class="result-count">
        ${results.length} matches
      </span>

    </div>


    <div class="stylist-preferences">

      ${
        createStylistPreference(
          "Occasion",
          preferences.occasion
        )
      }

      ${
        createStylistPreference(
          "Style",
          preferences.style
        )
      }

      ${
        createStylistPreference(
          "Comfort",
          preferences.comfort
        )
      }

      ${
        createStylistPreference(
          "Colour",
          preferences.color
        )
      }

      ${
        createStylistPreference(
          "Coverage",
          preferences.coverage
        )
      }

    </div>


    <div class="product-grid">

      ${
        results
          .map(product =>
            createStylistProductCard(
              product
            )
          )
          .join("")
      }

    </div>

  `;

}


/* =====================================================
   STYLIST PREFERENCE
===================================================== */

function createStylistPreference(
  label,
  value
) {

  if (!value) {
    return "";
  }


  return `

    <span class="stylist-preference">

      <small>
        ${escapeHTML(label)}
      </small>

      ${escapeHTML(value)}

    </span>

  `;

}


/* =====================================================
   STYLIST PRODUCT CARD
===================================================== */

function createStylistProductCard(
  product
) {

  const score =
    Number(product.matchScore || 0);


  const safeScore =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(score)
      )
    );


  return `

    <article class="product-card stylist-card">

      <div class="product-image">

        <div class="ai-match-badge">

          ${safeScore}% Match

        </div>

        <span>
          Fashion Discovery
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
            product.name || "Fashion Item"
          )}

        </h3>


        <p>

          ${escapeHTML(
            product.description || ""
          )}

        </p>


        <div class="stylist-meta">

          ${
            product.category
              ? `
                <span>
                  ${escapeHTML(
                    product.category
                  )}
                </span>
              `
              : ""
          }


          ${
            product.color
              ? `
                <span>
                  ${escapeHTML(
                    product.color
                  )}
                </span>
              `
              : ""
          }


          ${
            product.material
              ? `
                <span>
                  ${
                    escapeHTML(
                      Array.isArray(
                        product.material
                      )
                        ? product.material.join(", ")
                        : product.material
                    )
                  }
                </span>
              `
              : ""
          }

        </div>


        <div class="stylist-score">

          <div class="stylist-score-header">

            <span>
              AI Match
            </span>

            <strong>
              ${safeScore}%
            </strong>

          </div>


          <div class="stylist-score-bar">

            <div
              class="stylist-score-fill"
              style="width:${safeScore}%"
            ></div>

          </div>

        </div>


        <div class="product-price">

          ${escapeHTML(
            product.currency || "₹"
          )}

          ${
            Number(
              product.price || 0
            ).toLocaleString("en-IN")
          }

        </div>

      </div>

    </article>

  `;

}


/* =====================================================
   STYLIST BUTTON
===================================================== */

const stylistButton =
  document.getElementById(
    "stylistButton"
  );


if (stylistButton) {

  stylistButton.addEventListener(
    "click",
    runAIStylist
  );

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
  const query = searchInput.value.trim();

  if (!query) {
    renderProducts(products);
    return;
  }

  resultsContainer.innerHTML = `
    <div class="no-results">
      <h3>Searching...</h3>
      <p>Fashion AI is finding the best matches for you.</p>
    </div>
  `;

  const results = await searchFashion(query);

  if (!results.length) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <h3>No matching products found.</h3>
        <p>
          Try describing a product, brand, colour,
          material or style.
        </p>
      </div>
    `;

    return;
  }

  renderProducts(results);
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

/* =====================================================
   AI STYLIST — BACKEND CONNECTION
===================================================== */

async function getStylistRecommendations(preferences) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/stylist`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          occasion: preferences.occasion || "",
          style: preferences.style || "",
          comfort: preferences.comfort || "",
          color: preferences.color || "",
          coverage: preferences.coverage || "",
          description: preferences.description || ""
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "AI Stylist request failed"
      );
    }

    return data;

  } catch (error) {

    console.error(
      "AI Stylist error:",
      error
    );

    return {
      success: false,
      error: error.message,
      recommendations: []
    };
  }
}


/* =====================================================
   AI STYLIST UI
===================================================== */

function renderStylistResults(results) {

  const container =
    document.getElementById("stylistResults");

  if (!container) {
    console.warn(
      "stylistResults container not found."
    );
    return;
  }


  if (!results || !results.length) {

    container.innerHTML = `
      <div class="no-results">
        <h3>No strong matches found.</h3>

        <p>
          Try changing your style, occasion,
          colour or description.
        </p>
      </div>
    `;

    return;
  }


  container.innerHTML = results
    .map(product => {

      return `
        <article class="product-card stylist-card">

          <div class="product-image">
            <span>AI MATCH</span>
          </div>

          <div class="product-content">

            <span class="product-brand">
              ${escapeHTML(product.brand || "")}
            </span>

            <h3>
              ${escapeHTML(product.name || "")}
            </h3>

            <p>
              ${escapeHTML(product.description || "")}
            </p>

            <div class="product-meta">

              <span>
                ${escapeHTML(product.category || "")}
              </span>

              <span>
                ${escapeHTML(product.color || "")}
              </span>

            </div>

            <div class="product-price">
              ${product.currency || "₹"}
              ${Number(product.price || 0)
                .toLocaleString("en-IN")}
            </div>

            <div class="ai-match-score">
              AI Match:
              ${product.matchScore || product.stylistScore || 0}%
            </div>

          </div>

        </article>
      `;

    })
    .join("");
}


/* =====================================================
   RUN AI STYLIST
===================================================== */

async function runAIStylist() {

  const occasion =
    document.getElementById("stylistOccasion")?.value || "";

  const style =
    document.getElementById("stylistStyle")?.value || "";

  const comfort =
    document.getElementById("stylistComfort")?.value || "";

  const color =
    document.getElementById("stylistColor")?.value || "";

  const coverage =
    document.getElementById("stylistCoverage")?.value || "";

  const description =
    document.getElementById("stylistDescription")?.value || "";


  const button =
    document.getElementById("stylistButton");


  if (button) {

    button.disabled = true;

    button.textContent =
      "Finding your style...";

  }


  const result =
    await getStylistRecommendations({

      occasion,

      style,

      comfort,

      color,

      coverage,

      description

    });


  if (result.success) {

    renderStylistResults(
      result.recommendations || []
    );

  } else {

    const container =
      document.getElementById(
        "stylistResults"
      );

    if (container) {

      container.innerHTML = `
        <div class="no-results">

          <h3>
            AI Stylist couldn't complete the search.
          </h3>

          <p>
            ${escapeHTML(
              result.error ||
              "Please try again."
            )}
          </p>

        </div>
      `;

    }

  }


  if (button) {

    button.disabled = false;

    button.textContent =
      "Find My Style";

  }

}


/* =====================================================
   STYLIST BUTTON
===================================================== */

const stylistButton =
  document.getElementById(
    "stylistButton"
  );


if (stylistButton) {

  stylistButton.addEventListener(
    "click",
    runAIStylist
  );

}


/* =====================================================
   ENTER KEY FOR DESCRIPTION
===================================================== */

const stylistDescription =
  document.getElementById(
    "stylistDescription"
  );


if (stylistDescription) {

  stylistDescription.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        runAIStylist();

      }

    }
  );

}
