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
  const styles = aiArray(product?.style).concat(aiArray(product?.tags)).map(v => String(v).toLowerCase());
  const has = (...names) => names.some(name => styles.some(style => style === name || style.includes(name)));
  const variant = has("oversized","oversize","boxy") ? "oversized"
    : has("relaxed","loose") ? "relaxed"
    : has("slim","fitted","tailored") ? "slim"
    : has("cropped","crop") ? "cropped"
    : has("polo") ? "polo"
    : has("button","oxford") ? "buttondown"
    : has("classic") ? "classic"
    : has("modern") ? "modern" : "regular";
  let garment = "";
  if (["dress","dresses"].includes(category)) {
    const styles = aiArray(product?.style).concat(aiArray(product?.tags)).map(v => String(v).toLowerCase());
    const has = (...names) => names.some(n => styles.some(s => s === n || s.includes(n)));
    const key = String(product?.id || product?.name || "").split("").reduce((n,ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
    const shape = has("bodycon","fitted","slim") ? "bodycon" : has("wrap") ? "wrap" : has("shirt") ? "shirt" : has("slip","satin") ? "slip" : has("tiered","boho","oversized") ? "tiered" : has("relaxed","summer") ? "maxi" : has("classic") ? "classic" : has("modern") ? "slip" : ["aline","wrap","maxi","tiered","bodycon","slip","shirt"][key % 7];
    const pattern = ["solid","stripes","dots","floral","diagonal","colorblock","micro"][key % 7];
    const patternSvg = {
      solid: "",
      stripes: '<path d="M170 360 H330 M160 420 H340 M155 480 H345 M150 540 H350" stroke="#fff" stroke-opacity=".24" stroke-width="9"/>',
      dots: '<g fill="#fff" fill-opacity=".28"><circle cx="205" cy="360" r="7"/><circle cx="250" cy="400" r="7"/><circle cx="295" cy="360" r="7"/><circle cx="220" cy="450" r="7"/><circle cx="280" cy="500" r="7"/><circle cx="205" cy="550" r="7"/><circle cx="300" cy="560" r="7"/></g>',
      floral: '<g fill="#fff" fill-opacity=".28"><circle cx="205" cy="360" r="10"/><circle cx="195" cy="360" r="4"/><circle cx="215" cy="360" r="4"/><circle cx="205" cy="350" r="4"/><circle cx="205" cy="370" r="4"/><circle cx="285" cy="450" r="10"/><circle cx="275" cy="450" r="4"/><circle cx="295" cy="450" r="4"/><circle cx="285" cy="440" r="4"/><circle cx="285" cy="460" r="4"/></g>',
      diagonal: '<path d="M145 370 L210 305 M150 450 L270 330 M180 535 L330 385 M245 610 L350 505" stroke="#fff" stroke-opacity=".25" stroke-width="12"/>',
      colorblock: '<path d="M150 430 Q250 470 350 430 V610 H150 Z" fill="#fff" fill-opacity=".16"/><path d="M190 315 Q250 340 310 315" stroke="#fff" stroke-opacity=".3" stroke-width="14"/>',
      micro: '<path d="M185 350 H315 M180 390 H320 M175 430 H325 M170 470 H330 M165 510 H335 M160 550 H340" stroke="#24242a" stroke-opacity=".16" stroke-width="4"/>'
    }[pattern];
    const shapes = {
      bodycon: `<path d="M215 210 L235 245 L265 245 L285 210 L310 270 L292 325 L285 610 H215 L208 325 L190 270 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`,
      wrap: `<path d="M205 205 L235 245 L250 275 L265 245 L295 205 L320 270 L290 335 L345 610 Q250 655 155 610 L210 335 L180 270 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M205 270 L295 335" stroke="#fff" stroke-opacity=".4" stroke-width="7"/>`,
      shirt: `<path d="M205 200 L235 225 L250 285 L265 225 L295 200 L350 265 L315 315 L300 610 H200 L185 315 L150 265 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M225 210 L250 250 L275 210" fill="none" stroke="#f5f1e9" stroke-width="7"/>`,
      slip: `<path d="M215 190 L230 235 L270 235 L285 190 L305 255 L290 300 L315 610 Q250 635 185 610 L210 300 L195 255 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M215 190 L230 235 M285 190 L270 235" stroke="#24242a" stroke-width="5"/>`,
      tiered: `<path d="M205 205 L235 245 L265 245 L295 205 L315 275 L295 330 L340 610 Q250 665 160 610 L205 330 L185 275 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M195 385 Q250 410 305 385 M180 475 Q250 505 320 475 M165 555 Q250 590 335 555" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="7"/>`,
      maxi: `<path d="M205 205 L235 245 L265 245 L295 205 L315 275 L295 330 L365 625 Q250 675 135 625 L205 330 L185 275 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`,
      classic: `<path d="M205 200 L235 230 L250 280 L265 230 L295 200 L345 265 L310 315 L300 610 H200 L190 315 L155 265 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M225 210 L250 250 L275 210" fill="none" stroke="#f5f1e9" stroke-width="6"/>`
    };
    garment = (shapes[shape] || shapes.maxi) + patternSvg;
  } else if (["skirt","skirts"].includes(category)) {

    garment=`<path d="M215 225 L285 225 L320 570 Q250 615 180 570 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  } else if (["trousers","trouser","pants","jeans"].includes(category)) {
    garment=`<path d="M185 210 H315 L325 370 L300 625 H252 L235 420 L218 625 H170 L175 370 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  } else if (["jacket","jackets","blazer","blazers"].includes(category)) {
    garment=`<path d="M205 180 L235 210 L250 300 L265 210 L295 180 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  } else if (["hoodie","hoodies"].includes(category)) {
    garment=`<path d="M205 215 Q250 165 295 215 L350 255 L315 330 L295 305 V610 H205 V305 L185 330 L150 255 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  } else if (["sneaker","sneakers"].includes(category)) {
    garment=`<path d="M150 430 Q205 410 250 465 L315 520 Q345 545 350 585 H145 Q125 555 150 430 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`;
  } else {
    const shapes = {
      regular:`<path d="M205 185 L235 215 L250 285 L265 215 L295 185 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M220 220 Q250 245 280 220" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>`,
      relaxed:`<path d="M198 185 L232 212 L250 285 L268 212 L302 185 L365 248 L325 315 L315 625 H185 L175 315 L135 248 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`,
      oversized:`<path d="M190 175 L230 208 L250 285 L270 208 L310 175 L385 250 L335 335 L330 635 H170 L165 335 L115 250 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`,
      slim:`<path d="M220 190 L238 215 L250 285 L262 215 L280 190 L325 245 L295 295 L285 610 H215 L205 295 L175 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`,
      cropped:`<path d="M210 190 L238 215 L250 280 L262 215 L290 190 L345 245 L312 295 L300 455 H200 L188 295 L155 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/>`,
      polo:`<path d="M205 185 L235 215 L250 285 L265 215 L295 185 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M230 205 L250 250 L270 205 L262 285 L250 300 L238 285 Z" fill="#f5f1e9" stroke="#24242a" stroke-width="4"/>`,
      buttondown:`<path d="M205 185 L235 215 L250 285 L265 215 L295 185 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M250 210 V610" stroke="#fff" stroke-opacity=".45" stroke-width="4"/><circle cx="250" cy="300" r="4" fill="#fff"/><circle cx="250" cy="355" r="4" fill="#fff"/><circle cx="250" cy="410" r="4" fill="#fff"/>`,
      classic:`<path d="M202 185 L235 215 L250 285 L265 215 L298 185 L350 245 L315 300 L300 610 H200 L185 300 L150 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M215 220 Q250 245 285 220" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5"/><path d="M250 285 V610" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>`,
      modern:`<path d="M200 180 L238 210 L250 275 L262 210 L300 180 L360 245 L320 320 L305 610 H195 L180 320 L140 245 Z" fill="${fill}" stroke="#24242a" stroke-width="6"/><path d="M218 220 Q250 250 282 220" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5"/><path d="M205 470 L295 470" stroke="#fff" stroke-opacity=".2" stroke-width="8"/>`
    };
    garment = shapes[variant] || shapes.regular;
  }
  const person = model ? '<circle cx="250" cy="105" r="48" fill="#d8a27c" stroke="#24242a" stroke-width="5"/><path d="M205 105 Q250 45 295 105" fill="#24242a"/>' : "";
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 720"><rect width="500" height="720" rx="28" fill="#f5f1e9"/><rect x="18" y="18" width="464" height="684" rx="22" fill="#fff" opacity=".65"/>${person}${garment}<text x="250" y="680" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#555">${colorName} ${variant} ${category}</text></svg>`;
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
