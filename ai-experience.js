const AI_API = "https://fashion-ai-search-lj6s.onrender.com";
const AI_IMAGE_API = "https://image.pollinations.ai/prompt/";
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

function aiProductImage(product) {
  return product?.image || product?.image_url || product?.imageUrl || product?.img || product?.thumbnail || "";
}

function aiProductPreviewUrl(product) {
  const name = product?.name || "fashion product";
  const exactColor = String(product?.color || "").trim();
  const exactCategory = String(product?.category || "fashion").trim();
  const category = product?.category || "fashion";
  const color = product?.color || "";
  const material = aiArray(product?.material).join(", ");
  const style = aiArray(product?.style).slice(0, 3).join(", ");
  const prompt = ["premium ecommerce product photography","single isolated fashion product, no person, no mannequin, no model","front three-quarter product view, complete item visible, centered composition","clean white studio background, soft realistic shadow, photorealistic fabric and texture","no text, no watermark, no logo, no extra garments",name,category,color && "color " + color,material && "material " + material,style && "style " + style].filter(Boolean).join(", ");
  const seed = String(product?.id ?? name) + "-product";
  return AI_IMAGE_API + encodeURIComponent(prompt) + "?width=768&height=900&model=flux&nologo=true&seed=" + encodeURIComponent(seed);
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

function aiModelUrl(product, query = "") {
  const prompt = aiModelPrompt(product, query);
  const seed = String(product?.id ?? 1);
  return AI_IMAGE_API + encodeURIComponent(prompt) +
    "?width=768&height=1024&model=flux&nologo=true&seed=" + encodeURIComponent(seed);
}

function aiModelFallbackSvg(product) {
  const category = String(product?.category || "fashion").toLowerCase();
  const color = String(product?.color || "Beige").toLowerCase();
  const palette = { black:"#171717", white:"#f5f5f2", blue:"#4778ad", red:"#b83d3d", green:"#47755b", beige:"#c7b395", grey:"#888", gray:"#888", brown:"#765447" };
  const fill = palette[color] || "#8b8175";
  const dress = category.includes("dress") || category.includes("skirt");
  const bottom = category.includes("jean") || category.includes("trouser") || category.includes("pant");
  const shoe = category.includes("sneaker") || category.includes("shoe");
  const garment = shoe
    ? `<path d="M78 770c35-25 92-24 128 0l55 22c18 7 20 28 1 37H65c-21 0-24-28-5-36z" fill="${fill}" stroke="#272522" stroke-width="7"/>`
    : dress
      ? `<path d="M332 275h104l25 145 105 315H202l105-315z" fill="${fill}" stroke="#272522" stroke-width="7"/>`
      : bottom
        ? `<path d="M306 302h156l18 180-18 295h-72l-20-220-20 220h-72l18-295z" fill="${fill}" stroke="#272522" stroke-width="7"/>`
        : `<path d="M315 300h138l57 92-51 52-34-46v243H343V398l-34 46-51-52z" fill="${fill}" stroke="#272522" stroke-width="7"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 1024"><rect width="768" height="1024" fill="#eeeae3"/><circle cx="384" cy="160" r="92" fill="#c99f82"/><path d="M292 153c15-125 172-125 184 0-42-38-137-40-184 0z" fill="#292725"/>${garment}<rect x="80" y="900" width="608" height="2" fill="#cfc9bf"/><text x="384" y="945" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#69635c">AI MODEL VISUAL</text><text x="384" y="978" text-anchor="middle" font-family="Arial" font-size="18" fill="#858078">${aiEscape(category.toUpperCase())} · ${aiEscape(color.toUpperCase())}</text></svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function aiCard(product, query) {
  const id = String(product?.id ?? "");
  const name = product?.name || product?.title || "Fashion item";
  const category = product?.category || "Fashion";
  const color = product?.color || product?.colour || "";
  const price = aiPrice(product?.price);
  const score = aiScore(product);
  const reasons = aiArray(product?.reasons).slice(0, 3);
  const image = aiProductImage(product);
  const productPreview = image || aiProductPreviewUrl(product);
  const hasRealProductImage = Boolean(image);
  const styles = aiArray(product?.style || product?.styles).slice(0, 3);
  const generated = aiModelUrl(product, query);

  return `
    <article class="ai-v3-product-card">
      <div class="ai-v3-product-media ai-v3-dual-media">
        <div class="ai-v3-source-visual">
          <img class="ai-v3-source-image" src="${aiEscape(productPreview)}" alt="${aiEscape(name)}" loading="lazy">
          <div class="ai-v3-source-status">${hasRealProductImage ? "CATALOGUE IMAGE" : "AI PRODUCT PREVIEW"}</div>
          <span class="ai-v3-media-label">PRODUCT</span>
        </div>
        <div class="ai-v3-model-visual">
          <div class="ai-v3-model-loading"><span>✦</span><small>AI MODEL</small></div>
          <img class="ai-v3-model-image" data-ai-src="${aiEscape(generated)}" src="${aiModelFallbackSvg(product)}" alt="AI model wearing ${aiEscape(name)}" loading="lazy"
               onload="this.parentElement.classList.add('loaded')"
               onerror="this.parentElement.classList.add('failed')">
          <span class="ai-v3-media-label">AI MODEL</span>
        </div>
        <span class="ai-v3-score"><span>✦</span> ${score}% AI match</span>
        <button type="button" class="ai-v3-try-button" onclick="openAIModelPreview(${JSON.stringify(generated)}, ${JSON.stringify(name)})">
          <span>✦</span> Full model view
        </button>
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
  const preview = top ? aiModelUrl(top, data.query || intent.query || "") : "";
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
            <img class="ai-v3-hero-model-image" data-ai-src="${aiEscape(preview)}" alt="AI generated model wearing ${aiEscape(top.name || "the selected fashion item")}" loading="lazy">
            <span class="ai-v3-generated-label">AI GENERATED MODEL PREVIEW</span>
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

function openAIModelPreview(url, title) {
  let modal = document.getElementById("aiModelPreviewModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "aiModelPreviewModal";
    modal.className = "ai-v3-modal";
    modal.innerHTML = `
      <div class="ai-v3-modal-backdrop" data-close-ai-preview></div>
      <div class="ai-v3-modal-card" role="dialog" aria-modal="true">
        <button type="button" class="ai-v3-modal-close" aria-label="Close" data-close-ai-preview>×</button>
        <div class="ai-v3-modal-image-wrap">
          <div class="ai-v3-modal-loader"><div class="loading-spinner"></div><span>Generating fashion model preview…</span></div>
          <img id="aiModelPreviewImage" alt="" />
        </div>
        <div class="ai-v3-modal-copy">
          <span class="ai-v3-kicker">AI VISUALIZATION</span>
          <h3 id="aiModelPreviewTitle"></h3>
          <p>AI-generated editorial preview based on the selected product description. This is a visualization, not a photograph of the actual garment.</p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      if (event.target.closest("[data-close-ai-preview]")) modal.classList.remove("open");
    });
  }

  const image = document.getElementById("aiModelPreviewImage");
  const heading = document.getElementById("aiModelPreviewTitle");
  const loader = modal.querySelector(".ai-v3-modal-loader");

  heading.textContent = title || "AI model preview";
  image.style.display = "none";
  loader.style.display = "grid";
  modal.classList.add("open");

  image.onload = () => {
    loader.style.display = "none";
    image.style.display = "block";
  };

  image.onerror = () => {
    loader.innerHTML = "<strong>Preview is temporarily unavailable.</strong><span>Try Generate on model again.</span>";
  };

  image.src = url;
}

function handleAIModelImageError(image) { if (!image || image.dataset.retried === '1') { image?.parentElement?.classList.add('failed'); return; } image.dataset.retried = '1'; const current = image.dataset.aiSrc || image.src; if (!current) { image.parentElement.classList.add('failed'); return; } const retryUrl = current.replace(/([?&])seed=[^&]*/i, '$1seed=' + Math.floor(Math.random() * 999999)); setTimeout(() => { image.src = retryUrl; }, 700); }

function setupAIModelImageLoading() { const images = document.querySelectorAll('img[data-ai-src]'); if (!images.length) return; const load = image => { if (image.dataset.loaded === '1') return; image.dataset.loaded = '1'; image.src = image.dataset.aiSrc; }; if (!('IntersectionObserver' in window)) { images.forEach(load); return; } const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { load(entry.target); observer.unobserve(entry.target); } }); }, { rootMargin: '700px 0px' }); images.forEach(image => observer.observe(image)); }

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

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    const elapsed = Math.round(performance.now() - started);
    data.latencyMs = Number(data.latencyMs || elapsed);

    renderAIInsight(data);
    renderAISearchResults(data);
    setupAIModelImageLoading();

    const summary = document.getElementById("searchSummary");
    const count = document.getElementById("resultCount");

    if (summary) summary.textContent = `${data.results?.length || 0} AI-ranked matches · ${elapsed} ms · ${data.semanticAvailable ? "semantic active" : "hybrid fallback"}`;
    if (count) count.textContent = `${data.results?.length || 0} AI results`;

    document.getElementById("aiSearchInsight")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    const summary = document.getElementById("searchSummary");
    if (summary) summary.textContent = "AI search unavailable. Please try again.";

    const results = document.getElementById("results");
    if (results) {
      results.innerHTML = `<div class="no-results"><h3>AI search could not complete</h3><p>${aiEscape(error.message)}</p><button type="button" class="secondary-button" onclick="runAIV2Search(document.getElementById('searchInput')?.value)">Retry AI search</button></div>`;
    }
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
  const title = document.getElementById("aiStudioLookTitle");
  if (!img) return;
  const prompt = "high-end editorial fashion photograph, adult professional fashion model, full body, minimal monochrome black outfit, modern college street style, realistic fabric, luxury studio, natural proportions, soft directional lighting, neutral background, no text, no watermark";
  img.src = AI_IMAGE_API + encodeURIComponent(prompt) + "?width=768&height=1024&model=flux&nologo=true&seed=2026";
  img.onerror = () => {
    img.style.display = "none";
    const visual = img.closest(".ai-studio-visual");
    if (visual) visual.classList.add("ai-preview-fallback");
  };
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
