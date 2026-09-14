const AI_API = "https://fashion-ai-search-lj6s.onrender.com";
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
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
}

function aiArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string" && value.trim()) return value.split(",").map(item => item.trim()).filter(Boolean);
  return [];
}

function aiProductImage(product) {
  return product?.image || product?.image_url || product?.imageUrl || product?.img || product?.thumbnail || "";
}

function aiCard(product) {
  const id = String(product?.id ?? "");
  const name = product?.name || product?.title || "Fashion item";
  const category = product?.category || "Fashion";
  const color = product?.color || product?.colour || "";
  const price = aiPrice(product?.price);
  const score = Math.max(0, Math.min(100, Math.round(Number(product?.score || product?.relevance || 0) * 100)));
  const reasons = aiArray(product?.reasons).slice(0, 3);
  const image = aiProductImage(product);
  const styles = aiArray(product?.style || product?.styles).slice(0, 3);

  return `
    <article class="ai-v2-product-card">
      <div class="ai-v2-product-media">
        ${image ? `<img src="${aiEscape(image)}" alt="${aiEscape(name)}" loading="lazy">` : `<div class="ai-v2-product-placeholder"><span>${aiEscape(category)}</span><strong>${aiEscape(color)}</strong></div>`}
        <span class="ai-v2-score">${score}% AI match</span>
      </div>
      <div class="ai-v2-product-body">
        <div class="ai-v2-meta">${aiEscape(category)}${color ? ` · ${aiEscape(color)}` : ""}</div>
        <h3>${aiEscape(name)}</h3>
        <div class="ai-v2-tags">${styles.map(item => `<span>${aiEscape(item)}</span>`).join("")}</div>
        <div class="ai-v2-reasons">${reasons.map(item => `<span>✦ ${aiEscape(item)}</span>`).join("")}</div>
        <div class="ai-v2-footer"><strong>${price}</strong><button type="button" onclick="selectProduct('${aiEscape(id)}')">Explore →</button></div>
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

  const intent = data.intent || data.results?.[0]?.aiIntent || {};
  const chips = [
    intent.category,
    intent.color,
    ...(intent.style || []).slice(0, 2),
    ...(intent.occasion || []).slice(0, 2),
    intent.material,
    intent.gender,
    intent.budget != null ? `Under ₹${Math.round(intent.budget).toLocaleString("en-IN")}` : null
  ].filter(Boolean);

  const outfit = data.outfitPlan || data.results?.[0]?.outfitPlan;
  const style = data.stylePlan || data.results?.[0]?.stylePlan;
  const outfitItems = outfit?.items || [];
  const styleAdditions = style?.additions || [];

  container.innerHTML = `
    <section class="ai-v2-panel">
      <div class="ai-v2-panel-head">
        <div>
          <span class="eyebrow">AI REASONING</span>
          <h3>I understood your request</h3>
        </div>
        <span class="ai-v2-model">Semantic model · constraint ranker</span>
      </div>
      <div class="ai-v2-query">“${aiEscape(intent.query || "")}”</div>
      <div class="ai-v2-chips">${chips.map(chip => `<span>${aiEscape(chip)}</span>`).join("")}</div>
      ${outfit ? `
        <div class="ai-v2-outfit">
          <div class="ai-v2-outfit-head">
            <div><span class="eyebrow">AI STYLED LOOK</span><h4>${aiEscape(outfit.title)}</h4></div>
            <strong>${aiPrice(outfit.total)}</strong>
          </div>
          <div class="ai-v2-outfit-items">
            ${outfitItems.map(product => `<div><span>${aiEscape(product.category || "Piece")}</span><strong>${aiEscape(product.name || "Fashion item")}</strong><small>${aiPrice(product.price)}</small></div>`).join("")}
          </div>
          <div class="ai-v2-reasons">${(outfit.reasons || []).map(reason => `<span>✦ ${aiEscape(reason)}</span>`).join("")}</div>
        </div>
      ` : style && styleAdditions.length ? `
        <div class="ai-v2-style-plan">
          <div><span class="eyebrow">HOW TO STYLE IT</span><h4>Build the look around your top match</h4></div>
          <div class="ai-v2-style-items"><strong>${aiEscape(style.anchor?.name || "Top match")}</strong>${styleAdditions.map(product => `<span>＋ ${aiEscape(product.name || "Piece")}</span>`).join("")}</div>
          <p>${aiEscape(style.reason)}</p>
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
    results.innerHTML = `<div class="no-results"><h3>No strong AI matches</h3><p>Try changing one part of the request and search again.</p></div>`;
    return;
  }
  results.innerHTML = `<div class="ai-v2-results-grid">${aiExperienceResults.map(aiCard).join("")}</div>`;
}

function showAISearchLoading() {
  const results = document.getElementById("results");
  const insight = ensureAIInsight();
  if (insight) insight.innerHTML = `<section class="ai-v2-panel ai-v2-loading"><span class="eyebrow">AI REASONING</span><h3>Understanding your style request…</h3><p>Extracting intent, constraints and compatible pieces.</p></section>`;
  if (results) results.innerHTML = `<div class="no-results"><div class="loading-spinner"></div><h3>AI is searching the catalogue</h3><p>Semantic retrieval and constraint-aware ranking are running.</p></div>`;
}

async function runAIV2Search(query) {
  const cleanQuery = String(query || "").trim();
  const input = document.getElementById("searchInput");
  if (!cleanQuery) return;
  if (input) input.value = cleanQuery;
  showAISearchLoading();
  const started = performance.now();

  try {
    const response = await fetch(`${AI_API}/api/ai-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: cleanQuery, limit: 12 })
    });
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    const data = await response.json();
    const elapsed = Math.round(performance.now() - started);
    renderAIInsight(data);
    renderAISearchResults(data);
    const summary = document.getElementById("searchSummary");
    const count = document.getElementById("resultCount");
    if (summary) summary.textContent = `${data.results?.length || 0} AI-ranked matches · ${elapsed} ms`;
    if (count) count.textContent = `${data.results?.length || 0} AI results`;
    document.getElementById("aiSearchInsight")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    const summary = document.getElementById("searchSummary");
    if (summary) summary.textContent = "AI search unavailable. Please try again.";
    const results = document.getElementById("results");
    if (results) results.innerHTML = `<div class="no-results"><h3>AI search could not complete</h3><p>${aiEscape(error.message)}</p></div>`;
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
    if (event.key !== "Enter") return;
    if (event.target?.id !== "searchInput") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    runAIV2Search(event.target.value);
  }, true);
}

function initializeAIV2Experience() {
  interceptAIInteractions();
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.setAttribute("aria-describedby", "aiSearchInsight");
}

document.addEventListener("DOMContentLoaded", initializeAIV2Experience);
