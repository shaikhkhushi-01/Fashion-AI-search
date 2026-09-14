function normalize(value) {
  return String(value ?? "").toLowerCase().trim();
}

function number(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function typeOf(product) {
  const category = normalize(product?.category);
  if (/dress|gown/.test(category)) return "onepiece";
  if (/shirt|t-shirt|tshirt|top|blouse/.test(category)) return "top";
  if (/trouser|pant|jean|skirt|short/.test(category)) return "bottom";
  if (/sneaker|shoe|footwear|heel|flat/.test(category)) return "shoe";
  if (/hoodie|blazer|jacket|coat|cardigan|sweatshirt/.test(category)) return "layer";
  return "other";
}

function colourCompatibility(a, b) {
  const first = normalize(a?.color);
  const second = normalize(b?.color);
  if (!first || !second) return 0.5;
  if (first === second) return 1;
  const neutrals = ["black", "white", "grey", "cream", "beige", "brown"];
  if (neutrals.includes(first) && neutrals.includes(second)) return 0.95;
  if ((first === "blue" && neutrals.includes(second)) || (second === "blue" && neutrals.includes(first))) return 0.9;
  return 0.55;
}

function selectBestOutfit(products, intent) {
  if (!intent?.outfit) return null;

  const groups = { onepiece: [], top: [], bottom: [], shoe: [], layer: [] };
  products.slice(0, 40).forEach(product => {
    const type = typeOf(product);
    if (groups[type]) groups[type].push(product);
  });

  const budget = intent.budget;
  let best = null;
  const consider = (items, total, score) => {
    if (budget != null && total > budget) return;
    if (!best || score > best.score) best = { items, total, score };
  };

  if (groups.onepiece.length && groups.shoe.length) {
    groups.onepiece.slice(0, 10).forEach(dress => {
      groups.shoe.slice(0, 10).forEach(shoe => {
        const total = number(dress.price) + number(shoe.price);
        const score = number(dress.score) + number(shoe.score) + colourCompatibility(dress, shoe) * 0.3;
        consider([dress, shoe], total, score);
      });
    });
  } else if (groups.top.length && groups.bottom.length && groups.shoe.length) {
    groups.top.slice(0, 8).forEach(top => {
      groups.bottom.slice(0, 8).forEach(bottom => {
        groups.shoe.slice(0, 8).forEach(shoe => {
          const total = number(top.price) + number(bottom.price) + number(shoe.price);
          const compatibility = (colourCompatibility(top, bottom) + colourCompatibility(top, shoe) + colourCompatibility(bottom, shoe)) / 3;
          const score = number(top.score) + number(bottom.score) + number(shoe.score) + compatibility * 0.4;
          consider([top, bottom, shoe], total, score);
        });
      });
    });
    if (best && groups.layer.length) {
      const layer = groups.layer.find(item => budget == null || best.total + number(item.price) <= budget);
      if (layer) {
        best.items.push(layer);
        best.total += number(layer.price);
      }
    }
  }

  if (!best) return null;

  const reasons = [];
  if (intent.color) reasons.push(`Built around ${intent.color}`);
  if (intent.style?.length) reasons.push(`${intent.style.join(" / ")} aesthetic`);
  if (intent.occasion?.length) reasons.push(`Suitable for ${intent.occasion.join(" / ")}`);
  if (budget != null) reasons.push(`Total stays within ₹${Math.round(budget).toLocaleString("en-IN")}`);
  if (!reasons.length) reasons.push("Pieces selected for visual and category compatibility");

  return {
    title: intent.style?.length ? `${intent.style[0][0].toUpperCase()}${intent.style[0].slice(1)} AI look` : "AI curated look",
    items: best.items,
    total: best.total,
    budget,
    withinBudget: budget == null || best.total <= budget,
    score: Number(Math.min(1, best.score / (best.items.length + 0.4)).toFixed(4)),
    reasons: reasons.slice(0, 4)
  };
}

function buildStylePlan(anchor, products, intent) {
  if (!anchor) return null;

  const anchorType = typeOf(anchor);
  const remaining = products.filter(product => String(product.id) !== String(anchor.id));
  const budget = intent.budget;
  const anchorPrice = number(anchor.price);

  const candidates = remaining
    .filter(product => budget == null || anchorPrice + number(product.price) <= budget)
    .map(product => {
      const type = typeOf(product);
      let score = number(product.score);
      if (type === "shoe" && ["top", "bottom", "onepiece"].includes(anchorType)) score += 0.2;
      if (type === "bottom" && anchorType === "top") score += 0.2;
      if (type === "top" && anchorType === "bottom") score += 0.2;
      if (intent.color && normalize(product.color) === normalize(intent.color)) score += 0.1;
      score += colourCompatibility(anchor, product) * 0.12;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score);

  const additions = [];
  const usedTypes = new Set([anchorType]);
  for (const item of candidates) {
    const type = typeOf(item.product);
    if (usedTypes.has(type) || type === "other") continue;
    additions.push(item.product);
    usedTypes.add(type);
    if (additions.length >= 2) break;
  }

  if (!additions.length) return null;

  const total = anchorPrice + additions.reduce((sum, product) => sum + number(product.price), 0);
  return {
    anchor,
    additions,
    total,
    budget,
    withinBudget: budget == null || total <= budget,
    reason: intent.color ? `Keeps the ${intent.color} direction cohesive` : "Balances colour, category and silhouette"
  };
}

export { selectBestOutfit, buildStylePlan, typeOf };
