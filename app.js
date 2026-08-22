/*
=========================================================
FASHION AI DISCOVERY
DAY 6 FRONTEND
USER PREFERENCES + PERSONALIZATION
=========================================================
*/

const API_BASE_URL =
  "https://fashion-ai-search-lj6s.onrender.com";

/*
=========================================================
DOM
=========================================================
*/

const searchInput =
  document.getElementById(
    "searchInput"
  );

const searchButton =
  document.getElementById(
    "searchButton"
  );

const resultsContainer =
  document.getElementById(
    "results"
  );

const resultCount =
  document.getElementById(
    "resultCount"
  );

const searchSummary =
  document.getElementById(
    "searchSummary"
  );

const stylistButton =
  document.getElementById(
    "stylistButton"
  );

/*
=========================================================
STATE
=========================================================
*/

let allProducts = [];

let userPreferences =
  loadPreferences();

/*
=========================================================
PREFERENCE STORAGE
=========================================================
*/

const PREFERENCE_KEY =
  "fashion_ai_user_preferences";

function loadPreferences() {
  try {
    const saved =
      localStorage.getItem(
        PREFERENCE_KEY
      );

    if (!saved) {
      return {
        gender: "",
        favoriteColors: [],
        favoriteStyles: [],
        favoriteCategories: [],
        favoriteMaterials: [],
        occasions: [],
        budget: null,
      };
    }

    return {
      gender: "",
      favoriteColors: [],
      favoriteStyles: [],
      favoriteCategories: [],
      favoriteMaterials: [],
      occasions: [],
      budget: null,
      ...JSON.parse(saved),
    };
  } catch {
    return {
      gender: "",
      favoriteColors: [],
      favoriteStyles: [],
      favoriteCategories: [],
      favoriteMaterials: [],
      occasions: [],
      budget: null,
    };
  }
}

function savePreferences() {
  localStorage.setItem(
    PREFERENCE_KEY,
    JSON.stringify(
      userPreferences
    )
  );
}

/*
=========================================================
HTML ESCAPE
=========================================================
*/

function escapeHTML(value) {
  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

/*
=========================================================
FORMAT PRICE
=========================================================
*/

function formatPrice(price) {
  const number =
    Number(price);

  if (
    !Number.isFinite(number)
  ) {
    return escapeHTML(
      price || ""
    );
  }

  return number.toLocaleString(
    "en-IN"
  );
}

/*
=========================================================
PRODUCT VISUAL
=========================================================
*/

function productVisual(product) {
  return `
    <div class="product-visual">
      <div class="visual-grid"></div>

      <div class="visual-fashion">
        <span>FASHION AI</span>

        <strong>
          ${escapeHTML(
            product.category ||
              "Fashion"
          )}
        </strong>

        <small>
          ${escapeHTML(
            product.name ||
              "Fashion Product"
          )}
        </small>
      </div>
    </div>
  `;
}

/*
=========================================================
LOADING
=========================================================
*/

function showLoading(message) {
  resultsContainer.innerHTML = `
    <div class="no-results">
      <div class="loading-spinner"></div>

      <h3>
        ${escapeHTML(
          message ||
            "AI is searching..."
        )}
      </h3>

      <p>
        Personalizing your fashion discovery.
      </p>
    </div>
  `;

  if (resultCount) {
    resultCount.textContent =
      "AI working";
  }
}

/*
=========================================================
ERROR
=========================================================
*/

function showError(message) {
  resultsContainer.innerHTML = `
    <div class="no-results">
      <h3>
        Fashion AI unavailable
      </h3>

      <p>
        ${escapeHTML(
          message ||
            "Something went wrong."
        )}
      </p>
    </div>
  `;

  if (resultCount) {
    resultCount.textContent =
      "Error";
  }
}

/*
=========================================================
NO RESULTS
=========================================================
*/

function showNoResults() {
  resultsContainer.innerHTML = `
    <div class="no-results">
      <h3>
        No strong fashion matches found.
      </h3>

      <p>
        Try changing your search or preferences.
      </p>
    </div>
  `;

  if (resultCount) {
    resultCount.textContent =
      "0 matches";
  }
}

/*
=========================================================
PRODUCT CARD
=========================================================
*/

function createProductCard(product) {
  const matchScore =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          product.matchScore
        ) || 0
      )
    );

  const reasons =
    Array.isArray(
      product.reasons
    )
      ? product.reasons
      : [];

  const occasions =
    Array.isArray(
      product.occasion
    )
      ? product.occasion
      : [];

  const styles =
    Array.isArray(
      product.style
    )
      ? product.style
      : [];

  const material =
    Array.isArray(
      product.material
    )
      ? product.material
      : [];

  return `
    <article class="product-card">

      <div class="product-image-wrap">

        ${productVisual(product)}

        <div class="ai-match-badge">
          ${matchScore}% AI MATCH
        </div>

      </div>

      <div class="product-content">

        <div class="product-top">

          <span class="product-brand">
            ${escapeHTML(
              product.brand ||
                "FASHION"
            )}
          </span>

          <span class="product-category">
            ${escapeHTML(
              product.category ||
                "Fashion"
            )}
          </span>

        </div>

        <h3 class="product-title">
          ${escapeHTML(
            product.name ||
              "Fashion Product"
          )}
        </h3>

        <p class="product-description">
          ${escapeHTML(
            product.description ||
              ""
          )}
        </p>

        <div class="product-price">
          ₹${formatPrice(
            product.price
          )}

          <span>
            INR
          </span>
        </div>

        <div class="product-meta">

          ${
            product.color
              ? `
                <div class="product-meta-item">
                  <span>Colour</span>
                  <strong>
                    ${escapeHTML(
                      product.color
                    )}
                  </strong>
                </div>
              `
              : ""
          }

          ${
            material.length
              ? `
                <div class="product-meta-item">
                  <span>Material</span>
                  <strong>
                    ${escapeHTML(
                      material.join(", ")
                    )}
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
                    ${escapeHTML(
                      styles
                        .slice(
                          0,
                          2
                        )
                        .join(", ")
                    )}
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
                    ${escapeHTML(
                      occasions
                        .slice(
                          0,
                          2
                        )
                        .join(", ")
                    )}
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

                <strong>
                  Why AI selected this
                </strong>

                <ul>
                  ${reasons
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (reason) =>
                        `<li>${escapeHTML(
                          reason
                        )}</li>`
                    )
                    .join("")}
                </ul>

              </div>
            `
            : ""
        }

        ${
          product.personalizationScore >
          0
            ? `
              <div class="personalization-label">
                ✦ Personalized for you
              </div>
            `
            : ""
        }

        <div class="match-score">

          <div class="match-score-header">

            <span>
              AI relevance
            </span>

            <strong>
              ${matchScore}%
            </strong>

          </div>

          <div class="match-score-bar">

            <div
              class="match-score-fill"
              style="width:${matchScore}%"
            ></div>

          </div>

        </div>

      </div>

    </article>
  `;
}

/*
=========================================================
RENDER
=========================================================
*/

function renderProducts(
  products,
  query = ""
) {
  if (
    !Array.isArray(products) ||
    !products.length
  ) {
    showNoResults();
    return;
  }

  resultsContainer.innerHTML =
    products
      .map(
        createProductCard
      )
      .join("");

  if (resultCount) {
    resultCount.textContent =
      `${products.length} AI matches`;
  }

  if (
    searchSummary &&
    query
  ) {
    searchSummary.textContent =
      `Personalized AI results for "${query}"`;
  }
}

/*
=========================================================
LOAD PRODUCTS
=========================================================
*/

async function loadProducts() {
  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/products`
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to load products."
      );
    }

    allProducts =
      data.products || [];
  } catch (error) {
    console.error(
      "Product loading error:",
      error
    );
  }
}

/*
=========================================================
AI SEARCH
=========================================================
*/

async function searchFashion(
  query
) {
  const response =
    await fetch(
      `${API_BASE_URL}/api/search`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          query,

          preferences:
            userPreferences,
        }),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "AI search failed."
    );
  }

  return data;
}

/*
=========================================================
RUN SEARCH
=========================================================
*/

async function runSearch() {
  const query =
    searchInput?.value.trim();

  if (!query) {
    if (
      allProducts.length
    ) {
      await loadPersonalizedProducts();
    }

    return;
  }

  showLoading(
    "Understanding your style and preferences..."
  );

  try {
    const data =
      await searchFashion(
        query
      );

    renderProducts(
      data.results || [],
      query
    );

    document
      .getElementById(
        "results-section"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",
        block: "start",
      });
  } catch (error) {
    console.error(
      "AI Search Error:",
      error
    );

    showError(
      error.message
    );
  }
}

/*
=========================================================
PERSONALIZED HOME
=========================================================
*/

async function loadPersonalizedProducts() {
  showLoading(
    "Preparing your personalized fashion feed..."
  );

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/personalize`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            preferences:
              userPreferences,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Personalization failed."
      );
    }

    renderProducts(
      data.recommendations ||
        []
    );

    if (
      searchSummary
    ) {
      searchSummary.textContent =
        "Your personalized AI fashion feed";
    }
  } catch (error) {
    console.error(
      "Personalization error:",
      error
    );

    renderProducts(
      allProducts.slice(0, 6)
    );
  }
}

/*
=========================================================
AI STYLIST
=========================================================
*/

async function runAIStylist() {
  const getValue =
    (id) =>
      document
        .getElementById(id)
        ?.value
        ?.trim() || "";

  const occasion =
    getValue(
      "stylistOccasion"
    );

  const style =
    getValue(
      "stylistStyle"
    );

  const comfort =
    getValue(
      "stylistComfort"
    );

  const color =
    getValue(
      "stylistColor"
    );

  const coverage =
    getValue(
      "stylistCoverage"
    );

  const description =
    getValue(
      "stylistDescription"
    );

  const hasInput =
    [
      occasion,
      style,
      comfort,
      color,
      coverage,
      description,
    ].some(Boolean);

  if (!hasInput) {
    alert(
      "Please describe at least one part of your desired look."
    );

    return;
  }

  if (stylistButton) {
    stylistButton.disabled =
      true;

    stylistButton.textContent =
      "AI is styling...";
  }

  showLoading(
    "Creating your personalized look..."
  );

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/stylist`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            occasion,
            style,
            comfort,
            color,
            coverage,
            description,

            preferences:
              userPreferences,
          }),
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
      data.recommendations ||
        [],
      data.query ||
        description
    );

    if (
      searchSummary
    ) {
      searchSummary.textContent =
        "✦ Personalized by your AI Style Profile";
    }

    document
      .getElementById(
        "results-section"
      )
      ?.scrollIntoView({
        behavior:
          "smooth",
        block: "start",
      });
  } catch (error) {
    console.error(
      "AI Stylist error:",
      error
    );

    showError(
      error.message
    );
  } finally {
    if (stylistButton) {
      stylistButton.disabled =
        false;

      stylistButton.textContent =
        "Find My AI Matches";
    }
  }
}

/*
=========================================================
PREFERENCE UI
=========================================================
*/

function createPreferencePanel() {
  if (
    document.getElementById(
      "preferencePanel"
    )
  ) {
    return;
  }

  const panel =
    document.createElement(
      "section"
    );

  panel.id =
    "preferencePanel";

  panel.className =
    "preference-panel";

  panel.innerHTML = `
    <div class="preference-panel-inner">

      <div class="preference-header">

        <div>
          <span class="eyebrow">
            AI STYLE PROFILE
          </span>

          <h2>
            Teach Fashion AI your taste.
          </h2>

          <p>
            Your preferences are stored locally
            and used to personalize AI recommendations.
          </p>
        </div>

        <button
          type="button"
          id="closePreferences"
          class="preference-close"
        >
          ×
        </button>

      </div>

      <div class="preference-grid">

        <div class="preference-field">

          <label>
            Gender
          </label>

          <select
            id="prefGender"
          >
            <option value="">
              Any
            </option>

            <option value="women">
              Women
            </option>

            <option value="men">
              Men
            </option>

            <option value="unisex">
              Unisex
            </option>
          </select>

        </div>

        <div class="preference-field">

          <label>
            Favourite colours
          </label>

          <input
            id="prefColors"
            placeholder="black, white, blue"
          />

        </div>

        <div class="preference-field">

          <label>
            Favourite styles
          </label>

          <input
            id="prefStyles"
            placeholder="minimal, casual, elegant"
          />

        </div>

        <div class="preference-field">

          <label>
            Favourite categories
          </label>

          <input
            id="prefCategories"
            placeholder="dresses, shirts, sneakers"
          />

        </div>

        <div class="preference-field">

          <label>
            Favourite materials
          </label>

          <input
            id="prefMaterials"
            placeholder="cotton, linen, denim"
          />

        </div>

        <div class="preference-field">

          <label>
            Occasions
          </label>

          <input
            id="prefOccasions"
            placeholder="college, office, travel"
          />

        </div>

        <div class="preference-field">

          <label>
            Maximum budget (INR)
          </label>

          <input
            id="prefBudget"
            type="number"
            min="0"
            placeholder="5000"
          />

        </div>

      </div>

      <div class="preference-actions">

        <button
          type="button"
          id="clearPreferences"
          class="preference-secondary"
        >
          Clear profile
        </button>

        <button
          type="button"
          id="savePreferences"
          class="preference-primary"
        >
          Save AI Style Profile
        </button>

      </div>

      <div
        id="preferenceStatus"
        class="preference-status"
      ></div>

    </div>
  `;

  const main =
    document.querySelector(
      "main"
    );

  if (main) {
    main.prepend(
      panel
    );
  } else {
    document.body.prepend(
      panel
    );
  }

  fillPreferenceForm();

  document
    .getElementById(
      "closePreferences"
    )
    ?.addEventListener(
      "click",
      () => {
        panel.classList.remove(
          "visible"
        );
      }
    );

  document
    .getElementById(
      "savePreferences"
    )
    ?.addEventListener(
      "click",
      savePreferenceForm
    );

  document
    .getElementById(
      "clearPreferences"
    )
    ?.addEventListener(
      "click",
      clearPreferences
    );
}

/*
=========================================================
PREFERENCE FORM
=========================================================
*/

function csvToArray(value) {
  return String(
    value || ""
  )
    .split(",")
    .map(
      (item) =>
        item
          .trim()
          .toLowerCase()
    )
    .filter(Boolean);
}

function fillPreferenceForm() {
  const set =
    (id, value) => {
      const element =
        document.getElementById(
          id
        );

      if (element) {
        element.value =
          value || "";
      }
    };

  set(
    "prefGender",
    userPreferences.gender
  );

  set(
    "prefColors",
    userPreferences.favoriteColors.join(
      ", "
    )
  );

  set(
    "prefStyles",
    userPreferences.favoriteStyles.join(
      ", "
    )
  );

  set(
    "prefCategories",
    userPreferences.favoriteCategories.join(
      ", "
    )
  );

  set(
    "prefMaterials",
    userPreferences.favoriteMaterials.join(
      ", "
    )
  );

  set(
    "prefOccasions",
    userPreferences.occasions.join(
      ", "
    )
  );

  set(
    "prefBudget",
    userPreferences.budget
  );
}

function savePreferenceForm() {
  userPreferences = {
    gender:
      document.getElementById(
        "prefGender"
      )?.value || "",

    favoriteColors:
      csvToArray(
        document.getElementById(
          "prefColors"
        )?.value
      ),

    favoriteStyles:
      csvToArray(
        document.getElementById(
          "prefStyles"
        )?.value
      ),

    favoriteCategories:
      csvToArray(
        document.getElementById(
          "prefCategories"
        )?.value
      ),

    favoriteMaterials:
      csvToArray(
        document.getElementById(
          "prefMaterials"
        )?.value
      ),

    occasions:
      csvToArray(
        document.getElementById(
          "prefOccasions"
        )?.value
      ),

    budget:
      Number(
        document.getElementById(
          "prefBudget"
        )?.value
      ) || null,
  };

  savePreferences();

  const status =
    document.getElementById(
      "preferenceStatus"
    );

  if (status) {
    status.textContent =
      "✓ Your AI Style Profile has been saved.";

    setTimeout(() => {
      status.textContent =
        "";
    }, 3000);
  }

  loadPersonalizedProducts();
}

function clearPreferences() {
  userPreferences = {
    gender: "",
    favoriteColors: [],
    favoriteStyles: [],
    favoriteCategories: [],
    favoriteMaterials: [],
    occasions: [],
    budget: null,
  };

  savePreferences();

  fillPreferenceForm();

  const status =
    document.getElementById(
      "preferenceStatus"
    );

  if (status) {
    status.textContent =
      "Style profile cleared.";
  }

  loadPersonalizedProducts();
}

/*
=========================================================
PROFILE BUTTON
=========================================================
*/

function createProfileButton() {
  if (
    document.getElementById(
      "openPreferences"
    )
  ) {
    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.id =
    "openPreferences";

  button.className =
    "profile-button";

  button.type =
    "button";

  button.textContent =
    "✦ My AI Style";

  button.addEventListener(
    "click",
    () => {
      const panel =
        document.getElementById(
          "preferencePanel"
        );

      panel?.classList.add(
        "visible"
      );
    }
  );

  const nav =
    document.querySelector(
      ".nav-container"
    );

  if (nav) {
    nav.appendChild(
      button
    );
  }
}

/*
=========================================================
EVENTS
=========================================================
*/

searchButton?.addEventListener(
  "click",
  runSearch
);

searchInput?.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key ===
      "Enter"
    ) {
      runSearch();
    }
  }
);

stylistButton?.addEventListener(
  "click",
  runAIStylist
);

/*
=========================================================
SEARCH HINTS
=========================================================
*/

document
  .querySelectorAll(
    ".search-hints button"
  )
  .forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          if (
            searchInput
          ) {
            searchInput.value =
              button.textContent.trim();
          }

          runSearch();
        }
      );
    }
  );

/*
=========================================================
INITIALIZE
=========================================================
*/

async function initialize() {
  createPreferencePanel();

  createProfileButton();

  showLoading(
    "Connecting to Fashion AI..."
  );

  await loadProducts();

  if (
    allProducts.length
  ) {
    await loadPersonalizedProducts();
  } else {
    showError(
      "Could not load the fashion catalogue."
    );
  }
}

initialize();
