let aiExperienceResults = [];

function aiEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function aiPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "₹—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);
}

function aiArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function aiFashionSvgData(product, model = false) {
  const category = String(product?.category || "shirt").toLowerCase();
  const colorName = String(product?.color || "black").toLowerCase();
  const colors = {black:"#17171b",white:"#f4f1eb",blue:"#2563eb",red:"#c62828",green:"#2f6b45",beige:"#c8ad86",grey:"#777b82",gray:"#777b82",brown:"#754c32"};
  const fill = colors[colorName] || "#777b82";
  let garment = "";
  if (["dress","dresses"].includes(category)) garment=`<path d="M190 215 L230 250 L205 315 L150 610 Q250 670 350 610 L295 315 L270 250 L310 215 L282 175 L250 205 L218 175 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  else if (["skirt","skirts"].includes(category)) garment=`<path d="M215 225 L285 225 L320 570 Q250 615 180 570 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  else if (["trousers","trouser","pants","jeans"].includes(category)) garment=`<path d="M185 210 H315 L325 370 L300 625 H252 L235 420 L218 625 H170 L175 370 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  else if (["jacket","jackets","blazer","blazers"].includes(category)) garment=`<path d="M205 180 L235 210 L250 300 L265 210 L295 180 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  else if (["hoodie","hoodies"].includes(category)) garment=`<path d="M205 215 Q250 165 295 215 L350 255 L315 330 L295 305 V610 H205 V305 L185 330 L150 255 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  else if (["sneaker","sneakers"].includes(category)) garment=`<path d="M150 430 Q205 410 250 465 L315 520 Q345 545 350 585 H145 Q125 555 150 430 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  else garment=`<path d="M205 185 L235 215 L250 285 L265 215 L295 185 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  const person = model ? '<circle cx="250" cy="105" r="48" fill="#d8a27c" stroke="#24242a" stroke-width="5"/><path d="M205 105 Q250 45 295 105" fill="#24242a"/>' : "";
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 720"><rect width="500" height="720" rx="28" fill="#f5f1e9"/><rect x="18" y="18" width="464" height="684" rx="22" fill="#fff" opacity=".65"/>${person}${garment}<text x="250" y="680" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#555">${colorName} ${category}</text></svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}
function aiProductImage(product) { return aiFashionSvgData(product, false); }
function aiModelImage(product) { return aiFashionSvgData(product, true); }

let localCataloguePromise = null;

async function loadLocalCatalogue() {
  if (!localCataloguePromise) {
    localCataloguePromise = fetch("./data/products.json?v=408", { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Local catalogue unavailable: " + response.status);
        return response.json();
      })
      .then(data => {
        const products = Array.isArray(data) ? data : (data.products || data.results || data.data || []);
        if (!Array.isArray(products) || !products.length) throw new Error("Local catalogue is empty");
        return products;
      });
  }
  return localCataloguePromise;
}

function filterExplicitAIResults(results, query) {
  const text = String(query || "").toLowerCase();
  if (!text || !Array.isArray(results)) return results || [];
  const colors = ["black","white","blue","red","green","beige","grey","gray","brown","cream","ivory"];
  const categories = [
    ["dresses","dress"],["dress","dress"],["shirts","shirt"],["shirt","shirt"],
    ["t-shirts","shirt"],["t-shirt","shirt"],["tee","shirt"],["tees","shirt"],
    ["jeans","jeans"],["jean","jeans"],["trousers","trouser"],["trouser","trouser"],
    ["pants","trouser"],["hoodies","hoodie"],["hoodie","hoodie"],["jackets","jacket"],
    ["jacket","jacket"],["blazers","blazer"],["blazer","blazer"],["skirts","skirt"],
    ["skirt","skirt"],["tops","top"],["top","top"],["sneakers","sneaker"],["sneaker","sneaker"]
  ];
  const foundColors = colors.filter(c => text.includes(c));
  const foundCategories = categories.filter(([term]) => text.includes(term)).map(([,v]) => v);
  if (!foundColors.length && !foundCategories.length) return results;
  const budget = extractAIBudgetConstraint(query);
  const exact = results.filter(product => {
    const color = String(product?.color || "").toLowerCase();
    const category = String(product?.category || "").toLowerCase();
    const colorOk = !foundColors.length || foundColors.some(c => c === "cream" ? color === "beige" : c === "ivory" ? color === "white" : color.includes(c));
    const categoryOk = !foundCategories.length || foundCategories.some(c => category.includes(c));
    const budgetOk = budget == null || Number(product?.price) <= budget;
    return colorOk && categoryOk && budgetOk;
  });
  return exact.length ? exact : (budget != null ? [] : results);
}

function aiScore(product) {
  const raw = Number(
    product?.aiMatch ??
    product?.score ??
    product?.relevance ??
    product?.hybridScore ??
    0
  );
  return Math.max(0, Math.min(100, Math.round(raw <= 1 ? raw * 100 : raw)));
}

function aiModelPrompt(product, query = "") {
  const name = product?.name || "fashion piece";
  const category = product?.category || "fashion";
  const color = product?.color || "";
  const material = aiArray(product?.material).join(", ");
  const style = aiArray(product?.style).slice(0, 3).join(", ");
  const description = product?.description || "";
  return [
    "high-end editorial fashion e-commerce photograph",
    "adult professional fashion model wearing the described fashion piece",
    "full body head-to-toe, feet visible, front three-quarter pose, complete outfit visible, realistic fabric drape, natural proportions",
    "clean luxury studio, soft directional lighting, neutral warm background",
    "no text, no watermark, no logos",
    name,
    category,
    "exact garment category " + category,
    color && "exact garment color " + color,
    material && "material " + material,
    style && "style " + style,
    description,
    query && "styled for " + query
  ].filter(Boolean).join(", ");
}

function aiCard(product, query) {
  const id = String(product?.id ?? "");
  const name = product?.name || product?.title || "Fashion item";
  const category = product?.category || "Fashion";
  const color = product?.color || product?.colour || "";
  const price = aiPrice(product?.price);
  const score = aiScore(product);
  const reasons = aiArray(product?.reasons).slice(0, 3);
  const productPreview = aiProductImage(product);
  const styles = aiArray(product?.style || product?.styles).slice(0, 3);
  const modelPreview = aiModelImage(product);

  return `
    <article class="ai-v3-product-card">
      <div class="ai-v3-product-media ai-v3-dual-media">
        <div class="ai-v3-source-visual">
          <img class="ai-v3-source-image" src="${aiEscape(productPreview)}" alt="${aiEscape(name)}" loading="eager"
               onload="this.classList.add('visual-ready')"
               onerror="this.onerror=null;this.src='./assets/fashion/shirt.jpg';">
          <div class="ai-v3-source-status">LOCAL PRODUCT PHOTO</div>
          <span class="ai-v3-media-label">PRODUCT</span>
        </div>
        <div class="ai-v3-model-visual">
          <img class="ai-v3-model-image" src="${aiEscape(modelPreview)}" alt="Fashion model view for ${aiEscape(name)}" loading="eager"
               onload="this.parentElement.classList.add('loaded')"
               onerror="this.onerror=null;this.src='./assets/fashion/shirt.jpg';this.parentElement.classList.add('loaded')">
          <span class="ai-v3-media-label">MODEL VIEW</span>
        </div>
        <span class="ai-v3-score"><span>✦</span> ${score}% AI match</span>
      </div>
      <div class="ai-v3-product-body">
        <div class="ai-v3-meta">${aiEscape(category)} ${color ? "· " + aiEscape(color) : ""}</div>
        <h3>${aiEscape(name)}</h3>
        <div class="ai-v3-tags">${styles.map(item => `<span>${aiEscape(item)}</span>`).join("")}</div>
        <div class="ai-v3-reasons">
          ${reasons.map(item => `<span>✓ ${aiEscape(item)}</span>`).join("")}
        </div>
        <div class="ai-v3-footer">
          <strong>${price}</strong>
          <button type="button" onclick="selectProduct('${aiEscape(id)}')">Product details →</button>
        </div>
      </div>
    </article>
  `;
}

function ensureAIInsight() {
  let element = document.getElementById("aiSearchInsight");
  const results = document.getElementById("results");
  if (!results) return null;

  if (!element) {
    element = document.createElement("div");
    element.id = "aiSearchInsight";
    results.parentElement.insertBefore(element, results);
  }

  return element;
}

function renderAIInsight(data) {
  const container = ensureAIInsight();
  if (!container) return;

  const intent = data.intent || {};
  const chips = [
    intent.category,
    intent.color,
    ...(intent.style || []).slice(0, 2),
    ...(intent.occasion || []).slice(0, 2),
    intent.material,
    intent.gender,
    intent.budget != null ? `Under ₹${Math.round(intent.budget).toLocaleString("en-IN")}` : null
  ].filter(Boolean);

  const top = data.results?.[0];
  const preview = top ? aiModelImage(top) : "";
  const outfit = data.outfitPlan;
  const outfitItems = outfit?.items || [];
  const latency = Number(data.latencyMs);

  container.innerHTML = `
    <section class="ai-v3-insight">
      <div class="ai-v3-insight-top">
        <div>
          <div class="ai-v3-kicker"><span class="ai-v3-live-dot"></span> LIVE AI FASHION ENGINE</div>
          <h2>Understanding your style, not just keywords.</h2>
          <p>${aiEscape(data.query || intent.query || "")}</p>
        </div>
        <div class="ai-v3-engine-card">
          <strong>Semantic + Intent + Ranking</strong>
          <span>${data.semanticAvailable ? "Semantic model active" : "Semantic fallback active"}</span>
          ${Number.isFinite(latency) ? `<small>${latency} ms response</small>` : ""}
        </div>
      </div>

      <div class="ai-v3-understood">
        <span>AI understood</span>
        <div class="ai-v3-chips">
          ${chips.map(chip => `<span>${aiEscape(chip)}</span>`).join("")}
        </div>
      </div>

      ${top ? `
        <div class="ai-v3-hero-preview">
          <div class="ai-v3-hero-copy">
            <span class="ai-v3-kicker">TOP AI MATCH</span>
            <h3>${aiEscape(top.name || "Top fashion match")}</h3>
            <p>${aiEscape(top.description || "Selected from semantic relevance, fashion attributes, constraints and styling compatibility.")}</p>
            <div class="ai-v3-hero-actions">
              <button type="button" class="ai-v3-primary" onclick="openAIModelPreview(${JSON.stringify(preview)}, ${JSON.stringify(top.name || "AI fashion model preview")})">✦ Generate on model</button>
              <button type="button" class="ai-v3-secondary" onclick="selectProduct('${aiEscape(String(top.id ?? ""))}')">View product</button>
            </div>
            <div class="ai-v3-confidence">
              <span>AI relevance</span>
              <strong>${aiScore(top)}%</strong>
              <div><i style="width:${aiScore(top)}%"></i></div>
            </div>
          </div>
          <div class="ai-v3-hero-visual">
            <div class="ai-v3-visual-glow"></div>
            <img class="ai-v3-hero-model-image" src="${aiEscape(preview)}" alt="Fashion model view for ${aiEscape(top.name || "the selected fashion item")}" loading="eager">
            <span class="ai-v3-generated-label">LOCAL MODEL PHOTO</span>
          </div>
        </div>
      ` : ""}

      ${outfit && outfitItems.length ? `
        <div class="ai-v3-outfit">
          <div class="ai-v3-outfit-head">
            <div>
              <span class="ai-v3-kicker">AI STYLED LOOK</span>
              <h3>${aiEscape(outfit.title || "AI curated look")}</h3>
            </div>
            <strong>${aiPrice(outfit.total)}</strong>
          </div>
          <div class="ai-v3-outfit-items">
            ${outfitItems.map(item => `
              <button type="button" onclick="selectProduct('${aiEscape(String(item.id ?? ""))}')">
                <span>${aiEscape(item.category || "Piece")}</span>
                <strong>${aiEscape(item.name || "Fashion item")}</strong>
                <small>${aiPrice(item.price)}</small>
              </button>
            `).join("")}
          </div>
          <div class="ai-v3-reasons">${(outfit.reasons || []).map(reason => `<span>✦ ${aiEscape(reason)}</span>`).join("")}</div>
        </div>
      ` : ""}
    </section>
  `;
}

function renderAISearchResults(data) {
  const results = document.getElementById("results");
  if (!results) return;

  aiExperienceResults = Array.isArray(data.results) ? data.results : [];

  if (!aiExperienceResults.length) {
    results.innerHTML = `<div class="no-results"><h3>No strong AI matches</h3><p>Try a more descriptive request, for example “minimal black college outfit under ₹3000”.</p></div>`;
    return;
  }

  results.innerHTML = `
    <div class="ai-v3-results-heading">
      <div><span class="ai-v3-kicker">AI RANKED CATALOGUE</span><h3>Matches selected for your intent</h3></div>
      <span>${aiExperienceResults.length} live matches</span>
    </div>
    <div class="ai-v3-results-grid">
      ${aiExperienceResults.map(product => aiCard(product, data.query || "")).join("")}
    </div>
  `;
}

function showAISearchLoading() {
  const results = document.getElementById("results");
  const insight = ensureAIInsight();

  if (insight) {
    insight.innerHTML = `
      <section class="ai-v3-insight ai-v3-loading">
        <div class="ai-v3-kicker"><span class="ai-v3-live-dot"></span> LIVE AI FASHION ENGINE</div>
        <h2>Reading your style request…</h2>
        <p>Extracting intent, constraints, semantic meaning and outfit compatibility.</p>
        <div class="ai-v3-loading-bar"><i></i></div>
      </section>
    `;
  }

  if (results) {
    results.innerHTML = `
      <div class="no-results ai-v3-loading-result">
        <div class="loading-spinner"></div>
        <h3>AI is ranking the catalogue</h3>
        <p>Semantic retrieval → intent matching → constraint ranking → outfit intelligence</p>
      </div>
    `;
  }
}

function extractAIBudgetConstraint(query) {
  const text = String(query || "").toLowerCase().replace(/,/g, "");
  const match = text.match(/(?:under|below|less than|upto|up to|max(?:imum)?(?: budget)?|within)\s*(?:₹|rs\.?|inr\s*)?\s*(\d+(?:\.\d+)?)\s*(k|thousand)?\b|(?:₹|rs\.?|inr\s*)\s*(\d+(?:\.\d+)?)\s*(k|thousand)?\b/);
  if (!match) return null;
  const raw = Number(match[1] || match[3]);
  if (!Number.isFinite(raw)) return null;
  const multiplier = String(match[2] || match[4] || "").toLowerCase();
  return raw * (multiplier === "k" || multiplier === "thousand" ? 1000 : 1);
}

async function localCatalogueSearch(query, limit = 12) {
  const products = await loadLocalCatalogue();
  const text = String(query || "").toLowerCase().trim();
  const colors = ["black","white","blue","red","green","beige","grey","gray","brown","cream","ivory"];
  const categoryAliases = {
    dresses:"dress", dress:"dress", shirts:"shirt", shirt:"shirt", "t-shirts":"shirt", "t-shirt":"shirt",
    tee:"shirt", tees:"shirt", jeans:"jeans", jean:"jeans", trousers:"trousers", trouser:"trousers",
    pants:"trousers", hoodies:"hoodie", hoodie:"hoodie", jackets:"jacket", jacket:"jacket",
    blazers:"blazer", blazer:"blazer", skirts:"skirt", skirt:"skirt", tops:"top", top:"top",
    sneakers:"sneakers", sneaker:"sneakers"
  };
  const foundColor = colors.find(color => new RegExp("\\b" + color + "\\b","i").test(text));
  const foundCategoryTerm = Object.keys(categoryAliases).sort((a,b) => b.length - a.length)
    .find(term => new RegExp("\\b" + term.replace(/[-]/g,"\\-") + "\\b","i").test(text));
  const foundCategory = foundCategoryTerm ? categoryAliases[foundCategoryTerm] : "";
  const targetColor = foundColor === "cream" || foundColor === "ivory" ? "beige" : foundColor === "gray" ? "grey" : foundColor;
  const budget = extractAIBudgetConstraint(query);
  const stop = new Set(["show","find","give","me","some","the","a","an","for","with","and","or","please","want","need","fashion","clothes","clothing","item","items"]);
  const tokens = text.split(/\\s+/).filter(token => token.length > 2 && !stop.has(token));

  const scored = products.map(product => {
    const color = String(product.color || "").toLowerCase();
    const category = String(product.category || "").toLowerCase();
    const haystack = [
      product.name, product.brand, product.category, product.color,
      ...aiArray(product.tags), ...aiArray(product.style), ...aiArray(product.occasion),
      product.description
    ].join(" ").toLowerCase();
    const tokenHits = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
    const colorMatch = !targetColor || color === targetColor;
    const categoryMatch = !foundCategory || category.includes(foundCategory);
    const budgetMatch = budget == null || Number(product.price) <= budget;
    const score = (colorMatch ? 0.55 : 0) + (categoryMatch ? 0.4 : 0) + (budgetMatch ? 0.05 : 0) + tokenHits * 0.03;
    return {
      ...product,
      score: Math.min(1, score),
      hybridScore: Math.min(1, score),
      matchScore: Math.round(Math.min(1, score) * 100),
      tokenHits,
      reasons: [
        colorMatch && foundColor ? "Exact colour match" : null,
        categoryMatch && foundCategory ? "Exact category match" : null,
        budget != null && budgetMatch ? "Within budget" : null,
        tokenHits ? "Catalogue text match" : null
      ].filter(Boolean)
    };
  });

  const constrained = foundColor || foundCategory || budget != null;
  const strict = scored.filter(product =>
    (!targetColor || String(product.color || "").toLowerCase() === targetColor) &&
    (!foundCategory || String(product.category || "").toLowerCase().includes(foundCategory)) &&
    (budget == null || Number(product.price) <= budget)
  );

  if (constrained) {
    // Explicit constraints are never silently relaxed.
    return strict.sort((a,b) => b.score - a.score).slice(0, limit);
  }

  // A free-form query must actually match catalogue text; arbitrary words
  // should not produce unrelated products just because they are in the catalogue.
  return scored
    .filter(product => product.tokenHits > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, limit);
}

async function runAIV2Search(query) {
  const cleanQuery = String(query || "").trim();
  const input = document.getElementById("searchInput");
  if (!cleanQuery) return;
  if (input) input.value = cleanQuery;
  showAISearchLoading();
  const started = performance.now();

  try {
    // Local-first: search never depends on the Render AI service being online.
    const localResults = await localCatalogueSearch(cleanQuery, 12);
    const filtered = filterExplicitAIResults(localResults, cleanQuery);
    const data = {
      success: true,
      query: cleanQuery,
      results: filtered,
      semanticAvailable: false,
      semanticFallback: true,
      source: "repository-catalogue",
      latencyMs: Math.round(performance.now() - started),
      intent: { query: cleanQuery },
      outfitPlan: null
    };
    renderAIInsight(data);
    renderAISearchResults(data);
    setupProductVisualEnhancement();
    const summary = document.getElementById("searchSummary");
    const count = document.getElementById("resultCount");
    if (summary) summary.textContent = filtered.length + " exact catalogue matches";
    if (count) count.textContent = filtered.length + " results";
    document.getElementById("aiSearchInsight")?.scrollIntoView({behavior:"smooth",block:"start"});
  } catch (error) {
    console.error("Local catalogue search failed:", error);
    const results = document.getElementById("results");
    if (results) results.innerHTML = '<div class="no-results"><h3>Search could not complete</h3><p>Please try the search again.</p></div>';
  }
}

function interceptAIInteractions() {
  document.addEventListener("click", event => {
    const searchButton = event.target.closest("#searchButton");
    const quickSearch = event.target.closest(".quick-search");

    if (searchButton || quickSearch) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const query = quickSearch?.dataset.query || document.getElementById("searchInput")?.value || "";
      runAIV2Search(query);
    }
  }, true);

  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" || event.target?.id !== "searchInput") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    runAIV2Search(event.target.value);
  }, true);
}

function initializeAIStudioPreview() {
  const img = document.getElementById("aiStudioModelImage");
  if (!img) return;
  img.src = "./assets/fashion/model.jpg";
  img.onerror = () => { img.style.display = "none"; };
}
document.addEventListener("DOMContentLoaded", initializeAIStudioPreview);

function initializeAIV2Experience() {
  interceptAIInteractions();
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.setAttribute("aria-describedby", "aiSearchInsight");
  }
}

document.addEventListener("DOMContentLoaded", initializeAIV2Experience);


function setupProductVisualEnhancement() {
  const images = document.querySelectorAll('img[data-enhance-src]');
  images.forEach(image => {
    const url = image.dataset.enhanceSrc;
    if (!url) return;
    const probe = new Image();
    probe.onload = () => { image.src = url; };
    probe.onerror = () => {};
    probe.src = url;
  });
}
