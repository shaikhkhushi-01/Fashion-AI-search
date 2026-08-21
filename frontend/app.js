```javascript
/* =========================================================
   ABAIRA — FRONTEND
   Semantic Search + AI Stylist
========================================================= */

const API_BASE_URL =
  "https://fashion-ai-search-lj6s.onrender.com";


/* =========================================================
   DOM
========================================================= */

const resultsContainer =
  document.getElementById("results");

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");

const stylistButton =
  document.getElementById("stylistButton");


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   IMAGE URL
========================================================= */

function getProductImage(product) {
  if (product && product.image) {
    return product.image;
  }

  return "";
}


/* =========================================================
   LOADING
========================================================= */

function showLoading(message) {

  resultsContainer.innerHTML = `
    <div class="no-results">
      <h3>${escapeHTML(message)}</h3>
      <p>ABAIRA is analysing the fashion collection.</p>
    </div>
  `;

}


/* =========================================================
   NO RESULTS
========================================================= */

function showNoResults() {

  resultsContainer.innerHTML = `
    <div class="no-results">
      <h3>No matching products found.</h3>
      <p>Try another fashion description.</p>
    </div>
  `;

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

  resultsContainer.innerHTML = `
    <div class="no-results">
      <h3>Something went wrong.</h3>
      <p>${escapeHTML(message)}</p>
    </div>
  `;

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(product) {

  const priceNumber =
    Number(product.price);

  const formattedPrice =
    Number.isFinite(priceNumber)
      ? priceNumber.toLocaleString("en-IN")
      : escapeHTML(product.price || "");


  const image =
    getProductImage(product);


  const explanation =
    product.explanation ||
    (
      Array.isArray(product.reasons)
        ? product.reasons.join(". ")
        : ""
    );


  const matchScore =
    Number.isFinite(Number(product.matchScore))
      ? Number(product.matchScore)
      : null;


  return `
    <article class="product-card">

      <div class="product-image">

        ${
          image
            ? `
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.name || "Fashion product")}"
                loading="lazy"
                onerror="this.style.display='none'; this.parentElement.classList.add('image-failed');"
              >
            `
            : `
              <div class="image-placeholder">
                ${escapeHTML(product.category || "FASHION")}
              </div>
            `
        }

        <span class="product-category">
          ${escapeHTML(product.category || "FASHION")}
        </span>

      </div>


      <div class="product-content">

        <span class="product-brand">
          ${escapeHTML(product.brand || "")}
        </span>


        <h3 class="product-title">
          ${escapeHTML(product.name || "")}
        </h3>


        <p class="product-description">
          ${escapeHTML(product.description || "")}
        </p>


        <div class="product-details">

          ${
            product.color
              ? `
                <span>
                  Colour: ${escapeHTML(product.color)}
                </span>
              `
              : ""
          }

          ${
            product.style &&
            Array.isArray(product.style)
              ? `
                <span>
                  Style: ${escapeHTML(product.style.join(", "))}
                </span>
              `
              : ""
          }

        </div>


        <div class="product-price">
          ${escapeHTML(product.currency || "INR")}
          ${formattedPrice}
        </div>


        ${
          matchScore !== null
            ? `
              <div class="product-match">
                AI Match: ${matchScore}%
              </div>
            `
            : ""
        }


        ${
          explanation
            ? `
              <p class="product-explanation">
                ${escapeHTML(explanation)}
              </p>
            `
            : ""
        }

      </div>

    </article>
  `;

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

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
      .map(createProductCard)
      .join("");

}


/* =========================================================
   SEARCH API
========================================================= */

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


  /*
     IMPORTANT:
     Backend returns:

     {
       success: true,
       results: [...]
     }
  */

  return Array.isArray(data.results)
    ? data.results
    : [];

}


/* =========================================================
   RUN SEARCH
========================================================= */

async function runSearch() {

  const query =
    searchInput
      ? searchInput.value.trim()
      : "";


  if (!query) {

    showError(
      "Please enter something to search."
    );

    return;

  }


  showLoading(
    "Finding your fashion matches..."
  );


  if (searchButton) {
    searchButton.disabled = true;
    searchButton.textContent = "Searching...";
  }


  try {

    const results =
      await searchFashion(query);


    renderProducts(results);


  } catch (error) {

    console.error(
      "ABAIRA search error:",
      error
    );


    showError(
      error.message ||
      "Unable to connect to ABAIRA AI."
    );

  }


  if (searchButton) {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }

}


/* =========================================================
   AI STYLIST
========================================================= */

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


  if (stylistButton) {
    stylistButton.disabled = true;
    stylistButton.innerHTML = "Finding Your Style...";
  }


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
        "AI Stylist request failed."
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


  } catch (error) {

    console.error(
      "AI Stylist error:",
      error
    );


    showError(
      error.message ||
      "Unable to connect to the AI Stylist."
    );

  }


  if (stylistButton) {

    stylistButton.disabled = false;

    stylistButton.innerHTML =
      "<span>✦</span> Find My Style";

  }

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
    function(event) {

      if (event.key === "Enter") {
        runSearch();
      }

    }
  );

}


/* =========================================================
   STYLIST BUTTON
========================================================= */

if (stylistButton) {

  stylistButton.addEventListener(
    "click",
    runAIStylist
  );

}


/* =========================================================
   SEARCH HINTS
========================================================= */

document
  .querySelectorAll(".search-hints button")
  .forEach(button => {

    button.addEventListener(
      "click",
      function() {

        const query =
          button.textContent.trim();


        if (searchInput) {
          searchInput.value = query;
        }


        runSearch();

      }
    );

  });


/* =========================================================
   INITIAL MESSAGE
========================================================= */

if (resultsContainer) {

  resultsContainer.innerHTML = `
    <div class="no-results">
      <h3>Start discovering fashion.</h3>
      <p>
        Search for a style, occasion, colour,
        material or budget above.
      </p>
    </div>
  `;

}


console.log(
  "ABAIRA frontend loaded successfully."
);
```
