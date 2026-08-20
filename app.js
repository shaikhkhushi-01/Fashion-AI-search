/* =====================================================
   ABAIRA — GLOBAL FASHION AI
   COMPLETE FRONTEND APP.JS
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
    gender: "Women",
    price: 2499,
    currency: "INR",
    color: "White",
    material: ["Linen"],
    occasion: ["Summer", "Casual", "Travel"],
    style: ["Minimal", "Relaxed", "Comfortable"],
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["breathable", "lightweight", "everyday"],
    availability: "In Stock",
    description:
      "Relaxed-fit lightweight linen shirt designed for warm weather and everyday comfort.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
    productUrl: "#"
  },

  {
    id: 2,
    brand: "NOVA",
    name: "Oversized Cotton Shirt",
    category: "Shirts",
    gender: "Women",
    price: 1999,
    currency: "INR",
    color: "Black",
    material: ["Cotton"],
    occasion: ["Casual", "Daily", "College"],
    style: ["Oversized", "Minimal", "Modern"],
    sizes: ["S", "M", "L", "XL"],
    tags: ["oversized", "cotton", "everyday"],
    availability: "In Stock",
    description:
      "Minimal oversized cotton shirt with a clean silhouette for casual everyday styling.",
    image:
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=85",
    productUrl: "#"
  },

  {
    id: 3,
    brand: "FORM",
    name: "Minimal Summer Dress",
    category: "Dresses",
    gender: "Women",
    price: 3299,
    currency: "INR",
    color: "Cream",
    material: ["Cotton"],
    occasion: ["Summer", "Casual", "Date"],
    style: ["Minimal", "Elegant", "Relaxed"],
    sizes: ["XS", "S", "M", "L"],
    tags: ["summer", "lightweight", "minimal"],
    availability: "In Stock",
    description:
      "Lightweight summer dress with a relaxed elegant fit.",
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=85",
    productUrl: "#"
  },

  {
    id: 4,
    brand: "STUDIO 09",
    name: "Relaxed Black Trousers",
    category: "Trousers",
    gender: "Women",
    price: 2799,
    currency: "INR",
    color: "Black",
    material: ["Cotton Blend"],
    occasion: ["Office", "Casual", "Daily"],
    style: ["Relaxed", "Minimal", "Modern"],
    sizes: ["S", "M", "L", "XL"],
    tags: ["comfortable", "everyday", "office"],
    availability: "In Stock",
    description:
      "Straight relaxed trousers designed for everyday wear.",
    image:
      "https://images.unsplash.com/photo-1506629905607-d9f9b0f3a3c7?auto=format&fit=crop&w=900&q=85",
    productUrl: "#"
  },

  {
    id: 5,
    brand: "MOTION",
    name: "Performance Sneakers",
    category: "Sneakers",
    gender: "Unisex",
    price: 4499,
    currency: "INR",
    color: "White",
    material: ["Mesh"],
    occasion: ["Casual", "Travel", "Daily"],
    style: ["Modern", "Comfortable", "Minimal"],
    sizes: ["6", "7", "8", "9", "10"],
    tags: ["lightweight", "comfortable", "sport"],
    availability: "In Stock",
    description:
      "Lightweight performance sneakers for everyday movement.",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
    productUrl: "#"
  },

  {
    id: 6,
    brand: "NOVA",
    name: "Structured Black Blazer",
    category: "Blazers",
    gender: "Women",
    price: 5999,
    currency: "INR",
    color: "Black",
    material: ["Wool Blend"],
    occasion: ["Formal", "Office", "Evening"],
    style: ["Minimal", "Elegant", "Classic"],
    sizes: ["S", "M", "L", "XL"],
    tags: ["formal", "office", "structured"],
    availability: "In Stock",
    description:
      "Clean structured blazer designed for formal occasions.",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=85",
    productUrl: "#"
  }
];


/* =====================================================
   DOM
===================================================== */

const resultsContainer =
  document.getElementById("results");

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");

const stylistButton =
  document.getElementById("stylistButton");

const stylistOccasion =
  document.getElementById("stylistOccasion");

const stylistStyle =
  document.getElementById("stylistStyle");

const stylistComfort =
  document.getElementById("stylistComfort");

const stylistColor =
  document.getElementById("stylistColor");

const stylistCoverage =
  document.getElementById("stylistCoverage");

const stylistDescription =
  document.getElementById("stylistDescription");


/* =====================================================
   HELPERS
===================================================== */

function normalize(text) {

  return String(text || "")
    .toLowerCase()
    .trim();

}


function escapeHTML(text) {

  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function arrayToText(value) {

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value || "");

}


function formatPrice(product) {

  const price =
    Number(product.price);

  if (Number.isNaN(price)) {
    return escapeHTML(
      String(product.price || "")
    );
  }

  const currency =
    product.currency === "₹"
      ? "INR"
      : product.currency || "INR";

  try {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 0
      }
    ).format(price);

  } catch (error) {

    return "₹ " +
      price.toLocaleString("en-IN");

  }

}


/* =====================================================
   FALLBACK IMAGE
===================================================== */

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85";


/* =====================================================
   LOCAL SEARCH
===================================================== */

function localSearchProducts(query) {

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

    .map(function(product) {

      const searchableText =
        normalize(
          [
            product.brand,
            product.name,
            product.category,
            product.color,
            arrayToText(product.material),
            arrayToText(product.occasion),
            arrayToText(product.style),
            arrayToText(product.tags),
            product.description
          ].join(" ")
        );


      let score = 0;


      words.forEach(function(word) {

        if (
          searchableText.includes(word)
        ) {

          score += 1;

        }


        if (
          normalize(product.name)
            .includes(word)
        ) {

          score += 5;

        }


        if (
          normalize(product.brand)
            .includes(word)
        ) {

          score += 3;

        }


        if (
          normalize(product.category)
            .includes(word)
        ) {

          score += 3;

        }


        if (
          normalize(product.color)
            .includes(word)
        ) {

          score += 3;

        }


        if (
          normalize(
            arrayToText(product.material)
          ).includes(word)
        ) {

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
   LOADING
===================================================== */

function showLoading(message) {

  if (!resultsContainer) {
    return;
  }


  resultsContainer.innerHTML =

    '<div class="no-results">' +

      '<h3>' +
        escapeHTML(
          message ||
          "Finding your style..."
        ) +
      '</h3>' +

      '<p>Please wait a moment.</p>' +

    '</div>';

}


/* =====================================================
   PRODUCT CARDS
===================================================== */

function renderProducts(productList) {

  if (!resultsContainer) {

    console.error(
      "ABAIRA: #results not found."
    );

    return;

  }


  if (
    !Array.isArray(productList) ||
    productList.length === 0
  ) {

    resultsContainer.innerHTML =

      '<div class="no-results">' +

        '<h3>No matching products found.</h3>' +

        '<p>' +
          'Try "black shirt", "summer dress" or "formal blazer".' +
        '</p>' +

      '</div>';

    return;

  }


  resultsContainer.innerHTML =
    productList
      .map(function(product) {


        const image =
          product.image ||
          FALLBACK_IMAGE;


        const brand =
          escapeHTML(
            product.brand ||
            "FASHION BRAND"
          );


        const name =
          escapeHTML(
            product.name ||
            "Fashion Product"
          );


        const category =
          escapeHTML(
            product.category ||
            "Fashion"
          );


        const description =
          escapeHTML(
            product.description ||
            "Discover this fashion piece."
          );


        const color =
          escapeHTML(
            product.color ||
            ""
          );


        const material =
          escapeHTML(
            arrayToText(
              product.material
            )
          );


        const sizes =
          escapeHTML(
            arrayToText(
              product.sizes
            )
          );


        const style =
          escapeHTML(
            arrayToText(
              product.style
            )
          );


        const availability =
          escapeHTML(
            product.availability ||
            "Available"
          );


        const productUrl =
          product.productUrl &&
          product.productUrl !== "#"
            ? product.productUrl
            : "#";


        let explanationHTML = "";


        if (product.explanation) {

          explanationHTML =

            '<div class="product-explanation">' +

              '<span>✦</span>' +

              escapeHTML(
                product.explanation
              ) +

            '</div>';

        }


        let matchHTML = "";


        if (
          product.matchScore !== undefined
        ) {

          matchHTML =

            '<div class="match-score">' +

              '<span>AI MATCH</span>' +

              '<strong>' +
                Math.round(
                  Number(
                    product.matchScore
                  )
                ) +
                '%' +
              '</strong>' +

            '</div>';

        }


        return (

          '<article class="product-card">' +


            '<div class="product-image-wrap">' +

              '<img ' +

                'class="product-image" ' +

                'src="' +
                  escapeHTML(image) +
                '" ' +

                'alt="' +
                  name +
                '" ' +

                'loading="lazy" ' +

                'onerror="this.onerror=null;this.src=\'' +
                  FALLBACK_IMAGE +
                '\';"' +

              '>' +


              '<span class="product-badge">' +
                availability +
              '</span>' +


              '<span class="product-category">' +
                category +
              '</span>' +

            '</div>' +


            '<div class="product-card-content">' +


              '<div class="product-top">' +

                '<span class="product-brand">' +
                  brand +
                '</span>' +

                '<span class="product-price">' +
                  formatPrice(product) +
                '</span>' +

              '</div>' +


              '<h3 class="product-name">' +
                name +
              '</h3>' +


              '<p class="product-description">' +
                description +
              '</p>' +


              '<div class="product-meta">' +

                '<span>' +
                  escapeHTML(color) +
                '</span>' +

                '<span>' +
                  material +
                '</span>' +

              '</div>' +


              (
                style
                  ? '<div class="product-style">' +
                      style +
                    '</div>'
                  : ""
              ) +


              explanationHTML +


              matchHTML +


              '<div class="product-footer">' +

                '<span class="product-sizes">' +
                  'Sizes: ' +
                  sizes +
                '</span>' +


                '<a ' +

                  'class="product-button" ' +

                  'href="' +
                    escapeHTML(productUrl) +
                  '" ' +

                  'target="_blank" ' +

                  'rel="noopener noreferrer"' +

                '>' +

                  'View Product →' +

                '</a>' +

              '</div>' +


            '</div>' +


          '</article>'

        );

      })
      .join("");

}


/* =====================================================
   BACKEND SEARCH
===================================================== */

async function searchFashion(query) {

  try {

    console.log(
      "ABAIRA: Searching backend...",
      query
    );


    const response =
      await fetch(
        API_BASE_URL +
        "/api/search",
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


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Search failed"
      );

    }


    console.log(
      "ABAIRA SEARCH RESPONSE:",
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
      "ABAIRA backend search error:",
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

    console.error(
      "ABAIRA: searchInput not found."
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
    "Searching global fashion..."
  );


  const apiResults =
    await searchFashion(query);


  if (
    Array.isArray(apiResults) &&
    apiResults.length > 0
  ) {

    renderProducts(
      apiResults
    );

    return;

  }


  console.log(
    "ABAIRA: Using local search fallback."
  );


  const localResults =
    localSearchProducts(query);


  renderProducts(
    localResults
  );

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
   ENTER SEARCH
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
   SEARCH HINTS
===================================================== */

document
  .querySelectorAll(
    ".search-hints button"
  )
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
   AI STYLIST BACKEND
===================================================== */

async function searchStylist(
  preferences
) {

  try {

    console.log(
      "ABAIRA: Calling AI Stylist..."
    );


    const response =
      await fetch(
        API_BASE_URL +
        "/api/stylist",
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


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "AI Stylist failed"
      );

    }


    console.log(
      "ABAIRA STYLIST RESPONSE:",
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
      "ABAIRA AI Stylist error:",
      error
    );


    return null;

  }

}


/* =====================================================
   LOCAL STYLIST FALLBACK
===================================================== */

function localStylistSearch(
  preferences
) {

  const query =
    [
      preferences.occasion,
      preferences.style,
      preferences.comfort,
      preferences.color,
      preferences.coverage,
      preferences.description
    ]
      .join(" ")
      .trim();


  if (!query) {

    return [];

  }


  return localSearchProducts(
    query
  ).slice(0, 10);

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
    Object.values(
      preferences
    ).some(function(value) {

      return value.length > 0;

    });


  if (!hasPreferences) {

    alert(
      "Please tell ABAIRA what kind of outfit you are looking for."
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
    "Your AI stylist is analysing your preferences..."
  );


  const apiResults =
    await searchStylist(
      preferences
    );


  if (
    Array.isArray(apiResults) &&
    apiResults.length > 0
  ) {

    renderProducts(
      apiResults
    );

  }

  else {

    const localResults =
      localStylistSearch(
        preferences
      );


    renderProducts(
      localResults
    );

  }


  if (stylistButton) {

    stylistButton.disabled =
      false;

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
   INITIAL LOAD
===================================================== */

renderProducts(
  products
);


/* =====================================================
   DEBUG
===================================================== */

console.log(
  "===================================="
);

console.log(
  "ABAIRA app.js loaded successfully."
);

console.log(
  "Backend:",
  API_BASE_URL
);

console.log(
  "Products:",
  products.length
);

console.log(
  "===================================="
);
