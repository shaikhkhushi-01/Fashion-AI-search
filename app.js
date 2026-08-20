/* =====================================================
   ABAIRA — GLOBAL FASHION AI
   FRONTEND APP.JS
===================================================== */


/* =====================================================
   API CONFIG
===================================================== */

const API_BASE_URL =
  "https://fashion-ai-search-lj6s.onrender.com";


/* =====================================================
   FALLBACK PRODUCTS
   Used if backend is temporarily unavailable.
===================================================== */

const fallbackProducts = [

  {
    id: 1,
    brand: "ATELIER",
    name: "Relaxed Linen Shirt",
    category: "Shirts",
    color: "White",
    material: "Linen",
    price: 2499,
    currency: "₹",
    description:
      "Relaxed-fit lightweight linen shirt for warm weather and everyday comfort."
  },

  {
    id: 2,
    brand: "NOVA",
    name: "Oversized Cotton Shirt",
    category: "Shirts",
    color: "Black",
    material: "Cotton",
    price: 1999,
    currency: "₹",
    description:
      "Minimal oversized cotton shirt with a clean silhouette for casual everyday styling."
  },

  {
    id: 3,
    brand: "FORM",
    name: "Minimal Summer Dress",
    category: "Dresses",
    color: "Cream",
    material: "Cotton",
    price: 3299,
    currency: "₹",
    description:
      "Lightweight summer dress with a relaxed elegant fit."
  },

  {
    id: 4,
    brand: "STUDIO 09",
    name: "Relaxed Black Trousers",
    category: "Trousers",
    color: "Black",
    material: "Cotton Blend",
    price: 2799,
    currency: "₹",
    description:
      "Straight relaxed trousers designed for everyday wear."
  },

  {
    id: 5,
    brand: "MOTION",
    name: "Performance Sneakers",
    category: "Sneakers",
    color: "White",
    material: "Mesh",
    price: 4499,
    currency: "₹",
    description:
      "Lightweight performance sneakers for everyday movement."
  },

  {
    id: 6,
    brand: "NOVA",
    name: "Structured Black Blazer",
    category: "Blazers",
    color: "Black",
    material: "Wool Blend",
    price: 5999,
    currency: "₹",
    description:
      "Clean structured blazer designed for formal occasions."
  }

];


/* =====================================================
   PRODUCT STORE
===================================================== */

let products = [...fallbackProducts];


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
   NORMALIZE
===================================================== */

function normalize(text) {

  return String(text || "")
    .toLowerCase()
    .trim();

}


/* =====================================================
   LOADING
===================================================== */

function showLoading(
  message = "Finding the best matches..."
) {

  if (!resultsContainer) return;

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

  if (!resultsContainer) return;

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

  if (!resultsContainer) return;

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
   PRODUCT RENDER
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
            ? String(product.price || "")
            : price.toLocaleString("en-IN");


        const explanation =
          product.explanation ||
          "";


        const matchScore =
          product.matchScore ??
          product.stylistScore ??
          null;


        return `

          <article class="product-card">

            <div class="product-image">

              <span>
                ${escapeHTML(
                  product.category ||
                  "FASHION"
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
                explanation
                  ? `

                    <div class="product-match">

                      ${escapeHTML(
                        explanation
                      )}

                    </div>

                  `
                  : ""
              }


              ${
                matchScore !== null
                  ? `

                    <div class="stylist-match">

                      AI Match:
                      ${escapeHTML(matchScore)}%

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
   LOCAL SEARCH FALLBACK
===================================================== */

function localSearch(query) {

  const normalizedQuery =
    normalize(query);


  if (!normalizedQuery) {

    return products;

  }


  const words =
    normalizedQuery
      .split(/\s+/)
      .filter(Boolean);


  return products

    .map(product => {

      const searchableText =
        normalize(

          [

            product.brand,

            product.name,

            product.category,

            product.color,

            product.material,

            product.description,

            ...(Array.isArray(product.tags)
              ? product.tags
              : [])

          ]

            .filter(Boolean)

            .join(" ")

        );


      const name =
        normalize(product.name);

      const brand =
        normalize(product.brand);

      const category =
        normalize(product.category);

      const color =
        normalize(product.color);


      let score = 0;


      words.forEach(word => {

        if (
          searchableText.includes(word)
        ) {

          score += 1;

        }


        if (
          name.includes(word)
        ) {

          score += 5;

        }


        if (
          brand.includes(word)
        ) {

          score += 3;

        }


        if (
          category.includes(word)
        ) {

          score += 3;

        }


        if (
          color.includes(word)
        ) {

          score += 3;

        }

      });


      return {

        ...product,

        score

      };

    })

    .filter(
      product =>
        product.score > 0
    )

    .sort(
      (a, b) =>
        b.score - a.score
    );

}


/* =====================================================
   API REQUEST HELPER
===================================================== */

async function fetchJSON(
  url,
  options = {}
) {

  const response =
    await fetch(
      url,
      {
        ...options,
        mode: "cors"
      }
    );


  const text =
    await response.text();


  let data = null;


  try {

    data =
      text
        ? JSON.parse(text)
        : {};

  }

  catch {

    data = {
      raw: text
    };

  }


  if (!response.ok) {

    throw new Error(

      data?.error ||

      data?.message ||

      `HTTP ${response.status}`

    );

  }


  return data;

}


/* =====================================================
   LOAD PRODUCTS FROM BACKEND
===================================================== */

async function loadProducts() {

  try {

    console.log(
      "Loading products from:",
      `${API_BASE_URL}/api/products`
    );


    const data =
      await fetchJSON(
        `${API_BASE_URL}/api/products`,
        {
          method: "GET"
        }
      );


    if (
      Array.isArray(data.products) &&
      data.products.length > 0
    ) {

      products =
        data.products;

      console.log(
        `Loaded ${products.length} products from API.`
      );

      return;

    }


    console.warn(
      "API returned no products. Using fallback products."
    );

  }

  catch (error) {

    console.warn(
      "Could not load products from backend.",
      error
    );

    console.warn(
      "Using fallback products."
    );

  }

}


/* =====================================================
   SEARCH API
===================================================== */

async function searchFashion(query) {

  console.log(
    "ABAIRA SEARCH:",
    query
  );


  try {

    const data =
      await fetchJSON(

        `${API_BASE_URL}/api/search`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({
              query: query
            })

        }

      );


    console.log(
      "SEARCH API RESPONSE:",
      data
    );


    if (
      Array.isArray(data.results)
    ) {

      return data.results;

    }


    return [];

  }

  catch (error) {

    console.error(
      "SEARCH API ERROR:",
      error
    );


    /*
      IMPORTANT:

      If Render temporarily fails,
      frontend will still search
      loaded products locally.
    */

    console.log(
      "Using local search fallback..."
    );


    return localSearch(query);

  }

}


/* =====================================================
   RUN SEARCH
===================================================== */

async function runSearch() {

  if (!searchInput) {

    console.error(
      "searchInput not found."
    );

    return;

  }


  const query =
    searchInput.value.trim();


  if (!query) {

    renderProducts(products);

    return;

  }


  showLoading(
    "Finding your style..."
  );


  try {

    const results =
      await searchFashion(query);


    console.log(
      "FINAL SEARCH RESULTS:",
      results
    );


    if (
      !Array.isArray(results) ||
      results.length === 0
    ) {

      showNoResults();

      return;

    }


    renderProducts(results);


  }

  catch (error) {

    console.error(
      "Search failed:",
      error
    );


    showError(
      "Search could not be completed. Please try again."
    );

  }

}


/* =====================================================
   AI STYLIST
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

    occasion ||
    style ||
    comfort ||
    color ||
    coverage ||
    description;


  if (!hasPreferences) {

    alert(
      "Please tell ABAIRA what kind of style you are looking for."
    );

    return;

  }


  if (stylistButton) {

    stylistButton.disabled = true;

    stylistButton.innerHTML =
      "Finding Your Style...";

  }


  showLoading(
    "Your AI Stylist is creating your recommendations..."
  );


  try {

    const data =

      await fetchJSON(

        `${API_BASE_URL}/api/stylist`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:

            JSON.stringify({

              occasion,

              style,

              comfort,

              color,

              coverage,

              description

            })

        }

      );


    console.log(
      "AI STYLIST RESPONSE:",
      data
    );


    const recommendations =
      Array.isArray(
        data.recommendations
      )
        ? data.recommendations
        : [];


    if (
      !recommendations.length
    ) {

      showNoResults();

      return;

    }


    renderProducts(
      recommendations
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
      "AI Stylist could not connect to the server."
    );

  }

  finally {

    if (stylistButton) {

      stylistButton.disabled =
        false;

      stylistButton.innerHTML =
        "<span>✦</span> Find My Style";

    }

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
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if (!searchInput) return;


        searchInput.value =
          button.textContent.trim();


        runSearch();

      }
    );

  });


/* =====================================================
   INITIALIZE APP
===================================================== */

async function initializeApp() {

  console.log(
    "ABAIRA frontend starting..."
  );


  if (resultsContainer) {

    showLoading(
      "Loading fashion collection..."
    );

  }


  await loadProducts();


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


  console.log(
    "ABAIRA frontend ready."
  );


  console.log(
    `Products available: ${products.length}`
  );

}


initializeApp();
