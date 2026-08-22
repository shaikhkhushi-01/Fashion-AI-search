const API_BASE_URL = "https://fashion-ai-search-lj6s.onrender.com";

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resultsContainer = document.getElementById("results");
const resultCount = document.getElementById("resultCount");
const searchSummary = document.getElementById("searchSummary");
const stylistButton = document.getElementById("stylistButton");

let allProducts = [];

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(price) {
  const number = Number(price);

  if (!Number.isFinite(number)) {
    return escapeHTML(price || "");
  }

  return number.toLocaleString("en-IN");
}

function showLoading(message = "AI is searching...") {
  resultsContainer.innerHTML = `
    <div class="no-results">
      <div class="loading-spinner"></div>
      <h3>${escapeHTML(message)}</h3>
      <p>AI is analysing your fashion request.</p>
    </div>
  `;

  if (resultCount) {
    resultCount.textContent = "AI working";
  }
}

function showError(message) {
  resultsContainer.innerHTML = `
    <div class="no-results">
      <h3>AI search unavailable</h3>
      <p>${escapeHTML(message)}</p>
    </div>
  `;

  if (resultCount) {
    resultCount.textContent = "Error";
  }
}

function showNoResults() {
  resultsContainer.innerHTML = `
    <div class="no-results">
      <h3>No strong fashion matches found.</h3>
      <p>
        Try describing colour, style, occasion or budget differently.
      </p>
    </div>
  `;

  if (resultCount) {
    resultCount.textContent = "0 matches";
  }
}

function productVisual(product) {
  const category = product.category || "Fashion";
  const name = product.name || "Fashion Product";

  return `
    <div class="product-visual">
      <div class="visual-grid"></div>

      <div class="visual-fashion">
        <span>FASHION AI</span>
        <strong>${escapeHTML(category)}</strong>
        <small>${escapeHTML(name)}</small>
      </div>
    </div>
  `;
}

function createProductCard(product) {
  const score = Math.max(
    0,
    Math.min(100, Number(product.matchScore) || 0)
  );

  const reasons = Array.isArray(product.reasons)
    ? product.reasons
    : [];

  const styles = Array.isArray(product.style)
    ? product.style
    : [];

  const occasions = Array.isArray(product.occasion)
    ? product.occasion
    : [];

  const materials = Array.isArray(product.material)
    ? product.material
    : [];

  return `
    <article class="product-card">

      <div class="product-image-wrap">

        ${productVisual(product)}

        <div class="ai-match-badge">
          ${score}% AI MATCH
        </div>

      </div>

      <div class="product-content">

        <div class="product-top">
          <span class="product-brand">
            ${escapeHTML(product.brand || "FASHION")}
          </span>

          <span class="product-category">
            ${escapeHTML(product.category || "Fashion")}
          </span>
        </div>

        <h3 class="product-title">
          ${escapeHTML(product.name || "Fashion Product")}
        </h3>

        <p class="product-description">
          ${escapeHTML(product.description || "")}
        </p>

        <div class="product-price">
          ${formatPrice(product.price)}
          <span>INR</span>
        </div>

        <div class="product-meta">

          ${
            product.color
              ? `
                <div class="product-meta-item">
                  <span>Colour</span>
                  <strong>${escapeHTML(product.color)}</strong>
                </div>
              `
              : ""
          }

          ${
            materials.length
              ? `
                <div class="product-meta-item">
                  <span>Material</span>
                  <strong>
                    ${escapeHTML(materials.slice(0, 2).join(", "))}
                  </strong>
                </div>
              `
              : ""
          }

          ${
            styles.length
              ? `
                <div class="product-meta-item">
                  <span>Style</span>
                  <strong>
                    ${escapeHTML(styles.slice(0, 2).join(", "))}
                  </strong>
                </div>
              `
              : ""
          }

          ${
            occasions.length
              ? `
                <div class="product-meta-item">
                  <span>Occasion</span>
                  <strong>
                    ${escapeHTML(occasions.slice(0, 2).join(", "))}
                  </strong>
                </div>
              `
              : ""
          }

        </div>

        ${
          reasons.length
            ? `
              <div class="product-reason">
                <strong>Why AI selected this</strong>

                <ul>
                  ${reasons
                    .slice(0, 3)
                    .map(
                      (reason) =>
                        `<li>${escapeHTML(reason)}</li>`
                    )
                    .join("")}
                </ul>
              </div>
            `
            : ""
        }

        <div class="match-score">

          <div class="match-score-header">
            <span>AI relevance</span>
            <strong>${score}%</strong>
          </div>

          <div class="match-score-bar">
            <div
              class="match-score-fill"
              style="width: ${score}%"
            ></div>
          </div>

        </div>

      </div>

    </article>
  `;
}

function renderProducts(products, query = "") {
  if (!Array.isArray(products) || products.length === 0) {
    showNoResults();
    return;
  }

  resultsContainer.innerHTML = products
    .map(createProductCard)
    .join("");

  if (resultCount) {
    resultCount.textContent = `${products.length} AI matches`;
  }

  if (query && searchSummary) {
    searchSummary.textContent =
      `AI-ranked results for "${query}"`;
  }
}

async function loadProducts() {
  const response = await fetch(
    `${API_BASE_URL}/api/products`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Unable to load products."
    );
  }

  allProducts = Array.isArray(data.products)
    ? data.products
    : [];
}

async function searchFashion(query) {
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
      data.error || "AI search failed."
    );
  }

  return data;
}

async function runSearch() {
  if (!searchInput) return;

  const query = searchInput.value.trim();

  if (!query) {
    renderProducts(allProducts);
    return;
  }

  showLoading(
    "Understanding your fashion request..."
  );

  try {
    const data = await searchFashion(query);

    const results = Array.isArray(data.results)
      ? data.results
      : [];

    renderProducts(results, query);

    if (data.budget && searchSummary) {
      searchSummary.textContent =
        `AI-ranked results for "${query}" · budget detected: ₹${formatPrice(data.budget)}`;
    }

    document
      .getElementById("results-section")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

  } catch (error) {
    console.error("AI Search Error:", error);

    showError(
      error.message || "Please try again."
    );
  }
}

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
    document.getElementById("stylistDescription")?.value.trim() || "";

  const hasInput = [
    occasion,
    style,
    comfort,
    color,
    coverage,
    description
  ].some(Boolean);

  if (!hasInput) {
    alert(
      "Please describe at least one part of your desired look."
    );
    return;
  }

  if (stylistButton) {
    stylistButton.disabled = true;
    stylistButton.textContent =
      "AI is styling your look...";
  }

  showLoading(
    "Building your personalised fashion recommendations..."
  );

  try {
    const response = await fetch(
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "AI Stylist failed."
      );
    }

    const recommendations =
      Array.isArray(data.recommendations)
        ? data.recommendations
        : [];

    renderProducts(
      recommendations,
      data.query || description
    );

    if (searchSummary) {
      searchSummary.textContent =
        "Personalised recommendations generated by AI Stylist";
    }

    document
      .getElementById("results-section")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

  } catch (error) {
    console.error("AI Stylist Error:", error);

    showError(
      error.message ||
      "AI Stylist could not complete the request."
    );

  } finally {
    if (stylistButton) {
      stylistButton.disabled = false;
      stylistButton.textContent =
        "Find My AI Matches";
    }
  }
}

searchButton?.addEventListener(
  "click",
  runSearch
);

searchInput?.addEventListener(
  "keydown",
  function (event) {
    if (event.key === "Enter") {
      runSearch();
    }
  }
);

stylistButton?.addEventListener(
  "click",
  runAIStylist
);

document
  .querySelectorAll(".search-hints button")
  .forEach(function (button) {
    button.addEventListener(
      "click",
      function () {
        if (!searchInput) return;

        searchInput.value =
          button.textContent.trim();

        runSearch();
      }
    );
  });

async function initialize() {
  if (!resultsContainer) return;

  resultsContainer.innerHTML = `
    <div class="no-results">
      <div class="loading-spinner"></div>
      <h3>Connecting to Fashion AI...</h3>
      <p>
        Loading the intelligent fashion catalogue.
      </p>
    </div>
  `;

  try {
    await loadProducts();

    if (allProducts.length) {
      renderProducts(
        allProducts.slice(0, 6)
      );

      if (resultCount) {
        resultCount.textContent =
          "AI catalogue ready";
      }

      if (searchSummary) {
        searchSummary.textContent =
          `${allProducts.length} products available for AI discovery.`;
      }

    } else {
      showError(
        "No fashion products are available."
      );
    }

  } catch (error) {
    console.error(
      "Initialization Error:",
      error
    );

    showError(
      "Could not connect to the Fashion AI backend."
    );
  }
}

initialize();
