/* =====================================================
   ABAIRA — GLOBAL FASHION AI
   FRONTEND APP.JS
===================================================== */

const API_BASE_URL = "https://fashion-ai-search-lj6s.onrender.com";


/* =====================================================
   LOCAL FALLBACK PRODUCTS
===================================================== */

const products = [
  {
    id: 1,
    brand: "ATELIER",
    name: "Relaxed Linen Shirt",
    category: "Shirts",
    color: "White",
    material: "Linen",
    price: 2499,
    currency: "₹",
    description: "Relaxed-fit lightweight linen shirt designed for warm weather and everyday comfort."
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
    description: "Minimal oversized cotton shirt with a clean silhouette for casual everyday styling."
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
    description: "Lightweight summer dress with a relaxed elegant fit."
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
    description: "Straight relaxed trousers designed for everyday wear."
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
    description: "Lightweight performance sneakers for everyday movement."
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
    description: "Clean structured blazer designed for formal occasions."
  }
];


/* =====================================================
   DOM ELEMENTS
===================================================== */

const resultsContainer = document.getElementById("results");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const stylistButton = document.getElementById("stylistButton");

const stylistOccasion = document.getElementById("stylistOccasion");
const stylistStyle = document.getElementById("stylistStyle");
const stylistComfort = document.getElementById("stylistComfort");
const stylistColor = document.getElementById("stylistColor");
const stylistCoverage = document.getElementById("stylistCoverage");
const stylistDescription = document.getElementById("stylistDescription");


/* =====================================================
   BASIC HELPERS
===================================================== */

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim();
}


function escapeHTML(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =====================================================
   LOCAL SEARCH FALLBACK
===================================================== */

function localSearchProducts(query) {

  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return products;
  }

  const words = normalizedQuery
    .split(/\s+/)
    .filter(Boolean);

  return products
    .map(function(product) {

      const searchableText = normalize([
        product.brand,
        product.name,
        product.category,
        product.color,
        product.material,
        product.description
      ].join(" "));

      let score = 0;

      words.forEach(function(word) {

        if (searchableText.includes(word)) {
          score += 1;
        }

        if (normalize(product.name).includes(word)) {
          score += 5;
        }

        if (normalize(product.brand).includes(word)) {
          score += 3;
        }

        if (normalize(product.category).includes(word)) {
          score += 3;
        }

        if (normalize(product.color).includes(word)) {
          score += 3;
        }

        if (normalize(product.material).includes(word)) {
          score += 2;
        }

      });

      return {
        ...product,
        score: score
      };

    })
    .filter(function(product) {
      return product.score > 0;
    })
    .sort(function(a, b) {
      return b.score - a.score;
    });
}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts(productList) {

  if (!resultsContainer) {
    console.error("Results container not found.");
    return;
  }

  if (!Array.isArray(productList) || productList.length === 0) {

    resultsContainer.innerHTML =
      '<div class="no-results">' +
        '<h3>No matching products found.</h3>' +
        '<p>Try another fashion description.</p>' +
      '</div>';

    return;
  }


  resultsContainer.innerHTML = productList
    .map(function(product) {

      const brand = escapeHTML(product.brand || "BRAND");
      const name = escapeHTML(product.name || "Fashion Product");
      const description = escapeHTML(
        product.description || "Fashion product"
      );

      const category = escapeHTML(
        product.category || "FASHION"
      );

      const currency = product.currency || "₹";

      const price = Number(product.price || 0)
        .toLocaleString("en-IN");


      let explanation = "";

      if (product.explanation) {
        explanation =
          '<div class="product-explanation">' +
          escapeHTML(product.explanation) +
          '</div>';
      }


      return (
        '<article class="product-card">' +

          '<div class="product-image">' +
            '<span>' +
              category +
            '</span>' +
          '</div>' +

          '<div class="product-content">' +

            '<span class="product-brand">' +
              brand +
            '</span>' +

            '<h3>' +
              name +
            '</h3>' +

            '<p>' +
              description +
            '</p>' +

            '<div class="product-price">' +
              currency +
              ' ' +
              price +
            '</div>' +

            explanation +

          '</div>' +

        '</article>'
      );

    })
    .join("");
}


/* =====================================================
   LOADING STATE
===================================================== */

function showLoading(message) {

  if (!resultsContainer) {
    return;
  }

  resultsContainer.innerHTML =
    '<div class="no-results">' +
      '<h3>' +
        escapeHTML(message || "Finding your style...") +
      '</h3>' +
      '<p>Please wait a moment.</p>' +
    '</div>';
}


/* =====================================================
   SEARCH API
===================================================== */

async function searchFashion(query) {

  try {

    const response = await fetch(
      API_BASE_URL + "/api/search",
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


    console.log("ABAIRA API SEARCH:", data);

    return Array.isArray(data.results)
      ? data.results
      : [];

  }

  catch (error) {

    console.error(
      "Backend search error:",
      error
    );

    return null;
  }
}


/* =====================================================
   MAIN SEARCH
===================================================== */

async function runSearch() {

  if (!searchInput) {
    return;
  }


  const query =
    searchInput.value.trim();


  if (!query) {

    renderProducts(products);

    return;
  }


  showLoading(
    "Searching ABAIRA fashion intelligence..."
  );


  const apiResults =
    await searchFashion(query);


  /*
    If backend works:
    use backend results.

    If backend fails:
    use local search.
  */

  if (
    Array.isArray(apiResults) &&
    apiResults.length > 0
  ) {

    renderProducts(apiResults);

    return;
  }


  /*
    Backend returned no results.
    Try local fallback.
  */

  const localResults =
    localSearchProducts(query);


  renderProducts(localResults);
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

      if (event.key === "Enter") {

        event.preventDefault();

        runSearch();

      }

    }
  );

}


/* =====================================================
   SEARCH HINT BUTTONS
===================================================== */

document
  .querySelectorAll(".search-hints button")
  .forEach(function(button) {

    button.addEventListener(
      "click",
      function() {

        if (!searchInput) {
          return;
        }

        searchInput.value =
          button.textContent.trim();

        runSearch();

      }
    );

  });


/* =====================================================
   AI STYLIST API
===================================================== */

async function searchStylist(preferences) {

  try {

    const response = await fetch(
      API_BASE_URL + "/api/stylist",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(preferences)
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error || "AI Stylist failed"
      );

    }


    console.log(
      "ABAIRA AI STYLIST:",
      data
    );


    return Array.isArray(
      data.recommendations
    )
      ? data.recommendations
      : [];

  }

  catch (error) {

    console.error(
      "AI Stylist error:",
      error
    );

    return null;
  }
}


/* =====================================================
   AI STYLIST LOCAL FALLBACK
===================================================== */

function localStylistSearch(preferences) {

  const query = normalize([
    preferences.occasion,
    preferences.style,
    preferences.comfort,
    preferences.color,
    preferences.coverage,
    preferences.description
  ].join(" "));


  if (!query) {
    return [];
  }


  return localSearchProducts(query)
    .slice(0, 10);
}


/* =====================================================
   RUN AI STYLIST
===================================================== */

async function runStylist() {

  const preferences = {

    occasion:
      stylistOccasion
        ? stylistOccasion.value.trim()
        : "",

    style:
      stylistStyle
        ? stylistStyle.value.trim()
        : "",

    comfort:
      stylistComfort
        ? stylistComfort.value.trim()
        : "",

    color:
      stylistColor
        ? stylistColor.value.trim()
        : "",

    coverage:
      stylistCoverage
        ? stylistCoverage.value.trim()
        : "",

    description:
      stylistDescription
        ? stylistDescription.value.trim()
        : ""

  };


  const hasPreferences =
    Object.values(preferences)
      .some(function(value) {
        return value.length > 0;
      });


  if (!hasPreferences) {

    alert(
      "Please tell me at least one thing about the style you are looking for."
    );

    return;
  }


  if (stylistButton) {

    stylistButton.disabled = true;

    stylistButton.innerHTML =
      "<span>✦</span> Finding Your Style...";

  }


  /*
    Scroll to results area.
  */

  if (resultsContainer) {

    resultsContainer.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }


  showLoading(
    "Your AI stylist is analysing your preferences..."
  );


  const apiResults =
    await searchStylist(preferences);


  if (
    Array.isArray(apiResults) &&
    apiResults.length > 0
  ) {

    renderProducts(apiResults);

  }
  else {

    const localResults =
      localStylistSearch(preferences);

    renderProducts(localResults);

  }


  if (stylistButton) {

    stylistButton.disabled = false;

    stylistButton.innerHTML =
      "<span>✦</span> Find My Style";

  }

}


/* =====================================================
   STYLIST BUTTON
===================================================== */

if (stylistButton) {

  stylistButton.addEventListener(
    "click",
    runStylist
  );

}


/* =====================================================
   INITIAL PRODUCTS
===================================================== */

renderProducts(products);


/* =====================================================
   DEBUG MESSAGE
===================================================== */

console.log(
  "ABAIRA app.js loaded successfully."
);

console.log(
  "Backend:",
  API_BASE_URL
);
