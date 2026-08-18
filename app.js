const API_BASE_URL = "https://fashion-ai-search-lj6s.onrender.com";
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
    description:
      "Relaxed-fit lightweight linen shirt for warm weather."
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
      "Minimal oversized cotton shirt with a clean silhouette."
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


const resultsContainer =
  document.getElementById("results");

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");


function normalize(text) {

  return String(text || "")
    .toLowerCase()
    .trim();

}


function searchProducts(query) {

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
            product.description
          ].join(" ")
        );


      let score = 0;


      words.forEach(word => {

        if (
          searchableText.includes(word)
        ) {

          score += 1;

        }


        if (
          normalize(product.name)
            .includes(word)
        ) {

          score += 3;

        }


        if (
          normalize(product.brand)
            .includes(word)
        ) {

          score += 2;

        }


        if (
          normalize(product.category)
            .includes(word)
        ) {

          score += 2;

        }

      });


      return {
        ...product,
        searchScore: score
      };

    })

    .filter(
      product =>
        product.searchScore > 0
    )

    .sort(
      (a, b) =>
        b.searchScore -
        a.searchScore
    );

}


function renderProducts(productList) {

  if (!productList.length) {

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

    return;

  }


  resultsContainer.innerHTML =
    productList
      .map(product => {

        return `

          <article class="product-card">

            <div class="product-image">

              Product Image

            </div>


            <div class="product-content">

              <span class="product-brand">

                ${escapeHTML(
                  product.brand
                )}

              </span>


              <h3>

                ${escapeHTML(
                  product.name
                )}

              </h3>


              <p>

                ${escapeHTML(
                  product.description
                )}

              </p>


              <div class="product-price">

                ${product.currency}
                ${product.price.toLocaleString("en-IN")}

              </div>

            </div>

          </article>

        `;

      })
      .join("");

}


function escapeHTML(text) {

  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function runSearch() {

  const query =
    searchInput.value.trim();

  const results =
    searchProducts(query);

  renderProducts(results);

}


searchButton.addEventListener(
  "click",
  runSearch
);


searchInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      runSearch();

    }

  }
);


document
  .querySelectorAll(".search-hints button")
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


renderProducts(products);
