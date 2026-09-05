const API_BASE_URL = "https://fashion-ai-search-lj6s.onrender.com";

const state = {
    allProducts: [],
    visibleProducts: [],
    searchResults: [],
    searchQuery: "",
    selectedCategory: "All",
    selectedGender: "All",
    selectedColor: "All",
    selectedStyle: "All",
    maxPrice: 15000,
    sortBy: "relevance",
    wishlist: JSON.parse(localStorage.getItem("fashionWishlist") || "[]"),
    userProfile: JSON.parse(localStorage.getItem("fashionUserProfile") || "{}"),
    loading: false,
    backendOnline: false
};


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatPrice(price) {
    const numericPrice = Number(price) || 0;

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(numericPrice);
}

function normalizeArray(value) {
    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
        return value
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}

function getProductId(product) {
    return String(
        product.id ??
        product.product_id ??
        product.productId ??
        product.name ??
        Math.random()
    );
}

function getProductName(product) {
    return (
        product.name ||
        product.title ||
        product.product_name ||
        "Fashion Product"
    );
}

function getProductCategory(product) {
    return (
        product.category ||
        product.product_category ||
        "Fashion"
    );
}

function getProductGender(product) {
    return (
        product.gender ||
        product.target_gender ||
        "Unisex"
    );
}

function getProductColor(product) {
    return (
        product.color ||
        product.colour ||
        "Classic"
    );
}

function getProductPrice(product) {
    return Number(
        product.price ??
        product.sale_price ??
        product.cost ??
        0
    );
}

function getProductStyles(product) {
    return normalizeArray(
        product.style ||
        product.styles ||
        product.tags
    );
}

function getProductOccasions(product) {
    return normalizeArray(
        product.occasion ||
        product.occasions
    );
}

function getProductMaterial(product) {
    return (
        product.material ||
        product.fabric ||
        ""
    );
}

function getProductDescription(product) {
    return (
        product.description ||
        product.desc ||
        `${getProductCategory(product)} designed for modern fashion discovery.`
    );
}


/* =========================================================
   PRODUCT VISUAL
   ========================================================= */

function productVisual(product) {
    const image =
        product.image ||
        product.image_url ||
        product.imageUrl ||
        product.thumbnail;

    if (image) {
        return `
            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(getProductName(product))}"
                class="product-image"
                loading="lazy"
                onerror="this.style.display='none'; this.parentElement.classList.add('image-fallback');"
            >
        `;
    }

    const category = getProductCategory(product);

    const icons = {
        Shirts: "👔",
        "T-Shirts": "👕",
        Dresses: "👗",
        Jeans: "👖",
        Trousers: "👖",
        Hoodies: "🧥",
        Blazers: "🧥",
        Jackets: "🧥",
        Coats: "🧥",
        Sneakers: "👟",
        Shoes: "👟",
        Saree: "🥻",
        Kurta: "👘",
        Kurti: "👘",
        Abaya: "🧕",
        Skirts: "👗",
        Suits: "🤵",
        Gowns: "👗",
        Tops: "👚"
    };

    return `
        <div class="product-placeholder">
            <span>${icons[category] || "✦"}</span>
        </div>
    `;
}


/* =========================================================
   LOADING / ERROR UI
   ========================================================= */

function showLoading() {
    const results = $("results");

    if (!results) return;

    results.innerHTML = `
        <div class="catalogue-loading">
            <div class="loading-spinner"></div>
            <p>AI is finding the best fashion matches...</p>
        </div>
    `;
}

function showError(message) {
    const results = $("results");

    if (!results) return;

    results.innerHTML = `
        <div class="catalogue-message error-message">
            <div class="message-icon">⚠</div>
            <h3>Something went wrong</h3>
            <p>${escapeHTML(message)}</p>
            <button class="secondary-btn" onclick="loadProducts()">
                Try Again
            </button>
        </div>
    `;
}

function showNoResults() {
    const results = $("results");

    if (!results) return;

    results.innerHTML = `
        <div class="catalogue-message">
            <div class="message-icon">⌕</div>
            <h3>No fashion matches found</h3>
            <p>
                Try another search or relax one of your filters.
            </p>
            <button class="secondary-btn" onclick="clearAllFilters()">
                Clear Filters
            </button>
        </div>
    `;
}


/* =========================================================
   API
   ========================================================= */

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


/* =========================================================
   BACKEND CHECK
   ========================================================= */

async function checkBackend() {
    try {
        const data = await apiRequest("/api/health");

        state.backendOnline = true;

        updateBackendStatus(true, data);

        return true;
    } catch (error) {
        state.backendOnline = false;

        updateBackendStatus(false);

        return false;
    }
}

function updateBackendStatus(online, data = null) {
    const status = $("backendStatus");

    if (!status) return;

    if (online) {
        status.innerHTML = `
            <span class="status-dot online"></span>
            AI Engine Online
        `;

        status.title = data?.version || "Backend connected";
    } else {
        status.innerHTML = `
            <span class="status-dot offline"></span>
            AI Engine Offline
        `;
    }
}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {
    try {
        state.loading = true;

        showLoading();

        const data = await apiRequest("/api/products");

        const products =
            data.products ||
            data.results ||
            data.data ||
            [];

        state.allProducts = Array.isArray(products)
            ? products
            : [];

        buildFilterOptions();

        applyAllFilters();

        state.loading = false;

        updateCatalogueStats();

    } catch (error) {
        console.error("Product loading error:", error);

        state.loading = false;

        /*
         * Small local fallback.
         * If backend is sleeping temporarily, UI remains usable.
         */
        if (state.allProducts.length > 0) {
            applyAllFilters();
        } else {
            showError(
                "Fashion catalogue is temporarily unavailable. Please try again."
            );
        }
    }
}


/* =========================================================
   SEARCH
   ========================================================= */

async function searchFashion(query) {
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) {
        state.searchQuery = "";

        state.searchResults = [...state.allProducts];

        applyAllFilters();

        return;
    }

    state.searchQuery = cleanQuery;

    try {
        showLoading();

        const data = await apiRequest("/api/ai-search", {
            method: "POST",
            body: JSON.stringify({
                query: cleanQuery
            })
        });

        const results =
            data.results ||
            data.products ||
            [];

        state.searchResults = Array.isArray(results)
            ? results
            : [];

        /*
         * Track query for personalization.
         */
        trackSearch(cleanQuery);

        applyAllFilters();

    } catch (error) {
        console.error("Search error:", error);

        /*
         * Local fallback search.
         */
        state.searchResults = localSearch(cleanQuery);

        trackSearch(cleanQuery);

        applyAllFilters();
    }
}


/* =========================================================
   LOCAL SEARCH FALLBACK
   ========================================================= */

function localSearch(query) {
    const q = query.toLowerCase();

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

            if (searchableText.includes(q)) {
                score += 10;
            }

            q.split(/\s+/).forEach(word => {
                if (word.length > 2 && searchableText.includes(word)) {
                    score += 2;
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


/* =========================================================
   SEARCH EVENTS
   ========================================================= */

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


/* =========================================================
   FILTER OPTIONS
   ========================================================= */

function uniqueValues(values) {
    return [...new Set(
        values
            .filter(Boolean)
            .map(value => String(value).trim())
    )].sort();
}

function buildFilterOptions() {
    const products = state.allProducts;

    const categories = uniqueValues(
        products.map(getProductCategory)
    );

    const genders = uniqueValues(
        products.map(getProductGender)
    );

    const colors = uniqueValues(
        products.map(getProductColor)
    );

    const styles = uniqueValues(
        products.flatMap(getProductStyles)
    );

    populateSelect(
        "categoryFilter",
        categories,
        "All Categories"
    );

    populateSelect(
        "genderFilter",
        genders,
        "All Genders"
    );

    populateSelect(
        "colorFilter",
        colors,
        "All Colors"
    );

    populateSelect(
        "styleFilter",
        styles,
        "All Styles"
    );

    const prices = products.map(getProductPrice);

    const highestPrice = Math.max(
        ...prices,
        15000
    );

    state.maxPrice = highestPrice;

    const priceRange = $("priceFilter");

    if (priceRange) {
        priceRange.max = String(highestPrice);
        priceRange.value = String(highestPrice);
    }

    updatePriceLabel(highestPrice);
}

function populateSelect(id, values, defaultLabel) {
    const select = $(id);

    if (!select) return;

    select.innerHTML = `
        <option value="All">${escapeHTML(defaultLabel)}</option>
        ${values.map(value => `
            <option value="${escapeHTML(value)}">
                ${escapeHTML(value)}
            </option>
        `).join("")}
    `;
}


/* =========================================================
   FILTER LOGIC
   ========================================================= */

function applyAllFilters() {
    let sourceProducts = state.searchQuery
        ? state.searchResults
        : state.allProducts;

    let filtered = [...sourceProducts];

    /*
     * Category
     */
    if (state.selectedCategory !== "All") {
        filtered = filtered.filter(product =>
            getProductCategory(product).toLowerCase() ===
            state.selectedCategory.toLowerCase()
        );
    }

    /*
     * Gender
     */
    if (state.selectedGender !== "All") {
        filtered = filtered.filter(product =>
            getProductGender(product).toLowerCase() ===
            state.selectedGender.toLowerCase()
        );
    }

    /*
     * Color
     */
    if (state.selectedColor !== "All") {
        filtered = filtered.filter(product =>
            getProductColor(product).toLowerCase() ===
            state.selectedColor.toLowerCase()
        );
    }

    /*
     * Style
     */
    if (state.selectedStyle !== "All") {
        filtered = filtered.filter(product => {
            const styles = getProductStyles(product)
                .map(style => style.toLowerCase());

            return styles.includes(
                state.selectedStyle.toLowerCase()
            );
        });
    }

    /*
     * Price
     */
    filtered = filtered.filter(product =>
        getProductPrice(product) <= state.maxPrice
    );

    /*
     * Personalization
     */
    filtered = applyPersonalization(filtered);

    /*
     * Sorting
     */
    filtered = sortProducts(filtered);

    state.visibleProducts = filtered;

    renderProducts(filtered);

    updateCatalogueStats();

    updateSearchSummary();
}


/* =========================================================
   SORTING
   ========================================================= */

function sortProducts(products) {
    const result = [...products];

    switch (state.sortBy) {
        case "price-low":
            return result.sort(
                (a, b) => getProductPrice(a) - getProductPrice(b)
            );

        case "price-high":
            return result.sort(
                (a, b) => getProductPrice(b) - getProductPrice(a)
            );

        case "name":
            return result.sort(
                (a, b) =>
                    getProductName(a).localeCompare(
                        getProductName(b)
                    )
            );

        case "relevance":
        default:
            return result;
    }
}


/* =========================================================
   PERSONALIZATION
   ========================================================= */

function applyPersonalization(products) {
    const profile = state.userProfile || {};

    const favoriteCategories =
        normalizeArray(profile.favoriteCategories);

    const favoriteStyles =
        normalizeArray(profile.favoriteStyles);

    const favoriteColors =
        normalizeArray(profile.favoriteColors);

    const favoriteOccasions =
        normalizeArray(profile.favoriteOccasions);

    if (
        favoriteCategories.length === 0 &&
        favoriteStyles.length === 0 &&
        favoriteColors.length === 0 &&
        favoriteOccasions.length === 0
    ) {
        return products;
    }

    return products
        .map(product => {
            let personalizationScore = 0;

            const category = getProductCategory(product);
            const color = getProductColor(product);

            const styles = getProductStyles(product);
            const occasions = getProductOccasions(product);

            if (
                favoriteCategories.some(item =>
                    item.toLowerCase() === category.toLowerCase()
                )
            ) {
                personalizationScore += 5;
            }

            if (
                favoriteColors.some(item =>
                    item.toLowerCase() === color.toLowerCase()
                )
            ) {
                personalizationScore += 3;
            }

            styles.forEach(style => {
                if (
                    favoriteStyles.some(item =>
                        item.toLowerCase() === style.toLowerCase()
                    )
                ) {
                    personalizationScore += 3;
                }
            });

            occasions.forEach(occasion => {
                if (
                    favoriteOccasions.some(item =>
                        item.toLowerCase() === occasion.toLowerCase()
                    )
                ) {
                    personalizationScore += 2;
                }
            });

            return {
                ...product,
                _personalizationScore: personalizationScore
            };
        })
        .sort(
            (a, b) =>
                (b._personalizationScore || 0) -
                (a._personalizationScore || 0)
        );
}


/* =========================================================
   PRODUCT CARDS
   ========================================================= */

function createProductCard(product) {
    const id = getProductId(product);

    const name = getProductName(product);
    const category = getProductCategory(product);
    const gender = getProductGender(product);
    const color = getProductColor(product);
    const price = getProductPrice(product);
    const material = getProductMaterial(product);
    const styles = getProductStyles(product);

    const isLiked = state.wishlist.includes(id);

    return `
        <article
            class="product-card"
            data-product-id="${escapeHTML(id)}"
        >

            <div class="product-media">

                ${productVisual(product)}

                <button
                    class="wishlist-button ${isLiked ? "liked" : ""}"
                    onclick="toggleWishlist('${escapeHTML(id)}')"
                    aria-label="Add to wishlist"
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
                    ${escapeHTML(
                        getProductDescription(product)
                    )}
                </p>

                <div class="product-tags">
                    ${
                        styles
                            .slice(0, 3)
                            .map(style => `
                                <span class="product-tag">
                                    ${escapeHTML(style)}
                                </span>
                            `)
                            .join("")
                    }

                    ${
                        material
                            ? `
                                <span class="product-tag">
                                    ${escapeHTML(material)}
                                </span>
                            `
                            : ""
                    }
                </div>

                <div class="product-footer">

                    <strong class="product-price">
                        ${formatPrice(price)}
                    </strong>

                    <button
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


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts(products) {
    const results = $("results");

    if (!results) return;

    if (!products || products.length === 0) {
        showNoResults();
        return;
    }

    results.innerHTML = products
        .map(createProductCard)
        .join("");
}


/* =========================================================
   PRODUCT INTERACTION
   ========================================================= */

function selectProduct(id) {
    const product = state.allProducts.find(
        item => getProductId(item) === String(id)
    );

    if (!product) return;

    trackInteraction(product, "view");

    /*
     * Small detail modal.
     */
    openProductModal(product);
}

function openProductModal(product) {
    let modal = $("productModal");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "productModal";
        modal.className = "product-modal";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeProductModal()"></div>

        <div class="modal-content">

            <button
                class="modal-close"
                onclick="closeProductModal()"
            >
                ×
            </button>

            <div class="modal-image">
                ${productVisual(product)}
            </div>

            <div class="modal-info">

                <span class="modal-category">
                    ${escapeHTML(getProductCategory(product))}
                </span>

                <h2>
                    ${escapeHTML(getProductName(product))}
                </h2>

                <p class="modal-price">
                    ${formatPrice(getProductPrice(product))}
                </p>

                <p>
                    ${escapeHTML(getProductDescription(product))}
                </p>

                <div class="modal-details">

                    <div>
                        <strong>Color</strong>
                        <span>${escapeHTML(getProductColor(product))}</span>
                    </div>

                    <div>
                        <strong>Gender</strong>
                        <span>${escapeHTML(getProductGender(product))}</span>
                    </div>

                    <div>
                        <strong>Material</strong>
                        <span>${escapeHTML(getProductMaterial(product) || "—")}</span>
                    </div>

                </div>

                <button
                    class="primary-btn modal-like-button"
                    onclick="toggleWishlist('${escapeHTML(getProductId(product))}')"
                >
                    ${state.wishlist.includes(getProductId(product))
                        ? "♥ Saved"
                        : "♡ Save to Wishlist"}
                </button>

            </div>

        </div>
    `;

    modal.classList.add("open");
}

function closeProductModal() {
    const modal = $("productModal");

    if (modal) {
        modal.classList.remove("open");
    }
}


/* =========================================================
   WISHLIST
   ========================================================= */

function toggleWishlist(id) {
    id = String(id);

    const index = state.wishlist.indexOf(id);

    if (index >= 0) {
        state.wishlist.splice(index, 1);
    } else {
        state.wishlist.push(id);

        const product = state.allProducts.find(
            item => getProductId(item) === id
        );

        if (product) {
            trackInteraction(product, "like");
        }
    }

    localStorage.setItem(
        "fashionWishlist",
        JSON.stringify(state.wishlist)
    );

    renderProducts(state.visibleProducts);

    updateWishlistCount();
}

function updateWishlistCount() {
    const element = $("wishlistCount");

    if (!element) return;

    element.textContent = state.wishlist.length;
}


/* =========================================================
   PERSONALIZATION TRACKING
   ========================================================= */

function trackSearch(query) {
    const profile = state.userProfile || {};

    if (!profile.searchHistory) {
        profile.searchHistory = [];
    }

    profile.searchHistory.unshift(query);

    profile.searchHistory =
        profile.searchHistory.slice(0, 20);

    inferPreferencesFromQuery(query);

    state.userProfile = profile;

    localStorage.setItem(
        "fashionUserProfile",
        JSON.stringify(profile)
    );
}

function trackInteraction(product, action) {
    const profile = state.userProfile || {};

    if (!profile.interactions) {
        profile.interactions = [];
    }

    profile.interactions.unshift({
        productId: getProductId(product),
        action,
        timestamp: Date.now()
    });

    profile.interactions =
        profile.interactions.slice(0, 50);

    /*
     * Automatically learn category/style/color preferences
     * from user interactions.
     */
    if (action === "like" || action === "view") {
        learnPreference(
            "favoriteCategories",
            getProductCategory(product)
        );

        learnPreference(
            "favoriteColors",
            getProductColor(product)
        );

        getProductStyles(product).forEach(style => {
            learnPreference(
                "favoriteStyles",
                style
            );
        });

        getProductOccasions(product).forEach(occasion => {
            learnPreference(
                "favoriteOccasions",
                occasion
            );
        });
    }

    state.userProfile = profile;

    localStorage.setItem(
        "fashionUserProfile",
        JSON.stringify(profile)
    );
}

function learnPreference(key, value) {
    if (!value) return;

    const profile = state.userProfile || {};

    if (!profile[key]) {
        profile[key] = [];
    }

    if (!profile[key].includes(value)) {
        profile[key].push(value);
    }

    profile[key] = profile[key].slice(-10);

    state.userProfile = profile;
}

function inferPreferencesFromQuery(query) {
    const q = query.toLowerCase();

    const categoryKeywords = {
        shirt: "Shirts",
        shirts: "Shirts",
        tshirt: "T-Shirts",
        "t-shirt": "T-Shirts",
        dress: "Dresses",
        dresses: "Dresses",
        jeans: "Jeans",
        trousers: "Trousers",
        blazer: "Blazers",
        hoodie: "Hoodies",
        sneakers: "Sneakers",
        shoes: "Shoes",
        jacket: "Jackets",
        coat: "Coats",
        saree: "Saree",
        kurta: "Kurta",
        kurti: "Kurti",
        abaya: "Abaya",
        skirt: "Skirts",
        suit: "Suits",
        gown: "Gowns",
        top: "Tops"
    };

    Object.entries(categoryKeywords).forEach(
        ([keyword, category]) => {
            if (q.includes(keyword)) {
                learnPreference(
                    "favoriteCategories",
                    category
                );
            }
        }
    );

    const styles = [
        "minimal",
        "classic",
        "modern",
        "elegant",
        "oversized",
        "streetwear",
        "traditional",
        "comfortable",
        "luxury",
        "simple"
    ];

    styles.forEach(style => {
        if (q.includes(style)) {
            learnPreference(
                "favoriteStyles",
                style
            );
        }
    });
}


/* =========================================================
   FILTER EVENT SETUP
   ========================================================= */

function setupFilters() {
    const category = $("categoryFilter");
    const gender = $("genderFilter");
    const color = $("colorFilter");
    const style = $("styleFilter");
    const price = $("priceFilter");
    const sort = $("sortFilter");

    if (category) {
        category.addEventListener("change", event => {
            state.selectedCategory = event.target.value;
            applyAllFilters();
        });
    }

    if (gender) {
        gender.addEventListener("change", event => {
            state.selectedGender = event.target.value;
            applyAllFilters();
        });
    }

    if (color) {
        color.addEventListener("change", event => {
            state.selectedColor = event.target.value;
            applyAllFilters();
        });
    }

    if (style) {
        style.addEventListener("change", event => {
            state.selectedStyle = event.target.value;
            applyAllFilters();
        });
    }

    if (price) {
        price.addEventListener("input", event => {
            state.maxPrice = Number(event.target.value);

            updatePriceLabel(state.maxPrice);

            applyAllFilters();
        });
    }

    if (sort) {
        sort.addEventListener("change", event => {
            state.sortBy = event.target.value;

            applyAllFilters();
        });
    }
}

function updatePriceLabel(price) {
    const label = $("priceValue");

    if (!label) return;

    label.textContent = `Up to ${formatPrice(price)}`;
}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

function clearAllFilters() {
    state.selectedCategory = "All";
    state.selectedGender = "All";
    state.selectedColor = "All";
    state.selectedStyle = "All";

    const category = $("categoryFilter");
    const gender = $("genderFilter");
    const color = $("colorFilter");
    const style = $("styleFilter");

    if (category) category.value = "All";
    if (gender) gender.value = "All";
    if (color) color.value = "All";
    if (style) style.value = "All";

    const prices = state.allProducts.map(getProductPrice);

    state.maxPrice = Math.max(
        ...prices,
        15000
    );

    const price = $("priceFilter");

    if (price) {
        price.value = String(state.maxPrice);
    }

    updatePriceLabel(state.maxPrice);

    applyAllFilters();
}


/* =========================================================
   SEARCH SUMMARY
   ========================================================= */

function updateSearchSummary() {
    const summary = $("searchSummary");

    if (!summary) return;

    const activeFilters = [];

    if (state.selectedCategory !== "All") {
        activeFilters.push(state.selectedCategory);
    }

    if (state.selectedGender !== "All") {
        activeFilters.push(state.selectedGender);
    }

    if (state.selectedColor !== "All") {
        activeFilters.push(state.selectedColor);
    }

    if (state.selectedStyle !== "All") {
        activeFilters.push(state.selectedStyle);
    }

    if (state.searchQuery) {
        summary.innerHTML = `
            Showing AI matches for
            <strong>"${escapeHTML(state.searchQuery)}"</strong>
            ${activeFilters.length
                ? `with ${activeFilters.join(", ")}`
                : ""}
        `;
    } else if (activeFilters.length) {
        summary.innerHTML = `
            Filtered fashion discovery:
            <strong>${activeFilters.join(" · ")}</strong>
        `;
    } else {
        summary.innerHTML = `
            Explore fashion using AI-powered discovery.
        `;
    }
}


/* =========================================================
   CATALOGUE STATS
   ========================================================= */

function updateCatalogueStats() {
    const count = $("resultCount");

    if (count) {
        count.textContent =
            `${state.visibleProducts.length} items`;
    }

    const total = $("catalogueTotal");

    if (total) {
        total.textContent =
            state.allProducts.length;
    }

    updateWishlistCount();
}


/* =========================================================
   QUICK SEARCH CHIPS
   ========================================================= */

function setupQuickSearch() {
    document.addEventListener("click", event => {
        const chip = event.target.closest(
            "[data-search]"
        );

        if (!chip) return;

        const query = chip.dataset.search;

        const input = $("searchInput");

        if (input) {
            input.value = query;
        }

        searchFashion(query);
    });
}


/* =========================================================
   MOBILE FILTER DRAWER
   ========================================================= */

function setupMobileFilters() {
    const openButton = $("openFilters");
    const closeButton = $("closeFilters");
    const sidebar = $("filterSidebar");

    if (!sidebar) return;

    if (openButton) {
        openButton.addEventListener("click", () => {
            sidebar.classList.add("mobile-open");
        });
    }

    if (closeButton) {
        closeButton.addEventListener("click", () => {
            sidebar.classList.remove("mobile-open");
        });
    }
}


/* =========================================================
   FOR YOU SECTION
   ========================================================= */

function renderForYou() {
    const container = $("forYouResults");

    if (!container) return;

    const personalized = applyPersonalization(
        [...state.allProducts]
    );

    const products = personalized.slice(0, 4);

    if (!products.length) {
        container.innerHTML = `
            <p class="for-you-empty">
                Start exploring to build your AI fashion profile.
            </p>
        `;

        return;
    }

    container.innerHTML = products
        .map(createProductCard)
        .join("");
}


/* =========================================================
   STYLIST
   ========================================================= */

async function runAIStylist() {
    const occasion = $("stylistOccasion")?.value || "";
    const style = $("stylistStyle")?.value || "";
    const comfort = $("stylistComfort")?.value || "";
    const color = $("stylistColor")?.value || "";
    const coverage = $("stylistCoverage")?.value || "";
    const description =
        $("stylistDescription")?.value || "";

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

        if (recommendations.length > 0) {
            state.searchResults = recommendations;

            state.searchQuery = "AI Stylist";

            applyAllFilters();

            const results = $("results");

            if (results) {
                results.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }

    } catch (error) {
        console.error(
            "AI Stylist error:",
            error
        );

        /*
         * Graceful local fallback:
         * use query-like matching.
         */
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
}


/* =========================================================
   STYLIST BUTTON
   ========================================================= */

function setupStylist() {
    const button = $("stylistButton");

    if (!button) return;

    button.addEventListener(
        "click",
        runAIStylist
    );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
    document.addEventListener("click", event => {
        const link = event.target.closest(
            "[data-scroll]"
        );

        if (!link) return;

        const targetId =
            link.dataset.scroll;

        const target =
            $(targetId);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
            behavior: "smooth"
        });
    });
}


/* =========================================================
   KEYBOARD SHORTCUT
   ========================================================= */

function setupKeyboardShortcut() {
    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "/" &&
                document.activeElement.tagName !== "INPUT" &&
                document.activeElement.tagName !== "TEXTAREA"
            ) {
                event.preventDefault();

                const input =
                    $("searchInput");

                if (input) {
                    input.focus();
                }
            }

            if (event.key === "Escape") {
                closeProductModal();
            }
        }
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initialize() {
    console.log(
        "Fashion AI Discovery — Day 9"
    );

    setupSearch();
    setupFilters();
    setupQuickSearch();
    setupMobileFilters();
    setupStylist();
    setupNavigation();
    setupKeyboardShortcut();
    setupDiscoveryPagination();
    setupSearchSuggestions();

    updateWishlistCount();

    await checkBackend();

    await loadProducts();

    renderForYou();

    console.log(
        "Day 9 Advanced Catalogue UI initialized."
    );
}

let discoveryPage = 1;
let discoveryPageSize = 12;

function getDiscoveryState() {
    return {
        query: state.searchQuery || "",
        category:
            state.selectedCategory !== "All"
                ? state.selectedCategory
                : "",
        gender:
            state.selectedGender !== "All"
                ? state.selectedGender
                : "",
        color:
            state.selectedColor !== "All"
                ? state.selectedColor
                : "",
        style:
            state.selectedStyle !== "All"
                ? state.selectedStyle
                : "",
        maxPrice:
            Number.isFinite(state.maxPrice)
                ? state.maxPrice
                : "",
        sort:
            state.sortBy || "relevance",
        page: discoveryPage,
        pageSize: discoveryPageSize
    };
}

async function loadDiscoveryPage(page = 1) {
    discoveryPage = Math.max(
        1,
        Number(page) || 1
    );

    const filters =
        getDiscoveryState();

    try {
        const data = await apiRequest(
            "/api/discovery",
            {
                method: "POST",
                body: JSON.stringify(
                    filters
                )
            }
        );

        const products =
            Array.isArray(data.items)
                ? data.items
                : [];

        state.searchResults =
            products;

        renderProducts();
        renderDiscoveryPagination(
            data.pagination
        );
        updateSearchSummary();
        updateCatalogueStats();

        return data;
    } catch (error) {
        console.error(
            "Discovery error:",
            error
        );

        return null;
    }
}

function renderDiscoveryPagination(
    pagination
) {
    const container =
        $("discoveryPagination");

    if (!container || !pagination) {
        return;
    }

    const {
        page,
        totalPages,
        hasNext,
        hasPrevious
    } = pagination;

    container.innerHTML = `
        <button
            type="button"
            data-discovery-page="${page - 1}"
            ${hasPrevious ? "" : "disabled"}
        >
            Previous
        </button>

        <span>
            Page ${page} of ${totalPages}
        </span>

        <button
            type="button"
            data-discovery-page="${page + 1}"
            ${hasNext ? "" : "disabled"}
        >
            Next
        </button>
    `;
}

function setupDiscoveryPagination() {
    document.addEventListener(
        "click",
        event => {
            const button =
                event.target.closest(
                    "[data-discovery-page]"
                );

            if (!button) {
                return;
            }

            const page =
                Number(
                    button.dataset
                        .discoveryPage
                );

            if (
                !Number.isFinite(page) ||
                page < 1
            ) {
                return;
            }

            loadDiscoveryPage(page);
        }
    );
}

async function loadSearchSuggestions(
    query
) {
    const cleanQuery =
        String(query || "").trim();

    if (!cleanQuery) {
        return [];
    }

    try {
        const data =
            await apiRequest(
                `/api/discovery/suggestions?q=${encodeURIComponent(
                    cleanQuery
                )}`
            );

        return Array.isArray(
            data.suggestions
        )
            ? data.suggestions
            : [];
    } catch {
        return [];
    }
}

function renderSearchSuggestions(
    suggestions
) {
    const container =
        $("searchSuggestions");

    if (!container) {
        return;
    }

    container.innerHTML =
        suggestions
            .map(
                suggestion => `
                    <button
                        type="button"
                        data-search="${escapeHTML(
                            suggestion
                        )}"
                    >
                        ${escapeHTML(
                            suggestion
                        )}
                    </button>
                `
            )
            .join("");
}

async function setupSearchSuggestions() {
    const input =
        $("searchInput");

    if (!input) {
        return;
    }

    let timer;

    input.addEventListener(
        "input",
        () => {
            clearTimeout(timer);

            timer = setTimeout(
                async () => {
                    const suggestions =
                        await loadSearchSuggestions(
                            input.value
                        );

                    renderSearchSuggestions(
                        suggestions
                    );
                },
                250
            );
        }
    );
}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.runSearch = runSearch;
window.searchFashion = searchFashion;
window.loadProducts = loadProducts;
window.clearAllFilters = clearAllFilters;
window.toggleWishlist = toggleWishlist;
window.selectProduct = selectProduct;
window.closeProductModal = closeProductModal;
window.runAIStylist = runAIStylist;


/* =========================================================
   START APP
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);
