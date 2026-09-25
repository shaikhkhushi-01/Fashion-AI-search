const API_BASE_URL = "https://fashion-ai-search-lj6s.onrender.com";
const LOCAL_CATALOGUE_URL = "./data/products.json?v=408";
let localCatalogueLoadPromise = null;

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

async function loadLocalCatalogue() {
  if (!localCatalogueLoadPromise) {
    localCatalogueLoadPromise = fetch(LOCAL_CATALOGUE_URL, { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Local catalogue request failed: " + response.status);
        return response.json();
      })
      .then(data => {
        const products = Array.isArray(data) ? data : (data.products || data.results || data.data || []);
        if (!Array.isArray(products) || !products.length) throw new Error("Local catalogue is empty");
        return products;
      });
  }
  return localCatalogueLoadPromise;
}

function normalizeSearchText(value) {
  return String(value || "").toLowerCase().trim();
}

function getCategoryAliases() {
  return {
    shirt: ["shirt", "shirts", "tshirt", "t-shirts", "t-shirt", "top", "tops"],
    dress: ["dress", "dresses"],
    jeans: ["jean", "jeans"],
    trousers: ["trouser", "trousers", "pant", "pants"],
    sneaker: ["sneaker", "sneakers", "shoe", "shoes"],
    jacket: ["jacket", "jackets", "blazer", "blazers"],
    hoodie: ["hoodie", "hoodies"],
    skirt: ["skirt", "skirts"]
  };
}

function parseLocalQuery(query) {
  const text = normalizeSearchText(query);
  const colors = ["black","white","cream","blue","grey","gray","red","green","beige","brown"];
  const aliases = getCategoryAliases();
  let color = colors.find(c => new RegExp("\\b" + c + "\\b", "i").test(text)) || "";
  if (color === "gray") color = "grey";
  let category = "";
  for (const [canonical, words] of Object.entries(aliases)) {
    if (words.some(word => new RegExp("\\b" + word.replace(/[-]/g, "\\-") + "\\b", "i").test(text))) {
      category = canonical;
      break;
    }
  }
  return { text, color, category };
}

function extractLocalBudget(query) {
  const text = normalizeSearchText(query).replace(/,/g, "");
  const match = text.match(/(?:under|below|less than|upto|up to|max(?:imum)?|within)\s*(?:₹|rs\.?|inr\s*)?(\d+(?:\.\d+)?)\s*(k|thousand)?/i)
    || text.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)\s*(k|thousand)?/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value * (match[2] ? 1000 : 1) : null;
}

function productMatchesText(product, parsed) {
  const haystack = [
    getProductName(product), getProductCategory(product), getProductColor(product),
    getProductGender(product), getProductMaterial(product), getProductDescription(product),
    getProductStyles(product).join(" "), getProductOccasions(product).join(" "),
    normalizeArray(product?.tags).join(" ")
  ].join(" ").toLowerCase();
  const stop = new Set(["show","find","give","me","need","want","for","with","under","below","less","than","upto","up","to","max","maximum","within","the","and","a","an"]);
  return parsed.text.split(/\s+/).some(word => word.length > 2 && !stop.has(word) && haystack.includes(word));
}

function scoreLocalProduct(product, parsed) {
  let score = 0;
  const category = getProductCategory(product).toLowerCase();
  const color = getProductColor(product).toLowerCase();
  if (parsed.category && (getCategoryAliases()[parsed.category] || []).some(a => category === a)) score += 100;
  if (parsed.color && color === parsed.color) score += 100;
  if (productMatchesText(product, parsed)) score += 10;
  return score;
}

function matchesFilter(product) {
  if (state.selectedCategory && getProductCategory(product).toLowerCase() !== state.selectedCategory.toLowerCase()) return false;
  if (state.selectedGender && getProductGender(product).toLowerCase() !== state.selectedGender.toLowerCase()) return false;
  if (state.selectedColor && getProductColor(product).toLowerCase() !== state.selectedColor.toLowerCase()) return false;
  if (state.selectedStyle && !getProductStyles(product).some(v => v.toLowerCase() === state.selectedStyle.toLowerCase())) return false;
  if (state.selectedOccasion && !getProductOccasions(product).some(v => v.toLowerCase() === state.selectedOccasion.toLowerCase())) return false;
  if (state.selectedMaterial && getProductMaterial(product).toLowerCase() !== state.selectedMaterial.toLowerCase()) return false;
  const price = getProductPrice(product);
  if (Number.isFinite(state.minPrice) && price < state.minPrice) return false;
  if (Number.isFinite(state.maxPrice) && price > state.maxPrice) return false;
  return true;
}

function readFilters() {
  state.selectedCategory = $("categoryFilter")?.value || "";
  state.selectedGender = $("genderFilter")?.value || "";
  state.selectedColor = $("colorFilter")?.value || "";
  state.selectedStyle = $("styleFilter")?.value || "";
  state.selectedOccasion = $("occasionFilter")?.value || "";
  state.selectedMaterial = $("materialFilter")?.value || "";
  state.minPrice = Number($("minPriceFilter")?.value || 0);
  const max = $("maxPriceFilter")?.value;
  state.maxPrice = max === "" || max == null ? Infinity : Number(max);
  state.sortBy = $("sortFilter")?.value || "relevance";
}

function applyPersonalization(products) {
  const profile = state.userProfile || {};
  const cats = normalizeArray(profile.favoriteCategories).map(v => v.toLowerCase());
  const colors = normalizeArray(profile.favoriteColors).map(v => v.toLowerCase());
  const styles = normalizeArray(profile.favoriteStyles).map(v => v.toLowerCase());
  const occasions = normalizeArray(profile.favoriteOccasions).map(v => v.toLowerCase());
  const gender = String(profile.gender || "").toLowerCase();
  const budget = Number(profile.budget || 0);
  return products.map(product => {
    let score = 0;
    if (gender && getProductGender(product).toLowerCase() === gender) score += 4;
    if (cats.includes(getProductCategory(product).toLowerCase())) score += 5;
    if (colors.includes(getProductColor(product).toLowerCase())) score += 5;
    if (styles.some(v => getProductStyles(product).some(s => s.toLowerCase() === v))) score += 3;
    if (occasions.some(v => getProductOccasions(product).some(o => o.toLowerCase() === v))) score += 2;
    if (budget > 0 && getProductPrice(product) <= budget) score += 2;
    return { product, score };
  }).sort((a,b) => b.score - a.score).map(x => x.product);
}

function showNoResults() {
  const results = $("results");
  if (!results) return;
  results.innerHTML = '<div class="no-results"><h3>No exact catalogue match</h3><p>Try another colour, category, or a wider budget.</p></div>';
  updateSearchSummary();
  updateCatalogueStats();
}

function updateBackendStatus(online) {
  state.backendOnline = Boolean(online);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(API_BASE_URL + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error("Request failed: " + response.status);
  return response.json();
}

function populateFilterOptions() {
  const configs = [
    ["categoryFilter", state.allProducts.map(getProductCategory)],
    ["genderFilter", state.allProducts.map(getProductGender)],
    ["colorFilter", state.allProducts.map(getProductColor)],
    ["styleFilter", state.allProducts.flatMap(getProductStyles)],
    ["occasionFilter", state.allProducts.flatMap(getProductOccasions)],
    ["materialFilter", state.allProducts.map(getProductMaterial)]
  ];
  configs.forEach(([id, values]) => {
    const select = $(id);
    if (!select) return;
    const current = select.value;
    const unique = [...new Set(values.filter(Boolean).map(String))].sort((a,b) => a.localeCompare(b));
    select.innerHTML = '<option value="">All</option>' + unique.map(v => '<option value="' + escapeHTML(v) + '">' + escapeHTML(v) + '</option>').join("");
    select.value = unique.includes(current) ? current : "";
  });
}

async function loadProducts() {
  state.loading = true;
  try {
    const products = await loadLocalCatalogue();
    state.allProducts = products;
    state.searchResults = [...products];
    state.visibleProducts = [...products];
    populateFilterOptions();
    applyAllFilters();
    renderForYou();
    return products;
  } catch (error) {
    console.error("Catalogue load failed:", error);
    state.allProducts = [];
    state.searchResults = [];
    state.visibleProducts = [];
    const results = $("results");
    if (results) results.innerHTML = '<div class="no-results"><h3>Catalogue is unavailable</h3><p>Please refresh once; the site is designed to work without the AI server.</p></div>';
    const forYou = $("forYouResults");
    if (forYou) forYou.innerHTML = '<div class="empty-state"><h3>For You is loading</h3><p>Product catalogue could not be loaded.</p></div>';
    updateSearchSummary();
    updateCatalogueStats();
    return [];
  } finally {
    state.loading = false;
  }
}

async function searchFashion(query) {
  const clean = String(query || "").trim();
  if (!clean) {
    state.searchQuery = "";
    state.searchResults = [...state.allProducts];
    applyAllFilters();
    return state.visibleProducts;
  }
  const parsed = parseLocalQuery(clean);
  const budget = extractLocalBudget(clean);
  const exact = state.allProducts.filter(product => {
    if (parsed.color && getProductColor(product).toLowerCase() !== parsed.color) return false;
    if (parsed.category) {
      const aliases = getCategoryAliases()[parsed.category] || [];
      if (!aliases.some(a => getProductCategory(product).toLowerCase() === a)) return false;
    }
    if (budget != null && getProductPrice(product) > budget) return false;
    return true;
  });
  const results = exact.length ? exact : state.allProducts
    .filter(product => budget == null || getProductPrice(product) <= budget)
    .map(product => ({ product, score: scoreLocalProduct(product, parsed) }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .map(x => x.product);
  state.searchQuery = clean;
  state.searchResults = results.slice(0, 12);
  state.visibleProducts = state.searchResults;
  renderProducts(state.visibleProducts);
  updateSearchSummary();
  updateCatalogueStats();
  trackSearch(clean);
  return state.visibleProducts;
}

function setupSearch() {
  const input = $("searchInput");
  const button = $("searchButton");
  if (button) button.addEventListener("click", () => searchFashion(input?.value || ""));
  if (input) input.addEventListener("keydown", event => { if (event.key === "Enter") searchFashion(input.value); });
}

function fashionSvgData(product, model = false) {
  const category = String(getProductCategory(product) || "shirt").toLowerCase();
  const colorName = String(getProductColor(product) || "black").toLowerCase();
  const colors = {
    black:"#17171b", white:"#f4f1eb", blue:"#2563eb", red:"#c62828",
    green:"#2f6b45", beige:"#c8ad86", grey:"#777b82", gray:"#777b82",
    brown:"#754c32"
  };
  const fill = colors[colorName] || "#777b82";
  const bg = "#f5f1e9";
  const descriptor = [product?.name, product?.description, product?.style, product?.styles, product?.tags, product?.fit]
    .flat().filter(Boolean).join(" ").toLowerCase();
  const variant = /oversized|oversize|boxy|loose/.test(descriptor) ? "oversized"
    : /relaxed/.test(descriptor) ? "relaxed"
    : /slim|fitted|tailored/.test(descriptor) ? "slim"
    : /cropped|crop/.test(descriptor) ? "cropped"
    : /polo/.test(descriptor) ? "polo"
    : /button|oxford/.test(descriptor) ? "buttondown" : "regular";
  const safe = (v) => String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  let garment = "";
  if (["dress","dresses"].includes(category)) {
    garment = `<path d="M190 215 L230 250 L205 315 L150 610 Q250 670 350 610 L295 315 L270 250 L310 215 L282 175 L250 205 L218 175 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M225 250 Q250 270 275 250" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="5"/>`;
  } else if (["skirt","skirts"].includes(category)) {
    garment = `<path d="M215 225 L285 225 L320 570 Q250 615 180 570 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M190 280 H310" stroke="#fff" stroke-opacity=".25" stroke-width="5"/>`;
  } else if (["trousers","trouser","pants","jeans"].includes(category)) {
    garment = `<path d="M185 210 H315 L325 370 L300 625 H252 L235 420 L218 625 H170 L175 370 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M250 225 V420" stroke="#fff" stroke-opacity=".25" stroke-width="5"/>`;
  } else if (["jacket","jackets","blazer","blazers"].includes(category)) {
    garment = `<path d="M205 180 L235 210 L250 300 L265 210 L295 180 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M235 210 L250 300 L265 210" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5"/>`;
  } else if (["hoodie","hoodies"].includes(category)) {
    garment = `<path d="M205 215 Q250 165 295 215 L350 255 L315 330 L295 305 V610 H205 V305 L185 330 L150 255 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M220 215 Q250 250 280 215" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5"/><path d="M225 425 H275" stroke="#fff" stroke-opacity=".25" stroke-width="10"/>`;
  } else if (["sneaker","sneakers"].includes(category)) {
    garment = `<path d="M150 430 Q205 410 250 465 L315 520 Q345 545 350 585 H145 Q125 555 150 430 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M175 535 H320" stroke="#fff" stroke-opacity=".65" stroke-width="10"/><path d="M205 455 L245 515" stroke="#fff" stroke-opacity=".45" stroke-width="6"/>`;
  } else {
    const shirt = {
      regular: '<path d="M205 185 L235 215 L250 285 L265 215 L295 185 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="' + fill + '" stroke="#24242a" stroke-width="6"/><path d="M220 220 Q250 245 280 220" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>',
      relaxed: '<path d="M198 185 L232 212 L250 285 L268 212 L302 185 L365 248 L325 315 L315 625 H185 L175 315 L135 248 Z" fill="' + fill + '" stroke="#24242a" stroke-width="6"/><path d="M218 220 Q250 250 282 220" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>',
      oversized: '<path d="M190 175 L230 208 L250 285 L270 208 L310 175 L385 250 L335 335 L330 635 H170 L165 335 L115 250 Z" fill="' + fill + '" stroke="#24242a" stroke-width="6"/><path d="M215 215 Q250 250 285 215" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>',
      slim: '<path d="M220 190 L238 215 L250 285 L262 215 L280 190 L325 245 L295 295 L285 610 H215 L205 295 L175 245 Z" fill="' + fill + '" stroke="#24242a" stroke-width="6"/><path d="M228 220 Q250 238 272 220" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>',
      cropped: '<path d="M210 190 L238 215 L250 280 L262 215 L290 190 L345 245 L312 295 L300 455 H200 L188 295 L155 245 Z" fill="' + fill + '" stroke="#24242a" stroke-width="6"/><path d="M225 220 Q250 242 275 220" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>',
      polo: '<path d="M205 185 L235 215 L250 285 L265 215 L295 185 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="' + fill + '" stroke="#24242a" stroke-width="6"/><path d="M230 205 L250 250 L270 205 L262 285 L250 300 L238 285 Z" fill="#f5f1e9" stroke="#24242a" stroke-width="4"/>',
      buttondown: '<path d="M205 185 L235 215 L250 285 L265 215 L295 185 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="' + fill + '" stroke="#24242a" stroke-width="6"/><path d="M250 210 V610" stroke="#fff" stroke-opacity=".45" stroke-width="4"/><circle cx="250" cy="300" r="4" fill="#fff"/><circle cx="250" cy="355" r="4" fill="#fff"/><circle cx="250" cy="410" r="4" fill="#fff"/>'
    };
    garment = shirt[variant] || shirt.regular;
  }
  const person = model ? `<circle cx="250" cy="105" r="48" fill="#d8a27c" stroke="#24242a" stroke-width="5"/><path d="M205 105 Q250 45 295 105" fill="#24242a"/>` : "";
  const shadow = model ? "" : '<ellipse cx="250" cy="650" rx="135" ry="20" fill="#000" opacity=".08"/>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 720"><rect width="500" height="720" rx="28" fill="${bg}"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#ddd6ca" stop-opacity=".25"/></linearGradient></defs><rect x="18" y="18" width="464" height="684" rx="22" fill="url(#g)"/>${person}${garment}${shadow}<text x="250" y="680" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#555">${safe(colorName)} ${safe(category)}</text></svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function bundledFashionImage(product) {
  return fashionSvgData(product, false);
}

function productVisual(product) {
  return `<img class="product-image" src="${escapeHTML(bundledFashionImage(product))}" alt="${escapeHTML(getProductName(product))}" loading="lazy">`;
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

      <div class="product-model-preview">
        <div class="product-model-media">
          <img class="product-model-image" src="${escapeHTML(fashionSvgData(product, true))}" alt="Fashion model wearing ${escapeHTML(name)}" loading="lazy"
           >
        </div>
        <span class="product-model-label">MODEL PHOTO</span>
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

  if (typeof setupAIModelImageLoading === "function") {
    setupAIModelImageLoading();
  }
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

  const personalized = applyPersonalization([...state.allProducts]);
  const candidatePool = [...personalized, ...state.allProducts]
    .filter((product, index, list) => list.findIndex(item => getProductId(item) === getProductId(product)) === index);

  // Keep "For You" useful but visually diverse: a learned preference can rank
  // a single colour highly, but it must not fill every recommendation slot.
  const products = [];
  const usedCategories = new Set();
  const usedColors = new Set();

  for (const product of candidatePool) {
    const category = getProductCategory(product).toLowerCase();
    const color = getProductColor(product).toLowerCase();
    if (!usedCategories.has(category) && !usedColors.has(color)) {
      products.push(product);
      usedCategories.add(category);
      usedColors.add(color);
    }
    if (products.length >= 4) break;
  }

  for (const product of candidatePool) {
    if (products.length >= 4) break;
    if (!products.includes(product)) products.push(product);
  }

  container.innerHTML = products
    .slice(0, 4)
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

  updateBackendStatus(false);
  await loadProducts();

  renderForYou();
  renderWishlist();
}

window.runSearch = searchFashion;
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
