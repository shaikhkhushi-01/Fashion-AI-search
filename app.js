const API_BASE_URL = "https://fashion-ai-search-lj6s.onrender.com";

const state = {
  allProducts: [],
  visibleProducts: [],
  searchResults: [],
  searchQuery: "",
  selectedCategory: "",
  selectedGender: "",
  selectedColor: "",
  selectedStyle: "",
  selectedOccasion: "",
  selectedMaterial: "",
  minPrice: 0,
  maxPrice: Infinity,
  sortBy: "relevance",
  wishlist: JSON.parse(localStorage.getItem("fashionAIWishlist") || "[]"),
  userProfile: JSON.parse(localStorage.getItem("fashionAIProfile") || "{}"),
  loading: false,
  backendOnline: false
};

let discoveryPage = 1;
const discoveryPageSize = 12;

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === null || value === undefined || value === "") return [];
  return String(value)
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "₹—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);
}

function getProductId(product) {
  return String(
    product?.id ??
    product?.product_id ??
    product?.sku ??
    product?.productId ??
    ""
  );
}

function getProductName(product) {
  return String(
    product?.name ??
    product?.title ??
    product?.product_name ??
    "Fashion Item"
  );
}

function getProductCategory(product) {
  return String(
    product?.category ??
    product?.product_category ??
    "Fashion"
  );
}

function getProductGender(product) {
  return String(
    product?.gender ??
    product?.Gender ??
    "Unisex"
  );
}

function getProductColor(product) {
  return String(
    product?.color ??
    product?.colour ??
    product?.baseColour ??
    "—"
  );
}

function getProductMaterial(product) {
  return String(
    product?.material ??
    product?.fabric ??
    ""
  );
}

function getProductPrice(product) {
  const value =
    product?.price ??
    product?.selling_price ??
    product?.discounted_price ??
    product?.cost ??
    0;

  return Number(value) || 0;
}

function getProductDescription(product) {
  return String(
    product?.description ??
    product?.desc ??
    "A curated fashion piece selected for your discovery."
  );
}

function getProductStyles(product) {
  return normalizeArray(
    product?.styles ??
    product?.style ??
    product?.fashion_style
  );
}

function getProductOccasions(product) {
  return normalizeArray(
    product?.occasions ??
    product?.occasion
  );
}

function getProductImage(product) {
  return String(
    product?.image ??
    product?.image_url ??
    product?.imageUrl ??
    product?.img ??
    product?.thumbnail ??
    ""
  );
}

function productVisual(product) {
  const image = getProductImage(product);
  const category = getProductCategory(product);
  const color = getProductColor(product);

  if (image) {
    return `
      <img
        class="product-image"
        src="${escapeHTML(image)}"
        alt="${escapeHTML(getProductName(product))}"
        loading="lazy"
        onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
      >
      <div class="product-visual" style="display:none">
        <div class="visual-grid"></div>
        <div class="visual-content">
          <span class="visual-label">${escapeHTML(category)}</span>
          <strong>${escapeHTML(color)}</strong>
          <small>${escapeHTML(getProductName(product))}</small>
        </div>
      </div>
    `;
  }

  return `
    <div class="product-visual">
      <div class="visual-grid"></div>
      <div class="visual-content">
        <span class="visual-label">${escapeHTML(category)}</span>
        <strong>${escapeHTML(color)}</strong>
        <small>${escapeHTML(getProductName(product))}</small>
      </div>
    </div>
  `;
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

function updateBackendStatus(online, data = null) {
  const element = $("backendStatus");
  if (!element) return;

  if (online) {
    element.innerHTML = `
      <span class="status-dot online"></span>
      <span>AI ENGINE ONLINE</span>
    `;
    element.title = data?.version || "Backend connected";
  } else {
    element.innerHTML = `
      <span class="status-dot offline"></span>
      <span>AI ENGINE OFFLINE</span>
    `;
    element.title = "Backend unavailable. Local fallback active.";
  }
}

async function checkBackend() {
  try {
    const data = await apiRequest("/api/health");
    state.backendOnline = true;
    updateBackendStatus(true, data);
    return true;
  } catch {
    state.backendOnline = false;
    updateBackendStatus(false);
    return false;
  }
}

function showLoading() {
  const results = $("results");
  if (!results) return;

  results.innerHTML = `
    <div class="no-results">
      <div class="loading-spinner"></div>
      <h3>Finding your matches</h3>
      <p>Fashion AI is ranking the catalogue.</p>
    </div>
  `;
}

function showError(message) {
  const results = $("results");
  if (!results) return;

  results.innerHTML = `
    <div class="no-results">
      <h3>Something went wrong</h3>
      <p>${escapeHTML(message)}</p>
      <button type="button" class="secondary-button" onclick="loadProducts()">
        Try again
      </button>
    </div>
  `;
}

function showNoResults() {
  const results = $("results");
  if (!results) return;

  results.innerHTML = `
    <div class="no-results">
      <div style="font-size:32px">⌕</div>
      <h3>No fashion matches found</h3>
      <p>Try another search or relax one of your filters.</p>
      <button type="button" class="secondary-button" onclick="clearAllFilters()">
        Clear filters
      </button>
    </div>
  `;
}

async function loadProducts() {
  state.loading = true;
  showLoading();

  try {
    const data = await apiRequest("/api/products");

    const products =
      data.products ||
      data.results ||
      data.data ||
      [];

    state.allProducts = Array.isArray(products)
      ? products
      : [];

    state.searchResults = [...state.allProducts];

    buildFilterOptions();
    applyAllFilters();
    renderForYou();
  } catch (error) {
    if (state.allProducts.length > 0) {
      state.searchResults = [...state.allProducts];
      applyAllFilters();
    } else {
      showError("Fashion catalogue is temporarily unavailable. Please try again.");
    }
  } finally {
    state.loading = false;
    updateCatalogueStats();
  }
}

async function searchFashion(query) {
  const cleanQuery = String(query || "").trim();

  if (!cleanQuery) {
    state.searchQuery = "";
    state.searchResults = [...state.allProducts];
    applyAllFilters();
    updateSearchSummary();

    $("results")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    return;
  }

  state.searchQuery = cleanQuery;
  showLoading();

  try {
    const data = await apiRequest("/api/ai-search", {
      method: "POST",
      body: JSON.stringify({
        query: cleanQuery
      })
    });

    const results =
      data.results ||
      data.products ||
      data.data ||
      [];

    state.searchResults = Array.isArray(results)
      ? results
      : [];

    trackSearch(cleanQuery);
    applyAllFilters();

    $("results")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch {
    state.searchResults = localSearch(cleanQuery);
    trackSearch(cleanQuery);
    applyAllFilters();

    $("results")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function localSearch(query) {
  const words = String(query)
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 1);

  return state.allProducts
    .map(product => {
      const searchableText = [
        getProductName(product),
        getProductCategory(product),
        getProductGender(product),
        getProductColor(product),
        getProductMaterial(product),
        getProductDescription(product),
        ...getProductStyles(product),
        ...getProductOccasions(product)
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;

      if (searchableText.includes(String(query).toLowerCase())) {
        score += 10;
      }

      words.forEach(word => {
        if (searchableText.includes(word)) {
          score += word.length > 4 ? 3 : 2;
        }
      });

      return {
        ...product,
        _localScore: score
      };
    })
    .filter(product => product._localScore > 0)
    .sort((a, b) => b._localScore - a._localScore);
}

function runSearch() {
  const input = $("searchInput");
  if (!input) return;
  searchFashion(input.value);
}

function setupSearch() {
  const input = $("searchInput");
  const button = $("searchButton");

  if (!input) return;

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  });

  if (button) {
    button.addEventListener("click", runSearch);
  }
}

function uniqueValues(values) {
  return [...new Set(
    values
      .flatMap(normalizeArray)
      .filter(Boolean)
      .map(value => String(value).trim())
  )].sort((a, b) => a.localeCompare(b));
}

function populateSelect(id, values, placeholder) {
  const select = $(id);
  if (!select) return;

  const currentValue = select.value;

  select.innerHTML = `
    <option value="">${escapeHTML(placeholder)}</option>
    ${values.map(value => `
      <option value="${escapeHTML(value)}">${escapeHTML(value)}</option>
    `).join("")}
  `;

  if (values.includes(currentValue)) {
    select.value = currentValue;
  }
}

function buildFilterOptions() {
  const products = state.allProducts;

  populateSelect(
    "categoryFilter",
    uniqueValues(products.map(getProductCategory)),
    "All Categories"
  );

  populateSelect(
    "genderFilter",
    uniqueValues(products.map(getProductGender)),
    "All Genders"
  );

  populateSelect(
    "colorFilter",
    uniqueValues(products.map(getProductColor)),
    "All Colours"
  );

  populateSelect(
    "styleFilter",
    uniqueValues(products.flatMap(getProductStyles)),
    "All Styles"
  );

  populateSelect(
    "occasionFilter",
    uniqueValues(products.flatMap(getProductOccasions)),
    "All Occasions"
  );

  populateSelect(
    "materialFilter",
    uniqueValues(products.map(getProductMaterial)),
    "All Materials"
  );
}

function readFilters() {
  state.selectedCategory = $("categoryFilter")?.value || "";
  state.selectedGender = $("genderFilter")?.value || "";
  state.selectedColor = $("colorFilter")?.value || "";
  state.selectedStyle = $("styleFilter")?.value || "";
  state.selectedOccasion = $("occasionFilter")?.value || "";
  state.selectedMaterial = $("materialFilter")?.value || "";

  state.minPrice = Number($("minPriceFilter")?.value || 0);

  const max = Number($("maxPriceFilter")?.value || 0);
  state.maxPrice = max > 0 ? max : Infinity;

  state.sortBy = $("sortFilter")?.value || "relevance";
}

function matchesFilter(product) {
  const price = getProductPrice(product);

  if (
    state.selectedCategory &&
    getProductCategory(product).toLowerCase() !==
      state.selectedCategory.toLowerCase()
  ) {
    return false;
  }

  if (
    state.selectedGender &&
    getProductGender(product).toLowerCase() !==
      state.selectedGender.toLowerCase()
  ) {
    return false;
  }

  if (
    state.selectedColor &&
    getProductColor(product).toLowerCase() !==
      state.selectedColor.toLowerCase()
  ) {
    return false;
  }

  if (
    state.selectedStyle &&
    !getProductStyles(product).some(
      style => style.toLowerCase() === state.selectedStyle.toLowerCase()
    )
  ) {
    return false;
  }

  if (
    state.selectedOccasion &&
    !getProductOccasions(product).some(
      occasion => occasion.toLowerCase() === state.selectedOccasion.toLowerCase()
    )
  ) {
    return false;
  }

  if (
    state.selectedMaterial &&
    getProductMaterial(product).toLowerCase() !==
      state.selectedMaterial.toLowerCase()
  ) {
    return false;
  }

  if (price < state.minPrice) return false;
  if (price > state.maxPrice) return false;

  return true;
}

function applyPersonalization(products) {
  const profile = state.userProfile || {};

  const categories = normalizeArray(profile.favoriteCategories);
  const colors = normalizeArray(profile.favoriteColors);
  const styles = normalizeArray(profile.favoriteStyles);
  const occasions = normalizeArray(profile.favoriteOccasions);
  const materials = normalizeArray(profile.favoriteMaterials);

  if (
    !categories.length &&
    !colors.length &&
    !styles.length &&
    !occasions.length &&
    !materials.length
  ) {
    return products;
  }

  return products
    .map(product => {
      let score = 0;

      const category = getProductCategory(product);
      const color = getProductColor(product);
      const productStyles = getProductStyles(product);
      const productOccasions = getProductOccasions(product);
      const material = getProductMaterial(product);

      if (
        categories.some(
          item => item.toLowerCase() === category.toLowerCase()
        )
      ) {
        score += 5;
      }

      if (
        colors.some(
          item => item.toLowerCase() === color.toLowerCase()
        )
      ) {
        score += 3;
      }

      productStyles.forEach(item => {
        if (
          styles.some(
            value => value.toLowerCase() === item.toLowerCase()
          )
        ) {
          score += 3;
        }
      });

      productOccasions.forEach(item => {
        if (
          occasions.some(
            value => value.toLowerCase() === item.toLowerCase()
          )
        ) {
          score += 2;
        }
      });

      if (
        materials.some(
          item => item.toLowerCase() === material.toLowerCase()
        )
      ) {
        score += 2;
      }

      return {
        ...product,
        _personalizationScore: score
      };
    })
    .sort(
      (a, b) =>
        (b._personalizationScore || 0) -
        (a._personalizationScore || 0)
    );
}

function getRelevanceScore(product) {
  return Number(
    product?._score ??
    product?.score ??
    product?.similarity ??
    product?.relevance ??
    product?._localScore ??
    0
  );
}

function sortProducts(products) {
  const sorted = [...products];

  if (state.sortBy === "price-low") {
    return sorted.sort(
      (a, b) => getProductPrice(a) - getProductPrice(b)
    );
  }

  if (state.sortBy === "price-high") {
    return sorted.sort(
      (a, b) => getProductPrice(b) - getProductPrice(a)
    );
  }

  if (state.sortBy === "newest") {
    return sorted.sort((a, b) => {
      const first = new Date(
        a?.created_at ?? a?.createdAt ?? a?.date ?? 0
      ).getTime();

      const second = new Date(
        b?.created_at ?? b?.createdAt ?? b?.date ?? 0
      ).getTime();

      return second - first;
    });
  }

  return sorted.sort(
    (a, b) => getRelevanceScore(b) - getRelevanceScore(a)
  );
}

function applyAllFilters() {
  readFilters();

  const base = state.searchResults.length
    ? state.searchResults
    : state.allProducts;

  let filtered = base.filter(matchesFilter);

  filtered = applyPersonalization(filtered);
  filtered = sortProducts(filtered);

  state.visibleProducts = filtered;

  renderProducts(filtered);
  updateSearchSummary();
  updateCatalogueStats();
}

function createProductCard(product) {
  const id = getProductId(product);
  const name = getProductName(product);
  const category = getProductCategory(product);
  const gender = getProductGender(product);
  const color = getProductColor(product);
  const price = getProductPrice(product);
  const material = getProductMaterial(product);
  const styles = getProductStyles(product);
  const score = getRelevanceScore(product);

  const isLiked = state.wishlist.includes(id);

  const scorePercent =
    score > 0
      ? Math.max(1, Math.min(100, Math.round(score <= 1 ? score * 100 : score)))
      : 0;

  return `
    <article class="product-card" data-product-id="${escapeHTML(id)}">
      <div class="product-media">
        ${productVisual(product)}

        ${
          scorePercent > 0
            ? `
              <span class="ai-match-badge">
                ${scorePercent}% AI match
              </span>
            `
            : ""
        }

        <button
          class="wishlist-button ${isLiked ? "liked" : ""}"
          onclick="toggleWishlist('${escapeHTML(id)}')"
          aria-label="Toggle wishlist"
          title="Wishlist"
        >
          ${isLiked ? "♥" : "♡"}
        </button>

        <span class="product-category-badge">
          ${escapeHTML(category)}
        </span>
      </div>

      <div class="product-content">
        <div class="product-meta">
          <span>${escapeHTML(gender)}</span>
          <span>•</span>
          <span>${escapeHTML(color)}</span>
        </div>

        <h3 class="product-title">
          ${escapeHTML(name)}
        </h3>

        <p class="product-description">
          ${escapeHTML(getProductDescription(product))}
        </p>

        <div class="product-tags">
          ${styles.slice(0, 3).map(style => `
            <span class="product-tag">${escapeHTML(style)}</span>
          `).join("")}

          ${
            material
              ? `<span class="product-tag">${escapeHTML(material)}</span>`
              : ""
          }
        </div>

        ${
          scorePercent > 0
            ? `
              <div class="match-score-header">
                <span>AI relevance</span>
                <strong>${scorePercent}%</strong>
              </div>
              <div class="match-score-bar">
                <div
                  class="match-score-fill"
                  style="width:${scorePercent}%"
                ></div>
              </div>
            `
            : ""
        }

        <div class="product-footer">
          <strong class="product-price">
            ${formatPrice(price)}
          </strong>

          <button
            type="button"
            class="view-button"
            onclick="selectProduct('${escapeHTML(id)}')"
          >
            Explore →
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(products = state.visibleProducts) {
  const results = $("results");
  if (!results) return;

  if (!products.length) {
    showNoResults();
    return;
  }

  results.innerHTML = products
    .map(createProductCard)
    .join("");
}

function selectProduct(id) {
  const product = state.allProducts.find(
    item => getProductId(item) === String(id)
  );

  if (!product) return;

  trackInteraction(product, "view");
  openProductModal(product);
}

function openProductModal(product) {
  const modal = $("productModal");
  const body = $("productModalBody");

  if (!modal || !body) return;

  const image = getProductImage(product);
  const styles = getProductStyles(product);
  const occasions = getProductOccasions(product);

  body.innerHTML = `
    <div class="modal-layout">
      <div class="modal-image">
        ${
          image
            ? `
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(getProductName(product))}"
                onerror="this.style.display='none'"
              >
            `
            : productVisual(product)
        }
      </div>

      <div class="modal-info">
        <span class="modal-category">
          ${escapeHTML(getProductCategory(product))}
        </span>

        <h2>${escapeHTML(getProductName(product))}</h2>

        <p class="modal-description">
          ${escapeHTML(getProductDescription(product))}
        </p>

        <div class="modal-price">
          ${formatPrice(getProductPrice(product))}
        </div>

        <div class="modal-details">
          <div>
            <strong>Gender</strong>
            <span>${escapeHTML(getProductGender(product))}</span>
          </div>

          <div>
            <strong>Colour</strong>
            <span>${escapeHTML(getProductColor(product))}</span>
          </div>

          <div>
            <strong>Material</strong>
            <span>${escapeHTML(getProductMaterial(product) || "—")}</span>
          </div>

          <div>
            <strong>Style</strong>
            <span>${escapeHTML(styles.join(", ") || "—")}</span>
          </div>

          <div>
            <strong>Occasion</strong>
            <span>${escapeHTML(occasions.join(", ") || "—")}</span>
          </div>
        </div>

        <button
          type="button"
          class="primary-button modal-action"
          onclick="toggleWishlist('${escapeHTML(getProductId(product))}')"
        >
          ${state.wishlist.includes(getProductId(product)) ? "Remove from wishlist" : "Save to wishlist"}
        </button>
      </div>
    </div>
  `;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeProductModal() {
  const modal = $("productModal");
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function updateWishlistCount() {
  const count = $("wishlistCount");
  if (count) {
    count.textContent = String(state.wishlist.length);
  }
}

function persistWishlist() {
  localStorage.setItem(
    "fashionAIWishlist",
    JSON.stringify(state.wishlist)
  );

  updateWishlistCount();
}

function toggleWishlist(id) {
  const productId = String(id);

  if (state.wishlist.includes(productId)) {
    state.wishlist = state.wishlist.filter(
      item => item !== productId
    );
  } else {
    state.wishlist.push(productId);

    const product = state.allProducts.find(
      item => getProductId(item) === productId
    );

    if (product) {
      trackInteraction(product, "wishlist");
    }
  }

  persistWishlist();
  renderProducts(state.visibleProducts);
  renderForYou();
  renderWishlist();

  if ($("productModal")?.classList.contains("open")) {
    const product = state.allProducts.find(
      item => getProductId(item) === productId
    );

    if (product) {
      openProductModal(product);
    }
  }
}

function renderWishlist() {
  const container = $("wishlistResults");
  if (!container) return;

  const products = state.wishlist
    .map(id =>
      state.allProducts.find(
        product => getProductId(product) === String(id)
      )
    )
    .filter(Boolean);

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span>♡</span>
        <h3>Your wishlist is empty</h3>
        <p>Save pieces you want to come back to.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => {
    const image = getProductImage(product);
    const id = getProductId(product);

    return `
      <div class="wishlist-item">
        <div class="wishlist-item-media">
          ${
            image
              ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(getProductName(product))}">`
              : productVisual(product)
          }
        </div>

        <div>
          <h4>${escapeHTML(getProductName(product))}</h4>
          <p>${escapeHTML(getProductCategory(product))} · ${escapeHTML(getProductColor(product))}</p>
          <strong>${formatPrice(getProductPrice(product))}</strong>
        </div>

        <button
          type="button"
          class="wishlist-remove"
          onclick="toggleWishlist('${escapeHTML(id)}')"
          aria-label="Remove from wishlist"
        >
          ×
        </button>
      </div>
    `;
  }).join("");
}

function openWishlist() {
  const panel = $("wishlistPanel");
  const overlay = $("wishlistOverlay");

  if (!panel) return;

  renderWishlist();

  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  overlay?.classList.add("open");
}

function closeWishlist() {
  const panel = $("wishlistPanel");
  const overlay = $("wishlistOverlay");

  panel?.classList.remove("open");
  panel?.setAttribute("aria-hidden", "true");
  overlay?.classList.remove("open");
}

function getProfile() {
  return {
    gender: $("preferenceGender")?.value || "",
    favoriteCategories: [...document.querySelectorAll("[name='preferenceCategory']:checked")].map(input => input.value),
    favoriteColors: [...document.querySelectorAll("[name='preferenceColor']:checked")].map(input => input.value),
    favoriteStyles: [...document.querySelectorAll("[name='preferenceStyle']:checked")].map(input => input.value),
    favoriteOccasions: [...document.querySelectorAll("[name='preferenceOccasion']:checked")].map(input => input.value),
    favoriteMaterials: [...document.querySelectorAll("[name='preferenceMaterial']:checked")].map(input => input.value),
    budget: Number($("preferenceBudget")?.value || 0),
    minPrice: Number($("preferenceMinPrice")?.value || 0),
    maxPrice: Number($("preferenceMaxPrice")?.value || 0)
  };
}

function populateProfile() {
  const profile = state.userProfile || {};

  if ($("preferenceGender")) {
    $("preferenceGender").value = profile.gender || "";
  }

  const groups = [
    ["preferenceCategory", profile.favoriteCategories],
    ["preferenceColor", profile.favoriteColors],
    ["preferenceStyle", profile.favoriteStyles],
    ["preferenceOccasion", profile.favoriteOccasions],
    ["preferenceMaterial", profile.favoriteMaterials]
  ];

  groups.forEach(([name, values]) => {
    const selected = normalizeArray(values);

    document
      .querySelectorAll(`[name="${name}"]`)
      .forEach(input => {
        input.checked = selected.includes(input.value);
      });
  });

  if ($("preferenceBudget")) {
    $("preferenceBudget").value = profile.budget || 10000;
  }

  if ($("preferenceMinPrice")) {
    $("preferenceMinPrice").value = profile.minPrice ?? 0;
  }

  if ($("preferenceMaxPrice")) {
    $("preferenceMaxPrice").value = profile.maxPrice || 10000;
  }
}

function savePreferences() {
  state.userProfile = getProfile();

  localStorage.setItem(
    "fashionAIProfile",
    JSON.stringify(state.userProfile)
  );

  renderForYou();
  applyAllFilters();
}

function resetPreferences() {
  state.userProfile = {};

  localStorage.removeItem("fashionAIProfile");

  document
    .querySelectorAll(
      "#preferences-section input[type='checkbox']"
    )
    .forEach(input => {
      input.checked = false;
    });

  if ($("preferenceGender")) {
    $("preferenceGender").value = "";
  }

  if ($("preferenceBudget")) {
    $("preferenceBudget").value = 10000;
  }

  if ($("preferenceMinPrice")) {
    $("preferenceMinPrice").value = 0;
  }

  if ($("preferenceMaxPrice")) {
    $("preferenceMaxPrice").value = 10000;
  }

  renderForYou();
  applyAllFilters();
}

function renderForYou() {
  const container = $("forYouResults");
  if (!container || !state.allProducts.length) return;

  const personalized = applyPersonalization([
    ...state.allProducts
  ]);

  const products = personalized.length
    ? personalized.slice(0, 4)
    : state.allProducts.slice(0, 4);

  container.innerHTML = products
    .map(createProductCard)
    .join("");
}

function trackSearch(query) {
  const history = normalizeArray(
    state.userProfile.searchHistory
  );

  history.unshift(query);

  state.userProfile.searchHistory = [
    ...new Set(history)
  ].slice(0, 20);

  localStorage.setItem(
    "fashionAIProfile",
    JSON.stringify(state.userProfile)
  );
}

function learnPreference(product) {
  const profile = state.userProfile || {};

  profile.favoriteCategories = normalizeArray(
    profile.favoriteCategories
  );

  profile.favoriteStyles = normalizeArray(
    profile.favoriteStyles
  );

  profile.favoriteColors = normalizeArray(
    profile.favoriteColors
  );

  profile.favoriteOccasions = normalizeArray(
    profile.favoriteOccasions
  );

  const category = getProductCategory(product);
  const color = getProductColor(product);

  getProductStyles(product).forEach(style => {
    if (!profile.favoriteStyles.includes(style)) {
      profile.favoriteStyles.push(style);
    }
  });

  getProductOccasions(product).forEach(occasion => {
    if (!profile.favoriteOccasions.includes(occasion)) {
      profile.favoriteOccasions.push(occasion);
    }
  });

  if (
    category &&
    !profile.favoriteCategories.includes(category)
  ) {
    profile.favoriteCategories.push(category);
  }

  if (
    color &&
    color !== "—" &&
    !profile.favoriteColors.includes(color)
  ) {
    profile.favoriteColors.push(color);
  }

  state.userProfile = profile;

  localStorage.setItem(
    "fashionAIProfile",
    JSON.stringify(profile)
  );
}

function trackInteraction(product, type) {
  if (!product) return;

  const interactions = Array.isArray(
    state.userProfile.interactions
  )
    ? state.userProfile.interactions
    : [];

  interactions.unshift({
    id: getProductId(product),
    type,
    timestamp: Date.now()
  });

  state.userProfile.interactions =
    interactions.slice(0, 50);

  if (
    type === "wishlist" ||
    type === "view"
  ) {
    learnPreference(product);
  }

  localStorage.setItem(
    "fashionAIProfile",
    JSON.stringify(state.userProfile)
  );
}

function updateSearchSummary() {
  const summary = $("searchSummary");
  if (!summary) return;

  const count = state.visibleProducts.length;

  if (state.searchQuery) {
    summary.textContent =
      `${count} ${count === 1 ? "match" : "matches"} for “${state.searchQuery}”`;
    return;
  }

  summary.textContent =
    `${count} ${count === 1 ? "piece" : "pieces"} available in discovery`;
}

function updateCatalogueStats() {
  const count = $("resultCount");
  if (!count) return;

  count.textContent =
    `${state.visibleProducts.length} results`;
}

function clearAllFilters() {
  const ids = [
    "categoryFilter",
    "genderFilter",
    "colorFilter",
    "styleFilter",
    "occasionFilter",
    "materialFilter",
    "sortFilter"
  ];

  ids.forEach(id => {
    const element = $(id);
    if (element) element.value = "";
  });

  if ($("sortFilter")) {
    $("sortFilter").value = "relevance";
  }

  if ($("minPriceFilter")) {
    $("minPriceFilter").value = "";
  }

  if ($("maxPriceFilter")) {
    $("maxPriceFilter").value = "";
  }

  state.searchQuery = "";
  state.searchResults = [...state.allProducts];

  applyAllFilters();
}

function setupFilters() {
  const filterIds = [
    "categoryFilter",
    "genderFilter",
    "colorFilter",
    "styleFilter",
    "occasionFilter",
    "materialFilter",
    "minPriceFilter",
    "maxPriceFilter",
    "sortFilter"
  ];

  filterIds.forEach(id => {
    const element = $(id);

    if (!element) return;

    element.addEventListener("change", () => {
      applyAllFilters();
    });

    element.addEventListener("input", () => {
      if (
        id === "minPriceFilter" ||
        id === "maxPriceFilter"
      ) {
        applyAllFilters();
      }
    });
  });

  $("advancedSearchButton")?.addEventListener(
    "click",
    () => applyAllFilters()
  );

  $("resetFiltersButton")?.addEventListener(
    "click",
    clearAllFilters
  );
}

function setupQuickSearch() {
  document.querySelectorAll(".quick-search").forEach(button => {
    button.addEventListener("click", () => {
      const query = button.dataset.query || "";

      const input = $("searchInput");

      if (input) {
        input.value = query;
      }

      searchFashion(query);
    });
  });
}

function setupMobileFilters() {
  const sidebar = $("filterSidebar");
  const openButton = $("openFilters");
  const closeButton = $("closeFilters");

  if (!sidebar) return;

  openButton?.addEventListener("click", () => {
    sidebar.classList.add("mobile-open");
    sidebar.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
  });

  closeButton?.addEventListener("click", () => {
    sidebar.classList.remove("mobile-open");
    sidebar.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
  });
}

async function loadSuggestions(query) {
  const container = $("searchSuggestions");
  if (!container) return;

  const cleanQuery = String(query || "").trim();

  if (cleanQuery.length < 2) {
    container.innerHTML = "";
    return;
  }

  try {
    const data = await apiRequest(
      `/api/discovery/suggestions?q=${encodeURIComponent(cleanQuery)}`
    );

    const suggestions =
      data.suggestions ||
      data.results ||
      [];

    if (!Array.isArray(suggestions)) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = suggestions
      .slice(0, 5)
      .map(item => {
        const text =
          typeof item === "string"
            ? item
            : item?.query ?? item?.text ?? "";

        return `
          <button
            type="button"
            data-suggestion="${escapeHTML(text)}"
          >
            ${escapeHTML(text)}
          </button>
        `;
      })
      .join("");

    container
      .querySelectorAll("[data-suggestion]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const value =
            button.dataset.suggestion || "";

          $("searchInput").value = value;
          container.innerHTML = "";
          searchFashion(value);
        });
      });
  } catch {
    container.innerHTML = "";
  }
}

function setupSearchSuggestions() {
  const input = $("searchInput");
  if (!input) return;

  let timer;

  input.addEventListener("input", () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      loadSuggestions(input.value);
    }, 280);
  });
}

async function runAIStylist() {
  const occasion = $("stylistOccasion")?.value || "";
  const style = $("stylistStyle")?.value || "";
  const comfort = $("stylistComfort")?.value || "";
  const color = $("stylistColor")?.value || "";
  const coverage = $("stylistCoverage")?.value || "";
  const description =
    $("stylistDescription")?.value || "";

  const button = $("stylistButton");

  if (button) {
    button.disabled = true;
    button.innerHTML = "<span>✦</span> Building your look...";
  }

  try {
    const data = await apiRequest("/api/stylist", {
      method: "POST",
      body: JSON.stringify({
        occasion,
        style,
        comfort,
        color,
        coverage,
        description
      })
    });

    const recommendations =
      data.recommendations ||
      data.results ||
      [];

    if (Array.isArray(recommendations) && recommendations.length) {
      state.searchResults = recommendations;
      state.searchQuery = "AI Stylist";
      applyAllFilters();

      $("results")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      renderStylistResults(recommendations);
    } else {
      const query = [
        occasion,
        style,
        comfort,
        color,
        coverage,
        description
      ]
        .filter(Boolean)
        .join(" ");

      await searchFashion(query);
    }
  } catch {
    const query = [
      occasion,
      style,
      comfort,
      color,
      coverage,
      description
    ]
      .filter(Boolean)
      .join(" ");

    await searchFashion(query);
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = "<span>✦</span> Generate AI Look";
    }
  }
}

function renderStylistResults(products) {
  const container = $("stylistResults");
  if (!container) return;

  const list = products
    .slice(0, 4)
    .map(createProductCard)
    .join("");

  container.innerHTML = `
    <div>
      <p class="eyebrow">YOUR AI EDIT</p>
      <div class="product-grid">
        ${list}
      </div>
    </div>
  `;
}

function setupStylist() {
  $("stylistButton")?.addEventListener(
    "click",
    runAIStylist
  );
}

function setupNavigation() {
  document.addEventListener("click", event => {
    const target = event.target.closest("[data-scroll]");
    if (!target) return;

    const id = target.dataset.scroll;
    const element = $(id);

    if (!element) return;

    event.preventDefault();

    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function setupWishlist() {
  $("wishlistButton")?.addEventListener(
    "click",
    openWishlist
  );

  $("closeWishlist")?.addEventListener(
    "click",
    closeWishlist
  );

  $("wishlistOverlay")?.addEventListener(
    "click",
    closeWishlist
  );
}

function setupPreferences() {
  $("savePreferences")?.addEventListener(
    "click",
    savePreferences
  );

  $("resetPreferences")?.addEventListener(
    "click",
    resetPreferences
  );
}

function setupModal() {
  $("closeProductModal")?.addEventListener(
    "click",
    closeProductModal
  );

  $("productModal")?.querySelector(
    ".product-modal-overlay"
  )?.addEventListener(
    "click",
    closeProductModal
  );
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", event => {
    const active = document.activeElement;

    const isTyping =
      active &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(
        active.tagName
      );

    if (
      event.key === "/" &&
      !isTyping
    ) {
      event.preventDefault();
      $("searchInput")?.focus();
    }

    if (event.key === "Escape") {
      closeProductModal();
      closeWishlist();
    }
  });
}

function getDiscoveryState() {
  return {
    query: state.searchQuery || "",
    category: state.selectedCategory || "",
    gender: state.selectedGender || "",
    color: state.selectedColor || "",
    style: state.selectedStyle || "",
    occasion: state.selectedOccasion || "",
    material: state.selectedMaterial || "",
    minPrice: Number.isFinite(state.minPrice)
      ? state.minPrice
      : "",
    maxPrice: Number.isFinite(state.maxPrice)
      ? state.maxPrice
      : "",
    sort: state.sortBy || "relevance",
    page: discoveryPage,
    pageSize: discoveryPageSize
  };
}

async function loadDiscoveryPage(page = 1) {
  discoveryPage = Math.max(1, Number(page) || 1);

  try {
    const data = await apiRequest(
      "/api/discovery",
      {
        method: "POST",
        body: JSON.stringify(
          getDiscoveryState()
        )
      }
    );

    const items = Array.isArray(data.items)
      ? data.items
      : [];

    state.searchResults = items;

    renderProducts(items);
    renderDiscoveryPagination(
      data.pagination
    );

    updateSearchSummary();
    updateCatalogueStats();

    return data;
  } catch {
    return null;
  }
}

function renderDiscoveryPagination(pagination) {
  const container = $("discoveryPagination");

  if (!container || !pagination) return;

  const page = Number(pagination.page || 1);
  const totalPages =
    Number(pagination.totalPages || 1);

  const hasPrevious =
    pagination.hasPrevious ??
    page > 1;

  const hasNext =
    pagination.hasNext ??
    page < totalPages;

  container.innerHTML = `
    <button
      type="button"
      ${hasPrevious ? "" : "disabled"}
      data-page="${page - 1}"
    >
      Previous
    </button>

    <span>${page} / ${totalPages}</span>

    <button
      type="button"
      ${hasNext ? "" : "disabled"}
      data-page="${page + 1}"
    >
      Next
    </button>
  `;

  container
    .querySelectorAll("button[data-page]")
    .forEach(button => {
      button.addEventListener("click", () => {
        loadDiscoveryPage(
          Number(button.dataset.page)
        );
      });
    });
}

function setupDiscoveryPagination() {
  const container = $("discoveryPagination");

  if (!container) return;

  container.addEventListener("click", event => {
    const button =
      event.target.closest("[data-page]");

    if (!button || button.disabled) return;

    loadDiscoveryPage(
      Number(button.dataset.page)
    );
  });
}

async function initialize() {
  setupSearch();
  setupFilters();
  setupQuickSearch();
  setupMobileFilters();
  setupStylist();
  setupNavigation();
  setupWishlist();
  setupPreferences();
  setupModal();
  setupKeyboardShortcuts();
  setupDiscoveryPagination();
  setupSearchSuggestions();

  populateProfile();
  updateWishlistCount();

  await checkBackend();
  await loadProducts();

  renderForYou();
  renderWishlist();
}

window.runSearch = runSearch;
window.searchFashion = searchFashion;
window.loadProducts = loadProducts;
window.clearAllFilters = clearAllFilters;
window.toggleWishlist = toggleWishlist;
window.selectProduct = selectProduct;
window.closeProductModal = closeProductModal;
window.runAIStylist = runAIStylist;
window.loadDiscoveryPage = loadDiscoveryPage;

document.addEventListener(
  "DOMContentLoaded",
  initialize
);
