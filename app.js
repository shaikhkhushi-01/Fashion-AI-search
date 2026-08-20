/* =====================================================
   ABAIRA — GLOBAL FASHION AI
   COMPLETE FRONTEND APP.JS
===================================================== */


/* =====================================================
   CONFIGURATION
===================================================== */

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
   HTML SAFETY
===================================================== */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =====================================================
   FORMAT PRICE
===================================================== */

function formatPrice(product) {

  const price =
    Number(product?.price);

  if (Number.isNaN(price)) {
    return "Price unavailable";
  }

  const currency =
    product?.currency || "₹";

  return (
    escapeHTML(currency) +
    price.toLocaleString("en-IN")
  );
}


/* =====================================================
   MATCH SCORE
===================================================== */

function getMatchScore(product) {

  let score =
    product?.matchScore ??
    product?.similarity ??
    product?.score ??
    0;

  score =
    Number(score);

  if (score <= 1) {
    score = score * 100;
  }

  score =
    Math.round(score);

  score =
    Math.max(
      0,
      Math.min(100, score)
    );

  return score;
}


/* =====================================================
   LOADING UI
===================================================== */

function showLoading(message) {

  resultsContainer.innerHTML = `
    <div class="no-results">

      <h3>
        ${escapeHTML(
          message ||
          "Finding your fashion matches..."
        )}
      </h3>

      <p>
        ABAIRA AI is analysing the fashion collection.
      </p>

    </div>
  `;
}


/* =====================================================
   ERROR UI
===================================================== */

function showError(message) {

  resultsContainer.innerHTML = `
    <div class="no-results">

      <h3>
        Something went wrong.
      </h3>

      <p>
        ${escapeHTML(
          message ||
          "Please try again."
        )}
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
        Try another colour, style, occasion,
        material or fashion description.
      </p>

    </div>
  `;
}


/* =====================================================
   PRODUCT IMAGE
===================================================== */

function getProductImage(product) {

  if (
    product &&
    typeof product.image === "string" &&
    product.image.trim() !== ""
  ) {
    return product.image.trim();
  }

  return "";
}


/* =====================================================
   PRODUCT CARD
===================================================== */

function createProductCard(product) {

  const image =
    getProductImage(product);

  const matchScore =
    getMatchScore(product);

  const brand =
    escapeHTML(
      product?.brand ||
      "ABAIRA"
    );

  const name =
    escapeHTML(
      product?.name ||
      "Fashion Product"
    );

  const category =
    escapeHTML(
      product?.category ||
      "Fashion"
    );

  const description =
    escapeHTML(
      product?.description ||
      "Discover this fashion piece with ABAIRA."
    );

  const color =
    escapeHTML(
      product?.color ||
      ""
    );

  const style =
    escapeHTML(
      product?.style ||
      ""
    );

  const occasion =
    escapeHTML(
      product?.occasion ||
      ""
    );

  const materialValue =
    Array.isArray(product?.material)
      ? product.material.join(", ")
      : product?.material || "";

  const material =
    escapeHTML(materialValue);

  const hasImage =
    image !== "";

  const imageHTML =
    hasImage
      ? `
        <img
          src="${escapeHTML(image)}"
          alt="${name}"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        >

        <div
          class="product-image-fallback"
          style="display:none;"
        >
          <span>
            ${category}
          </span>
        </div>
      `
      : `
        <div class="product-image-fallback">
          <span>
            ${category}
          </span>
        </div>
      `;


  return `
    <article
      class="product-card"
      data-product-id="${escapeHTML(
        product?.id ?? ""
      )}"
    >

      <div class="product-image">

        ${imageHTML}

        ${
          matchScore > 0
            ? `
              <div class="match-score">
                ${matchScore}% Match
              </div>
            `
            : ""
        }

      </div>


      <div class="product-content">

        <div class="product-top">

          <span class="product-brand">
            ${brand}
          </span>

          <span class="product-category">
            ${category}
          </span>

        </div>


        <h3>
          ${name}
        </h3>


        <p class="product-description">
          ${description}
        </p>


        <div class="product-details">

          ${
            color
              ? `
                <span>
                  Colour: ${color}
                </span>
              `
              : ""
          }

          ${
            style
              ? `
                <span>
                  Style: ${style}
                </span>
              `
              : ""
          }

          ${
            occasion
              ? `
                <span>
                  Occasion: ${occasion}
                </span>
              `
              : ""
          }

          ${
            material
              ? `
                <span>
                  Material: ${material}
                </span>
              `
              : ""
          }

        </div>


        ${
          matchScore > 0
            ? `
              <div class="match-bar">

                <div
                  class="match-bar-fill"
                  style="width:${matchScore}%"
                ></div>

              </div>
            `
            : ""
        }


        <div class="product-bottom">

          <div class="product-price">
            ${formatPrice(product)}
          </div>


          ${
            product?.url
              ? `
                <a
                  class="view-product"
                  href="${escapeHTML(product.url)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Product
                </a>
              `
              : ""
          }

        </div>

      </div>

    </article>
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


  resultsContainer.innerHTML = `

    <div class="results-header">

      <div>

        <span class="eyebrow">
          ABAIRA AI DISCOVERY
        </span>

        <h2>
          ${productList.length}
          fashion matches
        </h2>

      </div>

    </div>


    <div class="product-grid">

      ${productList
        .map(createProductCard)
        .join("")}

    </div>

  `;
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
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          query: query
        })
      }
    );


  let data = {};

  try {

    data =
      await response.json();

  } catch (error) {

    throw new Error(
      "Server returned an invalid response."
    );
  }


  if (!response.ok) {

    throw new Error(
      data.error ||
      "Search request failed."
    );
  }


  if (
    !Array.isArray(data.results)
  ) {

    throw new Error(
      "No valid search results were returned."
    );
  }


  return data.results;
}


/* =====================================================
   RUN SEARCH
===================================================== */

async function runSearch() {

  const query =
    searchInput
      ?.value
      ?.trim() || "";


  if (!query) {

    showNoResults();

    return;
  }


  showLoading(
    "Finding the best fashion matches..."
  );


  if (searchButton) {

    searchButton.disabled =
      true;

    searchButton.textContent =
      "Searching...";
  }


  try {

    const results =
      await searchFashion(query);


    console.log(
      "ABAIRA Search Results:",
      results
    );


    renderProducts(results);


    const discover =
      document.getElementById(
        "discover"
      );


    if (discover) {

      discover.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  } catch (error) {

    console.error(
      "ABAIRA Search Error:",
      error
    );


    showError(
      error.message ||
      "Search service unavailable."
    );

  } finally {

    if (searchButton) {

      searchButton.disabled =
        false;

      searchButton.textContent =
        "Search";
    }

  }
}


/* =====================================================
   AI STYLIST
===================================================== */

async function runAIStylist() {

  const occasion =
    document
      .getElementById(
        "stylistOccasion"
      )
      ?.value
      ?.trim() || "";


  const style =
    document
      .getElementById(
        "stylistStyle"
      )
      ?.value
      ?.trim() || "";


  const comfort =
    document
      .getElementById(
        "stylistComfort"
      )
      ?.value
      ?.trim() || "";


  const color =
    document
      .getElementById(
        "stylistColor"
      )
      ?.value
      ?.trim() || "";


  const coverage =
    document
      .getElementById(
        "stylistCoverage"
      )
      ?.value
      ?.trim() || "";


  const description =
    document
      .getElementById(
        "stylistDescription"
      )
      ?.value
      ?.trim() || "";


  const hasPreferences =
    Boolean(
      occasion ||
      style ||
      comfort ||
      color ||
      coverage ||
      description
    );


  if (!hasPreferences) {

    showError(
      "Please tell ABAIRA at least one thing about your style."
    );

    return;
  }


  if (stylistButton) {

    stylistButton.disabled =
      true;

    stylistButton.innerHTML =
      "<span>✦</span> Finding Your Style...";
  }


  showLoading(
    "AI Stylist is creating your recommendations..."
  );


  const preferences = {

    occasion: occasion,

    style: style,

    comfort: comfort,

    color: color,

    coverage: coverage,

    description: description

  };


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

          body:
            JSON.stringify(
              preferences
            )
        }
      );


    let data = {};

    try {

      data =
        await response.json();

    } catch (error) {

      throw new Error(
        "AI Stylist returned an invalid server response."
      );
    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI Stylist request failed."
      );
    }


    console.log(
      "ABAIRA AI Stylist Results:",
      data
    );


    const recommendations =
      Array.isArray(
        data.recommendations
      )
        ? data.recommendations
        : [];


    if (
      recommendations.length === 0
    ) {

      showNoResults();

      return;
    }


    renderStylistResults(
      recommendations
    );


    const discover =
      document.getElementById(
        "discover"
      );


    if (discover) {

      discover.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  } catch (error) {

    console.error(
      "ABAIRA AI Stylist Error:",
      error
    );


    showError(
      error.message ||
      "AI Stylist could not connect to the server."
    );

  } finally {

    if (stylistButton) {

      stylistButton.disabled =
        false;

      stylistButton.innerHTML =
        "<span>✦</span> Find My Style";
    }

  }
}


/* =====================================================
   STYLIST RESULTS
===================================================== */

function renderStylistResults(
  recommendationList
) {

  if (
    !Array.isArray(
      recommendationList
    ) ||
    recommendationList.length === 0
  ) {

    showNoResults();

    return;
  }


  resultsContainer.innerHTML = `

    <div class="results-header">

      <div>

        <span class="eyebrow">
          PERSONAL AI STYLIST
        </span>

        <h2>
          Your recommended pieces
        </h2>

        <p>
          Ranked according to your preferences.
        </p>

      </div>

    </div>


    <div class="product-grid">

      ${recommendationList
        .map(createStylistCard)
        .join("")}

    </div>

  `;
}


/* =====================================================
   STYLIST PRODUCT CARD
===================================================== */

function createStylistCard(product) {

  const image =
    getProductImage(product);

  const score =
    getMatchScore(product);


  const brand =
    escapeHTML(
      product?.brand ||
      "ABAIRA"
    );


  const name =
    escapeHTML(
      product?.name ||
      "Fashion Product"
    );


  const category =
    escapeHTML(
      product?.category ||
      "Fashion"
    );


  const description =
    escapeHTML(
      product?.description ||
      ""
    );


  const color =
    escapeHTML(
      product?.color ||
      ""
    );


  const materialValue =
    Array.isArray(
      product?.material
    )
      ? product.material.join(", ")
      : product?.material || "";


  const material =
    escapeHTML(
      materialValue
    );


  const imageHTML =
    image
      ? `
        <img
          src="${escapeHTML(image)}"
          alt="${name}"
          loading="lazy"
          onerror="this.style.display='none';"
        >
      `
      : `
        <div class="product-image-fallback">
          <span>
            ${category}
          </span>
        </div>
      `;


  return `
    <article
      class="product-card stylist-card"
    >

      <div class="product-image">

        ${imageHTML}

        <div class="match-score">
          ${score}% Match
        </div>

      </div>


      <div class="product-content">

        <span class="product-brand">
          ${brand}
        </span>


        <h3>
          ${name}
        </h3>


        <p class="product-description">
          ${description}
        </p>


        <div class="product-details">

          ${
            category
              ? `
                <span>
                  ${category}
                </span>
              `
              : ""
          }

          ${
            color
              ? `
                <span>
                  ${color}
                </span>
              `
              : ""
          }

          ${
            material
              ? `
                <span>
                  ${material}
                </span>
              `
              : ""
          }

        </div>


        <div class="match-bar">

          <div
            class="match-bar-fill"
            style="width:${score}%"
          ></div>

        </div>


        <div class="product-bottom">

          <div class="product-price">
            ${formatPrice(product)}
          </div>


          ${
            product?.url
              ? `
                <a
                  class="view-product"
                  href="${escapeHTML(product.url)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Product
                </a>
              `
              : ""
          }

        </div>

      </div>

    </article>
  `;
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
    function(event) {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

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
  .querySelectorAll(
    ".search-hints button"
  )
  .forEach(
    function(button) {

      button.addEventListener(
        "click",
        function() {

          const query =
            button.textContent
              .trim();


          if (searchInput) {

            searchInput.value =
              query;

          }


          runSearch();

        }
      );

    }
  );


/* =====================================================
   INITIAL STATE
===================================================== */

if (resultsContainer) {

  resultsContainer.innerHTML = `

    <div class="no-results">

      <h3>
        Start discovering fashion.
      </h3>

      <p>
        Search for a style, occasion,
        colour, material or budget above.
      </p>

    </div>

  `;

}


/* =====================================================
   BACKEND HEALTH CHECK
===================================================== */

async function checkBackend() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/api/health`
      );


    if (!response.ok) {

      console.warn(
        "ABAIRA backend health check failed."
      );

      return false;
    }


    const data =
      await response.json();


    console.log(
      "ABAIRA Backend:",
      data
    );


    return true;

  } catch (error) {

    console.warn(
      "ABAIRA backend is unreachable:",
      error
    );


    return false;
  }

}


/* =====================================================
   START
===================================================== */

checkBackend();
